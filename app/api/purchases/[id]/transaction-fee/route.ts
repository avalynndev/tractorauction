import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

// Initiate transaction fee payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.id;

    // Get purchase details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
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

    // Verify purchase belongs to user
    if (purchase.buyerId !== decoded.userId) {
      return NextResponse.json(
        { message: "Forbidden. This purchase does not belong to you." },
        { status: 403 }
      );
    }

    // Check if transaction fee is already paid
    if (purchase.transactionFeePaid) {
      return NextResponse.json(
        { message: "Transaction fee has already been paid" },
        { status: 400 }
      );
    }

    // Check if transaction fee exists
    if (!purchase.transactionFee || purchase.transactionFee <= 0) {
      return NextResponse.json(
        { message: "No transaction fee applicable for this purchase" },
        { status: 400 }
      );
    }

    // Check if purchase is for auction (transaction fee only applies to auctions)
    if (purchase.purchaseType !== "AUCTION") {
      return NextResponse.json(
        { message: "Transaction fee only applies to auction purchases" },
        { status: 400 }
      );
    }

    // Test mode: Directly mark as paid
    if (process.env.TEST_MODE === "true" || !process.env.RAZORPAY_KEY_ID) {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          transactionFeePaid: true,
          transactionFeePaymentId: `test_tx_fee_${Date.now()}`,
        },
      });

      return NextResponse.json({
        message: "Transaction fee paid successfully (test mode)",
        success: true,
      });
    }

    // Create Razorpay order for transaction fee
    const orderAmount = purchase.transactionFee; // Amount in rupees (function converts to paise)
    const orderDescription = `Transaction Fee - ${purchase.vehicle.tractorBrand} ${purchase.vehicle.tractorModel || ""} ${purchase.vehicle.engineHP} HP`;

    const razorpayOrder = await createRazorpayOrder(
      orderAmount,
      "INR",
      `tx_fee_${purchaseId}_${Date.now()}`,
      {
        purchaseId: purchaseId,
        type: "transaction_fee",
        vehicleId: purchase.vehicleId,
      }
    );

    // Update purchase with order ID
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        orderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: purchase.transactionFee,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      name: "Tractor Auction",
      description: orderDescription,
      prefill: {
        name: purchase.buyer.fullName,
        email: purchase.buyer.email || undefined,
        contact: purchase.buyer.phoneNumber,
      },
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/purchases/${purchaseId}/transaction-fee/callback`,
    });
  } catch (error) {
    console.error("Error initiating transaction fee payment:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}



