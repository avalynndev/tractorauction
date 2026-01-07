import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword, comparePassword } from "@/lib/auth";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match",
  path: ["confirmPassword"],
});

/**
 * Change user password
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
    const validatedData = changePasswordSchema.parse(body);

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return NextResponse.json(
        { message: "Password not set. Please set a password first." },
        { status: 400 }
      );
    }

    // Verify current password
    if (!comparePassword(validatedData.currentPassword, user.passwordHash)) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Check if new password is same as current
    if (comparePassword(validatedData.newPassword, user.passwordHash)) {
      return NextResponse.json(
        { message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash and update password
    const newPasswordHash = hashPassword(validatedData.newPassword);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Change password error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to change password" },
      { status: 500 }
    );
  }
}


























