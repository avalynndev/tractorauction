import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePaginationParams,
  createPaginatedResponse,
  getPrismaPagination,
} from "@/lib/pagination";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Search parameters
    const search = searchParams.get("search")?.trim() || "";
    const vehicleType = searchParams.get("vehicleType") || "";
    const brand = searchParams.get("brand")?.trim() || "";
    const state = searchParams.get("state")?.trim() || "";
    const district = searchParams.get("district")?.trim() || "";
    const minYear = searchParams.get("minYear");
    const maxYear = searchParams.get("maxYear");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minHP = searchParams.get("minHP");
    const maxHP = searchParams.get("maxHP");
    const runningCondition = searchParams.get("runningCondition") || "";
    const insuranceStatus = searchParams.get("insuranceStatus") || "";
    const rcCopyStatus = searchParams.get("rcCopyStatus") || "";
    const isCertified = searchParams.get("isCertified");
    const isFinanceAvailable = searchParams.get("isFinanceAvailable");
    const sortBy = searchParams.get("sortBy") || "startTime"; // startTime, endTime, yearNew, yearOld

    // Build where clause for vehicle
    const vehicleWhere: any = {};

    // Vehicle type filter
    if (vehicleType && vehicleType !== "all") {
      vehicleWhere.vehicleType = vehicleType;
    }

    // Brand filter
    if (brand) {
      vehicleWhere.tractorBrand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    // State filter
    if (state) {
      vehicleWhere.state = {
        equals: state,
        mode: "insensitive",
      };
    }

    // District filter (from seller)
    if (district) {
      vehicleWhere.seller = {
        district: {
          equals: district,
          mode: "insensitive",
        },
      };
    }

    // Year range filter
    if (minYear || maxYear) {
      vehicleWhere.yearOfMfg = {};
      if (minYear) {
        vehicleWhere.yearOfMfg.gte = parseInt(minYear);
      }
      if (maxYear) {
        vehicleWhere.yearOfMfg.lte = parseInt(maxYear);
      }
    }

    // Running condition filter
    if (runningCondition && runningCondition !== "all") {
      vehicleWhere.runningCondition = runningCondition;
    }

    // Insurance status filter
    if (insuranceStatus && insuranceStatus !== "all") {
      vehicleWhere.insuranceStatus = insuranceStatus;
    }

    // RC copy status filter
    if (rcCopyStatus && rcCopyStatus !== "all") {
      vehicleWhere.rcCopyStatus = rcCopyStatus;
    }

    // Certified filter
    if (isCertified && isCertified !== "all") {
      vehicleWhere.isCertified = isCertified === "true";
    }

    // Finance available filter
    if (isFinanceAvailable && isFinanceAvailable !== "all") {
      vehicleWhere.isFinanceAvailable = isFinanceAvailable === "true";
    }

    // HP range filter (engineHP is stored as string, so we need to parse it)
    if (minHP || maxHP) {
      // Note: engineHP is stored as string like "45 HP", "50 HP", etc.
      // We'll search by extracting numeric part
      if (minHP) {
        const minHPNum = parseInt(minHP);
        vehicleWhere.engineHP = {
          ...vehicleWhere.engineHP,
          // This is a simplified approach - in production, you might want to store HP as a number
          // For now, we'll use contains which works for exact matches
        };
      }
    }

    // Price range filter (for reserve price in auctions)
    const auctionPriceWhere: any = {};
    if (minPrice || maxPrice) {
      if (minPrice) {
        auctionPriceWhere.reservePrice = { ...auctionPriceWhere.reservePrice, gte: parseFloat(minPrice) };
      }
      if (maxPrice) {
        auctionPriceWhere.reservePrice = { ...auctionPriceWhere.reservePrice, lte: parseFloat(maxPrice) };
      }
    }

    // Search (searches in brand, model, engineHP, registration number, year, engine number, chassis number, reference numbers)
    if (search) {
      vehicleWhere.OR = [
        {
          tractorBrand: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          tractorModel: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          engineHP: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          registrationNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          yearOfMfg: {
            equals: isNaN(parseInt(search)) ? undefined : parseInt(search),
          },
        },
        {
          engineNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          chassisNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          referenceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ].filter((condition) => {
        // Filter out conditions with undefined values (e.g., yearOfMfg when search is not a number)
        return Object.values(condition)[0] !== undefined;
      });
    }

    // Build auction where clause
    // Show SCHEDULED, LIVE, and ENDED auctions (including future scheduled auctions)
    // Note: We don't filter by startTime/endTime here - all SCHEDULED auctions are included
    // The client-side will categorize them into live/upcoming/ended based on current time
    const auctionWhere: any = {
      status: {
        in: ["SCHEDULED", "LIVE", "ENDED"],
      },
      // Apply price range filter to reserve price
      ...(Object.keys(auctionPriceWhere).length > 0 ? auctionPriceWhere : {}),
    };

    // If search is provided, add OR condition for auction reference number
    if (search) {
      auctionWhere.OR = [
        {
          // Search in auction reference number
          referenceNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          // Search in vehicle fields (already defined in vehicleWhere)
          vehicle: {
            status: "AUCTION",
            ...Object.fromEntries(
              Object.entries(vehicleWhere).filter(([key]) => key !== "status")
            ),
          },
        },
      ];
    } else {
      // No search - just filter by vehicle status and other vehicle filters
      auctionWhere.vehicle = {
        // Ensure status is AUCTION - this must come first before spreading vehicleWhere
        // to prevent vehicleWhere from overriding it
        status: "AUCTION",
        // Merge any additional vehicle filters (brand, type, etc.) but preserve status
        ...Object.fromEntries(
          Object.entries(vehicleWhere).filter(([key]) => key !== "status")
        ),
      };
    }

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPrismaPagination(page, limit);

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case "startTime":
        orderBy = { startTime: "asc" };
        break;
      case "endTime":
        orderBy = { endTime: "asc" };
        break;
      case "yearNew":
        orderBy = { vehicle: { yearOfMfg: "desc" } };
        break;
      case "yearOld":
        orderBy = { vehicle: { yearOfMfg: "asc" } };
        break;
      default:
        orderBy = { startTime: "asc" };
    }

    // Get total count for pagination
    const total = await prisma.auction.count({ where: auctionWhere });

    const auctions = await prisma.auction.findMany({
      where: auctionWhere,
      skip,
      take,
      select: {
        id: true,
        referenceNumber: true,
        startTime: true,
        endTime: true,
        currentBid: true,
        reservePrice: true,
        minimumIncrement: true,
        status: true,
        emdRequired: true,
        emdAmount: true,
        vehicle: {
          select: {
            id: true,
            vehicleType: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            registrationNumber: true,
            engineNumber: true,
            chassisNumber: true,
            hoursRun: true,
            financeNocPapers: true,
            readyForToken: true,
            state: true,
            district: true,
            runningCondition: true,
            insuranceStatus: true,
            rcCopyStatus: true,
            rcCopyType: true,
            clutchType: true,
            ipto: true,
            drive: true,
            steering: true,
            tyreBrand: true,
            otherFeatures: true,
            isCertified: true,
            isFinanceAvailable: true,
            saleAmount: true,
            basePrice: true,
            mainPhoto: true,
            subPhotos: true,
            referenceNumber: true,
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
                whatsappNumber: true,
                district: true,
              },
            },
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(createPaginatedResponse(auctions, page, limit, total));
  } catch (error) {
    console.error("Error fetching auctions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


