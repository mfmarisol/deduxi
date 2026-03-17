import { Queue, type ConnectionOptions } from "bullmq";
import type { SiradigJobData, SiradigJobResult } from "./types.js";

export const SIRADIG_QUEUE_NAME = "siradig-automation";

export function createSiradigQueue(
  connection: ConnectionOptions,
) {
  return new Queue<SiradigJobData, SiradigJobResult>(SIRADIG_QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: "custom" },
      removeOnComplete: { count: 1000, age: 86400 },
      removeOnFail: { count: 5000, age: 604800 },
    },
  });
}
