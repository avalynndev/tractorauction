import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { calculateTransactionFee } from "@/lib/transaction-fee";
import { createAuctionBlockchainRecord, createBidBlockchainRecord, createPurchaseBlockchainRecord } from "@/lib/blockchain";

// Admin route to confirm winner after reviewing all bids
export async function POST(
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
    const body = await request.json();
    const { winnerBidId, winnerId } = body;

    if (!winnerBidId || !winnerId) {
      return NextResponse.json(
        { message: "Winner bid ID and winner ID are required" },
        { status: 400 }
      );
    }

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            sellerId: true,
            status: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Verify the bid exists and belongs to the winner
    const winnerBid = await prisma.bid.findUnique({
      where: { id: winnerBidId },
      include: {
        bidder: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!winnerBid) {
      return NextResponse.json(
        { message: "Winner bid not found" },
        { status: 404 }
      );
    }

    if (winnerBid.bidderId !== winnerId) {
      return NextResponse.json(
        { message: "Bid does not belong to the specified winner" },
        { status: 400 }
      );
    }

    if (winnerBid.auctionId !== auctionId) {
      return NextResponse.json(
        { message: "Bid does not belong to this auction" },
        { status: 400 }
      );
    }

    // Check reserve price
    if (winnerBid.bidAmount < auction.reservePrice) {
      return NextResponse.json(
        {
          message: `Winner bid (₹${winnerBid.bidAmount.toLocaleString("en-IN")}) is below reserve price (₹${auction.reservePrice.toLocaleString("en-IN")}). Cannot confirm winner.`,
        },
        { status: 400 }
      );
    }

    // Check if winner has paid EMD for this auction
    const winnerEMD = await prisma.earnestMoneyDeposit.findUnique({
      where: {
        auctionId_bidderId: {
          auctionId: auctionId,
          bidderId: winnerId,
        },
      },
    });

    // Update auction and bids in a transaction
    await prisma.$transaction(async (tx) => {
      // Mark all bids as not winning
      await tx.bid.updateMany({
        where: { auctionId },
        data: { isWinningBid: false },
      });

      // Mark winner bid as winning
      await tx.bid.update({
        where: { id: winnerBidId },
        data: { isWinningBid: true },
      });

      // Update auction
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          winnerId: winnerId,
          currentBid: winnerBid.bidAmount,
          status: "ENDED",
          sellerApprovalStatus: "PENDING", // Seller still needs to approve
        },
      });

      // Update vehicle status
      await tx.vehicle.update({
        where: { id: auction.vehicleId },
        data: {
          status: "AUCTION", // Keep as AUCTION until seller approves
        },
      });

      // Create purchase record with EMD application and transaction fee
      const purchasePrice = winnerBid.bidAmount;
      
      // Calculate transaction fee (2.5% with offer, 4% standard)
      const transactionFee = calculateTransactionFee(purchasePrice, true);
      
      let balanceAmount = purchasePrice;
      let emdApplied = false;
      let emdAmount = null;

      // Apply EMD to balance if winner has paid EMD
      if (winnerEMD && winnerEMD.status === "PAID" && !winnerEMD.appliedToBalance) {
        emdAmount = winnerEMD.amount;
        balanceAmount = Math.max(0, purchasePrice - emdAmount);
        emdApplied = true;

        // Mark EMD as applied to balance
        await tx.earnestMoneyDeposit.update({
          where: { id: winnerEMD.id },
          data: {
            appliedToBalance: true,
            status: "APPLIED",
          },
        });
      }

      // Create purchase record
      const purchase = await tx.purchase.create({
        data: {
          vehicleId: auction.vehicleId,
          buyerId: winnerId,
          purchasePrice: purchasePrice,
          purchaseType: "AUCTION",
          status: (balanceAmount > 0 || transactionFee > 0) ? "payment_pending" : "pending", // If balance or transaction fee > 0, payment pending
          balanceAmount: balanceAmount > 0 ? balanceAmount : null,
          emdApplied: emdApplied,
          emdAmount: emdAmount,
          transactionFee: transactionFee,
          transactionFeePaid: false, // Transaction fee will be paid separately
        },
      });

      return purchase; // Return purchase for blockchain creation
    });

    // Create blockchain records after transaction completes
    try {
      // Create auction blockchain record
      await createAuctionBlockchainRecord(auctionId);
      console.log(`Blockchain record created for auction ${auctionId}`);
      
      // Create winning bid blockchain record
      await createBidBlockchainRecord(winnerBidId);
      console.log(`Blockchain record created for bid ${winnerBidId}`);
      
      // Create purchase blockchain record
      const purchase = await prisma.purchase.findFirst({
        where: {
          vehicleId: auction.vehicleId,
          buyerId: winnerId,
        },
        orderBy: { createdAt: "desc" },
      });
      
      if (purchase) {
        await createPurchaseBlockchainRecord(purchase.id);
        console.log(`Blockchain record created for purchase ${purchase.id}`);
      }
    } catch (error) {
      console.error(`Failed to create blockchain records:`, error);
      // Don't fail the operation if blockchain creation fails
    }

    // TODO: Send email notifications
    // - Notify winner
    // - Notify non-winners
    // - Notify seller

    return NextResponse.json({
      message: "Winner confirmed successfully",
      winner: {
        id: winnerId,
        name: winnerBid.bidder.fullName,
        bidAmount: winnerBid.bidAmount,
      },
    });
  } catch (error) {
    console.error("Error confirming winner:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

