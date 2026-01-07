import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all valuers
 * Admin only
 */
export async function GET(request: NextRequest) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can access valuers" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");
    const district = searchParams.get("district");
    const isActive = searchParams.get("isActive");
    const phoneNumber = searchParams.get("phoneNumber");

    const where: any = {};
    if (state) where.state = state;
    if (district) where.district = district;
    if (isActive !== null) where.isActive = isActive === "true";
    if (phoneNumber) where.phoneNumber = phoneNumber;

    const valuers = await prisma.valuer.findMany({
      where,
      orderBy: {
        valuerName: "asc",
      },
    });

    return NextResponse.json({ valuers });
  } catch (error: any) {
    console.error("Get valuers error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Create a new valuer
 * Admin only
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can create valuers" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      valuerName,
      phoneNumber,
      whatsappNumber,
      registrationNumber,
      registrationExpiryDate,
      state,
      district,
      city,
      address,
      pincode,
      isActive = true,
    } = body;

    // Validate required fields
    if (!valuerName || !phoneNumber || !whatsappNumber || !registrationNumber || !registrationExpiryDate || !state || !district || !city || !address) {
      return NextResponse.json(
        { message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.valuer.findUnique({
      where: { phoneNumber },
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: "Phone number already registered" },
        { status: 400 }
      );
    }

    // Check if registration number already exists
    const existingReg = await prisma.valuer.findUnique({
      where: { registrationNumber },
    });

    if (existingReg) {
      return NextResponse.json(
        { message: "Registration number already exists" },
        { status: 400 }
      );
    }

    // Create valuer
    const valuer = await prisma.valuer.create({
      data: {
        valuerName,
        phoneNumber,
        whatsappNumber,
        registrationNumber,
        registrationExpiryDate: new Date(registrationExpiryDate),
        state,
        district,
        city,
        address,
        pincode: pincode || null,
        isActive,
      },
    });

    return NextResponse.json({
      message: "Valuer created successfully",
      valuer,
    });
  } catch (error: any) {
    console.error("Create valuer error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

