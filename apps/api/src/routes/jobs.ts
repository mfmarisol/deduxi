import type { FastifyPluginAsync } from "fastify";
import { jobs } from "@deduxi/db";
import { eq, and } from "drizzle-orm";
import { SiradigStep } from "@deduxi/queue";
import type { SiradigJobData } from "@deduxi/queue";

const jobRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.post<{
    Body: {
      taxpayerId: number;
      cuit: string;
      deductions: Array<{
        tipoDeduccion: string;
        cuitPrestador: string;
        descripcion: string;
        monto: number;
        periodo: string;
      }>;
    };
  }>("/", async (request, reply) => {
    const { userId } = request.user;
    const { taxpayerId, cuit, deductions } = request.body;

    // Create DB record
    const [job] = await fastify.db
      .insert(jobs)
      .values({
        userId,
        taxpayerId,
        status: "pending",
        type: "siradig-upload",
        payload: { deductions },
        step: SiradigStep.INITIAL,
      })
      .returning();

    // Add to queue
    const jobData: SiradigJobData = {
      userId,
      taxpayerId,
      cuit,
      deductions,
      step: SiradigStep.INITIAL,
    };

    await fastify.siradigQueue.add(`siradig-${job.id}`, jobData, {
      jobId: String(job.id),
    });

    return reply.code(201).send({
      id: job.id,
      status: job.status,
      step: job.step,
    });
  });

  fastify.get("/", async (request) => {
    const { userId } = request.user;
    const result = await fastify.db
      .select()
      .from(jobs)
      .where(eq(jobs.userId, userId))
      .orderBy(jobs.createdAt);
    return result;
  });

  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { userId } = request.user;
    const id = parseInt(request.params.id);

    const [job] = await fastify.db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.userId, userId)))
      .limit(1);

    if (!job) {
      return reply.notFound("Job not found");
    }
    return job;
  });
};

export default jobRoutes;
