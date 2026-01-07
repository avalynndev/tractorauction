import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * @swagger
 * /api/user/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
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

    const userStartTime = Date.now();
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              identificationNumber: true,
              fullName: true,
              phoneNumber: true,
              whatsappNumber: true,
              email: true,
              address: true,
              city: true,
              district: true,
              state: true,
              pincode: true,
              role: true,
              registrationType: true,
              gstNumber: true,
              isActive: true,
              registrationFeePaid: true,
              emdPaid: true,
              isEligibleForBid: true,
              eligibleForBidReason: true,
              createdAt: true,
              profilePhoto: true,
              panCard: true,
              aadharCard: true,
              cancelledCheque: true,
              kycStatus: true,
              kycSubmittedAt: true,
              kycApprovedAt: true,
              kycRejectedAt: true,
              kycRejectionReason: true,
            },
          });
    const userEndTime = Date.now();
    console.log(`[PERF] User query took ${userEndTime - userStartTime}ms`);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Return user data immediately with basic membership check
    // Fetch memberships in parallel but don't block on them
    const membershipStartTime = Date.now();
    const membershipPromise = Promise.all([
      prisma.membership.findFirst({
        where: {
          userId: user.id,
          status: "active",
          endDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          endDate: "desc",
        },
      }),
      prisma.membership.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10, // Limit to last 10 memberships for performance
      }),
    ]).catch((error) => {
      console.error("Error fetching memberships:", error);
      return [null, []];
    });

    // Wait for memberships but with a short timeout
    const membershipTimeout = new Promise((resolve) => 
      setTimeout(() => resolve([null, []]), 500) // 500ms timeout
    );

    const [activeMembership, allMemberships] = await Promise.race([
      membershipPromise,
      membershipTimeout,
    ]) as [any, any[]];
    const membershipEndTime = Date.now();
    console.log(`[PERF] Membership queries took ${membershipEndTime - membershipStartTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`[PERF] Total /api/user/me took ${totalTime}ms`);

    return NextResponse.json({
      ...user,
      membership: activeMembership || null,
      memberships: allMemberships || [],
    });
  } catch (error: any) {
    console.error("Get user error:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}


