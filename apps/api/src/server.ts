import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root — try multiple resolutions with override
const envPaths = [
  resolve(__dirname, "../../../.env"),
  resolve(__dirname, "../../.env"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
];
for (const p of envPaths) {
  const result = config({ path: p, override: true });
  if (!result.error) {
    // dotenv may not set vars in process.env with ESM; force it
    if (result.parsed) {
      for (const [k, v] of Object.entries(result.parsed)) {
        process.env[k] = v;
      }
    }
    break;
  }
}
import "./types.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import dbPlugin from "./plugins/db.js";
import jwtPlugin from "./plugins/jwt.js";
import queuePlugin from "./plugins/queue.js";
import bullBoardPlugin from "./plugins/bull-board.js";
import authRoutes from "./routes/auth.js";
import taxpayerRoutes from "./routes/taxpayers.js";
import jobRoutes from "./routes/jobs.js";
import arcaRoutes from "./routes/arca.js";
import comprobanteRoutes from "./routes/comprobantes.js";
import { destroyAllSessions } from "./services/browser-sessions.js";

async function main() {
  const app = Fastify({ logger: true });

  // Infrastructure plugins
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://deduxi.vercel.app',
      'https://deduxi-deploy.vercel.app',
      'https://web-nu-seven-25.vercel.app',
      /\.vercel\.app$/,
      process.env.FRONTEND_URL,
    ].filter(Boolean) as (string | RegExp)[],
  });
  await app.register(sensible);

  // Rate limiting: global 60 req/min, ARCA routes get stricter limits in arca.ts
  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

  await app.register(dbPlugin);
  await app.register(jwtPlugin);
  await app.register(queuePlugin);
  await app.register(bullBoardPlugin);

  // Route plugins
  await app.register(authRoutes, { prefix: "/auth" });
  await app.register(taxpayerRoutes, { prefix: "/taxpayers" });
  await app.register(jobRoutes, { prefix: "/jobs" });
  await app.register(arcaRoutes, { prefix: "/api" });
  await app.register(comprobanteRoutes, { prefix: "/api" });

  // Clean up Playwright browser sessions on shutdown
  app.addHook("onClose", async () => {
    await destroyAllSessions();
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
