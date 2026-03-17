import type { Redis } from "ioredis";

const SESSION_PREFIX = "session:";
const DEFAULT_TTL = 1800; // 30 minutes

export async function getStorageState(
  redis: Redis,
  cuit: string,
): Promise<string | null> {
  return redis.get(`${SESSION_PREFIX}${cuit}`);
}

export async function saveStorageState(
  redis: Redis,
  cuit: string,
  state: string,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<void> {
  await redis.set(`${SESSION_PREFIX}${cuit}`, state, "EX", ttlSeconds);
}

export async function deleteStorageState(
  redis: Redis,
  cuit: string,
): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${cuit}`);
}
