import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  remindSellerPendingApproval,
  warnSellerApprovalDeadline,
  getApprovalDeadlineRemaining,
  isApprovalDeadlinePassed,
} from "@/lib/notifications";

/**
 * Send reminder notifications for pending approvals
 * This endpoint should be called by a cron job or scheduled task
 * Admin can also manually trigger it
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    // Optional: Require admin auth for manual triggers
    // For cron jobs, you might want to use an API key instead
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { role: true },
        });
        
        if (!user || user.role !== "ADMIN") {
          return NextResponse.json(
            { message: "Access denied. Admin only." },
            { status: 403 }
          );
        }
      }
    }

    // Find all ended auctions with pending seller approval
    const pendingAuctions = await prisma.auction.findMany({
      where: {
        status: "ENDED",
        sellerApprovalStatus: "PENDING",
        winnerId: { not: null },
      },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
                whatsappNumber: true,
              },
            },
          },
        },
        winner: {
          select: {
            fullName: true,
          },
        },
      },
    });

    const results = {
      total: pendingAuctions.length,
      remindersSent: 0,
      warningsSent: 0,
      errors: [] as string[],
    };

    for (const auction of pendingAuctions) {
      try {
        const deadlineRemaining = getApprovalDeadlineRemaining(auction.endTime);
        const isOverdue = isApprovalDeadlinePassed(auction.endTime);

        // Skip if deadline passed (could send final warning, but for now we skip)
        if (isOverdue) {
          continue;
        }

        // Send 24-hour warning if less than 24 hours remaining
        if (deadlineRemaining.days === 0 && deadlineRemaining.hours <= 24) {
          const sent = await warnSellerApprovalDeadline(
            auction.vehicle.seller.phoneNumber,
            auction.vehicle.seller.fullName,
            auction.vehicle.tractorBrand,
            auction.vehicle.tractorModel,
            auction.currentBid
          );
          if (sent) {
            results.warningsSent++;
          }
        } 
        // Send regular reminder if more than 1 day but less than 3 days remaining
        else if (deadlineRemaining.days > 0 && deadlineRemaining.days <= 3) {
          const sent = await remindSellerPendingApproval(
            auction.vehicle.seller.phoneNumber,
            auction.vehicle.seller.fullName,
            auction.vehicle.tractorBrand,
            auction.vehicle.tractorModel,
            auction.currentBid,
            deadlineRemaining.days
          );
          if (sent) {
            results.remindersSent++;
          }
        }
      } catch (error: any) {
        results.errors.push(`Auction ${auction.id}: ${error.message}`);
        console.error(`Error sending reminder for auction ${auction.id}:`, error);
      }
    }

    return NextResponse.json({
      message: "Reminder notifications processed",
      results,
    });
  } catch (error: any) {
    console.error("Error processing reminders:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check pending approvals (for admin dashboard)
 */
export async function GET(request: NextRequest) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Get pending approvals with deadline info
    const pendingAuctions = await prisma.auction.findMany({
      where: {
        status: "ENDED",
        sellerApprovalStatus: "PENDING",
        winnerId: { not: null },
      },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
              },
            },
          },
        },
        winner: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        endTime: "asc", // Oldest first
      },
    });

    const auctionsWithDeadline = pendingAuctions.map((auction) => {
      const deadlineRemaining = getApprovalDeadlineRemaining(auction.endTime);
      const isOverdue = isApprovalDeadlinePassed(auction.endTime);
      const deadlineDate = new Date(auction.endTime);
      deadlineDate.setDate(deadlineDate.getDate() + 7); // 7 days default

      return {
        ...auction,
        deadlineDate: deadlineDate.toISOString(),
        deadlineRemaining,
        isOverdue,
      };
    });

    return NextResponse.json({
      pendingCount: auctionsWithDeadline.length,
      overdueCount: auctionsWithDeadline.filter((a) => a.isOverdue).length,
      auctions: auctionsWithDeadline,
    });
  } catch (error: any) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




























