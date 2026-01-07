/**
 * Cron Job Endpoint for Auction Status Automation
 * 
 * This is a dedicated cron endpoint that can be called by:
 * - Vercel Cron Jobs
 * - External cron services (cron-job.org, EasyCron, etc.)
 * - Scheduled tasks
 * 
 * Recommended frequency: Every 1 minute
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyAuctionStarted, notifyAuctionEnded } from "@/lib/email-notifications";

export async function GET(request: NextRequest) {
  return handleAuctionStatusUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleAuctionStatusUpdate(request);
}

async function handleAuctionStatusUpdate(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.warn("[Cron] Unauthorized access attempt to auction status automation");
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
    } else {
      // In development, allow without secret but log warning
      if (process.env.NODE_ENV === "production") {
        console.warn("[Cron] WARNING: CRON_SECRET not set in production!");
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

    console.log(`[Cron] Found ${auctionsToStart.length} auctions to start`);

    for (const auction of auctionsToStart) {
      try {
        await prisma.auction.update({
          where: { id: auction.id },
          data: { status: "LIVE" },
        });

        results.started.push(auction.id);
        console.log(`[Cron] ✅ Started auction ${auction.id} - ${auction.vehicle.tractorBrand}`);

        // Send email notification (async, don't wait)
        notifyAuctionStarted(auction.id).catch((error) => {
          console.error(`[Cron] Error sending email for auction ${auction.id}:`, error);
        });
      } catch (error: any) {
        const errorMsg = `Failed to start auction ${auction.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] ❌ ${errorMsg}`, error);
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

    console.log(`[Cron] Found ${auctionsToEnd.length} auctions to end`);

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
        const winnerInfo = winnerId 
          ? ` - Winner: ${auction.bids[0].bidder.fullName} (₹${highestBid.toLocaleString("en-IN")})`
          : " - No bids";
        console.log(`[Cron] ✅ Ended auction ${auction.id} - ${auction.vehicle.tractorBrand}${winnerInfo}`);

        // Send email notification (async, don't wait)
        notifyAuctionEnded(auction.id).catch((error) => {
          console.error(`[Cron] Error sending email for ended auction ${auction.id}:`, error);
        });
      } catch (error: any) {
        const errorMsg = `Failed to end auction ${auction.id}: ${error.message}`;
        results.errors.push(errorMsg);
        console.error(`[Cron] ❌ ${errorMsg}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Auction status automation completed",
      timestamp: now.toISOString(),
      summary: {
        started: results.started.length,
        ended: results.ended.length,
        errors: results.errors.length,
      },
      details: {
        startedAuctionIds: results.started,
        endedAuctionIds: results.ended,
        errors: results.errors.length > 0 ? results.errors : undefined,
      },
    });
  } catch (error: any) {
    console.error("[Cron] Fatal error in auction status automation:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}


























