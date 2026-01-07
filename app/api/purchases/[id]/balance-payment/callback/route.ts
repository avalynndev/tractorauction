import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

/**
 * Handle Razorpay callback for balance payment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } } 
) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, amount } = body;

    if (!orderId || !paymentId || !signature || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.id;

    // Fetch purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vehicle: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    const isRazorpayConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET;

    const isTestMode =
      process.env.TEST_MODE === "true" ||
      !isRazorpayConfigured;

    if (!isTestMode) {
      // Verify Razorpay signature
      const isValidSignature = verifyRazorpaySignature(
        orderId,
        paymentId,
        signature
      );

      if (!isValidSignature) {
        console.error("Invalid Razorpay signature for balance payment:", {
          orderId,
          paymentId,
        });
        return NextResponse.json(
          { success: false, message: "Invalid payment signature" },
          { status: 400 }
        );
      }

      // Check if payment is captured
      const captured = await isPaymentCaptured(paymentId);
      if (!captured) {
        return NextResponse.json(
          { success: false, message: "Payment not captured" },
          { status: 400 }
        );
      }
    }

    // Update purchase status
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "pending", // Change to pending (awaiting seller approval)
        balanceAmount: null, // Clear balance amount as it's now paid
      },
    });

    // Update vehicle status to SOLD
    await prisma.vehicle.update({
      where: { id: purchase.vehicleId },
      data: { status: "SOLD" },
    });

    return NextResponse.json({
      success: true,
      message: "Balance payment completed successfully",
      paymentId,
      orderId,
      purchase: {
        id: purchase.id,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Balance payment callback error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}



