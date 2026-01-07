import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * GET /api/vehicles/recommended - Get recommended vehicles based on user activity
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.substring(7);
    const decoded = token ? verifyToken(token) : null;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let recommendedVehicles: any[] = [];

    if (decoded) {
      // User is authenticated - use personalized recommendations
      const userId = decoded.userId;

      // Get user's recent views
      const recentViews = await prisma.recentView.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 10,
        include: {
          vehicle: true,
        },
      });

      // Get user's watchlist
      const watchlist = await prisma.watchlistItem.findMany({
        where: { userId },
        include: {
          vehicle: true,
        },
      });

      // Get user's shortlist
      const shortlist = await prisma.shortlistedItem.findMany({
        where: { userId },
        include: {
          vehicle: true,
        },
      });

      // Analyze preferences
      const viewedBrands = new Set(
        recentViews.map((v) => v.vehicle.tractorBrand)
      );
      const viewedTypes = new Set(
        recentViews.map((v) => v.vehicle.vehicleType)
      );
      const viewedStates = new Set(recentViews.map((v) => v.vehicle.state));

      // Get average price range from watchlist
      const watchlistPrices = watchlist.map((w) => w.vehicle.saleAmount);
      const avgPrice =
        watchlistPrices.length > 0
          ? watchlistPrices.reduce((a, b) => a + b, 0) / watchlistPrices.length
          : null;

      // Build recommendation query
      const where: any = {
        status: "APPROVED",
        id: {
          notIn: [
            ...recentViews.map((v) => v.vehicleId),
            ...watchlist.map((w) => w.vehicleId),
            ...shortlist.map((s) => s.vehicleId),
          ],
        },
      };

      // Add filters based on preferences
      if (viewedBrands.size > 0 || viewedTypes.size > 0 || viewedStates.size > 0) {
        where.OR = [];
        if (viewedBrands.size > 0) {
          where.OR.push({
            tractorBrand: { in: Array.from(viewedBrands) },
          });
        }
        if (viewedTypes.size > 0) {
          where.OR.push({
            vehicleType: { in: Array.from(viewedTypes) },
          });
        }
        if (viewedStates.size > 0) {
          where.OR.push({
            state: { in: Array.from(viewedStates) },
          });
        }
      }

      // Price range filter (within 30% of average)
      if (avgPrice) {
        where.saleAmount = {
          gte: avgPrice * 0.7,
          lte: avgPrice * 1.3,
        };
      }

      recommendedVehicles = await prisma.vehicle.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              city: true,
              state: true,
            },
          },
          auction: {
            select: {
              id: true,
              status: true,
              currentBid: true,
              endTime: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });
    }

    // If no personalized recommendations or user not authenticated,
    // return popular/featured vehicles
    if (recommendedVehicles.length < limit) {
      const popularVehicles = await prisma.vehicle.findMany({
        where: {
          status: "APPROVED",
          id: {
            notIn: recommendedVehicles.map((v) => v.id),
          },
        },
        include: {
          seller: {
            select: {
              id: true,
              fullName: true,
              city: true,
              state: true,
            },
          },
          auction: {
            select: {
              id: true,
              status: true,
              currentBid: true,
              endTime: true,
            },
          },
          _count: {
            select: {
              watchlistItems: true,
              recentViews: true,
            },
          },
        },
        orderBy: [
          {
            watchlistItems: {
              _count: "desc",
            },
          },
          {
            createdAt: "desc",
          },
        ],
        take: limit - recommendedVehicles.length,
      });

      recommendedVehicles = [...recommendedVehicles, ...popularVehicles];
    }

    return NextResponse.json({
      vehicles: recommendedVehicles.slice(0, limit),
      count: recommendedVehicles.length,
    });
  } catch (error) {
    console.error("Get recommended vehicles error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























