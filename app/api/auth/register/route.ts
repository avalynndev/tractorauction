import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP } from "@/lib/auth";
import { sendOTPviaSMS, isSMSConfigured } from "@/lib/sms";
import { z } from "zod";

const registerSchema = z.object({
  registrationType: z.enum(["INDIVIDUAL", "FIRM"]),
  fullName: z.string().min(2),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(5),
  city: z.string().min(2),
  district: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  role: z.enum(["BUYER", "SELLER", "DEALER"]),
  gstNumber: z.string().optional(),
  referralCode: z.string().optional(), // Optional referral code
}).refine((data) => {
  // GST Number is optional but if provided, should be valid format (15 characters, alphanumeric)
  if (data.registrationType === "FIRM" && data.gstNumber && data.gstNumber.trim() !== "") {
    return /^[0-9A-Z]{15}$/i.test(data.gstNumber.trim());
  }
  return true;
}, {
  message: "GST Number must be 15 characters alphanumeric",
  path: ["gstNumber"],
});

export async function POST(request: NextRequest) {
  let validatedData: any = null;
  try {
    const body = await request.json();
    validatedData = registerSchema.parse(body);

    // Check if user already exists by phone number
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Check if email is provided and already exists
    if (validatedData.email && validatedData.email.trim() !== "") {
      const existingEmailUser = await prisma.user.findUnique({
        where: { email: validatedData.email.trim() },
      });

      if (existingEmailUser) {
        return NextResponse.json(
          { message: "Email address already registered" },
          { status: 400 }
        );
      }
    }

    // Generate OTP - Use dummy OTP 999999 for testing, or generate random OTP
    const isTestMode = process.env.NODE_ENV === "development" || process.env.TEST_MODE === "true";
    const otp = isTestMode ? "999999" : generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique identification number
    // Format: TA-YYYYMMDD-XXXX (TA + Date + 4-digit sequential number)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
    
    // Count users registered today to get sequential number
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    const usersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    // Generate 4-digit sequential number (padded with zeros)
    const sequentialNumber = String(usersToday + 1).padStart(4, "0");
    const identificationNumber = `TA-${dateStr}-${sequentialNumber}`;

    // Handle referral code if provided
    let referredByUserId: string | null = null;
    if (validatedData.referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: validatedData.referralCode },
        select: { id: true },
      });
      if (referrer) {
        referredByUserId = referrer.id;
      }
    }

    // Prepare user data (handle optional email and GST number)
    const userData: any = {
      ...validatedData,
      identificationNumber,
      otp,
      otpExpiry,
      referredBy: referredByUserId,
    };
    
    // Remove referralCode from userData (it's not a user field)
    delete userData.referralCode;

    // Only include email if provided and not empty
    if (validatedData.email && validatedData.email.trim() !== "") {
      userData.email = validatedData.email.trim();
    } else {
      userData.email = null;
    }

    // Handle GST Number - only for FIRM registration, optional
    if (validatedData.registrationType === "FIRM" && validatedData.gstNumber && validatedData.gstNumber.trim() !== "") {
      userData.gstNumber = validatedData.gstNumber.trim().toUpperCase();
    } else {
      userData.gstNumber = null;
    }

    // Create user
    const user = await prisma.user.create({
      data: userData,
    });

    // Create referral record if user was referred
    if (referredByUserId) {
      try {
        await prisma.referral.create({
          data: {
            referrerId: referredByUserId,
            referredUserId: user.id,
            referralCode: validatedData.referralCode!,
            status: "PENDING",
          },
        });

        // Update referrer's referral count
        await prisma.user.update({
          where: { id: referredByUserId },
          data: {
            referralCount: {
              increment: 1,
            },
          },
        });
      } catch (error) {
        console.error("Error creating referral record:", error);
        // Don't fail registration if referral tracking fails
      }
    }

    // Create 15-day free trial membership
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 15);

    await prisma.membership.create({
      data: {
        userId: user.id,
        membershipType: "TRIAL",
        startDate: new Date(),
        endDate: trialEndDate,
        amount: 0,
        status: "active",
      },
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
      { message: "Registration successful. OTP sent to your phone." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error("Error details:", {
      message: errorMessage,
      stack: errorStack,
      role: validatedData?.role,
    });
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}


