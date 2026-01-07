import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/shortlist - Get user's shortlisted items
 * POST /api/shortlist - Add vehicle to shortlist
 * DELETE /api/shortlist - Remove vehicle from shortlist
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

    const shortlist = await prisma.shortlistedItem.findMany({
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
                startTime: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ shortlist });
  } catch (error) {
    console.error("Get shortlist error:", error);
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

    const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Check if vehicle exists and is for auction
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        auction: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    if (vehicle.saleType !== "AUCTION") {
      return NextResponse.json(
        { message: "Only auction vehicles can be shortlisted for bidding" },
        { status: 400 }
      );
    }

    // Check if already shortlisted
    const existing = await prisma.shortlistedItem.findUnique({
      where: {
        userId_vehicleId: {
          userId: decoded.userId,
          vehicleId: vehicleId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Vehicle already shortlisted" },
        { status: 400 }
      );
    }

    // Add to shortlist
    const shortlistItem = await prisma.shortlistedItem.create({
      data: {
        userId: decoded.userId,
        vehicleId: vehicleId,
      },
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
    });

    return NextResponse.json({
      message: "Added to shortlist",
      shortlistItem,
    });
  } catch (error) {
    console.error("Add to shortlist error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Remove from shortlist
    await prisma.shortlistedItem.deleteMany({
      where: {
        userId: decoded.userId,
        vehicleId: vehicleId,
      },
    });

    return NextResponse.json({
      message: "Removed from shortlist",
    });
  } catch (error) {
    console.error("Remove from shortlist error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























