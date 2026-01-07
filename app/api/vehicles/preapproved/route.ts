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
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minYear = searchParams.get("minYear");
    const maxYear = searchParams.get("maxYear");
    const minHP = searchParams.get("minHP");
    const maxHP = searchParams.get("maxHP");
    const runningCondition = searchParams.get("runningCondition") || "";
    const insuranceStatus = searchParams.get("insuranceStatus") || "";
    const rcCopyStatus = searchParams.get("rcCopyStatus") || "";
    const isCertified = searchParams.get("isCertified");
    const isFinanceAvailable = searchParams.get("isFinanceAvailable");
    const sortBy = searchParams.get("sortBy") || "newest"; // newest, oldest, priceLow, priceHigh, yearNew, yearOld

    // Build where clause
    const where: any = {
      saleType: "PREAPPROVED",
      status: "APPROVED", // Only show approved, not sold vehicles
    };

    // Vehicle type filter
    if (vehicleType && vehicleType !== "all") {
      where.vehicleType = vehicleType;
    }

    // Brand filter
    if (brand) {
      where.tractorBrand = {
        contains: brand,
        mode: "insensitive",
      };
    }

    // State filter
    if (state) {
      where.state = {
        equals: state,
        mode: "insensitive",
      };
    }

    // District filter (from seller)
    if (district) {
      where.seller = {
        district: {
          equals: district,
          mode: "insensitive",
        },
      };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.saleAmount = {};
      if (minPrice) {
        where.saleAmount.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.saleAmount.lte = parseFloat(maxPrice);
      }
    }

    // Year range filter
    if (minYear || maxYear) {
      where.yearOfMfg = {};
      if (minYear) {
        where.yearOfMfg.gte = parseInt(minYear);
      }
      if (maxYear) {
        where.yearOfMfg.lte = parseInt(maxYear);
      }
    }

    // Running condition filter
    if (runningCondition && runningCondition !== "all") {
      where.runningCondition = runningCondition;
    }

    // Insurance status filter
    if (insuranceStatus && insuranceStatus !== "all") {
      where.insuranceStatus = insuranceStatus;
    }

    // RC copy status filter
    if (rcCopyStatus && rcCopyStatus !== "all") {
      where.rcCopyStatus = rcCopyStatus;
    }

    // Certified filter
    if (isCertified && isCertified !== "all") {
      where.isCertified = isCertified === "true";
    }

    // Finance available filter
    if (isFinanceAvailable && isFinanceAvailable !== "all") {
      where.isFinanceAvailable = isFinanceAvailable === "true";
    }

    // HP range filter (engineHP is stored as string, so we need to parse it)
    // Note: This is a simplified approach - in production, you might want to store HP as a number
    // For now, we'll use contains which works for exact matches like "45 HP"
    if (minHP || maxHP) {
      // Since engineHP is stored as string, we'll filter by string matching
      // This is a limitation - ideally HP should be stored as a number
      if (minHP && maxHP) {
        // For range, we'd need to parse the HP from string format
        // This is a simplified version
        where.engineHP = {
          contains: minHP,
          mode: "insensitive",
        };
      } else if (minHP) {
        where.engineHP = {
          contains: minHP,
          mode: "insensitive",
        };
      }
    }

    // Search (searches in brand, model, engineHP, registration number, year, engine number, chassis number)
    if (search) {
      // Try to parse year if search is a 4-digit number
      const searchYear = /^\d{4}$/.test(search) ? parseInt(search) : null;
      
      where.OR = [
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
      ];

      // If search is a year (4 digits), also search by yearOfMfg
      if (searchYear && searchYear >= 1900 && searchYear <= 2100) {
        where.OR.push({
          yearOfMfg: searchYear,
        });
      }
    }

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPrismaPagination(page, limit);

    // Build orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "priceLow":
        orderBy = { saleAmount: "asc" };
        break;
      case "priceHigh":
        orderBy = { saleAmount: "desc" };
        break;
      case "yearNew":
        orderBy = { yearOfMfg: "desc" };
        break;
      case "yearOld":
        orderBy = { yearOfMfg: "asc" };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    // Get total count for pagination
    const total = await prisma.vehicle.count({ where });

    const vehicles = await prisma.vehicle.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        vehicleType: true,
        tractorBrand: true,
        tractorModel: true,
        engineHP: true,
        yearOfMfg: true,
        state: true,
        saleAmount: true,
        saleType: true,
        mainPhoto: true,
        runningCondition: true,
        createdAt: true,
        seller: {
          select: {
            district: true,
          },
        },
      },
      orderBy,
    });

    return NextResponse.json(createPaginatedResponse(vehicles, page, limit, total));
  } catch (error) {
    console.error("Error fetching pre-approved vehicles:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


