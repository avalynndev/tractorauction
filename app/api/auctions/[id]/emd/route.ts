import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";

// Get EMD status for current user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;
    const userId = decoded.userId;

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        emdAmount: true,
        emdRequired: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Check if EMD is required
    if (!auction.emdRequired || !auction.emdAmount) {
      return NextResponse.json({
        emdRequired: false,
        message: "EMD not required for this auction",
      });
    }

    // Get user's EMD status for this auction
    const emd = await prisma.earnestMoneyDeposit.findUnique({
      where: {
        auctionId_bidderId: {
          auctionId,
          bidderId: userId,
        },
      },
    });

    return NextResponse.json({
      emdRequired: true,
      emdAmount: auction.emdAmount,
      emdStatus: emd?.status || "NOT_PAID",
      emd: emd ? {
        id: emd.id,
        amount: emd.amount,
        status: emd.status,
        paidAt: emd.paidAt,
        appliedToBalance: emd.appliedToBalance,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching EMD status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Initiate EMD payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
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

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;
    const userId = decoded.userId;

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            tractorBrand: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Check if EMD is required
    if (!auction.emdRequired || !auction.emdAmount) {
      return NextResponse.json(
        { message: "EMD not required for this auction" },
        { status: 400 }
      );
    }

    // Check if EMD already paid
    const existingEMD = await prisma.earnestMoneyDeposit.findUnique({
      where: {
        auctionId_bidderId: {
          auctionId,
          bidderId: userId,
        },
      },
    });

    if (existingEMD && existingEMD.status === "PAID") {
      return NextResponse.json(
        { message: "EMD already paid", emdId: existingEMD.id },
        { status: 400 }
      );
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Create or update EMD record
    const emd = existingEMD
      ? await prisma.earnestMoneyDeposit.update({
          where: { id: existingEMD.id },
          data: {
            status: "PENDING",
            amount: auction.emdAmount,
          },
        })
      : await prisma.earnestMoneyDeposit.create({
          data: {
            auctionId,
            bidderId: userId,
            amount: auction.emdAmount,
            status: "PENDING",
          },
        });

    // Check if Razorpay is configured
    const isRazorpayConfigured = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;
    const isTestMode = process.env.TEST_MODE === "true" || !isRazorpayConfigured;

    if (isTestMode) {
      // In test mode, directly mark EMD as paid
      await prisma.earnestMoneyDeposit.update({
        where: { id: emd.id },
        data: {
          status: "PAID",
          paymentMethod: "Test Mode",
          paymentId: "test_emd_payment_id",
          paymentReference: "test_emd_ref",
          paidAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "EMD paid successfully (Test Mode)",
        emdId: emd.id,
        testMode: true,
      });
    }

    // Create Razorpay order
    const shortUserId = userId.substring(0, 8);
    const shortTimestamp = Date.now().toString().slice(-6);
    const receipt = `EMD-${shortUserId}-${shortTimestamp}`;

    const notes = {
      emdId: emd.id,
      auctionId: auction.id,
      bidderId: userId,
      type: "EMD",
    };

    const razorpayOrder = await createRazorpayOrder(
      auction.emdAmount,
      "INR",
      receipt,
      notes
    );

    return NextResponse.json({
      message: "EMD payment order created",
      orderId: razorpayOrder.id,
      amount: auction.emdAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      emdId: emd.id,
      name: user.fullName,
      contact: user.phoneNumber,
      email: user.email || "",
    });
  } catch (error: any) {
    console.error("Error initiating EMD payment:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



