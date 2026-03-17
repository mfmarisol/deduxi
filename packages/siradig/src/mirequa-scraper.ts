import type { Page } from "playwright";
import type { MirequaRetencion, MirequaResult } from "./types.js";

/**
 * Scrapes Mis Retenciones (Mirequa) from ARCA.
 *
 * URL: https://mirequa-web.arca.gob.ar
 * Angular SPA with PrimeNG-style combobox and grid.
 *
 * Flow:
 * 1. Navigate to portal, get SSO token for mirequa service
 * 2. Open mirequa-web.arca.gob.ar (auto-authenticated via SSO)
 * 3. Fill form: Impuesto 217 (Ganancias), Tipo "Percepción", Fecha range
 * 4. Click Consultar
 * 5. Parse results grid (12 columns, pagination)
 *
 * Columns in grid:
 * CUIT agente | Impuesto | Régimen | Fecha ret/perc | Nro certificado |
 * Tipo operación | Importe | Nro comprobante | Fecha comprobante |
 * Tipo comprobante | Fecha DJ agente | Código seguridad
 *
 * Key regímenes for Ganancias (impuesto 217):
 * - 594: Percepción compra USD (RG 4815) - 35%
 * - 596: Percepción tarjeta exterior (RG 3450) - 35%
 * - 591-600: All perception regímenes for 35% recovery
 */
