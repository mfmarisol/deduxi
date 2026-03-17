import "dotenv/config";
import { Worker, type ConnectionOptions } from "bullmq";
import { createRedisConnection, SIRADIG_QUEUE_NAME, siradigBackoffStrategy } from "@deduxi/queue";
import { createProcessor } from "./processor.js";
import { setupGracefulShutdown } from "./shutdown.js";

async function main() {
  console.log("Starting Deduxi worker...");

  const connection = createRedisConnection(process.env.REDIS_URL!);
  const processor = createProcessor(connection);

  const worker = new Worker(SIRADIG_QUEUE_NAME, processor, {
    connection: connection as ConnectionOptions,
    concurrency: 3,
    lockDuration: 360000, // 6 min lock for 2-5 min jobs
    settings: {
      backoffStrategy: siradigBackoffStrategy,
    },
  });

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`Job ${jobId} stalled`);
  });

  setupGracefulShutdown(worker);

  console.log(`Worker listening on queue: ${SIRADIG_QUEUE_NAME}`);
  console.log(`Concurrency: 3 | Lock duration: 360s`);
}

main().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
