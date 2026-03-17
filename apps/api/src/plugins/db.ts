import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { createDb } from "@deduxi/db";

const dbPlugin: FastifyPluginAsync = async (fastify) => {
  try {
    const db = createDb(process.env.DATABASE_URL!);
    fastify.decorate("db", db);
    fastify.log.info("Database connected");
  } catch (err) {
    fastify.log.warn("Database unavailable – DB-dependent routes will fail");
    fastify.decorate("db", null as any);
  }
};

export default fp(dbPlugin, { name: "db" });
