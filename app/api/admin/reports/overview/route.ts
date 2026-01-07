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

    // Get overview statistics
    const [
      totalVehicles,
      pendingVehicles,
      approvedVehicles,
      rejectedVehicles,
      auctionVehicles,
      soldVehicles,
      totalAuctions,
      scheduledAuctions,
      liveAuctions,
      endedAuctions,
      totalUsers,
      buyers,
      sellers,
      dealers,
      totalBids,
      totalRevenue,
      activeMemberships,
    ] = await Promise.all([
      // Vehicle counts
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "PENDING" } }),
      prisma.vehicle.count({ where: { status: "APPROVED" } }),
      prisma.vehicle.count({ where: { status: "REJECTED" } }),
      prisma.vehicle.count({ where: { status: "AUCTION" } }),
      prisma.vehicle.count({ where: { status: "SOLD" } }),
      
      // Auction counts
      prisma.auction.count(),
      prisma.auction.count({ where: { status: "SCHEDULED" } }),
      prisma.auction.count({ where: { status: "LIVE" } }),
      prisma.auction.count({ where: { status: "ENDED" } }),
      
      // User counts
      prisma.user.count(),
      prisma.user.count({ where: { role: "BUYER" } }),
      prisma.user.count({ where: { role: "SELLER" } }),
      prisma.user.count({ where: { role: "DEALER" } }),
      
      // Bid and revenue
      prisma.bid.count(),
      prisma.membership.aggregate({
        _sum: { amount: true },
      }),
      prisma.membership.count({
        where: {
          endDate: { gte: new Date() },
        },
      }),
    ]);

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      recentVehicles,
      recentAuctions,
      recentUsers,
      recentBids,
    ] = await Promise.all([
      prisma.vehicle.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.auction.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.bid.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // Calculate approval rate
    const totalProcessed = approvedVehicles + rejectedVehicles;
    const approvalRate = totalProcessed > 0 
      ? ((approvedVehicles / totalProcessed) * 100).toFixed(1)
      : "0";

    // Calculate auction success rate (approved vs rejected)
    const endedAuctionsWithStatus = await prisma.auction.findMany({
      where: { status: "ENDED" },
      select: { sellerApprovalStatus: true },
    });
    
    const approvedBids = endedAuctionsWithStatus.filter(
      a => a.sellerApprovalStatus === "APPROVED"
    ).length;
    const rejectedBids = endedAuctionsWithStatus.filter(
      a => a.sellerApprovalStatus === "REJECTED"
    ).length;
    const totalEndedWithStatus = approvedBids + rejectedBids;
    const auctionSuccessRate = totalEndedWithStatus > 0
      ? ((approvedBids / totalEndedWithStatus) * 100).toFixed(1)
      : "0";

    return NextResponse.json({
      overview: {
        vehicles: {
          total: totalVehicles,
          pending: pendingVehicles,
          approved: approvedVehicles,
          rejected: rejectedVehicles,
          auction: auctionVehicles,
          sold: soldVehicles,
          approvalRate: `${approvalRate}%`,
        },
        auctions: {
          total: totalAuctions,
          scheduled: scheduledAuctions,
          live: liveAuctions,
          ended: endedAuctions,
          successRate: `${auctionSuccessRate}%`,
          approvedBids,
          rejectedBids,
        },
        users: {
          total: totalUsers,
          buyers,
          sellers,
          dealers,
        },
        activity: {
          totalBids,
          totalRevenue: totalRevenue._sum.amount || 0,
          activeMemberships,
          recentVehicles,
          recentAuctions,
          recentUsers,
          recentBids,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching overview:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}




























