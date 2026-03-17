import type { Page } from "playwright";
import type {
  SiradigPresentacion,
  SiradigDeduccion,
  SiradigDetail,
  SiradigCargaFamilia,
  SiradigOtroEmpleador,
  SiradigDeduccion3,
  SiradigRetencion4,
} from "./types.js";

/**
 * Map SiRADIG concept labels to our internal category keys.
 * These are the labels that appear in the F.572 Web form.
 */
const CONCEPT_TO_CATEGORY: Record<string, string> = {
  // Section 3 - Deducciones
  "cuotas médico": "prepaga",
  "cuota médico": "prepaga",
  "médico asistencial": "prepaga",
  "medico asistencial": "prepaga",
  "obra social": "prepaga",
  "prepaga": "prepaga",
  "gastos médicos": "honorarios_medicos",
  "gastos medicos": "honorarios_medicos",
  "honorarios médicos": "honorarios_medicos",
  "honorarios medicos": "honorarios_medicos",
  "paramédicos": "honorarios_medicos",
  "paramedicos": "honorarios_medicos",
  "seguro de vida": "seguro_vida",
  "seguro para muerte": "seguro_vida",
  "primas de seguro para muerte": "seguro_vida",
  "seguro mixto": "seguro_mixto",
  "ahorro - seguros mixtos": "seguro_mixto",
  "primas de ahorro": "seguro_mixto",
  "seguro de retiro": "seguro_retiro",
  "retiro privado": "seguro_retiro",
  "planes de seguro de retiro": "seguro_retiro",
  "donaciones": "donaciones",
  "donación": "donaciones",
  "entidades exentas": "donaciones",
  "intereses préstamo hipotecario": "hipotecario",
  "intereses prestamo hipotecario": "hipotecario",
  "hipotecario": "hipotecario",
  "crédito hipotecario": "hipotecario",
  "sepelio": "gastos_sepelio",
  "gastos de sepelio": "gastos_sepelio",
  "indumentaria": "indumentaria_equipamiento",
  "equipamiento": "indumentaria_equipamiento",
  "indumentaria y equipamiento": "indumentaria_equipamiento",
  "alquiler": "alquiler",
  "alquiler de inmueble": "alquiler",
  "casa habitación": "alquiler",
  "personal doméstico": "servicio_domestico",
  "personal domestico": "servicio_domestico",
  "servicio doméstico": "servicio_domestico",
  "casas particulares": "servicio_domestico",
  "deducción del personal doméstico": "servicio_domestico",
  "sociedad de garantía": "sgr",
  "sgr": "sgr",
  "fondos comunes": "fondos_comunes_inversion",
  "educación": "educacion",
  "gastos de educación": "educacion",
  "gastos educativos": "educacion",
  "vehículo": "vehiculo_corredores",
  "corredores y viajantes": "vehiculo_corredores",
  "cuota sindical": "cuota_sindical",
  "cuotas sindicales": "cuota_sindical",
  "colegios profesionales": "colegios_profesionales",
  "matrícula": "colegios_profesionales",
  // Section 4 - Retenciones
  "impuesto sobre créditos": "impuesto_cheque",
  "impuesto cheque": "impuesto_cheque",
  "débitos y créditos": "impuesto_cheque",
  "percepciones aduaneras": "percepciones_aduana",
  "retenciones aduaneras": "percepciones_aduana",
  "aduana": "percepciones_aduana",
  "rg 3819": "pago_cuenta_3819",
  "cancelación efectivo": "pago_cuenta_3819",
  "rg 5617": "pago_cuenta_5617",
  "rg 5683": "autorretenciones_5683",
  "autorretenciones": "autorretenciones_5683",
  "percepción usd": "percepciones_usd",
  "percepción dólar": "percepciones_usd",
  "percepción tarjeta": "percepciones_tarjeta",
};

function mapConceptToCategory(concept: string): string {
  const lower = concept.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const [key, value] of Object.entries(CONCEPT_TO_CATEGORY)) {
    const normalizedKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normalizedKey)) return value;
  }
  return "otras_deducciones";
}

