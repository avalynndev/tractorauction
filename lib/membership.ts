import { prisma } from "./prisma";

/**
 * Check if user has active membership
 */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: "active",
      endDate: {
        gte: new Date(),
      },
    },
  });

  return !!membership;
}

/**
 * Get active membership for user
 */
export async function getActiveMembership(userId: string) {
  return await prisma.membership.findFirst({
    where: {
      userId,
      status: "active",
      endDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      endDate: "desc",
    },
  });
}

/**
 * Check and update expired memberships
 * Should be called periodically (via cron job)
 */
export async function checkAndUpdateMembershipExpiry() {
  const now = new Date();
  
  // Update all expired memberships
  const result = await prisma.membership.updateMany({
    where: {
      status: "active",
      endDate: {
        lt: now,
      },
    },
    data: {
      status: "expired",
    },
  });

  return result.count;
}

/**
 * Get memberships expiring within specified days
 */
export async function getExpiringMemberships(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return await prisma.membership.findMany({
    where: {
      status: "active",
      endDate: {
        gte: new Date(),
        lte: futureDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true,
        },
      },
    },
    orderBy: {
      endDate: "asc",
    },
  });
}

/**
 * Create 15-day free trial membership for new user
 */
export async function createTrialMembership(userId: string) {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 15);

  return await prisma.membership.create({
    data: {
      userId,
      membershipType: "TRIAL",
      startDate: new Date(),
      endDate: trialEndDate,
      amount: 0,
      status: "active",
    },
  });
}

/**
 * Create paid membership
 */
export async function createPaidMembership(
  userId: string,
  membershipType: "SILVER" | "GOLD" | "DIAMOND",
  amount: number,
  startDate?: Date
) {
  const membershipPlans = {
    SILVER: 30,
    GOLD: 180,
    DIAMOND: 365,
  };

  const validityDays = membershipPlans[membershipType];
  const start = startDate || new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + validityDays);

  return await prisma.membership.create({
    data: {
      userId,
      membershipType,
      startDate: start,
      endDate: end,
      amount,
      status: "active",
    },
  });
}

/**
 * Get membership days remaining
 */
export function getDaysRemaining(endDate: Date): number {
  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Check if membership is expiring soon (within 3 days)
 */
export function isExpiringSoon(endDate: Date, days: number = 3): boolean {
  return getDaysRemaining(endDate) <= days && getDaysRemaining(endDate) > 0;
}
