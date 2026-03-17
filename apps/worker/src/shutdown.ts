import type { Worker } from "bullmq";
import type { Browser } from "playwright";

const SHUTDOWN_TIMEOUT = 300000; // 5 minutes

export function setupGracefulShutdown(
  worker: Worker,
  getBrowser?: () => Browser | undefined,
): void {
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);

    const forceExit = setTimeout(async () => {
      console.error("Shutdown timeout reached, forcing exit");
      const browser = getBrowser?.();
      if (browser) {
        await browser.close().catch(() => {});
      }
      process.exit(1);
    }, SHUTDOWN_TIMEOUT);

    try {
      await worker.close();
      const browser = getBrowser?.();
      if (browser) {
        await browser.close();
      }
      clearTimeout(forceExit);
      console.log("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      console.error("Error during shutdown:", err);
      clearTimeout(forceExit);
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
