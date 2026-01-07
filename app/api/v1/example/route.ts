import { NextRequest, NextResponse } from "next/server";
import { withApiVersioning, createVersionedResponse } from "@/lib/api-versioning";

/**
 * Example Versioned API Endpoint
 * GET /api/v1/example
 * 
 * This is an example of how to use API versioning.
 * Access via: /api/v1/example or /api/v2/example
 */
export const GET = withApiVersioning(async (request: NextRequest, version) => {
  const data = {
    message: `Hello from API ${version}`,
    version,
    timestamp: new Date().toISOString(),
    features: version === "v2" 
      ? ["Enhanced features", "Better performance", "New endpoints"]
      : ["Basic features"],
  };

  return createVersionedResponse(data, version);
});

