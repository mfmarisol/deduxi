import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import fastifyJwt from "@fastify/jwt";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    fastify.log.warn("JWT_SECRET not set – auth routes will be unavailable");
    fastify.decorate("authenticate", async function (_request, reply) {
      reply.code(503).send({ error: "Auth not configured" });
    });
    return;
  }

  await fastify.register(fastifyJwt, { secret });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
};

export default fp(jwtPlugin, { name: "jwt" });
