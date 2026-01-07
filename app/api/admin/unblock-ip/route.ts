import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearAllBlocks, unblockIP } from "@/lib/ddos-protection";

/**
 * Development/Admin endpoint to unblock IPs
 * Only available in development mode or for admins
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with admin auth
    const isDevelopment = process.env.NODE_ENV === "development";
    
    if (!isDevelopment) {
      // In production, require admin authentication
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json(
          { message: "Invalid token" },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { role: true },
      });

      if (!user || user.role !== "ADMIN") {
        return NextResponse.json(
          { message: "Access denied. Admin only." },
          { status: 403 }
        );
      }
    }

    const body = await request.json().catch(() => ({}));
    const { ip } = body;

    if (ip) {
      // Unblock specific IP
      unblockIP(ip);
      return NextResponse.json({
        message: `IP ${ip} unblocked successfully`,
      });
    } else {
      // Clear all blocks
      clearAllBlocks();
      return NextResponse.json({
        message: "All IP blocks cleared successfully",
      });
    }
  } catch (error: any) {
    console.error("Unblock IP error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


