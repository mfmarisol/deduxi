import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import fastifyJwt from "@fastify/jwt";

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  });

  fastify.decorate("authenticate", async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
};

export default fp(jwtPlugin, { name: "jwt" });
