import { randomUUID } from "node:crypto";
import { launchBrowser, createContext } from "@deduxi/siradig";
import type { Browser, BrowserContext, Page } from "playwright";

interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  extraPages: Page[];
  cuit: string;
  createdAt: number;
}

const sessions = new Map<string, BrowserSession>();
const SESSION_TTL = 15 * 60 * 1000; // 15 minutes

// Cleanup expired sessions and log session count every 60 seconds
setInterval(async () => {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt > SESSION_TTL) {
      await destroySession(id);
    }
  }
  if (sessions.size > 0) {
    console.log(`[browser-sessions] Active sessions: ${sessions.size}`);
  }
}, 60_000);

/** Find an existing session ID for a given CUIT */
function findSessionByCuit(cuit: string): string | null {
  for (const [id, session] of sessions) {
    if (session.cuit === cuit) return id;
  }
  return null;
}

export async function createSession(cuit: string): Promise<{ sessionId: string; page: Page }> {
  // Destroy any existing session for this CUIT before creating a new one
  const existingId = findSessionByCuit(cuit);
  if (existingId) {
    console.log(`[browser-sessions] Destroying existing session for CUIT ${cuit.slice(0, 4)}****`);
    await destroySession(existingId);
  }

  const browser = await launchBrowser();
  const context = await createContext(browser);
  const page = await context.newPage();
  const sessionId = randomUUID();

  sessions.set(sessionId, { browser, context, page, extraPages: [], cuit, createdAt: Date.now() });
  return { sessionId, page };
}

/**
 * Create a new page in the same browser context (shares cookies/auth).
 * Useful for fetching different ARCA services concurrently without
 * disrupting the main page navigation.
 */
export async function createExtraPage(sessionId: string, cuit?: string): Promise<Page | null> {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (cuit && session.cuit !== cuit) return null;
  session.createdAt = Date.now();
  const newPage = await session.context.newPage();
  session.extraPages.push(newPage);
  return newPage;
}

/**
 * Get a session's Page by sessionId.
 * If cuit is provided, validates it matches the session's stored cuit.
 */
export function getSession(sessionId: string, cuit?: string): Page | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (cuit && session.cuit !== cuit) return null;
  // Refresh TTL on access
  session.createdAt = Date.now();
  return session.page;
}

/** List active sessions (diagnostic) */
export function listSessions(): Array<{ sessionId: string; cuit: string }> {
  return Array.from(sessions.entries()).map(([id, s]) => ({ sessionId: id, cuit: s.cuit }));
}

export async function destroySession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (session) {
    sessions.delete(sessionId);
    for (const p of session.extraPages) {
      try { await p.close(); } catch {}
    }
    try { await session.context.close(); } catch {}
    try { await session.browser.close(); } catch {}
  }
}

export async function destroyAllSessions(): Promise<void> {
  for (const id of sessions.keys()) {
    await destroySession(id);
  }
}
