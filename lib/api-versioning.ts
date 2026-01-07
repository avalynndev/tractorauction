import { NextRequest, NextResponse } from "next/server";

/**
 * API Versioning System
 * Supports versioned API endpoints: /api/v1/, /api/v2/, etc.
 */

export const API_VERSIONS = {
  v1: "v1",
  v2: "v2",
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

const DEFAULT_VERSION = API_VERSIONS.v1;
const LATEST_VERSION = API_VERSIONS.v2;

/**
 * Extract API version from request
 */
export function getApiVersion(request: NextRequest): ApiVersion {
  const pathname = request.nextUrl.pathname;
  
  // Check for /api/v1/, /api/v2/, etc.
  const versionMatch = pathname.match(/^\/api\/(v\d+)\//);
  if (versionMatch) {
    const version = versionMatch[1] as ApiVersion;
    if (Object.values(API_VERSIONS).includes(version)) {
      return version;
    }
  }

  // Check Accept header for version
  const acceptHeader = request.headers.get("accept");
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/version=(\w+)/);
    if (versionMatch) {
      const version = versionMatch[1] as ApiVersion;
      if (Object.values(API_VERSIONS).includes(version)) {
        return version;
      }
    }
  }

  // Check custom header
  const apiVersion = request.headers.get("x-api-version");
  if (apiVersion && Object.values(API_VERSIONS).includes(apiVersion as ApiVersion)) {
    return apiVersion as ApiVersion;
  }

  return DEFAULT_VERSION;
}

/**
 * Check if version is deprecated
 */
export function isVersionDeprecated(version: ApiVersion): boolean {
  // v1 is deprecated, v2 is current
  return version === API_VERSIONS.v1;
}

/**
 * Create versioned response with deprecation headers
 */
export function createVersionedResponse(
  data: any,
  version: ApiVersion,
  status: number = 200
): NextResponse {
  const response = NextResponse.json(data, { status });

  // Add version header
  response.headers.set("X-API-Version", version);

  // Add deprecation warning if applicable
  if (isVersionDeprecated(version)) {
    response.headers.set(
      "Warning",
      `299 - "This API version is deprecated. Please migrate to ${LATEST_VERSION}."`
    );
    response.headers.set("Sunset", new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString()); // 90 days
  }

  // Add link to latest version
  response.headers.set("Link", `</api/${LATEST_VERSION}>; rel="latest"`);

  return response;
}

/**
 * Middleware to handle API versioning
 */
export function apiVersionMiddleware(request: NextRequest): {
  version: ApiVersion;
  shouldRedirect: boolean;
  redirectUrl?: string;
} {
  const pathname = request.nextUrl.pathname;
  const version = getApiVersion(request);

  // If accessing /api/ without version, redirect to default version
  if (pathname.startsWith("/api/") && !pathname.match(/^\/api\/v\d+\//)) {
    // Don't redirect auth endpoints or public endpoints
    // All existing endpoints are excluded from versioning since they weren't designed with versioning
    const publicEndpoints = [
      "/api/auth/",
      "/api/auctions",
      "/api/vehicles/",
      "/api/swagger.json",
      "/api/user/", // All user endpoints
      "/api/my-account/", // All my-account endpoints
      "/api/membership/", // All membership endpoints
      "/api/payments/", // All payment endpoints
      "/api/purchases/", // All purchase endpoints
      "/api/feedback", // Feedback endpoints
      "/api/watchlist", // Watchlist endpoints
      "/api/shortlist", // Shortlist endpoints
      "/api/inspections/", // Inspection endpoints
      "/api/admin/", // Admin endpoints
      "/api/valuer/", // Valuer endpoints
      "/api/blockchain/", // Blockchain endpoints
      "/api/videos/", // Video endpoints
      "/api/referral/", // Referral endpoints
      "/api/notifications/", // Notification endpoints
      "/api/reviews", // Reviews endpoints
      "/api/oem/", // OEM endpoints (login, analytics)
      "/api/escrow/", // Escrow endpoints
      "/api/chat/", // Chat endpoints
    ];

    const isPublicEndpoint = publicEndpoints.some((endpoint) =>
      pathname.startsWith(endpoint)
    );

    if (!isPublicEndpoint) {
      return {
        version,
        shouldRedirect: true,
        redirectUrl: pathname.replace("/api/", `/api/${version}/`),
      };
    }
  }

  return {
    version,
    shouldRedirect: false,
  };
}

/**
 * Route handler wrapper for versioned APIs
 */
export function withApiVersioning(
  handler: (request: NextRequest, version: ApiVersion) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const version = getApiVersion(request);
    const response = await handler(request, version);
    
    // Add version headers
    response.headers.set("X-API-Version", version);
    
    if (isVersionDeprecated(version)) {
      response.headers.set(
        "Warning",
        `299 - "This API version is deprecated. Please migrate to ${LATEST_VERSION}."`
      );
    }

    return response;
  };
}