function parseArgNumber(text: string): number {
  // "1.234.567,89" → 1234567.89
  const cleaned = text.replace(/[^0-9.,-]/g, "").replace(/\./g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseMonth(text: string): number {
  const months: Record<string, number> = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
    ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6,
    jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12,
  };
  const lower = text.toLowerCase().trim();
  if (months[lower]) return months[lower];
  const num = parseInt(lower);
  if (num >= 1 && num <= 12) return num;
  return 0;
}

/**
 * Navigate to AFIP portal and get SiRADIG token+sign for SSO.
 * Returns { token, sign, svcUrl } or null on failure.
 */
async function getSiradigSSO(
  page: Page,
  cuit: string,
  debug: string[],
): Promise<{ token: string; sign: string; svcUrl: string } | null> {
  const userCuit = cuit.replace(/\D/g, "");

  // Ensure we're on the portal
  if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
    await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
      waitUntil: "networkidle",
      timeout: 30000,
    });
    await page.waitForTimeout(2000);
  }
  debug.push(`On portal: ${page.url()}`);

  // Try known service codes
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
        return { ok: true, url: d1?.servicio?.url, token: d2?.token, sign: d2?.sign, code: svc };
      } catch (e: any) {
        return { ok: false, err: e.message, code: svc };
      }
    }, { c: userCuit, svc: code });

    debug.push(`Tried service '${code}': ok=${apiResult.ok}, status=${apiResult.status || "N/A"}`);
    if (apiResult.ok && apiResult.token) break;
  }

  if (!apiResult.ok || !apiResult.token || !apiResult.sign) {
    // Fallback: search all services
    const serviceList = await page.evaluate(async (c: string) => {
      try {
        const r = await fetch(`/portal/api/servicios/${c}`, { credentials: "include" });
        const d = await r.json();
        if (Array.isArray(d)) {
          return d.map((s: any) => ({ id: s.id, nombre: s.nombre, url: s.url }))
            .filter((s: any) => /siradig|572|ddjj|ganancia/i.test(s.nombre || s.id || ""));
        }
        return [];
      } catch { return []; }
    }, userCuit);

    debug.push(`SiRADIG-like services: ${JSON.stringify(serviceList)}`);

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
      debug.push(`Fallback service '${svc.id}' (${svc.nombre}): ok=${apiResult.ok}`);
    }
  }

  if (!apiResult.ok || !apiResult.token) return null;

  return {
    token: apiResult.token as string,
    sign: apiResult.sign as string,
    svcUrl: (apiResult.url as string) || "https://siradig.afip.gob.ar/",
  };
}

/**
 * POST token+sign to SiRADIG to establish SSO session.
 */
