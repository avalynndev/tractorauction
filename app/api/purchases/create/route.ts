import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hasActiveMembership } from "@/lib/membership";

/**
 * Create a purchase for a pre-approved vehicle
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

    // Check if user has active membership
    const hasMembership = await hasActiveMembership(decoded.userId);
    if (!hasMembership) {
      return NextResponse.json(
        { message: "You need an active membership to purchase vehicles. Please subscribe to a membership plan." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Fetch vehicle with seller details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
        purchases: {
          where: {
            status: {
              in: ["pending", "confirmed", "completed"],
            },
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Check if vehicle is pre-approved
    if (vehicle.saleType !== "PREAPPROVED") {
      return NextResponse.json(
        { message: "This vehicle is not available for direct purchase" },
        { status: 400 }
      );
    }

    // Check if vehicle is already sold
    if (vehicle.status === "SOLD") {
      return NextResponse.json(
        { message: "This vehicle has already been sold" },
        { status: 400 }
      );
    }

    // Check if vehicle is approved
    if (vehicle.status !== "APPROVED") {
      return NextResponse.json(
        { message: "This vehicle is not available for purchase" },
        { status: 400 }
      );
    }

    // Check if there's already a pending/confirmed purchase
    if (vehicle.purchases && vehicle.purchases.length > 0) {
      return NextResponse.json(
        { message: "This vehicle is already being purchased by another buyer" },
        { status: 400 }
      );
    }

    // Prevent seller from purchasing their own vehicle
    if (vehicle.sellerId === decoded.userId) {
      return NextResponse.json(
        { message: "You cannot purchase your own vehicle" },
        { status: 400 }
      );
    }

    // Create purchase record with payment_pending status
    // Vehicle will be marked as SOLD only after payment is completed
    // Note: This route is kept for backward compatibility
    // New purchases should use /api/purchases/payment which handles payment flow
    const purchase = await prisma.purchase.create({
      data: {
        vehicleId: vehicle.id,
        buyerId: decoded.userId,
        purchasePrice: vehicle.saleAmount,
        purchaseType: "PREAPPROVED",
        status: "payment_pending", // Payment required - use /api/purchases/payment to complete
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            referenceNumber: true,
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    // Note: Vehicle status will be updated to SOLD after payment is completed
    // This is handled in the payment-callback route
    // Email notifications are also sent from payment-callback

    return NextResponse.json({
      message: "Purchase created. Payment required to complete the transaction.",
      purchase: {
        id: purchase.id,
        purchasePrice: purchase.purchasePrice,
        status: purchase.status,
        createdAt: purchase.createdAt,
        vehicle: purchase.vehicle,
      },
      paymentRequired: true,
      paymentUrl: `/api/purchases/payment?purchaseId=${purchase.id}`,
    });
  } catch (error: any) {
    console.error("Create purchase error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}









