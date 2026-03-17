import type { Database } from "@deduxi/db";
import type { Queue } from "bullmq";
import type { SiradigJobData, SiradigJobResult } from "@deduxi/queue";
import type { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    db: Database;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    siradigQueue: Queue<SiradigJobData, SiradigJobResult>;
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: number; email: string };
    user: { userId: number; email: string };
  }
}
