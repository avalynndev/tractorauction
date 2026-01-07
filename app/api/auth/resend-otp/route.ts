import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";
import { sendOTPviaSMS, isSMSConfigured } from "@/lib/sms";
import { z } from "zod";

const resendOtpSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = resendOtpSchema.parse(body);

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

    // Generate new OTP - Use dummy OTP 999999 for testing, or generate random OTP
    const isTestMode = process.env.NODE_ENV === "development" || process.env.TEST_MODE === "true";
    const otp = isTestMode ? "999999" : generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
    });

    // Send OTP via SMS (Twilio) or console (test mode)
    let smsSent = false;
    let smsError = null;

    if (isTestMode) {
      console.log(`[TEST MODE] OTP for ${validatedData.phoneNumber}: ${otp} (Use 999999 to verify)`);
      smsSent = true; // Test mode doesn't require actual SMS
    } else {
      // Try to send via SMS provider if configured
      if (isSMSConfigured()) {
        try {
          smsSent = await sendOTPviaSMS(validatedData.phoneNumber, otp);
          if (smsSent) {
            console.log(`✅ OTP sent via SMS to ${validatedData.phoneNumber}. OTP: ${otp}`);
          } else {
            smsError = "Failed to send OTP via SMS. Please check SMS provider configuration.";
            console.error(`❌ Failed to send OTP SMS to ${validatedData.phoneNumber}. OTP: ${otp}`);
          }
        } catch (error: any) {
          smsError = error.message || "Failed to send OTP via SMS";
          console.error(`❌ SMS error for ${validatedData.phoneNumber}:`, error);
        }
      } else {
        // SMS provider not configured, log OTP to console
        console.log(`[SMS not configured] OTP for ${validatedData.phoneNumber}: ${otp}`);
        smsSent = true; // Not configured, so we log to console (acceptable for dev)
      }
    }

    // If SMS provider is configured but SMS failed, return error
    if (!isTestMode && isSMSConfigured() && !smsSent) {
      return NextResponse.json(
        { 
          message: smsError || "Failed to send OTP. Please try again or contact support.",
          otp: process.env.NODE_ENV === "development" ? otp : undefined, // Only show OTP in dev mode for debugging
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "OTP resent successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid phone number" },
        { status: 400 }
      );
    }

    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


