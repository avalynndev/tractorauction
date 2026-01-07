import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Fetch all OEMs
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
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const oems = await prisma.oEM.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ oems });
  } catch (error: any) {
    console.error("Error fetching OEMs:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new OEM
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
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.oemName || !body.phoneNumber) {
      return NextResponse.json(
        { message: "OEM Name and Contact Number are required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(body.phoneNumber)) {
      return NextResponse.json(
        { message: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingOEM = await prisma.oEM.findUnique({
      where: { phoneNumber: body.phoneNumber },
    });

    if (existingOEM) {
      return NextResponse.json(
        { message: "OEM with this phone number already exists" },
        { status: 400 }
      );
    }

    // Check if email already exists (if provided)
    if (body.email) {
      const existingEmail = await prisma.oEM.findUnique({
        where: { email: body.email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { message: "OEM with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Create OEM
    const oem = await prisma.oEM.create({
      data: {
        oemName: body.oemName,
        phoneNumber: body.phoneNumber,
        email: body.email || null,
        countryRetailHead: body.countryRetailHead || null,
        countryRetailHeadPhone: body.countryRetailHeadPhone || null,
        countryRetailHeadEmail: body.countryRetailHeadEmail || null,
        zonalRetailHead: body.zonalRetailHead || null,
        zonalRetailHeadPhone: body.zonalRetailHeadPhone || null,
        zonalRetailHeadEmail: body.zonalRetailHeadEmail || null,
        stateRetailHead: body.stateRetailHead || null,
        stateRetailHeadPhone: body.stateRetailHeadPhone || null,
        stateRetailHeadEmail: body.stateRetailHeadEmail || null,
        countrySalesHead: body.countrySalesHead || null,
        countrySalesHeadPhone: body.countrySalesHeadPhone || null,
        countrySalesHeadEmail: body.countrySalesHeadEmail || null,
        zonalSalesHead: body.zonalSalesHead || null,
        zonalSalesHeadPhone: body.zonalSalesHeadPhone || null,
        zonalSalesHeadEmail: body.zonalSalesHeadEmail || null,
        stateSalesHead: body.stateSalesHead || null,
        stateSalesHeadPhone: body.stateSalesHeadPhone || null,
        stateSalesHeadEmail: body.stateSalesHeadEmail || null,
        isActive: true,
      },
    });

    return NextResponse.json({
      message: "OEM registered successfully",
      oem,
    });
  } catch (error: any) {
    console.error("Error creating OEM:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

