import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get referral statistics for the current user
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

    const userId = decoded.userId;

    // Get user referral info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralCount: true,
        referralRewards: true,
        referredBy: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Get all referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referredUser: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            createdAt: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get referral stats
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((r) => r.status === "ACTIVE").length;
    const completedReferrals = referrals.filter((r) => r.status === "COMPLETED").length;
    const pendingReferrals = referrals.filter((r) => r.status === "PENDING").length;

    // Get who referred this user (if any)
    let referredByUser = null;
    if (user.referredBy) {
      referredByUser = await prisma.user.findUnique({
        where: { id: user.referredBy },
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
        },
      });
    }

    return NextResponse.json({
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      referralRewards: user.referralRewards,
      totalReferrals,
      activeReferrals,
      completedReferrals,
      pendingReferrals,
      referrals: referrals.map((ref) => ({
        id: ref.id,
        referredUser: ref.referredUser,
        status: ref.status,
        rewardAmount: ref.rewardAmount,
        rewardType: ref.rewardType,
        rewardGiven: ref.rewardGiven,
        createdAt: ref.createdAt,
      })),
      referredBy: referredByUser,
    });
  } catch (error) {
    console.error("Get referral stats error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

