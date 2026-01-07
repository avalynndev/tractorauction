import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Get pending purchases for admin approval
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Fetch pending purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        status: "pending",
        purchaseType: "PREAPPROVED",
      },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        buyer: {
          select: {
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error("Error fetching pending purchases:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




