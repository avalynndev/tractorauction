import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/recent-views - Get user's recently viewed vehicles
 * POST /api/recent-views - Record a vehicle view
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get recent views, grouped by vehicle (most recent view per vehicle)
    const recentViews = await prisma.recentView.findMany({
      where: { userId: decoded.userId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                city: true,
                state: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
                currentBid: true,
                endTime: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewedAt: "desc",
      },
      take: limit * 2, // Get more to filter duplicates
    });

    // Remove duplicates, keeping most recent view per vehicle
    const uniqueViews = recentViews.reduce((acc, view) => {
      if (!acc.find((v) => v.vehicleId === view.vehicleId)) {
        acc.push(view);
      }
      return acc;
    }, [] as typeof recentViews);

    return NextResponse.json({
      recentViews: uniqueViews.slice(0, limit),
    });
  } catch (error) {
    console.error("Get recent views error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Allow anonymous views (optional)
      return NextResponse.json({ message: "View recorded" });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "View recorded" });
    }

    const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Record view (or update existing)
    await prisma.recentView.create({
      data: {
        userId: decoded.userId,
        vehicleId: vehicleId,
      },
    });

    // Clean up old views (keep last 50 per user)
    const oldViews = await prisma.recentView.findMany({
      where: { userId: decoded.userId },
      orderBy: { viewedAt: "desc" },
      skip: 50,
    });

    if (oldViews.length > 0) {
      await prisma.recentView.deleteMany({
        where: {
          id: { in: oldViews.map((v) => v.id) },
        },
      });
    }

    return NextResponse.json({ message: "View recorded" });
  } catch (error) {
    console.error("Record view error:", error);
    // Don't fail if view recording fails
    return NextResponse.json({ message: "View recorded" });
  }
}


























