import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Refund escrow funds to buyer (admin only)
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
            buyer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
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

    // Check if escrow can be refunded
    if (escrow.status === "REFUNDED") {
      return NextResponse.json(
        { message: "Escrow has already been refunded" },
        { status: 400 }
      );
    }

    if (escrow.status === "RELEASED") {
      return NextResponse.json(
        { message: "Escrow has been released and cannot be refunded" },
        { status: 400 }
      );
    }

    // Update escrow status
    await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: "REFUNDED",
        refundedAt: new Date(),
        refundReason: reason || "Funds refunded by admin",
        disputeResolved: escrow.disputeRaised, // Mark dispute as resolved if it was raised
        disputeResolution: escrow.disputeRaised ? (reason || "Dispute resolved: Funds refunded") : undefined,
        resolvedBy: decoded.userId,
      },
    });

    // Update purchase status
    await prisma.purchase.update({
      where: { id: escrow.purchaseId },
      data: {
        status: "cancelled",
      },
    });

    // Update vehicle status back to available
    await prisma.vehicle.update({
      where: { id: escrow.purchase.vehicleId },
      data: {
        status: "APPROVED", // Make vehicle available again
      },
    });

    return NextResponse.json({
      message: "Escrow refunded successfully",
      escrow: {
        id: escrow.id,
        status: "REFUNDED",
      },
    });
  } catch (error: any) {
    console.error("Error refunding escrow:", error);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
