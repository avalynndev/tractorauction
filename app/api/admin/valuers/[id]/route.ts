import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get single valuer
 */
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

    const resolvedParams = params instanceof Promise ? await params : params;
    const valuerId = resolvedParams.id;

    const valuer = await prisma.valuer.findUnique({
      where: { id: valuerId },
      include: {
        inspections: {
          select: {
            id: true,
            vehicleId: true,
            status: true,
            inspectionDate: true,
            scheduledDate: true,
          },
        },
      },
    });

    if (!valuer) {
      return NextResponse.json(
        { message: "Valuer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ valuer });
  } catch (error: any) {
    console.error("Get valuer error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update valuer
 * Admin only
 */
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
        { message: "Only admins can update valuers" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const valuerId = resolvedParams.id;

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
      isActive,
    } = body;

    // Check if phone number is being changed and already exists
    if (phoneNumber) {
      const existingPhone = await prisma.valuer.findUnique({
        where: { phoneNumber },
      });

      if (existingPhone && existingPhone.id !== valuerId) {
        return NextResponse.json(
          { message: "Phone number already registered" },
          { status: 400 }
        );
      }
    }

    // Check if registration number is being changed and already exists
    if (registrationNumber) {
      const existingReg = await prisma.valuer.findUnique({
        where: { registrationNumber },
      });

      if (existingReg && existingReg.id !== valuerId) {
        return NextResponse.json(
          { message: "Registration number already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (valuerName !== undefined) updateData.valuerName = valuerName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (whatsappNumber !== undefined) updateData.whatsappNumber = whatsappNumber;
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber;
    if (registrationExpiryDate !== undefined) updateData.registrationExpiryDate = new Date(registrationExpiryDate);
    if (state !== undefined) updateData.state = state;
    if (district !== undefined) updateData.district = district;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedValuer = await prisma.valuer.update({
      where: { id: valuerId },
      data: updateData,
    });

    return NextResponse.json({
      message: "Valuer updated successfully",
      valuer: updatedValuer,
    });
  } catch (error: any) {
    console.error("Update valuer error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete valuer
 * Admin only
 */
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
        { message: "Only admins can delete valuers" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const valuerId = resolvedParams.id;

    // Check if valuer has active inspections
    const activeInspections = await prisma.vehicleInspectionReport.count({
      where: {
        assignedValuerId: valuerId,
        status: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
    });

    if (activeInspections > 0) {
      return NextResponse.json(
        { message: `Cannot delete valuer with ${activeInspections} active inspection(s). Please reassign or complete them first.` },
        { status: 400 }
      );
    }

    await prisma.valuer.delete({
      where: { id: valuerId },
    });

    return NextResponse.json({
      message: "Valuer deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete valuer error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



