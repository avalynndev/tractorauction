import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const oemLoginSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number format"),
});

/**
 * OEM login - verify phone number and return OEM info
 * This is a public endpoint (no auth required) for OEMs to login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = oemLoginSchema.parse(body);

    // Find OEM by phone number
    const oem = await prisma.oEM.findFirst({
      where: {
        phoneNumber: validatedData.phoneNumber,
        isActive: true, // Only allow active OEMs
      },
      select: {
        id: true,
        oemName: true,
        phoneNumber: true,
        email: true,
        isActive: true,
      },
    });

    if (!oem) {
      return NextResponse.json(
        { 
          message: "OEM not found or inactive. Please contact admin.",
          found: false 
        },
        { status: 404 }
      );
    }

    // Return OEM info (no sensitive data)
    return NextResponse.json({
      message: "OEM verified successfully",
      oem: {
        id: oem.id,
        oemName: oem.oemName,
        phoneNumber: oem.phoneNumber,
        email: oem.email,
      },
    });
  } catch (error: any) {
    console.error("OEM login error:", error);
    
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

