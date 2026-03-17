import type { FastifyPluginAsync } from "fastify";
import bcrypt from "bcrypt";
import { users } from "@deduxi/db";
import { eq } from "drizzle-orm";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { email: string; password: string } }>(
    "/register",
    async (request, reply) => {
      const { email, password } = request.body;
      if (!email || !password) {
        return reply.badRequest("Email and password are required");
      }

      const existing = await fastify.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing.length > 0) {
        return reply.conflict("Email already registered");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const [user] = await fastify.db
        .insert(users)
        .values({ email, passwordHash })
        .returning({ id: users.id, email: users.email });

      const token = fastify.jwt.sign({ userId: user.id, email: user.email });
      return { token, user: { id: user.id, email: user.email } };
    },
  );

  fastify.post<{ Body: { email: string; password: string } }>(
    "/login",
    async (request, reply) => {
      const { email, password } = request.body;
      if (!email || !password) {
        return reply.badRequest("Email and password are required");
      }

      const [user] = await fastify.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return reply.unauthorized("Invalid credentials");
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return reply.unauthorized("Invalid credentials");
      }

      const token = fastify.jwt.sign({ userId: user.id, email: user.email });
      return { token, user: { id: user.id, email: user.email } };
    },
  );

  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request) => {
      const { userId, email } = request.user;
      return { userId, email };
    },
  );
};

export default authRoutes;
