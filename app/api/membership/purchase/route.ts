import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

const membershipPlans = {
  TRIAL: { price: 0, validity: 15 },
  SILVER: { price: 2000, validity: 30 },
  GOLD: { price: 5000, validity: 180 },
  DIAMOND: { price: 9000, validity: 365 },
};

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

    const { membershipType } = await request.json();

    if (!membershipType || !["TRIAL", "SILVER", "GOLD", "DIAMOND"].includes(membershipType)) {
      return NextResponse.json(
        { message: "Invalid membership type" },
        { status: 400 }
      );
    }

    if (membershipType === "TRIAL") {
      return NextResponse.json(
        { message: "Trial membership is automatically assigned on registration" },
        { status: 400 }
      );
    }

    const plan = membershipPlans[membershipType as keyof typeof membershipPlans];
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user already has active membership
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId: user.id,
        status: "active",
        endDate: { gte: new Date() },
      },
    });

    // Calculate start date (immediately or after current membership expires)
    const startDate = activeMembership && new Date(activeMembership.endDate) > new Date()
      ? new Date(activeMembership.endDate)
      : new Date();

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.validity);

    // Check if Razorpay is configured
    const isRazorpayConfigured = 
      process.env.RAZORPAY_KEY_ID && 
      process.env.RAZORPAY_KEY_SECRET;

    // Allow test mode if explicitly enabled or if Razorpay is not configured
    const isTestMode = 
      process.env.TEST_MODE === "true" || 
      !isRazorpayConfigured;

    if (isTestMode && !isRazorpayConfigured) {
      // Directly create membership in test mode (when Razorpay not configured)
      const { createPaidMembership } = await import("@/lib/membership");
      const membership = await createPaidMembership(
        user.id,
        membershipType as "SILVER" | "GOLD" | "DIAMOND",
        plan.price,
        startDate
      );

      return NextResponse.json({
        message: "Membership activated successfully (Test Mode)",
        membership,
        testMode: true,
      });
    }

    // Create Razorpay order
    try {
      // Double-check Razorpay configuration
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // If not configured, fall back to test mode
        const { createPaidMembership } = await import("@/lib/membership");
        const membership = await createPaidMembership(
          user.id,
          membershipType as "SILVER" | "GOLD" | "DIAMOND",
          plan.price,
          startDate
        );

        return NextResponse.json({
          message: "Membership activated successfully (Test Mode - Razorpay not configured)",
          membership,
          testMode: true,
        });
      }

      // Razorpay receipt must be max 40 characters
      // Format: MEM-{shortUserId}-{timestamp}
      // Use first 8 chars of user ID + last 6 digits of timestamp
      const shortUserId = user.id.substring(0, 8);
      const shortTimestamp = Date.now().toString().slice(-6);
      const receipt = `MEM-${shortUserId}-${shortTimestamp}`; // Max 20 chars
      
      const notes = {
        userId: user.id,
        membershipType: membershipType,
        phoneNumber: user.phoneNumber,
      };

      const razorpayOrder = await createRazorpayOrder(
        plan.price,
        "INR",
        receipt,
        notes
      );

      // Store order details temporarily (optional - for tracking)
      // You can store this in a database table if needed

      return NextResponse.json({
        message: "Order created successfully",
        orderId: razorpayOrder.id,
        amount: plan.price,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID, // Frontend needs this for Razorpay checkout
        userId: user.id,
        membershipType: membershipType,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/membership/payment-callback`,
        name: user.fullName,
        contact: user.phoneNumber,
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      
      // Provide user-friendly error message
      let errorMessage = "Failed to create payment order";
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
          // If Razorpay fails, offer test mode as fallback
          fallbackToTestMode: !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Membership purchase error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

