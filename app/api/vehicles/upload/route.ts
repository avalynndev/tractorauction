import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hasActiveMembership } from "@/lib/membership";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { handleApiError, AuthenticationError, ValidationError } from "@/lib/errors";
import { sanitizeInput, sanitizeRichText } from "@/lib/sanitize";

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

    // Check if user has active membership (admin can bypass)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin) {
      const hasMembership = await hasActiveMembership(decoded.userId);
      if (!hasMembership) {
        return NextResponse.json(
          { message: "You need an active membership to list vehicles. Please subscribe to a membership plan." },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();

    // Extract form fields with validation
    const vehicleType = formData.get("vehicleType") as string;
    const saleType = formData.get("saleType") as string;
    const saleAmountStr = formData.get("saleAmount") as string;
    const tractorBrand = formData.get("tractorBrand") as string;
    const engineHP = formData.get("engineHP") as string;
    const yearOfMfgStr = formData.get("yearOfMfg") as string;
    const state = formData.get("state") as string;
    const district = (formData.get("district") as string) || null;
    const runningCondition = formData.get("runningCondition") as string;
    const insuranceStatus = formData.get("insuranceStatus") as string;
    const rcCopyStatus = formData.get("rcCopyStatus") as string;

    // Validate required fields
    if (!vehicleType || !saleType || !saleAmountStr || !tractorBrand || !engineHP || !yearOfMfgStr || !state || !runningCondition || !insuranceStatus || !rcCopyStatus) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const saleAmount = parseFloat(saleAmountStr);
    const yearOfMfg = parseInt(yearOfMfgStr);

    if (isNaN(saleAmount) || saleAmount < 0) {
      return NextResponse.json(
        { message: "Invalid sale amount" },
        { status: 400 }
      );
    }

    if (isNaN(yearOfMfg) || yearOfMfg < 2000 || yearOfMfg > 2026) {
      return NextResponse.json(
        { message: "Invalid year of manufacture" },
        { status: 400 }
      );
    }

    // Optional fields - sanitize all user inputs
    const registrationNumber = formData.get("registrationNumber") 
      ? sanitizeInput(formData.get("registrationNumber") as string) 
      : null;
    const engineNumber = formData.get("engineNumber") 
      ? sanitizeInput(formData.get("engineNumber") as string) 
      : null;
    const chassisNumber = formData.get("chassisNumber") 
      ? sanitizeInput(formData.get("chassisNumber") as string) 
      : null;
    const hoursRun = formData.get("hoursRun") 
      ? sanitizeInput(formData.get("hoursRun") as string) 
      : null;
    const rcCopyType = formData.get("rcCopyType") 
      ? sanitizeInput(formData.get("rcCopyType") as string) 
      : null;
    const tractorModel = formData.get("tractorModel") 
      ? sanitizeInput(formData.get("tractorModel") as string) 
      : null;
    const financeNocPapers = formData.get("financeNocPapers") 
      ? sanitizeInput(formData.get("financeNocPapers") as string) 
      : null;
    const readyForToken = formData.get("readyForToken") 
      ? sanitizeInput(formData.get("readyForToken") as string) 
      : null;
    const clutchType = formData.get("clutchType") 
      ? sanitizeInput(formData.get("clutchType") as string) 
      : null;
    const iptoStr = formData.get("ipto") as string;
    const ipto = iptoStr === "true" ? true : iptoStr === "false" ? false : null;
    const drive = formData.get("drive") 
      ? sanitizeInput(formData.get("drive") as string) 
      : null;
    const steering = formData.get("steering") 
      ? sanitizeInput(formData.get("steering") as string) 
      : null;
    const tyreBrand = formData.get("tyreBrand") 
      ? sanitizeInput(formData.get("tyreBrand") as string) 
      : null;
    const otherFeatures = formData.get("otherFeatures") 
      ? sanitizeRichText(formData.get("otherFeatures") as string) 
      : null;

    // Handle file uploads
    const mainPhotoFile = formData.get("mainPhoto") as File | null;
    const subPhotosFiles = formData.getAll("subPhotos") as File[];
    
    // Collect all additional photos from categorized fields
    const additionalPhotoFiles: File[] = [];
    const tractorFrontPhoto = formData.get("tractorFrontPhoto") as File | null;
    const tractorLeftPhoto = formData.get("tractorLeftPhoto") as File | null;
    const tractorRightPhoto = formData.get("tractorRightPhoto") as File | null;
    const tractorBackPhoto = formData.get("tractorBackPhoto") as File | null;
    const engineNumberPhoto = formData.get("engineNumberPhoto") as File | null;
    const chassisNumberPhoto = formData.get("chassisNumberPhoto") as File | null;
    const batteryPhoto = formData.get("batteryPhoto") as File | null;
    const valuationCertificate = formData.get("valuationCertificate") as File | null;
    
    // Add categorized photos to additional photos array
    if (tractorFrontPhoto && tractorFrontPhoto.size > 0) additionalPhotoFiles.push(tractorFrontPhoto);
    if (tractorLeftPhoto && tractorLeftPhoto.size > 0) additionalPhotoFiles.push(tractorLeftPhoto);
    if (tractorRightPhoto && tractorRightPhoto.size > 0) additionalPhotoFiles.push(tractorRightPhoto);
    if (tractorBackPhoto && tractorBackPhoto.size > 0) additionalPhotoFiles.push(tractorBackPhoto);
    if (engineNumberPhoto && engineNumberPhoto.size > 0) additionalPhotoFiles.push(engineNumberPhoto);
    if (chassisNumberPhoto && chassisNumberPhoto.size > 0) additionalPhotoFiles.push(chassisNumberPhoto);
    if (batteryPhoto && batteryPhoto.size > 0) additionalPhotoFiles.push(batteryPhoto);
    if (valuationCertificate && valuationCertificate.size > 0) additionalPhotoFiles.push(valuationCertificate);
    
    // Combine subPhotos with additional categorized photos
    const allSubPhotosFiles = [...subPhotosFiles, ...additionalPhotoFiles];

    let mainPhoto: string | null = null;
    let subPhotos: string[] = [];

    // Upload main photo to Cloudinary
    if (mainPhotoFile) {
      try {
        if (isCloudinaryConfigured()) {
          mainPhoto = await uploadImageToCloudinary(mainPhotoFile, "vehicles");
        } else {
          // Fallback: Store filename if Cloudinary not configured
          console.warn("Cloudinary not configured. Storing filename instead of uploading.");
          mainPhoto = mainPhotoFile.name;
        }
      } catch (error: any) {
        console.error("Error uploading main photo:", error);
        return NextResponse.json(
          { message: `Failed to upload main photo: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Upload sub photos to Cloudinary (including all categorized photos)
    if (allSubPhotosFiles.length > 0) {
      try {
        if (isCloudinaryConfigured()) {
          subPhotos = await uploadMultipleImagesToCloudinary(allSubPhotosFiles, "vehicles");
        } else {
          // Fallback: Store filenames if Cloudinary not configured
          console.warn("Cloudinary not configured. Storing filenames instead of uploading.");
          subPhotos = allSubPhotosFiles.map((file) => file.name);
        }
      } catch (error: any) {
        console.error("Error uploading sub photos:", error);
        // Don't fail completely, just log the error
        console.warn("Continuing without sub photos due to upload error");
      }
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        sellerId: decoded.userId,
        vehicleType: vehicleType as any,
        saleType: saleType as any,
        saleAmount,
        basePrice: saleType === "AUCTION" ? saleAmount : null,
        tractorBrand,
        tractorModel,
        engineHP,
        yearOfMfg,
        registrationNumber,
        engineNumber,
        chassisNumber,
        hoursRun,
        state,
        district,
        runningCondition,
        insuranceStatus,
        rcCopyStatus,
        rcCopyType: rcCopyType as any,
        financeNocPapers,
        readyForToken,
        clutchType: clutchType as any,
        ipto,
        drive: drive as any,
        steering: steering as any,
        tyreBrand,
        otherFeatures,
        confirmationMessage: true,
        status: "PENDING",
        mainPhoto,
        subPhotos,
      },
    });

    // Generate blockchain hash for the vehicle
    try {
      const { createVehicleBlockchainRecord } = await import('@/lib/blockchain-service');
      await createVehicleBlockchainRecord(vehicle.id);
      console.log('Blockchain hash generated for vehicle:', vehicle.id);
    } catch (blockchainError) {
      console.error('Failed to generate blockchain hash:', blockchainError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        message: "Vehicle listed successfully",
        vehicleId: vehicle.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}


