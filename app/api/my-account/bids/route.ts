import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all bids placed by the current user (buyer)
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

    const bids = await prisma.bid.findMany({
      where: {
        bidderId: decoded.userId,
      },
      include: {
        auction: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
                vehicleType: true,
                state: true,
              },
            },
          },
        },
      },
      orderBy: {
        bidTime: "desc",
      },
    });

    return NextResponse.json({ bids });
  } catch (error) {
    console.error("Get user bids error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}





























