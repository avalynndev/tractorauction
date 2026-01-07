import { prisma } from '@/lib/prisma';

/**
 * Account Lockout Management
 * Prevents brute force attacks by locking accounts after failed login attempts
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const RESET_WINDOW_MS = 60 * 60 * 1000; // 1 hour (reset counter after this)

/**
 * Check if account is currently locked
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accountLockedUntil: true },
  });

  if (!user || !user.accountLockedUntil) {
    return false;
  }

  // Check if lockout period has expired
  if (user.accountLockedUntil < new Date()) {
    // Lockout expired, reset the lockout
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountLockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
    return false;
  }

  return true;
}

/**
 * Record a failed login attempt
 * Returns true if account should be locked
 */
export async function recordFailedLoginAttempt(
  userId: string,
  phoneNumber?: string
): Promise<{ locked: boolean; remainingAttempts: number; lockoutUntil?: Date }> {
  const user = await prisma.user.findUnique({
    where: phoneNumber ? { phoneNumber } : { id: userId },
    select: {
      id: true,
      failedLoginAttempts: true,
      lastFailedLoginAt: true,
      accountLockedUntil: true,
    },
  });

  if (!user) {
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const now = new Date();
  const lastFailedLogin = user.lastFailedLoginAt;

  // Reset counter if last failed attempt was more than RESET_WINDOW_MS ago
  let currentAttempts = user.failedLoginAttempts;
  if (lastFailedLogin && (now.getTime() - lastFailedLogin.getTime()) > RESET_WINDOW_MS) {
    currentAttempts = 0;
  }

  // Increment failed attempts
  const newAttempts = currentAttempts + 1;
  const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;

  const lockoutUntil = shouldLock
    ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: newAttempts,
      lastFailedLoginAt: now,
      accountLockedUntil: lockoutUntil,
    },
  });

  return {
    locked: shouldLock,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts),
    lockoutUntil: lockoutUntil || undefined,
  };
}

/**
 * Reset failed login attempts on successful login
 */
export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      lastFailedLoginAt: null,
      accountLockedUntil: null,
    },
  });
}

/**
 * Get account lockout status
 */
export async function getAccountLockoutStatus(
  userId: string,
  phoneNumber?: string
): Promise<{
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  lockoutUntil?: Date;
  lockoutDurationMs?: number;
}> {
  const user = await prisma.user.findUnique({
    where: phoneNumber ? { phoneNumber } : { id: userId },
    select: {
      id: true,
      failedLoginAttempts: true,
      accountLockedUntil: true,
    },
  });

  if (!user) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_FAILED_ATTEMPTS,
    };
  }

  const now = new Date();
  const isLocked = user.accountLockedUntil
    ? user.accountLockedUntil > now
    : false;

  return {
    isLocked,
    failedAttempts: user.failedLoginAttempts,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - user.failedLoginAttempts),
    lockoutUntil: user.accountLockedUntil || undefined,
    lockoutDurationMs: isLocked && user.accountLockedUntil
      ? user.accountLockedUntil.getTime() - now.getTime()
      : undefined,
  };
}

/**
 * Manually unlock an account (admin function)
 */
export async function unlockAccount(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastFailedLoginAt: null,
    },
  });
}

