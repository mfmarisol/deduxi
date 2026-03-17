import type { Page } from "playwright";
import type {
  CasasParticularesWorker,
  CasasParticularesPayment,
  CasasParticularesSummary,
} from "./types.js";

/**
 * Scrapes "Registro Especial de Personal de Casas Particulares" from ARCA.
 *
 * Real site structure (from inspection):
 *   Base URL: serviciossegsoc.afip.gob.ar/RegimenesEspeciales/app/DomesticoP/
 *   - index.aspx             → Worker list ("Trabajadores a cargo")
 *   - VerTrabajador.aspx     → Per-worker payment table (Pagos y Recibos)
 *   - SeleccionTipoContrib.aspx → May need to select "Empleador" role
 *
 * Flow:
 *   1. Navigate to ARCA portal (reuses authenticated cookies)
 *   2. Discover service + get token+sign via portal API
 *   3. POST form with token+sign → creates SSO session on serviciossegsoc
 *   4. If on SeleccionTipoContrib → select "Empleador"
 *   5. Parse index.aspx → extract worker cards (name, CUIL, category, etc.)
 *   6. For each worker, navigate to VerTrabajador.aspx → parse payment table
 *   7. Calculate totalDeducible = sum(Pago + Sueldo) across all workers/months
 *
 * Deduction under Ley 26.063 art. 16:
 *   - "Pago" column = contributions (aportes jubilatorios + obra social + ART)
 *   - "Sueldo" column = salary paid to worker
 *   - BOTH are deductible
 */

// NOTE: The portal returns lowercase URL but the server is case-sensitive.
// The real working path is /RegimenesEspeciales/app/DomesticoP/
const BASE_URL =
  "https://serviciossegsoc.afip.gob.ar/RegimenesEspeciales/app/DomesticoP";

