import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auctions/calendar - Get auctions for calendar view
 * Returns auctions grouped by date for calendar display
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const status = searchParams.get("status"); // Optional: filter by status

    if (!startDate || !endDate) {
      return NextResponse.json(
        { message: "startDate and endDate are required (YYYY-MM-DD format)" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include entire end date

    // Build where clause
    const where: any = {
      startTime: {
        gte: start,
        lte: end,
      },
    };

    if (status && status !== "all") {
      where.status = status;
    }

    // Fetch auctions with vehicle details
    const auctions = await prisma.auction.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            state: true,
            district: true,
            mainPhoto: true,
            vehicleType: true,
          },
        },
        _count: {
          select: {
            bids: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Group auctions by date
    const auctionsByDate: Record<string, typeof auctions> = {};

    auctions.forEach((auction) => {
      const dateKey = new Date(auction.startTime).toISOString().split("T")[0]; // YYYY-MM-DD
      if (!auctionsByDate[dateKey]) {
        auctionsByDate[dateKey] = [];
      }
      auctionsByDate[dateKey].push(auction);
    });

    // Get statistics
    const stats = {
      total: auctions.length,
      scheduled: auctions.filter((a) => a.status === "SCHEDULED").length,
      live: auctions.filter((a) => a.status === "LIVE").length,
      ended: auctions.filter((a) => a.status === "ENDED").length,
    };

    return NextResponse.json({
      auctionsByDate,
      stats,
      totalAuctions: auctions.length,
    });
  } catch (error: any) {
    console.error("Get calendar auctions error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


