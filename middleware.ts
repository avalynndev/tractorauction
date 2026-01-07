import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { validateCsrfRequest } from "@/lib/csrf";
import { enhancedRateLimit, getClientIPFromRequest, isIPBlocked, verifyCaptcha } from "@/lib/ddos-protection";
import { apiVersionMiddleware } from "@/lib/api-versioning";

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  // Authentication routes - allow more attempts (users may need to retry)
  "/api/auth/login": { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  "/api/auth/register": { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  "/api/auth/verify-otp": { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute (OTP retries)
  "/api/auth/resend-otp": { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute (prevent abuse)
  // Write operations - stricter limits
  "/api/vehicles/upload": { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute (allows retries)
  "/api/inspections/create": { maxRequests: 5, windowMs: 60000 }, // 5 requests per minute
  // Default for other API routes
  default: { maxRequests: 30, windowMs: 60000 }, // 30 requests per minute
};

/**
 * Routes that should be excluded from rate limiting
 * (frequently called endpoints that are safe)
 */
const EXCLUDED_ROUTES = [
  "/api/user/me", // User profile endpoint (called frequently)
  "/api/auctions", // Public auction listing
  "/api/vehicles/", // All vehicle endpoints including individual vehicle details
  "/api/reviews", // Reviews endpoint (called frequently on vehicle detail pages)
  "/api/auth/login", // Authentication - critical for user access
  "/api/auth/register", // Registration - critical for new users
  "/api/auth/verify-otp", // OTP verification - critical for login
  "/api/auth/resend-otp", // OTP resend - users may need to retry
  "/api/oem/login", // OEM login - public endpoint
  "/api/oem/analytics", // OEM analytics - public endpoint for OEMs
];

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  // Check various headers for IP (in order of preference)
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection remote address (if available)
  return request.ip || "unknown";
}

/**
 * Get rate limit config for a path
 * Checks more specific paths first, then falls back to defaults
 */
function getRateLimitConfig(pathname: string): { maxRequests: number; windowMs: number } {
  // Sort paths by length (longest first) to match most specific routes first
  const sortedPaths = Object.entries(RATE_LIMIT_CONFIG)
    .filter(([path]) => path !== "default")
    .sort(([a], [b]) => b.length - a.length);
  
  for (const [path, config] of sortedPaths) {
    if (pathname === path || pathname.startsWith(path + "/")) {
      return config;
    }
  }
  return RATE_LIMIT_CONFIG.default;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply security measures to API routes
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIPFromRequest(request);
    
    // 1. Check if IP is blocked (DDoS protection)
    const blockStatus = isIPBlocked(clientIP);
    if (blockStatus.blocked) {
      return NextResponse.json(
        {
          message: `IP address blocked: ${blockStatus.reason}. Please try again after ${blockStatus.until?.toISOString()}.`,
          error: "IP_BLOCKED",
        },
        { status: 403 }
      );
    }

    // 2. Enhanced rate limiting with CAPTCHA support
    const isExcluded = EXCLUDED_ROUTES.some((route) => pathname.startsWith(route));
    
    if (!isExcluded) {
      const config = getRateLimitConfig(pathname);
      const rateLimitResult = enhancedRateLimit(clientIP, config.maxRequests, config.windowMs);

      if (!rateLimitResult.allowed) {
        // Check if CAPTCHA is required
        if (rateLimitResult.requiresCaptcha) {
          const captchaToken = request.headers.get("x-captcha-token");
          if (!captchaToken) {
            return NextResponse.json(
              {
                message: "CAPTCHA verification required",
                error: "CAPTCHA_REQUIRED",
                requiresCaptcha: true,
              },
              { status: 429 }
            );
          }

          // Verify CAPTCHA
          const captchaValid = await verifyCaptcha(captchaToken);
          if (!captchaValid) {
            return NextResponse.json(
              {
                message: "Invalid CAPTCHA. Please try again.",
                error: "CAPTCHA_INVALID",
              },
              { status: 400 }
            );
          }
        } else {
          return NextResponse.json(
            {
              message: "Too many requests. Please try again later.",
              error: "RATE_LIMIT_EXCEEDED",
            },
            {
              status: 429,
              headers: {
                "Retry-After": "60",
                "X-RateLimit-Limit": config.maxRequests.toString(),
                "X-RateLimit-Window": config.windowMs.toString(),
              },
            }
          );
        }
      }
    }

    // 3. API Versioning
    const versionInfo = apiVersionMiddleware(request);
    if (versionInfo.shouldRedirect && versionInfo.redirectUrl) {
      return NextResponse.redirect(new URL(versionInfo.redirectUrl, request.url));
    }

    // CSRF Protection for state-changing operations
    // Skip CSRF for GET, HEAD, OPTIONS, and public read-only endpoints
    const method = request.method;
    const requiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const csrfExcludedRoutes = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/verify-otp',
      '/api/auth/resend-otp',
      '/api/auctions',
      '/api/vehicles/preapproved',
      '/api/vehicles/recommended',
      '/api/vehicles/upload',
      '/api/vehicles/bulk-upload',
      '/api/reviews',
      '/api/user/profile/',
      '/api/user/update',
      '/api/user/',
      '/api/admin/',
      '/api/inspections/',
      '/api/valuer/',
      '/api/membership/purchase',
      '/api/membership/payment-callback',
      '/api/membership/webhook',
      '/api/payments/registration-fee',
      '/api/payments/registration-fee/callback',
      '/api/payments/emd',
      '/api/payments/emd/callback',
      '/api/purchases/', // All purchase endpoints including approve
      '/api/watchlist', // Watchlist endpoints
      '/api/shortlist', // Shortlist endpoints (if exists)
      '/api/oem/login', // OEM login - public endpoint
      '/api/oem/analytics', // OEM analytics - public endpoint
    ];

    if (requiresCsrf && !csrfExcludedRoutes.some(route => pathname.startsWith(route))) {
      const csrfValidation = await validateCsrfRequest(request);
      if (!csrfValidation.valid) {
        return NextResponse.json(
          {
            message: csrfValidation.error || "CSRF token validation failed",
            error: "CSRF_TOKEN_INVALID",
          },
          { status: 403 }
        );
      }
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    "/api/:path*", // Apply to all API routes
  ],
};
