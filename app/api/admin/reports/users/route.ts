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

    // Users by role
    const roleCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    });

    // Users by state
    const stateCounts = await prisma.user.groupBy({
      by: ["state"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // User growth by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM "User"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Active users (users who have placed bids or listed vehicles in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeBuyers = await prisma.user.count({
      where: {
        role: "BUYER",
        bids: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });

    const activeSellers = await prisma.user.count({
      where: {
        role: { in: ["SELLER", "DEALER"] },
        vehicles: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });

    // Membership statistics
    const membershipStats = await prisma.membership.groupBy({
      by: ["membershipType"],
      _count: { id: true },
      _sum: { amount: true },
    });

    const activeMemberships = await prisma.membership.count({
      where: {
        endDate: { gte: new Date() },
      },
    });

    const expiredMemberships = await prisma.membership.count({
      where: {
        endDate: { lt: new Date() },
      },
    });

    return NextResponse.json({
      roleBreakdown: roleCounts.map(item => ({
        role: item.role,
        count: item._count.id,
      })),
      stateBreakdown: stateCounts.map(item => ({
        state: item.state,
        count: item._count.id,
      })),
      monthlyGrowth: usersByMonth.map(item => ({
        month: item.month,
        count: Number(item.count),
      })),
      activity: {
        activeBuyers,
        activeSellers,
        totalActive: activeBuyers + activeSellers,
      },
      memberships: {
        byType: membershipStats.map(item => ({
          type: item.membershipType,
          count: item._count.id,
          totalRevenue: item._sum.amount || 0,
        })),
        active: activeMemberships,
        expired: expiredMemberships,
        total: activeMemberships + expiredMemberships,
      },
    });
  } catch (error) {
    console.error("Error fetching user reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}




























