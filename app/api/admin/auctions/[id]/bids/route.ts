import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Admin-only route to get all bids for an auction (for post-auction review)
export async function GET(
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

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        reservePrice: true,
        status: true,
        endTime: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Get all bids with full bidder information
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      include: {
        bidder: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            whatsappNumber: true,
          },
        },
      },
      orderBy: {
        bidAmount: "desc", // Sort by amount descending for review
      },
    });

    // Find highest bid
    const highestBid = allBids.length > 0 ? allBids[0] : null;
    const reservePriceMet = highestBid ? highestBid.bidAmount >= auction.reservePrice : false;

    return NextResponse.json({
      auction: {
        id: auction.id,
        reservePrice: auction.reservePrice,
        status: auction.status,
        endTime: auction.endTime,
        reservePriceMet,
      },
      bids: allBids,
      highestBid: highestBid ? {
        id: highestBid.id,
        amount: highestBid.bidAmount,
        bidTime: highestBid.bidTime,
        bidder: highestBid.bidder,
      } : null,
      totalBids: allBids.length,
      uniqueBidders: new Set(allBids.map((bid: any) => bid.bidderId)).size,
    });
  } catch (error) {
    console.error("Error fetching admin bids:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}



