import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { refundRazorpayPayment } from "@/lib/razorpay";

// Admin route to mark auction as failed (reserve not met or other reasons)
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;
    const body = await request.json();
    const { reason } = body;

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            status: true,
          },
        },
        bids: {
          select: {
            id: true,
            bidderId: true,
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

    // Update auction status to ENDED (failed)
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        status: "ENDED",
        // Don't set winnerId - auction failed
      },
    });

    // Update vehicle status back to APPROVED (can be re-auctioned)
    await prisma.vehicle.update({
      where: { id: auction.vehicleId },
      data: {
        status: "APPROVED", // Can be re-auctioned
      },
    });

    // Refund all EMDs for this failed auction
    try {
      const emdsToRefund = await prisma.earnestMoneyDeposit.findMany({
        where: {
          auctionId: auctionId,
          status: "PAID",
        },
      });

      const isRazorpayConfigured =
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET;
      const isTestMode =
        process.env.TEST_MODE === "true" ||
        !isRazorpayConfigured;

      // Process refunds
      await Promise.allSettled(
        emdsToRefund.map(async (emd) => {
          if (emd.paymentId && !isTestMode) {
            try {
              await refundRazorpayPayment(emd.paymentId, emd.amount, {
                emdId: emd.id,
                auctionId: auctionId,
                bidderId: emd.bidderId,
                reason: "Auction failed - refund",
              });
            } catch (error) {
              console.error(`Failed to refund EMD ${emd.id} via Razorpay:`, error);
            }
          }

          // Update EMD status
          await prisma.earnestMoneyDeposit.update({
            where: { id: emd.id },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
            },
          });
        })
      );
    } catch (error) {
      console.error("Error refunding EMDs for failed auction:", error);
      // Don't fail the entire operation if refund fails
    }

    // TODO: Send email notifications
    // - Notify all bidders that auction failed
    // - Notify seller

    return NextResponse.json({
      message: "Auction marked as failed",
      reason: reason || "Reserve price not met",
    });
  } catch (error) {
    console.error("Error marking auction as failed:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

