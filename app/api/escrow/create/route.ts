import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Create escrow for a purchase
 * This is called after payment is confirmed
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
    const { purchaseId, amount, paymentMethod, paymentId, paymentReference } = body;

    if (!purchaseId || !amount) {
      return NextResponse.json(
        { message: "Purchase ID and amount are required" },
        { status: 400 }
      );
    }

    // Verify purchase exists and belongs to user
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        buyer: true,
        vehicle: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    if (purchase.buyerId !== decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized to create escrow for this purchase" },
        { status: 403 }
      );
    }

    // Check if escrow already exists
    const existingEscrow = await prisma.escrow.findUnique({
      where: { purchaseId },
    });

    if (existingEscrow) {
      return NextResponse.json(
        { message: "Escrow already exists for this purchase" },
        { status: 400 }
      );
    }

    // Calculate escrow fee (2% of purchase amount, minimum ₹500, maximum ₹5000)
    const escrowFeePercentage = 0.02;
    const escrowFee = Math.min(
      Math.max(amount * escrowFeePercentage, 500),
      5000
    );

    // Create escrow
    const escrow = await prisma.escrow.create({
      data: {
        purchaseId,
        amount,
        escrowFee,
        status: "HELD",
        paymentMethod: paymentMethod || "Razorpay",
        paymentId: paymentId || null,
        paymentReference: paymentReference || null,
      },
      include: {
        purchase: {
          include: {
            vehicle: true,
            buyer: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Escrow created successfully",
      escrow: {
        id: escrow.id,
        amount: escrow.amount,
        escrowFee: escrow.escrowFee,
        status: escrow.status,
        heldAt: escrow.heldAt,
      },
    });
  } catch (error: any) {
    console.error("Create escrow error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

