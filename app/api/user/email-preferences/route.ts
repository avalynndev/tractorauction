import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET - Get user's email notification preferences
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // For now, email notifications are enabled if user has an email
    // In the future, we can add a UserNotificationPreferences model
    const preferences = {
      email: user.email,
      emailNotificationsEnabled: !!user.email,
      // All notification types enabled by default if email exists
      vehicleApproved: !!user.email,
      vehicleRejected: !!user.email,
      auctionScheduled: !!user.email,
      auctionStarted: !!user.email,
      auctionEnded: !!user.email,
      bidPlaced: !!user.email,
      bidOutbid: !!user.email,
      bidApproved: !!user.email,
      bidRejected: !!user.email,
      membershipExpiring: !!user.email,
      membershipExpired: !!user.email,
    };

    return NextResponse.json({
      preferences,
    });
  } catch (error: any) {
    console.error("Error fetching email preferences:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user's email address (which enables/disables email notifications)
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
    const { email } = body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== decoded.userId) {
        return NextResponse.json(
          { message: "Email is already registered to another account" },
          { status: 400 }
        );
      }
    }

    // Update user email
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        email: email || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    const preferences = {
      email: updatedUser.email,
      emailNotificationsEnabled: !!updatedUser.email,
      vehicleApproved: !!updatedUser.email,
      vehicleRejected: !!updatedUser.email,
      auctionScheduled: !!updatedUser.email,
      auctionStarted: !!updatedUser.email,
      auctionEnded: !!updatedUser.email,
      bidPlaced: !!updatedUser.email,
      bidOutbid: !!updatedUser.email,
      bidApproved: !!updatedUser.email,
      bidRejected: !!updatedUser.email,
      membershipExpiring: !!updatedUser.email,
      membershipExpired: !!updatedUser.email,
    };

    return NextResponse.json({
      message: email ? "Email updated successfully" : "Email removed successfully",
      preferences,
    });
  } catch (error: any) {
    console.error("Error updating email preferences:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



























