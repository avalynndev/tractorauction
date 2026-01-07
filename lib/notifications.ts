/**
 * Notification Service for Auction-related events
 * Supports SMS notifications via existing SMS service
 */

import { sendSMSMessage, isSMSConfigured } from "./sms";

// Configuration: Approval deadline in days (default: 7 days)
export const APPROVAL_DEADLINE_DAYS = parseInt(process.env.APPROVAL_DEADLINE_DAYS || "7", 10);

/**
 * Calculate approval deadline date (auction end time + deadline days)
 */
export function calculateApprovalDeadline(auctionEndTime: Date): Date {
  const deadline = new Date(auctionEndTime);
  deadline.setDate(deadline.getDate() + APPROVAL_DEADLINE_DAYS);
  return deadline;
}

/**
 * Check if approval deadline has passed
 */
export function isApprovalDeadlinePassed(auctionEndTime: Date): boolean {
  const deadline = calculateApprovalDeadline(auctionEndTime);
  return new Date() > deadline;
}

/**
 * Get time remaining until approval deadline
 */
export function getApprovalDeadlineRemaining(auctionEndTime: Date): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const deadline = calculateApprovalDeadline(auctionEndTime);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isOverdue: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isOverdue: false };
}

/**
 * Send SMS notification (generic)
 */
async function sendSMSNotification(phoneNumber: string, message: string): Promise<boolean> {
  try {
    if (!isSMSConfigured()) {
      console.log(`[CONSOLE MODE] SMS Notification to ${phoneNumber}:\n${message}`);
      return true; // In console mode, consider it "sent"
    }

    console.log(`📱 Sending notification SMS to ${phoneNumber}...`);
    const success = await sendSMSMessage(phoneNumber, message);
    
    if (success) {
      console.log(`✅ Notification sent successfully to ${phoneNumber}`);
    } else {
      console.error(`❌ Failed to send notification to ${phoneNumber}`);
    }
    
    return success;
  } catch (error: any) {
    console.error(`❌ Error sending SMS notification:`, error.message);
    return false;
  }
}

/**
 * Notify seller when auction ends
 */
export async function notifySellerAuctionEnded(
  sellerPhone: string,
  sellerName: string,
  vehicleBrand: string,
  vehicleModel: string | null,
  winningBid: number,
  buyerName: string,
  auctionId: string
): Promise<boolean> {
  const vehicleInfo = `${vehicleBrand}${vehicleModel ? ` ${vehicleModel}` : ""}`;
  const message = `Dear ${sellerName}, Your auction for ${vehicleInfo} has ended. Winning bid: ₹${winningBid.toLocaleString("en-IN")} by ${buyerName}. Please approve or reject within ${APPROVAL_DEADLINE_DAYS} days. Login: www.tractorauction.in/my-account/auctions`;

  console.log(`📧 Notifying seller ${sellerName} (${sellerPhone}) about auction end`);
  return await sendSMSNotification(sellerPhone, message);
}

/**
 * Notify buyer when bid is approved
 */
export async function notifyBuyerBidApproved(
  buyerPhone: string,
  buyerName: string,
  vehicleBrand: string,
  vehicleModel: string | null,
  bidAmount: number,
  sellerName: string,
  sellerPhone: string
): Promise<boolean> {
  const vehicleInfo = `${vehicleBrand}${vehicleModel ? ` ${vehicleModel}` : ""}`;
  const message = `Dear ${buyerName}, Congratulations! Your bid of ₹${bidAmount.toLocaleString("en-IN")} for ${vehicleInfo} has been approved by seller ${sellerName}. Contact: ${sellerPhone}. Login: www.tractorauction.in/my-account`;

  console.log(`📧 Notifying buyer ${buyerName} (${buyerPhone}) about bid approval`);
  return await sendSMSNotification(buyerPhone, message);
}

/**
 * Notify buyer when bid is rejected
 */
export async function notifyBuyerBidRejected(
  buyerPhone: string,
  buyerName: string,
  vehicleBrand: string,
  vehicleModel: string | null,
  bidAmount: number
): Promise<boolean> {
  const vehicleInfo = `${vehicleBrand}${vehicleModel ? ` ${vehicleModel}` : ""}`;
  const message = `Dear ${buyerName}, Your bid of ₹${bidAmount.toLocaleString("en-IN")} for ${vehicleInfo} has been rejected by the seller. Login: www.tractorauction.in/my-account`;

  console.log(`📧 Notifying buyer ${buyerName} (${buyerPhone}) about bid rejection`);
  return await sendSMSNotification(buyerPhone, message);
}

/**
 * Send reminder to seller about pending approval
 */
export async function remindSellerPendingApproval(
  sellerPhone: string,
  sellerName: string,
  vehicleBrand: string,
  vehicleModel: string | null,
  winningBid: number,
  daysRemaining: number
): Promise<boolean> {
  const vehicleInfo = `${vehicleBrand}${vehicleModel ? ` ${vehicleModel}` : ""}`;
  const message = `Dear ${sellerName}, Reminder: Please approve/reject the winning bid of ₹${winningBid.toLocaleString("en-IN")} for ${vehicleInfo}. ${daysRemaining} day(s) remaining. Login: www.tractorauction.in/my-account/auctions`;

  console.log(`📧 Sending reminder to seller ${sellerName} (${sellerPhone}) about pending approval`);
  return await sendSMSNotification(sellerPhone, message);
}

/**
 * Send deadline warning to seller (24 hours before deadline)
 */
export async function warnSellerApprovalDeadline(
  sellerPhone: string,
  sellerName: string,
  vehicleBrand: string,
  vehicleModel: string | null,
  winningBid: number
): Promise<boolean> {
  const vehicleInfo = `${vehicleBrand}${vehicleModel ? ` ${vehicleModel}` : ""}`;
  const message = `Dear ${sellerName}, URGENT: Approval deadline for ${vehicleInfo} (Winning bid: ₹${winningBid.toLocaleString("en-IN")}) expires in 24 hours. Please take action. Login: www.tractorauction.in/my-account/auctions`;

  console.log(`📧 Sending deadline warning to seller ${sellerName} (${sellerPhone})`);
  return await sendSMSNotification(sellerPhone, message);
}

