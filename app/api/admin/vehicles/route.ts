import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    // Build where clause
    const whereClause: any = {};

    if (status) {
      // Handle comma-separated status values (e.g., "APPROVED,AUCTION")
      const statusArray = status.split(",").map(s => s.trim()).filter(s => s);
      if (statusArray.length === 1) {
        whereClause.status = statusArray[0];
      } else if (statusArray.length > 1) {
        whereClause.status = {
          in: statusArray,
        };
      }
    }

    // Normalise filter values (trim spaces)
    const normalizedState = state ? state.trim() : null;
    const normalizedDistrict = district ? district.trim() : null;

    if (normalizedState && normalizedState !== "all") {
      whereClause.state = {
        equals: normalizedState,
        mode: "insensitive",
      };
    }

    if (normalizedDistrict && normalizedDistrict !== "all") {
      whereClause.district = {
        equals: normalizedDistrict,
        mode: "insensitive",
      };
    }

    // Fetch vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      select: {
        id: true,
        tractorBrand: true,
        tractorModel: true,
        referenceNumber: true,
        status: true,
        saleAmount: true,
        yearOfMfg: true,
        engineHP: true,
        state: true,
        district: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}













