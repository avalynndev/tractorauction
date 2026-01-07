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

    // Get seller's auctions
    const auctions = await prisma.auction.findMany({
      where: {
        vehicle: {
          sellerId: decoded.userId,
        },
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
            saleAmount: true,
          },
        },
        winner: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            city: true,
            state: true,
          },
        },
        bids: {
          orderBy: {
            bidTime: "desc",
          },
          take: 1, // Get the winning bid
          include: {
            bidder: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Error fetching seller auctions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


