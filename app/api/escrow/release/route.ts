import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Release escrow funds to seller (admin only)
 */
export async function POST(request: NextRequest) {
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { escrowId, reason } = body;

    if (!escrowId) {
      return NextResponse.json(
        { message: "Escrow ID is required" },
        { status: 400 }
      );
    }

    // Get escrow details
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        purchase: {
          include: {
            vehicle: {
              include: {
                seller: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!escrow) {
      return NextResponse.json(
        { message: "Escrow not found" },
        { status: 404 }
      );
    }

    // Check if escrow can be released
    if (escrow.status === "RELEASED") {
      return NextResponse.json(
        { message: "Escrow has already been released" },
        { status: 400 }
      );
    }

    if (escrow.status === "REFUNDED") {
      return NextResponse.json(
        { message: "Escrow has been refunded and cannot be released" },
        { status: 400 }
      );
    }

    // Update escrow status
    await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        releaseReason: reason || "Funds released by admin",
        disputeResolved: escrow.disputeRaised, // Mark dispute as resolved if it was raised
        disputeResolution: escrow.disputeRaised ? (reason || "Dispute resolved: Funds released") : undefined,
        resolvedBy: decoded.userId,
      },
    });

    // Update purchase status if needed
    if (escrow.purchase.status === "payment_pending" || escrow.purchase.status === "pending") {
      await prisma.purchase.update({
        where: { id: escrow.purchaseId },
        data: {
          status: "completed",
        },
      });
    }

    return NextResponse.json({
      message: "Escrow funds released successfully",
      escrow: {
        id: escrow.id,
        status: "RELEASED",
      },
    });
  } catch (error: any) {
    console.error("Error releasing escrow:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
