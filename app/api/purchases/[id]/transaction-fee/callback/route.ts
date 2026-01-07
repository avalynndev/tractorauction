import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

// Handle Razorpay callback for transaction fee payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.id;

    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { message: "Missing payment details" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Get purchase details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    // Verify order ID matches
    if (purchase.orderId !== razorpay_order_id) {
      return NextResponse.json(
        { message: "Order ID mismatch" },
        { status: 400 }
      );
    }

    // Check if payment is captured
    const isCaptured = await isPaymentCaptured(razorpay_payment_id);
    if (!isCaptured) {
      return NextResponse.json(
        { message: "Payment not captured" },
        { status: 400 }
      );
    }

    // Update purchase with transaction fee payment details
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        transactionFeePaid: true,
        transactionFeePaymentId: razorpay_payment_id,
      },
    });

    // If both balance and transaction fee are paid, update status to pending (awaiting seller approval)
    const balancePaid = !purchase.balanceAmount || purchase.balanceAmount === 0;
    if (balancePaid) {
      await prisma.purchase.update({
        where: { id: purchaseId },
        data: {
          status: "pending", // Awaiting seller approval
        },
      });
    }

    return NextResponse.json({
      message: "Transaction fee payment successful",
      success: true,
    });
  } catch (error) {
    console.error("Error processing transaction fee callback:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}



