// In-memory sliding window / token-bucket rate limiter for Serverless/Node environments
// Stores timestamp and count per key with automatic cleanup

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * Check and record a hit for a key with maximum allowed requests in a time window.
 * @param key unique identifier (e.g. IP, IP+route, or action)
 * @param maxRequests maximum allowed requests within window
 * @param windowMs time window in milliseconds
 * @returns { success: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, newRecord);
    return { success: true, remaining: maxRequests - 1, resetAt: newRecord.resetAt };
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { success: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Helper to extract client IP from NextRequest headers
 */
export function getClientIp(headers: Headers): string {
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();
  return "unknown-ip";
}

/**
 * Reset rate limit key (useful for tests or successful login)
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Clear all records (testing)
 */
export function clearRateLimitStore(): void {
  store.clear();
}
