import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRTODetails, getRTODetailsFromChassis, getRTODetailsFromEngine } from "@/lib/rto-lookup";

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

    // Check user membership - only Gold and Diamond members can access
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
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
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Admin can access
    const isAdmin = user.role === "ADMIN";
    
    // Check if user has Gold or Diamond membership
    const hasValidMembership = user.memberships.some(
      (m) => m.membershipType === "GOLD" || m.membershipType === "DIAMOND"
    );

    if (!isAdmin && !hasValidMembership) {
      return NextResponse.json(
        { 
          message: "This feature is available only for Gold and Diamond members. Please upgrade your membership.",
          requiresUpgrade: true 
        },
        { status: 403 }
      );
    }

    // Get lookup parameters
    const searchParams = request.nextUrl.searchParams;
    const registrationNumber = searchParams.get("registrationNumber");
    const chassisNumber = searchParams.get("chassisNumber");
    const engineNumber = searchParams.get("engineNumber");

    let rtoDetails = null;

    // Try registration number first
    if (registrationNumber) {
      rtoDetails = getRTODetails(registrationNumber);
    }

    // Try chassis number if registration didn't work
    if (!rtoDetails && chassisNumber) {
      rtoDetails = getRTODetailsFromChassis(chassisNumber);
    }

    // Try engine number if both didn't work
    if (!rtoDetails && engineNumber) {
      rtoDetails = getRTODetailsFromEngine(engineNumber);
    }

    if (!rtoDetails) {
      return NextResponse.json(
        { 
          message: "RTO details not found. Please verify the registration/chassis/engine number.",
          found: false 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      rtoDetails,
    });
  } catch (error) {
    console.error("Error in RTO lookup:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























