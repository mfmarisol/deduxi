import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { FastifyAdapter } from "@bull-board/fastify";

const bullBoardPlugin: FastifyPluginAsync = async (fastify) => {
  if (!fastify.siradigQueue) {
    fastify.log.warn("Bull Board skipped – queue not available");
    return;
  }
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(fastify.siradigQueue)],
    serverAdapter,
  });

  await fastify.register(serverAdapter.registerPlugin(), {
    prefix: "/admin/queues",
  } as any);
};

export default fp(bullBoardPlugin, {
  name: "bull-board",
  dependencies: ["queue"],
});
