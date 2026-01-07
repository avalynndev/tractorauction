import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const resetPasswordSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    const identifier = validatedData.identifier.trim();
    const isEmail = identifier.includes("@");
    const isPhone = /^[6-9]\d{9}$/.test(identifier.replace(/\D/g, ""));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { message: "Invalid phone number or email address" },
        { status: 400 }
      );
    }

    // Find user by phone or email
    let user = null;
    if (isPhone) {
      const phoneNumber = identifier.replace(/\D/g, "");
      user = await prisma.user.findUnique({
        where: { phoneNumber },
      });
    } else if (isEmail) {
      user = await prisma.user.findUnique({
        where: { email: identifier.toLowerCase() },
      });
    }

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Normalize OTP (trim whitespace, remove any non-numeric characters)
    const enteredOTP = validatedData.otp.trim().replace(/\D/g, "");
    const storedOTP = user.otp?.trim() || "";

    // Check OTP - Allow dummy OTP 999999 for testing
    const isDummyOTP = enteredOTP === "999999";
    const isValidOTP = storedOTP === enteredOTP || isDummyOTP;

    if (!isValidOTP) {
      return NextResponse.json(
        { message: "Invalid OTP. Please check and try again." },
        { status: 400 }
      );
    }

    // Check OTP expiry (skip for dummy OTP)
    if (!isDummyOTP && (!user.otpExpiry || user.otpExpiry < new Date())) {
      return NextResponse.json(
        { message: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = hashPassword(validatedData.newPassword);

    // Update user password and clear OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        otp: null,
        otpExpiry: null,
      },
    });

    // Log password reset (for security audit)
    console.log(`✅ Password reset successful for user: ${user.id} (${user.phoneNumber})`);

    return NextResponse.json(
      { message: "Password reset successfully. You can now sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json(
        { message: firstError.message || "Invalid input" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}






















