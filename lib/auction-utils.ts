/**
 * Client-safe utility functions for auction deadlines
 * These functions don't import any server-only modules
 */

// Configuration: Approval deadline in days (default: 7 days)
export const APPROVAL_DEADLINE_DAYS = 7;

/**
 * Calculate approval deadline date (auction end time + deadline days)
 */
export function calculateApprovalDeadline(auctionEndTime: Date | string): Date {
  const endTime = typeof auctionEndTime === "string" ? new Date(auctionEndTime) : auctionEndTime;
  const deadline = new Date(endTime);
  deadline.setDate(deadline.getDate() + APPROVAL_DEADLINE_DAYS);
  return deadline;
}

/**
 * Check if approval deadline has passed
 */
export function isApprovalDeadlinePassed(auctionEndTime: Date | string): boolean {
  const deadline = calculateApprovalDeadline(auctionEndTime);
  return new Date() > deadline;
}

/**
 * Get time remaining until approval deadline
 * Returns an object with days, hours, minutes, and isOverdue flag
 */
export function getApprovalDeadlineRemaining(auctionEndTime: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const endTime = typeof auctionEndTime === "string" ? new Date(auctionEndTime) : auctionEndTime;
  const deadline = calculateApprovalDeadline(endTime);
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

