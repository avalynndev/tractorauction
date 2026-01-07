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

    // Get current time to determine actual auction status
    const now = new Date();
    
    // Get all auctions to calculate actual status (based on time, not just DB status)
    const allAuctions = await prisma.auction.findMany({
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    // Calculate actual status based on time
    const actualStatusCounts: Record<string, number> = {
      SCHEDULED: 0,
      LIVE: 0,
      ENDED: 0,
    };

    allAuctions.forEach(auction => {
      if (now < auction.startTime) {
        actualStatusCounts.SCHEDULED++;
      } else if (now >= auction.startTime && now < auction.endTime) {
        actualStatusCounts.LIVE++;
      } else {
        actualStatusCounts.ENDED++;
      }
    });

    // Convert to array format
    const statusCounts = Object.entries(actualStatusCounts).map(([status, count]) => ({
      status,
      _count: { id: count },
    }));

    // Seller approval status for ended auctions (based on time, not just status)
    const endedAuctions = await prisma.auction.findMany({
      where: {
        OR: [
          { status: "ENDED" },
          { endTime: { lte: now } }, // Also include auctions where endTime has passed
        ],
      },
      select: {
        sellerApprovalStatus: true,
      },
    });

    // Count by approval status
    const approvalStatusCountsMap: Record<string, number> = {};
    endedAuctions.forEach(auction => {
      const status = auction.sellerApprovalStatus || "PENDING";
      approvalStatusCountsMap[status] = (approvalStatusCountsMap[status] || 0) + 1;
    });

    const approvalStatusCounts = Object.entries(approvalStatusCountsMap).map(([status, count]) => ({
      sellerApprovalStatus: status,
      _count: { id: count },
    }));

    // Average bid amounts
    const bidStats = await prisma.bid.aggregate({
      _avg: { bidAmount: true },
      _max: { bidAmount: true },
      _min: { bidAmount: true },
      _count: { id: true },
    });

    // Top auctions by bid amount (ended auctions based on time, not just status)
    const topAuctions = await prisma.auction.findMany({
      where: {
        OR: [
          { status: "ENDED" },
          { endTime: { lte: now } }, // Also include auctions where endTime has passed
        ],
      },
      orderBy: { currentBid: "desc" },
      take: 10,
      include: {
        vehicle: {
          select: {
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
          },
        },
      },
    });

    // Auctions by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const auctionsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM "Auction"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Calculate average time to approval (for approved bids)
    // Use approvalDeadline or updatedAt to calculate
    const approvedAuctions = await prisma.auction.findMany({
      where: {
        OR: [
          { status: "ENDED" },
          { endTime: { lte: now } }, // Also include auctions where endTime has passed
        ],
        sellerApprovalStatus: "APPROVED",
      },
      select: {
        endTime: true,
        updatedAt: true,
        approvalDeadline: true,
      },
    });

    let avgApprovalTime = 0;
    if (approvedAuctions.length > 0) {
      const totalTime = approvedAuctions.reduce((sum, auction) => {
        // Use approvalDeadline if available, otherwise use updatedAt
        const approvalTime = auction.approvalDeadline || auction.updatedAt;
        const timeDiff = approvalTime.getTime() - auction.endTime.getTime();
        return sum + timeDiff;
      }, 0);
      avgApprovalTime = Math.round(totalTime / approvedAuctions.length / (1000 * 60 * 60)); // in hours
    }

    // Total revenue from auctions (sum of winning bids)
    const totalRevenue = await prisma.auction.aggregate({
      where: {
        OR: [
          { status: "ENDED" },
          { endTime: { lte: now } }, // Also include auctions where endTime has passed
        ],
        sellerApprovalStatus: "APPROVED",
      },
      _sum: { currentBid: true },
    });

    return NextResponse.json({
      statusBreakdown: statusCounts.map(item => ({
        status: item.status,
        count: item._count.id,
      })),
      approvalBreakdown: approvalStatusCounts.map(item => ({
        status: item.sellerApprovalStatus,
        count: item._count.id,
      })),
      bidStatistics: {
        average: bidStats._avg.bidAmount || 0,
        maximum: bidStats._max.bidAmount || 0,
        minimum: bidStats._min.bidAmount || 0,
        totalBids: bidStats._count.id,
      },
      topAuctions: topAuctions.map(auction => ({
        id: auction.id,
        referenceNumber: auction.referenceNumber,
        vehicle: `${auction.vehicle.tractorBrand} ${auction.vehicle.tractorModel || ""} ${auction.vehicle.engineHP} HP`,
        winningBid: auction.currentBid,
        status: auction.sellerApprovalStatus,
      })),
      monthlyTrend: auctionsByMonth.map(item => ({
        month: item.month,
        count: Number(item.count),
      })),
      metrics: {
        averageApprovalTimeHours: avgApprovalTime,
        totalRevenue: totalRevenue._sum.currentBid || 0,
        totalEnded: actualStatusCounts.ENDED || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching auction reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

