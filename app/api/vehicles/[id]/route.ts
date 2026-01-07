import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const vehicleId = resolvedParams.id;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: {
        id: true,
        vehicleType: true,
        saleType: true,
        status: true,
        saleAmount: true,
        basePrice: true,
        tractorBrand: true,
        tractorModel: true,
        engineHP: true,
        yearOfMfg: true,
        registrationNumber: true,
        engineNumber: true,
        chassisNumber: true,
        hoursRun: true,
        state: true,
        district: true,
        runningCondition: true,
        insuranceStatus: true,
        rcCopyStatus: true,
        rcCopyType: true,
        financeNocPapers: true,
        readyForToken: true,
        clutchType: true,
        ipto: true,
        drive: true,
        steering: true,
        tyreBrand: true,
        otherFeatures: true,
        isCertified: true,
        isFinanceAvailable: true,
        mainPhoto: true,
        subPhotos: true,
        videoUrl: true,
        videoThumbnail: true,
        referenceNumber: true,
        blockchainHash: true,
        blockchainTxHash: true,
        blockchainVerified: true,
        blockchainVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
          },
        },
        auction: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            currentBid: true,
            reservePrice: true,
            minimumIncrement: true,
            status: true,
            blockchainHash: true,
            blockchainVerified: true,
          },
        },
        inspectionReports: {
          where: {
            status: {
              in: ["COMPLETED", "APPROVED"],
            },
          },
          orderBy: {
            inspectionDate: "desc",
          },
          take: 5, // Show latest 5 reports
          select: {
            id: true,
            inspectionDate: true,
            inspectionType: true,
            status: true,
            overallCondition: true,
            issuesCount: true,
            criticalIssues: true,
            verifiedAt: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Only return approved, auction, or sold vehicles for public access
    // Admin can access all via admin API
    // Sold vehicles can still be viewed for reference
    if (vehicle.status !== "APPROVED" && vehicle.status !== "AUCTION" && vehicle.status !== "SOLD") {
      return NextResponse.json(
        { message: "Vehicle not available" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

