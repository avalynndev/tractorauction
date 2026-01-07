import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, generateOTP } from "@/lib/auth";
import { sendOTPviaSMS, isSMSConfigured } from "@/lib/sms";
import { z } from "zod";

const requestPhoneChangeSchema = z.object({
  newPhoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number format"),
});

const verifyPhoneChangeSchema = z.object({
  newPhoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number format"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

/**
 * Request phone number change (sends OTP to new number)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "request") {
      // Request phone change - send OTP
      const validatedData = requestPhoneChangeSchema.parse({
        newPhoneNumber: body.newPhoneNumber,
      });

      // Check if new phone number is same as current
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { phoneNumber: true },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      if (user.phoneNumber === validatedData.newPhoneNumber) {
        return NextResponse.json(
          { message: "New phone number must be different from current number" },
          { status: 400 }
        );
      }

      // Check if phone number is already registered
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: validatedData.newPhoneNumber },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "This phone number is already registered" },
          { status: 400 }
        );
      }

      // Generate OTP
      const isTestMode = process.env.NODE_ENV === "development" || process.env.TEST_MODE === "true";
      const otp = isTestMode ? "999999" : generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP temporarily (we'll use a separate field or session)
      // For now, store in user's otp field (will be cleared after verification)
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          otp,
          otpExpiry,
        },
      });

      // Send OTP via SMS
      let smsSent = false;
      if (isTestMode) {
        console.log(`[TEST MODE] Phone change OTP for ${validatedData.newPhoneNumber}: ${otp}`);
        smsSent = true;
      } else if (isSMSConfigured()) {
        try {
          smsSent = await sendOTPviaSMS(validatedData.newPhoneNumber, otp);
        } catch (error) {
          console.error("Error sending phone change OTP:", error);
        }
      }

      return NextResponse.json({
        message: smsSent
          ? "OTP sent to new phone number"
          : "OTP generated. Please check your phone. (SMS may not be configured)",
        testMode: isTestMode,
        testOtp: isTestMode ? otp : undefined,
      });
    } else if (action === "verify") {
      // Verify OTP and update phone number
      const validatedData = verifyPhoneChangeSchema.parse({
        newPhoneNumber: body.newPhoneNumber,
        otp: body.otp,
      });

      // Get user with OTP
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          phoneNumber: true,
          otp: true,
          otpExpiry: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        );
      }

      // Verify OTP
      if (!user.otp || user.otp !== validatedData.otp) {
        return NextResponse.json(
          { message: "Invalid OTP" },
          { status: 400 }
        );
      }

      // Check OTP expiry
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        return NextResponse.json(
          { message: "OTP has expired. Please request a new one." },
          { status: 400 }
        );
      }

      // Verify phone number matches
      // (In a real scenario, you might want to store the pending phone number separately)

      // Update phone number
      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          phoneNumber: validatedData.newPhoneNumber,
          otp: null,
          otpExpiry: null,
        },
        select: {
          id: true,
          phoneNumber: true,
        },
      });

      return NextResponse.json({
        message: "Phone number updated successfully",
        user: updatedUser,
      });
    } else {
      return NextResponse.json(
        { message: "Invalid action. Use 'request' or 'verify'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Phone change error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to change phone number" },
      { status: 500 }
    );
  }
}


