export async function fetchMirequaPercepciones(
  page: Page,
  cuit: string,
  fechaDesde: string, // "dd/mm/yyyy"
  fechaHasta: string, // "dd/mm/yyyy"
): Promise<MirequaResult> {
  const debug: string[] = [];
  const userCuit = cuit.replace(/\D/g, "");

  try {
    // ── STEP 1: Navigate to portal and get SSO for mirequa ───────
    debug.push("=== STEP 1: Portal SSO for Mirequa ===");

    if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);
    }

    // Call portal API to get service URL and SSO token
    const ssoResult = await page.evaluate(async (c: string) => {
      try {
        const r1 = await fetch(`/portal/api/servicios/${c}/servicio/mirequa`, { credentials: "include" });
        if (!r1.ok) return { ok: false, err: `Service fetch: ${r1.status}` };
        const d1 = await r1.json();

        const r2 = await fetch(`/portal/api/servicios/${c}/servicio/mirequa/autorizacion`, { credentials: "include" });
        if (!r2.ok) return { ok: false, err: `Auth fetch: ${r2.status}` };
        const d2 = await r2.json();

        return {
          ok: true,
          url: d1?.servicio?.url as string | undefined,
          token: d2?.token as string | undefined,
          sign: d2?.sign as string | undefined,
        };
      } catch (e: any) {
        return { ok: false, err: e.message };
      }
    }, userCuit);

    debug.push(`SSO result: ok=${ssoResult.ok}`);

    // ── STEP 2: Navigate to Mirequa ──────────────────────────────
    debug.push("=== STEP 2: Navigate to Mirequa ===");

    // Mirequa is an SPA that authenticates via the portal cookie
    // Try direct navigation first (works if portal SSO cookie is set)
    await page.goto("https://mirequa-web.arca.gob.ar/inicio", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);
    debug.push(`At: ${page.url()}`);

    // If redirected to login or error, try SSO form POST
    if (!page.url().includes("mirequa")) {
      if (ssoResult.ok && (ssoResult as any).token) {
        const token = (ssoResult as any).token as string;
        const sign = (ssoResult as any).sign as string;
        const svcUrl = ((ssoResult as any).url as string) || "https://mirequa-web.arca.gob.ar";

        await page.goto("about:blank");
        await page.setContent(
          `<html><body><form id="f" method="POST" action="${svcUrl}"><input name="token" value="${token}"><input name="sign" value="${sign}"></form></body></html>`,
        );
        await Promise.all([
          page.evaluate(() => (document.getElementById("f") as HTMLFormElement).submit()),
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 25000 }).catch(() => {}),
        ]);
        await page.waitForTimeout(3000);
        debug.push(`After SSO POST: ${page.url()}`);
      } else {
        debug.push("ERROR: Cannot authenticate with Mirequa");
        return { retenciones: [], totalImporte: 0, debug };
      }
    }

    // ── STEP 3: Fill query form ──────────────────────────────────
    debug.push("=== STEP 3: Fill Mirequa form ===");

    // Wait for the combobox to appear
    await page.waitForSelector('[role="combobox"], input[type="text"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Select Impuesto: 217 - SICORE-IMPTO.A LAS GANANCIAS
    const impuestoInput = await page.$('[role="combobox"]');
    if (impuestoInput) {
      await impuestoInput.click();
      await page.waitForTimeout(500);
      await impuestoInput.fill("217");
      await page.waitForTimeout(1000);

      // Click the first "Impositivas" option for 217
      const option217 = await page.$('[role="option"]:has-text("217 - SICORE")');
      if (option217) {
        await option217.click();
        await page.waitForTimeout(1000);
        debug.push("Selected impuesto 217");
      } else {
        // Fallback: click first option that mentions 217
        await page.evaluate(() => {
          const opts = document.querySelectorAll('[role="option"]');
          for (const opt of opts) {
            if (opt.textContent?.includes("217") && !opt.textContent?.includes("Aduaneras")) {
              (opt as HTMLElement).click();
              break;
            }
          }
        });
        await page.waitForTimeout(1000);
        debug.push("Selected impuesto 217 (fallback)");
      }
    }

    // Select Tipo de operación: Percepción (radio button)
    const percepcionRadio = await page.$('input[type="radio"][value*="ercep"], label:has-text("Percepción") input');
    if (percepcionRadio) {
      await percepcionRadio.click();
      debug.push("Selected Percepción");
    } else {
      // Try clicking the label text
      await page.evaluate(() => {
        const labels = document.querySelectorAll("label, span");
        for (const l of labels) {
          if (l.textContent?.trim() === "Percepción") {
            (l as HTMLElement).click();
            break;
          }
        }
      });
      debug.push("Selected Percepción (fallback)");
    }
    await page.waitForTimeout(500);

    // Set date range
    const dateInputs = await page.$$('input[type="text"][placeholder*="DD"], input[type="text"][placeholder*="fecha"]');
    if (dateInputs.length >= 2) {
      await dateInputs[0].click({ clickCount: 3 });
      await dateInputs[0].fill(fechaDesde);
      await dateInputs[1].click({ clickCount: 3 });
      await dateInputs[1].fill(fechaHasta);
      debug.push(`Set dates: ${fechaDesde} - ${fechaHasta}`);
    } else {
      // Try setting dates via JS
      await page.evaluate(({ desde, hasta }: { desde: string; hasta: string }) => {
        const inputs = document.querySelectorAll('input[type="text"]');
        const dateInputsList: HTMLInputElement[] = [];
        inputs.forEach(inp => {
          const el = inp as HTMLInputElement;
          if (el.placeholder?.includes("DD") || /\d{2}\/\d{2}\/\d{4}/.test(el.value)) {
            dateInputsList.push(el);
          }
        });
        if (dateInputsList.length >= 2) {
          dateInputsList[0].value = desde;
          dateInputsList[0].dispatchEvent(new Event("input", { bubbles: true }));
          dateInputsList[0].dispatchEvent(new Event("change", { bubbles: true }));
          dateInputsList[1].value = hasta;
          dateInputsList[1].dispatchEvent(new Event("input", { bubbles: true }));
          dateInputsList[1].dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, { desde: fechaDesde, hasta: fechaHasta });
      debug.push(`Set dates via JS: ${fechaDesde} - ${fechaHasta}`);
    }

    // Click Consultar
    debug.push("Clicking Consultar...");
    const consultarBtn = await page.$('button:has-text("Consultar")');
    if (consultarBtn) {
      await consultarBtn.click();
    } else {
      await page.evaluate(() => {
        const btns = document.querySelectorAll("button");
        for (const b of btns) {
          if (b.textContent?.includes("Consultar")) {
            b.click();
            break;
          }
        }
      });
    }

    // Wait for results
    await page.waitForTimeout(5000);
    debug.push(`After Consultar: ${page.url()}`);

    // ── STEP 4: Parse results grid ──────────────────────────────
    debug.push("=== STEP 4: Parse results ===");

    const parseResult = await page.evaluate(() => {
      const rows: Record<string, string>[] = [];

      // Look for the data grid (PrimeNG table or regular HTML table)
      const tables = document.querySelectorAll("table");
      for (const table of tables) {
        const headerRow = table.querySelector("thead tr");
        if (!headerRow) continue;

        const headers = Array.from(headerRow.querySelectorAll("th")).map(
          th => th.textContent?.trim().toLowerCase() || ""
        );

        // Verify this is the retenciones table
        if (!headers.some(h => /r[eé]gimen/i.test(h)) && !headers.some(h => /importe/i.test(h))) continue;

        const bodyRows = table.querySelectorAll("tbody tr");
        for (const row of bodyRows) {
          const cells = Array.from(row.querySelectorAll("td")).map(td => td.textContent?.trim() || "");
          if (cells.length < 3 || cells.every(c => !c)) continue;

          const obj: Record<string, string> = {};
          headers.forEach((h, i) => {
            if (i < cells.length) obj[h] = cells[i];
          });
          rows.push(obj);
        }
      }

      // Get total
      const totalEl = document.querySelector('[class*="total"], .importe-total');
      let totalText = "";
      if (!totalEl) {
        // Search in page text for "Importe de retención o percepción total:"
        const bodyText = document.body.innerText;
        const match = bodyText.match(/total[:\s]*\$\s*([\d.,\-]+)/i);
        if (match) totalText = match[1];
      } else {
        totalText = totalEl.textContent?.replace(/[^0-9.,\-]/g, "") || "";
      }

      // Check pagination
      const paginationInfo = document.querySelector('[class*="paginator"], [class*="pagination"]');
      const hasMore = !!paginationInfo?.querySelector('[class*="next"]:not([disabled])');

      return { rows, totalText, hasMore, rowCount: rows.length };
    });

    debug.push(`Parsed ${parseResult.rowCount} rows, total: ${parseResult.totalText}`);

    // ── STEP 5: Handle pagination ────────────────────────────────
    const allRows = [...parseResult.rows];

    if (parseResult.hasMore) {
      let pageNum = 2;
      while (pageNum <= 20) {
        const nextClicked = await page.evaluate(() => {
          const nextBtn = document.querySelector(
            '[class*="next"]:not([disabled]) a, [class*="next"]:not([disabled]) button, .paginate_button.next:not(.disabled)'
          );
          if (nextBtn) {
            (nextBtn as HTMLElement).click();
            return true;
          }
          return false;
        });
        if (!nextClicked) break;

        await page.waitForTimeout(3000);

        const nextPage = await page.evaluate(() => {
          const rows: Record<string, string>[] = [];
          const tables = document.querySelectorAll("table");
          for (const table of tables) {
            const headerRow = table.querySelector("thead tr");
            if (!headerRow) continue;
            const headers = Array.from(headerRow.querySelectorAll("th")).map(
              th => th.textContent?.trim().toLowerCase() || ""
            );
            if (!headers.some(h => /r[eé]gimen/i.test(h))) continue;
            const bodyRows = table.querySelectorAll("tbody tr");
            for (const row of bodyRows) {
              const cells = Array.from(row.querySelectorAll("td")).map(td => td.textContent?.trim() || "");
              if (cells.length < 3 || cells.every(c => !c)) continue;
              const obj: Record<string, string> = {};
              headers.forEach((h, i) => { if (i < cells.length) obj[h] = cells[i]; });
              rows.push(obj);
            }
          }
          return rows;
        });

        if (nextPage.length === 0) break;
        allRows.push(...nextPage);
        debug.push(`Page ${pageNum}: +${nextPage.length} rows`);
        pageNum++;
      }
    }

    // ── Normalize to MirequaRetencion ────────────────────────────
    const retenciones: MirequaRetencion[] = allRows.map(row => {
      const importeStr = (
        row["importe"] || row["imp."] || ""
      ).replace(/[$.]/g, "").replace(",", ".").replace(/\s/g, "");

      return {
        cuitAgente: row["cuit agente de ret. o per."] || row["cuit agente"] || row["cuit"] || "",
        impuesto: parseInt(row["impuesto"] || "0"),
        regimen: parseInt(row["régimen"] || row["regimen"] || "0"),
        fechaRetencion: row["fecha retención o percepción"] || row["fecha retencion o percepcion"] || row["fecha"] || "",
        nroCertificado: row["número de certificado"] || row["numero de certificado"] || row["nro certificado"] || "",
        tipoOperacion: row["tipo de operación"] || row["tipo de operacion"] || row["tipo"] || "",
        importe: parseFloat(importeStr) || 0,
        nroComprobante: row["número de comprobante"] || row["numero de comprobante"] || "",
        fechaComprobante: row["fecha de comprobante"] || "",
        tipoComprobante: row["tipo de comprobante"] || "",
      };
    });

    const totalImporte = retenciones.reduce((sum, r) => sum + r.importe, 0);
    debug.push(`=== TOTAL: ${retenciones.length} retenciones, importe neto: ${totalImporte.toFixed(2)} ===`);

    return { retenciones, totalImporte, debug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { retenciones: [], totalImporte: 0, debug };
  }
}

/**
 * Filters retenciones to only include USD/tarjeta exterior perceptions
 * (regímenes 591-600) for the 35% recovery via SiRADIG.
 */
export function filterPercepciones35(retenciones: MirequaRetencion[]): MirequaRetencion[] {
  return retenciones.filter(r =>
    r.regimen >= 591 && r.regimen <= 600 && r.tipoOperacion === "PERCEPCION"
  );
}
