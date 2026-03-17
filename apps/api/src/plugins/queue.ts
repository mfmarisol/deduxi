import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import type { ConnectionOptions } from "bullmq";
import { createRedisConnection, createSiradigQueue } from "@deduxi/queue";

const queuePlugin: FastifyPluginAsync = async (fastify) => {
  try {
    const connection = createRedisConnection(process.env.REDIS_URL!);
    connection.on("error", (err) => {
      fastify.log.warn({ err: err.message }, "Redis connection error (non-fatal)");
    });
    const queue = createSiradigQueue(connection as unknown as ConnectionOptions);

    fastify.decorate("siradigQueue", queue);

    fastify.addHook("onClose", async () => {
      await queue.close();
      connection.disconnect();
    });
    fastify.log.info("Queue plugin registered");
  } catch (err) {
    fastify.log.warn("Redis/Queue unavailable – queue-dependent routes will fail");
    fastify.decorate("siradigQueue", null as any);
  }
};

export default fp(queuePlugin, { name: "queue" });
