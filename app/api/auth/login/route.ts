import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, comparePassword, generateToken } from "@/lib/auth";
import { sendOTPviaSMS, isSMSConfigured } from "@/lib/sms";
import { z } from "zod";
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/errors";
import { isAccountLocked, recordFailedLoginAttempt, resetFailedLoginAttempts, getAccountLockoutStatus } from "@/lib/account-lockout";

const MAX_FAILED_ATTEMPTS = 5;

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  password: z.string().optional(),
  method: z.enum(["otp", "password"]).optional().default("otp"),
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Login with phone number using OTP or password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 pattern: '^[6-9]\d{9}$'
 *                 example: "9876543210"
 *                 description: 10-digit Indian phone number
 *               password:
 *                 type: string
 *                 example: "password123"
 *                 description: Password (required if method is 'password')
 *               method:
 *                 type: string
 *                 enum: [otp, password]
 *                 default: otp
 *                 description: Login method
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT token (for password login)
 *                 requiresOtpVerification:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber: validatedData.phoneNumber },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Phone number not registered. Please register first." },
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
          message: `Account temporarily locked due to multiple failed login attempts. Please try again in ${lockoutMinutes} minutes.`,
          accountLocked: true,
          lockoutUntil: lockoutStatus.lockoutUntil,
        },
        { status: 423 } // 423 Locked
      );
    }

    // Handle password login
    if (validatedData.method === "password") {
      if (!validatedData.password) {
        return NextResponse.json(
          { message: "Password is required for password login" },
          { status: 400 }
        );
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        return NextResponse.json(
          { 
            message: "Password not set. Please use OTP login or reset your password first.",
            requiresPasswordReset: true,
          },
          { status: 400 }
        );
      }

      // Verify password
      const isPasswordValid = comparePassword(validatedData.password, user.passwordHash);
      
      if (!isPasswordValid) {
        // Record failed login attempt
        const lockoutResult = await recordFailedLoginAttempt(user.id);
        
        if (lockoutResult.locked) {
          return NextResponse.json(
            { 
              message: `Account locked due to ${MAX_FAILED_ATTEMPTS} failed login attempts. Please try again in 15 minutes.`,
              accountLocked: true,
              lockoutUntil: lockoutResult.lockoutUntil,
            },
            { status: 423 } // 423 Locked
          );
        }
        
        return NextResponse.json(
          { 
            message: "Invalid phone number or password",
            remainingAttempts: lockoutResult.remainingAttempts,
          },
          { status: 401 }
        );
      }

      // Reset failed login attempts on successful login
      await resetFailedLoginAttempts(user.id);

      // Generate JWT token
      const token = generateToken(user.id, user.phoneNumber);

      // Log successful login
      console.log(`✅ Password login successful for user: ${user.id} (${user.phoneNumber})`);

      return NextResponse.json(
        { 
          message: "Login successful",
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            role: user.role,
          },
        },
        { status: 200 }
      );
    }

    // Handle OTP login (existing flow)
    // Generate OTP - Use dummy OTP 999999 for testing, or generate random OTP
    const isTestMode = process.env.NODE_ENV === "development" || process.env.TEST_MODE === "true";
    const otp = isTestMode ? "999999" : generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with new OTP
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiry },
      select: { otp: true, otpExpiry: true },
    });

    // Verify OTP was stored correctly
    if (updatedUser.otp !== otp) {
      console.error(`OTP mismatch! Generated: ${otp}, Stored: ${updatedUser.otp}`);
    }

    // Send OTP via SMS (Twilio) or console (test mode)
    let smsSent = false;
    let smsError = null;

    if (isTestMode) {
      console.log(`[TEST MODE] OTP for ${validatedData.phoneNumber}: ${otp} (Use 999999 to verify)`);
      console.log(`[TEST MODE] OTP stored in DB: ${updatedUser.otp}`);
      smsSent = true; // Test mode doesn't require actual SMS
    } else {
      // Try to send via SMS provider if configured
      if (isSMSConfigured()) {
        try {
          smsSent = await sendOTPviaSMS(validatedData.phoneNumber, otp);
          if (smsSent) {
            console.log(`✅ OTP sent via SMS to ${validatedData.phoneNumber}. OTP stored: ${updatedUser.otp}`);
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
        console.log(`[SMS not configured] OTP stored in DB: ${updatedUser.otp}`);
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
      { message: "OTP sent to your phone number" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}


