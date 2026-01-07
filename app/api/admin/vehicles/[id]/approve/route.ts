import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateVehicleReferenceNumber, generateAuctionReferenceNumber } from "@/lib/reference-numbers";
import { notifySellerVehicleApproved, notifySellerAuctionScheduled } from "@/lib/email-notifications";
import { createVehicleBlockchainRecord } from "@/lib/blockchain-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const vehicleId = resolvedParams.id;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Optional body for manual auction scheduling
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      body = null;
    }

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

    // Get vehicle
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Update vehicle status based on sale type
    // For PREAPPROVED: status = APPROVED
    // For AUCTION: status = AUCTION
    let vehicleStatus: "APPROVED" | "AUCTION" = "APPROVED";
    if (vehicle.saleType === "AUCTION") {
      vehicleStatus = "AUCTION";
    }
    
    // Log for debugging
    console.log(`Approving vehicle ${vehicleId}: saleType=${vehicle.saleType}, currentStatus=${vehicle.status}, newStatus=${vehicleStatus}`);

    // Generate vehicle reference number if not already set
    let vehicleReferenceNumber = vehicle.referenceNumber;
    if (!vehicleReferenceNumber) {
      try {
        vehicleReferenceNumber = await generateVehicleReferenceNumber();
      } catch (error) {
        console.error("Error generating reference number:", error);
        // Use a fallback reference number if generation fails
        const timestamp = Date.now().toString().slice(-8);
        vehicleReferenceNumber = `VH-${new Date().getFullYear()}-${timestamp}`;
      }
    }

    // Build update data object
    const updateData: any = {
      status: vehicleStatus,
      referenceNumber: vehicleReferenceNumber,
    };
    
    // Update certified and finance available flags if provided
    if (body?.isCertified !== undefined) {
      updateData.isCertified = Boolean(body.isCertified);
    }
    if (body?.isFinanceAvailable !== undefined) {
      updateData.isFinanceAvailable = Boolean(body.isFinanceAvailable);
    }
    // Update OEM if provided
    if (body?.oem !== undefined) {
      updateData.oem = body.oem === null || body.oem === "" ? null : String(body.oem);
    }
    // Update basePrice (reserved price) if provided
    if (body?.basePrice !== undefined && body?.basePrice !== null) {
      updateData.basePrice = Number(body.basePrice);
    }

    // Update vehicle status
    let updatedVehicle;
    try {
      updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: updateData,
      });
      console.log(`Vehicle ${vehicleId} updated successfully: status=${updatedVehicle.status}, refNumber=${updatedVehicle.referenceNumber}, saleType=${updatedVehicle.saleType}`);
      
      // Double-check: If saleType is AUCTION, ensure status is AUCTION
      if (updatedVehicle.saleType === "AUCTION" && updatedVehicle.status !== "AUCTION") {
        console.warn(`Vehicle ${vehicleId} has saleType=AUCTION but status=${updatedVehicle.status}. Fixing...`);
        updatedVehicle = await prisma.vehicle.update({
          where: { id: vehicleId },
          data: { status: "AUCTION" },
        });
        console.log(`Fixed vehicle ${vehicleId} status to AUCTION`);
      }
    } catch (updateError: any) {
      console.error("Error updating vehicle in database:", updateError);
      console.error("Update data attempted:", JSON.stringify(updateData, null, 2));
      console.error("Vehicle current state:", {
        id: vehicle.id,
        status: vehicle.status,
        saleType: vehicle.saleType,
        referenceNumber: vehicle.referenceNumber,
      });
      throw updateError; // Re-throw to be caught by outer catch
    }

    // If it's an auction type, create or update auction entry
    if (vehicle.saleType === "AUCTION") {
      // Check if auction already exists
      const existingAuction = await prisma.auction.findUnique({
        where: { vehicleId: vehicleId },
      });

      // Determine reserve price
      // Determine reserve price (use updated basePrice if provided, otherwise use existing basePrice or saleAmount)
      const reservePrice = updatedVehicle.basePrice || vehicle.basePrice || vehicle.saleAmount;

      // --- Auction timing ---
      let startTime: Date;
      let endTime: Date;
      let shouldUpdateAuction = false;

      // If admin provided explicit times, use them
      if (body?.auctionStartTime && body?.auctionEndTime) {
        const providedStart = new Date(body.auctionStartTime);
        const providedEnd = new Date(body.auctionEndTime);

        if (!isNaN(providedStart.getTime()) && !isNaN(providedEnd.getTime()) && providedEnd > providedStart) {
          startTime = providedStart;
          endTime = providedEnd;
          shouldUpdateAuction = true; // Admin provided new times, update if auction exists
        } else {
          // Fallback to default durations if invalid
          startTime = new Date();
          endTime = new Date();
        }
      } else {
        // Default duration based on reserve price
        startTime = new Date(); // start now
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
        shouldUpdateAuction = true;
      } else if (typeof body?.minimumIncrement === "string" && Number(body.minimumIncrement) > 0) {
        minimumIncrement = Number(body.minimumIncrement);
        shouldUpdateAuction = true;
      } else {
        // Default slab-based increment
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

      if (!existingAuction) {
        // Generate auction reference number
        let auctionReferenceNumber: string;
        try {
          auctionReferenceNumber = await generateAuctionReferenceNumber();
        } catch (error) {
          console.error("Error generating auction reference number:", error);
          // Use a fallback reference number if generation fails
          const timestamp = Date.now().toString().slice(-8);
          auctionReferenceNumber = `AU-${new Date().getFullYear()}-${timestamp}`;
        }

        const newAuction = await prisma.auction.create({
          data: {
            vehicleId: vehicleId,
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

        // Send email notification to seller about auction scheduling
        try {
          await notifySellerAuctionScheduled(vehicle.sellerId, newAuction.id, startTime, endTime);
        } catch (error) {
          console.error("Error sending auction scheduled email:", error);
        }
      } else if (shouldUpdateAuction && existingAuction) {
        // Update existing auction with new times/increment if admin provided them
        await prisma.auction.update({
          where: { id: existingAuction.id },
          data: {
            startTime,
            endTime,
            minimumIncrement,
            // Only update status to SCHEDULED if it's not LIVE or ENDED
            ...(existingAuction.status !== "LIVE" && existingAuction.status !== "ENDED" 
              ? { status: "SCHEDULED" } 
              : {}),
          },
        });
        console.log(`Updated existing auction ${existingAuction.id} with new times: start=${startTime}, end=${endTime}`);
        
        // Ensure vehicle status is AUCTION (in case it wasn't set correctly before)
        const vehicleCheck = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: { status: true },
        });
        if (vehicleCheck?.status !== "AUCTION") {
          console.warn(`Vehicle ${vehicleId} status is ${vehicleCheck?.status}, updating to AUCTION`);
          await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { status: "AUCTION" },
          });
        }
      } else if (existingAuction) {
        // Even if not updating times, ensure vehicle status is AUCTION
        const vehicleCheck = await prisma.vehicle.findUnique({
          where: { id: vehicleId },
          select: { status: true },
        });
        if (vehicleCheck?.status !== "AUCTION") {
          console.warn(`Vehicle ${vehicleId} status is ${vehicleCheck?.status}, updating to AUCTION`);
          await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { status: "AUCTION" },
          });
        }
      }
    }

    // Create blockchain record automatically when vehicle is approved
    try {
      await createVehicleBlockchainRecord(vehicleId);
      console.log(`Blockchain record created for vehicle ${vehicleId}`);
    } catch (error) {
      console.error(`Failed to create blockchain record for vehicle ${vehicleId}:`, error);
      // Don't fail the approval if blockchain creation fails
    }

    // Send email notification to seller about vehicle approval
    // Don't fail the approval if email fails
    try {
      await notifySellerVehicleApproved(vehicle.sellerId, vehicleId);
    } catch (error) {
      console.error("Error sending vehicle approval email:", error);
      // Continue even if email fails
    }

    return NextResponse.json({
      message: "Vehicle approved successfully",
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    console.error("Error approving vehicle:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Return more specific error message
    let errorMessage = "Internal server error";
    if (error?.code === "P2002") {
      errorMessage = "Reference number already exists. Please try again.";
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { message: errorMessage, error: error?.code || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

