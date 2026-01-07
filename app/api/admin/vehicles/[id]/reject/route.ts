import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { notifySellerVehicleRejected } from "@/lib/email-notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const vehicleId = resolvedParams.id;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

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
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Get request body for rejection reason
    let rejectionReason: string | undefined;
    try {
      const body = await request.json();
      rejectionReason = body.rejectionReason;
    } catch (error) {
      console.error("Error parsing request body:", error);
      // No body provided, that's okay - rejection reason is optional
    }

    // Get vehicle with auction
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        auction: true,
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Update vehicle status
    let updatedVehicle;
    try {
      updatedVehicle = await prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
          status: "REJECTED",
        },
      });
    } catch (error: any) {
      console.error("Error updating vehicle status:", error);
      throw error;
    }

    // If vehicle has an auction, store rejection reason in auction
    if (vehicle.auction && rejectionReason) {
      try {
        await prisma.auction.update({
          where: { id: vehicle.auction.id },
          data: {
            rejectionReason: rejectionReason,
          },
        });
      } catch (error: any) {
        console.error("Error updating auction rejection reason:", error);
        // Don't fail the entire operation if auction update fails
      }
    }

    // Send email notification to seller
    try {
      await notifySellerVehicleRejected(vehicle.sellerId, vehicleId, rejectionReason);
    } catch (error) {
      console.error("Error sending vehicle rejection email:", error);
      // Don't fail the entire operation if email fails
    }

    return NextResponse.json({
      message: "Vehicle rejected successfully",
      vehicle: updatedVehicle,
    });
  } catch (error: any) {
    console.error("Error rejecting vehicle:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Return more specific error message
    let errorMessage = "Internal server error";
    if (error?.code === "P2025") {
      errorMessage = "Vehicle not found";
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { message: errorMessage, error: error?.code || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}



