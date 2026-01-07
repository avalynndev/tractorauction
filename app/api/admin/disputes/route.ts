import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const disputeType = searchParams.get("disputeType");
    const priority = searchParams.get("priority");

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPrismaPagination(page, limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (disputeType) {
      where.disputeType = disputeType;
    }

    if (priority) {
      where.priority = priority;
    }

    // Get total count for pagination
    const total = await prisma.dispute.count({ where });

    const disputes = await prisma.dispute.findMany({
      where,
      skip,
      take,
      include: {
        filer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
        purchase: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
            buyer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        auction: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            mainPhoto: true,
            seller: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Get statistics
    const stats = {
      total: await prisma.dispute.count(),
      pending: await prisma.dispute.count({ where: { status: "PENDING" } }),
      underReview: await prisma.dispute.count({ where: { status: "UNDER_REVIEW" } }),
      resolved: await prisma.dispute.count({ where: { status: "RESOLVED" } }),
      rejected: await prisma.dispute.count({ where: { status: "REJECTED" } }),
      urgent: await prisma.dispute.count({ where: { priority: "URGENT", status: { not: "RESOLVED" } } }),
    };

    return NextResponse.json({
      ...createPaginatedResponse(disputes, page, limit, total),
      stats,
    });
  } catch (error) {
    console.error("Get admin disputes error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

