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

    // Calculate conversion rates
    const totalVehicles = await prisma.vehicle.count();
    const approvedVehicles = await prisma.vehicle.count({ where: { status: "APPROVED" } });
    const soldVehicles = await prisma.vehicle.count({ where: { status: "SOLD" } });
    const auctionVehicles = await prisma.vehicle.count({ where: { status: "AUCTION" } });

    const approvalRate = totalVehicles > 0 ? (approvedVehicles / totalVehicles) * 100 : 0;
    const saleConversionRate = approvedVehicles > 0 ? (soldVehicles / approvedVehicles) * 100 : 0;
    const auctionConversionRate = auctionVehicles > 0 ? (soldVehicles / auctionVehicles) * 100 : 0;

    // Auction performance
    const totalAuctions = await prisma.auction.count();
    const endedAuctions = await prisma.auction.count({ where: { status: "ENDED" } });
    const approvedBids = await prisma.auction.count({
      where: { status: "ENDED", sellerApprovalStatus: "APPROVED" },
    });
    const rejectedBids = await prisma.auction.count({
      where: { status: "ENDED", sellerApprovalStatus: "REJECTED" },
    });

    const auctionCompletionRate = totalAuctions > 0 ? (endedAuctions / totalAuctions) * 100 : 0;
    const bidApprovalRate = endedAuctions > 0 ? (approvedBids / endedAuctions) * 100 : 0;

    // Average time metrics
    // Average time from listing to approval
    const approvedVehiclesWithDates = await prisma.vehicle.findMany({
      where: { status: { in: ["APPROVED", "AUCTION", "SOLD"] } },
      select: { createdAt: true, updatedAt: true },
    });

    let avgApprovalTime = 0;
    if (approvedVehiclesWithDates.length > 0) {
      const totalTime = approvedVehiclesWithDates.reduce((sum, vehicle) => {
        const timeDiff = vehicle.updatedAt.getTime() - vehicle.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      avgApprovalTime = Math.round(totalTime / approvedVehiclesWithDates.length / (1000 * 60 * 60 * 24)); // in days
    }

    // Average auction duration
    const auctionsWithDuration = await prisma.auction.findMany({
      where: { status: "ENDED" },
      select: { startTime: true, endTime: true },
    });

    let avgAuctionDuration = 0;
    if (auctionsWithDuration.length > 0) {
      const totalDuration = auctionsWithDuration.reduce((sum, auction) => {
        const duration = auction.endTime.getTime() - auction.startTime.getTime();
        return sum + duration;
      }, 0);
      avgAuctionDuration = Math.round(totalDuration / auctionsWithDuration.length / (1000 * 60 * 60 * 24)); // in days
    }

    // Average bids per auction
    const bidsPerAuction = await prisma.bid.groupBy({
      by: ["auctionId"],
      _count: { id: true },
    });

    const avgBidsPerAuction = bidsPerAuction.length > 0
      ? bidsPerAuction.reduce((sum, item) => sum + item._count.id, 0) / bidsPerAuction.length
      : 0;

    // User engagement metrics
    const totalUsers = await prisma.user.count();
    const usersWithVehicles = await prisma.user.count({
      where: { vehicles: { some: {} } },
    });
    const usersWithBids = await prisma.user.count({
      where: { bids: { some: {} } },
    });
    const activeUsers = await prisma.user.count({
      where: {
        OR: [
          { vehicles: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
          { bids: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
        ],
      },
    });

    const vehicleListingRate = totalUsers > 0 ? (usersWithVehicles / totalUsers) * 100 : 0;
    const biddingRate = totalUsers > 0 ? (usersWithBids / totalUsers) * 100 : 0;
    const activeUserRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return NextResponse.json({
      conversionRates: {
        approvalRate: approvalRate.toFixed(1),
        saleConversionRate: saleConversionRate.toFixed(1),
        auctionConversionRate: auctionConversionRate.toFixed(1),
      },
      auctionPerformance: {
        completionRate: auctionCompletionRate.toFixed(1),
        bidApprovalRate: bidApprovalRate.toFixed(1),
        totalAuctions,
        endedAuctions,
        approvedBids,
        rejectedBids,
        avgBidsPerAuction: avgBidsPerAuction.toFixed(1),
      },
      timeMetrics: {
        avgApprovalTimeDays: avgApprovalTime,
        avgAuctionDurationDays: avgAuctionDuration,
      },
      userEngagement: {
        totalUsers,
        usersWithVehicles,
        usersWithBids,
        activeUsers,
        vehicleListingRate: vehicleListingRate.toFixed(1),
        biddingRate: biddingRate.toFixed(1),
        activeUserRate: activeUserRate.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Error fetching performance reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}




























