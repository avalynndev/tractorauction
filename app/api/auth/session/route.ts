import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Check if user has valid session
 * This endpoint can be used to verify authentication status
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get token from multiple sources
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, message: "No token found" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { authenticated: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { authenticated: false, message: "User not found or inactive" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}





























