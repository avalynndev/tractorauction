import { NextRequest, NextResponse } from "next/server";
import { checkAndUpdateMembershipExpiry, getExpiringMemberships } from "@/lib/membership";

// This endpoint should be called periodically (via cron job) to check and update expired memberships
export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization (optional, for security)
    const authHeader = request.headers.get("authorization");
    const secret = request.headers.get("x-cron-secret");

    // Allow if secret matches or in development
    if (
      process.env.NODE_ENV !== "development" &&
      secret !== process.env.CRON_SECRET
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Update expired memberships
    await checkAndUpdateMembershipExpiry();

    // Get memberships expiring in next 7 days
    const expiringMemberships = await getExpiringMemberships(7);

    return NextResponse.json({
      message: "Membership expiry check completed",
      expiredUpdated: true,
      expiringCount: expiringMemberships.length,
      expiringMemberships: expiringMemberships.map((m) => ({
        userId: m.userId,
        userName: m.user?.fullName,
        membershipType: m.membershipType,
        endDate: m.endDate,
      })),
    });
  } catch (error) {
    console.error("Membership expiry check error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

