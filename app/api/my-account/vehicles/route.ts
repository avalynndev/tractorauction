import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all vehicles listed by the current user (seller)
 */
export async function GET(request: NextRequest) {
  try {
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

    const vehicles = await prisma.vehicle.findMany({
      where: {
        sellerId: decoded.userId,
      },
      include: {
        auction: {
          include: {
            bids: {
              orderBy: {
                bidTime: "desc",
              },
              take: 1, // Get latest bid
            },
          },
        },
        purchases: {
          take: 1, // Get purchase if exists
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("Get user vehicles error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}





























