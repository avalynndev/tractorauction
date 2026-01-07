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
    const period = searchParams.get("period") || "all"; // all, month, quarter, year, custom
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const compareYear = searchParams.get("compareYear") === "true";

    // Calculate date range based on period
    let startDate: Date | null = null;
    let endDate = new Date();

    if (period === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else if (period === "month") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === "quarter") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
    } else if (period === "year") {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const whereClause: any = {};
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }

    // Membership revenue
    const membershipRevenue = await prisma.membership.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
      _avg: { amount: true },
    });

    // Revenue by membership type
    const revenueByType = await prisma.membership.groupBy({
      by: ["membershipType"],
      where: whereClause,
      _sum: { amount: true },
      _count: { id: true },
    });

    // Auction revenue (from approved auctions)
    const auctionRevenue = await prisma.auction.aggregate({
      where: {
        ...whereClause,
        status: "ENDED",
        sellerApprovalStatus: "APPROVED",
      },
      _sum: { currentBid: true },
      _count: { id: true },
      _avg: { currentBid: true },
    });

    // Pre-approved sales revenue
    const preApprovedRevenue = await prisma.purchase.aggregate({
      where: {
        ...whereClause,
        purchaseType: "PREAPPROVED",
        status: "completed",
      },
      _sum: { purchasePrice: true },
      _count: { id: true },
      _avg: { purchasePrice: true },
    });

    // Monthly revenue trend (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyMembershipRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: bigint; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM("amount")::bigint as revenue,
        COUNT(*)::bigint as count
      FROM "Membership"
      WHERE "createdAt" >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthlyAuctionRevenue = await prisma.$queryRaw<Array<{ month: string; revenue: bigint; count: bigint }>>`
      SELECT 
        TO_CHAR(a."updatedAt", 'YYYY-MM') as month,
        SUM(a."currentBid")::bigint as revenue,
        COUNT(*)::bigint as count
      FROM "Auction" a
      WHERE a."status" = 'ENDED' 
        AND a."sellerApprovalStatus" = 'APPROVED'
        AND a."updatedAt" >= ${twelveMonthsAgo}
      GROUP BY TO_CHAR(a."updatedAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Total revenue
    const totalRevenue = (membershipRevenue._sum.amount || 0) + 
                        (auctionRevenue._sum.currentBid || 0) + 
                        (preApprovedRevenue._sum.purchasePrice || 0);

    return NextResponse.json({
      period,
      summary: {
        totalRevenue,
        membershipRevenue: membershipRevenue._sum.amount || 0,
        auctionRevenue: auctionRevenue._sum.currentBid || 0,
        preApprovedRevenue: preApprovedRevenue._sum.purchasePrice || 0,
      },
      membership: {
        total: membershipRevenue._sum.amount || 0,
        count: membershipRevenue._count.id || 0,
        average: membershipRevenue._avg.amount || 0,
        byType: revenueByType.map(item => ({
          type: item.membershipType,
          revenue: item._sum.amount || 0,
          count: item._count.id || 0,
        })),
      },
      auctions: {
        total: auctionRevenue._sum.currentBid || 0,
        count: auctionRevenue._count.id || 0,
        average: auctionRevenue._avg.currentBid || 0,
      },
      preApproved: {
        total: preApprovedRevenue._sum.purchasePrice || 0,
        count: preApprovedRevenue._count.id || 0,
        average: preApprovedRevenue._avg.purchasePrice || 0,
      },
      monthlyTrend: {
        membership: monthlyMembershipRevenue.map(item => ({
          month: item.month,
          revenue: Number(item.revenue),
          count: Number(item.count),
        })),
        auctions: monthlyAuctionRevenue.map(item => ({
          month: item.month,
          revenue: Number(item.revenue),
          count: Number(item.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching financial reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

