import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { refundRazorpayPayment } from "@/lib/razorpay";

// Admin route to refund EMD to non-winners
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
    const { bidderId, refundAll } = body;

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        winnerId: true,
        status: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    if (refundAll) {
      // Refund all EMDs except winner's (if winner exists)
      const whereClause: any = {
        auctionId,
        status: "PAID",
      };

      if (auction.winnerId) {
        whereClause.bidderId = { not: auction.winnerId };
      }

      const emdsToRefund = await prisma.earnestMoneyDeposit.findMany({
        where: whereClause,
      });

      // Process refunds (Razorpay or status update)
      const isRazorpayConfigured =
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET;
      const isTestMode =
        process.env.TEST_MODE === "true" ||
        !isRazorpayConfigured;

      const refundResults = await Promise.allSettled(
        emdsToRefund.map(async (emd) => {
          // If EMD has a paymentId and Razorpay is configured, process actual refund
          if (emd.paymentId && !isTestMode) {
            try {
              await refundRazorpayPayment(emd.paymentId, emd.amount, {
                emdId: emd.id,
                auctionId: auctionId,
                bidderId: emd.bidderId,
                reason: "Auction ended - non-winner refund",
              });
            } catch (error) {
              console.error(`Failed to refund EMD ${emd.id} via Razorpay:`, error);
              // Continue with status update even if Razorpay refund fails
            }
          }

          // Update EMD status
          return await prisma.earnestMoneyDeposit.update({
            where: { id: emd.id },
            data: {
              status: "REFUNDED",
              refundedAt: new Date(),
            },
          });
        })
      );

      const successfulRefunds = refundResults.filter(
        (r) => r.status === "fulfilled"
      ).length;

      return NextResponse.json({
        message: `Refunded ${successfulRefunds} EMD(s)`,
        refundedCount: successfulRefunds,
        totalCount: emdsToRefund.length,
        emds: emdsToRefund.map(emd => ({
          id: emd.id,
          bidderId: emd.bidderId,
          amount: emd.amount,
        })),
      });
    } else if (bidderId) {
      // Refund specific bidder's EMD
      const emd = await prisma.earnestMoneyDeposit.findUnique({
        where: {
          auctionId_bidderId: {
            auctionId,
            bidderId,
          },
        },
      });

      if (!emd) {
        return NextResponse.json(
          { message: "EMD not found for this bidder" },
          { status: 404 }
        );
      }

      if (emd.status !== "PAID") {
        return NextResponse.json(
          { message: `EMD status is ${emd.status}, cannot refund` },
          { status: 400 }
        );
      }

      // Don't refund if bidder is the winner (EMD should be applied to balance)
      if (auction.winnerId === bidderId) {
        return NextResponse.json(
          { message: "Cannot refund winner's EMD. It should be applied to balance payment." },
          { status: 400 }
        );
      }

      // Process Razorpay refund if paymentId exists
      const isRazorpayConfigured =
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET;
      const isTestMode =
        process.env.TEST_MODE === "true" ||
        !isRazorpayConfigured;

      if (emd.paymentId && !isTestMode) {
        try {
          await refundRazorpayPayment(emd.paymentId, emd.amount, {
            emdId: emd.id,
            auctionId: auctionId,
            bidderId: bidderId,
            reason: "Auction ended - non-winner refund",
          });
        } catch (error) {
          console.error(`Failed to refund EMD ${emd.id} via Razorpay:`, error);
          // Continue with status update even if Razorpay refund fails
        }
      }

      const updatedEMD = await prisma.earnestMoneyDeposit.update({
        where: { id: emd.id },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "EMD refunded successfully",
        emd: updatedEMD,
      });
    } else {
      return NextResponse.json(
        { message: "Either bidderId or refundAll must be provided" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error refunding EMD:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

