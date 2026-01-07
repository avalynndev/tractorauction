import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { getActiveMembership, getDaysRemaining, isExpiringSoon } from "@/lib/membership";

/**
 * Get detailed membership status for current user
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

    const membership = await getActiveMembership(decoded.userId);

    // Check if user has any membership (including expired)
    const { prisma } = await import("@/lib/prisma");
    const allMemberships = await prisma.membership.findMany({
      where: {
        userId: decoded.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    const lastMembership = allMemberships[0];
    const isTrial = lastMembership?.membershipType === "TRIAL";
    const isExpired = lastMembership && new Date(lastMembership.endDate) < new Date();

    if (!membership) {
      return NextResponse.json({
        hasActiveMembership: false,
        membership: null,
        daysRemaining: 0,
        isExpiringSoon: false,
        isTrial: isTrial && isExpired,
        isExpired: isExpired,
        message: isExpired
          ? isTrial
            ? "Your free trial has expired. Subscribe now to continue using our services."
            : "Your membership has expired. Renew now to continue using our services."
          : "No active membership. Please subscribe to continue.",
      });
    }

    const daysRem = getDaysRemaining(membership.endDate);
    const expiringSoon = isExpiringSoon(membership.endDate, 3);
    const isTrialActive = membership.membershipType === "TRIAL";

    return NextResponse.json({
      hasActiveMembership: true,
      membership: {
        id: membership.id,
        type: membership.membershipType,
        startDate: membership.startDate,
        endDate: membership.endDate,
        amount: membership.amount,
        status: membership.status,
      },
      daysRemaining: daysRem,
      isExpiringSoon: expiringSoon,
      isTrial: isTrialActive,
      isExpired: false,
      message: isTrialActive
        ? `You're on a free trial. ${daysRem} days remaining. Subscribe now to continue after trial ends.`
        : expiringSoon
        ? `Your membership expires in ${daysRem} days. Consider renewing soon.`
        : `Your membership is active for ${daysRem} more days.`,
    });
  } catch (error) {
    console.error("Membership status error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