async function postSiradigSSO(
  page: Page,
  token: string,
  sign: string,
  svcUrl: string,
  debug: string[],
): Promise<void> {
  await Promise.all([
    page.evaluate(
      ({ url, t, s }: { url: string; t: string; s: string }) => {
        const f = document.createElement("form");
        f.method = "POST";
        f.action = url;
        f.style.display = "none";
        [{ n: "token", v: t }, { n: "sign", v: s }].forEach(({ n, v }) => {
          const i = document.createElement("input");
          i.type = "hidden"; i.name = n; i.value = v;
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

  // Retry from blank if SPA intercepted
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
}

/**
 * Navigates to SiRADIG (F.572 Web) and fetches all presentations and drafts.
 * (Original function — lists presentations only)
 */
export async function fetchSiradigPresentaciones(
  page: Page,
  cuit: string,
): Promise<{ presentaciones: SiradigPresentacion[]; deducciones: SiradigDeduccion[]; debug: string[] }> {
  const debug: string[] = [];

  try {
    debug.push("=== STEP 1: Get SiRADIG SSO ===");
    const sso = await getSiradigSSO(page, cuit, debug);
    if (!sso) {
      debug.push("ERROR: Cannot access SiRADIG service");
      return { presentaciones: [], deducciones: [], debug };
    }

    debug.push("=== STEP 2: POST to SiRADIG ===");
    await postSiradigSSO(page, sso.token, sso.sign, sso.svcUrl, debug);

    debug.push("=== STEP 3: Parse SiRADIG page ===");
    debug.push(`Current URL: ${page.url()}`);
    const pageTitle = await page.title();
    debug.push(`Page title: ${pageTitle}`);

    // Dump page structure
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

    // Parse presentations table
    const presentaciones: SiradigPresentacion[] = [];
    const deducciones: SiradigDeduccion[] = [];

    const tableData = await page.evaluate(() => {
      const results: any[] = [];
      const tables = document.querySelectorAll("table");
      for (const table of tables) {
        const rows = table.querySelectorAll("tbody tr, tr");
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll("td, th")).map(c => c.textContent?.trim() || "");
          if (cells.length >= 2 && cells.some(c => c.length > 0)) results.push(cells);
        }
      }
      const cards = document.querySelectorAll('[class*="periodo"], [class*="presentacion"], [class*="borrador"], .card, .list-group-item');
      const cardData: string[] = [];
      cards.forEach(card => {
        const text = (card.textContent || "").trim().substring(0, 200);
        if (text.length > 5) cardData.push(text);
      });
      return { tableRows: results, cards: cardData };
    });

    debug.push(`Table rows found: ${tableData.tableRows.length}`);
    if (tableData.tableRows.length > 0) debug.push(`First 5 rows: ${JSON.stringify(tableData.tableRows.slice(0, 5))}`);
    if (tableData.cards.length > 0) {
      debug.push(`Cards found: ${tableData.cards.length}`);
      debug.push(`First 3 cards: ${JSON.stringify(tableData.cards.slice(0, 3))}`);
    }

    for (const row of tableData.tableRows) {
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
    return { presentaciones, deducciones, debug };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { presentaciones: [], deducciones: [], debug };
  }
}

/**
 * Navigates to SiRADIG (F.572 Web) and scrapes the FULL DETAIL of the latest
 * presented F.572 (or the latest rectificativa). This is the main function
 * for importing previous SiRADIG data.
 *
 * Strategy:
 * 1. Navigate to SiRADIG via SSO
 * 2. Find the list of periods
 * 3. Click on the latest "Presentada" period (preferring rectificativa)
 * 4. Parse all 4 sections of the F.572
 * 5. Return structured data
 */
export async function fetchSiradigDetail(
  page: Page,
  cuit: string,
  targetPeriodo?: string, // optional: "03/2026" — if not provided, finds the latest
): Promise<SiradigDetail> {
  const debug: string[] = [];
  const emptyResult: SiradigDetail = {
    periodo: "", estado: "", tipo: "", nroTransaccion: "", fechaPresentacion: "",
    cargasFamilia: [], otrosEmpleadores: [], deducciones3: [], retenciones4: [],
    debug,
  };

  try {
    // ── STEP 1: SSO into SiRADIG ──
    debug.push("=== STEP 1: Get SiRADIG SSO ===");
    const sso = await getSiradigSSO(page, cuit, debug);
    if (!sso) {
      debug.push("ERROR: Cannot access SiRADIG service");
      return emptyResult;
    }

    debug.push("=== STEP 2: POST to SiRADIG ===");
    await postSiradigSSO(page, sso.token, sso.sign, sso.svcUrl, debug);

    const currentUrl = page.url();
    debug.push(`After SSO navigation: ${currentUrl}`);
    const pageTitle = await page.title();
    debug.push(`Page title: ${pageTitle}`);

    // ── STEP 3: Understand the page structure ──
    debug.push("=== STEP 3: Analyze page structure ===");

    // Take a snapshot of the full page for debugging
    const fullPageInfo = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const allSelects = Array.from(document.querySelectorAll("select")).map(s => ({
        id: s.id, name: s.name,
        options: Array.from(s.options).map(o => ({ value: o.value, text: o.text.trim() })),
      }));
      const allInputs = Array.from(document.querySelectorAll("input")).map(i => ({
        type: i.type, id: i.id, name: i.name, value: i.value,
      })).filter(i => i.type !== "hidden" || i.name.length > 0);
      const allForms = Array.from(document.querySelectorAll("form")).map(f => ({
        action: f.action, method: f.method, id: f.id,
      }));
      const allTables = Array.from(document.querySelectorAll("table")).map(t => {
        const rows = Array.from(t.querySelectorAll("tr")).slice(0, 5);
        return rows.map(r =>
          Array.from(r.querySelectorAll("td, th")).map(c => (c.textContent || "").trim().substring(0, 60))
        );
      });
      const allLinks = Array.from(document.querySelectorAll("a")).map(a => ({
        text: (a.textContent || "").trim().substring(0, 80),
        href: a.href,
        onclick: a.getAttribute("onclick")?.substring(0, 100) || "",
      })).filter(l => l.text.length > 0).slice(0, 40);
      const allButtons = Array.from(document.querySelectorAll("button, input[type='submit'], input[type='button'], .btn, [role='button']")).map(b => ({
        text: ((b as HTMLElement).textContent || (b as HTMLInputElement).value || "").trim().substring(0, 80),
        id: (b as HTMLElement).id,
        onclick: (b as HTMLElement).getAttribute("onclick")?.substring(0, 100) || "",
        className: (b as HTMLElement).className?.substring(0, 80) || "",
      })).filter(b => b.text.length > 0);
      // Look for Angular/React app indicators
      const isAngular = !!document.querySelector("[ng-app], [data-ng-app], app-root, [_nghost], [ng-version]");
      const isReact = !!document.querySelector("[data-reactroot], #root > div");
      const iframes = Array.from(document.querySelectorAll("iframe")).map(f => ({
        src: f.src?.substring(0, 150) || "", id: f.id,
      }));
      // Tabs / accordion panels
      const tabs = Array.from(document.querySelectorAll('[role="tab"], .nav-tab, .ui-tabs-nav li, .p-tabmenu-nav li, .tab-pane, [class*="tab"]')).map(t => ({
        text: (t.textContent || "").trim().substring(0, 60),
        className: (t as HTMLElement).className?.substring(0, 60) || "",
        active: (t as HTMLElement).classList?.contains("active") || (t as HTMLElement).getAttribute("aria-selected") === "true",
      })).filter(t => t.text.length > 0);
      const accordions = Array.from(document.querySelectorAll('[class*="accordion"], [class*="panel"], [class*="collapse"], details, [class*="expandable"]')).map(a => ({
        text: (a.textContent || "").trim().substring(0, 100),
        className: (a as HTMLElement).className?.substring(0, 60) || "",
      })).slice(0, 10);

      return {
        bodyPreview: bodyText.substring(0, 3000),
        selects: allSelects,
        inputs: allInputs.slice(0, 20),
        forms: allForms,
        tables: allTables,
        links: allLinks,
        buttons: allButtons,
        isAngular, isReact,
        iframes,
        tabs,
        accordions,
      };
    });

    debug.push(`Selects: ${JSON.stringify(fullPageInfo.selects)}`);
    debug.push(`Inputs: ${JSON.stringify(fullPageInfo.inputs)}`);
    debug.push(`Forms: ${JSON.stringify(fullPageInfo.forms)}`);
    debug.push(`Tables count: ${fullPageInfo.tables.length}`);
    for (let i = 0; i < fullPageInfo.tables.length; i++) {
      debug.push(`Table ${i}: ${JSON.stringify(fullPageInfo.tables[i])}`);
    }
    debug.push(`Links: ${JSON.stringify(fullPageInfo.links.slice(0, 20))}`);
    debug.push(`Buttons: ${JSON.stringify(fullPageInfo.buttons)}`);
    debug.push(`Angular: ${fullPageInfo.isAngular}, React: ${fullPageInfo.isReact}`);
    debug.push(`Iframes: ${JSON.stringify(fullPageInfo.iframes)}`);
    debug.push(`Tabs: ${JSON.stringify(fullPageInfo.tabs)}`);
    debug.push(`Accordions: ${JSON.stringify(fullPageInfo.accordions)}`);
    debug.push(`Body preview: ${fullPageInfo.bodyPreview.substring(0, 1500)}`);

    // ── STEP 4: Navigate to the target period ──
    debug.push("=== STEP 4: Navigate to target period ===");

    // SiRADIG might have a period selector (dropdown or list)
    // Strategy A: Look for a period selector dropdown
    let periodSelected = false;

    if (fullPageInfo.selects.length > 0) {
      // Find a select that has period-like options (mm/yyyy or month names)
      for (const sel of fullPageInfo.selects) {
        const hasPeriods = sel.options.some(o =>
          /\d{2}\/\d{4}|\d{4}-\d{2}|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i.test(o.text)
        );
        if (hasPeriods) {
          debug.push(`Found period selector: #${sel.id} name=${sel.name} with ${sel.options.length} options`);
          debug.push(`Period options: ${JSON.stringify(sel.options.slice(0, 12))}`);

          // Select the target period, or the most recent "presented" one
          let targetOption = sel.options.find(o => targetPeriodo && o.text.includes(targetPeriodo));
          if (!targetOption && targetPeriodo) {
            // Try reversed format
            const [m, y] = targetPeriodo.split("/");
            targetOption = sel.options.find(o => o.text.includes(`${y}-${m}`) || o.text.includes(`${m}/${y}`));
          }
          if (!targetOption) {
            // Pick the latest period (usually the last non-empty option)
            targetOption = sel.options.filter(o => o.value && o.value !== "").pop();
          }

          if (targetOption) {
            debug.push(`Selecting period: ${targetOption.text} (value=${targetOption.value})`);
            const selector = sel.id ? `#${sel.id}` : `select[name="${sel.name}"]`;
            await page.selectOption(selector, targetOption.value);
            await page.waitForTimeout(2000);
            periodSelected = true;

            // Check if there's a "Ver" / "Buscar" / "Consultar" button to click
            const submitBtn = fullPageInfo.buttons.find(b =>
              /ver|buscar|consultar|aceptar|cargar/i.test(b.text)
            );
            if (submitBtn) {
              debug.push(`Clicking button: ${submitBtn.text}`);
              const btnSelector = submitBtn.id ? `#${submitBtn.id}` :
                `button:has-text("${submitBtn.text}"), input[value="${submitBtn.text}"]`;
              try {
                await page.click(btnSelector, { timeout: 5000 });
                await page.waitForTimeout(3000);
              } catch {
                debug.push(`Could not click '${submitBtn.text}' with exact selector, trying text match`);
                try {
                  await page.getByText(submitBtn.text, { exact: false }).first().click({ timeout: 5000 });
                  await page.waitForTimeout(3000);
                } catch { debug.push("Button click failed"); }
              }
            }
          }
          break;
        }
      }
    }

    // Strategy B: Look for clickable period links/rows in a table
    if (!periodSelected) {
      debug.push("No period dropdown found. Looking for clickable period links...");

      const periodLinks = await page.evaluate((target) => {
        const links: { text: string; index: number; href: string; onclick: string }[] = [];
        // Check table rows
        const rows = document.querySelectorAll("table tr, .list-group-item, [class*='periodo'], [class*='row']");
        let idx = 0;
        for (const row of rows) {
          const text = (row.textContent || "").trim();
          if (/\d{2}\/\d{4}|\w+\s+\d{4}/.test(text)) {
            const link = row.querySelector("a, button, [onclick]") as HTMLElement;
            links.push({
              text: text.substring(0, 100),
              index: idx,
              href: (link as HTMLAnchorElement)?.href || "",
              onclick: link?.getAttribute("onclick") || "",
            });
          }
          idx++;
        }
        // Also check standalone links
        const aLinks = document.querySelectorAll("a");
        for (const a of aLinks) {
          const text = (a.textContent || "").trim();
          if (/\d{2}\/\d{4}|\w+\s+\d{4}/.test(text) && /presentad|borrador|vigente|rectificativ/i.test(text)) {
            links.push({
              text: text.substring(0, 100),
              index: -1,
              href: a.href,
              onclick: a.getAttribute("onclick") || "",
            });
          }
        }
        return links;
      }, targetPeriodo || "");

      debug.push(`Period links found: ${JSON.stringify(periodLinks)}`);

      if (periodLinks.length > 0) {
        // Find the best match: latest period with "Presentada" or "Rectificativa" status
        // Prefer rectificativa > presentada > borrador
        let best = periodLinks.find(l => /rectificativ/i.test(l.text));
        if (!best) best = periodLinks.find(l => /presentad/i.test(l.text));
        if (!best) best = periodLinks.find(l => /vigente/i.test(l.text));
        if (!best) best = periodLinks[periodLinks.length - 1]; // fallback: last

        debug.push(`Clicking on period: ${best.text}`);

        try {
          if (best.href && !best.href.startsWith("javascript:")) {
            await page.goto(best.href, { waitUntil: "networkidle", timeout: 20000 });
          } else {
            // Click the element containing this text
            await page.getByText(best.text.substring(0, 30), { exact: false }).first().click({ timeout: 10000 });
          }
          await page.waitForTimeout(3000);
          periodSelected = true;
        } catch (e) {
          debug.push(`Click failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }
    }

    // Strategy C: Maybe SiRADIG opens directly to the current borrador
    if (!periodSelected) {
      debug.push("No period navigation needed — may be directly on borrador view");
    }

    // ── STEP 5: Parse the F.572 detail ──
    debug.push("=== STEP 5: Parse F.572 detail ===");

    // Take another snapshot after navigation
    const detailPageInfo = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const tables = Array.from(document.querySelectorAll("table")).map(t => {
        const headers = Array.from(t.querySelectorAll("thead th, tr:first-child th")).map(h => (h.textContent || "").trim());
        const rows = Array.from(t.querySelectorAll("tbody tr, tr")).slice(0, 50).map(r =>
          Array.from(r.querySelectorAll("td")).map(c => (c.textContent || "").trim())
        ).filter(r => r.length > 0 && r.some(c => c.length > 0));
        return { headers, rows };
      });
      const sections = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, .section-title, [class*='titulo'], [class*='header'], legend, .panel-title, .card-header")).map(s => ({
        tag: s.tagName,
        text: (s.textContent || "").trim().substring(0, 100),
        className: (s as HTMLElement).className?.substring(0, 60) || "",
      }));
      const tabs = Array.from(document.querySelectorAll('[role="tab"], .nav-link, .ui-tabs-nav li a, .p-tabmenuitem a')).map(t => ({
        text: (t.textContent || "").trim().substring(0, 60),
        active: (t as HTMLElement).classList?.contains("active") || (t as HTMLElement).getAttribute("aria-selected") === "true",
      }));

      return { bodyPreview: bodyText.substring(0, 5000), tables, sections, tabs };
    });

    debug.push(`Detail sections: ${JSON.stringify(detailPageInfo.sections)}`);
    debug.push(`Detail tabs: ${JSON.stringify(detailPageInfo.tabs)}`);
    debug.push(`Detail tables: ${detailPageInfo.tables.length}`);
    for (let i = 0; i < detailPageInfo.tables.length; i++) {
      debug.push(`Detail table ${i} headers: ${JSON.stringify(detailPageInfo.tables[i].headers)}`);
      debug.push(`Detail table ${i} rows (first 5): ${JSON.stringify(detailPageInfo.tables[i].rows.slice(0, 5))}`);
    }
    debug.push(`Detail body: ${detailPageInfo.bodyPreview.substring(0, 2000)}`);

    // ── Parse the data from whatever structure we find ──
    const result: SiradigDetail = {
      ...emptyResult,
      debug,
    };

    // Extract period info from page text
    const bodyText = detailPageInfo.bodyPreview;
    const periodoMatch = bodyText.match(/per[ií]odo[:\s]*(\d{2}\/\d{4}|\w+\s+\d{4})/i);
    if (periodoMatch) result.periodo = periodoMatch[1];

    const estadoMatch = bodyText.match(/(presentad[ao]|borrador|vigente)/i);
    if (estadoMatch) result.estado = estadoMatch[1];

    const tipoMatch = bodyText.match(/(original|rectificativa(?:\s*n[°ºo]?\s*\d+)?)/i);
    if (tipoMatch) result.tipo = tipoMatch[1];

    const nroMatch = bodyText.match(/transacci[oó]n[:\s]*(\d+)/i);
    if (nroMatch) result.nroTransaccion = nroMatch[1];

    // ── Parse tables by trying to identify which section they belong to ──
    // We look at surrounding headings/labels to identify sections

    for (const table of detailPageInfo.tables) {
      const headerText = table.headers.join(" ").toLowerCase();
      const allRowText = table.rows.map(r => r.join(" ")).join(" ").toLowerCase();

      // Section 1: Cargas de familia
      if (/carga|familia|c[oó]nyuge|hijo|cuil.*parentesco|parentesco.*cuil/i.test(headerText + " " + allRowText)) {
        debug.push("Found cargas de familia table");
        for (const row of table.rows) {
          const rowText = row.join(" ");
          if (/c[oó]nyuge|esposa|esposo|conviviente/i.test(rowText)) {
            result.cargasFamilia.push(parseCargaFamilia(row, "conyuge"));
          } else if (/incapacitad/i.test(rowText)) {
            result.cargasFamilia.push(parseCargaFamilia(row, "hijo_incapacitado"));
          } else if (/hijo|hija/i.test(rowText)) {
            result.cargasFamilia.push(parseCargaFamilia(row, "hijo"));
          } else if (row.some(c => /^\d{2}-\d{8}-\d$/.test(c) || /^\d{11}$/.test(c.replace(/\D/g, "")))) {
            // Has CUIL but no clear type label — infer from context
            result.cargasFamilia.push(parseCargaFamilia(row, "hijo"));
          }
        }
        continue;
      }

      // Section 2: Otros empleadores
      if (/empleador|pluriempleo|otros ingresos|rem(une)?rac|sueldo bruto/i.test(headerText + " " + allRowText)) {
        debug.push("Found otros empleadores table");
        for (const row of table.rows) {
          const cuitMatch = row.find(c => /^\d{2}-?\d{8}-?\d$/.test(c.replace(/\s/g, "")));
          if (cuitMatch) {
            result.otrosEmpleadores.push(parseOtroEmpleador(row));
          }
        }
        continue;
      }

      // Section 4: Retenciones (check before section 3 since some keywords overlap)
      if (/retenci[oó]n|percepci[oó]n|pago a cuenta|impuesto.*cheque|aduaner/i.test(headerText + " " + allRowText)) {
        debug.push("Found retenciones table");
        for (const row of table.rows) {
          if (row.length >= 2 && row.some(c => /\d/.test(c))) {
            result.retenciones4.push(parseRetencion4(row));
          }
        }
        continue;
      }

      // Section 3: Deducciones (catch-all for remaining tables with amounts)
      if (/deducci[oó]n|desgravaci[oó]n|concepto|monto|prestador|alquiler|prepaga|m[eé]dico|seguro|donaci/i.test(headerText + " " + allRowText)) {
        debug.push("Found deducciones table");
        for (const row of table.rows) {
          if (row.length >= 2 && row.some(c => /[\d.,]+/.test(c) && parseArgNumber(c) > 0)) {
            result.deducciones3.push(parseDeduccion3(row));
          }
        }
        continue;
      }
    }

    // ── If we found tabs, try clicking each one to parse more data ──
    if (detailPageInfo.tabs.length > 0) {
      debug.push("=== Parsing tabs ===");
      for (const tab of detailPageInfo.tabs) {
        if (tab.active) continue; // Already parsed the active tab
        const tabText = tab.text.toLowerCase();

        // Only click tabs that look like F.572 sections
        if (!/carga|familia|empleador|pluriempleo|deducci|desgravac|retenci|percepci/i.test(tabText)) continue;

        debug.push(`Clicking tab: ${tab.text}`);
        try {
          await page.getByText(tab.text, { exact: false }).first().click({ timeout: 5000 });
          await page.waitForTimeout(2000);

          // Parse the newly visible content
          const tabContent = await page.evaluate(() => {
            const tables = Array.from(document.querySelectorAll("table")).map(t => {
              const headers = Array.from(t.querySelectorAll("thead th, tr:first-child th")).map(h => (h.textContent || "").trim());
              const rows = Array.from(t.querySelectorAll("tbody tr, tr")).slice(0, 50).map(r =>
                Array.from(r.querySelectorAll("td")).map(c => (c.textContent || "").trim())
              ).filter(r => r.length > 0 && r.some(c => c.length > 0));
              return { headers, rows };
            });
            return { tables };
          });

          for (const table of tabContent.tables) {
            const hdr = table.headers.join(" ").toLowerCase();
            const allRows = table.rows.map(r => r.join(" ")).join(" ").toLowerCase();

            if (/carga|familia|c[oó]nyuge|hijo/i.test(tabText) && result.cargasFamilia.length === 0) {
              for (const row of table.rows) {
                const rt = row.join(" ");
                if (/c[oó]nyuge|conviviente/i.test(rt)) result.cargasFamilia.push(parseCargaFamilia(row, "conyuge"));
                else if (/incapacitad/i.test(rt)) result.cargasFamilia.push(parseCargaFamilia(row, "hijo_incapacitado"));
                else if (/hijo|hija/i.test(rt)) result.cargasFamilia.push(parseCargaFamilia(row, "hijo"));
              }
            } else if (/empleador|pluriempleo/i.test(tabText) && result.otrosEmpleadores.length === 0) {
              for (const row of table.rows) {
                if (row.some(c => /\d{2}-?\d{8}-?\d/.test(c))) result.otrosEmpleadores.push(parseOtroEmpleador(row));
              }
            } else if (/retenci|percepci/i.test(tabText) && result.retenciones4.length === 0) {
              for (const row of table.rows) {
                if (row.some(c => /\d/.test(c))) result.retenciones4.push(parseRetencion4(row));
              }
            } else if (/deducci|desgravac/i.test(tabText) && result.deducciones3.length === 0) {
              for (const row of table.rows) {
                if (row.some(c => parseArgNumber(c) > 0)) result.deducciones3.push(parseDeduccion3(row));
              }
            }
          }
        } catch (e) {
          debug.push(`Tab click failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }
    }

    // ── Fallback: Parse from body text if tables didn't yield results ──
    if (result.deducciones3.length === 0 && result.cargasFamilia.length === 0) {
      debug.push("=== Fallback: parsing from body text ===");
      const lines = bodyText.split("\n").map(l => l.trim()).filter(l => l.length > 0);

      let currentSection = "";
      for (const line of lines) {
        if (/cargas?\s+de?\s+familia/i.test(line)) { currentSection = "cargas"; continue; }
        if (/otros?\s+empleador|pluriempleo/i.test(line)) { currentSection = "empleadores"; continue; }
        if (/deducci[oó]n|desgravaci[oó]n/i.test(line)) { currentSection = "deducciones"; continue; }
        if (/retenci[oó]n|percepci[oó]n/i.test(line)) { currentSection = "retenciones"; continue; }

        // Try to extract data from text lines
        const amountMatch = line.match(/\$?\s*([\d.,]+(?:\.\d{2})?)/);
        const cuitMatch = line.match(/(\d{2}-\d{8}-\d)/);

        if (currentSection === "deducciones" && amountMatch) {
          const amount = parseArgNumber(amountMatch[1]);
          if (amount > 0) {
            result.deducciones3.push({
              concepto: line.substring(0, 60),
              descripcion: line,
              cuitPrestador: cuitMatch?.[1] || "",
              montoMensual: 0,
              montoAnual: amount,
              mesDesde: 1,
              mesHasta: 12,
              categoriaDeduxi: mapConceptToCategory(line),
            });
          }
        }
      }
    }

    debug.push(`=== RESULTS ===`);
    debug.push(`Cargas: ${result.cargasFamilia.length}`);
    debug.push(`Otros empleadores: ${result.otrosEmpleadores.length}`);
    debug.push(`Deducciones Sec3: ${result.deducciones3.length}`);
    debug.push(`Retenciones Sec4: ${result.retenciones4.length}`);

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    debug.push(`FATAL ERROR: ${message}`);
    return { ...emptyResult, debug };
  }
}

// ── Parsing helpers ──

function parseCargaFamilia(row: string[], tipo: string): SiradigCargaFamilia {
  const rowText = row.join(" ");
  const cuilMatch = rowText.match(/(\d{2}-?\d{8}-?\d)/);
  const pctMatch = rowText.match(/(50|100)\s*%/);
  const montoMatch = row.find(c => parseArgNumber(c) > 1000); // amounts are typically > $1000
  const mesDesdeMatch = rowText.match(/desde[:\s]*(\d{1,2})/i);
  const mesHastaMatch = rowText.match(/hasta[:\s]*(\d{1,2})/i);
  // Try to find name (longest text cell that's not a number/CUIL)
  const nombre = row.find(c => c.length > 5 && !/^\d/.test(c) && !/c[oó]nyuge|hijo|incapac/i.test(c)) || "";

  return {
    tipo,
    cuil: cuilMatch ? cuilMatch[1].replace(/\D/g, "") : "",
    nombre,
    porcentaje: pctMatch ? parseInt(pctMatch[1]) : 100,
    mesDesde: mesDesdeMatch ? parseInt(mesDesdeMatch[1]) : 1,
    mesHasta: mesHastaMatch ? parseInt(mesHastaMatch[1]) : 12,
    montoAnual: montoMatch ? parseArgNumber(montoMatch) : 0,
  };
}

function parseOtroEmpleador(row: string[]): SiradigOtroEmpleador {
  const rowText = row.join(" ");
  const cuitMatch = rowText.match(/(\d{2}-?\d{8}-?\d)/);
  // Find amounts (there may be multiple: sueldo, retención, aportes)
  const amounts = row.map(c => parseArgNumber(c)).filter(n => n > 0);
  const razonSocial = row.find(c => c.length > 5 && !/^\d/.test(c) && !/\d{2}-\d{8}/.test(c)) || "";
  const mesDesdeMatch = rowText.match(/desde[:\s]*(\d{1,2})/i);
  const mesHastaMatch = rowText.match(/hasta[:\s]*(\d{1,2})/i);

  return {
    cuit: cuitMatch ? cuitMatch[1] : "",
    razonSocial,
    sueldoBruto: amounts[0] || 0,
    retencionGanancias: amounts[1] || 0,
    aporteSegSocial: amounts[2] || 0,
    aporteObraSocial: amounts[3] || 0,
    aporteSindical: amounts[4] || 0,
    mesDesde: mesDesdeMatch ? parseInt(mesDesdeMatch[1]) : 1,
    mesHasta: mesHastaMatch ? parseInt(mesHastaMatch[1]) : 12,
  };
}

function parseDeduccion3(row: string[]): SiradigDeduccion3 {
  const rowText = row.join(" ");
  const cuitMatch = rowText.match(/(\d{2}-?\d{8}-?\d)/);
  const amounts = row.map(c => parseArgNumber(c)).filter(n => n > 0);
  // First cell is usually the concept, find the text-heavy cells
  const textCells = row.filter(c => c.length > 3 && !/^[\d$.,\s]+$/.test(c));
  const concepto = textCells[0] || row[0] || "";
  const descripcion = textCells[1] || textCells[0] || "";
  const mesDesdeMatch = rowText.match(/desde[:\s]*(\d{1,2})/i);
  const mesHastaMatch = rowText.match(/hasta[:\s]*(\d{1,2})/i);

  return {
    concepto,
    descripcion,
    cuitPrestador: cuitMatch ? cuitMatch[1] : "",
    montoMensual: amounts.length > 1 ? amounts[0] : 0,
    montoAnual: amounts.length > 1 ? amounts[1] : amounts[0] || 0,
    mesDesde: mesDesdeMatch ? parseInt(mesDesdeMatch[1]) : 1,
    mesHasta: mesHastaMatch ? parseInt(mesHastaMatch[1]) : 12,
    categoriaDeduxi: mapConceptToCategory(concepto),
  };
}

function parseRetencion4(row: string[]): SiradigRetencion4 {
  const rowText = row.join(" ");
  const cuitMatch = rowText.match(/(\d{2}-?\d{8}-?\d)/);
  const amounts = row.map(c => parseArgNumber(c)).filter(n => n > 0);
  const textCells = row.filter(c => c.length > 3 && !/^[\d$.,\s]+$/.test(c));
  const tipo = textCells[0] || row[0] || "";
  const descripcion = textCells[1] || "";
  const periodoMatch = rowText.match(/(\d{2}\/\d{4})/);

  return {
    tipo,
    cuitAgente: cuitMatch ? cuitMatch[1] : "",
    descripcion,
    monto: amounts[0] || 0,
    periodo: periodoMatch?.[1] || "",
    categoriaDeduxi: mapConceptToCategory(tipo),
  };
}
