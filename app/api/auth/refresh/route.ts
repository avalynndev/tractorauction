import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken } from "@/lib/session";
import { z } from "zod";

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/**
 * Refresh Access Token
 * POST /api/auth/refresh
 * 
 * Refreshes an expired access token using a valid refresh token.
 * Implements token rotation for enhanced security.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = refreshSchema.parse(body);

    // Refresh the access token
    const tokenPair = await refreshAccessToken(validatedData.refreshToken);

    if (!tokenPair) {
      return NextResponse.json(
        { message: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Return new token pair
    return NextResponse.json(
      {
        message: "Token refreshed successfully",
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Token refresh error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

