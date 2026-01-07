import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get bid analytics and statistics for the current user
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

    const userId = decoded.userId;

    // Get all bids for the user
    const allBids = await prisma.bid.findMany({
      where: {
        bidderId: userId,
      },
      select: {
        id: true,
        bidAmount: true,
        bidTime: true,
        isWinningBid: true,
        auctionId: true,
        auction: {
          select: {
            id: true,
            winnerId: true,
            status: true,
            sellerApprovalStatus: true,
            endTime: true,
            currentBid: true,
            vehicle: {
              select: {
                vehicleType: true,
                tractorBrand: true,
                state: true,
                yearOfMfg: true,
              },
            },
          },
        },
      },
      orderBy: {
        bidTime: "desc",
      },
    });

    // Get all unique auctions the user has bid on
    const uniqueAuctionIds = [...new Set(allBids.map((bid) => bid.auctionId))];
    
    // Get won auctions (auctions where user is the winner)
    const wonAuctions = await prisma.auction.findMany({
      where: {
        winnerId: userId,
        status: "ENDED",
      },
      select: {
        id: true,
        currentBid: true,
        vehicle: {
          select: {
            vehicleType: true,
            tractorBrand: true,
            state: true,
            yearOfMfg: true,
          },
        },
      },
    });

    // Calculate statistics
    const totalBids = allBids.length;
    const totalAuctionsBidOn = uniqueAuctionIds.length;
    const totalWonAuctions = wonAuctions.length;
    
    // Win rate calculation
    const endedAuctionsBidOn = allBids.filter(
      (bid) => bid.auction.status === "ENDED"
    );
    const uniqueEndedAuctionsBidOn = new Set(
      endedAuctionsBidOn.map((bid) => bid.auctionId)
    ).size;
    const winRate =
      uniqueEndedAuctionsBidOn > 0
        ? (totalWonAuctions / uniqueEndedAuctionsBidOn) * 100
        : 0;

    // Bid amounts statistics
    const bidAmounts = allBids.map((bid) => bid.bidAmount);
    const totalBidAmount = bidAmounts.reduce((sum, amount) => sum + amount, 0);
    const averageBidAmount =
      bidAmounts.length > 0 ? totalBidAmount / bidAmounts.length : 0;
    const highestBid = bidAmounts.length > 0 ? Math.max(...bidAmounts) : 0;
    const lowestBid = bidAmounts.length > 0 ? Math.min(...bidAmounts) : 0;

    // Average bids per auction
    const averageBidsPerAuction =
      uniqueAuctionIds.length > 0
        ? totalBids / uniqueAuctionIds.length
        : 0;

    // Bids by vehicle type
    const bidsByVehicleType: Record<string, number> = {};
    allBids.forEach((bid) => {
      const vehicleType = bid.auction.vehicle.vehicleType;
      bidsByVehicleType[vehicleType] = (bidsByVehicleType[vehicleType] || 0) + 1;
    });

    // Bids by state
    const bidsByState: Record<string, number> = {};
    allBids.forEach((bid) => {
      const state = bid.auction.vehicle.state;
      bidsByState[state] = (bidsByState[state] || 0) + 1;
    });

    // Bids by brand
    const bidsByBrand: Record<string, number> = {};
    allBids.forEach((bid) => {
      const brand = bid.auction.vehicle.tractorBrand;
      bidsByBrand[brand] = (bidsByBrand[brand] || 0) + 1;
    });

    // Time-based statistics (last 30 days, 90 days, 1 year)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last1Year = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const bidsLast30Days = allBids.filter(
      (bid) => new Date(bid.bidTime) >= last30Days
    ).length;
    const bidsLast90Days = allBids.filter(
      (bid) => new Date(bid.bidTime) >= last90Days
    ).length;
    const bidsLast1Year = allBids.filter(
      (bid) => new Date(bid.bidTime) >= last1Year
    ).length;

    // Monthly breakdown (last 12 months)
    const monthlyBids: Record<string, number> = {};
    const monthlyWins: Record<string, number> = {};
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyBids[monthKey] = 0;
      monthlyWins[monthKey] = 0;
    }

    allBids.forEach((bid) => {
      const bidDate = new Date(bid.bidTime);
      const monthKey = `${bidDate.getFullYear()}-${String(bidDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyBids.hasOwnProperty(monthKey)) {
        monthlyBids[monthKey]++;
      }
    });

    // Get end times for won auctions
    const wonAuctionIds = wonAuctions.map((a) => a.id);
    const wonAuctionData = await prisma.auction.findMany({
      where: {
        id: { in: wonAuctionIds },
      },
      select: {
        id: true,
        endTime: true,
      },
    });

    wonAuctionData.forEach((auction) => {
      const endDate = new Date(auction.endTime);
      const monthKey = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyWins.hasOwnProperty(monthKey)) {
        monthlyWins[monthKey]++;
      }
    });

    // Get winning bid amounts
    const winningBidAmounts = allBids
      .filter((bid) => bid.isWinningBid)
      .map((bid) => bid.bidAmount);
    const averageWinningBidAmount =
      winningBidAmounts.length > 0
        ? winningBidAmounts.reduce((sum, amount) => sum + amount, 0) /
          winningBidAmounts.length
        : 0;

    // Active bids (auctions that are still live or scheduled)
    const activeBids = allBids.filter(
      (bid) =>
        bid.auction.status === "LIVE" || bid.auction.status === "SCHEDULED"
    ).length;

    // Calculate success rate (won auctions / total ended auctions bid on)
    const successRate = winRate; // Same as win rate

    // Top 5 most bid on auctions
    const auctionBidCounts: Record<string, number> = {};
    allBids.forEach((bid) => {
      auctionBidCounts[bid.auctionId] =
        (auctionBidCounts[bid.auctionId] || 0) + 1;
    });

    const topAuctions = Object.entries(auctionBidCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([auctionId, count]) => {
        const bid = allBids.find((b) => b.auctionId === auctionId);
        return {
          auctionId,
          bidCount: count,
          vehicle: bid?.auction.vehicle,
          highestBid: bid?.auction.currentBid || 0,
          status: bid?.auction.status || "",
          won: wonAuctions.some((w) => w.id === auctionId),
        };
      });

    return NextResponse.json({
      overview: {
        totalBids,
        totalAuctionsBidOn,
        totalWonAuctions,
        winRate: Math.round(winRate * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        activeBids,
      },
      bidAmounts: {
        totalBidAmount: Math.round(totalBidAmount * 100) / 100,
        averageBidAmount: Math.round(averageBidAmount * 100) / 100,
        highestBid: Math.round(highestBid * 100) / 100,
        lowestBid: Math.round(lowestBid * 100) / 100,
        averageWinningBidAmount: Math.round(averageWinningBidAmount * 100) / 100,
      },
      averages: {
        averageBidsPerAuction: Math.round(averageBidsPerAuction * 100) / 100,
      },
      breakdowns: {
        byVehicleType: bidsByVehicleType,
        byState: bidsByState,
        byBrand: bidsByBrand,
      },
      timeBased: {
        last30Days: bidsLast30Days,
        last90Days: bidsLast90Days,
        last1Year: bidsLast1Year,
        monthlyBids,
        monthlyWins,
      },
      topAuctions,
    });
  } catch (error) {
    console.error("Get bid analytics error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

