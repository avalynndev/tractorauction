import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

// Handle EMD payment callback
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
    const auctionId = resolvedParams.id;
    const body = await request.json();
    const { emdId, orderId, paymentId, signature, amount } = body;

    if (!emdId || !orderId || !paymentId || !signature || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValidSignature) {
      console.error("Invalid Razorpay signature for EMD:", { orderId, paymentId });
      return NextResponse.json(
        { message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Verify payment is captured
    const isCaptured = await isPaymentCaptured(paymentId);
    if (!isCaptured) {
      return NextResponse.json(
        { message: "Payment not captured" },
        { status: 400 }
      );
    }

    // Find the EMD record
    const emd = await prisma.earnestMoneyDeposit.findUnique({
      where: { id: emdId },
      include: {
        auction: {
          select: {
            id: true,
            emdAmount: true,
          },
        },
        bidder: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!emd) {
      return NextResponse.json(
        { message: "EMD record not found" },
        { status: 404 }
      );
    }

    if (emd.bidderId !== decoded.userId) {
      return NextResponse.json(
        { message: "Unauthorized to confirm this EMD payment" },
        { status: 403 }
      );
    }

    if (emd.auctionId !== auctionId) {
      return NextResponse.json(
        { message: "EMD does not belong to this auction" },
        { status: 400 }
      );
    }

    // Prevent duplicate processing
    if (emd.status === "PAID") {
      return NextResponse.json({
        success: true,
        message: "EMD already processed",
        emd: emd,
      });
    }

    // Update EMD status to PAID
    const updatedEMD = await prisma.earnestMoneyDeposit.update({
      where: { id: emdId },
      data: {
        status: "PAID",
        paymentMethod: "Razorpay",
        paymentId: paymentId,
        paymentReference: orderId,
        paidAt: new Date(),
      },
    });

    // TODO: Send email notification to bidder
    // await notifyBidderEMDPaid(emd.bidderId, auctionId, emd.amount);

    return NextResponse.json({
      success: true,
      message: "EMD payment successful! You can now place bids.",
      emd: updatedEMD,
      paymentId,
      orderId,
    });
  } catch (error) {
    console.error("EMD payment callback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}



