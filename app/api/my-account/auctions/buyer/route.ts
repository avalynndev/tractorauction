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

    // Get buyer's auctions (where they placed bids)
    const bids = await prisma.bid.findMany({
      where: {
        bidderId: decoded.userId,
      },
      include: {
        auction: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                mainPhoto: true,
              },
            },
            winner: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        bidTime: "desc",
      },
    });

    // Get unique auctions
    const auctionMap = new Map();
    bids.forEach((bid) => {
      if (!auctionMap.has(bid.auctionId)) {
        auctionMap.set(bid.auctionId, bid.auction);
      }
    });

    const auctions = Array.from(auctionMap.values());

    return NextResponse.json(auctions);
  } catch (error) {
    console.error("Error fetching buyer auctions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


