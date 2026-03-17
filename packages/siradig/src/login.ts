import type { Page } from "playwright";
import type { ArcaLoginResult } from "./types.js";

const AFIP_LOGIN_URL = "https://auth.afip.gob.ar/contribuyente_/login.xhtml";

/**
 * Initiates login to AFIP/ARCA portal.
 * Phase 1: Navigate to login, enter CUIT, click Siguiente, check for captcha.
 *
 * Real ARCA login page (March 2026):
 * - URL: https://auth.afip.gob.ar/contribuyente_/login.xhtml
 * - CUIT field: <input type="number"> (no id/name visible in accessibility tree)
 * - Button: <button type="submit">Siguiente</button>
 * - After CUIT: shows password field + optional captcha
 */
export async function startAfipLogin(
  page: Page,
  cuit: string,
): Promise<ArcaLoginResult> {
  try {
    // Navigate to AFIP login
    await page.goto(AFIP_LOGIN_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(1500);

    // Wait for CUIT field - it's a type="number" input
    const cuitInput = await page.waitForSelector(
      'input[type="number"], input#F1\\:username, input[name="F1:username"]',
      { timeout: 10000 }
    );
    if (!cuitInput) {
      return { success: false, error: "No se encontró el campo de CUIT" };
    }

    // Clear and fill CUIT (remove hyphens/spaces)
    const cleanCuit = cuit.replace(/[-\s]/g, "");
    await cuitInput.fill(cleanCuit);

    // Click "Siguiente" button
    const siguienteBtn = await page.waitForSelector(
      'button[type="submit"]:has-text("Siguiente"), button:has-text("Siguiente"), #F1\\:btnSiguiente',
      { timeout: 5000 }
    );
    if (siguienteBtn) {
      await siguienteBtn.click();
    } else {
      await cuitInput.press("Enter");
    }

    // Wait for the next phase to load
    await page.waitForTimeout(3000);

    // Check for CUIT error
    const errorElement = await page.$('.msg-error, .error-message, [class*="error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      if (errorText && (errorText.includes("no encontrado") || errorText.includes("inválido") || errorText.includes("inexistente"))) {
        return { success: false, error: "cuit_no_encontrado" };
      }
    }

    // Check for captcha image
    let captchaBase64: string | undefined;
    const captchaImg = await page.$('img[src*="captcha"], img[alt*="captcha"], #captchaImage, .captcha img');
    if (captchaImg) {
      const screenshotBuffer = await captchaImg.screenshot();
      captchaBase64 = `data:image/png;base64,${screenshotBuffer.toString("base64")}`;
    }

    return {
      success: true,
      captchaRequired: !!captchaBase64,
      captchaBase64,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Completes login to AFIP/ARCA portal.
 * Phase 2: Enter clave fiscal + captcha solution, click Ingresar.
 *
 * After successful login, lands on portal at:
 * https://portalcf.cloud.afip.gob.ar/portal/app/
 */
export async function completeAfipLogin(
  page: Page,
  claveFiscal: string,
  captchaSolution?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fill captcha if provided
    if (captchaSolution) {
      const captchaInput = await page.$('input#F1\\:captcha, input[name*="captcha"], input[placeholder*="captcha"]');
      if (captchaInput) {
        await captchaInput.fill(captchaSolution);
      }
    }

    // Fill clave fiscal (password field)
    const passwordInput = await page.waitForSelector(
      'input[type="password"], input#F1\\:password, input[name="F1:password"]',
      { timeout: 10000 }
    );
    if (!passwordInput) {
      return { success: false, error: "No se encontró el campo de clave fiscal" };
    }
    await passwordInput.fill(claveFiscal);

    // Click "Ingresar" button
    const loginBtn = await page.waitForSelector(
      'button[type="submit"]:has-text("Ingresar"), button:has-text("Ingresar"), #F1\\:btnIngresar',
      { timeout: 5000 }
    );
    if (loginBtn) {
      await loginBtn.click();
    } else {
      await passwordInput.press("Enter");
    }

    // Wait for navigation to portal
    try {
      await page.waitForURL("**/portal/**", { timeout: 30000 });
    } catch {
      // Check for error messages
      const errorEl = await page.$('.msg-error, .error-message, [class*="error"]');
      if (errorEl) {
        const errorText = await errorEl.textContent() || "";
        if (errorText.toLowerCase().includes("captcha") || errorText.toLowerCase().includes("código")) {
          return { success: false, error: "captcha_incorrecto" };
        }
        if (errorText.toLowerCase().includes("clave") || errorText.toLowerCase().includes("password") || errorText.toLowerCase().includes("contraseña")) {
          return { success: false, error: "clave_incorrecta" };
        }
        return { success: false, error: errorText.trim() };
      }
      return { success: false, error: "sesion_expirada" };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
