const buckets = new Map<string, number[]>();

/** Returns true when the attempt is allowed. */
export function takeRateLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);
  if (buckets.size > 10_000) buckets.clear();
  return true;
}

export function resetRateLimits(): void {
  buckets.clear();
}
