import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

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

    const formData = await request.formData();
    const documentType = formData.get("documentType") as string; // "PAN", "AADHAR", "CANCELLED_CHEQUE", "GST_COPY", "CIN", or "OTHERS"
    const file = formData.get("file") as File;

    if (!documentType || !file) {
      return NextResponse.json(
        { message: "Document type and file are required" },
        { status: 400 }
      );
    }

    if (!["PAN", "AADHAR", "CANCELLED_CHEQUE", "GST_COPY", "CIN", "OTHERS"].includes(documentType)) {
      return NextResponse.json(
        { message: "Invalid document type. Must be PAN, AADHAR, CANCELLED_CHEQUE, GST_COPY, CIN, or OTHERS" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPEG, PNG, WebP, or PDF allowed" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { message: "File size too large. Maximum 5MB allowed" },
        { status: 400 }
      );
    }

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { message: "Cloudinary is not configured" },
        { status: 500 }
      );
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const isPDF = file.type === "application/pdf";
    // Map document types to public_id format
    const publicIdMap: Record<string, string> = {
      "PAN": "pan",
      "AADHAR": "aadhar",
      "CANCELLED_CHEQUE": "cancelled_cheque",
      "GST_COPY": "gst_copy",
      "CIN": "cin",
      "OTHERS": "others",
    };
    const uploadOptions: any = {
      folder: `kyc/${decoded.userId}`,
      public_id: publicIdMap[documentType] || documentType.toLowerCase(),
      resource_type: isPDF ? "raw" : "image",
    };

    // Only add image-specific options for non-PDF files
    if (!isPDF) {
      uploadOptions.quality = "auto";
      uploadOptions.fetch_format = "auto";
    }

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return NextResponse.json(
        { message: "Failed to upload document" },
        { status: 500 }
      );
    }

    // Update user with KYC document
    const updateData: any = {};
    if (documentType === "PAN") {
      updateData.panCard = uploadResult.secure_url;
    } else if (documentType === "AADHAR") {
      updateData.aadharCard = uploadResult.secure_url;
    } else if (documentType === "CANCELLED_CHEQUE") {
      updateData.cancelledCheque = uploadResult.secure_url;
    } else if (documentType === "GST_COPY") {
      updateData.gstCopy = uploadResult.secure_url;
    } else if (documentType === "CIN") {
      updateData.cin = uploadResult.secure_url;
    } else if (documentType === "OTHERS") {
      updateData.otherDocuments = uploadResult.secure_url;
    }

    // If both documents are uploaded, set submitted date
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { panCard: true, aadharCard: true, cancelledCheque: true, gstCopy: true, cin: true, otherDocuments: true, kycStatus: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const hasPan = documentType === "PAN" ? true : !!user.panCard;
    const hasAadhar = documentType === "AADHAR" ? true : !!user.aadharCard;

    if (hasPan && hasAadhar && user.kycStatus === "PENDING") {
      updateData.kycSubmittedAt = new Date();
      updateData.kycStatus = "PENDING"; // Keep as PENDING until admin approves
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        panCard: true,
        aadharCard: true,
        cancelledCheque: true,
        gstCopy: true,
        cin: true,
        otherDocuments: true,
        kycStatus: true,
        kycSubmittedAt: true,
      },
    });

    return NextResponse.json({
      message: `${documentType} card uploaded successfully`,
      kyc: updatedUser,
    });
  } catch (error) {
    console.error("Error uploading KYC document:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

