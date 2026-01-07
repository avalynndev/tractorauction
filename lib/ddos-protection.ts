import { rateLimit } from "@/lib/rate-limit";

/**
 * Enhanced DDoS Protection
 * Provides IP blocking, CAPTCHA challenges, and advanced rate limiting
 */

interface IPBlock {
  ip: string;
  blockedUntil: Date;
  reason: string;
  attempts: number;
}

interface SuspiciousActivity {
  ip: string;
  count: number;
  lastSeen: Date;
  requiresCaptcha: boolean;
}

const blockedIPs = new Map<string, IPBlock>();
const suspiciousIPs = new Map<string, SuspiciousActivity>();

// Configuration
const MAX_REQUESTS_PER_MINUTE = 60;
const MAX_REQUESTS_PER_HOUR = 1000;
const SUSPICIOUS_THRESHOLD = 10; // Requests in short time
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const CAPTCHA_THRESHOLD = 5; // Require CAPTCHA after this many requests

// Development mode - more lenient settings
const isDevelopment = process.env.NODE_ENV === "development";
const DEV_SUSPICIOUS_THRESHOLD = 100; // Much higher threshold for dev
const DEV_BLOCK_DURATION_MS = 1 * 60 * 1000; // 1 minute in dev (vs 15 in prod)

// IPs to exclude from blocking (localhost, etc.)
const EXCLUDED_IPS = ["127.0.0.1", "::1", "localhost", "unknown"];

/**
 * Get client IP address from NextRequest
 */
export function getClientIPFromRequest(request: { headers: Headers; ip?: string }): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return request.ip || "unknown";
}

/**
 * Get client IP address (legacy - for Request objects)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

/**
 * Check if IP is blocked
 */
export function isIPBlocked(ip: string): { blocked: boolean; until?: Date; reason?: string } {
  // Exclude localhost and development IPs from blocking
  if (isDevelopment && EXCLUDED_IPS.includes(ip)) {
    return { blocked: false };
  }

  const block = blockedIPs.get(ip);
  if (!block) {
    return { blocked: false };
  }

  if (block.blockedUntil < new Date()) {
    // Block expired
    blockedIPs.delete(ip);
    return { blocked: false };
  }

  return {
    blocked: true,
    until: block.blockedUntil,
    reason: block.reason,
  };
}

/**
 * Block an IP address
 */
export function blockIP(ip: string, reason: string, durationMs: number = BLOCK_DURATION_MS): void {
  // Don't block localhost in development
  if (isDevelopment && EXCLUDED_IPS.includes(ip)) {
    console.warn(`[DEV] Skipping IP block for ${ip}: ${reason}`);
    return;
  }

  const blockDuration = isDevelopment ? DEV_BLOCK_DURATION_MS : durationMs;
  blockedIPs.set(ip, {
    ip,
    blockedUntil: new Date(Date.now() + blockDuration),
    reason,
    attempts: 1,
  });
}

/**
 * Check if IP requires CAPTCHA
 */
export function requiresCaptcha(ip: string): boolean {
  const activity = suspiciousIPs.get(ip);
  if (!activity) {
    return false;
  }

  // Reset if last seen was more than 1 hour ago
  if (Date.now() - activity.lastSeen.getTime() > 60 * 60 * 1000) {
    suspiciousIPs.delete(ip);
    return false;
  }

  return activity.requiresCaptcha || activity.count >= CAPTCHA_THRESHOLD;
}

/**
 * Record suspicious activity
 */
export function recordSuspiciousActivity(ip: string): void {
  // Don't track localhost in development
  if (isDevelopment && EXCLUDED_IPS.includes(ip)) {
    return;
  }

  const existing = suspiciousIPs.get(ip);
  const now = new Date();
  const threshold = isDevelopment ? DEV_SUSPICIOUS_THRESHOLD : SUSPICIOUS_THRESHOLD;

  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
    
    // Require CAPTCHA if threshold exceeded
    if (existing.count >= CAPTCHA_THRESHOLD) {
      existing.requiresCaptcha = true;
    }

    // Block if too many requests
    if (existing.count >= threshold) {
      blockIP(ip, "Excessive requests detected", BLOCK_DURATION_MS);
      suspiciousIPs.delete(ip);
    }
  } else {
    suspiciousIPs.set(ip, {
      ip,
      count: 1,
      lastSeen: now,
      requiresCaptcha: false,
    });
  }
}

/**
 * Verify CAPTCHA token (Google reCAPTCHA or hCaptcha)
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;
  const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET_KEY;

  if (!RECAPTCHA_SECRET && !HCAPTCHA_SECRET) {
    // CAPTCHA not configured, allow request
    console.warn("CAPTCHA not configured - allowing request");
    return true;
  }

  try {
    // Try reCAPTCHA first
    if (RECAPTCHA_SECRET) {
      const response = await fetch(
        `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        return true;
      }
    }

    // Try hCaptcha
    if (HCAPTCHA_SECRET) {
      const response = await fetch(
        `https://hcaptcha.com/siteverify?secret=${HCAPTCHA_SECRET}&response=${token}`,
        { method: "POST" }
      );
      const data = await response.json();
      if (data.success) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

/**
 * Enhanced rate limiting with IP blocking
 */
export function enhancedRateLimit(
  ip: string,
  maxRequests: number = MAX_REQUESTS_PER_MINUTE,
  windowMs: number = 60000
): { allowed: boolean; requiresCaptcha: boolean; blocked: boolean } {
  // Check if IP is blocked
  const blockStatus = isIPBlocked(ip);
  if (blockStatus.blocked) {
    return {
      allowed: false,
      requiresCaptcha: false,
      blocked: true,
    };
  }

  // Check rate limit
  const isAllowed = rateLimit(ip, maxRequests, windowMs);
  
  if (!isAllowed) {
    recordSuspiciousActivity(ip);
    return {
      allowed: false,
      requiresCaptcha: requiresCaptcha(ip),
      blocked: false,
    };
  }

  // Check if CAPTCHA is required
  const needsCaptcha = requiresCaptcha(ip);
  if (needsCaptcha) {
    return {
      allowed: true,
      requiresCaptcha: true,
      blocked: false,
    };
  }

  return {
    allowed: true,
    requiresCaptcha: false,
    blocked: false,
  };
}

/**
 * Clean up expired blocks and suspicious activity
 */
export function cleanupExpiredBlocks(): void {
  const now = new Date();
  
  // Clean blocked IPs
  for (const [ip, block] of blockedIPs.entries()) {
    if (block.blockedUntil < now) {
      blockedIPs.delete(ip);
    }
  }

  // Clean suspicious IPs (older than 1 hour)
  for (const [ip, activity] of suspiciousIPs.entries()) {
    if (Date.now() - activity.lastSeen.getTime() > 60 * 60 * 1000) {
      suspiciousIPs.delete(ip);
    }
  }
}

/**
 * Unblock an IP address (useful for development/admin)
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
  suspiciousIPs.delete(ip);
}

/**
 * Clear all blocks (useful for development)
 */
export function clearAllBlocks(): void {
  blockedIPs.clear();
  suspiciousIPs.clear();
}

// Run cleanup every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredBlocks, 5 * 60 * 1000);
}

