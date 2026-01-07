import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { notifyBidderBidPlaced, notifyBidderOutbid, notifyAuctionExtended } from "@/lib/email-notifications";

// Get bids for an auction (filtered based on sealed bidding rules)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;

    // Get auction details to check bidding type
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      select: {
        id: true,
        biddingType: true,
        bidVisibility: true,
        status: true,
        endTime: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Check if user is authenticated
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
        // Check if user is admin
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true },
        });
        isAdmin = user?.role === "ADMIN";
      }
    }

    // Determine if auction is sealed and still live
    const isSealed = auction.biddingType === "SEALED";
    const isLive = auction.status === "LIVE" && new Date() < new Date(auction.endTime);
    const hasEnded = auction.status === "ENDED" || new Date() > new Date(auction.endTime);

    // For sealed bidding during live auction: return only user's own bids (unless admin)
    if (isSealed && isLive && !hasEnded && !isAdmin) {
      if (!userId) {
        // Not authenticated - return empty array
        return NextResponse.json([]);
      }

      // Return only user's own bids
      const userBids = await prisma.bid.findMany({
        where: {
          auctionId,
          bidderId: userId,
        },
        include: {
          bidder: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          bidTime: "desc",
        },
      });

      return NextResponse.json(userBids);
    } else {
      // Auction ended, open bidding, or admin - return all bids
      const allBids = await prisma.bid.findMany({
        where: { auctionId },
        include: {
          bidder: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          bidAmount: "desc", // Sort by amount for better display
        },
      });

      return NextResponse.json(allBids);
    }
  } catch (error) {
    console.error("Error fetching bids:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Place a bid
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
    const bidderId = decoded.userId;
    const auctionId = resolvedParams.id;
    const { bidAmount } = await request.json();

    if (!bidAmount || typeof bidAmount !== "number" || bidAmount <= 0) {
      return NextResponse.json(
        { message: "Invalid bid amount" },
        { status: 400 }
      );
    }

    // Get auction details
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            sellerId: true,
            status: true,
          },
        },
      },
    });
    
    // Check if auction is sealed
    const isSealed = auction.biddingType === "SEALED";
    
    // Check auto-extend settings
    const autoExtendEnabled = auction.autoExtendEnabled ?? true;
    const autoExtendMinutes = auction.autoExtendMinutes ?? 5;
    const autoExtendThreshold = auction.autoExtendThreshold ?? 2; // minutes before end
    const maxExtensions = auction.maxExtensions ?? 3;
    const currentExtensionCount = auction.extensionCount ?? 0;

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get user with role and memberships in one query
    const user = await prisma.user.findUnique({
      where: { id: bidderId },
      include: {
        memberships: {
          where: {
            status: "active",
            endDate: { gte: now },
          },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    // Check if bidder is eligible for bidding (admin can bypass)
    if (!isAdmin && !user.isEligibleForBid) {
      return NextResponse.json(
        { message: "You are not eligible to place bids. Please contact admin for more information." },
        { status: 403 }
      );
    }

    // Check if auction has ended
    if (now > auction.endTime) {
      return NextResponse.json(
        { message: "Auction has ended" },
        { status: 400 }
      );
    }

    // Check if auction has started (admin can bypass for testing)
    if (now < auction.startTime && !isAdmin) {
      return NextResponse.json(
        { message: "Auction has not started yet" },
        { status: 400 }
      );
    }

    // Check if auction is live based on time OR status
    // Allow bidding if:
    // 1. Status is LIVE, OR
    // 2. Current time is between startTime and endTime (auction is actually live), OR
    // 3. Admin and status is SCHEDULED (for testing)
    const isActuallyLive = now >= auction.startTime && now <= auction.endTime;
    const isLiveStatus = auction.status === "LIVE";
    const isScheduledForAdmin = isAdmin && auction.status === "SCHEDULED";

    if (!isLiveStatus && !isActuallyLive && !isScheduledForAdmin) {
      return NextResponse.json(
        { message: "Auction is not live" },
        { status: 400 }
      );
    }

    // Prevent seller from bidding on their own vehicle
    if (auction.vehicle.sellerId === bidderId) {
      return NextResponse.json(
        { message: "You cannot bid on your own vehicle" },
        { status: 400 }
      );
    }

    // Validate bid increment
    const minimumBid = auction.currentBid + auction.minimumIncrement;
    if (bidAmount < minimumBid) {
      return NextResponse.json(
        {
          message: `Bid must be at least ₹${minimumBid.toLocaleString("en-IN")} (current bid + minimum increment)`,
          minimumBid,
        },
        { status: 400 }
      );
    }

    // Allow ADMIN to bid even without active membership (for testing)
    if (!isAdmin) {
      // Check if user has active membership (trial or paid)
      if (user.memberships.length === 0) {
        return NextResponse.json(
          { message: "You need an active membership to place bids" },
          { status: 403 }
        );
      }

      // Check EMD requirement
      if (auction.emdRequired && auction.emdAmount) {
        const emd = await prisma.earnestMoneyDeposit.findUnique({
          where: {
            auctionId_bidderId: {
              auctionId,
              bidderId,
            },
          },
        });

        if (!emd || emd.status !== "PAID") {
          return NextResponse.json(
            {
              message: `Earnest Money Deposit (EMD) of ₹${auction.emdAmount.toLocaleString("en-IN")} is required to place bids. Please pay EMD first.`,
              emdRequired: true,
              emdAmount: auction.emdAmount,
            },
            { status: 403 }
          );
        }
      }
    }

    // Create bid and update auction in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mark previous winning bid as false
      await tx.bid.updateMany({
        where: {
          auctionId,
          isWinningBid: true,
        },
        data: {
          isWinningBid: false,
        },
      });

      // Create new bid
      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId,
          bidAmount,
          isWinningBid: true,
        },
        include: {
          bidder: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Check if auto-extend should be triggered
      const now = new Date();
      const timeUntilEnd = new Date(auction.endTime).getTime() - now.getTime();
      const minutesUntilEnd = timeUntilEnd / (1000 * 60);
      
      let newEndTime = auction.endTime;
      let extensionCount = currentExtensionCount;
      let auctionExtended = false;
      
      // Auto-extend if:
      // 1. Auto-extend is enabled
      // 2. Bid placed within threshold minutes of end time
      // 3. Extension count hasn't reached maximum
      if (
        autoExtendEnabled &&
        minutesUntilEnd <= autoExtendThreshold &&
        minutesUntilEnd > 0 &&
        extensionCount < maxExtensions
      ) {
        // Extend auction by autoExtendMinutes
        newEndTime = new Date(auction.endTime.getTime() + autoExtendMinutes * 60 * 1000);
        extensionCount = extensionCount + 1;
        auctionExtended = true;
      }

      // Update auction current bid and end time (if extended)
      const updateData: any = {
        currentBid: bidAmount,
      };
      
      if (auctionExtended) {
        updateData.endTime = newEndTime;
        updateData.extensionCount = extensionCount;
      }
      
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: updateData,
      });

      // Emit socket event if available
      if (typeof global !== "undefined" && global.io) {
        if (isSealed) {
          // For sealed bidding: only broadcast bid count, NOT bid details
          const bidCount = await tx.bid.count({ where: { auctionId } });
          global.io.to(`auction-${auctionId}`).emit("bid-update", {
            bidCount,
            endTime: updatedAuction.endTime,
            extended: auctionExtended,
            extensionCount: extensionCount,
            // Do NOT send bid amount or bidder info for sealed auctions
          });
        } else {
          // For open bidding: send full bid details
          global.io.to(`auction-${auctionId}`).emit("new-bid", {
            bid: newBid,
            currentBid: updatedAuction.currentBid,
            endTime: updatedAuction.endTime,
            extended: auctionExtended,
            extensionCount: extensionCount,
          });
        }
        
        // If auction was extended, notify all participants
        if (auctionExtended) {
          global.io.to(`auction-${auctionId}`).emit("auction-extended", {
            newEndTime: updatedAuction.endTime,
            extensionCount: extensionCount,
            extendedBy: autoExtendMinutes,
            message: `Auction extended by ${autoExtendMinutes} minutes!`,
          });
        }
      }

      // Send email notifications
      try {
        // Notify the new bidder
        await notifyBidderBidPlaced(bidderId, auctionId, bidAmount);

        // Notify previous highest bidder if different
        const previousWinningBid = await tx.bid.findFirst({
          where: {
            auctionId,
            isWinningBid: false,
            bidderId: { not: bidderId },
          },
          orderBy: { bidTime: "desc" },
        });

        if (previousWinningBid && previousWinningBid.bidderId !== bidderId) {
          await notifyBidderOutbid(previousWinningBid.bidderId, auctionId, bidAmount);
        }

        // Notify all participants if auction was extended
        if (auctionExtended) {
          await notifyAuctionExtended(auctionId, newEndTime, autoExtendMinutes);
        }
      } catch (error) {
        console.error("Error sending bid email notifications:", error);
        // Don't fail the bid if email fails
      }

      return newBid;
    });

    return NextResponse.json({
      message: "Bid placed successfully",
      bid: result,
    });
  } catch (error: any) {
    console.error("Error placing bid:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
