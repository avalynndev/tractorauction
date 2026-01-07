import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * List inspection reports
 * Admin can see all, users can see reports for their vehicles
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

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    // Build where clause
    const where: any = {};
    
    if (vehicleId) {
      where.vehicleId = vehicleId;
    }
    
    if (status && status !== "all") {
      where.status = status;
    }

    if (!isAdmin) {
      // Users can only see reports for their own vehicles
      where.vehicle = {
        sellerId: decoded.userId,
      };
    }

    // Get inspection reports
    const [reports, total] = await Promise.all([
      prisma.vehicleInspectionReport.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              tractorBrand: true,
              tractorModel: true,
              referenceNumber: true,
              registrationNumber: true,
            },
          },
        },
        orderBy: {
          inspectionDate: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vehicleInspectionReport.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("List inspection reports error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}














