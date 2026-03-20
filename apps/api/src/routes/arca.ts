import type { FastifyPluginAsync } from "fastify";
import {
  createSession,
  getSession,
  createExtraPage,
  destroySession,
  listSessions,
} from "../services/browser-sessions.js";
import {
  startAfipLogin,
  completeAfipLogin,
} from "@deduxi/siradig";
import { fetchComprobantes } from "@deduxi/siradig";
import { refreshCaptcha } from "@deduxi/siradig";
import { fetchSiradigPresentaciones, fetchSiradigDetail } from "@deduxi/siradig";
import { fetchCasasParticulares } from "@deduxi/siradig";
import { fetchMirequaPercepciones, filterPercepciones35 } from "@deduxi/siradig";
import { fetchAportesEnLinea } from "@deduxi/siradig";

/** Validate CUIT is exactly 11 digits (after stripping dashes/spaces) */
function isValidCuit(cuit: unknown): cuit is string {
  if (typeof cuit !== "string") return false;
  return /^\d{11}$/.test(cuit.replace(/[-\s]/g, ""));
}

/** Validate sessionId is a non-empty string */
function isValidSessionId(sessionId: unknown): sessionId is string {
  return typeof sessionId === "string" && sessionId.length > 0;
}

/** Return a safe error message — never leak internal details */
function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Allow known domain errors through
    const knownErrors = [
      "captcha_incorrecto",
      "clave_incorrecta",
      "sesion_expirada",
      "cuit_no_encontrado",
      "servicio_no_disponible",
    ];
    if (knownErrors.includes(err.message)) return err.message;
  }
  return "Error interno";
}

/**
 * ARCA routes backed by real Playwright browser sessions.
 * Phase 1 (start): opens browser, navigates to AFIP login, enters CUIT, returns captcha.
 * Phase 2 (complete): enters clave fiscal + captcha, logs in, scrapes comprobantes.
 */
