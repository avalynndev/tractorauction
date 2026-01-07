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

    // Check if user already paid registration fee
    // For now, we'll check if user is active (assuming registration fee is paid on activation)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true, fullName: true, email: true, phoneNumber: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Registration fee amount (currently FREE, but keeping structure for future)
    const registrationFeeAmount = 0; // Free till 31st March 2026
    const actualAmount = 10000; // Original amount

    // Check if Razorpay is configured
    const isRazorpayConfigured =
      process.env.RAZORPAY_KEY_ID &&
      process.env.RAZORPAY_KEY_SECRET;

    const isTestMode =
      process.env.TEST_MODE === "true" ||
      !isRazorpayConfigured;

    // If free or test mode, return success immediately
    if (registrationFeeAmount === 0 || isTestMode) {
      // Update user as active (registration fee paid)
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { 
          isActive: true,
          registrationFeePaid: true,
        },
      });

      return NextResponse.json({
        message: "Registration fee waived (Free offer active)",
        amount: registrationFeeAmount,
        actualAmount: actualAmount,
        testMode: true,
      });
    }

    // Create Razorpay order
    const shortUserId = decoded.userId.substring(0, 8);
    const shortTimestamp = Date.now().toString().slice(-6);
    const receipt = `REG-${shortUserId}-${shortTimestamp}`;

    const notes = {
      userId: decoded.userId,
      paymentType: "REGISTRATION_FEE",
      phoneNumber: user.phoneNumber,
    };

    const razorpayOrder = await createRazorpayOrder(
      registrationFeeAmount,
      "INR",
      receipt,
      notes
    );

    return NextResponse.json({
      message: "Order created successfully",
      orderId: razorpayOrder.id,
      amount: registrationFeeAmount,
      actualAmount: actualAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      name: user.fullName,
      contact: user.phoneNumber,
      email: user.email || "",
    });
  } catch (error: any) {
    console.error("Registration fee payment initiation error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

