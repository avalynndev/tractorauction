import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all purchases made by the current user (buyer)
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

    const purchases = await prisma.purchase.findMany({
      where: {
        buyerId: decoded.userId,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            mainPhoto: true,
            vehicleType: true,
            state: true,
            saleType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Get user purchases error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}





























