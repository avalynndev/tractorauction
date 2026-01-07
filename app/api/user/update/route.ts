import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const updateUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid WhatsApp number format").optional(),
  email: z.string().email("Invalid email format").optional().nullable(),
  address: z.string().min(5, "Address must be at least 5 characters").optional(),
  city: z.string().min(2, "City must be at least 2 characters").optional(),
  district: z.string().min(2, "District must be at least 2 characters").optional(),
  state: z.string().min(2, "State must be at least 2 characters").optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),
});

/**
 * Update user personal details
 */
export async function PATCH(request: NextRequest) {
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
    const validatedData = updateUserSchema.parse(body);

    // Check for email uniqueness if email is being updated
    if (validatedData.email !== undefined && validatedData.email !== null) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: decoded.userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "Email address is already registered" },
          { status: 400 }
        );
      }
    }

    // Check for WhatsApp number uniqueness if being updated
    if (validatedData.whatsappNumber) {
      const existingUser = await prisma.user.findFirst({
        where: {
          whatsappNumber: validatedData.whatsappNumber,
          id: { not: decoded.userId },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: "WhatsApp number is already registered" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: validatedData,
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        whatsappNumber: true,
        email: true,
        address: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        role: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Update user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




