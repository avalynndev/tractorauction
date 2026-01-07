import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createPaidMembership } from "@/lib/membership";

/**
 * Razorpay Webhook Handler
 * 
 * This endpoint receives webhook notifications from Razorpay about payment events.
 * It handles:
 * - payment.captured: Payment successfully captured
 * - payment.failed: Payment failed
 * - payment.authorized: Payment authorized (for manual capture)
 * - order.paid: Order fully paid
 * 
 * Webhook URL: https://yourdomain.com/api/membership/webhook
 * 
 * Setup in Razorpay Dashboard:
 * 1. Go to Settings → Webhooks
 * 2. Add webhook URL
 * 3. Select events: payment.captured, payment.failed, order.paid
 * 4. Copy webhook secret and add to RAZORPAY_WEBHOOK_SECRET env variable
 */
export async function POST(request: NextRequest) {
  try {
    // Get webhook signature from headers
    const webhookSignature = request.headers.get("X-Razorpay-Signature");
    if (!webhookSignature) {
      console.error("Missing webhook signature");
      return NextResponse.json(
        { message: "Missing signature" },
        { status: 400 }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { message: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      rawBody,
      webhookSignature,
      webhookSecret
    );

    if (!isValidSignature) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const payment = payload.payload?.payment?.entity;
    const order = payload.payload?.order?.entity;

    console.log(`[Webhook] Received event: ${event}`, {
      paymentId: payment?.id,
      orderId: order?.id,
      amount: payment?.amount,
      status: payment?.status,
    });

    // Handle different webhook events
    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payment, order);
        break;

      case "payment.failed":
        await handlePaymentFailed(payment, order);
        break;

      case "payment.authorized":
        // Payment authorized but not yet captured (for manual capture mode)
        // You can handle this if you use manual capture
        console.log("[Webhook] Payment authorized (not captured yet)", payment?.id);
        break;

      case "order.paid":
        // Order fully paid (all payments captured)
        await handleOrderPaid(order);
        break;

      default:
        console.log(`[Webhook] Unhandled event: ${event}`);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    // Still return 200 to prevent Razorpay from retrying
    return NextResponse.json(
      { message: "Webhook processed with errors" },
      { status: 200 }
    );
  }
}

/**
 * Handle payment.captured event
 */
async function handlePaymentCaptured(payment: any, order: any) {
  try {
    if (!payment || !order) {
      console.error("[Webhook] Missing payment or order data");
      return;
    }

    const paymentId = payment.id;
    const orderId = order.id;
    const amount = payment.amount / 100; // Convert from paise to rupees
    const notes = order.notes || {};

    // Determine payment type from notes
    const paymentType = notes.paymentType || notes.PaymentType;
    const userId = notes.userId || notes.UserId;

    if (!userId) {
      console.error("[Webhook] Missing userId in order notes", { orderId, paymentId });
      return;
    }

    console.log(`[Webhook] Processing payment.captured`, {
      paymentId,
      orderId,
      amount,
      paymentType,
      userId,
    });

    switch (paymentType) {
      case "MEMBERSHIP":
        await handleMembershipPayment(userId, paymentId, orderId, amount, notes);
        break;

      case "REGISTRATION_FEE":
        await handleRegistrationFeePayment(userId, paymentId, orderId, amount);
        break;

      case "EMD":
        await handleEMDPayment(userId, paymentId, orderId, amount, notes);
        break;

      case "BALANCE_PAYMENT":
        await handleBalancePayment(userId, paymentId, orderId, amount, notes);
        break;

      case "TRANSACTION_FEE":
        await handleTransactionFeePayment(userId, paymentId, orderId, amount, notes);
        break;

      default:
        console.log(`[Webhook] Unknown payment type: ${paymentType}`);
    }
  } catch (error) {
    console.error("[Webhook] Error handling payment.captured:", error);
  }
}

/**
 * Handle membership payment
 */
async function handleMembershipPayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number,
  notes: any
) {
  try {
    // Check if membership already exists for this payment
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingMembership) {
      console.log(`[Webhook] Membership already exists for payment ${paymentId}`);
      return;
    }

    const membershipType = notes.membershipType || notes.MembershipType || "SILVER";

    // Get user's current membership to determine start date
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        status: "active",
        endDate: { gte: new Date() },
      },
      orderBy: { endDate: "desc" },
    });

    const startDate =
      activeMembership && new Date(activeMembership.endDate) > new Date()
        ? new Date(activeMembership.endDate)
        : new Date();

    // Create membership
    await createPaidMembership(
      userId,
      membershipType as "SILVER" | "GOLD" | "DIAMOND",
      amount,
      startDate
    );

    console.log(`[Webhook] Membership activated for user ${userId}`, {
      membershipType,
      amount,
      paymentId,
    });
  } catch (error) {
    console.error("[Webhook] Error handling membership payment:", error);
  }
}

