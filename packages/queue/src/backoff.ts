export function siradigBackoffStrategy(
  attemptsMade: number,
  _type: string | undefined,
  err: Error | undefined,
): number {
  if (err?.message.includes("CAPTCHA_FAILED")) return 2000;
  if (err?.message.includes("SESSION_EXPIRED")) return 5000;
  if (err?.message.includes("AFIP_MAINTENANCE")) return 300000;
  // Default exponential backoff with base 5s
  return Math.pow(2, attemptsMade - 1) * 5000;
}
