import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";

/**
 * Upload or update user profile photo
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

    const formData = await request.formData();
    const photoFile = formData.get("photo") as File | null;

    if (!photoFile) {
      return NextResponse.json(
        { message: "No photo file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(photoFile.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Allowed types: JPEG, PNG, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for profile photos)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (photoFile.size > maxSize) {
      return NextResponse.json(
        { message: "File size too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Get current user to check for existing photo
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { profilePhoto: true },
    });

    // Upload to Cloudinary
    let photoUrl: string;
    if (isCloudinaryConfigured()) {
      photoUrl = await uploadImageToCloudinary(
        photoFile,
        "profiles",
        `user-${decoded.userId}`
      );
    } else {
      // Fallback: Store as base64 (not recommended for production)
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString("base64");
      photoUrl = `data:${photoFile.type};base64,${base64}`;
    }

    // Update user profile photo
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profilePhoto: photoUrl,
      },
      select: {
        id: true,
        fullName: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      message: "Profile photo updated successfully",
      photoUrl,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile photo upload error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to upload profile photo" },
      { status: 500 }
    );
  }
}

/**
 * Delete user profile photo
 */
export async function DELETE(request: NextRequest) {
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

    // Remove profile photo
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profilePhoto: null,
      },
      select: {
        id: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      message: "Profile photo removed successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Profile photo delete error:", error);
    return NextResponse.json(
      { message: "Failed to remove profile photo" },
      { status: 500 }
    );
  }
}

