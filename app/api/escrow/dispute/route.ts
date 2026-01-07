import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Raise a dispute on escrow
 * Buyer or seller can raise disputes
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

    const body = await request.json();
    const { escrowId, description } = body;

    if (!escrowId || !description) {
      return NextResponse.json(
        { message: "Escrow ID and description are required" },
        { status: 400 }
      );
    }

    // Find escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        purchase: {
          include: {
            buyer: true,
            vehicle: {
              include: {
                seller: true,
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

    if (escrow.status !== "HELD") {
      return NextResponse.json(
        { message: `Dispute cannot be raised. Current status: ${escrow.status}` },
        { status: 400 }
      );
    }

    // Check if user is buyer or seller
    const isBuyer = escrow.purchase.buyerId === decoded.userId;
    const isSeller = escrow.purchase.vehicle.sellerId === decoded.userId;

    if (!isBuyer && !isSeller) {
      return NextResponse.json(
        { message: "Only buyer or seller can raise disputes" },
        { status: 403 }
      );
    }

    // Update escrow with dispute
    const updatedEscrow = await prisma.escrow.update({
      where: { id: escrowId },
      data: {
        status: "DISPUTE",
        disputeRaised: true,
        disputeRaisedBy: decoded.userId,
        disputeDescription: description,
      },
    });

    return NextResponse.json({
      message: "Dispute raised successfully. Admin will review your case.",
      escrow: {
        id: updatedEscrow.id,
        status: updatedEscrow.status,
        disputeRaised: updatedEscrow.disputeRaised,
      },
    });
  } catch (error: any) {
    console.error("Raise dispute error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

























