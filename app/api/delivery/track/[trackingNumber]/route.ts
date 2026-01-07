import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Track delivery by tracking number (public endpoint, no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> | { trackingNumber: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const trackingNumber = resolvedParams.trackingNumber;

    if (!trackingNumber) {
      return NextResponse.json({ message: "Tracking number is required" }, { status: 400 });
    }

    const delivery = await prisma.delivery.findFirst({
      where: { trackingNumber },
      include: {
        purchase: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
            buyer: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json({ message: "Delivery not found" }, { status: 404 });
    }

    // Return limited information for public tracking
    return NextResponse.json({
      id: delivery.id,
      status: delivery.status,
      method: delivery.method,
      scheduledDate: delivery.scheduledDate,
      estimatedDeliveryDate: delivery.estimatedDeliveryDate,
      actualDeliveryDate: delivery.actualDeliveryDate,
      dispatchedAt: delivery.dispatchedAt,
      inTransitAt: delivery.inTransitAt,
      outForDeliveryAt: delivery.outForDeliveryAt,
      deliveredAt: delivery.deliveredAt,
      trackingNumber: delivery.trackingNumber,
      transporterName: delivery.transporterName,
      transporterPhone: delivery.transporterPhone,
      vehicleNumber: delivery.vehicleNumber,
      driverName: delivery.driverName,
      driverPhone: delivery.driverPhone,
      deliveryNotes: delivery.deliveryNotes,
      vehicle: delivery.purchase.vehicle,
      // Don't expose full addresses or buyer details in public tracking
    });
  } catch (error) {
    console.error("Error tracking delivery:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




