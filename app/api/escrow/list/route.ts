import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all escrows (admin only)
 * Supports filtering by status
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Build where clause
    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    // Fetch escrows with related data
    const escrows = await prisma.escrow.findMany({
      where,
      include: {
        purchase: {
          include: {
            buyer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                referenceNumber: true,
                seller: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      escrows: escrows || [],
      count: escrows?.length || 0,
    });
  } catch (error: any) {
    console.error("Error fetching escrows:", error);
    
    // Check for Prisma errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { 
          message: "Database constraint violation",
          error: error.message
        },
        { status: 400 }
      );
    }
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { 
          message: "Record not found",
          error: error.message
        },
        { status: 404 }
      );
    }
    
    // Check if it's a schema/model error
    if (error.message?.includes("Unknown model") || error.message?.includes("does not exist")) {
      return NextResponse.json(
        { 
          message: "Database schema error",
          error: "Escrow model not found. Please run: npx prisma generate && npx prisma db push",
          code: "DATABASE_SCHEMA_MISSING"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
