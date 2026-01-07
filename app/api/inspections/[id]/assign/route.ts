import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Assign inspector to an inspection
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
        { message: "Only admins can assign inspectors" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    const body = await request.json();
    const { assignedInspector } = body;

    if (!assignedInspector) {
      return NextResponse.json(
        { message: "Inspector ID is required" },
        { status: 400 }
      );
    }

    // Verify inspector exists
    const inspector = await prisma.user.findUnique({
      where: { id: assignedInspector },
      select: { id: true, fullName: true },
    });

    if (!inspector) {
      return NextResponse.json(
        { message: "Inspector not found" },
        { status: 404 }
      );
    }

    // Update inspection report
    const updatedReport = await prisma.vehicleInspectionReport.update({
      where: { id: reportId },
      data: {
        assignedInspector,
        inspectedBy: assignedInspector, // Also update inspectedBy
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
      message: "Inspector assigned successfully",
      inspectionReport: updatedReport,
    });
  } catch (error: any) {
    console.error("Assign inspector error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



