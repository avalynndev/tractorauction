import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { uploadImageToCloudinary, uploadMultipleImagesToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import * as XLSX from "xlsx";
import Papa from "papaparse";

/**
 * POST - Bulk upload images for multiple vehicles
 * Accepts a CSV/Excel file with vehicle IDs and image mappings
 * Format: vehicleId, imageType (main/sub), imageFile
 * OR: Upload a zip file with folder structure: vehicleId/main.jpg, vehicleId/sub1.jpg, etc.
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Admin access required" }, { status: 403 });
    }

    const formData = await request.formData();
    const mappingFile = formData.get("mappingFile") as File | null;
    const imageFiles = formData.getAll("images") as File[];

    if (!mappingFile && imageFiles.length === 0) {
      return NextResponse.json(
        { message: "Please provide either a mapping file or image files" },
        { status: 400 }
      );
    }

    // For now, we'll implement a simpler approach:
    // Upload multiple images for a single vehicle or multiple vehicles
    // Using a CSV/Excel mapping file: vehicleId, imageType, imageFileName
    
    if (mappingFile) {
      const fileName = mappingFile.name.toLowerCase();
      const fileBuffer = Buffer.from(await mappingFile.arrayBuffer());
      
      let mappings: any[] = [];
      
      if (fileName.endsWith(".csv")) {
        if (!Papa) throw new Error("PapaParse not loaded");
        const fileContent = fileBuffer.toString("utf-8");
        const result = Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        });
        mappings = result.data;
      } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
        if (!XLSX) throw new Error("XLSX not loaded");
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        mappings = XLSX.utils.sheet_to_json(worksheet);
      } else {
        return NextResponse.json(
          { message: "Mapping file must be CSV or Excel format" },
          { status: 400 }
        );
      }

      // Process mappings and upload images
      const results = [];
      const errors = [];

      for (const mapping of mappings) {
        try {
          const vehicleId = mapping.vehicleId || mapping.vehicle_id || mapping["Vehicle ID"];
          const imageType = (mapping.imageType || mapping.image_type || mapping["Image Type"] || "sub").toLowerCase();
          const imageFileName = mapping.imageFileName || mapping.image_file_name || mapping["Image File Name"];

          if (!vehicleId) {
            errors.push({ row: mapping, error: "Missing vehicleId" });
            continue;
          }

          // Find the image file
          const imageFile = imageFiles.find(
            (f) => f.name === imageFileName || f.name.toLowerCase() === imageFileName?.toLowerCase()
          );

          if (!imageFile) {
            errors.push({ row: mapping, error: `Image file not found: ${imageFileName}` });
            continue;
          }

          // Get vehicle
          const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { id: true, mainPhoto: true, subPhotos: true },
          });

          if (!vehicle) {
            errors.push({ row: mapping, error: `Vehicle not found: ${vehicleId}` });
            continue;
          }

          // Upload image
          let imageUrl: string;
          if (isCloudinaryConfigured()) {
            imageUrl = await uploadImageToCloudinary(imageFile, "vehicles");
          } else {
            imageUrl = imageFile.name;
          }

          // Update vehicle
          if (imageType === "main") {
            await prisma.vehicle.update({
              where: { id: vehicleId },
              data: { mainPhoto: imageUrl },
            });
            results.push({ vehicleId, type: "main", success: true });
          } else {
            const currentSubPhotos = vehicle.subPhotos || [];
            await prisma.vehicle.update({
              where: { id: vehicleId },
              data: { subPhotos: [...currentSubPhotos, imageUrl] },
            });
            results.push({ vehicleId, type: "sub", success: true });
          }
        } catch (error: any) {
          errors.push({ row: mapping, error: error.message });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} image(s) successfully`,
        results,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // If no mapping file, return instructions
    return NextResponse.json(
      {
        message: "Please provide a mapping file (CSV/Excel) with vehicle IDs and image mappings",
        format: {
          csv: "vehicleId, imageType, imageFileName",
          example: "cm123..., main, vehicle1-main.jpg",
        },
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Bulk image upload error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred while processing bulk image upload" },
      { status: 500 }
    );
  }
}