export async function fetchCasasParticulares(
  page: Page,
  cuit: string,
): Promise<CasasParticularesSummary> {
  const debug: string[] = [];
  const userCuit = cuit.replace(/\D/g, "");
  const workers: CasasParticularesWorker[] = [];
  const payments: CasasParticularesPayment[] = [];

  try {
    // ── STEP 1: Navigate to portal ──────────────────────────────
    debug.push("=== STEP 1: Navigate to portal ===");
    if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 30000,
      });
      await page.waitForTimeout(2000);
    }
    debug.push(`On portal: ${page.url()}`);

    // ── STEP 2: Discover service + get token+sign ───────────────
    debug.push("=== STEP 2: Find Casas Particulares service ===");

    const discovery = await page.evaluate(async (c: string) => {
      try {
        const servResp = await fetch(`/portal/api/servicios/${c}`, {
          credentials: "include",
        });
        if (!servResp.ok)
          return { ok: false as const, err: `Services API ${servResp.status}` };
        const services = await servResp.json();
        if (!Array.isArray(services))
          return { ok: false as const, err: `Services not array, type=${typeof services}, keys=${Object.keys(services || {}).join(",")}` };

        // Log real structure
        const sampleKeys = services.length > 0 ? Object.keys(services[0]).join(", ") : "empty";
        const sampleService = services.length > 0 ? JSON.stringify(services[0]).substring(0, 500) : "none";

        // ── Strategy 1: Try known service slugs directly (like mcmp scraper) ──
        const knownSlugs = [
          "regdomestico", "domp", "ssd", "domestico", "domesticop", "caspart",
          "rcaspart", "repcp", "ress", "resc",
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
                  allServices: [`Direct hit: ${slug}`, `KEYS: ${sampleKeys}`, `SAMPLE: ${sampleService}`],
                };
              }
            }
          } catch {
            // slug doesn't exist, try next
          }
        }

        // ── Strategy 2: Search ALL text fields for casas/doméstico keywords ──
        let match: any = null;
        match = services.find((s: any) => {
          const allText = Object.values(s).map(v => String(v ?? "")).join(" ").toLowerCase();
          return (
            /casas?\s*partic/i.test(allText) ||
            /personal\s*(de\s*)?casas/i.test(allText) ||
            /servicio\s*dom[eé]stic/i.test(allText) ||
            /registro.*seguridad.*social.*dom[eé]stic/i.test(allText) ||
            /reg[ií]menes?\s*especiales/i.test(allText)
          );
        });

        // ── Strategy 3: Broader search ──
        if (!match) {
          match = services.find((s: any) => {
            const allText = Object.values(s).map(v => String(v ?? "")).join(" ").toLowerCase();
            if (!/dom[eé]stic/i.test(allText)) return false;
            if (/siradig/i.test(allText)) return false;
            return true;
          });
        }

        const allServices = [
          `KEYS: ${sampleKeys}`,
          `SAMPLE: ${sampleService}`,
          ...services.map((s: any) => {
            const vals = Object.values(s).map(v => String(v ?? "").substring(0, 60));
            return vals.join(" | ");
          }).slice(0, 30),
        ];

        if (!match) {
          return {
            ok: false as const,
            allServices,
            err: "No Casas Particulares service found",
          };
        }

        // Find the service ID — ARCA portal uses "serviceName" as the slug
        const matchId = (match.serviceName ?? match.id ?? match.codigo ?? match.servicio ?? match.code ?? match.slug) as string;
        const matchName = (match.buttontext ?? match.nombre ?? match.descripcion ?? match.name ?? match.label ?? matchId) as string;

        // Get token+sign
        try {
          const authResp = await fetch(
            `/portal/api/servicios/${c}/servicio/${matchId}/autorizacion`,
            { credentials: "include" },
          );
          if (!authResp.ok) {
            return {
              ok: false as const,
              serviceId: matchId,
              serviceName: matchName,
              allServices,
              err: `Auth API returned ${authResp.status} for service ${matchId}`,
            };
          }
          const authData = await authResp.json();
          if (!authData?.token) {
            return {
              ok: false as const,
              serviceId: matchId,
              serviceName: matchName,
              allServices,
              err: `No token in auth response for service ${matchId}`,
            };
          }

          return {
            ok: true as const,
            serviceId: matchId,
            serviceName: matchName,
            serviceUrl: (match.url || match.urlAcceso || authData.url || "") as string,
            token: authData.token as string,
            sign: authData.sign as string,
            allServices,
          };
        } catch (authErr: any) {
          return {
            ok: false as const,
            serviceId: matchId,
            serviceName: matchName,
            allServices,
            err: `Auth fetch failed for ${matchId}: ${authErr.message}`,
          };
        }
      } catch (e: any) {
        return { ok: false as const, err: e.message as string };
      }
    }, userCuit);

    debug.push(
      `Discovery: serviceId=${(discovery as any).serviceId || "none"}, name=${(discovery as any).serviceName || "none"}`,
    );
    if ((discovery as any).allServices) {
      debug.push(
        `All services (${(discovery as any).allServices.length}): ${(discovery as any).allServices.join(" | ")}`,
      );
    }

    if (!discovery.ok) {
      debug.push(`ERROR: ${discovery.err}`);
      debug.push("Possible reasons:");
      debug.push("  1. User doesn't have Casas Particulares service enabled");
      debug.push("  2. Service code differs from expected patterns");
      debug.push("  3. Check the service list above for the correct name/code");
      return { workers, payments, totalDeducible: 0, debug };
    }

    // ── STEP 3: POST token+sign → create SSO session ────────────
    debug.push("=== STEP 3: POST token+sign ===");
    // The SSO entry point is the default.aspx URL from the portal.
    // The portal returns: https://serviciossegsoc.afip.gob.ar/regimenesespeciales/default.aspx
    // We must POST token+sign there (not directly to DomesticoP subfolder).
    // After SSO, the server redirects to the actual app page.
    const svcUrl = discovery.serviceUrl || "https://serviciossegsoc.afip.gob.ar/regimenesespeciales/default.aspx";
    debug.push(`Service URL: ${svcUrl}`);

    // POST from blank page (proven reliable approach)
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
      page
        .waitForNavigation({ waitUntil: "networkidle", timeout: 25000 })
        .catch(() => {}),
    ]);
    await page.waitForTimeout(3000);
    debug.push(`After POST: ${page.url()}`);

    // Fallback: try from portal if blank page didn't navigate
    if (
      page.url() === "about:blank" ||
      page.url().includes("about:blank")
    ) {
      debug.push("POST from blank didn't navigate, trying from portal...");
      await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
        waitUntil: "networkidle",
        timeout: 15000,
      });
      await page.waitForTimeout(1000);
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
          { url: svcUrl, t: discovery.token, s: discovery.sign },
        ),
        page
          .waitForNavigation({ waitUntil: "networkidle", timeout: 25000 })
          .catch(() => {}),
      ]);
      await page.waitForTimeout(3000);
      debug.push(`After portal POST: ${page.url()}`);
    }

    // ── STEP 4: Handle SeleccionTipoContrib if needed ───────────
    debug.push("=== STEP 4: Handle role selection ===");
    const currentUrl = page.url();

    if (currentUrl.includes("SeleccionTipoContrib")) {
      debug.push("On SeleccionTipoContrib page, selecting Empleador...");

      // First, find the Empleador element without clicking (to log what we found)
      const found = await page.evaluate(() => {
        const allClickable = Array.from(
          document.querySelectorAll("a, button, input[type='submit'], .btn, .card"),
        );
        for (const el of allClickable) {
          const text = (
            (el as HTMLElement).textContent ||
            (el as HTMLInputElement).value ||
            ""
          ).trim();
          if (/empleador/i.test(text)) {
            return { found: true, method: "clickable", text };
          }
        }
        const radios = Array.from(
          document.querySelectorAll('input[type="radio"]'),
        ) as HTMLInputElement[];
        for (const radio of radios) {
          const label =
            radio.parentElement?.textContent?.trim() || radio.value;
          if (/empleador/i.test(label)) {
            return { found: true, method: "radio", text: label };
          }
        }
        return { found: false, method: "none", text: "" };
      });
      debug.push(`Role element: ${JSON.stringify(found)}`);

      if (found.found) {
        // Use Promise.all to set up navigation listener BEFORE clicking
        await Promise.all([
          page.waitForNavigation({ waitUntil: "networkidle", timeout: 15000 }).catch(() => {}),
          page.evaluate(() => {
            const allClickable = Array.from(
              document.querySelectorAll("a, button, input[type='submit'], .btn, .card"),
            );
            for (const el of allClickable) {
              const text = (
                (el as HTMLElement).textContent ||
                (el as HTMLInputElement).value ||
                ""
              ).trim();
              if (/empleador/i.test(text)) {
                (el as HTMLElement).click();
                return;
              }
            }
            const radios = Array.from(
              document.querySelectorAll('input[type="radio"]'),
            ) as HTMLInputElement[];
            for (const radio of radios) {
              const label =
                radio.parentElement?.textContent?.trim() || radio.value;
              if (/empleador/i.test(label)) {
                radio.click();
                radio.dispatchEvent(new Event("change", { bubbles: true }));
                const submit = document.querySelector(
                  'input[type="submit"], button[type="submit"]',
                ) as HTMLElement | null;
                if (submit) submit.click();
                return;
              }
            }
          }),
        ]);
        await page.waitForTimeout(3000);
      } else {
        debug.push("WARNING: Could not find Empleador element on SeleccionTipoContrib page");
        // Log page body for debugging
        const bodySnippet = await page.evaluate(
          () => document.body?.innerText?.slice(0, 500) || "",
        );
        debug.push(`Page body: ${bodySnippet}`);
      }
      debug.push(`After role selection: ${page.url()}`);
    }

    // ── STEP 5: Navigate to index.aspx if not already there ─────
    debug.push("=== STEP 5: Parse worker list (index.aspx) ===");

    // After role selection we may be on DomesticoP/Empleador/index.aspx or
    // DomesticoP/index.aspx — both are valid worker-list pages.
    const step5Url = page.url();
    const onWorkerList =
      step5Url.includes("DomesticoP") &&
      (step5Url.includes("index.aspx") || step5Url.includes("Index.aspx"));

    if (!onWorkerList) {
      debug.push(`Not on worker list (${step5Url}), navigating directly...`);
      // Try the Empleador subfolder first (more common after role selection)
      await page.goto(`${BASE_URL}/Empleador/index.aspx`, {
        waitUntil: "networkidle",
        timeout: 20000,
      });
      await page.waitForTimeout(3000);
      debug.push(`After direct nav: ${page.url()}`);

      // If that redirected to SeleccionTipoContrib or errored, try the base index
      if (!page.url().includes("index.aspx") || page.url().includes("SeleccionTipoContrib")) {
        debug.push("Empleador/index.aspx didn't work, trying base index.aspx...");
        await page.goto(`${BASE_URL}/index.aspx`, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        await page.waitForTimeout(3000);
        debug.push(`After base nav: ${page.url()}`);
      }
    }

    // Check for session expired
    const bodyCheck = await page.evaluate(
      () => document.body?.innerText?.slice(0, 500) || "",
    );
    if (
      /sesi[oó]n.*expir/i.test(bodyCheck) ||
      /no est[aá] logueado/i.test(bodyCheck)
    ) {
      debug.push("ERROR: Session expired");
      debug.push(`Body: ${bodyCheck}`);
      return { workers, payments, totalDeducible: 0, debug };
    }

    // Parse worker cards from "Trabajadores a cargo" section.
    // The real page uses card-based layout, not tables, with worker info
    // like: Name, CUIL, Tipo de Trabajo, Domicilio Laboral, Horas, Condicion
    // and buttons: GENERAR RECIBO, DATOS DEL TRABAJADOR, PAGOS Y RECIBOS, etc.
    const workerData = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const results: {
        cuil: string;
        nombre: string;
        categoria: string;
        horas: string;
        estado: string;
        pagosHref: string;
      }[] = [];

      // Strategy 1: Find links to VerTrabajador with "pagosyrecibos" param
      // These links contain idCuil which gives us the CUIL
      const pagosLinks = Array.from(document.querySelectorAll("a")).filter(
        (a) =>
          /VerTrabajador.*pagosyrecibos/i.test(a.href) ||
          /pagos\s*y\s*recibos/i.test(a.textContent || ""),
      );

      if (pagosLinks.length > 0) {
        // Each "PAGOS Y RECIBOS" link corresponds to a worker card.
        // Walk up from each link to find the parent card/container.
        for (const link of pagosLinks) {
          // Walk up to find the card container (usually 3-8 levels up)
          let card: HTMLElement | null = link.parentElement;
          for (let i = 0; i < 10 && card; i++) {
            if (card.textContent && card.textContent.length > 100) {
              // Stop when we have a substantial container with worker info
              const txt = card.textContent;
              if (/\d{2}-\d{8}-\d/.test(txt) || /CUIL/i.test(txt) || /nombre|trabajador/i.test(txt)) {
                break;
              }
            }
            card = card.parentElement;
          }

          const cardText = card?.textContent || "";

          // Extract name from visible text
          // AFIP shows worker name in bold/headings or near "Nombre" label
          let nombre = "";
          if (card) {
            // Strategy 1: Look for headings/bold with uppercase name
            const headings = card.querySelectorAll(
              "h1, h2, h3, h4, h5, h6, strong, b, .card-title, .nombre, [class*='name'], [class*='titulo']",
            );
            for (const h of headings) {
              const t = (h.textContent || "").trim();
              if (t.length >= 3 && /^[A-ZÁÉÍÓÚÑ\s,]+$/.test(t) && !/PAGOS|RECIBOS|DATOS|GENERAR|TRABAJADOR/i.test(t)) {
                nombre = t;
                break;
              }
            }
            // Strategy 2: Look for "Nombre y Apellido:" or similar label
            if (!nombre) {
              const nameMatch = cardText.match(/(?:Nombre|Apellido)[^:]*:\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+?)(?:\n|CUIL|Tipo|Categor)/i);
              if (nameMatch) nombre = nameMatch[1].trim();
            }
            // Strategy 3: Text before CUIL pattern
            if (!nombre) {
              const beforeCuil = cardText.match(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{3,})\s*(?:CUIL|Cuil|\d{2}-\d{8})/);
              if (beforeCuil) nombre = beforeCuil[1].trim();
            }
          }

          // Extract CUIL from visible card text (formatted: 27-94292633-8)
          // The URL params are base64 encrypted, so we MUST get CUIL from visible text
          let cuil = "";
          const cuilFromCard = cardText.match(/(\d{2}-\d{8}-\d)/)?.[1] || "";
          if (cuilFromCard) {
            cuil = cuilFromCard;
          } else {
            // Try "CUIL: 27-94292633-8" or "CUIL 27942926338"
            const cuilLabelMatch = cardText.match(/CUIL[:\s]*(\d[\d\s-]+\d)/i);
            if (cuilLabelMatch) {
              cuil = cuilLabelMatch[1].replace(/\s/g, "").replace(/(\d{2})(\d{8})(\d)/, "$1-$2-$3");
            }
          }

          // Extract category: "Personal para tareas generales", etc.
          const catMatch = cardText.match(
            /(?:Tipo\s*de\s*Trabajo|Categor[ií]a)[:\s]*(.+?)(?:\n|Domicilio|Horas|Condici)/i,
          );
          const categoria = catMatch ? catMatch[1].trim() : "";

          // Extract hours: "Menos de 12 horas", "16 horas o mas"
          const horasMatch = cardText.match(
            /(?:Horas\s*semanales)[:\s]*(.+?)(?:\n|Condici|$)/i,
          );
          const horas = horasMatch ? horasMatch[1].trim() : "";

          // Extract estado: "Activo", "De Baja"
          const estadoMatch = cardText.match(
            /(?:Condici[oó]n|Estado)[:\s]*(.+?)(?:\n|$)/i,
          );
          const estado = estadoMatch ? estadoMatch[1].trim() : "";

          results.push({
            cuil,
            nombre,
            categoria,
            horas,
            estado,
            pagosHref: link.href,
          });
        }
      }

      // Strategy 2: If no PAGOS Y RECIBOS links found, try table-based layout
      if (results.length === 0) {
        const tables = document.querySelectorAll("table");
        for (const table of tables) {
          const headerText = (
            table.querySelector("thead")?.textContent || ""
          ).toLowerCase();
          if (
            !/cuil|nombre|trabajador/i.test(headerText) &&
            !/personal|categor/i.test(headerText)
          )
            continue;

          const rows = Array.from(table.querySelectorAll("tbody tr"));
          for (const row of rows) {
            const cells = Array.from(row.querySelectorAll("td")).map(
              (c) => c.textContent?.trim() || "",
            );
            if (cells.length < 2) continue;
            const rowText = cells.join(" ");
            const cuilMatch = rowText.match(/(\d{2}-\d{8}-\d)/);
            if (!cuilMatch) continue;

            // Find PAGOS Y RECIBOS link in this row
            const rowLink = row.querySelector(
              'a[href*="VerTrabajador"], a[href*="pagos"]',
            );

            results.push({
              cuil: cuilMatch[1],
              nombre:
                cells.find(
                  (c) =>
                    c.length > 3 &&
                    /^[A-ZÁÉÍÓÚÑ\s,]+$/i.test(c) &&
                    !/^\d/.test(c),
                ) || "",
              categoria:
                cells.find((c) =>
                  /general|especial|cuidado|limpieza|cocina|jardin/i.test(c),
                ) || "",
              horas: "",
              estado: /activ/i.test(rowText)
                ? "Activo"
                : /baja/i.test(rowText)
                  ? "De Baja"
                  : "",
              pagosHref: (rowLink as HTMLAnchorElement)?.href || "",
            });
          }
        }
      }

      // Strategy 3: CUIL extraction from body as last resort
      if (results.length === 0) {
        const cuilMatches = bodyText.match(/\d{2}-\d{8}-\d/g) || [];
        // Deduplicate
        const unique = [...new Set(cuilMatches)];
        for (const cuil of unique) {
          results.push({
            cuil,
            nombre: "",
            categoria: "",
            horas: "",
            estado: "",
            pagosHref: "",
          });
        }
      }

      return {
        workers: results,
        bodyPreview: bodyText.substring(0, 1500),
        url: window.location.href,
      };
    });

    debug.push(`Found ${workerData.workers.length} workers on index.aspx`);
    debug.push(`Body preview: ${workerData.bodyPreview.substring(0, 500)}`);
    if (workerData.workers.length > 0) {
      for (const w of workerData.workers) {
        debug.push(`  Raw worker: cuil="${w.cuil}" nombre="${w.nombre}" cat="${w.categoria}" estado="${w.estado}"`);
      }
    }

    // Map to CasasParticularesWorker and determine "modalidad" from hours
    for (const w of workerData.workers) {
      const modalidad = /menos de 12|< ?12/i.test(w.horas)
        ? "Con retiro"
        : /16.*m[aá]s|>= ?16/i.test(w.horas)
          ? "Sin retiro"
          : w.horas || "";

      workers.push({
        cuil: w.cuil,
        nombre: w.nombre,
        categoria: w.categoria,
        modalidad,
        fechaAlta: "", // Not shown on index.aspx cards
        estado: w.estado,
      });
      debug.push(
        `  Worker: ${w.nombre || w.cuil} | ${w.categoria} | ${w.estado}`,
      );
    }

    // ── STEP 6: For each worker, fetch payment data ─────────────
    debug.push("=== STEP 6: Fetch payments per worker ===");

    for (const w of workerData.workers) {
      if (!w.pagosHref && !w.cuil) {
        debug.push(`  Skipping worker without CUIL or link`);
        continue;
      }

      // Build URL to VerTrabajador.aspx if no direct link
      const pagosUrl =
        w.pagosHref ||
        `${BASE_URL}/Empleador/VerTrabajador.aspx?idCuil=${encodeURIComponent(w.cuil)}&Boton=pagosyrecibos`;

      debug.push(
        `  Fetching payments for ${w.nombre || w.cuil}: ${pagosUrl}`,
      );

      try {
        await page.goto(pagosUrl, {
          waitUntil: "networkidle",
          timeout: 20000,
        });
        await page.waitForTimeout(3000);

        // Extract worker name from page heading: "Pagos y Recibos de SANCHEZ ROMERO NICIDA"
        const pageHeading = await page.evaluate(() => {
          // Strategy 1: Look for heading elements specifically
          const headings = document.querySelectorAll("h1, h2, h3, h4, h5");
          for (const h of headings) {
            const t = (h.textContent || "").trim();
            // Match "Pagos y Recibos de NOMBRE APELLIDO" — stop at newline/tab
            const nameMatch = t.match(/(?:Pagos\s+y\s+Recibos\s+de|de)\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,}?)$/i);
            if (nameMatch) return nameMatch[1].trim();
          }
          // Strategy 2: bodyText but only grab the first line after "de "
          const bodyText = document.body?.innerText || "";
          const lines = bodyText.split(/\n/);
          for (const line of lines) {
            const m = line.match(/Pagos\s+y\s+Recibos\s+de\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s]{2,})/i);
            if (m) {
              // Clean: stop at known table header words
              let name = m[1].trim();
              const stopWords = /\b(Pagos|Per[ií]odo|Pago|Estado|Sueldo|Detalle|Recibo)\b/i;
              const stopIdx = name.search(stopWords);
              if (stopIdx > 0) name = name.substring(0, stopIdx).trim();
              return name;
            }
          }
          return "";
        });
        if (pageHeading) {
          debug.push(`  Worker name from heading: "${pageHeading}"`);
          // Update the worker entry with the real name
          const workerIdx = workers.findIndex(wr => wr.cuil === w.cuil);
          if (workerIdx >= 0) {
            workers[workerIdx].nombre = pageHeading;
          }
          // Also update w.nombre for payment records
          w.nombre = pageHeading;
        }

        // Parse the payment table. Real columns:
        // Periodo | Pago | Estado del pago | Sueldo | Estado del recibo | Detalle del pago/rechazo
        // Example: "Febrero 2026" | "$8.741,78" | "CONSTANCIA DE PAGO" | "$156.000,00" | "VER RECIBO" | "DETALLE DE PAGO"
        // Handle pagination (page 1, 2, ...)
        let pageNum = 1;
        let hasMorePages = true;

        while (hasMorePages && pageNum <= 20) {
          const pagePayments = await page.evaluate(
            (workerInfo: { cuil: string; nombre: string }) => {
              const results: {
                periodo: string;
                pago: string;
                estadoPago: string;
                sueldo: string;
              }[] = [];

              const tables = document.querySelectorAll("table");
              for (const table of tables) {
                const headerText = (
                  table.querySelector("thead, tr")?.textContent || ""
                ).toLowerCase();
                // Look for the payment table by its column names
                if (
                  !/per[ií]odo/i.test(headerText) ||
                  !/pago|sueldo/i.test(headerText)
                )
                  continue;

                const rows = Array.from(
                  table.querySelectorAll("tbody tr, tr"),
                );
                // Skip header rows
                const dataRows = rows.filter((r) => {
                  const tds = r.querySelectorAll("td");
                  return tds.length >= 2;
                });

                for (const row of dataRows) {
                  // AFIP responsive tables embed labels inside cells as <span class="tdBefore">
                  // e.g. <td><span class="tdBefore">Período</span>Marzo 2026</td>
                  // We need to extract only the VALUE, not the label.
                  const cells = Array.from(row.querySelectorAll("td")).map((c) => {
                    // Remove any label spans to get pure value
                    const clone = c.cloneNode(true) as HTMLElement;
                    clone.querySelectorAll(".tdBefore, .td-before, [class*='label'], [class*='header']").forEach(s => s.remove());
                    // Also try: if cell has a child with the value, use that
                    let text = clone.textContent?.trim() || "";
                    // Fallback: strip known header prefixes
                    text = text.replace(/^(Per[ií]odo|Pago|Estado del pago|Estado|Sueldo|Detalle)[:\s]*/i, "");
                    return text;
                  });
                  if (cells.length < 4) continue;

                  // First cell should be a period like "Marzo 2026" or "Febrero 2026"
                  const periodoText = cells[0];
                  if (
                    !/enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i.test(
                      periodoText,
                    )
                  )
                    continue;

                  results.push({
                    periodo: periodoText,
                    pago: cells[1] || "", // "$8.741,78"
                    estadoPago: cells[2] || "", // "CONSTANCIA DE PAGO" or "PAGAR"
                    sueldo: cells[3] || "", // "$156.000,00"
                  });
                }

                // If we found data in this table, don't look at others
                if (results.length > 0) break;
              }

              return {
                payments: results,
                url: window.location.href,
              };
            },
            { cuil: w.cuil, nombre: w.nombre },
          );

          debug.push(
            `  Page ${pageNum}: ${pagePayments.payments.length} payment rows`,
          );

          for (const p of pagePayments.payments) {
            const pago = parseArgentineNumber(p.pago);
            const sueldo = parseArgentineNumber(p.sueldo);
            const estadoLower = (p.estadoPago || "").toLowerCase().trim();
            // For SiRADIG: the deductible amount is pago + sueldo regardless of payment status.
            // Even if it says "PAGAR" (not yet paid), the recibo is already generated
            // and the amounts are what we declare. The status is informational only.
            const total = pago + sueldo;
            const isPaid = /constancia|pagad[oa]|confirmad|comprobante/i.test(estadoLower);

            const periodo = normalizeMonthYear(p.periodo);

            debug.push(
              `    ROW: worker=${w.cuil} periodo=${periodo} pago="${p.pago}"→${pago} sueldo="${p.sueldo}"→${sueldo} estado="${p.estadoPago}" total=${total}`,
            );

            payments.push({
              periodo,
              cuil: w.cuil,
              nombre: w.nombre,
              remuneracion: sueldo,
              aporteJubilatorio: 0, // Breakdown not available; pago is the total contribution
              obraSocial: 0,
              art: 0,
              totalPagado: total,
              fechaPago: "",
              nroRecibo: "",
            });

            debug.push(
              `    ${p.periodo}: pago=$${pago} sueldo=$${sueldo} total=$${total} estado="${p.estadoPago}" ${isPaid ? "PAGADO" : "PENDIENTE"}`,
            );
          }

          // Check for next page
          const hasNext = await page.evaluate((currentPage: number) => {
            // Look for pagination links: numbered pages, "next" arrow, etc.
            const paginationLinks = Array.from(
              document.querySelectorAll(
                "a.paginate_button, .pagination a, a[href*='page'], a[href*='Page'], a[href*='__doPostBack']",
              ),
            );
            // Find link for the next page number
            const nextPageLink = paginationLinks.find((a) => {
              const text = (a.textContent || "").trim();
              return text === String(currentPage + 1);
            });
            // Also check for a ">" or "Siguiente" link
            const nextArrow = paginationLinks.find((a) => {
              const text = (a.textContent || "").trim();
              return /^[>›]$|siguiente|next/i.test(text);
            });
            const link = nextPageLink || nextArrow;
            if (link) {
              (link as HTMLElement).click();
              return true;
            }
            return false;
          }, pageNum);

          if (hasNext) {
            await page.waitForTimeout(3000);
            pageNum++;
          } else {
            hasMorePages = false;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        debug.push(`  ERROR fetching payments for ${w.cuil}: ${message}`);
      }
    }

    // ── STEP 7: Deduplicate & Calculate totals ──────────────────
    // AFIP pages sometimes render the same table twice (desktop + mobile responsive)
    // or pagination re-reads the same rows. Deduplicate by periodo+cuil+totalPagado.
    const seen = new Set<string>();
    const uniquePayments: typeof payments = [];
    for (const p of payments) {
      const key = `${p.periodo}|${p.cuil}|${p.totalPagado}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePayments.push(p);
      }
    }
    if (uniquePayments.length !== payments.length) {
      debug.push(`Deduplicated: ${payments.length} → ${uniquePayments.length} payments`);
    }
    // Replace payments array with deduplicated version
    payments.length = 0;
    payments.push(...uniquePayments);

    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = String(now.getFullYear());
    const currentPeriodCode = `${currentMonth}/${currentYear}`;

    // Sort all payments most recent first
    const sortedPayments = [...payments].filter(p => p.totalPagado > 0).sort((a, b) => {
      const [am, ay] = a.periodo.split("/").map(Number);
      const [bm, by] = b.periodo.split("/").map(Number);
      return (by * 12 + bm) - (ay * 12 + am);
    });
    const latestPeriod = sortedPayments.length > 0 ? sortedPayments[0].periodo : "none";

    // totalDeducible = the MOST RECENT period's total (current month if available, else previous)
    // This is what the user should declare in SiRADIG for this month
    const currentMonthPayments = payments.filter(p => p.periodo === currentPeriodCode && p.totalPagado > 0);
    let relevantPayments = currentMonthPayments;
    let relevantPeriod = currentPeriodCode;

    if (relevantPayments.length === 0 && sortedPayments.length > 0) {
      // No current month data yet — use the most recent period available
      relevantPeriod = sortedPayments[0].periodo;
      relevantPayments = payments.filter(p => p.periodo === relevantPeriod && p.totalPagado > 0);
      debug.push(`No data for ${currentPeriodCode}, using latest: ${relevantPeriod}`);
    }

    const totalDeducible = relevantPayments.reduce(
      (sum, p) => sum + p.totalPagado,
      0,
    );

    // Accumulated for the whole fiscal year (for borrador SiRADIG reference)
    const totalAcumulado = payments
      .filter(p => {
        const parts = p.periodo.split("/");
        return parts.length === 2 && parts[1] === currentYear && p.totalPagado > 0;
      })
      .reduce((sum, p) => sum + p.totalPagado, 0);

    debug.push(
      `=== DONE: ${workers.length} workers, ${payments.length} payments, period=${relevantPeriod}, thisMonth=$${totalDeducible.toFixed(2)}, yearAccum=$${totalAcumulado.toFixed(2)}, latestPeriod=${latestPeriod} ===`,
    );
    return { workers, payments, totalDeducible, totalAcumulado, latestPeriod, debug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { workers: [], payments: [], totalDeducible: 0, debug };
  }
}

/**
 * Parse an Argentine-format number string like "$8.741,78" or "176.000,00"
 * into a JS number. Dots are thousands separators, comma is decimal.
 */
function parseArgentineNumber(s: string): number {
  if (!s) return 0;
  // Remove currency symbol, spaces, and any non-numeric chars except . and ,
  const cleaned = s
    .replace(/[$\s]/g, "")
    .replace(/\./g, "") // remove thousands dots
    .replace(",", "."); // decimal comma → decimal point
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Convert "Febrero 2026" → "02/2026", "Diciembre 2025" → "12/2025", etc.
 */
function normalizeMonthYear(text: string): string {
  const months: Record<string, string> = {
    enero: "01",
    febrero: "02",
    marzo: "03",
    abril: "04",
    mayo: "05",
    junio: "06",
    julio: "07",
    agosto: "08",
    septiembre: "09",
    octubre: "10",
    noviembre: "11",
    diciembre: "12",
  };
  const lower = text.toLowerCase().trim();
  for (const [name, num] of Object.entries(months)) {
    if (lower.startsWith(name)) {
      const yearMatch = lower.match(/\d{4}/);
      if (yearMatch) return `${num}/${yearMatch[0]}`;
    }
  }
  // Fallback: return as-is
  return text.trim();
}
