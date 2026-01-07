import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

/**
 * Initiate balance payment for auction purchase
 * This is called when winner needs to pay the balance (purchase price - EMD)
 */
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

    // Fetch purchase with related data
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
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
        { message: "Unauthorized to pay for this purchase" },
        { status: 403 }
      );
    }

    // Verify this is an auction purchase
    if (purchase.purchaseType !== "AUCTION") {
      return NextResponse.json(
        { message: "Balance payment is only applicable for auction purchases" },
        { status: 400 }
      );
    }

    // Check if balance payment is needed
    if (!purchase.balanceAmount || purchase.balanceAmount <= 0) {
      return NextResponse.json(
        { message: "No balance amount to pay. Purchase is already fully paid." },
        { status: 400 }
      );
    }

    // Check if purchase is in correct status
    if (purchase.status !== "payment_pending") {
      return NextResponse.json(
        { message: `Purchase is in ${purchase.status} status. Balance payment cannot be initiated.` },
        { status: 400 }
      );
    }

    const balanceAmount = purchase.balanceAmount;

    // Check if Razorpay is configured
    const isRazorpayConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET;

    const isTestMode =
      process.env.TEST_MODE === "true" ||
      !isRazorpayConfigured;

    if (isTestMode && !isRazorpayConfigured) {
      // In test mode, directly update purchase status
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { status: "pending" }, // Change to pending (awaiting seller approval)
      });

      return NextResponse.json({
        message: "Balance payment completed successfully (Test Mode)",
        purchase: {
          id: purchase.id,
          status: "pending",
        },
        testMode: true,
      });
    }

    // Create Razorpay order for balance payment
    try {
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // Fall back to test mode
        await prisma.purchase.update({
          where: { id: purchaseId },
          data: { status: "pending" },
        });

        return NextResponse.json({
          message: "Balance payment completed successfully (Test Mode - Razorpay not configured)",
          purchase: {
            id: purchase.id,
            status: "pending",
          },
          testMode: true,
        });
      }

      // Razorpay receipt must be max 40 characters
      const shortPurchaseId = purchase.id.substring(0, 8);
      const shortTimestamp = Date.now().toString().slice(-6);
      const receipt = `BAL-${shortPurchaseId}-${shortTimestamp}`;

      const notes = {
        purchaseId: purchase.id,
        vehicleId: purchase.vehicleId,
        buyerId: purchase.buyerId,
        sellerId: purchase.vehicle.sellerId,
        balanceAmount: balanceAmount.toString(),
        purchasePrice: purchase.purchasePrice.toString(),
        emdAmount: purchase.emdAmount?.toString() || "0",
        paymentType: "balance",
      };

      const razorpayOrder = await createRazorpayOrder(
        balanceAmount,
        "INR",
        receipt,
        notes
      );

      return NextResponse.json({
        message: "Balance payment order created successfully",
        orderId: razorpayOrder.id,
        amount: balanceAmount,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        purchaseId: purchase.id,
        vehicleId: purchase.vehicleId,
        callbackUrl: `/api/purchases/${purchaseId}/balance-payment/callback`,
        name: purchase.buyer.fullName,
        contact: purchase.buyer.phoneNumber,
        email: purchase.buyer.email || "",
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);

      let errorMessage = "Failed to create balance payment order";
      if (error.message) {
        if (error.message.includes("not configured")) {
          errorMessage = "Payment gateway is not configured. Please contact support or use test mode.";
        } else {
          errorMessage = error.message;
        }
      }

      return NextResponse.json(
        {
          message: errorMessage,
          error: error.message || "Unknown error",
          fallbackToTestMode: !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Balance payment initiation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

