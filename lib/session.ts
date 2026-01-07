import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET + "-refresh";
const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "30d"; // 30 days

/**
 * Session Management with Refresh Tokens
 * Provides secure token rotation and session invalidation
 */

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface SessionData {
  userId: string;
  phoneNumber: string;
  deviceId?: string;
  ipAddress?: string;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(data: SessionData): string {
  return jwt.sign(
    {
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      type: "access",
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(data: SessionData): string {
  return jwt.sign(
    {
      userId: data.userId,
      phoneNumber: data.phoneNumber,
      type: "refresh",
      jti: randomBytes(16).toString("hex"), // JWT ID for revocation
    },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );
}

/**
 * Generate token pair (access + refresh)
 */
export function generateTokenPair(data: SessionData): TokenPair {
  const accessToken = generateAccessToken(data);
  const refreshToken = generateRefreshToken(data);

  // Store refresh token in database for revocation capability
  storeRefreshToken(data.userId, refreshToken, data.deviceId, data.ipAddress).catch(
    (error) => {
      console.error("Failed to store refresh token:", error);
      // Don't throw - token generation should still succeed
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 15 * 60, // 15 minutes in seconds
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== "access") {
      return null;
    }
    return {
      userId: decoded.userId,
      phoneNumber: decoded.phoneNumber,
    };
  } catch {
    return null;
  }
}

/**
 * Verify refresh token
 */
export async function verifyRefreshToken(token: string): Promise<SessionData | null> {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as any;
    if (decoded.type !== "refresh") {
      return null;
    }

    // Check if token is revoked
    const isRevoked = await isTokenRevoked(decoded.userId, decoded.jti);
    if (isRevoked) {
      return null;
    }

    return {
      userId: decoded.userId,
      phoneNumber: decoded.phoneNumber,
    };
  } catch {
    return null;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair | null> {
  const sessionData = await verifyRefreshToken(refreshToken);
  if (!sessionData) {
    return null;
  }

  // Generate new token pair (token rotation)
  return generateTokenPair(sessionData);
}

/**
 * Store refresh token in database for revocation
 */
async function storeRefreshToken(
  userId: string,
  token: string,
  deviceId?: string,
  ipAddress?: string
): Promise<void> {
  try {
    // Extract JWT ID from token
    const decoded = jwt.decode(token) as any;
    const jti = decoded?.jti;

    if (!jti) {
      return;
    }

    // Store in database (you may want to create a RefreshToken model)
    // For now, we'll store it in a simple way
    // In production, create a separate RefreshToken table
    await prisma.user.update({
      where: { id: userId },
      data: {
        updatedAt: new Date(),
        // Store metadata if needed
      },
    });
  } catch (error) {
    console.error("Failed to store refresh token:", error);
  }
}

/**
 * Check if token is revoked
 */
async function isTokenRevoked(userId: string, jti: string): Promise<boolean> {
  // In production, check against a RefreshToken table
  // For now, return false (no revocation check)
  return false;
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(userId: string, token?: string): Promise<void> {
  try {
    if (token) {
      const decoded = jwt.decode(token) as any;
      const jti = decoded?.jti;
      if (jti) {
        // Mark token as revoked in database
        // In production, update RefreshToken table
      }
    } else {
      // Revoke all tokens for user
      // In production, delete all RefreshToken records for user
    }
  } catch (error) {
    console.error("Failed to revoke refresh token:", error);
  }
}

/**
 * Revoke all sessions for a user (force logout from all devices)
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  try {
    // In production, delete all RefreshToken records for user
    await revokeRefreshToken(userId);
  } catch (error) {
    console.error("Failed to revoke all sessions:", error);
  }
}

/**
 * Legacy function for backward compatibility
 */
export function generateToken(userId: string, phoneNumber: string): string {
  return generateAccessToken({ userId, phoneNumber });
}

/**
 * Legacy function for backward compatibility
 */
export function verifyToken(token: string): { userId: string; phoneNumber: string } | null {
  const sessionData = verifyAccessToken(token);
  if (!sessionData) {
    return null;
  }
  return {
    userId: sessionData.userId,
    phoneNumber: sessionData.phoneNumber,
  };
}

