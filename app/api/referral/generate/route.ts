import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Generate or get user's referral code
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

    // Get or create referral code for user
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        referralCount: true,
        referralRewards: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // If user doesn't have a referral code, generate one
    if (!user.referralCode) {
      // Generate unique referral code (8 characters, alphanumeric)
      let referralCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        // Generate code: First 3 chars from user ID + random 5 chars
        const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
        const userIdPart = userId.substring(0, 3).toUpperCase();
        referralCode = `${userIdPart}${randomPart}`.substring(0, 8);

        // Check if code already exists
        const existing = await prisma.user.findUnique({
          where: { referralCode },
        });

        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        // Fallback: use user ID with prefix
        referralCode = `TA${userId.substring(0, 6).toUpperCase()}`;
      }

      // Update user with referral code
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode },
        select: {
          id: true,
          referralCode: true,
          referralCount: true,
          referralRewards: true,
        },
      });
    }

    // Get base URL from environment or request
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get("origin") || 
                   "https://www.tractorauction.in";

    const referralLink = `${baseUrl}/register?ref=${user.referralCode}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      referralLink,
      referralCount: user.referralCount,
      referralRewards: user.referralRewards,
    });
  } catch (error) {
    console.error("Generate referral code error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

