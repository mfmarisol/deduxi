import type { Page } from "playwright";
import type {
  AportesMensual,
  AportesDetallePeriodo,
  AportesEnLineaResult,
} from "./types.js";

const APORTES_INDEX_URL =
  "https://serviciossegsoc.afip.gob.ar/MisAportes/app/default.aspx";

/**
 * Scrapes Aportes en Línea from ARCA.
 *
 * Flow (confirmed from real site inspection):
 * 1. Navigate to portal, discover "Aportes en Línea" service
 * 2. Get token+sign via portal autorizacion API
 * 3. POST token+sign → lands on index.aspx
 * 4. Click INGRESAR button (input[type="submit"] value="INGRESAR")
 *    → goes DIRECTLY to MuestraFull.aspx (no seleccion.aspx step for single employer)
 * 5. Parse employee/employer header info
 * 6. Parse the two-header-row salary table
 *
 * The periodoDesde/periodoHasta params are kept for API compatibility but the
 * real site shows a fixed 12-month window determined server-side.
 */
export async function fetchAportesEnLinea(
  page: Page,
  cuit: string,
  periodoDesde: string, // "mm/yyyy" — kept for signature compat
  periodoHasta: string, // "mm/yyyy" — kept for signature compat
): Promise<AportesEnLineaResult> {
  const debug: string[] = [];
  const userCuit = cuit.replace(/\D/g, "");

  try {
    // ── STEP 1: Navigate to portal ──────────────────────────────
    debug.push("Step 1: Navigate to portal");
    if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 30_000,
      });
      await page.waitForTimeout(2000);
    }
    debug.push(`Portal URL: ${page.url()}`);

    // ── STEP 2: Discover service + get token+sign ───────────────
    debug.push("Step 2: Discover Aportes en Linea service");

    const discovery = await page.evaluate(async (c: string) => {
      try {
        // ── Strategy A: Try known service IDs directly (like mirequa scraper) ──
        // This avoids fragile name-matching. Try each known ID directly.
        const knownSlugs = [
          "mis_aportes", "misaportes", "misAportes", "ael", "aportesEnLinea",
          "aportesenlinea", "reli", "MisAportes",
        ];
        for (const slug of knownSlugs) {
          try {
            const authResp = await fetch(
              `/portal/api/servicios/${c}/servicio/${slug}/autorizacion`,
              { credentials: "include" },
            );
            if (authResp.ok) {
              const authData = await authResp.json();
              if (authData?.token) {
                return {
                  ok: true as const,
                  serviceId: slug,
                  serviceName: slug,
                  serviceUrl: (authData.url as string) || "",
                  token: authData.token as string,
                  sign: authData.sign as string,
                  allServices: [`Direct hit: ${slug}`],
                };
              }
            }
          } catch {
            // This slug doesn't exist, try next
          }
        }

        // ── Strategy B: Fetch full service list and search by name ──
        const servResp = await fetch(`/portal/api/servicios/${c}`, {
          credentials: "include",
        });
        if (!servResp.ok) return { ok: false as const, err: `Services API ${servResp.status}` };

        const services = await servResp.json();
        if (!Array.isArray(services)) {
          return { ok: false as const, err: `Services not array, type=${typeof services}, keys=${Object.keys(services || {}).join(",")}` };
        }

        // Log the actual structure of the first service so we know the real field names
        const sampleKeys = services.length > 0 ? Object.keys(services[0]).join(", ") : "empty";
        const sampleService = services.length > 0 ? JSON.stringify(services[0]).substring(0, 500) : "none";

        // Search ALL text fields of each service object for aportes-related keywords
        const nameMatch = services.find((s: Record<string, unknown>) => {
          const allText = Object.values(s).map(v => String(v ?? "")).join(" ").toLowerCase();
          return /aportes?\s*(en)?\s*l[ií]nea|mis\s*aportes|aportes.*l[ií]nea/i.test(allText);
        });

        // Also try matching by URL-like fields containing "MisAportes"
        const urlMatch = !nameMatch
          ? services.find((s: Record<string, unknown>) => {
              const allText = Object.values(s).map(v => String(v ?? "")).join(" ");
              return /misaportes|aportesenlinea|AportesEnLinea/i.test(allText);
            })
          : null;

        const match = nameMatch ?? urlMatch;

        // Build service list showing ALL fields for debugging
        const allServices = [
          `KEYS: ${sampleKeys}`,
          `SAMPLE: ${sampleService}`,
          ...services.map((s: Record<string, unknown>) => {
            const vals = Object.values(s).map(v => String(v ?? "").substring(0, 60));
            return vals.join(" | ");
          }).slice(0, 30),
        ];

        if (!match) {
          return { ok: false as const, allServices, err: "Aportes en Linea service not found" };
        }

        // Find the service ID — ARCA portal uses "serviceName" as the slug
        const serviceId = (match.serviceName ?? match.id ?? match.codigo ?? match.servicio ?? match.code ?? match.slug) as string;
        const serviceName = (match.buttontext ?? match.nombre ?? match.descripcion ?? match.name ?? match.label ?? serviceId) as string;
        const serviceUrl = (match.url ?? match.urlAcceso ?? match.urlServicio ?? match.link ?? "") as string;

        // Get token+sign
        const authResp = await fetch(
          `/portal/api/servicios/${c}/servicio/${serviceId}/autorizacion`,
          { credentials: "include" },
        );
        if (!authResp.ok) {
          return { ok: false as const, serviceId, serviceName, allServices, err: `Auth API ${authResp.status}` };
        }
        const authData = await authResp.json();
        if (!authData?.token) {
          return { ok: false as const, serviceId, serviceName, allServices, err: "No token in auth response" };
        }

        return {
          ok: true as const,
          serviceId,
          serviceName,
          serviceUrl: serviceUrl || (authData.url as string) || "",
          token: authData.token as string,
          sign: authData.sign as string,
          allServices,
        };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false as const, err: msg };
      }
    }, userCuit);

    debug.push(`Service: id=${discovery.serviceId ?? "none"}, name=${discovery.serviceName ?? "none"}`);
    if (discovery.allServices) {
      debug.push(`Services found: ${discovery.allServices.length}`);
      for (const svc of discovery.allServices.slice(0, 10)) {
        debug.push(`  SVC: ${svc}`);
      }
    }

    if (!discovery.ok || !discovery.token) {
      debug.push(`ERROR: ${discovery.err}`);
      return { empleador: "", cuitEmpleador: "", empleadoNombre: "", periodos: [], debug };
    }

    // ── STEP 3: POST token+sign to create SSO session ───────────
    debug.push("Step 3: POST token+sign");
    const svcUrl = discovery.serviceUrl || APORTES_INDEX_URL;
    debug.push(`Target URL: ${svcUrl}`);

    // POST from blank page (proven reliable from comprobantes scraper)
    await page.goto("about:blank");
    await page.setContent(
      `<html><body>
        <form id="ssoForm" method="POST" action="${svcUrl}">
          <input name="token" value="${discovery.token}">
          <input name="sign" value="${discovery.sign}">
        </form>
      </body></html>`,
    );
    await Promise.all([
      page.evaluate(() =>
        (document.getElementById("ssoForm") as HTMLFormElement).submit(),
      ),
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 25_000 }).catch(() => {}),
    ]);
    await page.waitForTimeout(3000);
    debug.push(`After POST: ${page.url()}`);

    // If we hit ErrorPage, get a fresh token and retry
    if (page.url().includes("ErrorPage")) {
      debug.push("Hit ErrorPage, getting fresh token and retrying...");
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 15_000,
      });
      await page.waitForTimeout(2000);
      // Get fresh token
      const freshAuth = await page.evaluate(async (c: string) => {
        try {
          const resp = await fetch(
            `/portal/api/servicios/${c}/servicio/mis_aportes/autorizacion`,
            { credentials: "include" },
          );
          if (!resp.ok) return null;
          const d = await resp.json();
          return d?.token ? { token: d.token as string, sign: d.sign as string, url: (d.url || "") as string } : null;
        } catch { return null; }
      }, userCuit);

      if (freshAuth) {
        debug.push("Got fresh token, retrying POST");
        const retryUrl = freshAuth.url || svcUrl;
        await page.goto("about:blank");
        await page.setContent(
          `<html><body>
            <form id="ssoForm" method="POST" action="${retryUrl}">
              <input name="token" value="${freshAuth.token}">
              <input name="sign" value="${freshAuth.sign}">
            </form>
          </body></html>`,
        );
        await Promise.all([
          page.evaluate(() =>
            (document.getElementById("ssoForm") as HTMLFormElement).submit(),
          ),
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 25_000 }).catch(() => {}),
        ]);
        await page.waitForTimeout(3000);
        debug.push(`After retry POST: ${page.url()}`);
      }
    }

    // Fallback: POST from portal if blank page didn't navigate
    if (page.url() === "about:blank" || page.url().startsWith("about:")) {
      debug.push("Blank-page POST failed, retrying from portal");
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 15_000,
      });
      await page.waitForTimeout(1000);
      await Promise.all([
        page.evaluate(
          ({ url, t, s }: { url: string; t: string; s: string }) => {
            const f = document.createElement("form");
            f.method = "POST";
            f.action = url;
            f.style.display = "none";
            for (const { n, v } of [{ n: "token", v: t }, { n: "sign", v: s }]) {
              const i = document.createElement("input");
              i.type = "hidden";
              i.name = n;
              i.value = v;
              f.appendChild(i);
            }
            document.body.appendChild(f);
            f.submit();
          },
          { url: svcUrl, t: discovery.token, s: discovery.sign },
        ),
        page.waitForNavigation({ waitUntil: "networkidle", timeout: 25_000 }).catch(() => {}),
      ]);
      await page.waitForTimeout(3000);
      debug.push(`After portal POST: ${page.url()}`);
    }

    // ── STEP 4: Click INGRESAR → goes to MuestraFull.aspx ──────
    debug.push("Step 4: Click INGRESAR");

    // Log page content after SSO POST to understand what we're looking at
    const postBody = await page.evaluate(() => document.body?.innerText?.substring(0, 800) || "");
    debug.push(`Post-SSO body: ${postBody.substring(0, 400)}`);

    // Try to find and click INGRESAR button on any page after SSO POST.
    // The SSO POST may land on index.aspx, default.aspx, or any variant.
    const currentUrl = page.url();
    debug.push(`Current URL: ${currentUrl}`);

    // If already on MuestraFull, skip this step
    if (!currentUrl.includes("MuestraFull")) {
      // Look for INGRESAR button (any page)
      const hasIngresar = await page.evaluate(() => {
        const all = [
          ...Array.from(document.querySelectorAll('input[type="submit"]')),
          ...Array.from(document.querySelectorAll("button")),
          ...Array.from(document.querySelectorAll("a")),
        ];
        return all.some((el) => {
          const text = (
            (el as HTMLInputElement).value ??
            el.textContent ??
            ""
          ).toUpperCase().trim();
          return text.includes("INGRESAR");
        });
      });
      debug.push(`INGRESAR button found: ${hasIngresar}`);

      if (hasIngresar) {
        await Promise.all([
          page.evaluate(() => {
            const all = [
              ...Array.from(document.querySelectorAll('input[type="submit"]')),
              ...Array.from(document.querySelectorAll("button")),
              ...Array.from(document.querySelectorAll("a")),
            ];
            const btn = all.find((el) => {
              const text = (
                (el as HTMLInputElement).value ??
                el.textContent ??
                ""
              ).toUpperCase().trim();
              return text.includes("INGRESAR");
            });
            if (btn) (btn as HTMLElement).click();
          }),
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 15_000 }).catch(() => {}),
        ]);
        await page.waitForTimeout(3000);

        // Wait for MuestraFull if not there yet
        if (!page.url().includes("MuestraFull")) {
          try {
            await page.waitForURL(/MuestraFull|seleccion/i, { timeout: 10_000 });
          } catch {
            await page.waitForTimeout(3000);
          }
        }
        debug.push(`After INGRESAR: ${page.url()}`);
      } else {
        debug.push("No INGRESAR button found — may already be past index page");
        // Log all buttons/links for debugging
        const pageElements = await page.evaluate(() => {
          const items: string[] = [];
          document.querySelectorAll("input[type='submit'], button, a").forEach(el => {
            const text = ((el as HTMLInputElement).value ?? el.textContent ?? "").trim().substring(0, 60);
            if (text) items.push(`${el.tagName}: ${text}`);
          });
          return items.slice(0, 20);
        });
        debug.push(`Page elements: ${pageElements.join(" | ")}`);
      }
    }

    // If we're on seleccion.aspx, we MUST fill the form — navigating directly to
    // MuestraFull kills the session (redirects to FinSession.aspx).
    if (page.url().includes("seleccion") && !page.url().includes("MuestraFull")) {
      debug.push("On seleccion.aspx — filling period form (REQUIRED by server)");

      // Log ALL form elements AND links with __doPostBack (ASP.NET LinkButtons)
      const formElements = await page.evaluate(() => {
        const els: { tag: string; type: string; name: string; id: string; text?: string; href?: string }[] = [];
        document.querySelectorAll("input, select, button").forEach(el => {
          els.push({
            tag: el.tagName,
            type: (el as HTMLInputElement).type || "",
            name: (el as HTMLInputElement).name || "",
            id: el.id || "",
          });
        });
        // Also capture <a> tags — ASP.NET LinkButtons render as <a href="javascript:__doPostBack(...)">
        document.querySelectorAll("a").forEach(a => {
          const href = (a as HTMLAnchorElement).href || "";
          const text = (a.textContent || "").trim().substring(0, 40);
          if (href.includes("__doPostBack") || /consult|buscar|enviar|aceptar/i.test(text)) {
            els.push({
              tag: "A",
              type: "link",
              name: "",
              id: a.id || "",
              text,
              href: href.substring(0, 120),
            });
          }
        });
        return els;
      });
      debug.push(`Form elements (${formElements.length}): ${JSON.stringify(formElements).substring(0, 2000)}`);

      // Fill period fields using EXACT ASP.NET field names from debug logs:
      //   ctl00$ContentPlaceHolder1$InputPeriodoDesde$txtMes
      //   ctl00$ContentPlaceHolder1$InputPeriodoDesde$txtAño
      //   ctl00$ContentPlaceHolder1$InputPeriodoHasta$txtMes
      //   ctl00$ContentPlaceHolder1$InputPeriodoHasta$txtAño
      const now = new Date();
      // ARCA counts months INCLUSIVELY: 02/2025 to 02/2026 = 13 months (too many).
      // Max allowed = 12 months inclusive. So "desde" must be exactly 11 months
      // before "hasta". Example: 03/2025 to 02/2026 = 12 months inclusive = OK.
      // "hasta" = previous month (current month usually has no data yet)
      const hasta = new Date(now.getFullYear(), now.getMonth() - 1, 1); // prev month
      const desde = new Date(hasta.getFullYear() - 1, hasta.getMonth() + 1, 1); // 11 months before
      const hM = String(hasta.getMonth() + 1).padStart(2, "0");
      const hY = String(hasta.getFullYear());
      const dM = String(desde.getMonth() + 1).padStart(2, "0");
      const dY = String(desde.getFullYear());
      debug.push(`Period range: ${dM}/${dY} to ${hM}/${hY}`);

      // Fill fields using triple-click + type (simulates real user input).
      // ASP.NET has client-side validators (vldGroupPeriodos) that block submit
      // if values are invalid. page.fill() and el.value= don't trigger validators.
      const fieldIds: [string, string][] = [
        ['#ctl00_ContentPlaceHolder1_InputPeriodoDesde_txtMes', dM],
        ['#ctl00_ContentPlaceHolder1_InputPeriodoDesde_txtAño', dY],
        ['#ctl00_ContentPlaceHolder1_InputPeriodoHasta_txtMes', hM],
        ['#ctl00_ContentPlaceHolder1_InputPeriodoHasta_txtAño', hY],
      ];
      for (const [selector, value] of fieldIds) {
        try {
          // Triple-click to select all, then type to replace — most reliable
          await page.click(selector, { clickCount: 3 });
          await page.waitForTimeout(100);
          await page.keyboard.type(value, { delay: 50 });
          await page.waitForTimeout(100);
        } catch {
          debug.push(`WARN: Could not fill ${selector}`);
        }
      }

      // Verify values
      const fieldValues = await page.evaluate(() => {
        const r: Record<string, string> = {};
        document.querySelectorAll('input[type="text"]').forEach(el => {
          const inp = el as HTMLInputElement;
          if (inp.name) r[inp.name.split('$').pop() || inp.name] = inp.value;
        });
        return r;
      });
      debug.push(`Field values before submit: ${JSON.stringify(fieldValues)}`);

      // Click CONTINUAR and wait for navigation to MuestraFull
      const continuar = '#ctl00_ContentPlaceHolder1_BtnContinuar';
      debug.push("Clicking CONTINUAR button...");
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 30_000 }).catch(() => {}),
        page.click(continuar),
      ]);
      // Extra wait for ASP.NET server processing
      await page.waitForTimeout(5000);
      debug.push(`After CONTINUAR: ${page.url()}`);

      // If still on seleccion, check for validation errors
      if (page.url().includes("seleccion") && !page.url().includes("MuestraFull")) {
        const validationErrors = await page.evaluate(() => {
          const summary = document.querySelector('#ctl00_ContentPlaceHolder1_ValidationSummary1');
          const errorText = summary ? summary.textContent?.trim() : '';
          const bodySnippet = document.body.innerText.substring(0, 500);
          // Check field values after postback
          const fields: Record<string, string> = {};
          document.querySelectorAll('input[type="text"]').forEach(el => {
            const inp = el as HTMLInputElement;
            if (inp.name) fields[inp.name] = inp.value;
          });
          return { errorText, fields, bodySnippet };
        });
        debug.push(`Validation errors: "${validationErrors.errorText}"`);
        debug.push(`Fields after submit: ${JSON.stringify(validationErrors.fields)}`);
      }

      // Check if we landed on MuestraFull
      if (page.url().includes("MuestraFull")) {
        debug.push("SUCCESS: Reached MuestraFull via seleccion form");
      } else if (page.url().includes("movil") || page.url().includes("alta")) {
        debug.push("WARNING: Redirected to movil/alta — form may have submitted empty");
        // Try going back to seleccion and using __doPostBack directly
        await page.goBack({ waitUntil: "networkidle" }).catch(() => {});
        await page.waitForTimeout(2000);
      } else {
        debug.push(`WARNING: Not on MuestraFull after submit: ${page.url()}`);
      }
    } else if (!page.url().includes("MuestraFull")) {
      debug.push(`Not on seleccion or MuestraFull: ${page.url()}`);
    }

    // ── STEP 5: Parse employee/employer header ──────────────────
    debug.push("Step 5: Parse MuestraFull page");

    const parseResult = await page.evaluate(() => {
      const result: {
        empleador: string;
        cuitEmpleador: string;
        empleadoNombre: string;
        empleadoCuil: string;
        periodos: Array<{
          periodo: string;
          remuneracionBruta: number;
          incluyeSAC: boolean;
          aportesSegSocialDeclarado: number;
          aportesSegSocialDepositado: number;
          aportesObraSocialDeclarado: number;
          aportesObraSocialDepositado: number;
          obraSocialDestino: string;
          contribucionPatronal: string;
        }>;
        bodyPreview: string;
        debug: string[];
      } = {
        empleador: "",
        cuitEmpleador: "",
        empleadoNombre: "",
        empleadoCuil: "",
        periodos: [],
        bodyPreview: "",
        debug: [],
      };

      const bodyText = document.body?.innerText ?? "";
      result.bodyPreview = bodyText.substring(0, 1500);

      // ── Parse header info ──
      // Format: "Apellido y Nombre: XXXXX"
      const nombreMatch = bodyText.match(/Apellido\s+y\s+Nombre:\s*(.+?)(?:\r?\n|$)/i);
      if (nombreMatch) result.empleadoNombre = nombreMatch[1].trim();

      // "CUIL: XX-XXXXXXXX-X"
      const cuilMatch = bodyText.match(/CUIL:\s*([\d-]+)/i);
      if (cuilMatch) result.empleadoCuil = cuilMatch[1].trim();

      // "Empleador: XXXXX"
      const empMatch = bodyText.match(/Empleador:\s*(.+?)(?:\r?\n|CUIT|$)/i);
      if (empMatch) result.empleador = empMatch[1].trim();

      // "CUIT: XX-XXXXXXXX-X" (employer CUIT, appears after "Empleador")
      // There may be two CUITs (employee CUIL and employer CUIT), get the one
      // after "Empleador" or from hidden inputs.
      const cuitMatches = bodyText.matchAll(/CUIT:\s*([\d-]+)/gi);
      for (const m of cuitMatches) {
        result.cuitEmpleador = m[1].trim();
      }

      // Fallback: hidden inputs may contain the employer CUIT
      if (!result.cuitEmpleador) {
        const hiddenInputs = Array.from(
          document.querySelectorAll('input[type="hidden"]'),
        ) as HTMLInputElement[];
        for (const inp of hiddenInputs) {
          const val = inp.value.replace(/\D/g, "");
          if (val.length === 11 && /^(30|33|34)\d+/.test(val)) {
            // Employer CUITs typically start with 30, 33, 34
            result.cuitEmpleador = val;
            break;
          }
        }
      }

      // ── Parse the salary table ──
      // Table has 2 header rows:
      //   Row 0: Periodo | Remuneracion total bruta | Aportes de seg social | Aportes obra social | Contribucion patronal
      //   Row 1: (under seg social) Declarado | Depositado | (under obra social) Declarado | Depositado | Obra social destino
      // Data rows: period | bruta | segSoc declarado | segSoc depositado | obraSoc declarado | obraSoc depositado | obra social name | pago status

      const parseNum = (s: string): number => {
        // Strip everything except digits, dots, commas, minus
        // Handles: "$ 2.500.000,00", "(*) 1.234,56", "AR$ 100.000"
        const cleaned = s.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
        const n = parseFloat(cleaned);
        return Number.isFinite(n) ? n : 0;
      };

      const tables = document.querySelectorAll("table");
      result.debug.push(`Found ${tables.length} tables on page`);
      for (let tIdx = 0; tIdx < tables.length; tIdx++) {
        const table = tables[tIdx];
        const allRows = Array.from(table.querySelectorAll("tr"));
        result.debug.push(`Table[${tIdx}]: ${allRows.length} rows, first row text: "${(allRows[0]?.textContent ?? "").trim().substring(0, 100)}"`);
        if (allRows.length < 3) continue; // Need at least 2 header rows + 1 data row

        // Identify the table by header content
        const headerText = allRows
          .slice(0, 2)
          .map((r) => r.textContent ?? "")
          .join(" ");
        const isPeriodTable =
          /per[ií]odo/i.test(headerText) &&
          /remunerac/i.test(headerText) &&
          /aporte/i.test(headerText);
        if (!isPeriodTable) {
          result.debug.push(`Table[${tIdx}]: not period table (header: "${headerText.trim().substring(0, 120)}")`);
          continue;
        }
        result.debug.push(`Table[${tIdx}]: ✓ PERIOD TABLE FOUND`);

        // Determine where data rows start (skip the 2 header rows)
        let dataStart = 2;
        // Safety: if row 2 still looks like a header, skip it
        if (allRows.length > 2) {
          const row2Text = (allRows[2].textContent ?? "").toLowerCase();
          if (/declarado|depositado/i.test(row2Text) && !/\d{2}\/\d{4}/.test(row2Text)) {
            dataStart = 3;
          }
        }
        result.debug.push(`Data starts at row ${dataStart}, total rows: ${allRows.length}`);

        for (let i = dataStart; i < allRows.length; i++) {
          // IMPORTANT: ARCA uses BOTH <th> and <td> in data rows
          // The period is often in a <th>, salary data in <td>s
          const allCells = Array.from(allRows[i].querySelectorAll("td, th"));
          const tdCells = Array.from(allRows[i].querySelectorAll("td"));

          // Log first 4 data rows for debugging
          if (i < dataStart + 4) {
            result.debug.push(`Row[${i}]: ${allCells.length} all cells (${tdCells.length} td) → ${allCells.map((c, ci) => `[${ci}:${c.tagName}]="${(c.textContent ?? "").trim().substring(0, 35)}"`).join(", ")}`);
          }

          // Need at least 4 cells to be a valid data row
          if (allCells.length < 4) continue;

          const allTexts = allCells.map((c) => (c.textContent ?? "").trim());
          const fullRowText = allTexts.join(" ");

          // Find period (mm/yyyy) anywhere in the row cells
          let periodo = "";
          for (const txt of allTexts) {
            const m = txt.match(/(\d{2}\/\d{4})/);
            if (m) { periodo = m[1]; break; }
          }
          if (!periodo) continue;

          // Check for SAC marker
          const incluyeSAC = /sueldo anual complementario|\(\*\)|SAC/i.test(fullRowText);

          // Extract all numeric values from the row (skip the period cell)
          // Order in ARCA: remuneración bruta, seg social declarado, seg social depositado,
          //                 obra social declarado, obra social depositado
          const numericValues: number[] = [];
          const nonNumericTexts: string[] = [];
          for (const txt of allTexts) {
            if (/\d{2}\/\d{4}/.test(txt)) continue; // skip period
            if (/sueldo anual|complementario/i.test(txt)) continue; // skip SAC note
            const cleaned = txt.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
            const n = parseFloat(cleaned);
            if (Number.isFinite(n) && n > 0) {
              numericValues.push(n);
            } else if (txt.length > 2 && !/^\s*$/.test(txt)) {
              nonNumericTexts.push(txt);
            }
          }

          if (numericValues.length === 0) continue;

          // Map numeric values by position:
          // [0] = remuneración bruta
          // [1] = seg social declarado, [2] = seg social depositado
          // [3] = obra social declarado, [4] = obra social depositado
          const remuBruta = numericValues[0] ?? 0;
          const segSocDec = numericValues[1] ?? 0;
          const segSocDep = numericValues[2] ?? 0;
          const obraSocDec = numericValues[3] ?? 0;
          const obraSocDep = numericValues[4] ?? 0;

          // Obra social destino and PAGO status from non-numeric texts
          const obraSocialDestino = nonNumericTexts.find(t => /social|coop|salud|osde|swiss|galeno|medic/i.test(t)) || nonNumericTexts[0] || "";
          const pagoStatus = nonNumericTexts.find(t => /pago|impago|parcial|sin info/i.test(t)) || "";

          result.periodos.push({
            periodo,
            remuneracionBruta: remuBruta,
            incluyeSAC,
            aportesSegSocialDeclarado: segSocDec,
            aportesSegSocialDepositado: segSocDep,
            aportesObraSocialDeclarado: obraSocDec,
            aportesObraSocialDepositado: obraSocDep,
            obraSocialDestino,
            contribucionPatronal: pagoStatus.toUpperCase() || "SIN INFORMACIÓN",
          });
        }

        // Found the right table, stop looking
        if (result.periodos.length > 0) {
          result.debug.push(`✓ Parsed ${result.periodos.length} periods successfully`);
          break;
        }
      }

      return result;
    });

    // Merge in-browser debug logs
    if (parseResult.debug?.length > 0) {
      debug.push(...parseResult.debug);
    }
    debug.push(
      `Employer: "${parseResult.empleador}" CUIT: ${parseResult.cuitEmpleador}`,
    );
    debug.push(
      `Employee: "${parseResult.empleadoNombre}" CUIL: ${parseResult.empleadoCuil}`,
    );
    debug.push(`Parsed ${parseResult.periodos.length} periods`);

    if (parseResult.periodos.length === 0) {
      debug.push(`Body preview: ${parseResult.bodyPreview.substring(0, 600)}`);
    } else {
      const first = parseResult.periodos[0];
      const last = parseResult.periodos[parseResult.periodos.length - 1];
      debug.push(
        `Range: ${first.periodo} to ${last.periodo}, latest bruta: ${last.remuneracionBruta}`,
      );
    }

    const periodos: AportesMensual[] = parseResult.periodos.map((p) => ({
      periodo: p.periodo,
      remuneracionBruta: p.remuneracionBruta,
      incluyeSAC: p.incluyeSAC,
      aportesSegSocialDeclarado: p.aportesSegSocialDeclarado,
      aportesSegSocialDepositado: p.aportesSegSocialDepositado,
      aportesObraSocialDeclarado: p.aportesObraSocialDeclarado,
      aportesObraSocialDepositado: p.aportesObraSocialDepositado,
      obraSocialDestino: p.obraSocialDestino,
      contribucionPatronal: p.contribucionPatronal,
    }));

    debug.push(`Done: ${periodos.length} periodos`);
    return {
      empleador: parseResult.empleador,
      cuitEmpleador: parseResult.cuitEmpleador,
      empleadoNombre: parseResult.empleadoNombre,
      periodos,
      debug,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { empleador: "", cuitEmpleador: "", empleadoNombre: "", periodos: [], debug };
  }
}

