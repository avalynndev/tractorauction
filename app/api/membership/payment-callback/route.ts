import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPaidMembership } from "@/lib/membership";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

/**
 * Payment callback handler for Razorpay
 * This endpoint will be called by the frontend after successful payment
 * It verifies the payment signature and activates membership
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, userId, membershipType, amount } = body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !userId || !membershipType || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if Razorpay is configured
    const isRazorpayConfigured = 
      process.env.RAZORPAY_KEY_ID && 
      process.env.RAZORPAY_KEY_SECRET;

    // Allow test mode if explicitly enabled or if Razorpay is not configured
    const isTestMode = 
      process.env.TEST_MODE === "true" || 
      !isRazorpayConfigured;

    if (!isTestMode) {
      // Verify Razorpay signature (CRITICAL for security)
      const isValidSignature = verifyRazorpaySignature(orderId, paymentId, signature);
      if (!isValidSignature) {
        console.error("Invalid Razorpay signature:", { orderId, paymentId });
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
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if membership already exists for this payment (prevent duplicate)
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        // You can add a paymentId field to track which payment created this membership
        // For now, we'll check by recent creation time
      },
      orderBy: { createdAt: "desc" },
    });

    // If membership was created in the last 5 minutes, might be duplicate
    if (existingMembership && 
        new Date(existingMembership.createdAt).getTime() > Date.now() - 5 * 60 * 1000) {
      return NextResponse.json({
        success: true,
        message: "Membership already activated",
        membership: existingMembership,
      });
    }

    // Get user's current membership to determine start date
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        status: "active",
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: "desc" },
    });

    const startDate = activeMembership && new Date(activeMembership.endDate) > new Date()
      ? new Date(activeMembership.endDate)
      : new Date();

    // Create membership
    const membership = await createPaidMembership(
      userId,
      membershipType as "SILVER" | "GOLD" | "DIAMOND",
      amount,
      startDate
    );

    return NextResponse.json({
      success: true,
      message: "Membership activated successfully",
      membership,
      paymentId,
      orderId,
    });
  } catch (error) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

