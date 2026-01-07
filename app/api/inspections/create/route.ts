import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary } from "@/lib/cloudinary";

/**
 * Create a vehicle inspection report
 * Admin only
 */
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can create inspection reports" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const vehicleId = formData.get("vehicleId") as string;
    
    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Extract form data
    const inspectionType = (formData.get("inspectionType") as string) || "COMPREHENSIVE";
    const engineCondition = formData.get("engineCondition") as string | null;
    const transmissionCondition = formData.get("transmissionCondition") as string | null;
    const hydraulicSystem = formData.get("hydraulicSystem") as string | null;
    const electricalSystem = formData.get("electricalSystem") as string | null;
    const bodyCondition = formData.get("bodyCondition") as string | null;
    const tyreCondition = formData.get("tyreCondition") as string | null;
    const overallCondition = formData.get("overallCondition") as string | null;
    const odometerReading = formData.get("odometerReading") as string | null;
    const hoursRun = formData.get("hoursRun") as string | null;
    const issuesFound = formData.get("issuesFound") as string | null;
    const issuesCount = parseInt(formData.get("issuesCount") as string || "0");
    const criticalIssues = parseInt(formData.get("criticalIssues") as string || "0");
    const notes = formData.get("notes") as string | null;
    
    // Repair cost estimates
    const estimatedRepairCosts = formData.get("estimatedRepairCosts") as string | null;
    const totalEstimatedCost = formData.get("totalEstimatedCost") 
      ? parseFloat(formData.get("totalEstimatedCost") as string) 
      : null;

    // Handle inspection photos
    const photoFiles = formData.getAll("inspectionPhotos") as File[];
    let inspectionPhotos: string[] = [];

    if (photoFiles.length > 0 && photoFiles[0].size > 0) {
      try {
        const uploadedPhotos = await uploadMultipleImagesToCloudinary(photoFiles, "inspections");
        inspectionPhotos = uploadedPhotos;
      } catch (error) {
        console.error("Error uploading inspection photos:", error);
        // Continue without photos if upload fails
      }
    }

    // Handle inspection document (PDF)
    const documentFile = formData.get("inspectionDocument") as File | null;
    let inspectionDocument: string | null = null;

    if (documentFile && documentFile.size > 0) {
      try {
        // Upload document to Cloudinary
        const formDataCloudinary = new FormData();
        formDataCloudinary.append("file", documentFile);
        formDataCloudinary.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "default");
        formDataCloudinary.append("resource_type", "auto");

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
          {
            method: "POST",
            body: formDataCloudinary,
          }
        );

        if (response.ok) {
          const data = await response.json();
          inspectionDocument = data.secure_url;
        }
      } catch (error) {
        console.error("Error uploading inspection document:", error);
      }
    }

    // Create inspection report
    const inspectionReport = await prisma.vehicleInspectionReport.create({
      data: {
        vehicleId,
        inspectedBy: decoded.userId,
        inspectionType: inspectionType as any,
        status: "COMPLETED",
        engineCondition,
        transmissionCondition,
        hydraulicSystem,
        electricalSystem,
        bodyCondition,
        tyreCondition,
        overallCondition,
        odometerReading,
        hoursRun,
        issuesFound,
        issuesCount,
        criticalIssues,
        estimatedRepairCosts,
        totalEstimatedCost,
        inspectionPhotos,
        inspectionDocument,
        notes,
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Inspection report created successfully",
      inspectionReport,
    });
  } catch (error: any) {
    console.error("Create inspection report error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







