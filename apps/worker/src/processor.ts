import type { Job } from "bullmq";
import type { Redis } from "ioredis";
import type { SiradigJobData, SiradigJobResult } from "@deduxi/queue";
import { SiradigStep } from "@deduxi/queue";
import { createDb, jobs } from "@deduxi/db";
import { decrypt } from "@deduxi/crypto";
import { eq } from "drizzle-orm";
import { getStorageState, saveStorageState } from "./session-store.js";

export function createProcessor(redis: Redis) {
  const db = createDb(process.env.DATABASE_URL!);

  return async function processJob(
    job: Job<SiradigJobData, SiradigJobResult>,
  ): Promise<SiradigJobResult> {
    let step = job.data.step || SiradigStep.INITIAL;

    // Update job status in DB
    await db
      .update(jobs)
      .set({ status: "processing", step })
      .where(eq(jobs.id, parseInt(job.id!)));

    try {
      while (step !== SiradigStep.DONE) {
        switch (step) {
          case SiradigStep.INITIAL: {
            // Check for cached session
            const cached = await getStorageState(redis, job.data.cuit);
            if (cached) {
              job.log("Cached session found, skipping login");
            }
            step = SiradigStep.LOGIN;
            break;
          }

          case SiradigStep.LOGIN: {
            // TODO: Launch browser, login to AFIP
            // Use @deduxi/siradig login functions
            job.log("LOGIN step - not yet implemented");
            step = SiradigStep.CAPTCHA;
            break;
          }

          case SiradigStep.CAPTCHA: {
            // TODO: Solve captcha if required
            job.log("CAPTCHA step - not yet implemented");
            step = SiradigStep.FILL_FORM;
            break;
          }

          case SiradigStep.FILL_FORM: {
            // TODO: Navigate to SiRADIG, fill deductions
            job.log("FILL_FORM step - not yet implemented");
            step = SiradigStep.SUBMIT;
            break;
          }

          case SiradigStep.SUBMIT: {
            // TODO: Submit and verify
            job.log("SUBMIT step - not yet implemented");
            step = SiradigStep.DONE;
            break;
          }
        }

        // Save progress after each step
        await job.updateData({ ...job.data, step });
        await db
          .update(jobs)
          .set({ step })
          .where(eq(jobs.id, parseInt(job.id!)));
      }

      // Mark complete in DB
      await db
        .update(jobs)
        .set({ status: "completed", step: SiradigStep.DONE })
        .where(eq(jobs.id, parseInt(job.id!)));

      return { success: true, message: "SiRADIG submission completed" };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      await db
        .update(jobs)
        .set({ status: "failed", error: errorMsg })
        .where(eq(jobs.id, parseInt(job.id!)));

      throw error; // Re-throw for BullMQ retry
    }
  };
}
