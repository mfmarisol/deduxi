import { chromium, type Browser, type BrowserContext, type LaunchOptions } from "playwright";

const DEFAULT_ARGS = [
  "--disable-dev-shm-usage",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-setuid-sandbox",
];

export async function launchBrowser(options?: LaunchOptions): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: DEFAULT_ARGS,
    ...options,
  });
}

export async function createContext(
  browser: Browser,
  storageState?: string,
): Promise<BrowserContext> {
  return browser.newContext({
    ...(storageState ? { storageState: JSON.parse(storageState) } : {}),
    locale: "es-AR",
    viewport: { width: 1280, height: 720 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  });
}
