import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { notifyBuyerPurchaseConfirmed, notifySellerVehicleSold } from "@/lib/email-notifications";

// Seller or Admin: Approve a purchase (for pre-approved vehicles)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const purchaseId = resolvedParams.id;

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

    // Get purchase with vehicle and seller details
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
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

    if (!purchase) {
      return NextResponse.json(
        { message: "Purchase not found" },
        { status: 404 }
      );
    }

    // Verify user is the seller or admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });
    const isSeller = purchase.vehicle.sellerId === decoded.userId;
    const isAdmin = user?.role === "ADMIN";

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { message: "Only the seller or admin can approve purchases" },
        { status: 403 }
      );
    }

    // Check if purchase is already completed
    if (purchase.status === "completed") {
      return NextResponse.json(
        { message: "Purchase is already completed" },
        { status: 400 }
      );
    }

    // Update purchase status to completed
    const updatedPurchase = await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "completed",
      },
      include: {
        vehicle: true,
        buyer: true,
      },
    });

    // Ensure vehicle status is SOLD
    if (purchase.vehicle.status !== "SOLD") {
      await prisma.vehicle.update({
        where: { id: purchase.vehicle.id },
        data: {
          status: "SOLD",
        },
      });
    }

    // Send email notifications (async, don't wait)
    try {
      // Notify buyer
      if (purchase.buyer.email) {
        notifyBuyerPurchaseConfirmed(
          purchase.buyer.id,
          purchase.id,
          purchase.vehicle,
          purchase.purchasePrice
        ).catch((err) => console.error("Error sending buyer purchase email:", err));
      }

      // Notify seller
      if (purchase.vehicle.seller.email) {
        notifySellerVehicleSold(
          purchase.vehicle.seller.id,
          purchase.vehicle.id,
          purchase.vehicle,
          purchase.purchasePrice,
          purchase.buyer
        ).catch((err) => console.error("Error sending seller sold email:", err));
      }
    } catch (emailError) {
      console.error("Error sending email notifications:", emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({
      message: "Purchase approved successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error("Error approving purchase:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




