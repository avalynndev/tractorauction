import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";
import { sendOTPviaSMS, isSMSConfigured } from "@/lib/sms";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    const identifier = validatedData.identifier.trim();
    const isEmail = identifier.includes("@");
    const isPhone = /^[6-9]\d{9}$/.test(identifier.replace(/\D/g, ""));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { message: "Please enter a valid phone number or email address" },
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
      // Don't reveal if user exists or not (security best practice)
      return NextResponse.json(
        { message: "If an account exists with this phone number or email, an OTP has been sent." },
        { status: 200 } // Return 200 to prevent user enumeration
      );
    }

    // Generate OTP - Use dummy OTP 999999 for testing, or generate random OTP
    const isTestMode = process.env.NODE_ENV === "development" || process.env.TEST_MODE === "true";
    const otp = isTestMode ? "999999" : generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP for password reset
    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    // Send OTP via SMS (if phone) or Email (if email)
    let otpSent = false;
    let smsError = null;

    if (isPhone) {
      // Send via SMS
      if (isTestMode) {
        console.log(`[TEST MODE] Password Reset OTP for ${identifier}: ${otp} (Use 999999 to verify)`);
        otpSent = true;
      } else {
        if (isSMSConfigured()) {
          try {
            otpSent = await sendOTPviaSMS(identifier.replace(/\D/g, ""), otp);
            if (otpSent) {
              console.log(`✅ Password Reset OTP sent via SMS to ${identifier}`);
            } else {
              smsError = "Failed to send OTP via SMS";
              console.error(`❌ Failed to send password reset OTP SMS to ${identifier}`);
            }
          } catch (error: any) {
            smsError = error.message || "Failed to send OTP via SMS";
            console.error(`❌ SMS error for password reset ${identifier}:`, error);
          }
        } else {
          console.log(`[SMS not configured] Password Reset OTP for ${identifier}: ${otp}`);
          otpSent = true;
        }
      }
    } else if (isEmail) {
      // TODO: Implement email sending for password reset
      // For now, log to console in test mode
      if (isTestMode) {
        console.log(`[TEST MODE] Password Reset OTP for ${identifier}: ${otp} (Use 999999 to verify)`);
        otpSent = true;
      } else {
        // TODO: Send email with OTP
        console.log(`[EMAIL not implemented] Password Reset OTP for ${identifier}: ${otp}`);
        otpSent = true; // Temporarily allow for development
      }
    }

    // If SMS provider is configured but SMS failed, return error
    if (!isTestMode && isPhone && isSMSConfigured() && !otpSent) {
      return NextResponse.json(
        {
          message: smsError || "Failed to send OTP. Please try again or contact support.",
          otp: process.env.NODE_ENV === "development" ? otp : undefined,
        },
        { status: 500 }
      );
    }

    // Return success (even if user doesn't exist, to prevent enumeration)
    return NextResponse.json(
      {
        message: "If an account exists with this phone number or email, an OTP has been sent.",
        // Only show OTP in development/test mode
        ...(isTestMode && { otp }),
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input. Please enter a valid phone number or email." },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}






















