import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const valuerLoginSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number format"),
});

/**
 * Valuer login - verify phone number and return valuer info
 * This is a public endpoint (no auth required) for valuers to login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = valuerLoginSchema.parse(body);

    // Find valuer by phone number
    const valuer = await prisma.valuer.findFirst({
      where: {
        phoneNumber: validatedData.phoneNumber,
        isActive: true, // Only allow active valuers
      },
      select: {
        id: true,
        valuerName: true,
        phoneNumber: true,
        whatsappNumber: true,
        registrationNumber: true,
        state: true,
        district: true,
        city: true,
        isActive: true,
      },
    });

    if (!valuer) {
      return NextResponse.json(
        { 
          message: "Valuer not found or inactive. Please contact admin.",
          found: false 
        },
        { status: 404 }
      );
    }

    // Return valuer info (no sensitive data)
    return NextResponse.json({
      message: "Valuer verified successfully",
      valuer: {
        id: valuer.id,
        valuerName: valuer.valuerName,
        phoneNumber: valuer.phoneNumber,
        whatsappNumber: valuer.whatsappNumber,
        registrationNumber: valuer.registrationNumber,
        state: valuer.state,
        district: valuer.district,
        city: valuer.city,
      },
    });
  } catch (error: any) {
    console.error("Valuer login error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid phone number format", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


