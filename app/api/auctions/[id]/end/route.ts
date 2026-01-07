import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { notifySellerAuctionEnded } from "@/lib/notifications";
import { notifyAuctionEnded } from "@/lib/email-notifications";

// Admin: End an auction and determine winner
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const auctionId = params.id;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
                whatsappNumber: true,
              },
            },
          },
        },
        bids: {
          where: { isWinningBid: true },
          include: {
            bidder: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
          take: 1,
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    if (auction.status === "ENDED") {
      return NextResponse.json(
        { message: "Auction has already ended" },
        { status: 400 }
      );
    }

    // End the auction and set winner
    const winnerId = auction.bids.length > 0 ? auction.bids[0].bidderId : null;

    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "ENDED",
        winnerId: winnerId,
      },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        winner: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Send SMS notification to seller if auction has a winner
    if (winnerId && updatedAuction.winner && updatedAuction.vehicle.seller) {
      try {
        await notifySellerAuctionEnded(
          updatedAuction.vehicle.seller.phoneNumber,
          updatedAuction.vehicle.seller.fullName,
          updatedAuction.vehicle.tractorBrand,
          updatedAuction.vehicle.tractorModel,
          updatedAuction.currentBid,
          updatedAuction.winner.fullName,
          auctionId
        );
      } catch (error) {
        console.error("Error sending SMS notification to seller:", error);
        // Don't fail the request if notification fails
      }
    }

    // Send email notifications to seller and winner
    try {
      await notifyAuctionEnded(auctionId);
    } catch (error) {
      console.error("Error sending email notifications:", error);
      // Don't fail the request if email fails
    }

    // Generate blockchain hash for the auction
    try {
      const { createAuctionBlockchainRecord } = await import('@/lib/blockchain-service');
      await createAuctionBlockchainRecord(auctionId);
      console.log('Blockchain hash generated for auction:', auctionId);
    } catch (blockchainError) {
      console.error('Failed to generate blockchain hash:', blockchainError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      message: "Auction ended successfully",
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Error ending auction:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


