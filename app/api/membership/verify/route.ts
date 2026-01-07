import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hasActiveMembership } from "@/lib/membership";

// Verify if user has active membership
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

    const isActive = await hasActiveMembership(decoded.userId);
    const membership = await prisma.membership.findFirst({
      where: {
        userId: decoded.userId,
        status: "active",
        endDate: { gte: new Date() },
      },
      orderBy: {
        endDate: "desc",
      },
    });

    return NextResponse.json({
      hasActiveMembership: isActive,
      membership: membership
        ? {
            type: membership.membershipType,
            endDate: membership.endDate,
            daysRemaining: Math.ceil(
              (new Date(membership.endDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          }
        : null,
    });
  } catch (error) {
    console.error("Membership verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