/**
 * Fetches detailed breakdown for a specific period from Aportes en Linea.
 * Must be called while the session is active (after fetchAportesEnLinea).
 */
export async function fetchAportesDetalle(
  page: Page,
  periodo: string,
): Promise<AportesDetallePeriodo | null> {
  try {
    // Convert "mm/yyyy" to "yyyymm" for the URL param
    let yyyymm = periodo;
    if (periodo.includes("/")) {
      const [mm, yyyy] = periodo.split("/");
      yyyymm = `${yyyy}${mm}`;
    }

    await page.goto(
      `https://serviciossegsoc.afip.gob.ar/MisAportes/app/consulta/DetallePeriodo.aspx?VerPeriodo=${yyyymm}`,
      { waitUntil: "networkidle", timeout: 20_000 },
    );
    await page.waitForTimeout(3000);

    if (!page.url().includes("DetallePeriodo")) return null;

    const result = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      const empMatch = bodyText.match(/Empleador:\s*(.+?)(?:\n|CUIL|CUIT)/i);
      const cuitMatch = bodyText.match(/CUIT:\s*([\d-]+)/);

      const parseNum = (s: string): number => {
        const n = parseFloat(
          s.replace(/\./g, "").replace(",", ".").replace(/[^\d.\-]/g, ""),
        );
        return Number.isFinite(n) ? n : 0;
      };

      const tables = document.querySelectorAll("table");
      const basesImponibles = {
        remuneracionBruta: 0,
        imponibleSegSocial: 0,
        imponibleObraSocial: 0,
      };
      const deducciones: Array<{
        concepto: string;
        declarado: number;
        depositado: number;
        organismoDestino: string;
        observaciones: string;
      }> = [];
      let totalDeclarado = 0;
      let totalDepositado = 0;

      for (const table of tables) {
        const firstRowText = table.querySelector("tr")?.textContent ?? "";

        if (/Bases?\s*imponibles?/i.test(firstRowText)) {
          const rows = table.querySelectorAll("tr");
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll("td"));
            if (cells.length < 2) continue;
            const label = (cells[0]?.textContent ?? "").trim().toLowerCase();
            const value = (cells[1]?.textContent ?? "").trim();
            if (label.includes("total bruta"))
              basesImponibles.remuneracionBruta = parseNum(value);
            if (label.includes("seguridad social"))
              basesImponibles.imponibleSegSocial = parseNum(value);
            if (label.includes("obra social") && label.includes("imponible"))
              basesImponibles.imponibleObraSocial = parseNum(value);
          }
        }

        if (/Deducciones/i.test(firstRowText)) {
          const rows = table.querySelectorAll("tr");
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll("td"));
            if (cells.length < 2) continue;
            const label = (cells[0]?.textContent ?? "").trim();
            if (!label || /^Deducciones$/i.test(label)) continue;

            // Total row has 2 cells only
            if (cells.length === 2 && !/Aportes/i.test(label)) {
              totalDeclarado = parseNum(cells[0]?.textContent ?? "0");
              totalDepositado = parseNum(cells[1]?.textContent ?? "0");
              continue;
            }

            deducciones.push({
              concepto: label,
              declarado: parseNum(cells[1]?.textContent ?? "0"),
              depositado: parseNum(cells[2]?.textContent ?? "0"),
              organismoDestino: (cells[3]?.textContent ?? "").trim(),
              observaciones: (cells[4]?.textContent ?? "").trim(),
            });
          }
        }
      }

      return {
        empleador: empMatch ? empMatch[1].trim() : "",
        cuitEmpleador: cuitMatch ? cuitMatch[1].trim() : "",
        basesImponibles,
        deducciones,
        totalDeclarado,
        totalDepositado,
      };
    });

    return {
      periodo,
      basesImponibles: result.basesImponibles,
      deducciones: result.deducciones,
      totalDeclarado: result.totalDeclarado,
      totalDepositado: result.totalDepositado,
      empleador: result.empleador,
      cuitEmpleador: result.cuitEmpleador,
    };
  } catch {
    return null;
  }
}
