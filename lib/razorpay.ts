import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

/**
 * Create a Razorpay order for membership purchase
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = "INR",
  receipt: string,
  notes?: Record<string, string>
) {
  try {
    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment variables.");
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise (smallest currency unit)
      currency,
      receipt,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    
    // Provide more specific error messages
    if (error.message) {
      throw new Error(error.message);
    } else if (error.error) {
      throw new Error(error.error.description || "Failed to create Razorpay order");
    } else {
      throw new Error("Failed to create payment order. Please check your Razorpay configuration.");
    }
  }
}

/**
 * Verify Razorpay payment signature
 * This is crucial for security - always verify the signature on the server
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
    
    // Create the signature string
    const text = `${orderId}|${paymentId}`;
    
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    // Compare signatures (use constant-time comparison to prevent timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Error verifying Razorpay signature:", error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    console.error("Error fetching payment details:", error);
    throw error;
  }
}

/**
 * Check if payment is captured
 */
export async function isPaymentCaptured(paymentId: string): Promise<boolean> {
  try {
    const payment = await getPaymentDetails(paymentId);
    return payment.status === "captured";
  } catch (error) {
    console.error("Error checking payment status:", error);
    return false;
  }
}

/**
 * Refund a Razorpay payment
 * @param paymentId - The Razorpay payment ID to refund
 * @param amount - Amount to refund (in rupees). If not provided, full refund
 * @param notes - Optional notes for the refund
 */
export async function refundRazorpayPayment(
  paymentId: string,
  amount?: number,
  notes?: Record<string, string>
) {
  try {
    // Check if Razorpay is properly configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay is not configured. Cannot process refund.");
    }

    const refundOptions: any = {
      payment_id: paymentId,
      notes: notes || {},
    };

    // If amount is provided, specify it (partial refund)
    if (amount && amount > 0) {
      refundOptions.amount = amount * 100; // Convert to paise
    }

    const refund = await razorpay.payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error: any) {
    console.error("Error refunding Razorpay payment:", error);
    
    if (error.message) {
      throw new Error(error.message);
    } else if (error.error) {
      throw new Error(error.error.description || "Failed to process refund");
    } else {
      throw new Error("Failed to process refund. Please check your Razorpay configuration.");
    }
  }
}

/**
 * Verify Razorpay webhook signature
 * Webhook signatures use a different format than payment signatures
 * @param webhookBody - The raw webhook body (as string)
 * @param webhookSignature - The X-Razorpay-Signature header value
 * @param webhookSecret - The webhook secret from Razorpay dashboard
 */
export function verifyWebhookSignature(
  webhookBody: string,
  webhookSignature: string,
  webhookSecret: string
): boolean {
  try {
    // Create the expected signature
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(webhookBody)
      .digest("hex");

    // Compare signatures (use constant-time comparison to prevent timing attacks)
    return crypto.timingSafeEqual(
      Buffer.from(webhookSignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

