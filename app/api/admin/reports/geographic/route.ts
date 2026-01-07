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

    // Vehicles by state
    const vehiclesByState = await prisma.vehicle.groupBy({
      by: ["state"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Vehicles by district (top 20)
    const vehiclesByDistrict = await prisma.vehicle.groupBy({
      by: ["district"],
      where: { district: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 20,
    });

    // Users by state
    const usersByState = await prisma.user.groupBy({
      by: ["state"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    });

    // Auctions by state (via vehicle)
    const auctionsByState = await prisma.auction.findMany({
      include: {
        vehicle: {
          select: { state: true },
        },
      },
    });

    const stateAuctionCount: Record<string, number> = {};
    auctionsByState.forEach(auction => {
      const state = auction.vehicle.state;
      stateAuctionCount[state] = (stateAuctionCount[state] || 0) + 1;
    });

    const auctionsByStateArray = Object.entries(stateAuctionCount)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // Revenue by state (from auctions)
    const auctionRevenueByState = await prisma.auction.findMany({
      where: {
        status: "ENDED",
        sellerApprovalStatus: "APPROVED",
      },
      include: {
        vehicle: {
          select: { state: true },
        },
      },
    });

    const stateRevenue: Record<string, number> = {};
    auctionRevenueByState.forEach(auction => {
      const state = auction.vehicle.state;
      stateRevenue[state] = (stateRevenue[state] || 0) + auction.currentBid;
    });

    const revenueByStateArray = Object.entries(stateRevenue)
      .map(([state, revenue]) => ({ state, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return NextResponse.json({
      vehicles: {
        byState: vehiclesByState.map(item => ({
          state: item.state,
          count: item._count.id,
        })),
        byDistrict: vehiclesByDistrict.map(item => ({
          district: item.district,
          count: item._count.id,
        })),
      },
      users: {
        byState: usersByState.map(item => ({
          state: item.state,
          count: item._count.id,
        })),
      },
      auctions: {
        byState: auctionsByStateArray,
      },
      revenue: {
        byState: revenueByStateArray,
      },
    });
  } catch (error) {
    console.error("Error fetching geographic reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}




























