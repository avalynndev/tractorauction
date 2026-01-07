import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRazorpaySignature, isPaymentCaptured } from "@/lib/razorpay";

/**
 * Payment callback handler for vehicle purchase
 * This endpoint verifies the payment signature and creates escrow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, paymentId, signature, purchaseId, amount } = body;

    // Validate required fields
    if (!orderId || !paymentId || !signature || !purchaseId || !amount) {
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

    // Fetch purchase with vehicle and buyer details
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
        escrow: true,
      },
    });

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    // Check if escrow already exists (prevent duplicate)
    if (purchase.escrow) {
      return NextResponse.json({
        success: true,
        message: "Payment already processed",
        purchase: {
          id: purchase.id,
          status: purchase.status,
        },
        escrow: {
          id: purchase.escrow.id,
          amount: purchase.escrow.amount,
          escrowFee: purchase.escrow.escrowFee,
        },
      });
    }

    // Calculate escrow fee
    const purchasePrice = purchase.purchasePrice;
    const escrowFeePercentage = 0.02; // 2%
    const escrowFee = Math.min(
      Math.max(purchasePrice * escrowFeePercentage, 500),
      5000
    );

    // Create escrow
    const escrow = await prisma.escrow.create({
      data: {
        purchaseId: purchase.id,
        amount: purchasePrice,
        escrowFee,
        status: "HELD",
        paymentMethod: isTestMode ? "TEST_MODE" : "Razorpay",
        paymentId: isTestMode ? null : paymentId,
        paymentReference: isTestMode ? null : orderId,
      },
    });

    // Update purchase status from "payment_pending" to "pending" (awaiting seller approval)
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchase.id },
      data: { status: "pending" },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            referenceNumber: true,
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

    // Update vehicle status to SOLD
    await prisma.vehicle.update({
      where: { id: purchase.vehicleId },
      data: { status: "SOLD" },
    });

    // Send email notifications (async, don't wait)
    try {
      const { notifyBuyerPurchaseConfirmed, notifySellerVehicleSold } = await import("@/lib/email-notifications");
      
      // Notify buyer
      if (purchase.buyer.email) {
        notifyBuyerPurchaseConfirmed(
          purchase.buyer.id,
          purchase.id,
          updatedPurchase.vehicle,
          purchase.purchasePrice
        ).catch((err) => console.error("Error sending buyer purchase email:", err));
      }

      // Notify seller
      if (purchase.vehicle.seller.email) {
        notifySellerVehicleSold(
          purchase.vehicle.seller.id,
          purchase.vehicle.id,
          updatedPurchase.vehicle,
          purchase.purchasePrice,
          updatedPurchase.buyer
        ).catch((err) => console.error("Error sending seller sold email:", err));
      }
    } catch (emailError) {
      console.error("Error importing email notifications:", emailError);
      // Don't fail the purchase if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment successful! Purchase confirmed.",
      purchase: {
        id: updatedPurchase.id,
        status: updatedPurchase.status,
        purchasePrice: updatedPurchase.purchasePrice,
      },
      escrow: {
        id: escrow.id,
        amount: escrow.amount,
        escrowFee: escrow.escrowFee,
        status: escrow.status,
      },
      paymentId: isTestMode ? null : paymentId,
      orderId: isTestMode ? null : orderId,
    });
  } catch (error: any) {
    console.error("Payment callback error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



