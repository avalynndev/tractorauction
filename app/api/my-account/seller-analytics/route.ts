import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get seller analytics and performance metrics for the current user
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

    // Get all vehicles listed by the user
    const allVehicles = await prisma.vehicle.findMany({
      where: {
        sellerId: userId,
      },
      include: {
        auction: {
          select: {
            id: true,
            status: true,
            currentBid: true,
            reservePrice: true,
            startTime: true,
            endTime: true,
            winnerId: true,
            sellerApprovalStatus: true,
            bids: {
              select: {
                id: true,
                bidAmount: true,
                bidTime: true,
              },
              orderBy: {
                bidAmount: "desc",
              },
            },
          },
        },
        purchases: {
          select: {
            id: true,
            purchasePrice: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate statistics
    const totalVehicles = allVehicles.length;
    
    // Vehicles by status
    const vehiclesByStatus: Record<string, number> = {};
    allVehicles.forEach((vehicle) => {
      vehiclesByStatus[vehicle.status] = (vehiclesByStatus[vehicle.status] || 0) + 1;
    });

    // Vehicles by sale type
    const vehiclesBySaleType: Record<string, number> = {};
    allVehicles.forEach((vehicle) => {
      vehiclesBySaleType[vehicle.saleType] = (vehiclesBySaleType[vehicle.saleType] || 0) + 1;
    });

    // Get all auctions
    const allAuctions = allVehicles
      .filter((v) => v.auction)
      .map((v) => v.auction!);
    
    const totalAuctions = allAuctions.length;
    
    // Auctions by status
    const auctionsByStatus: Record<string, number> = {};
    allAuctions.forEach((auction) => {
      auctionsByStatus[auction.status] = (auctionsByStatus[auction.status] || 0) + 1;
    });

    // Sold vehicles (vehicles with purchases with status 'completed' or 'delivered')
    const soldVehicles = allVehicles.filter(
      (v) => v.purchases && v.purchases.length > 0 && 
      (v.purchases.some((p) => p.status === "completed" || p.status === "delivered"))
    );
    const totalSoldVehicles = soldVehicles.length;

    // Calculate revenue from sold vehicles
    const completedPurchases = allVehicles
      .flatMap((v) => v.purchases || [])
      .filter((p) => p.status === "completed" || p.status === "delivered");
    
    const totalRevenue = completedPurchases.reduce(
      (sum, purchase) => sum + purchase.purchasePrice,
      0
    );
    const averageSalePrice =
      completedPurchases.length > 0
        ? totalRevenue / completedPurchases.length
        : 0;

    // Approval rate (approved / (approved + rejected))
    const approvedVehicles = allVehicles.filter((v) => v.status === "APPROVED" || v.status === "AUCTION" || v.status === "SOLD").length;
    const rejectedVehicles = allVehicles.filter((v) => v.status === "REJECTED").length;
    const totalReviewed = approvedVehicles + rejectedVehicles;
    const approvalRate = totalReviewed > 0 ? (approvedVehicles / totalReviewed) * 100 : 0;

    // Conversion rate (sold / total)
    const conversionRate = totalVehicles > 0 ? (totalSoldVehicles / totalVehicles) * 100 : 0;

    // Vehicles by vehicle type
    const vehiclesByVehicleType: Record<string, number> = {};
    allVehicles.forEach((vehicle) => {
      vehiclesByVehicleType[vehicle.vehicleType] = (vehiclesByVehicleType[vehicle.vehicleType] || 0) + 1;
    });

    // Vehicles by brand
    const vehiclesByBrand: Record<string, number> = {};
    allVehicles.forEach((vehicle) => {
      vehiclesByBrand[vehicle.tractorBrand] = (vehiclesByBrand[vehicle.tractorBrand] || 0) + 1;
    });

    // Vehicles by state
    const vehiclesByState: Record<string, number> = {};
    allVehicles.forEach((vehicle) => {
      vehiclesByState[vehicle.state] = (vehiclesByState[vehicle.state] || 0) + 1;
    });

    // Time-based statistics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const last1Year = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const vehiclesLast30Days = allVehicles.filter(
      (v) => new Date(v.createdAt) >= last30Days
    ).length;
    const vehiclesLast90Days = allVehicles.filter(
      (v) => new Date(v.createdAt) >= last90Days
    ).length;
    const vehiclesLast1Year = allVehicles.filter(
      (v) => new Date(v.createdAt) >= last1Year
    ).length;

    // Monthly breakdown (last 12 months)
    const monthlyListings: Record<string, number> = {};
    const monthlySales: Record<string, number> = {};
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;
      monthlyListings[monthKey] = 0;
      monthlySales[monthKey] = 0;
    }

    allVehicles.forEach((vehicle) => {
      const listingDate = new Date(vehicle.createdAt);
      const monthKey = `${listingDate.getFullYear()}-${String(listingDate.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyListings.hasOwnProperty(monthKey)) {
        monthlyListings[monthKey]++;
      }

      // Check if sold in this month
      const soldPurchase = vehicle.purchases?.find(
        (p) => p.status === "completed" || p.status === "delivered"
      );
      if (soldPurchase) {
        const saleDate = new Date(soldPurchase.createdAt);
        const saleMonthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`;
        if (monthlySales.hasOwnProperty(saleMonthKey)) {
          monthlySales[saleMonthKey]++;
        }
      }
    });

    // Average listing price
    const totalListingPrice = allVehicles.reduce((sum, v) => sum + v.saleAmount, 0);
    const averageListingPrice = totalVehicles > 0 ? totalListingPrice / totalVehicles : 0;

    // Auction statistics
    const endedAuctions = allAuctions.filter((a) => a.status === "ENDED");
    const liveAuctions = allAuctions.filter((a) => a.status === "LIVE");
    const scheduledAuctions = allAuctions.filter((a) => a.status === "SCHEDULED");
    
    // Average number of bids per auction
    const totalBidsInAuctions = allAuctions.reduce(
      (sum, a) => sum + (a.bids?.length || 0),
      0
    );
    const averageBidsPerAuction = totalAuctions > 0 ? totalBidsInAuctions / totalAuctions : 0;

    // Average final bid amount (for ended auctions)
    const endedAuctionsWithBids = endedAuctions.filter((a) => a.bids && a.bids.length > 0);
    const totalFinalBids = endedAuctionsWithBids.reduce(
      (sum, a) => sum + (a.currentBid || 0),
      0
    );
    const averageFinalBid = endedAuctionsWithBids.length > 0
      ? totalFinalBids / endedAuctionsWithBids.length
      : 0;

    // Seller approval rate (approved / total ended)
    const approvedAuctions = endedAuctions.filter(
      (a) => a.sellerApprovalStatus === "APPROVED"
    ).length;
    const rejectedAuctions = endedAuctions.filter(
      (a) => a.sellerApprovalStatus === "REJECTED"
    ).length;
    const totalEndedWithDecision = approvedAuctions + rejectedAuctions;
    const sellerApprovalRate = totalEndedWithDecision > 0
      ? (approvedAuctions / totalEndedWithDecision) * 100
      : 0;

    // Top performing vehicles (by sale price or current bid)
    const topVehicles = allVehicles
      .map((v) => {
        const salePrice = v.purchases?.find(
          (p) => p.status === "completed" || p.status === "delivered"
        )?.purchasePrice || v.auction?.currentBid || v.saleAmount;
        return {
          vehicleId: v.id,
          salePrice,
          vehicleType: v.vehicleType,
          tractorBrand: v.tractorBrand,
          yearOfMfg: v.yearOfMfg,
          state: v.state,
          status: v.status,
          saleType: v.saleType,
          hasAuction: !!v.auction,
          auctionStatus: v.auction?.status,
          bidCount: v.auction?.bids?.length || 0,
        };
      })
      .sort((a, b) => b.salePrice - a.salePrice)
      .slice(0, 5);

    // Active listings (vehicles that are approved but not sold)
    const activeListings = allVehicles.filter(
      (v) => (v.status === "APPROVED" || v.status === "AUCTION") && 
      !v.purchases?.some((p) => p.status === "completed" || p.status === "delivered")
    ).length;

    return NextResponse.json({
      overview: {
        totalVehicles,
        totalSoldVehicles,
        totalAuctions,
        activeListings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageSalePrice: Math.round(averageSalePrice * 100) / 100,
        approvalRate: Math.round(approvalRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100,
        sellerApprovalRate: Math.round(sellerApprovalRate * 100) / 100,
      },
      vehicles: {
        byStatus: vehiclesByStatus,
        bySaleType: vehiclesBySaleType,
        byVehicleType: vehiclesByVehicleType,
        byBrand: vehiclesByBrand,
        byState: vehiclesByState,
        averageListingPrice: Math.round(averageListingPrice * 100) / 100,
      },
      auctions: {
        byStatus: auctionsByStatus,
        endedCount: endedAuctions.length,
        liveCount: liveAuctions.length,
        scheduledCount: scheduledAuctions.length,
        averageBidsPerAuction: Math.round(averageBidsPerAuction * 100) / 100,
        averageFinalBid: Math.round(averageFinalBid * 100) / 100,
      },
      timeBased: {
        last30Days: vehiclesLast30Days,
        last90Days: vehiclesLast90Days,
        last1Year: vehiclesLast1Year,
        monthlyListings,
        monthlySales,
      },
      topVehicles,
    });
  } catch (error) {
    console.error("Get seller analytics error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

