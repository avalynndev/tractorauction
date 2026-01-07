import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// GET - Get delivery details for a purchase
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> | { purchaseId: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.purchaseId;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Get purchase to verify ownership
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        buyer: true,
        vehicle: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    }

    // Verify user is buyer, seller, or admin
    const isBuyer = purchase.buyerId === decoded.userId;
    const isSeller = purchase.vehicle.sellerId === decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Get delivery details
    const delivery = await prisma.delivery.findUnique({
      where: { purchaseId },
      include: {
        purchase: {
          include: {
            vehicle: true,
            buyer: true,
          },
        },
      },
    });

    return NextResponse.json(delivery || null);
  } catch (error) {
    console.error("Error fetching delivery:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create or update delivery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> | { purchaseId: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.purchaseId;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const body = await request.json();

    // Get purchase to verify ownership
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vehicle: {
          include: {
            seller: true,
          },
        },
      },
    });

    if (!purchase) {
      return NextResponse.json({ message: "Purchase not found" }, { status: 404 });
    }

    // Verify user is seller or admin (only seller/admin can create/update delivery)
    const isSeller = purchase.vehicle.sellerId === decoded.userId;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });
    const isAdmin = user?.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Check if delivery already exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { purchaseId },
    });

    // Prepare delivery data
    const deliveryData: any = {
      purchaseId,
      status: body.status || "PENDING",
      method: body.method || "PICKUP",
      pickupAddress: body.pickupAddress,
      pickupCity: body.pickupCity,
      pickupState: body.pickupState,
      pickupPincode: body.pickupPincode,
      pickupContactName: body.pickupContactName,
      pickupContactPhone: body.pickupContactPhone,
      deliveryAddress: body.deliveryAddress,
      deliveryCity: body.deliveryCity,
      deliveryState: body.deliveryState,
      deliveryPincode: body.deliveryPincode,
      deliveryContactName: body.deliveryContactName,
      deliveryContactPhone: body.deliveryContactPhone,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      estimatedDeliveryDate: body.estimatedDeliveryDate ? new Date(body.estimatedDeliveryDate) : null,
      transporterName: body.transporterName,
      transporterPhone: body.transporterPhone,
      trackingNumber: body.trackingNumber,
      vehicleNumber: body.vehicleNumber,
      driverName: body.driverName,
      driverPhone: body.driverPhone,
      notes: body.notes,
      deliveryNotes: body.deliveryNotes,
    };

    // Update status timestamps based on status
    if (body.status === "SCHEDULED" && !existingDelivery?.scheduledDate) {
      deliveryData.scheduledDate = new Date();
    }
    if (body.status === "IN_TRANSIT" && !existingDelivery?.inTransitAt) {
      deliveryData.inTransitAt = new Date();
    }
    if (body.status === "OUT_FOR_DELIVERY" && !existingDelivery?.outForDeliveryAt) {
      deliveryData.outForDeliveryAt = new Date();
    }
    if (body.status === "DELIVERED" && !existingDelivery?.deliveredAt) {
      deliveryData.deliveredAt = new Date();
      deliveryData.actualDeliveryDate = new Date();
    }
    if (body.status === "FAILED") {
      deliveryData.failureReason = body.failureReason;
    }
    if (body.status === "RETURNED") {
      deliveryData.returnReason = body.returnReason;
    }

    // Use seller's address as default pickup address if not provided
    if (!deliveryData.pickupAddress && purchase.vehicle.seller) {
      deliveryData.pickupAddress = purchase.vehicle.seller.address;
      deliveryData.pickupCity = purchase.vehicle.seller.city;
      deliveryData.pickupState = purchase.vehicle.seller.state;
      deliveryData.pickupPincode = purchase.vehicle.seller.pincode;
      deliveryData.pickupContactName = purchase.vehicle.seller.fullName;
      deliveryData.pickupContactPhone = purchase.vehicle.seller.phoneNumber;
    }

    // Use buyer's address as default delivery address if not provided
    const buyer = await prisma.user.findUnique({
      where: { id: purchase.buyerId },
    });
    if (!deliveryData.deliveryAddress && buyer) {
      deliveryData.deliveryAddress = buyer.address;
      deliveryData.deliveryCity = buyer.city;
      deliveryData.deliveryState = buyer.state;
      deliveryData.deliveryPincode = buyer.pincode;
      deliveryData.deliveryContactName = buyer.fullName;
      deliveryData.deliveryContactPhone = buyer.phoneNumber;
    }

    let delivery;
    if (existingDelivery) {
      // Update existing delivery
      delivery = await prisma.delivery.update({
        where: { purchaseId },
        data: deliveryData,
        include: {
          purchase: {
            include: {
              vehicle: true,
              buyer: true,
            },
          },
        },
      });
    } else {
      // Create new delivery
      delivery = await prisma.delivery.create({
        data: deliveryData,
        include: {
          purchase: {
            include: {
              vehicle: true,
              buyer: true,
            },
          },
        },
      });
    }

    return NextResponse.json(delivery);
  } catch (error) {
    console.error("Error creating/updating delivery:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




