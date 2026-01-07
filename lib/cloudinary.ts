import { v2 as cloudinary } from "cloudinary";
import { scanFile } from "@/lib/virus-scan";

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Convert File to Buffer
 */
async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Upload image to Cloudinary
 * @param file - File object from form data
 * @param folder - Cloudinary folder path (e.g., "vehicles")
 * @param publicId - Optional custom public ID
 * @returns Promise<string> - Cloudinary URL of uploaded image
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = "vehicles",
  publicId?: string
): Promise<string> {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error("Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.");
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is 10MB.`);
    }

    // Convert file to buffer for streaming upload
    const buffer = await fileToBuffer(file);

    // Virus scan (if enabled)
    if (process.env.ENABLE_VIRUS_SCAN === "true") {
      try {
        const scanResult = await scanFile(buffer, file.name, file.type);
        if (!scanResult.clean) {
          throw new Error(
            `File failed virus scan: ${scanResult.threats?.join(", ") || scanResult.error || "Unknown threat"}`
          );
        }
      } catch (error: any) {
        // If virus scanning fails, log but don't block (in production, you may want to block)
        console.error("Virus scan error:", error);
        if (error.message.includes("failed virus scan")) {
          throw error; // Re-throw if scan actually failed
        }
      }
    }

    // Upload to Cloudinary using upload_stream (more reliable than data URI)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: "image",
          quality: "auto",
          fetch_format: "auto",
          transformation: [
            {
              width: 1200,
              height: 1200,
              crop: "limit", // Maintain aspect ratio, limit dimensions
            },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Pipe buffer to upload stream
      uploadStream.end(buffer);
    });

    if (result && result.secure_url) {
      console.log(`✅ Image uploaded to Cloudinary: ${result.secure_url}`);
      return result.secure_url;
    } else {
      throw new Error("Upload failed: No URL returned from Cloudinary");
    }
  } catch (error: any) {
    console.error("Error uploading image to Cloudinary:", error);
    
    // Provide more helpful error messages
    if (error.message && error.message.includes("Invalid Signature")) {
      console.error("❌ Cloudinary Signature Error - This usually means:");
      console.error("   1. Your CLOUDINARY_API_SECRET in .env is incorrect");
      console.error("   2. Check your Cloudinary dashboard: https://console.cloudinary.com/");
      console.error("   3. Copy the API Secret exactly (no extra spaces)");
      throw new Error("Cloudinary authentication failed. Please check your CLOUDINARY_API_SECRET in .env file.");
    }
    
    if (error.message && error.message.includes("Invalid API Key")) {
      console.error("❌ Cloudinary API Key Error - Check your CLOUDINARY_API_KEY in .env");
      throw new Error("Cloudinary API key is invalid. Please check your CLOUDINARY_API_KEY in .env file.");
    }
    
    throw error;
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param files - Array of File objects
 * @param folder - Cloudinary folder path
 * @returns Promise<string[]> - Array of Cloudinary URLs
 */
export async function uploadMultipleImagesToCloudinary(
  files: File[],
  folder: string = "vehicles"
): Promise<string[]> {
  try {
    const uploadPromises = files.map((file, index) =>
      uploadImageToCloudinary(file, folder, undefined)
    );
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error: any) {
    console.error("Error uploading multiple images:", error);
    throw error;
  }
}

/**
 * Delete image from Cloudinary
 * @param publicId - Cloudinary public ID or URL
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  try {
    if (!isCloudinaryConfigured()) {
      console.warn("Cloudinary not configured. Cannot delete image.");
      return false;
    }

    // Extract public ID from URL if full URL is provided
    let extractedPublicId = publicId;
    if (publicId.includes("cloudinary.com")) {
      // Extract public ID from URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/image.jpg
      const parts = publicId.split("/");
      const uploadIndex = parts.findIndex((part) => part === "upload");
      if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
        // Skip version and get folder + filename
        extractedPublicId = parts.slice(uploadIndex + 2).join("/").replace(/\.[^/.]+$/, "");
      }
    }

    const result = await cloudinary.uploader.destroy(extractedPublicId);
    
    if (result.result === "ok") {
      console.log(`✅ Image deleted from Cloudinary: ${extractedPublicId}`);
      return true;
    } else {
      console.warn(`⚠️ Image deletion result: ${result.result}`);
      return false;
    }
  } catch (error: any) {
    console.error("Error deleting image from Cloudinary:", error);
    return false;
  }
}

/**
 * Upload video to Cloudinary
 * @param file - File object from form data
 * @param folder - Cloudinary folder path (e.g., "videos")
 * @param publicId - Optional custom public ID
 * @returns Promise<{url: string, thumbnail: string}> - Cloudinary URLs
 */
export async function uploadVideoToCloudinary(
  file: File,
  folder: string = "videos",
  publicId?: string
): Promise<{ url: string; thumbnail: string }> {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error("Cloudinary is not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file.");
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(", ")}`);
    }

    // Validate file size (max 500MB for videos)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum size is 500MB.`);
    }

    // Convert file to buffer
    const buffer = await fileToBuffer(file);

    // Upload to Cloudinary
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: publicId,
          resource_type: "video",
          chunk_size: 6000000, // 6MB chunks for better reliability
          eager: [
            { width: 1280, height: 720, crop: "limit", format: "jpg" }, // Generate thumbnail
          ],
          eager_async: false,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary video upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(buffer);
    });

    if (result && result.secure_url) {
      // Get thumbnail from eager transformations
      const thumbnail = result.eager && result.eager[0] 
        ? result.eager[0].secure_url 
        : result.secure_url.replace(/\.(mp4|webm|mov|avi)$/i, '.jpg');
      
      console.log(`✅ Video uploaded to Cloudinary: ${result.secure_url}`);
      return {
        url: result.secure_url,
        thumbnail: thumbnail,
      };
    } else {
      throw new Error("Upload failed: No URL returned from Cloudinary");
    }
  } catch (error: any) {
    console.error("Error uploading video to Cloudinary:", error);
    throw error;
  }
}

/**
 * Generate live stream credentials for Cloudinary
 * @param streamName - Name for the stream
 * @returns Promise<{streamUrl: string, streamKey: string}>
 */
export async function generateLiveStreamCredentials(
  streamName: string
): Promise<{ streamUrl: string; streamKey: string }> {
  try {
    if (!isCloudinaryConfigured()) {
      throw new Error("Cloudinary is not configured.");
    }

    // Create a live streaming profile
    const result = await cloudinary.api.create_streaming_profile(streamName, {
      display_name: streamName,
    });

    // Generate stream URL and key
    const streamUrl = `rtmp://live.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    const streamKey = `${streamName}`;

    return {
      streamUrl,
      streamKey,
    };
  } catch (error: any) {
    console.error("Error generating live stream credentials:", error);
    throw error;
  }
}

/**
 * Get Cloudinary configuration status (for debugging)
 */
export function getCloudinaryStatus() {
  return {
    configured: isCloudinaryConfigured(),
    hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!process.env.CLOUDINARY_API_KEY,
    hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
  };
}

