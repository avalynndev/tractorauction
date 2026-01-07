import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateAuctionReferenceNumber, generateVehicleReferenceNumber } from "@/lib/reference-numbers";

export async function POST(request: NextRequest) {
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

    // Optional bulk settings from body
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = null;
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

    // Find vehicles that are auction type but don't have auction records
    // If vehicleIds are provided, filter by them
    const whereClause: any = {
      saleType: "AUCTION",
      status: {
        in: ["APPROVED", "AUCTION"],
      },
      auction: null, // No auction record exists
    };
    
    if (body?.vehicleIds && Array.isArray(body.vehicleIds) && body.vehicleIds.length > 0) {
      whereClause.id = {
        in: body.vehicleIds,
      };
    }
    
    const vehiclesWithoutAuctions = await prisma.vehicle.findMany({
      where: whereClause,
    });

    const createdAuctions = [];

    for (const vehicle of vehiclesWithoutAuctions) {
      // Check if auction already exists (double check)
      const existingAuction = await prisma.auction.findUnique({
        where: { vehicleId: vehicle.id },
      });

      if (!existingAuction) {
        // Update vehicle basePrice if provided in bulk settings
        let updatedVehicle = vehicle;
        if (body?.basePrice !== undefined && body?.basePrice !== null) {
          updatedVehicle = await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { basePrice: Number(body.basePrice) },
          });
        }
        
        // Determine reserve price (use updated basePrice if provided, otherwise use existing basePrice or saleAmount)
        const reservePrice = updatedVehicle.basePrice || vehicle.basePrice || vehicle.saleAmount;

        // --- Auction timing ---
        let startTime: Date;
        let endTime: Date;

        if (body?.auctionStartTime && body?.auctionEndTime) {
          const providedStart = new Date(body.auctionStartTime);
          const providedEnd = new Date(body.auctionEndTime);

          if (!isNaN(providedStart.getTime()) && !isNaN(providedEnd.getTime()) && providedEnd > providedStart) {
            startTime = providedStart;
            endTime = providedEnd;
          } else {
            // Fallback to defaults
            startTime = new Date();
            endTime = new Date();
            let durationDays = 1;
            if (reservePrice >= 200000 && reservePrice < 500000) {
              durationDays = 2;
            } else if (reservePrice >= 500000) {
              durationDays = 3;
            }
            endTime.setDate(endTime.getDate() + durationDays);
          }
        } else {
          // Default duration based on reserve price
          startTime = new Date();
          endTime = new Date();
          let durationDays = 1;
          if (reservePrice >= 200000 && reservePrice < 500000) {
            durationDays = 2;
          } else if (reservePrice >= 500000) {
            durationDays = 3;
          }
          endTime.setDate(endTime.getDate() + durationDays);
        }

        // --- Minimum increment ---
        let minimumIncrement: number;
        if (typeof body?.minimumIncrement === "number" && body.minimumIncrement > 0) {
          minimumIncrement = body.minimumIncrement;
        } else if (typeof body?.minimumIncrement === "string" && Number(body.minimumIncrement) > 0) {
          minimumIncrement = Number(body.minimumIncrement);
        } else {
          if (reservePrice < 100000) {
            minimumIncrement = 2000;
          } else if (reservePrice < 300000) {
            minimumIncrement = 5000;
          } else if (reservePrice < 700000) {
            minimumIncrement = 10000;
          } else {
            minimumIncrement = 20000;
          }
        }

        // Generate reference numbers if not already set
        let vehicleReferenceNumber = vehicle.referenceNumber;
        if (!vehicleReferenceNumber) {
          vehicleReferenceNumber = await generateVehicleReferenceNumber();
          await prisma.vehicle.update({
            where: { id: vehicle.id },
            data: { referenceNumber: vehicleReferenceNumber },
          });
        }

        // Generate auction reference number
        const auctionReferenceNumber = await generateAuctionReferenceNumber();

        const auction = await prisma.auction.create({
          data: {
            vehicleId: vehicle.id,
            referenceNumber: auctionReferenceNumber,
            startTime,
            endTime,
            reservePrice,
            minimumIncrement,
            currentBid: reservePrice, // Start with reserve price
            status: "SCHEDULED",
            emdRequired: body?.emdRequired === true,
            emdAmount: body?.emdRequired === true && body?.emdAmount ? Number(body.emdAmount) : null,
          },
        });

        // Update vehicle status to AUCTION
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: {
            status: "AUCTION",
          },
        });

        createdAuctions.push({
          vehicleId: vehicle.id,
          auctionId: auction.id,
          tractorBrand: vehicle.tractorBrand,
        });
      }
    }

    return NextResponse.json({
      message: `Created ${createdAuctions.length} auction(s)`,
      auctions: createdAuctions,
    });
  } catch (error) {
    console.error("Error creating missing auctions:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

