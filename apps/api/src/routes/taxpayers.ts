import type { FastifyPluginAsync } from "fastify";
import { taxpayers } from "@deduxi/db";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@deduxi/crypto";

const taxpayerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/", async (request) => {
    const { userId } = request.user;
    const result = await fastify.db
      .select({
        id: taxpayers.id,
        cuit: taxpayers.cuit,
        name: taxpayers.name,
        createdAt: taxpayers.createdAt,
      })
      .from(taxpayers)
      .where(eq(taxpayers.userId, userId));
    return result;
  });

  fastify.post<{ Body: { cuit: string; claveFiscal: string; name?: string } }>(
    "/",
    async (request, reply) => {
      const { userId } = request.user;
      const { cuit, claveFiscal, name } = request.body;

      if (!cuit || !claveFiscal) {
        return reply.badRequest("CUIT and clave fiscal are required");
      }

      const encrypted = encrypt(claveFiscal, process.env.ENCRYPTION_KEY!);

      const [tp] = await fastify.db
        .insert(taxpayers)
        .values({
          userId,
          cuit,
          encryptedClaveFiscal: encrypted.ciphertext,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          name: name || null,
        })
        .returning({
          id: taxpayers.id,
          cuit: taxpayers.cuit,
          name: taxpayers.name,
        });

      return reply.code(201).send(tp);
    },
  );

  fastify.delete<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      const { userId } = request.user;
      const id = parseInt(request.params.id);

      const deleted = await fastify.db
        .delete(taxpayers)
        .where(and(eq(taxpayers.id, id), eq(taxpayers.userId, userId)))
        .returning({ id: taxpayers.id });

      if (deleted.length === 0) {
        return reply.notFound("Taxpayer not found");
      }
      return { ok: true };
    },
  );
};

export default taxpayerRoutes;
