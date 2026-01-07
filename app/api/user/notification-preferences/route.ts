import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/user/notification-preferences - Get user's notification preferences
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

    // Get or create notification preferences
    let preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: decoded.userId },
    });

    // If preferences don't exist, create default ones
    if (!preferences) {
      preferences = await prisma.notificationPreferences.create({
        data: {
          userId: decoded.userId,
          // All defaults are true
        },
      });
    }

    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error("Get notification preferences error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/notification-preferences - Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
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
    const {
      vehicleApproved,
      vehicleRejected,
      auctionScheduled,
      auctionStarted,
      auctionEnded,
      bidPlaced,
      bidOutbid,
      bidApproved,
      bidRejected,
      membershipExpiring,
      membershipExpired,
      watchlistPriceDrop,
      watchlistAuctionStart,
    } = body;

    // Update or create preferences
    const preferences = await prisma.notificationPreferences.upsert({
      where: { userId: decoded.userId },
      update: {
        vehicleApproved: vehicleApproved !== undefined ? vehicleApproved : undefined,
        vehicleRejected: vehicleRejected !== undefined ? vehicleRejected : undefined,
        auctionScheduled: auctionScheduled !== undefined ? auctionScheduled : undefined,
        auctionStarted: auctionStarted !== undefined ? auctionStarted : undefined,
        auctionEnded: auctionEnded !== undefined ? auctionEnded : undefined,
        bidPlaced: bidPlaced !== undefined ? bidPlaced : undefined,
        bidOutbid: bidOutbid !== undefined ? bidOutbid : undefined,
        bidApproved: bidApproved !== undefined ? bidApproved : undefined,
        bidRejected: bidRejected !== undefined ? bidRejected : undefined,
        membershipExpiring: membershipExpiring !== undefined ? membershipExpiring : undefined,
        membershipExpired: membershipExpired !== undefined ? membershipExpired : undefined,
        watchlistPriceDrop: watchlistPriceDrop !== undefined ? watchlistPriceDrop : undefined,
        watchlistAuctionStart: watchlistAuctionStart !== undefined ? watchlistAuctionStart : undefined,
      },
      create: {
        userId: decoded.userId,
        vehicleApproved: vehicleApproved ?? true,
        vehicleRejected: vehicleRejected ?? true,
        auctionScheduled: auctionScheduled ?? true,
        auctionStarted: auctionStarted ?? true,
        auctionEnded: auctionEnded ?? true,
        bidPlaced: bidPlaced ?? true,
        bidOutbid: bidOutbid ?? true,
        bidApproved: bidApproved ?? true,
        bidRejected: bidRejected ?? true,
        membershipExpiring: membershipExpiring ?? true,
        membershipExpired: membershipExpired ?? true,
        watchlistPriceDrop: watchlistPriceDrop ?? true,
        watchlistAuctionStart: watchlistAuctionStart ?? true,
      },
    });

    return NextResponse.json({
      message: "Notification preferences updated",
      preferences,
    });
  } catch (error: any) {
    console.error("Update notification preferences error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
