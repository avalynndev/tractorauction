import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Schedule an inspection
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
        { message: "Only admins can schedule inspections" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vehicleId, scheduledDate, inspectionType, assignedValuerId, notes } = body;

    if (!vehicleId || !scheduledDate) {
      return NextResponse.json(
        { message: "Vehicle ID and scheduled date are required" },
        { status: 400 }
      );
    }

    if (!assignedValuerId) {
      return NextResponse.json(
        { message: "Valuer must be assigned" },
        { status: 400 }
      );
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Verify valuer exists and is active
    const valuer = await prisma.valuer.findUnique({
      where: { id: assignedValuerId },
      select: { id: true, isActive: true, valuerName: true },
    });

    if (!valuer) {
      return NextResponse.json(
        { message: "Valuer not found" },
        { status: 404 }
      );
    }

    if (!valuer.isActive) {
      return NextResponse.json(
        { message: "Selected valuer is inactive" },
        { status: 400 }
      );
    }

    // Create inspection report with PENDING status
    const inspectionReport = await prisma.vehicleInspectionReport.create({
      data: {
        vehicleId,
        inspectedBy: valuer.valuerName, // Use valuer name
        scheduledDate: new Date(scheduledDate),
        scheduledBy: decoded.userId,
        assignedValuerId: assignedValuerId,
        inspectionType: inspectionType || "COMPREHENSIVE",
        status: "PENDING",
        notes: notes || null,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Inspection scheduled successfully",
      inspectionReport,
    });
  } catch (error: any) {
    console.error("Schedule inspection error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get scheduled inspections
 * Allows both admin (with token) and valuer (with assignedValuerId) access
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assignedValuerId = searchParams.get("assignedValuerId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let isAdmin = false;
    const authHeader = request.headers.get("authorization");
    
    // Check if request has admin token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true },
        });

        isAdmin = user?.role === "ADMIN";
      }
    }

    // If not admin and no assignedValuerId, require authentication
    if (!isAdmin && !assignedValuerId) {
      return NextResponse.json(
        { message: "Unauthorized. Admin token or assignedValuerId required." },
        { status: 401 }
      );
    }

    // If assignedValuerId is provided, verify valuer exists and is active
    if (assignedValuerId && !isAdmin) {
      const valuer = await prisma.valuer.findUnique({
        where: { id: assignedValuerId },
        select: { id: true, isActive: true },
      });

      if (!valuer || !valuer.isActive) {
        return NextResponse.json(
          { message: "Valuer not found or inactive" },
          { status: 404 }
        );
      }
    }

    // Build where clause
    const where: any = {};

    if (status && status !== "all") {
      where.status = status;
    }

    // Filter by assigned valuer (for valuers viewing their own inspections)
    if (assignedValuerId) {
      where.assignedValuerId = assignedValuerId;
    }

    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.scheduledDate.lte = new Date(endDate);
      }
    }

    // Get scheduled inspections
    const inspections = await prisma.vehicleInspectionReport.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
          },
        },
        valuer: {
          select: {
            id: true,
            valuerName: true,
            phoneNumber: true,
            whatsappNumber: true,
          },
        },
      },
      orderBy: {
        scheduledDate: "asc",
      },
    });

    return NextResponse.json({ inspections });
  } catch (error: any) {
    console.error("Get scheduled inspections error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

