import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { notifyBuyerBidApproved, notifyBuyerBidRejected } from "@/lib/notifications";
import { notifyBuyerBidApproved as notifyBuyerBidApprovedEmail, notifyBuyerBidRejected as notifyBuyerBidRejectedEmail } from "@/lib/email-notifications";
import { calculateTransactionFee } from "@/lib/transaction-fee";

// Seller: Approve or reject the winning bid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id: auctionId } = await params;
    const { approvalStatus, rejectionReason } = await request.json();

    if (!approvalStatus || !["APPROVED", "REJECTED"].includes(approvalStatus)) {
      return NextResponse.json(
        { message: "Invalid approval status. Must be APPROVED or REJECTED" },
        { status: 400 }
      );
    }

    // If rejecting, optionally require a reason
    if (approvalStatus === "REJECTED" && rejectionReason && rejectionReason.trim().length > 500) {
      return NextResponse.json(
        { message: "Rejection reason must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Get auction with vehicle to verify seller
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
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
            fullName: true,
            phoneNumber: true,
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

    // Verify user is the seller or admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });
    const isSeller = auction.vehicle.sellerId === decoded.userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { message: "Only the seller or admin can approve/reject bids" },
        { status: 403 }
      );
    }

    // Check if auction has ended
    if (auction.status !== "ENDED") {
      return NextResponse.json(
        { message: "Auction must be ended before approval" },
        { status: 400 }
      );
    }

    // Update seller approval status
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: {
        sellerApprovalStatus: approvalStatus,
      },
    });

    // If approved, create purchase record with EMD application
    if (approvalStatus === "APPROVED" && auction.winnerId) {
      // Check if winner has paid EMD for this auction
      const winnerEMD = await prisma.earnestMoneyDeposit.findUnique({
        where: {
          auctionId_bidderId: {
            auctionId: auction.id,
            bidderId: auction.winnerId,
          },
        },
      });

      const purchasePrice = auction.currentBid;
      
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
        await prisma.earnestMoneyDeposit.update({
          where: { id: winnerEMD.id },
          data: {
            appliedToBalance: true,
            status: "APPLIED",
          },
        });
      }

      await prisma.purchase.create({
        data: {
          vehicleId: auction.vehicleId,
          buyerId: auction.winnerId,
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

      // Update vehicle status to SOLD
      await prisma.vehicle.update({
        where: { id: auction.vehicleId },
        data: {
          status: "SOLD",
        },
      });

      // Send SMS notification to buyer about approval
      if (auction.winner && auction.vehicle.seller) {
        try {
          await notifyBuyerBidApproved(
            auction.winner.phoneNumber,
            auction.winner.fullName,
            auction.vehicle.tractorBrand,
            auction.vehicle.tractorModel,
            auction.currentBid,
            auction.vehicle.seller.fullName,
            auction.vehicle.seller.phoneNumber
          );
        } catch (error) {
          console.error("Error sending approval SMS to buyer:", error);
        }
      }

      // Send email notification to buyer about approval
      if (auction.winnerId) {
        try {
          await notifyBuyerBidApprovedEmail(auction.winnerId, auctionId);
        } catch (error) {
          console.error("Error sending approval email to buyer:", error);
        }
      }
    } else if (approvalStatus === "REJECTED" && auction.winnerId && auction.winner) {
      // Send SMS notification to buyer about rejection
      try {
        await notifyBuyerBidRejected(
          auction.winner.phoneNumber,
          auction.winner.fullName,
          auction.vehicle.tractorBrand,
          auction.vehicle.tractorModel,
          auction.currentBid
        );
      } catch (error) {
        console.error("Error sending rejection SMS to buyer:", error);
      }

      // Send email notification to buyer about rejection
      try {
        await notifyBuyerBidRejectedEmail(auction.winnerId, auctionId, rejectionReason);
      } catch (error) {
        console.error("Error sending rejection email to buyer:", error);
      }
    }

    return NextResponse.json({
      message: `Bid ${approvalStatus.toLowerCase()} successfully`,
      auction: updatedAuction,
    });
  } catch (error) {
    console.error("Error approving bid:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


