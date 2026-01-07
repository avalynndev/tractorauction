import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Get inspection report by ID (Public access)
 * Allows buyers to view inspection reports for vehicles they're interested in
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    // Get inspection report - only show APPROVED or COMPLETED reports publicly
    const report = await prisma.vehicleInspectionReport.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        vehicleId: true,
        inspectedBy: true,
        inspectionDate: true,
        inspectionType: true,
        status: true,
        engineCondition: true,
        transmissionCondition: true,
        hydraulicSystem: true,
        electricalSystem: true,
        bodyCondition: true,
        tyreCondition: true,
        overallCondition: true,
        odometerReading: true,
        hoursRun: true,
        issuesFound: true,
        issuesCount: true,
        criticalIssues: true,
        estimatedRepairCosts: true,
        totalEstimatedCost: true,
        inspectionPhotos: true,
        inspectionDocument: true,
        notes: true,
        verifiedBy: true,
        verifiedAt: true,
        verificationNotes: true,
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
            yearOfMfg: true,
            engineHP: true,
            vehicleType: true,
            status: true, // Only show if vehicle is APPROVED, AUCTION, or SOLD
          },
        },
      },
    });

    // Get inspector details if inspectedBy is a user ID
    let inspector = null;
    if (report?.inspectedBy) {
      try {
        const inspectorUser = await prisma.user.findUnique({
          where: { id: report.inspectedBy },
          select: { fullName: true },
        });
        if (inspectorUser) {
          inspector = inspectorUser;
        }
      } catch (error) {
        // If inspectedBy is not a user ID, it might be a name string
        console.log("InspectedBy is not a user ID, treating as name");
      }
    }

    if (!report) {
      return NextResponse.json(
        { message: "Inspection report not found" },
        { status: 404 }
      );
    }

    // Only show reports for vehicles that are available for sale
    if (!["APPROVED", "AUCTION", "SOLD"].includes(report.vehicle.status)) {
      return NextResponse.json(
        { message: "Inspection report not available" },
        { status: 404 }
      );
    }

    // Only show APPROVED or COMPLETED reports publicly
    if (!["APPROVED", "COMPLETED"].includes(report.status)) {
      return NextResponse.json(
        { message: "Inspection report not available" },
        { status: 404 }
      );
    }

    // Add inspector info to report
    const reportWithInspector = {
      ...report,
      inspector: inspector || { fullName: report.inspectedBy || "Unknown" },
    };

    return NextResponse.json({ report: reportWithInspector });
  } catch (error: any) {
    console.error("Get public inspection report error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

