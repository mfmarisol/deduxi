import type { Page } from "playwright";
import type { ArcaComprobante } from "./types.js";

/**
 * Scrapes comprobantes recibidos from ARCA "Mis Comprobantes" service.
 *
 * WORKING APPROACH (from deduxi-backend that was deployed on Render):
 * 1. Navigate to ARCA portal (reuses authenticated cookies)
 * 2. Call portal REST API: GET /portal/api/servicios/{CUIT}/servicio/mcmp → service info
 * 3. Call portal REST API: GET /portal/api/servicios/{CUIT}/servicio/mcmp/autorizacion → token+sign
 * 4. POST form with token+sign → creates SSO session on fes.afip.gob.ar
 * 5. Navigate to setearContribuyente.do?idContribuyente=0
 * 6. Navigate to comprobantesRecibidos.do
 * 7. Parse DataTables table with pagination
 *
 * Key insight: The autorizacion API call creates the SSO session.
 * Without it, direct navigation returns "Su sesión ha expirado".
 */
export async function fetchComprobantes(
  page: Page,
  cuit: string,
  periodo: string, // "2026-03" format
): Promise<{ comprobantes: ArcaComprobante[]; debug: string[] }> {
  const debug: string[] = [];
  const userCuit = cuit.replace(/\D/g, "");

  try {
    // ── STEP 1: Go to ARCA portal ──────────────────────────────
    debug.push("=== STEP 1: Navigate to portal ===");
    debug.push(`Starting at: ${page.url()}`);

    if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);
    }
    debug.push(`On portal: ${page.url()}`);

    // ── STEP 2: Call portal APIs for token + sign ──────────────
    debug.push("=== STEP 2: Call portal APIs for token+sign ===");

    const apiResult = await page.evaluate(async (c: string) => {
      try {
        const r1 = await fetch(`/portal/api/servicios/${c}/servicio/mcmp`, { credentials: "include" });
        const d1 = await r1.json();
        const r2 = await fetch(`/portal/api/servicios/${c}/servicio/mcmp/autorizacion`, { credentials: "include" });
        const d2 = await r2.json();
        return {
          ok: true,
          url: d1?.servicio?.url as string | undefined,
          token: d2?.token as string | undefined,
          sign: d2?.sign as string | undefined,
          s1: r1.status,
          s2: r2.status,
        };
      } catch (e: any) {
        return { ok: false, err: e.message };
      }
    }, userCuit);

    debug.push(`API result: ok=${apiResult.ok}, hasToken=${!!(apiResult as any).token}, hasSign=${!!(apiResult as any).sign}`);

    if (!apiResult.ok || !(apiResult as any).token || !(apiResult as any).sign) {
      debug.push(`API error: ${(apiResult as any).err || "no token/sign"}`);
      return { comprobantes: [], debug };
    }

    const token = (apiResult as any).token as string;
    const sign = (apiResult as any).sign as string;
    const svcUrl = ((apiResult as any).url as string) || "https://fes.afip.gob.ar/mcmp/jsp/index.do";

    // ── STEP 3: POST token+sign via form ───────────────────────
    debug.push("=== STEP 3: POST token+sign to Mis Comprobantes ===");

    await Promise.all([
      page.evaluate(
        ({ url, t, s }: { url: string; t: string; s: string }) => {
          const f = document.createElement("form");
          f.method = "POST";
          f.action = url;
          f.style.display = "none";
          [
            { n: "token", v: t },
            { n: "sign", v: s },
          ].forEach(({ n, v }) => {
            const i = document.createElement("input");
            i.type = "hidden";
            i.name = n;
            i.value = v;
            f.appendChild(i);
          });
          document.body.appendChild(f);
          f.submit();
        },
        { url: svcUrl, t: token, s: sign },
      ),
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 25000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(2000);
    debug.push(`After POST: ${page.url()}`);

    // If POST didn't navigate (SPA intercepted), try from blank page
    if (page.url().includes("portalcf.cloud.afip.gob.ar")) {
      debug.push("SPA intercepted POST, retrying from blank page...");
      await page.goto("about:blank");
      await page.setContent(
        `<html><body><form id="f" method="POST" action="${svcUrl}"><input name="token" value="${token}"><input name="sign" value="${sign}"></form></body></html>`,
      );
      await Promise.all([
        page.evaluate(() => (document.getElementById("f") as HTMLFormElement).submit()),
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 25000 }).catch(() => {}),
      ]);
      await page.waitForTimeout(2000);
      debug.push(`After blank retry: ${page.url()}`);
    }

    // ── STEP 4: Select contribuyente ───────────────────────────
    debug.push("=== STEP 4: Select contribuyente ===");
    await page.goto("https://fes.afip.gob.ar/mcmp/jsp/setearContribuyente.do?idContribuyente=0", {
      waitUntil: "networkidle",
      timeout: 20000,
    }).catch((e) => debug.push(`Step 4 error: ${e.message}`));
    await page.waitForTimeout(2000);
    debug.push(`After contribuyente: ${page.url()}`);

    // ── STEP 5: Navigate to Comprobantes Recibidos ─────────────
    debug.push("=== STEP 5: Navigate to Comprobantes Recibidos ===");
    if (!page.url().includes("comprobantesRecibidos")) {
      await page.goto("https://fes.afip.gob.ar/mcmp/jsp/comprobantesRecibidos.do", {
        waitUntil: "networkidle",
        timeout: 20000,
      }).catch((e) => debug.push(`Step 5 error: ${e.message}`));
      await page.waitForTimeout(3000);
    }
    debug.push(`At: ${page.url()}`);

    // Check for session expired
    const bodyCheck = await page.evaluate(() => document.body?.innerText?.slice(0, 300) || "");
    if (/sesi[oó]n.*expir/i.test(bodyCheck) || /no est[aá] logueado/i.test(bodyCheck)) {
      debug.push("ERROR: Session expired on Mis Comprobantes");
      debug.push(`Body: ${bodyCheck}`);
      return { comprobantes: [], debug };
    }

    // ── STEP 5b: Set date range before searching ────────────────
    debug.push("=== STEP 5b: Set date filter ===");

    const [year, month] = periodo.split("-").map(Number);
    const firstDay = `01/${String(month).padStart(2, "0")}/${year}`;
    const lastDayNum = new Date(year, month, 0).getDate();
    const lastDay = `${lastDayNum}/${String(month).padStart(2, "0")}/${year}`;
    const dateValue = `${firstDay} - ${lastDay}`;
    debug.push(`Target range: ${dateValue}`);

    // Dump all form elements to find the date input
    const formInfo = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("input, select")).map(el => ({
        tag: el.tagName,
        type: (el as HTMLInputElement).type,
        name: (el as HTMLInputElement).name,
        id: el.id,
        value: (el as HTMLInputElement).value?.substring(0, 50),
        className: el.className.substring(0, 50),
        placeholder: (el as HTMLInputElement).placeholder || "",
      }));
    });
    debug.push(`Form elements: ${JSON.stringify(formInfo)}`);

    // Try to set the date range via daterangepicker or direct input
    const dateSet = await page.evaluate((dateVal: string) => {
      // Strategy 1: Find daterangepicker input by id or name
      const dateInput = document.getElementById("fechaEmision") as HTMLInputElement ||
        document.querySelector('input[name="fechaEmision"]') as HTMLInputElement ||
        document.querySelector('input[name*="fecha"]') as HTMLInputElement;

      if (dateInput) {
        // Set value directly
        dateInput.value = dateVal;
        dateInput.dispatchEvent(new Event("change", { bubbles: true }));
        dateInput.dispatchEvent(new Event("input", { bubbles: true }));

        // Also try jQuery trigger if available
        try {
          const jq = (window as any).jQuery || (window as any).$;
          if (jq) {
            jq(dateInput).val(dateVal).trigger("change").trigger("apply.daterangepicker");
          }
        } catch {}

        return { ok: true, method: "direct", id: dateInput.id, name: dateInput.name };
      }

      // Strategy 2: Find any text input with a date-like value
      const allInputs = Array.from(document.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
      for (const inp of allInputs) {
        if (inp.value && /\d{2}\/\d{2}\/\d{4}/.test(inp.value)) {
          inp.value = dateVal;
          inp.dispatchEvent(new Event("change", { bubbles: true }));
          try {
            const jq = (window as any).jQuery || (window as any).$;
            if (jq) jq(inp).val(dateVal).trigger("change");
          } catch {}
          return { ok: true, method: "found-date-input", id: inp.id, name: inp.name };
        }
      }

      // Strategy 3: Find by class
      const drpInput = document.querySelector(".daterangepicker-input, input.form-control") as HTMLInputElement;
      if (drpInput) {
        drpInput.value = dateVal;
        drpInput.dispatchEvent(new Event("change", { bubbles: true }));
        return { ok: true, method: "class-match", id: drpInput.id };
      }

      return { ok: false, method: "none" };
    }, dateValue);

    debug.push(`Date set result: ${JSON.stringify(dateSet)}`);

    // Click Buscar
    debug.push("Clicking Buscar...");
    await Promise.all([
      page.evaluate(() => {
        const btns = Array.from(
          document.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn, .btn'),
        );
        const b = btns.find((b) => /buscar|consultar/i.test((b as any).textContent || (b as any).value || ""));
        if (b) (b as HTMLElement).click();
      }),
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(3000);
    debug.push(`After Buscar: ${page.url()}`);

    // ── STEP 6: Wait for table and parse ───────────────────────
    debug.push("=== STEP 6: Parse table ===");
    await page.waitForSelector("table", { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(2000);

    // Parse first page
    const firstPage = await parseCurrentPage(page);
    const allRows = [...firstPage.rows];
    debug.push(`Page 1: ${firstPage.rows.length} rows, tables: ${firstPage.tableCount}, headers: [${firstPage.headers.join(", ")}]`);

    // If 0 rows, dump raw table content for debugging
    if (firstPage.rows.length === 0) {
      const tableDebug = await page.evaluate(() => {
        const tables = document.querySelectorAll("table");
        const info: string[] = [];
        tables.forEach((table, idx) => {
          const trs = table.querySelectorAll("tbody tr");
          info.push(`Table ${idx}: ${trs.length} tbody rows`);
          // Show first 3 rows raw content
          Array.from(trs).slice(0, 3).forEach((tr, ri) => {
            const tds = Array.from(tr.querySelectorAll("td")).map(td => td.textContent?.trim() || "");
            info.push(`  Row ${ri}: [${tds.join(" | ")}] (${tds.length} cells)`);
          });
          // Also check if data is in a different structure
          const allTrs = table.querySelectorAll("tr");
          info.push(`  Total trs (incl thead): ${allTrs.length}`);
        });
        // Check DataTables info
        const dtInfo = document.querySelector(".dataTables_info");
        if (dtInfo) info.push(`DataTables info: ${dtInfo.textContent?.trim()}`);
        // Check if "no data" message
        const emptyMsg = document.querySelector(".dataTables_empty, .empty, td.dataTables_empty");
        if (emptyMsg) info.push(`Empty msg: ${emptyMsg.textContent?.trim()}`);
        return info;
      });
      for (const line of tableDebug) {
        debug.push(`[TABLE DEBUG] ${line}`);
      }
    }

    // ── STEP 7: Pagination ─────────────────────────────────────
    if (allRows.length > 0) {
      let pageNum = 2;
      while (pageNum <= 20) {
        const hasNext = await page.evaluate(() => {
          const next = document.querySelector(
            ".paginate_button.next:not(.disabled), .next:not(.disabled) a, a.paginate_button.next:not(.disabled)",
          );
          if (next) {
            (next as HTMLElement).click();
            return true;
          }
          return false;
        });
        if (!hasNext) break;
        await page.waitForTimeout(2000);

        const nextPageData = await parseCurrentPage(page);
        if (nextPageData.rows.length === 0) break;
        allRows.push(...nextPageData.rows);
        debug.push(`Page ${pageNum}: +${nextPageData.rows.length} rows`);
        pageNum++;
      }
    }

    // ── Normalize to ArcaComprobante ───────────────────────────
    const comprobantes: ArcaComprobante[] = allRows.map((c, idx) => ({
      id: `arca-${idx}-${Date.now()}`,
      razonSocial:
        c["denominación emisor"] || c["denominacion emisor"] || c["emisor"] || "Sin datos",
      tipo: c["tipo"] || "",
      nroComprobante: c["número"] || c["numero"] || "",
      fecha: c["fecha"] || "",
      importeTotal: c["imp. total"] || c["imp.total"] || c["importe total"] || "",
    }));

    debug.push(`=== TOTAL: ${comprobantes.length} comprobantes ===`);
    return { comprobantes, debug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { comprobantes: [], debug };
  }
}

/**
 * Parse the current page's DataTables table.
 * Returns rows as key-value objects keyed by lowercase header text.
 */
async function parseCurrentPage(
  page: Page,
): Promise<{ rows: Record<string, string>[]; tableCount: number; headers: string[] }> {
  return page
    .evaluate(() => {
      const results: Record<string, string>[] = [];
      const tables = document.querySelectorAll("table");

      for (const table of tables) {
        const headerRow = table.querySelector("thead tr");
        if (!headerRow) continue;
        const headers = Array.from(headerRow.querySelectorAll("th")).map((c) =>
          c.textContent!.trim().toLowerCase(),
        );

        // Verify this is the comprobantes table
        const hasDate = headers.some((h) => /fecha/i.test(h));
        const hasEmitOrImp = headers.some((h) => /emisor|denominaci|imp|total/i.test(h));
        if (!hasDate || !hasEmitOrImp) continue;

        const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
        for (const row of bodyRows) {
          const cells = Array.from(row.querySelectorAll("td")).map((c) => c.textContent!.trim());
          if (cells.length < 3 || cells.every((c) => !c)) continue;
          if (cells.some((c) => /no se encontraron|sin resultado|no hay dato/i.test(c))) continue;

          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            if (i < cells.length) obj[h] = cells[i];
          });
          results.push(obj);
        }
      }
      return {
        rows: results,
        tableCount: tables.length,
        headers:
          tables.length > 0
            ? Array.from(tables[0].querySelectorAll("thead th")).map((t) => t.textContent!.trim())
            : [],
      };
    })
    .catch(() => ({ rows: [] as Record<string, string>[], tableCount: 0, headers: [] as string[] }));
}
