import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth";
import { z } from "zod";
import { isAccountLocked, recordFailedLoginAttempt, resetFailedLoginAttempts, getAccountLockoutStatus } from "@/lib/account-lockout";

const MAX_FAILED_ATTEMPTS = 5;

const verifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = verifyOtpSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if account is locked
    const accountLocked = await isAccountLocked(user.id);
    if (accountLocked) {
      const lockoutStatus = await getAccountLockoutStatus(user.id);
      const lockoutMinutes = lockoutStatus.lockoutDurationMs
        ? Math.ceil(lockoutStatus.lockoutDurationMs / 60000)
        : 15;
      
      return NextResponse.json(
        { 
          message: `Account temporarily locked due to multiple failed OTP attempts. Please try again in ${lockoutMinutes} minutes.`,
          accountLocked: true,
          lockoutUntil: lockoutStatus.lockoutUntil,
        },
        { status: 423 } // 423 Locked
      );
    }

    // Normalize OTP (trim whitespace, remove any non-numeric characters)
    const enteredOTP = validatedData.otp.trim().replace(/\D/g, "");
    const storedOTP = user.otp?.trim() || "";

    // Debug logging (only in development)
    if (process.env.NODE_ENV === "development") {
      console.log("OTP Verification Debug:", {
        enteredOTP,
        storedOTP: storedOTP ? `${storedOTP.substring(0, 2)}****` : "null",
        phoneNumber: validatedData.phoneNumber,
        otpExpiry: user.otpExpiry,
        isExpired: user.otpExpiry ? user.otpExpiry < new Date() : null,
      });
    }

    // Check OTP - Allow dummy OTP 999999 for testing
    const isDummyOTP = enteredOTP === "999999";
    const isValidOTP = storedOTP === enteredOTP || isDummyOTP;

    if (!isValidOTP) {
      // Record failed OTP attempt
      const lockoutResult = await recordFailedLoginAttempt(user.id);
      
      if (lockoutResult.locked) {
        return NextResponse.json(
          { 
            message: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed OTP attempts. Please try again in 15 minutes.`,
            accountLocked: true,
            lockoutUntil: lockoutResult.lockoutUntil,
          },
          { status: 423 } // 423 Locked
        );
      }
      
      // Provide more helpful error message
      const errorMessage = storedOTP
        ? "Invalid OTP. Please check and try again."
        : "No OTP found. Please request a new OTP.";
      
      return NextResponse.json(
        { 
          message: errorMessage,
          remainingAttempts: lockoutResult.remainingAttempts,
          // In development, provide more details
          ...(process.env.NODE_ENV === "development" && {
            debug: {
              enteredLength: enteredOTP.length,
              storedLength: storedOTP.length,
              enteredOTP: enteredOTP.substring(0, 2) + "****",
            }
          })
        },
        { status: 400 }
      );
    }

    // Reset failed login attempts on successful OTP verification
    await resetFailedLoginAttempts(user.id);

    // Check OTP expiry (skip for dummy OTP)
    if (!isDummyOTP && (!user.otpExpiry || user.otpExpiry < new Date())) {
      return NextResponse.json(
        { message: "OTP expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Clear OTP and activate account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        otp: null,
        otpExpiry: null,
        isActive: true,
      },
    });

    // Generate JWT token
    const token = generateToken(user.id, user.phoneNumber);

    // Check if this is a new user (registered within last 5 minutes)
    const now = new Date();
    const userCreatedAt = user.createdAt;
    const timeSinceCreation = now.getTime() - userCreatedAt.getTime();
    const isNewUser = timeSinceCreation < 5 * 60 * 1000; // 5 minutes

    // Create response with token in both body and cookie
    const response = NextResponse.json(
      {
        message: "OTP verified successfully",
        token,
        isNewUser, // Flag to indicate if this is a newly registered user
        user: {
          id: user.id,
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
        },
      },
      { status: 200 }
    );

    // Set token in HTTP-only cookie as backup
    response.cookies.set("token", token, {
      httpOnly: false, // Allow client-side access
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data" },
        { status: 400 }
      );
    }

    console.error("OTP verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


