import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUnsubscribeToken } from "@/lib/email-template-helper";

/**
 * Unsubscribe from email notifications
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const notificationType = searchParams.get("type");

    // If token provided, parse it
    let targetUserId = userId;
    let targetType = notificationType;

    if (token) {
      const parsed = parseUnsubscribeToken(token);
      if (parsed) {
        targetUserId = parsed.userId;
        targetType = parsed.notificationType;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { message: "Invalid unsubscribe link" },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, fullName: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // If specific notification type, update preferences
    if (targetType && targetType !== "all") {
      // Get or create notification preferences
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId: user.id },
      });

      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: { userId: user.id },
        });
      }

      // Disable specific notification type
      await prisma.notificationPreferences.update({
        where: { userId: user.id },
        data: {
          [targetType]: false,
        },
      });

      return NextResponse.json({
        success: true,
        message: `You have been unsubscribed from ${targetType} notifications`,
        unsubscribedType: targetType,
      });
    } else {
      // Unsubscribe from all emails
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailUnsubscribed: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "You have been unsubscribed from all email notifications",
        unsubscribedAll: true,
      });
    }
  } catch (error: any) {
    console.error("Error processing unsubscribe:", error);
    return NextResponse.json(
      { message: "Error processing unsubscribe request" },
      { status: 500 }
    );
  }
}

/**
 * Resubscribe to email notifications
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, notificationType } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID required" },
        { status: 400 }
      );
    }

    // If specific type, update preferences
    if (notificationType && notificationType !== "all") {
      let preferences = await prisma.notificationPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        preferences = await prisma.notificationPreferences.create({
          data: { userId },
        });
      }

      await prisma.notificationPreferences.update({
        where: { userId },
        data: {
          [notificationType]: true,
        },
      });
    } else {
      // Resubscribe to all
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailUnsubscribed: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Successfully resubscribed to email notifications",
    });
  } catch (error: any) {
    console.error("Error resubscribing:", error);
    return NextResponse.json(
      { message: "Error processing resubscribe request" },
      { status: 500 }
    );
  }
}



























