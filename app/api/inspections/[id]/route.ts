import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get single inspection report by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    // Get inspection report
    const report = await prisma.vehicleInspectionReport.findUnique({
      where: { id: reportId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
              },
            },
          },
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
            yearOfMfg: true,
            engineHP: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { message: "Inspection report not found" },
        { status: 404 }
      );
    }

    // Check if user has access (admin or vehicle owner)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";
    const isVehicleOwner = report.vehicle.seller.id === decoded.userId;

    if (!isAdmin && !isVehicleOwner) {
      return NextResponse.json(
        { message: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({ report });
  } catch (error: any) {
    console.error("Get inspection report error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Update inspection report
 * Admin or assigned valuer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    // Get the inspection to check assigned valuer
    const existingInspection = await prisma.vehicleInspectionReport.findUnique({
      where: { id: reportId },
      select: { assignedValuerId: true },
    });

    if (!existingInspection) {
      return NextResponse.json(
        { message: "Inspection report not found" },
        { status: 404 }
      );
    }

    let isAdmin = false;
    let isAssignedValuer = false;
    let decoded: any = null; // Declare decoded at higher scope
    const authHeader = request.headers.get("authorization");
    const valuerIdHeader = request.headers.get("x-valuer-id"); // Valuer ID from client

    // Check if request has admin token
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      decoded = verifyToken(token);

      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true },
        });

        isAdmin = user?.role === "ADMIN";
      }
    }

    // Check if valuer is accessing their own inspection
    if (valuerIdHeader && existingInspection.assignedValuerId) {
      if (valuerIdHeader === existingInspection.assignedValuerId) {
        // Verify valuer exists and is active
        const valuer = await prisma.valuer.findUnique({
          where: { id: valuerIdHeader },
          select: { id: true, isActive: true },
        });

        if (valuer && valuer.isActive) {
          isAssignedValuer = true;
        }
      }
    }

    if (!isAdmin && !isAssignedValuer) {
      return NextResponse.json(
        { message: "Only admins or assigned valuers can update inspection reports" },
        { status: 403 }
      );
    }

    // Check content type to handle both JSON and FormData
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};
    let formData: FormData | null = null;

    if (contentType.includes("multipart/form-data")) {
      formData = await request.formData();
      // Extract fields from FormData
      body.status = formData.get("status") as string | null;
      body.engineCondition = formData.get("engineCondition") as string | null;
      body.transmissionCondition = formData.get("transmissionCondition") as string | null;
      body.hydraulicSystem = formData.get("hydraulicSystem") as string | null;
      body.electricalSystem = formData.get("electricalSystem") as string | null;
      body.bodyCondition = formData.get("bodyCondition") as string | null;
      body.tyreCondition = formData.get("tyreCondition") as string | null;
      body.overallCondition = formData.get("overallCondition") as string | null;
      body.odometerReading = formData.get("odometerReading") as string | null;
      body.hoursRun = formData.get("hoursRun") as string | null;
      body.issuesFound = formData.get("issuesFound") as string | null;
      body.issuesCount = formData.get("issuesCount") ? parseInt(formData.get("issuesCount") as string) : undefined;
      body.criticalIssues = formData.get("criticalIssues") ? parseInt(formData.get("criticalIssues") as string) : undefined;
      body.estimatedRepairCosts = formData.get("estimatedRepairCosts") as string | null;
      body.totalEstimatedCost = formData.get("totalEstimatedCost") ? parseFloat(formData.get("totalEstimatedCost") as string) : undefined;
      body.notes = formData.get("notes") as string | null;
      body.verificationNotes = formData.get("verificationNotes") as string | null;
    } else {
      body = await request.json();
    }

    // Handle file uploads if FormData
    let inspectionPhotos: string[] = [];
    let inspectionDocument: string | null = null;

    if (formData) {
      const { uploadMultipleImagesToCloudinary } = await import("@/lib/cloudinary");
      
      // Handle inspection photos
      const photoFiles = formData.getAll("inspectionPhotos") as File[];
      if (photoFiles.length > 0 && photoFiles[0].size > 0) {
        try {
          const uploadedPhotos = await uploadMultipleImagesToCloudinary(photoFiles, "inspections");
          inspectionPhotos = uploadedPhotos;
        } catch (error) {
          console.error("Error uploading inspection photos:", error);
        }
      }

      // Handle inspection document
      const documentFile = formData.get("inspectionDocument") as File | null;
      if (documentFile && documentFile.size > 0) {
        try {
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
    }

    // Update inspection report
    const updateData: any = {};
    if (body.status) {
      // Only admins can change status, valuers can only set to COMPLETED
      if (isAdmin) {
        updateData.status = body.status;
      } else if (body.status === "COMPLETED") {
        updateData.status = "COMPLETED";
      }
    } else if (!isAdmin) {
      // Valuers submitting form should set status to COMPLETED
      updateData.status = "COMPLETED";
    }
    if (body.engineCondition !== undefined) updateData.engineCondition = body.engineCondition;
    if (body.transmissionCondition !== undefined) updateData.transmissionCondition = body.transmissionCondition;
    if (body.hydraulicSystem !== undefined) updateData.hydraulicSystem = body.hydraulicSystem;
    if (body.electricalSystem !== undefined) updateData.electricalSystem = body.electricalSystem;
    if (body.bodyCondition !== undefined) updateData.bodyCondition = body.bodyCondition;
    if (body.tyreCondition !== undefined) updateData.tyreCondition = body.tyreCondition;
    if (body.overallCondition !== undefined) updateData.overallCondition = body.overallCondition;
    if (body.odometerReading !== undefined) updateData.odometerReading = body.odometerReading;
    if (body.hoursRun !== undefined) updateData.hoursRun = body.hoursRun;
    if (body.issuesFound !== undefined) updateData.issuesFound = body.issuesFound;
    if (body.issuesCount !== undefined) updateData.issuesCount = body.issuesCount;
    if (body.criticalIssues !== undefined) updateData.criticalIssues = body.criticalIssues;
    if (body.estimatedRepairCosts !== undefined) {
      // estimatedRepairCosts is stored as JSON string in the database
      updateData.estimatedRepairCosts = typeof body.estimatedRepairCosts === "string" 
        ? body.estimatedRepairCosts 
        : JSON.stringify(body.estimatedRepairCosts);
    }
    if (body.totalEstimatedCost !== undefined) updateData.totalEstimatedCost = body.totalEstimatedCost;
    if (body.notes !== undefined) updateData.notes = body.notes;
    
    // Handle photos - append to existing or replace
    if (inspectionPhotos.length > 0) {
      const existingReport = await prisma.vehicleInspectionReport.findUnique({
        where: { id: reportId },
        select: { inspectionPhotos: true },
      });
      updateData.inspectionPhotos = [...(existingReport?.inspectionPhotos || []), ...inspectionPhotos];
    }

    // Handle document
    if (inspectionDocument) {
      updateData.inspectionDocument = inspectionDocument;
    }
    
    // If approving, set verified fields (admin only)
    if (body.status === "APPROVED" && isAdmin && decoded) {
      updateData.verifiedBy = decoded.userId;
      updateData.verifiedAt = new Date();
      if (body.verificationNotes) updateData.verificationNotes = body.verificationNotes;
    }

    const updatedReport = await prisma.vehicleInspectionReport.update({
      where: { id: reportId },
      data: updateData,
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
      message: "Inspection report updated successfully",
      report: updatedReport,
    });
  } catch (error: any) {
    console.error("Update inspection report error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Delete inspection report
 * Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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
        { message: "Only admins can delete inspection reports" },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const reportId = resolvedParams.id;

    await prisma.vehicleInspectionReport.delete({
      where: { id: reportId },
    });

    return NextResponse.json({
      message: "Inspection report deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete inspection report error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}







