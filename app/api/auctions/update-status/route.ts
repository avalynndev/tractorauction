import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAuctionStarted, notifyAuctionEnded } from "@/lib/email-notifications";

/**
 * Auction Status Automation
 * 
 * This API should be called periodically (via cron job or scheduled task)
 * to automatically:
 * 1. Start auctions (SCHEDULED -> LIVE) when startTime is reached
 * 2. End auctions (LIVE -> ENDED) when endTime is reached
 * 3. Determine winners when auctions end
 * 4. Send email notifications
 * 
 * Security: Should be protected with a secret token or only accessible via cron service
 * Recommended: Call this endpoint every minute via Vercel Cron or external cron service
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret token for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const now = new Date();
    const results = {
      started: [] as string[],
      ended: [] as string[],
      errors: [] as string[],
    };

    // ============================================
    // 1. Start auctions that should be LIVE
    // ============================================
    const auctionsToStart = await prisma.auction.findMany({
      where: {
        status: "SCHEDULED",
        startTime: { lte: now },
        endTime: { gt: now }, // Only start if endTime hasn't passed
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
          },
        },
      },
    });

    console.log(`[Auction Automation] Found ${auctionsToStart.length} auctions to start`);

    for (const auction of auctionsToStart) {
      try {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: "LIVE" },
        });

        results.started.push(auction.id);
        console.log(`[Auction Automation] Started auction ${auction.id}`);

        // Send email notification (async, don't wait)
        notifyAuctionStarted(auction.id).catch((error) => {
          console.error(`[Auction Automation] Error sending email for auction ${auction.id}:`, error);
        });
      } catch (error: any) {
        const errorMsg = `Failed to start auction ${auction.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Auction Automation] ${errorMsg}`, error);
      }
    }

    // ============================================
    // 2. End auctions that have passed endTime
    // ============================================
    const auctionsToEnd = await prisma.auction.findMany({
      where: {
        status: "LIVE",
        endTime: { lte: now },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            referenceNumber: true,
          },
        },
        bids: {
          orderBy: {
            bidAmount: "desc", // Get highest bid first
          },
          take: 1, // Only get the highest bid
          include: {
            bidder: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Auction Automation] Found ${auctionsToEnd.length} auctions to end`);

    for (const auction of auctionsToEnd) {
      try {
        // Determine winner (highest bidder)
        const winnerId = auction.bids.length > 0 ? auction.bids[0].bidderId : null;
        const highestBid = auction.bids.length > 0 ? auction.bids[0].bidAmount : auction.currentBid;

        // Update auction status and winner
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            status: "ENDED",
            winnerId: winnerId,
            currentBid: highestBid, // Ensure currentBid is set to highest bid
          },
        });

        // Update all bids to mark the winning bid
        if (winnerId && auction.bids.length > 0) {
          // Mark the winning bid
          await prisma.bid.updateMany({
            where: {
              auctionId: auction.id,
              bidderId: winnerId,
              bidAmount: highestBid,
            },
            data: {
              isWinningBid: true,
            },
          });

          // Unmark all other bids
          await prisma.bid.updateMany({
            where: {
              auctionId: auction.id,
              bidderId: { not: winnerId },
            },
            data: {
              isWinningBid: false,
            },
          });
        }

        results.ended.push(auction.id);
        console.log(`[Auction Automation] Ended auction ${auction.id}${winnerId ? ` with winner ${winnerId}` : " (no bids)"}`);

        // Send email notification (async, don't wait)
        notifyAuctionEnded(auction.id).catch((error) => {
          console.error(`[Auction Automation] Error sending email for ended auction ${auction.id}:`, error);
        });
      } catch (error: any) {
        const errorMsg = `Failed to end auction ${auction.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Auction Automation] ${errorMsg}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Auction statuses updated",
      timestamp: now.toISOString(),
      results: {
        started: results.started.length,
        ended: results.ended.length,
        errors: results.errors.length,
      },
      details: {
        startedAuctionIds: results.started,
        endedAuctionIds: results.ended,
        errors: results.errors,
      },
    });
  } catch (error: any) {
    console.error("[Auction Automation] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
}



