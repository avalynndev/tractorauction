import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Background job to check for watchlist alerts
 * This should be called periodically (e.g., via cron job or scheduled task)
 * 
 * Checks for:
 * 1. Price drops on watchlist items
 * 2. Auction starts for watchlist items
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.CRON_API_KEY && process.env.CRON_API_KEY) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const notificationsCreated = {
      priceDrops: 0,
      auctionStarts: 0,
    };

    // Get all watchlist items with their vehicles
    const watchlistItems = await prisma.watchlistItem.findMany({
      include: {
        user: {
          include: {
            notificationPreferences: true,
          },
        },
        vehicle: {
          include: {
            auction: {
              select: {
                id: true,
                status: true,
                startTime: true,
                currentBid: true,
              },
            },
          },
        },
      },
    });

    for (const item of watchlistItems) {
      const vehicle = item.vehicle;
      const user = item.user;
      const preferences = user.notificationPreferences;

      // Check if user has watchlist alerts enabled
      if (preferences && (!preferences.watchlistPriceDrop && !preferences.watchlistAuctionStart)) {
        continue;
      }

      // 1. Check for price drops
      if (preferences?.watchlistPriceDrop) {
        const currentPrice = vehicle.saleAmount || vehicle.basePrice || 0;
        const lastKnownPrice = item.lastKnownPrice;
        const lastNotifiedPrice = item.lastNotifiedPrice;

        // If we have a last known price and current price is lower
        if (lastKnownPrice && currentPrice < lastKnownPrice) {
          // Only notify if we haven't already notified for this price drop
          if (!lastNotifiedPrice || lastNotifiedPrice > currentPrice) {
            const priceDrop = lastKnownPrice - currentPrice;
            const priceDropPercent = ((priceDrop / lastKnownPrice) * 100).toFixed(1);

            // Create notification
            await prisma.notification.create({
              data: {
                userId: item.userId,
                type: "WATCHLIST_PRICE_DROP",
                title: "Price Drop Alert",
                message: `${vehicle.tractorBrand} ${vehicle.tractorModel || ""} price dropped by ₹${priceDrop.toLocaleString("en-IN")} (${priceDropPercent}%)`,
                vehicleId: vehicle.id,
                isRead: false,
              },
            });

            // Update last notified price
            await prisma.watchlistItem.update({
              where: { id: item.id },
              data: { lastNotifiedPrice: currentPrice },
            });

            notificationsCreated.priceDrops++;
          }
        }

        // Update last known price
        if (currentPrice > 0 && currentPrice !== lastKnownPrice) {
          await prisma.watchlistItem.update({
            where: { id: item.id },
            data: { lastKnownPrice: currentPrice },
          });
        }
      }

      // 2. Check for auction starts
      if (preferences?.watchlistAuctionStart && vehicle.auction) {
        const auction = vehicle.auction;
        const now = new Date();
        const startTime = new Date(auction.startTime);

        // Check if auction just started (within last 5 minutes)
        const timeSinceStart = now.getTime() - startTime.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (
          auction.status === "LIVE" &&
          timeSinceStart >= 0 &&
          timeSinceStart <= fiveMinutes
        ) {
          // Check if we already notified for this auction
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: item.userId,
              type: "WATCHLIST_AUCTION_START",
              vehicleId: vehicle.id,
              auctionId: auction.id,
            },
          });

          if (!existingNotification) {
            // Create notification
            await prisma.notification.create({
              data: {
                userId: item.userId,
                type: "WATCHLIST_AUCTION_START",
                title: "Auction Started",
                message: `Auction for ${vehicle.tractorBrand} ${vehicle.tractorModel || ""} has started! Current bid: ₹${auction.currentBid.toLocaleString("en-IN")}`,
                vehicleId: vehicle.id,
                auctionId: auction.id,
                isRead: false,
              },
            });

            notificationsCreated.auctionStarts++;
          }
        }
      }
    }

    return NextResponse.json({
      message: "Watchlist alerts checked",
      notificationsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Check watchlist alerts error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}


