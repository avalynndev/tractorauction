/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Rate limit middleware
 * @param identifier - Unique identifier (e.g., IP address, userId)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if request is allowed, false if rate limited
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute default
): boolean {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries periodically (every 1000 requests)
  if (Math.random() < 0.001) {
    Object.keys(store).forEach((k) => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });
  }

  // Check if entry exists and is still valid
  if (store[key] && store[key].resetTime > now) {
    // Increment count
    store[key].count += 1;

    // Check if limit exceeded
    if (store[key].count > maxRequests) {
      return false; // Rate limited
    }

    return true; // Allowed
  }

  // Create new entry or reset expired entry
  store[key] = {
    count: 1,
    resetTime: now + windowMs,
  };

  return true; // Allowed
}

/**
 * Get rate limit info for an identifier
 */
export function getRateLimitInfo(identifier: string): {
  remaining: number;
  resetTime: number;
} | null {
  const entry = store[identifier];
  if (!entry) {
    return null;
  }

  const now = Date.now();
  if (entry.resetTime < now) {
    return null; // Expired
  }

  return {
    remaining: Math.max(0, 10 - entry.count), // Assuming maxRequests = 10
    resetTime: entry.resetTime,
  };
}

/**
 * Clear rate limit for an identifier (useful for testing)
 */
export function clearRateLimit(identifier: string): void {
  delete store[identifier];
}

























