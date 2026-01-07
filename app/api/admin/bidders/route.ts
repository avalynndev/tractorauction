import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch all bidders (users with BUYER or DEALER role)
    const bidders = await prisma.user.findMany({
      where: {
        role: {
          in: ["BUYER", "DEALER"],
        },
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        identificationNumber: true,
        state: true,
        district: true,
        registrationFeePaid: true,
        emdPaid: true,
        isEligibleForBid: true,
        eligibleForBidReason: true,
        createdAt: true,
        memberships: {
          where: {
            status: "active",
            endDate: {
              gte: new Date(),
            },
          },
          orderBy: {
            endDate: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      bidders,
      count: bidders.length,
    });
  } catch (error: any) {
    console.error("Error fetching bidders:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



