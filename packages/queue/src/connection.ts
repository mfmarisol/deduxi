import { Redis } from "ioredis";

export function createRedisConnection(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: null, // Required for BullMQ workers
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 500, 3000);
    },
  });
}
