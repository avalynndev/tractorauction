import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  parsePaginationParams,
  createPaginatedResponse,
  getPrismaPagination,
} from "@/lib/pagination";

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
    const state = searchParams.get("state");
    const district = searchParams.get("district");

    // Build where clause
    const whereClause: any = {
      status: "PENDING",
    };

    // Normalise filter values (trim spaces)
    const normalizedState = state ? state.trim() : null;
    const normalizedDistrict = district ? district.trim() : null;

    // Filter by state (from vehicle.state) - case-insensitive
    if (normalizedState && normalizedState !== "all") {
      whereClause.state = {
        equals: normalizedState,
        mode: "insensitive",
      };
    }

    // Filter by district (from seller.district) - case-insensitive
    if (normalizedDistrict && normalizedDistrict !== "all") {
      whereClause.seller = {
        district: {
          equals: normalizedDistrict,
          mode: "insensitive",
        },
      };
    }

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(new URL(request.url).searchParams);
    const { skip, take } = getPrismaPagination(page, limit);

    // Get total count for pagination
    const total = await prisma.vehicle.count({ where: whereClause });

    // Get pending vehicles
    const vehicles = await prisma.vehicle.findMany({
      where: whereClause,
      skip,
      take,
      include: {
        seller: {
          select: {
            fullName: true,
            phoneNumber: true,
            district: true,
            state: true,
          },
        },
        auction: {
          select: {
            id: true,
            referenceNumber: true,
            status: true,
            currentBid: true,
            startTime: true,
            endTime: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(createPaginatedResponse(vehicles, page, limit, total));
  } catch (error) {
    console.error("Error fetching pending vehicles:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

