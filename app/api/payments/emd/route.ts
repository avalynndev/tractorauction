import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { fullName: true, email: true, phoneNumber: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // EMD amount
    const emdAmount = 10000;

    // Check if Razorpay is configured
    const isRazorpayConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET;

    const isTestMode =
      process.env.TEST_MODE === "true" ||
      !isRazorpayConfigured;

    // Return early if in test mode (either TEST_MODE=true or Razorpay not configured)
    if (isTestMode) {
      return NextResponse.json({
        message: "EMD payment initiated successfully (Test Mode)",
        amount: emdAmount,
        testMode: true,
      });
    }

    // Create Razorpay order
    const shortUserId = decoded.userId.substring(0, 8);
    const shortTimestamp = Date.now().toString().slice(-6);
    const receipt = `EMD-${shortUserId}-${shortTimestamp}`;

    const notes = {
      userId: decoded.userId,
      paymentType: "EMD",
      phoneNumber: user.phoneNumber,
    };

    const razorpayOrder = await createRazorpayOrder(
      emdAmount,
      "INR",
      receipt,
      notes
    );

    return NextResponse.json({
      message: "Order created successfully",
      orderId: razorpayOrder.id,
      amount: emdAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      name: user.fullName,
      contact: user.phoneNumber,
      email: user.email || "",
    });
  } catch (error: any) {
    console.error("EMD payment initiation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



