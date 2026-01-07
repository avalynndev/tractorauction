import { NextRequest, NextResponse } from "next/server";
import { getExpiringMemberships, isExpiringSoon } from "@/lib/membership";

/**
 * Send expiry notifications to users
 * Should be called daily via cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret
    const secret = request.headers.get("x-cron-secret");
    if (
      process.env.NODE_ENV !== "development" &&
      secret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get memberships expiring in next 7 days
    const expiringMemberships = await getExpiringMemberships(7);

    const notifications = [];

    for (const membership of expiringMemberships) {
      const daysRemaining = Math.ceil(
        (new Date(membership.endDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Send notification based on days remaining
      if (daysRemaining === 1) {
        // Urgent: Expiring tomorrow
        notifications.push({
          userId: membership.userId,
          userName: membership.user?.fullName,
          phoneNumber: membership.user?.phoneNumber,
          message: `Your membership expires tomorrow! Renew now to continue using our platform.`,
          priority: "urgent",
        });
      } else if (daysRemaining <= 3) {
        // High priority: Expiring soon
        notifications.push({
          userId: membership.userId,
          userName: membership.user?.fullName,
          phoneNumber: membership.user?.phoneNumber,
          message: `Your membership expires in ${daysRemaining} days. Renew now to avoid interruption.`,
          priority: "high",
        });
      } else {
        // Normal: Expiring within week
        notifications.push({
          userId: membership.userId,
          userName: membership.user?.fullName,
          phoneNumber: membership.user?.phoneNumber,
          message: `Your membership expires in ${daysRemaining} days. Consider renewing to continue enjoying our services.`,
          priority: "normal",
        });
      }

      // TODO: Send SMS/Email notifications
      // await sendSMS(membership.user?.phoneNumber, notification.message);
      // await sendEmail(membership.user?.email, "Membership Expiring", notification.message);
    }

    return NextResponse.json({
      message: "Expiry notifications processed",
      notificationsSent: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Expiry notification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}





























