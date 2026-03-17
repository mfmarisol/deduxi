import type { Page } from "playwright";

/**
 * Solves a captcha using 2Captcha service.
 * Takes a screenshot of the captcha element, sends to 2Captcha, returns solution.
 */
export async function solveCaptcha(
  page: Page,
  captchaSelector: string,
  apiKey: string,
): Promise<string> {
  // 2Captcha integration - not needed for now since user solves manually
  throw new Error("Not implemented: solveCaptcha - user solves captcha manually");
}

/**
 * Refreshes the captcha image on the AFIP login page.
 * Returns the new captcha as base64.
 */
export async function refreshCaptcha(page: Page): Promise<string | null> {
  try {
    // Find and click the refresh/reload captcha button
    const refreshBtn = await page.$(
      'a[href*="captcha"], button[onclick*="captcha"], img[onclick*="captcha"], .refresh-captcha, [title*="captcha"]'
    );

    if (refreshBtn) {
      await refreshBtn.click();
      await page.waitForTimeout(1500);
    }

    // Take screenshot of new captcha
    const captchaImg = await page.$(
      'img[src*="captcha"], img[alt*="captcha"], #captchaImage, .captcha img'
    );

    if (captchaImg) {
      const screenshotBuffer = await captchaImg.screenshot();
      return screenshotBuffer.toString("base64");
    }

    return null;
  } catch {
    return null;
  }
}
