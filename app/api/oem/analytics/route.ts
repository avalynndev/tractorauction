import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper function to get zone from state
function getZoneFromState(state: string): string {
  const zoneMap: Record<string, string> = {
    "Jammu and Kashmir": "North",
    "Himachal Pradesh": "North",
    "Punjab": "North",
    "Haryana": "North",
    "Uttarakhand": "North",
    "Delhi": "North",
    "Rajasthan": "North",
    "Uttar Pradesh": "North",
    "Bihar": "East",
    "Jharkhand": "East",
    "West Bengal": "East",
    "Odisha": "East",
    "Assam": "East",
    "Sikkim": "East",
    "Meghalaya": "East",
    "Manipur": "East",
    "Mizoram": "East",
    "Tripura": "East",
    "Nagaland": "East",
    "Arunachal Pradesh": "East",
    "Chhattisgarh": "Central",
    "Madhya Pradesh": "Central",
    "Gujarat": "West",
    "Maharashtra": "West",
    "Goa": "West",
    "Karnataka": "South",
    "Kerala": "South",
    "Tamil Nadu": "South",
    "Andhra Pradesh": "South",
    "Telangana": "South",
    "Puducherry": "South",
  };
  return zoneMap[state] || "Other";
}

// Helper function to calculate analytics for a set of vehicles
function calculateAnalytics(vehicles: any[]) {
  const totalCount = vehicles.length;
  const estimatedValue = vehicles.reduce((sum, v) => sum + (v.basePrice || v.saleAmount || 0), 0);
  const saleValue = vehicles.reduce((sum, v) => {
    if (v.status === "SOLD" && v.purchases && v.purchases.length > 0) {
      return sum + (v.purchases[0].purchasePrice || 0);
    }
    return sum;
  }, 0);
  const auctionValue = vehicles.reduce((sum, v) => {
    if (v.auction && v.auction.status === "ENDED" && v.auction.currentBid > 0) {
      return sum + v.auction.currentBid;
    }
    return sum;
  }, 0);

  return {
    totalCount,
    estimatedValue,
    saleValue,
    auctionValue,
    salePercentage: estimatedValue > 0 ? (saleValue / estimatedValue) * 100 : 0,
    auctionPercentage: estimatedValue > 0 ? (auctionValue / estimatedValue) * 100 : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const viewType = searchParams.get("viewType") || "overview"; // overview, state, zone, dealer, brand, model, district, month
    const filterValue = searchParams.get("filterValue") || null; // Specific state/zone/dealer/brand/model/district
    const month = searchParams.get("month") || null; // Format: YYYY-MM
    const compareWith = searchParams.get("compareWith") || null; // For comparison

    // Get all dealers (users with role DEALER)
    let dealers: any[] = [];
    try {
      dealers = await prisma.user.findMany({
        where: {
          role: "DEALER",
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          state: true,
          district: true,
          city: true,
        },
      });
    } catch (dbError: any) {
      console.error("Error fetching dealers:", dbError);
      return NextResponse.json(
        { message: "Error fetching dealer data: " + (dbError.message || "Database error") },
        { status: 500 }
      );
    }

    const dealerIds = dealers.map(d => d.id);
    
    // If no dealers, return empty data
    if (dealerIds.length === 0) {
      return NextResponse.json({
        overview: {
          totalCount: 0,
          estimatedValue: 0,
          saleValue: 0,
          auctionValue: 0,
          salePercentage: 0,
          auctionPercentage: 0,
          totalDealers: 0,
          activeDealers: 0,
        },
        data: [],
      });
    }

    // Base query for dealer vehicles
    const baseWhere: any = {
      sellerId: { in: dealerIds },
      status: { in: ["APPROVED", "AUCTION", "SOLD"] },
    };

    let vehicles: any[] = [];

    switch (viewType) {
      case "state": {
        if (filterValue) {
          baseWhere.seller = { state: filterValue };
        }
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by state
        const stateGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const state = v.seller.state;
          if (!stateGroups[state]) stateGroups[state] = [];
          stateGroups[state].push(v);
        });

        const stateAnalytics = Object.entries(stateGroups).map(([state, stateVehicles]) => ({
          name: state,
          ...calculateAnalytics(stateVehicles),
        }));

        // If compareWith is provided, include comparison data
        if (compareWith) {
          const compareState = stateAnalytics.find(s => s.name === compareWith);
          return NextResponse.json({
            current: stateAnalytics.find(s => s.name === filterValue),
            comparison: compareState,
            all: stateAnalytics,
          });
        }

        return NextResponse.json({ data: stateAnalytics });
      }

      case "zone": {
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by zone
        const zoneGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const zone = getZoneFromState(v.seller.state);
          if (!zoneGroups[zone]) zoneGroups[zone] = [];
          zoneGroups[zone].push(v);
        });

        const zoneAnalytics = Object.entries(zoneGroups).map(([zone, zoneVehicles]) => ({
          name: zone,
          ...calculateAnalytics(zoneVehicles),
        }));

        if (compareWith) {
          const compareZone = zoneAnalytics.find(z => z.name === compareWith);
          return NextResponse.json({
            current: zoneAnalytics.find(z => z.name === filterValue),
            comparison: compareZone,
            all: zoneAnalytics,
          });
        }

        return NextResponse.json({ data: zoneAnalytics });
      }

      case "dealer": {
        if (filterValue) {
          baseWhere.sellerId = filterValue;
        }
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by dealer
        const dealerGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const dealerId = v.sellerId;
          if (!dealerGroups[dealerId]) dealerGroups[dealerId] = [];
          dealerGroups[dealerId].push(v);
        });

        const dealerAnalytics = Object.entries(dealerGroups).map(([dealerId, dealerVehicles]) => {
          const dealer = dealers.find(d => d.id === dealerId);
          return {
            id: dealerId,
            name: dealer?.fullName || "Unknown",
            state: dealer?.state || "",
            district: dealer?.district || "",
            ...calculateAnalytics(dealerVehicles),
          };
        });

        if (compareWith) {
          const compareDealer = dealerAnalytics.find(d => d.id === compareWith);
          return NextResponse.json({
            current: dealerAnalytics.find(d => d.id === filterValue),
            comparison: compareDealer,
            all: dealerAnalytics,
          });
        }

        return NextResponse.json({ data: dealerAnalytics });
      }

      case "brand": {
        if (filterValue) {
          baseWhere.tractorBrand = filterValue;
        }
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by brand
        const brandGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const brand = v.tractorBrand;
          if (!brandGroups[brand]) brandGroups[brand] = [];
          brandGroups[brand].push(v);
        });

        const brandAnalytics = Object.entries(brandGroups).map(([brand, brandVehicles]) => ({
          name: brand,
          ...calculateAnalytics(brandVehicles),
        }));

        if (compareWith) {
          const compareBrand = brandAnalytics.find(b => b.name === compareWith);
          return NextResponse.json({
            current: brandAnalytics.find(b => b.name === filterValue),
            comparison: compareBrand,
            all: brandAnalytics,
          });
        }

        return NextResponse.json({ data: brandAnalytics });
      }

      case "model": {
        const brandFilter = searchParams.get("brand");
        if (brandFilter) {
          baseWhere.tractorBrand = brandFilter;
        }
        if (filterValue) {
          baseWhere.tractorModel = filterValue;
        }
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by model
        const modelGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const model = v.tractorModel || "Unknown";
          const key = `${v.tractorBrand}_${model}`;
          if (!modelGroups[key]) modelGroups[key] = [];
          modelGroups[key].push(v);
        });

        const modelAnalytics = Object.entries(modelGroups).map(([key, modelVehicles]) => {
          const [brand, model] = key.split("_");
          return {
            brand,
            name: model,
            ...calculateAnalytics(modelVehicles),
          };
        });

        if (compareWith) {
          const compareModel = modelAnalytics.find(m => m.name === compareWith);
          return NextResponse.json({
            current: modelAnalytics.find(m => m.name === filterValue),
            comparison: compareModel,
            all: modelAnalytics,
          });
        }

        return NextResponse.json({ data: modelAnalytics });
      }

      case "district": {
        const stateFilter = searchParams.get("state");
        if (stateFilter) {
          baseWhere.seller = { state: stateFilter };
        }
        if (filterValue) {
          baseWhere.seller = { ...baseWhere.seller, district: filterValue };
        }
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        // Group by district
        const districtGroups: Record<string, any[]> = {};
        vehicles.forEach(v => {
          const district = v.seller.district || "Unknown";
          const key = `${v.seller.state}_${district}`;
          if (!districtGroups[key]) districtGroups[key] = [];
          districtGroups[key].push(v);
        });

        const districtAnalytics = Object.entries(districtGroups).map(([key, districtVehicles]) => {
          const [state, district] = key.split("_");
          return {
            state,
            name: district,
            ...calculateAnalytics(districtVehicles),
          };
        });

        if (compareWith) {
          const compareDistrict = districtAnalytics.find(d => d.name === compareWith);
          return NextResponse.json({
            current: districtAnalytics.find(d => d.name === filterValue),
            comparison: compareDistrict,
            all: districtAnalytics,
          });
        }

        return NextResponse.json({ data: districtAnalytics });
      }

      case "month": {
        const monthType = searchParams.get("monthType") || "opening"; // opening or new
        const targetMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM

        if (monthType === "opening") {
          // Opening stock: vehicles that existed at the start of the month
          const monthStart = new Date(`${targetMonth}-01`);
          baseWhere.createdAt = { lt: monthStart };
          
          vehicles = await prisma.vehicle.findMany({
            where: baseWhere,
            include: {
              seller: { select: { id: true, fullName: true, state: true, district: true } },
              auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
              purchases: { select: { id: true, purchasePrice: true, status: true, createdAt: true } },
            },
          });

          // Filter to vehicles that were still active at month start
          const openingVehicles = vehicles.filter(v => {
            if (v.status === "SOLD") {
              const soldDate = v.purchases[0]?.createdAt;
              return !soldDate || new Date(soldDate) >= monthStart;
            }
            return true;
          });

          const openingAnalytics = calculateAnalytics(openingVehicles);

          // Closing stock: vehicles that existed at the end of the month
          const monthEnd = new Date(`${targetMonth}-${new Date(new Date(targetMonth + "-01").getFullYear(), new Date(targetMonth + "-01").getMonth() + 1, 0).getDate()}`);
          const closingVehicles = openingVehicles.filter(v => {
            if (v.status === "SOLD") {
              const soldDate = v.purchases[0]?.createdAt;
              return !soldDate || new Date(soldDate) > monthEnd;
            }
            return true;
          });

          const closingAnalytics = calculateAnalytics(closingVehicles);

          return NextResponse.json({
            month: targetMonth,
            opening: {
              ...openingAnalytics,
              percentage: openingVehicles.length > 0 ? (openingAnalytics.saleValue / openingAnalytics.estimatedValue) * 100 : 0,
            },
            closing: {
              ...closingAnalytics,
              percentage: closingVehicles.length > 0 ? (closingAnalytics.saleValue / closingAnalytics.estimatedValue) * 100 : 0,
            },
            performance: {
              openingCount: openingVehicles.length,
              openingValue: openingAnalytics.estimatedValue,
              openingPercentage: openingAnalytics.estimatedValue > 0 ? (openingAnalytics.saleValue / openingAnalytics.estimatedValue) * 100 : 0,
              closingCount: closingVehicles.length,
              closingValue: closingAnalytics.estimatedValue,
              closingPercentage: closingAnalytics.estimatedValue > 0 ? (closingAnalytics.saleValue / closingAnalytics.estimatedValue) * 100 : 0,
            },
          });
        } else {
          // New stock: vehicles added during the month
          const monthStart = new Date(`${targetMonth}-01`);
          const monthEnd = new Date(`${targetMonth}-${new Date(new Date(targetMonth + "-01").getFullYear(), new Date(targetMonth + "-01").getMonth() + 1, 0).getDate()}`);
          baseWhere.createdAt = {
            gte: monthStart,
            lte: monthEnd,
          };

          vehicles = await prisma.vehicle.findMany({
            where: baseWhere,
            include: {
              seller: { select: { id: true, fullName: true, state: true, district: true } },
              auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
              purchases: { select: { id: true, purchasePrice: true, status: true, createdAt: true } },
            },
          });

          const newStockAnalytics = calculateAnalytics(vehicles);

          // Opening: vehicles at start of month (before new stock)
          const openingVehicles = await prisma.vehicle.findMany({
            where: {
              ...baseWhere,
              createdAt: { lt: monthStart },
            },
            include: {
              seller: { select: { id: true, fullName: true, state: true, district: true } },
              auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
              purchases: { select: { id: true, purchasePrice: true, status: true, createdAt: true } },
            },
          });

          const openingAnalytics = calculateAnalytics(openingVehicles);

          // Closing: opening + new stock - sold
          const allMonthVehicles = [...openingVehicles, ...vehicles];
          const closingVehicles = allMonthVehicles.filter(v => {
            if (v.status === "SOLD") {
              const soldDate = v.purchases[0]?.createdAt;
              return !soldDate || new Date(soldDate) > monthEnd;
            }
            return true;
          });

          const closingAnalytics = calculateAnalytics(closingVehicles);

          return NextResponse.json({
            month: targetMonth,
            newStock: {
              ...newStockAnalytics,
              percentage: newStockAnalytics.estimatedValue > 0 ? (newStockAnalytics.saleValue / newStockAnalytics.estimatedValue) * 100 : 0,
            },
            opening: {
              ...openingAnalytics,
              percentage: openingAnalytics.estimatedValue > 0 ? (openingAnalytics.saleValue / openingAnalytics.estimatedValue) * 100 : 0,
            },
            closing: {
              ...closingAnalytics,
              percentage: closingAnalytics.estimatedValue > 0 ? (closingAnalytics.saleValue / closingAnalytics.estimatedValue) * 100 : 0,
            },
            performance: {
              openingCount: openingVehicles.length,
              openingValue: openingAnalytics.estimatedValue,
              openingPercentage: openingAnalytics.estimatedValue > 0 ? (openingAnalytics.saleValue / openingAnalytics.estimatedValue) * 100 : 0,
              closingCount: closingVehicles.length,
              closingValue: closingAnalytics.estimatedValue,
              closingPercentage: closingAnalytics.estimatedValue > 0 ? (closingAnalytics.saleValue / closingAnalytics.estimatedValue) * 100 : 0,
            },
          });
        }
      }

      case "ta-contribution": {
        // Tractor Auction Contribution Analytics
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true, startTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        const auctionVehicles = vehicles.filter(v => v.auction);
        const totalAnalytics = calculateAnalytics(vehicles);
        const auctionAnalytics = calculateAnalytics(auctionVehicles);

        return NextResponse.json({
          total: totalAnalytics,
          auction: {
            ...auctionAnalytics,
            contributionPercentage: totalAnalytics.estimatedValue > 0 
              ? (auctionAnalytics.estimatedValue / totalAnalytics.estimatedValue) * 100 
              : 0,
            saleContributionPercentage: totalAnalytics.saleValue > 0 
              ? (auctionAnalytics.saleValue / totalAnalytics.saleValue) * 100 
              : 0,
          },
          performance: {
            totalVehicles: totalAnalytics.totalCount,
            auctionVehicles: auctionAnalytics.totalCount,
            auctionPercentage: totalAnalytics.totalCount > 0 
              ? (auctionAnalytics.totalCount / totalAnalytics.totalCount) * 100 
              : 0,
            totalEstimatedValue: totalAnalytics.estimatedValue,
            auctionEstimatedValue: auctionAnalytics.estimatedValue,
            totalSaleValue: totalAnalytics.saleValue,
            auctionSaleValue: auctionAnalytics.saleValue,
            totalAuctionValue: totalAnalytics.auctionValue,
          },
        });
      }

      default: {
        // Overview - aggregate all data
        vehicles = await prisma.vehicle.findMany({
          where: baseWhere,
          include: {
            seller: { select: { id: true, fullName: true, state: true, district: true } },
            auction: { select: { id: true, status: true, currentBid: true, endTime: true } },
            purchases: { select: { id: true, purchasePrice: true, status: true } },
          },
        });

        const overview = calculateAnalytics(vehicles);

        return NextResponse.json({
          overview: {
            ...overview,
            totalDealers: dealers.length,
            activeDealers: dealers.filter(d => dealerIds.includes(d.id)).length,
          },
        });
      }
    }
  } catch (error: any) {
    console.error("OEM Analytics error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