const arcaRoutes: FastifyPluginAsync = async (fastify) => {
  // Stricter rate limit for ARCA routes (each opens a Playwright browser)
  const arcaRateLimit = {
    config: {
      rateLimit: { max: 5, timeWindow: "1 minute" },
    },
  };

  // POST /api/arca/start - Phase 1: Enter CUIT, get captcha
  fastify.post<{ Body: { cuit: string } }>(
    "/arca/start",
    arcaRateLimit,
    async (request, reply) => {
      const { cuit } = request.body;

      if (!isValidCuit(cuit)) {
        return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      }

      try {
        const { sessionId, page } = await createSession(cuit);
        const result = await startAfipLogin(page, cuit);

        if (!result.success) {
          await destroySession(sessionId);
          return { ok: false, error: result.error };
        }

        return {
          ok: true,
          sessionId,
          captcha: result.captchaBase64 || null,
        };
      } catch (err) {
        fastify.log.error(err, "arca/start error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      }
    },
  );

  // POST /api/arca/complete - Phase 2: Enter clave + captcha, login, get comprobantes
  fastify.post<{
    Body: { sessionId: string; clave: string; captchaSolution: string; cuit: string };
  }>("/arca/complete", async (request, reply) => {
    const { sessionId, clave, captchaSolution, cuit } = request.body;

    if (!isValidCuit(cuit)) {
      return reply.code(400).send({ ok: false, error: "CUIT inválido" });
    }
    if (!isValidSessionId(sessionId)) {
      return reply.code(400).send({ ok: false, error: "sessionId inválido" });
    }

    const page = getSession(sessionId, cuit);
    if (!page) {
      return { ok: false, error: "sesion_expirada" };
    }

    try {
      const loginResult = await completeAfipLogin(page, clave, captchaSolution);

      if (!loginResult.success) {
        if (loginResult.error === "captcha_incorrecto") {
          // Don't destroy session, let them retry
          // Get new captcha
          const newCaptcha = await refreshCaptcha(page);
          return { ok: false, error: "captcha_incorrecto", captcha: newCaptcha };
        }
        await destroySession(sessionId);
        return { ok: false, error: loginResult.error };
      }

      // Login successful - fetch comprobantes
      const periodo = new Date().toISOString().slice(0, 7); // current month
      fastify.log.info({ periodo, cuit }, "Fetching comprobantes after login");

      const { comprobantes, debug } = await fetchComprobantes(page, cuit, periodo);
      fastify.log.info({ compCount: comprobantes.length, debugLines: debug.length }, "Comprobantes fetched");
      // Log each debug line separately so nothing gets truncated
      for (const line of debug) {
        fastify.log.info({ scraperDebug: line }, "scraper");
      }

      return {
        ok: true,
        comprobantes,
        compDebug: debug,
      };
    } catch (err) {
      fastify.log.error(err, "arca/complete error");
      await destroySession(sessionId);
      return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
    }
  });

  // POST /api/arca/fetch-comprobantes - Fetch comprobantes for a specific period
  fastify.post<{ Body: { sessionId: string; periodo: string; cuit: string } }>(
    "/arca/fetch-comprobantes",
    async (request, reply) => {
      const { sessionId, periodo, cuit } = request.body;

      if (!isValidCuit(cuit)) {
        return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      }
      if (!isValidSessionId(sessionId)) {
        return reply.code(400).send({ ok: false, error: "sessionId inválido" });
      }

      const page = getSession(sessionId, cuit);
      if (!page) {
        return { ok: false, error: "sesion_expirada" };
      }

      try {
        const { comprobantes, debug } = await fetchComprobantes(page, cuit, periodo);
        fastify.log.info({ compCount: comprobantes.length, debug: debug.join(" | ") }, "fetch-comprobantes result");
        return { ok: true, comprobantes, compDebug: debug, debugLog: debug };
      } catch (err) {
        fastify.log.error(err, "arca/fetch-comprobantes error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      }
    },
  );

  // POST /api/arca/refresh-captcha - Get new captcha image
  fastify.post<{ Body: { sessionId: string } }>(
    "/arca/refresh-captcha",
    async (request, reply) => {
      const { sessionId } = request.body;

      if (!isValidSessionId(sessionId)) {
        return reply.code(400).send({ ok: false, error: "sessionId inválido" });
      }

      const page = getSession(sessionId);
      if (!page) {
        return { ok: false, error: "sesion_expirada" };
      }

      const captcha = await refreshCaptcha(page);
      return {
        ok: !!captcha,
        captcha,
      };
    },
  );

  // POST /api/arca/fetch-siradig - Fetch SiRADIG presentaciones and deducciones
  fastify.post<{ Body: { sessionId: string; cuit: string } }>(
    "/arca/fetch-siradig",
    async (request, reply) => {
      const { sessionId, cuit } = request.body;

      if (!isValidCuit(cuit)) {
        return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      }
      if (!isValidSessionId(sessionId)) {
        return reply.code(400).send({ ok: false, error: "sessionId inválido" });
      }

      const page = getSession(sessionId, cuit);
      if (!page) {
        return { ok: false, error: "sesion_expirada" };
      }

      try {
        const { presentaciones, deducciones, debug } = await fetchSiradigPresentaciones(page, cuit);
        fastify.log.info({ presCount: presentaciones.length, dedCount: deducciones.length }, "SiRADIG fetched");
        for (const line of debug) {
          fastify.log.info({ siradigDebug: line }, "siradig-scraper");
        }
        return { ok: true, presentaciones, deducciones, siradigDebug: debug };
      } catch (err) {
        fastify.log.error(err, "arca/fetch-siradig error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      }
    },
  );
  // POST /api/arca/fetch-siradig-detail - Fetch FULL detail of latest SiRADIG F.572
  fastify.post<{ Body: { sessionId: string; cuit: string; periodo?: string } }>(
    "/arca/fetch-siradig-detail",
    async (request, reply) => {
      const { sessionId, cuit, periodo } = request.body;

      if (!isValidCuit(cuit)) {
        return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      }
      if (!isValidSessionId(sessionId)) {
        return reply.code(400).send({ ok: false, error: "sessionId inválido" });
      }

      // Use a separate page to avoid disrupting the main session
      const mainPage = getSession(sessionId, cuit);
      if (!mainPage) {
        return { ok: false, error: "sesion_expirada" };
      }

      const page = await createExtraPage(sessionId, cuit);
      if (!page) {
        return { ok: false, error: "sesion_expirada" };
      }

      try {
        const detail = await fetchSiradigDetail(page, cuit, periodo);
        fastify.log.info(
          {
            cargas: detail.cargasFamilia.length,
            empleadores: detail.otrosEmpleadores.length,
            deducciones: detail.deducciones3.length,
            retenciones: detail.retenciones4.length,
          },
          "SiRADIG detail fetched",
        );
        for (const line of detail.debug) {
          fastify.log.info({ siradigDetailDebug: line }, "siradig-detail");
        }
        return { ok: true, detail };
      } catch (err) {
        fastify.log.error(err, "arca/fetch-siradig-detail error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      } finally {
        try { await page.close(); } catch {}
      }
    },
  );

  // POST /api/arca/fetch-casas-particulares - Fetch domestic worker data
  fastify.post<{ Body: { sessionId: string; cuit: string } }>(
    "/arca/fetch-casas-particulares",
    async (request, reply) => {
      const { sessionId, cuit } = request.body;

      if (!isValidCuit(cuit)) {
        return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      }
      if (!isValidSessionId(sessionId)) {
        return reply.code(400).send({ ok: false, error: "sessionId inválido" });
      }

      // Verify session exists
      const mainPage = getSession(sessionId, cuit);
      if (!mainPage) {
        return { ok: false, error: "sesion_expirada" };
      }

      // Use a separate page so we don't disrupt the main page
      const page = await createExtraPage(sessionId, cuit);
      if (!page) {
        return { ok: false, error: "sesion_expirada" };
      }

      try {
        const result = await fetchCasasParticulares(page, cuit);
        fastify.log.info(
          { workers: result.workers.length, payments: result.payments.length, totalDeducible: result.totalDeducible },
          "Casas Particulares fetched",
        );
        for (const line of result.debug) {
          fastify.log.info({ casasDebug: line }, "casas-particulares");
        }
        return { ok: true, ...result };
      } catch (err) {
        fastify.log.error(err, "arca/fetch-casas-particulares error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      } finally {
        try { await page.close(); } catch {}
      }
    },
  );
  // POST /api/arca/fetch-retenciones - Fetch percepciones/retenciones from Mirequa
  fastify.post<{
    Body: { sessionId: string; cuit: string; fechaDesde?: string; fechaHasta?: string };
  }>("/arca/fetch-retenciones", async (request, reply) => {
    const { sessionId, cuit, fechaDesde, fechaHasta } = request.body;

    if (!isValidCuit(cuit)) {
      return reply.code(400).send({ ok: false, error: "CUIT inválido" });
    }
    if (!isValidSessionId(sessionId)) {
      return reply.code(400).send({ ok: false, error: "sessionId inválido" });
    }

    const mainPage = getSession(sessionId, cuit);
    if (!mainPage) {
      return { ok: false, error: "sesion_expirada" };
    }

    // Use a separate page so it can run in parallel with other scrapers
    const page = await createExtraPage(sessionId, cuit);
    if (!page) {
      return { ok: false, error: "sesion_expirada" };
    }

    try {
      // Default date range: Jan 1 of current year to today
      const now = new Date();
      const desde = fechaDesde || `01/01/${now.getFullYear()}`;
      const hasta = fechaHasta || `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

      const result = await fetchMirequaPercepciones(page, cuit, desde, hasta);
      const percepciones35 = filterPercepciones35(result.retenciones);

      fastify.log.info(
        { total: result.retenciones.length, percepciones35: percepciones35.length, importe: result.totalImporte },
        "Mirequa fetched",
      );
      for (const line of result.debug) {
        fastify.log.info({ mirequaDebug: line }, "mirequa-scraper");
      }

      return {
        ok: true,
        retenciones: result.retenciones,
        percepciones35,
        totalImporte: result.totalImporte,
        totalPercepciones35: percepciones35.reduce((s, r) => s + r.importe, 0),
        mirequaDebug: result.debug,
      };
    } catch (err) {
      fastify.log.error(err, "arca/fetch-retenciones error");
      return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
    } finally {
      try { await page.close(); } catch {}
    }
  });

  // GET /api/arca/sessions - Diagnostic: list active sessions
  fastify.get("/arca/sessions", async () => {
    return listSessions();
  });

  // POST /api/arca/services - Diagnostic: dump raw service list from portal
  fastify.post<{ Body: { sessionId: string; cuit: string } }>(
    "/arca/services",
    async (request, reply) => {
      const { sessionId, cuit } = request.body;
      if (!isValidCuit(cuit)) return reply.code(400).send({ ok: false, error: "CUIT inválido" });
      if (!isValidSessionId(sessionId)) return reply.code(400).send({ ok: false, error: "sessionId inválido" });

      const page = getSession(sessionId, cuit);
      if (!page) return { ok: false, error: "sesion_expirada" };

      try {
        if (!page.url().includes("portalcf.cloud.afip.gob.ar")) {
          await page.goto("https://portalcf.cloud.afip.gob.ar/portal/app/", {
            waitUntil: "networkidle",
            timeout: 30000,
          });
          await page.waitForTimeout(2000);
        }

        const result = await page.evaluate(async (c: string) => {
          const resp = await fetch(`/portal/api/servicios/${c}`, { credentials: "include" });
          if (!resp.ok) return { ok: false, status: resp.status };
          const services = await resp.json();
          if (!Array.isArray(services)) return { ok: false, type: typeof services, keys: Object.keys(services || {}) };
          return {
            ok: true,
            count: services.length,
            keys: services.length > 0 ? Object.keys(services[0]) : [],
            first3: services.slice(0, 3),
            // Find any service with aportes/casas/domestico in any field
            matching: services.filter((s: any) => {
              const text = JSON.stringify(s).toLowerCase();
              return /aportes|casas|dom[eé]stic|personal.*particular|regimen/i.test(text);
            }),
          };
        }, cuit.replace(/\D/g, ""));

        fastify.log.info(result, "Service list diagnostic");
        return result;
      } catch (err) {
        fastify.log.error(err, "arca/services error");
        return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
      }
    },
  );

  // POST /api/arca/fetch-aportes - Fetch payroll data from Aportes en Línea
  fastify.post<{
    Body: { sessionId: string; cuit: string; periodoDesde?: string; periodoHasta?: string };
  }>("/arca/fetch-aportes", async (request, reply) => {
    const { sessionId, cuit, periodoDesde, periodoHasta } = request.body;

    if (!isValidCuit(cuit)) {
      return reply.code(400).send({ ok: false, error: "CUIT inválido" });
    }
    if (!isValidSessionId(sessionId)) {
      return reply.code(400).send({ ok: false, error: "sessionId inválido" });
    }

    // Verify session exists
    const mainPage = getSession(sessionId, cuit);
    if (!mainPage) {
      return { ok: false, error: "sesion_expirada" };
    }

    // Use a separate page so we don't disrupt the main page
    const page = await createExtraPage(sessionId, cuit);
    if (!page) {
      return { ok: false, error: "sesion_expirada" };
    }

    try {
      // Default: last 12 months
      const now = new Date();
      const desde = periodoDesde || `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear() - 1}`;
      const hasta = periodoHasta || `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

      const result = await fetchAportesEnLinea(page, cuit, desde, hasta);
      fastify.log.info(
        { empleador: result.empleador, periodos: result.periodos.length },
        "Aportes en Línea fetched",
      );
      for (const line of result.debug) {
        fastify.log.info({ aportesDebug: line }, "aportes-scraper");
      }

      return {
        ok: true,
        empleador: result.empleador,
        cuitEmpleador: result.cuitEmpleador,
        empleadoNombre: result.empleadoNombre,
        periodos: result.periodos,
        aportesDebug: result.debug,
      };
    } catch (err) {
      fastify.log.error(err, "arca/fetch-aportes error");
      return reply.code(500).send({ ok: false, error: safeErrorMessage(err) });
    } finally {
      try { await page.close(); } catch {}
    }
  });
};

export default arcaRoutes;
