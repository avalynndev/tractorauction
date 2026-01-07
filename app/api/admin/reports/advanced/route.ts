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

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "conversion"; // conversion, performance, financial

    let reportData: any = {};

    switch (reportType) {
      case "conversion": {
        // Conversion rate analytics
        const totalVehicles = await prisma.vehicle.count();
        const approvedVehicles = await prisma.vehicle.count({ where: { status: "APPROVED" } });
        const auctionVehicles = await prisma.vehicle.count({ where: { status: "AUCTION" } });
        const soldVehicles = await prisma.vehicle.count({ where: { status: "SOLD" } });

        const totalAuctions = await prisma.auction.count();
        const endedAuctions = await prisma.auction.count({ where: { status: "ENDED" } });
        const approvedBids = await prisma.auction.count({
          where: { status: "ENDED", sellerApprovalStatus: "APPROVED" },
        });

        const totalBids = await prisma.bid.count();
        const uniqueBidders = await prisma.bid.groupBy({
          by: ["bidderId"],
          _count: { id: true },
        });

        reportData = {
          vehicleConversion: {
            listingToApproval: totalVehicles > 0 ? ((approvedVehicles / totalVehicles) * 100).toFixed(2) : "0",
            approvalToAuction: approvedVehicles > 0 ? ((auctionVehicles / approvedVehicles) * 100).toFixed(2) : "0",
            auctionToSold: auctionVehicles > 0 ? ((soldVehicles / auctionVehicles) * 100).toFixed(2) : "0",
            overallConversion: totalVehicles > 0 ? ((soldVehicles / totalVehicles) * 100).toFixed(2) : "0",
          },
          auctionConversion: {
            auctionToEnded: totalAuctions > 0 ? ((endedAuctions / totalAuctions) * 100).toFixed(2) : "0",
            endedToApproved: endedAuctions > 0 ? ((approvedBids / endedAuctions) * 100).toFixed(2) : "0",
            overallSuccess: totalAuctions > 0 ? ((approvedBids / totalAuctions) * 100).toFixed(2) : "0",
          },
          bidderEngagement: {
            totalBids,
            uniqueBidders: uniqueBidders.length,
            averageBidsPerBidder: uniqueBidders.length > 0 
              ? (totalBids / uniqueBidders.length).toFixed(2) 
              : "0",
            mostActiveBidder: uniqueBidders.length > 0
              ? Math.max(...uniqueBidders.map(b => b._count.id))
              : 0,
          },
        };
        break;
      }

      case "performance": {
        // Performance metrics
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
          vehiclesLast30Days,
          auctionsLast30Days,
          bidsLast30Days,
          usersLast30Days,
          avgApprovalTime,
          avgAuctionDuration,
        ] = await Promise.all([
          prisma.vehicle.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
          prisma.auction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
          prisma.bid.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
          prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
          
          // Average approval time (in hours)
          prisma.$queryRaw<Array<{ avg_hours: number }>>`
            SELECT AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 3600) as avg_hours
            FROM "Vehicle"
            WHERE status IN ('APPROVED', 'REJECTED', 'AUCTION')
            AND "createdAt" >= ${thirtyDaysAgo}
          `,
          
          // Average auction duration (in days)
          prisma.$queryRaw<Array<{ avg_days: number }>>`
            SELECT AVG(EXTRACT(EPOCH FROM ("endTime" - "startTime")) / 86400) as avg_days
            FROM "Auction"
            WHERE status = 'ENDED'
            AND "createdAt" >= ${thirtyDaysAgo}
          `,
        ]);

        reportData = {
          last30Days: {
            vehicles: vehiclesLast30Days,
            auctions: auctionsLast30Days,
            bids: bidsLast30Days,
            users: usersLast30Days,
          },
          averageMetrics: {
            approvalTimeHours: avgApprovalTime[0]?.avg_hours 
              ? Math.round(Number(avgApprovalTime[0].avg_hours)) 
              : 0,
            auctionDurationDays: avgAuctionDuration[0]?.avg_days
              ? Number(avgAuctionDuration[0].avg_days).toFixed(1)
              : "0",
          },
        };
        break;
      }

      case "financial": {
        // Financial analytics
        const membershipRevenue = await prisma.membership.aggregate({
          _sum: { amount: true },
          _avg: { amount: true },
        });

        const membershipByType = await prisma.membership.groupBy({
          by: ["membershipType"],
          _sum: { amount: true },
          _count: { id: true },
        });

        const auctionRevenue = await prisma.auction.aggregate({
          where: {
            status: "ENDED",
            sellerApprovalStatus: "APPROVED",
          },
          _sum: { currentBid: true },
          _avg: { currentBid: true },
        });

        const activeMemberships = await prisma.membership.count({
          where: { endDate: { gte: new Date() } },
        });

        const revenueByMonth = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
          SELECT 
            TO_CHAR("createdAt", 'YYYY-MM') as month,
            SUM(amount)::numeric as revenue
          FROM "Membership"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
          ORDER BY month ASC
        `;

        reportData = {
          membership: {
            totalRevenue: membershipRevenue._sum.amount || 0,
            averageAmount: membershipRevenue._avg.amount || 0,
            activeCount: activeMemberships,
            byType: membershipByType.map(item => ({
              type: item.membershipType,
              revenue: item._sum.amount || 0,
              count: item._count.id,
            })),
            monthlyRevenue: revenueByMonth.map(item => ({
              month: item.month,
              revenue: Number(item.revenue),
            })),
          },
          auctions: {
            totalRevenue: auctionRevenue._sum.currentBid || 0,
            averageBid: auctionRevenue._avg.currentBid || 0,
            totalTransactions: await prisma.auction.count({
              where: {
                status: "ENDED",
                sellerApprovalStatus: "APPROVED",
              },
            }),
          },
        };
        break;
      }

      default:
        return NextResponse.json(
          { message: "Invalid report type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      type: reportType,
      data: reportData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching advanced reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

