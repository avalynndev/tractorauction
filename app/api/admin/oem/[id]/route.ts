import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Fetch single OEM
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = params instanceof Promise ? await params : params;
    const oem = await prisma.oEM.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!oem) {
      return NextResponse.json(
        { message: "OEM not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ oem });
  } catch (error: any) {
    console.error("Error fetching OEM:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update OEM
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = params instanceof Promise ? await params : params;
    const body = await request.json();

    // Check if OEM exists
    const existingOEM = await prisma.oEM.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingOEM) {
      return NextResponse.json(
        { message: "OEM not found" },
        { status: 404 }
      );
    }

    // Validate phone number if changed
    if (body.phoneNumber && body.phoneNumber !== existingOEM.phoneNumber) {
      if (!/^[6-9]\d{9}$/.test(body.phoneNumber)) {
        return NextResponse.json(
          { message: "Invalid phone number format" },
          { status: 400 }
        );
      }

      // Check if new phone number already exists
      const phoneExists = await prisma.oEM.findUnique({
        where: { phoneNumber: body.phoneNumber },
      });

      if (phoneExists) {
        return NextResponse.json(
          { message: "OEM with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Validate email if changed
    if (body.email && body.email !== existingOEM.email) {
      const emailExists = await prisma.oEM.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { message: "OEM with this email already exists" },
          { status: 400 }
        );
      }
    }

    // Update OEM
    const updatedOEM = await prisma.oEM.update({
      where: { id: resolvedParams.id },
      data: {
        oemName: body.oemName || existingOEM.oemName,
        phoneNumber: body.phoneNumber || existingOEM.phoneNumber,
        email: body.email !== undefined ? (body.email || null) : existingOEM.email,
        countryRetailHead: body.countryRetailHead !== undefined ? (body.countryRetailHead || null) : existingOEM.countryRetailHead,
        countryRetailHeadPhone: body.countryRetailHeadPhone !== undefined ? (body.countryRetailHeadPhone || null) : existingOEM.countryRetailHeadPhone,
        countryRetailHeadEmail: body.countryRetailHeadEmail !== undefined ? (body.countryRetailHeadEmail || null) : existingOEM.countryRetailHeadEmail,
        zonalRetailHead: body.zonalRetailHead !== undefined ? (body.zonalRetailHead || null) : existingOEM.zonalRetailHead,
        zonalRetailHeadPhone: body.zonalRetailHeadPhone !== undefined ? (body.zonalRetailHeadPhone || null) : existingOEM.zonalRetailHeadPhone,
        zonalRetailHeadEmail: body.zonalRetailHeadEmail !== undefined ? (body.zonalRetailHeadEmail || null) : existingOEM.zonalRetailHeadEmail,
        stateRetailHead: body.stateRetailHead !== undefined ? (body.stateRetailHead || null) : existingOEM.stateRetailHead,
        stateRetailHeadPhone: body.stateRetailHeadPhone !== undefined ? (body.stateRetailHeadPhone || null) : existingOEM.stateRetailHeadPhone,
        stateRetailHeadEmail: body.stateRetailHeadEmail !== undefined ? (body.stateRetailHeadEmail || null) : existingOEM.stateRetailHeadEmail,
        countrySalesHead: body.countrySalesHead !== undefined ? (body.countrySalesHead || null) : existingOEM.countrySalesHead,
        countrySalesHeadPhone: body.countrySalesHeadPhone !== undefined ? (body.countrySalesHeadPhone || null) : existingOEM.countrySalesHeadPhone,
        countrySalesHeadEmail: body.countrySalesHeadEmail !== undefined ? (body.countrySalesHeadEmail || null) : existingOEM.countrySalesHeadEmail,
        zonalSalesHead: body.zonalSalesHead !== undefined ? (body.zonalSalesHead || null) : existingOEM.zonalSalesHead,
        zonalSalesHeadPhone: body.zonalSalesHeadPhone !== undefined ? (body.zonalSalesHeadPhone || null) : existingOEM.zonalSalesHeadPhone,
        zonalSalesHeadEmail: body.zonalSalesHeadEmail !== undefined ? (body.zonalSalesHeadEmail || null) : existingOEM.zonalSalesHeadEmail,
        stateSalesHead: body.stateSalesHead !== undefined ? (body.stateSalesHead || null) : existingOEM.stateSalesHead,
        stateSalesHeadPhone: body.stateSalesHeadPhone !== undefined ? (body.stateSalesHeadPhone || null) : existingOEM.stateSalesHeadPhone,
        stateSalesHeadEmail: body.stateSalesHeadEmail !== undefined ? (body.stateSalesHeadEmail || null) : existingOEM.stateSalesHeadEmail,
      },
    });

    return NextResponse.json({
      message: "OEM updated successfully",
      oem: updatedOEM,
    });
  } catch (error: any) {
    console.error("Error updating OEM:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete OEM
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = params instanceof Promise ? await params : params;

    await prisma.oEM.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({
      message: "OEM deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting OEM:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