/**
 * Handle registration fee payment
 */
async function handleRegistrationFeePayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        registrationFeePaid: true,
      },
    });

    console.log(`[Webhook] Registration fee paid for user ${userId}`, { paymentId });
  } catch (error) {
    console.error("[Webhook] Error handling registration fee payment:", error);
  }
}

/**
 * Handle EMD payment
 */
async function handleEMDPayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number,
  notes: any
) {
  try {
    const auctionId = notes.auctionId || notes.AuctionId;
    if (!auctionId) {
      console.error("[Webhook] Missing auctionId for EMD payment");
      return;
    }

    await prisma.earnestMoneyDeposit.updateMany({
      where: {
        auctionId,
        bidderId: userId,
        status: "PENDING",
      },
      data: {
        status: "PAID",
        paymentId,
        paymentMethod: "Razorpay",
        paidAt: new Date(),
      },
    });

    console.log(`[Webhook] EMD paid for auction ${auctionId} by user ${userId}`, {
      paymentId,
    });
  } catch (error) {
    console.error("[Webhook] Error handling EMD payment:", error);
  }
}

/**
 * Handle balance payment for purchase
 */
async function handleBalancePayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number,
  notes: any
) {
  try {
    const purchaseId = notes.purchaseId || notes.PurchaseId;
    if (!purchaseId) {
      console.error("[Webhook] Missing purchaseId for balance payment");
      return;
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paymentId,
        orderId,
        status: "paid",
      },
    });

    console.log(`[Webhook] Balance payment completed for purchase ${purchaseId}`, {
      paymentId,
      amount,
    });
  } catch (error) {
    console.error("[Webhook] Error handling balance payment:", error);
  }
}

/**
 * Handle transaction fee payment
 */
async function handleTransactionFeePayment(
  userId: string,
  paymentId: string,
  orderId: string,
  amount: number,
  notes: any
) {
  try {
    const purchaseId = notes.purchaseId || notes.PurchaseId;
    if (!purchaseId) {
      console.error("[Webhook] Missing purchaseId for transaction fee payment");
      return;
    }

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        transactionFeePaid: true,
        transactionFeePaymentId: paymentId,
      },
    });

    console.log(`[Webhook] Transaction fee paid for purchase ${purchaseId}`, {
      paymentId,
      amount,
    });
  } catch (error) {
    console.error("[Webhook] Error handling transaction fee payment:", error);
  }
}

/**
 * Handle payment.failed event
 */
async function handlePaymentFailed(payment: any, order: any) {
  try {
    if (!payment || !order) {
      return;
    }

    const paymentId = payment.id;
    const orderId = order.id;
    const notes = order.notes || {};
    const userId = notes.userId || notes.UserId;
    const paymentType = notes.paymentType || notes.PaymentType;

    console.log(`[Webhook] Payment failed`, {
      paymentId,
      orderId,
      paymentType,
      userId,
      error: payment.error_description || payment.error_code,
    });

    // You can add logic here to:
    // - Send notification to user
    // - Update payment status in database
    // - Log failure for analytics
  } catch (error) {
    console.error("[Webhook] Error handling payment.failed:", error);
  }
}

/**
 * Handle order.paid event
 */
async function handleOrderPaid(order: any) {
  try {
    if (!order) {
      return;
    }

    const orderId = order.id;
    const notes = order.notes || {};

    console.log(`[Webhook] Order fully paid`, {
      orderId,
      amount: order.amount / 100,
      notes,
    });

    // Order is fully paid - all payments captured
    // Additional processing can be done here if needed
  } catch (error) {
    console.error("[Webhook] Error handling order.paid:", error);
  }
}

