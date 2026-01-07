import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import { hasActiveMembership } from "@/lib/membership";

/**
 * Create payment order for vehicle purchase
 * This is called before initiating Razorpay checkout
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
    const { vehicleId, purchaseId } = body;

    if (!vehicleId && !purchaseId) {
      return NextResponse.json(
        { message: "Vehicle ID or Purchase ID is required" },
        { status: 400 }
      );
    }

    let purchase;
    let vehicle;

    // If purchaseId is provided, fetch existing purchase
    if (purchaseId) {
      purchase = await prisma.purchase.findUnique({
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

      // Verify purchase belongs to user
      if (purchase.buyerId !== decoded.userId) {
        return NextResponse.json(
          { message: "Unauthorized to pay for this purchase" },
          { status: 403 }
        );
      }

      vehicle = purchase.vehicle;
    } else {
      // If vehicleId is provided, fetch vehicle and check/create purchase
      vehicle = await prisma.vehicle.findUnique({
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
              buyerId: decoded.userId,
              status: {
                in: ["payment_pending", "pending", "confirmed", "completed"],
              },
            },
            orderBy: { createdAt: "desc" },
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

      // Check if vehicle is approved
      if (vehicle.status !== "APPROVED") {
        return NextResponse.json(
          { message: "This vehicle is not available for purchase" },
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

      // Check if there's already a purchase by this user (payment_pending or pending)
      if (vehicle.purchases && vehicle.purchases.length > 0) {
        const existingPurchase = vehicle.purchases[0];
        // If purchase exists and is payment_pending, use it
        if (existingPurchase.status === "payment_pending") {
          purchase = await prisma.purchase.findUnique({
            where: { id: existingPurchase.id },
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
        } else {
          return NextResponse.json(
            { message: "You already have a purchase for this vehicle" },
            { status: 400 }
          );
        }
      }

      // Check if there's a purchase by another buyer
      const otherBuyerPurchase = await prisma.purchase.findFirst({
        where: {
          vehicleId: vehicle.id,
          buyerId: { not: decoded.userId },
          status: {
            in: ["payment_pending", "pending", "confirmed", "completed"],
          },
        },
      });

      if (otherBuyerPurchase) {
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

      // Create purchase record only if it doesn't exist
      if (!purchase) {
        purchase = await prisma.purchase.create({
          data: {
            vehicleId: vehicle.id,
            buyerId: decoded.userId,
            purchasePrice: vehicle.saleAmount,
            purchaseType: "PREAPPROVED",
            status: "payment_pending", // New status for payment pending
          },
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
      }
    }

    // Calculate total amount (purchase price + escrow fee)
    const purchasePrice = purchase.purchasePrice;
    const escrowFeePercentage = 0.02; // 2%
    const escrowFee = Math.min(
      Math.max(purchasePrice * escrowFeePercentage, 500),
      5000
    );
    const totalAmount = purchasePrice + escrowFee;

    // Check if Razorpay is configured
    const isRazorpayConfigured = 
      process.env.RAZORPAY_KEY_ID && 
      process.env.RAZORPAY_KEY_SECRET;

    // Allow test mode if explicitly enabled or if Razorpay is not configured
    const isTestMode = 
      process.env.TEST_MODE === "true" || 
      !isRazorpayConfigured;

    if (isTestMode && !isRazorpayConfigured) {
      // In test mode, directly create escrow and complete purchase
      const escrow = await prisma.escrow.create({
        data: {
          purchaseId: purchase.id,
          amount: purchasePrice,
          escrowFee,
          status: "HELD",
          paymentMethod: "TEST_MODE",
        },
      });

      // Update purchase status
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: "pending" }, // Change to pending (awaiting seller approval)
      });

      // Update vehicle status to SOLD
      await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { status: "SOLD" },
      });

      return NextResponse.json({
        message: "Purchase completed successfully (Test Mode)",
        purchase: {
          id: purchase.id,
          status: "pending",
        },
        escrow: {
          id: escrow.id,
          amount: escrow.amount,
          escrowFee: escrow.escrowFee,
        },
        testMode: true,
      });
    }

    // Create Razorpay order
    try {
      // Double-check Razorpay configuration
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        // If not configured, fall back to test mode
        const escrow = await prisma.escrow.create({
          data: {
            purchaseId: purchase.id,
            amount: purchasePrice,
            escrowFee,
            status: "HELD",
            paymentMethod: "TEST_MODE",
          },
        });

        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { status: "pending" },
        });

        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { status: "SOLD" },
        });

        return NextResponse.json({
          message: "Purchase completed successfully (Test Mode - Razorpay not configured)",
          purchase: {
            id: purchase.id,
            status: "pending",
          },
          escrow: {
            id: escrow.id,
            amount: escrow.amount,
            escrowFee: escrow.escrowFee,
          },
          testMode: true,
        });
      }

      // Razorpay receipt must be max 40 characters
      // Format: PUR-{shortPurchaseId}-{timestamp}
      const shortPurchaseId = purchase.id.substring(0, 8);
      const shortTimestamp = Date.now().toString().slice(-6);
      const receipt = `PUR-${shortPurchaseId}-${shortTimestamp}`; // Max 20 chars
      
      const notes = {
        purchaseId: purchase.id,
        vehicleId: vehicle.id,
        buyerId: purchase.buyerId,
        sellerId: vehicle.sellerId,
        purchasePrice: purchasePrice.toString(),
        escrowFee: escrowFee.toString(),
      };

      const razorpayOrder = await createRazorpayOrder(
        totalAmount,
        "INR",
        receipt,
        notes
      );

      return NextResponse.json({
        message: "Payment order created successfully",
        orderId: razorpayOrder.id,
        amount: totalAmount,
        purchasePrice: purchasePrice,
        escrowFee: escrowFee,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
        purchaseId: purchase.id,
        vehicleId: vehicle.id,
        callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/purchases/payment-callback`,
        name: purchase.buyer.fullName,
        contact: purchase.buyer.phoneNumber,
        email: purchase.buyer.email || "",
      });
    } catch (error: any) {
      console.error("Razorpay order creation error:", error);
      
      // Provide user-friendly error message
      let errorMessage = "Failed to create payment order";
      if (error.message) {
        if (error.message.includes("not configured")) {
          errorMessage = "Payment gateway is not configured. Please contact support or use test mode.";
        } else {
          errorMessage = error.message;
        }
      }
      
      return NextResponse.json(
        { 
          message: errorMessage,
          error: error.message || "Unknown error",
          fallbackToTestMode: !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Purchase payment error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

