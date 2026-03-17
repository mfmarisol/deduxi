import type { Page } from "playwright";
import type { SiradigPresentacion, SiradigDeduccion } from "./types.js";

/**
 * Navigates to SiRADIG (F.572 Web) and fetches all presentations and drafts.
 *
 * SiRADIG is accessed through the AFIP portal, similar to Mis Comprobantes:
 * 1. Call portal API to get token+sign for "siradig" service
 * 2. POST form to create SSO session
 * 3. Parse the presentations table
 *
 * SiRADIG service code in portal: "siradig" (Siradig - Trabajador)
 */
export async function fetchSiradigPresentaciones(
  page: Page,
  cuit: string,
): Promise<{ presentaciones: SiradigPresentacion[]; deducciones: SiradigDeduccion[]; debug: string[] }> {
  const debug: string[] = [];
  const userCuit = cuit.replace(/\D/g, "");

  try {
    // ── STEP 1: Navigate to portal ──
    debug.push("=== STEP 1: Navigate to portal ===");
    if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);
    }
    debug.push(`On portal: ${page.url()}`);

    // ── STEP 2: Get token+sign for SiRADIG ──
    debug.push("=== STEP 2: Get SiRADIG token+sign ===");

    // Try known service codes for SiRADIG
    const serviceCodes = ["siradig", "siRADIG", "SIRADIG", "f572web"];
    let apiResult: any = { ok: false };

    for (const code of serviceCodes) {
      apiResult = await page.evaluate(async ({ c, svc }: { c: string; svc: string }) => {
        try {
          const r1 = await fetch(`/portal/api/servicios/${c}/servicio/${svc}`, { credentials: "include" });
          if (!r1.ok) return { ok: false, status: r1.status, code: svc };
          const d1 = await r1.json();
          const r2 = await fetch(`/portal/api/servicios/${c}/servicio/${svc}/autorizacion`, { credentials: "include" });
          if (!r2.ok) return { ok: false, status: r2.status, code: svc };
          const d2 = await r2.json();
          return {
            ok: true,
            url: d1?.servicio?.url,
            token: d2?.token,
            sign: d2?.sign,
            code: svc,
          };
        } catch (e: any) {
          return { ok: false, err: e.message, code: svc };
        }
      }, { c: userCuit, svc: code });

      debug.push(`Tried service '${code}': ok=${apiResult.ok}, status=${apiResult.status || "N/A"}`);
      if (apiResult.ok && apiResult.token) break;
    }

    if (!apiResult.ok || !apiResult.token || !apiResult.sign) {
      debug.push("Could not get SiRADIG token. Trying to find service via portal API listing...");

      // Try to list all available services
      const serviceList = await page.evaluate(async (c: string) => {
        try {
          const r = await fetch(`/portal/api/servicios/${c}`, { credentials: "include" });
          const d = await r.json();
          if (Array.isArray(d)) {
            return d.map((s: any) => ({ id: s.id, nombre: s.nombre, url: s.url })).filter((s: any) =>
              /siradig|572|ddjj|ganancia/i.test(s.nombre || s.id || "")
            );
          }
          return [];
        } catch { return []; }
      }, userCuit);

      debug.push(`SiRADIG-like services found: ${JSON.stringify(serviceList)}`);

      // If we found a match, try it
      if (serviceList.length > 0) {
        const svc = serviceList[0];
        apiResult = await page.evaluate(async ({ c, svcId }: { c: string; svcId: string }) => {
          try {
            const r1 = await fetch(`/portal/api/servicios/${c}/servicio/${svcId}`, { credentials: "include" });
            const d1 = await r1.json();
            const r2 = await fetch(`/portal/api/servicios/${c}/servicio/${svcId}/autorizacion`, { credentials: "include" });
            const d2 = await r2.json();
            return { ok: true, url: d1?.servicio?.url, token: d2?.token, sign: d2?.sign };
          } catch (e: any) { return { ok: false, err: e.message }; }
        }, { c: userCuit, svcId: svc.id });
        debug.push(`Service '${svc.id}' (${svc.nombre}): ok=${apiResult.ok}`);
      }

      if (!apiResult.ok || !apiResult.token) {
        debug.push("ERROR: Cannot access SiRADIG service");
        return { presentaciones: [], deducciones: [], debug };
      }
    }

    const token = apiResult.token as string;
    const sign = apiResult.sign as string;
    const svcUrl = (apiResult.url as string) || "https://siradig.afip.gob.ar/";
    debug.push(`SiRADIG URL: ${svcUrl}`);

    // ── STEP 3: POST token+sign to SiRADIG ──
    debug.push("=== STEP 3: POST to SiRADIG ===");

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
    await page.waitForTimeout(3000);
    debug.push(`After POST: ${page.url()}`);

    // If SPA intercepted, retry from blank
    if (page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("about:blank");
      await page.setContent(
        `<html><body><form id="f" method="POST" action="${svcUrl}"><input name="token" value="${token}"><input name="sign" value="${sign}"></form></body></html>`,
      );
      await Promise.all([
        page.evaluate(() => (document.getElementById("f") as HTMLFormElement).submit()),
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 25000 }).catch(() => {}),
      ]);
      await page.waitForTimeout(3000);
      debug.push(`After blank retry: ${page.url()}`);
    }

    // ── STEP 4: Parse SiRADIG page ──
    debug.push("=== STEP 4: Parse SiRADIG ===");
    debug.push(`Current URL: ${page.url()}`);

    const pageTitle = await page.title();
    debug.push(`Page title: ${pageTitle}`);

    // Dump page structure for debugging
    const pageInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll("table");
      const links = Array.from(document.querySelectorAll("a")).map(a => ({
        text: (a.textContent || "").trim().substring(0, 80),
        href: a.href.substring(0, 120),
      })).filter(l => l.text.length > 0).slice(0, 30);

      const buttons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], .btn")).map(b => ({
        text: ((b as HTMLElement).textContent || (b as HTMLInputElement).value || "").trim().substring(0, 60),
      })).filter(b => b.text.length > 0);

      const bodyText = document.body?.innerText?.substring(0, 2000) || "";

      return { tableCount: tables.length, links, buttons, bodyText };
    });

    debug.push(`Tables: ${pageInfo.tableCount}`);
    debug.push(`Buttons: ${JSON.stringify(pageInfo.buttons)}`);
    debug.push(`Links (first 15): ${JSON.stringify(pageInfo.links.slice(0, 15))}`);
    debug.push(`Body preview: ${pageInfo.bodyText.substring(0, 500)}`);

    // ── STEP 5: Parse presentations table ──
    debug.push("=== STEP 5: Parse presentations ===");

    const presentaciones: SiradigPresentacion[] = [];
    const deducciones: SiradigDeduccion[] = [];

    // SiRADIG typically shows a list of periods with their status
    // Try to parse any table with period/status info
    const tableData = await page.evaluate(() => {
      const results: any[] = [];
      const tables = document.querySelectorAll("table");

      for (const table of tables) {
        const rows = table.querySelectorAll("tbody tr, tr");
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent?.trim() || "");
          if (cells.length >= 2 && cells.some(c => c.length > 0)) {
            results.push(cells);
          }
        }
      }

      // Also look for card/list-based layouts (SiRADIG might use divs, not tables)
      const cards = document.querySelectorAll('[class*="periodo"], [class*="presentacion"], [class*="borrador"], .card, .list-group-item');
      const cardData: string[] = [];
      cards.forEach(card => {
        const text = (card.textContent || "").trim().substring(0, 200);
        if (text.length > 5) cardData.push(text);
      });

      return { tableRows: results, cards: cardData };
    });

    debug.push(`Table rows found: ${tableData.tableRows.length}`);
    if (tableData.tableRows.length > 0) {
      debug.push(`First 5 rows: ${JSON.stringify(tableData.tableRows.slice(0, 5))}`);
    }
    if (tableData.cards.length > 0) {
      debug.push(`Cards found: ${tableData.cards.length}`);
      debug.push(`First 3 cards: ${JSON.stringify(tableData.cards.slice(0, 3))}`);
    }

    // Try to parse rows into presentaciones
    for (const row of tableData.tableRows) {
      // Look for rows with period-like data (month/year patterns)
      const periodMatch = row.join(" ").match(/(\d{2}\/\d{4}|\d{4}-\d{2}|\w+\s+\d{4})/);
      const estadoMatch = row.join(" ").match(/(presentad[ao]|borrador|vigente|anulad[ao]|original|rectificativ[ao])/i);

      if (periodMatch || estadoMatch) {
        presentaciones.push({
          periodo: periodMatch?.[1] || "",
          estado: estadoMatch?.[1] || row[1] || "",
          fechaPresentacion: row.find((c: string) => /\d{2}\/\d{2}\/\d{4}/.test(c)) || "",
          nroTransaccion: row.find((c: string) => /^\d{10,}$/.test(c)) || "",
          tipo: /rectificativ/i.test(row.join(" ")) ? "Rectificativa" : "Original",
        });
      }
    }

    debug.push(`Parsed ${presentaciones.length} presentaciones`);
    debug.push(`=== DONE ===`);

    return { presentaciones, deducciones, debug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { presentaciones: [], deducciones: [], debug };
  }
}
