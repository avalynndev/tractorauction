import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { uploadVideoToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { handleApiError } from "@/lib/errors";

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
    const vehicleId = formData.get("vehicleId") as string;
    const videoFile = formData.get("video") as File | null;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    if (!videoFile) {
      return NextResponse.json(
        { message: "Video file is required" },
        { status: 400 }
      );
    }

    // Check if user owns the vehicle or is admin
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { sellerId: true },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin && vehicle.sellerId !== decoded.userId) {
      return NextResponse.json(
        { message: "You don't have permission to upload video for this vehicle" },
        { status: 403 }
      );
    }

    // Upload video to Cloudinary
    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { message: "Video upload service is not configured" },
        { status: 500 }
      );
    }

    const { url, thumbnail } = await uploadVideoToCloudinary(
      videoFile,
      "vehicles/videos"
    );

    // Update vehicle with video URL
    const updatedVehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        videoUrl: url,
        videoThumbnail: thumbnail,
      },
    });

    return NextResponse.json({
      message: "Video uploaded successfully",
      videoUrl: url,
      thumbnail: thumbnail,
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    console.error("Video upload error:", error);
    return handleApiError(error);
  }
}

