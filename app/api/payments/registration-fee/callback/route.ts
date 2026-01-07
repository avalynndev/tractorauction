import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, amount } = body;

    if (!orderId || !paymentId || !signature || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

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

    const isRazorpayConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET;

    const isTestMode =
      process.env.TEST_MODE === "true" ||
      !isRazorpayConfigured;

    if (!isTestMode) {
      const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValidSignature) {
        console.error("Invalid Razorpay signature for registration fee:", { orderId, paymentId });
        return NextResponse.json(
          { message: "Invalid payment signature" },
          { status: 400 }
        );
      }

      const isCaptured = await isPaymentCaptured(paymentId);
      if (!isCaptured) {
        return NextResponse.json(
          { message: "Payment not captured" },
          { status: 400 }
        );
      }
    }

    // Update user as active (registration fee paid)
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { 
        isActive: true,
        registrationFeePaid: true,
      },
    });

    // TODO: Store payment record in a payments table if needed

    return NextResponse.json({
      success: true,
      message: "Registration fee paid successfully",
      paymentId,
      orderId,
    });
  } catch (error) {
    console.error("Registration fee payment callback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

