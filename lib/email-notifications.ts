/**
 * Email Notification Service
 * Sends email notifications for various platform events
 */

import { sendEmail } from "./email";
import { prisma } from "./prisma";
import { generateBrandedEmailHTML, generatePlainTextEmail } from "./email-template-helper";

// Email notification types
export type EmailNotificationType =
  | "vehicle_approved"
  | "vehicle_rejected"
  | "auction_scheduled"
  | "auction_started"
  | "auction_ending_soon"
  | "auction_ended"
  | "bid_placed"
  | "bid_outbid"
  | "bid_approved"
  | "bid_rejected"
  | "membership_expiring"
  | "membership_expired"
  | "welcome"
  | "account_activated";

/**
 * Check if user has email notifications enabled for a specific type
 */
async function isNotificationEnabled(
  userId: string,
  notificationType: EmailNotificationType
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        email: true,
        emailUnsubscribed: true,
        notificationPreferences: true,
      },
    });

    // If user doesn't have email, can't send notifications
    if (!user || !user.email) {
      return false;
    }

    // If user unsubscribed from all emails
    if (user.emailUnsubscribed) {
      return false;
    }

    // Check specific notification type preference
    if (user.notificationPreferences) {
      const pref = user.notificationPreferences;
      const typeMap: Record<EmailNotificationType, keyof typeof pref> = {
        vehicle_approved: "vehicleApproved",
        vehicle_rejected: "vehicleRejected",
        auction_scheduled: "auctionScheduled",
        auction_started: "auctionStarted",
        auction_ending_soon: "auctionScheduled", // Use auctionScheduled for now
        auction_ended: "auctionEnded",
        bid_placed: "bidPlaced",
        bid_outbid: "bidOutbid",
        bid_approved: "bidApproved",
        bid_rejected: "bidRejected",
        membership_expiring: "membershipExpiring",
        membership_expired: "membershipExpired",
        welcome: "vehicleApproved", // Default to enabled
        account_activated: "vehicleApproved", // Default to enabled
      };

      const prefKey = typeMap[notificationType];
      if (prefKey && pref[prefKey] === false) {
        return false;
      }
    }

    // Default: enabled
    return true;
  } catch (error) {
    console.error("Error checking notification preferences:", error);
    return false;
  }
}

/**
 * Send email notification (wrapper that checks preferences)
 */
async function sendEmailNotification(
  userId: string,
  notificationType: EmailNotificationType,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  try {
    // Check if notification is enabled for this user
    const enabled = await isNotificationEnabled(userId, notificationType);
    if (!enabled) {
      return false;
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || !user.email) {
      return false;
    }

    // Send email
    return await sendEmail(user.email, subject, html, text);
  } catch (error) {
    console.error("Error sending email notification:", error);
    return false;
  }
}

/**
 * Vehicle Approved - Notify seller
 */
export async function notifySellerVehicleApproved(
  sellerId: string,
  vehicleId: string
): Promise<boolean> {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        seller: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!vehicle || !vehicle.seller) {
      return false;
    }

    const vehicleInfo = `${vehicle.tractorBrand}${vehicle.tractorModel ? ` ${vehicle.tractorModel}` : ""} ${vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `✅ Vehicle Approved - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${vehicle.seller.fullName},</p>
      <p>Great news! Your vehicle listing has been approved.</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">Vehicle Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Year:</strong> ${vehicle.yearOfMfg}</p>
        <p><strong>Status:</strong> Approved</p>
      </div>

      <p>Your vehicle is now live on the platform and visible to buyers.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "✅ Vehicle Approved!",
      content,
      buttonText: "View Vehicle",
      buttonUrl: `${appUrl}/vehicles/${vehicleId}`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: sellerId,
      notificationType: "vehicle_approved",
    });

    const text = generatePlainTextEmail(
      "Vehicle Approved",
      `Dear ${vehicle.seller.fullName},\n\nGreat news! Your vehicle listing has been approved.\n\nVehicle: ${vehicleInfo}\nYear: ${vehicle.yearOfMfg}\nStatus: Approved\n\nYour vehicle is now live on the platform.\n\nView vehicle: ${appUrl}/vehicles/${vehicleId}`,
      "View Vehicle",
      `${appUrl}/vehicles/${vehicleId}`,
      true,
      sellerId,
      "vehicle_approved"
    );

    return await sendEmailNotification(sellerId, "vehicle_approved", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifySellerVehicleApproved:", error);
    return false;
  }
}

/**
 * Vehicle Rejected - Notify seller
 */
export async function notifySellerVehicleRejected(
  sellerId: string,
  vehicleId: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        seller: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!vehicle || !vehicle.seller) {
      return false;
    }

    const vehicleInfo = `${vehicle.tractorBrand}${vehicle.tractorModel ? ` ${vehicle.tractorModel}` : ""} ${vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `❌ Vehicle Listing Rejected - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${vehicle.seller.fullName},</p>
      <p>We regret to inform you that your vehicle listing has been rejected.</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0; color: #ef4444;">Vehicle Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Year:</strong> ${vehicle.yearOfMfg}</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
      </div>

      ${rejectionReason ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>` : "<p>Please review your listing and ensure all information is accurate and complete.</p>"}

      <p>You can submit a new listing or contact support for more information.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "❌ Vehicle Listing Rejected",
      content,
      buttonText: "Contact Support",
      buttonUrl: `${appUrl}/contact`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: sellerId,
      notificationType: "vehicle_rejected",
    });

    const text = generatePlainTextEmail(
      "Vehicle Listing Rejected",
      `Dear ${vehicle.seller.fullName},\n\nWe regret to inform you that your vehicle listing has been rejected.\n\nVehicle: ${vehicleInfo}\nYear: ${vehicle.yearOfMfg}${rejectionReason ? `\nReason: ${rejectionReason}` : ""}\n\nPlease review your listing and ensure all information is accurate.\n\nContact support: ${appUrl}/contact`,
      "Contact Support",
      `${appUrl}/contact`,
      true,
      sellerId,
      "vehicle_rejected"
    );

    return await sendEmailNotification(sellerId, "vehicle_rejected", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifySellerVehicleRejected:", error);
    return false;
  }
}

/**
 * Auction Scheduled - Notify seller
 */
export async function notifySellerAuctionScheduled(
  sellerId: string,
  auctionId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!auction || !auction.vehicle) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    const formattedStartTime = startTime.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });
    const formattedEndTime = endTime.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });
    
    const subject = `📅 Auction Scheduled - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${auction.vehicle.seller.fullName},</p>
      <p>Your vehicle auction has been scheduled!</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="margin-top: 0; color: #3b82f6;">Auction Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Start Time:</strong> ${formattedStartTime}</p>
        <p><strong>End Time:</strong> ${formattedEndTime}</p>
        <p><strong>Reserve Price:</strong> ₹${auction.reservePrice.toLocaleString("en-IN")}</p>
      </div>

      <p>Your auction will go live at the scheduled start time. Bidders will be able to place bids during the auction period.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "📅 Auction Scheduled!",
      content,
      buttonText: "View Auction",
      buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: sellerId,
      notificationType: "auction_scheduled",
    });

    const text = generatePlainTextEmail(
      "Auction Scheduled",
      `Dear ${auction.vehicle.seller.fullName},\n\nYour vehicle auction has been scheduled!\n\nVehicle: ${vehicleInfo}\nStart Time: ${formattedStartTime}\nEnd Time: ${formattedEndTime}\nReserve Price: ₹${auction.reservePrice.toLocaleString("en-IN")}\n\nYour auction will go live at the scheduled start time.\n\nView auction: ${appUrl}/auctions/${auctionId}/live`,
      "View Auction",
      `${appUrl}/auctions/${auctionId}/live`,
      true,
      sellerId,
      "auction_scheduled"
    );

    return await sendEmailNotification(sellerId, "auction_scheduled", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifySellerAuctionScheduled:", error);
    return false;
  }
}

/**
 * Auction Started - Notify seller and watchlisted users
 */
export async function notifyAuctionStarted(auctionId: string): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
            watchlistItems: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!auction) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    let successCount = 0;

    // Notify seller
    if (auction.vehicle.seller) {
      try {
        const subject = `🚀 Auction Started - ${vehicleInfo}`;
        const content = `
          <p>Dear ${auction.vehicle.seller.fullName},</p>
          <p>Your auction has started! Bidders can now place bids on your vehicle.</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #10b981;">Auction Live</h3>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
            <p><strong>Reserve Price:</strong> ₹${auction.reservePrice.toLocaleString("en-IN")}</p>
            <p><strong>End Time:</strong> ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</p>
          </div>

          <p>Monitor your auction and approve the winning bid once it ends.</p>
        `;

        const html = generateBrandedEmailHTML({
          title: "🚀 Auction Started!",
          content,
          buttonText: "View Auction",
          buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
          footerText: "Thank you for using Tractor Auction Platform!",
          includeUnsubscribe: true,
          userId: auction.vehicle.seller.id,
          notificationType: "auction_started",
        });

        const text = generatePlainTextEmail(
          "Auction Started",
          `Dear ${auction.vehicle.seller.fullName},\n\nYour auction has started! Bidders can now place bids.\n\nVehicle: ${vehicleInfo}\nReserve Price: ₹${auction.reservePrice.toLocaleString("en-IN")}\nEnd Time: ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}\n\nView auction: ${appUrl}/auctions/${auctionId}/live`,
          "View Auction",
          `${appUrl}/auctions/${auctionId}/live`,
          true,
          auction.vehicle.seller.id,
          "auction_started"
        );

        const sent = await sendEmailNotification(
          auction.vehicle.seller.id,
          "auction_started",
          subject,
          html,
          text
        );
        if (sent) successCount++;
      } catch (error) {
        console.error("Error notifying seller about auction start:", error);
      }
    }

    // Notify watchlisted users
    for (const watchlistItem of auction.vehicle.watchlistItems || []) {
      try {
        if (!watchlistItem.user || !watchlistItem.user.email) continue;

        const subject = `🔔 Auction Started - ${vehicleInfo}`;
        const content = `
          <p>Dear ${watchlistItem.user.fullName},</p>
          <p>The auction you're watching has started!</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #3b82f6;">Auction Live</h3>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
            <p><strong>Current Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
            <p><strong>Reserve Price:</strong> ₹${auction.reservePrice.toLocaleString("en-IN")}</p>
            <p><strong>End Time:</strong> ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}</p>
          </div>

          <p>Don't miss out - place your bid now!</p>
        `;

        const html = generateBrandedEmailHTML({
          title: "🔔 Auction Started!",
          content,
          buttonText: "Place Bid Now",
          buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
          footerText: "Thank you for using Tractor Auction Platform!",
          includeUnsubscribe: true,
          userId: watchlistItem.user.id,
          notificationType: "auction_started",
        });

        const text = generatePlainTextEmail(
          "Auction Started",
          `Dear ${watchlistItem.user.fullName},\n\nThe auction you're watching has started!\n\nVehicle: ${vehicleInfo}\nCurrent Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\nReserve Price: ₹${auction.reservePrice.toLocaleString("en-IN")}\nEnd Time: ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}\n\nPlace bid: ${appUrl}/auctions/${auctionId}/live`,
          "Place Bid Now",
          `${appUrl}/auctions/${auctionId}/live`,
          true,
          watchlistItem.user.id,
          "auction_started"
        );

        const sent = await sendEmailNotification(
          watchlistItem.user.id,
          "auction_started",
          subject,
          html,
          text
        );
        if (sent) successCount++;
      } catch (error) {
        console.error(`Error notifying watchlisted user ${watchlistItem.userId} about auction start:`, error);
      }
    }

    return successCount > 0;
  } catch (error: any) {
    console.error("Error in notifyAuctionStarted:", error);
    return false;
  }
}

/**
 * Auction Ended - Notify seller and winner
 */
export async function notifyAuctionEnded(auctionId: string): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
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
        winner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!auction) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    let successCount = 0;

    // Notify seller
    if (auction.vehicle.seller) {
      try {
        const sellerSubject = auction.winner
          ? `✅ Auction Ended - Winner Selected - ${vehicleInfo}`
          : `ℹ️ Auction Ended - No Winner - ${vehicleInfo}`;

        const sellerContent = auction.winner
          ? `
            <p>Dear ${auction.vehicle.seller.fullName},</p>
            <p>Your auction has ended and a winner has been selected!</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
              <h3 style="margin-top: 0; color: #10b981;">Auction Results</h3>
              <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
              <p><strong>Winning Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
              <p><strong>Winner:</strong> ${auction.winner.fullName}</p>
              <p><strong>Winner Contact:</strong> ${auction.winner.phoneNumber}</p>
            </div>

            <p>Please review and approve the winning bid in your dashboard.</p>
          `
          : `
            <p>Dear ${auction.vehicle.seller.fullName},</p>
            <p>Your auction has ended, but no bids met the reserve price.</p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #f59e0b;">Auction Results</h3>
              <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
              <p><strong>Reserve Price:</strong> ₹${auction.reservePrice.toLocaleString("en-IN")}</p>
              <p><strong>Highest Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
            </div>

            <p>You can relist the vehicle or adjust the reserve price for future auctions.</p>
          `;

        const sellerHtml = generateBrandedEmailHTML({
          title: auction.winner ? "✅ Auction Ended - Winner Selected!" : "ℹ️ Auction Ended",
          content: sellerContent,
          buttonText: "View Auction",
          buttonUrl: `${appUrl}/admin/auctions/${auctionId}/review`,
          footerText: "Thank you for using Tractor Auction Platform!",
          includeUnsubscribe: true,
          userId: auction.vehicle.seller.id,
          notificationType: "auction_ended",
        });

        const sellerText = generatePlainTextEmail(
          "Auction Ended",
          auction.winner
            ? `Dear ${auction.vehicle.seller.fullName},\n\nYour auction has ended and a winner has been selected!\n\nVehicle: ${vehicleInfo}\nWinning Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\nWinner: ${auction.winner.fullName}\nWinner Contact: ${auction.winner.phoneNumber}\n\nPlease review and approve the winning bid.\n\nView auction: ${appUrl}/admin/auctions/${auctionId}/review`
            : `Dear ${auction.vehicle.seller.fullName},\n\nYour auction has ended, but no bids met the reserve price.\n\nVehicle: ${vehicleInfo}\nReserve Price: ₹${auction.reservePrice.toLocaleString("en-IN")}\nHighest Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\n\nYou can relist the vehicle for future auctions.\n\nView auction: ${appUrl}/admin/auctions/${auctionId}/review`,
          "View Auction",
          `${appUrl}/admin/auctions/${auctionId}/review`,
          true,
          auction.vehicle.seller.id,
          "auction_ended"
        );

        const sellerNotified = await sendEmailNotification(
          auction.vehicle.seller.id,
          "auction_ended",
          sellerSubject,
          sellerHtml,
          sellerText
        );
        if (sellerNotified) successCount++;
      } catch (error) {
        console.error("Error notifying seller about auction end:", error);
      }
    }

    // Notify winner
    if (auction.winner) {
      try {
        const winnerSubject = `🎉 You Won the Auction! - ${vehicleInfo}`;
        const winnerContent = `
          <p>Dear ${auction.winner.fullName},</p>
          <p>Congratulations! You won the auction!</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #10b981;">Auction Won</h3>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
            <p><strong>Winning Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
            <p><strong>Seller:</strong> ${auction.vehicle.seller.fullName}</p>
            <p><strong>Seller Contact:</strong> ${auction.vehicle.seller.phoneNumber}</p>
          </div>

          <p>The seller will review your bid and contact you to complete the purchase.</p>
        `;

        const winnerHtml = generateBrandedEmailHTML({
          title: "🎉 You Won the Auction!",
          content: winnerContent,
          buttonText: "View Purchase",
          buttonUrl: `${appUrl}/my-account`,
          footerText: "Thank you for using Tractor Auction Platform!",
          includeUnsubscribe: true,
          userId: auction.winner.id,
          notificationType: "auction_ended",
        });

        const winnerText = generatePlainTextEmail(
          "Auction Won",
          `Dear ${auction.winner.fullName},\n\nCongratulations! You won the auction!\n\nVehicle: ${vehicleInfo}\nWinning Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\nSeller: ${auction.vehicle.seller.fullName}\nSeller Contact: ${auction.vehicle.seller.phoneNumber}\n\nThe seller will review your bid and contact you.\n\nView purchase: ${appUrl}/my-account`,
          "View Purchase",
          `${appUrl}/my-account`,
          true,
          auction.winner.id,
          "auction_ended"
        );

        const winnerNotified = await sendEmailNotification(
          auction.winner.id,
          "auction_ended",
          winnerSubject,
          winnerHtml,
          winnerText
        );
        if (winnerNotified) successCount++;
      } catch (error) {
        console.error("Error notifying winner about auction end:", error);
      }
    }

    return successCount > 0;
  } catch (error: any) {
    console.error("Error in notifyAuctionEnded:", error);
    return false;
  }
}

/**
 * Bid Placed - Notify bidder
 */
export async function notifyBidderBidPlaced(
  bidderId: string,
  auctionId: string,
  bidAmount: number
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
      },
    });

    if (!auction) {
      return false;
    }

    const bidder = await prisma.user.findUnique({
      where: { id: bidderId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!bidder || !bidder.email) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `✅ Bid Placed Successfully - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${bidder.fullName},</p>
      <p>Your bid has been placed successfully!</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">Bid Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Your Bid:</strong> ₹${bidAmount.toLocaleString("en-IN")}</p>
        <p><strong>Current Highest Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
      </div>

      <p>You are currently the highest bidder. The auction will end at ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "✅ Bid Placed Successfully!",
      content,
      buttonText: "View Auction",
      buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
      footerText: "Thank you for participating in our auction!",
      includeUnsubscribe: true,
      userId: bidderId,
      notificationType: "bid_placed",
    });

    const text = generatePlainTextEmail(
      "Bid Placed Successfully",
      `Dear ${bidder.fullName},\n\nYour bid has been placed successfully!\n\nVehicle: ${vehicleInfo}\nYour Bid: ₹${bidAmount.toLocaleString("en-IN")}\nCurrent Highest Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\n\nYou are currently the highest bidder.\n\nView auction: ${appUrl}/auctions/${auctionId}/live`,
      "View Auction",
      `${appUrl}/auctions/${auctionId}/live`,
      true,
      bidderId,
      "bid_placed"
    );

    return await sendEmailNotification(bidderId, "bid_placed", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifyBidderBidPlaced:", error);
    return false;
  }
}

/**
 * Bid Outbid - Notify previous highest bidder
 */
export async function notifyBidderOutbid(
  previousBidderId: string,
  auctionId: string,
  newBidAmount: number
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
      },
    });

    if (!auction) {
      return false;
    }

    const previousBidder = await prisma.user.findUnique({
      where: { id: previousBidderId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!previousBidder || !previousBidder.email) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `⚠️ You've Been Outbid - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${previousBidder.fullName},</p>
      <p>You've been outbid on this auction!</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h3 style="margin-top: 0; color: #f59e0b;">New Bid</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>New Highest Bid:</strong> ₹${newBidAmount.toLocaleString("en-IN")}</p>
        <p><strong>Minimum Next Bid:</strong> ₹${(newBidAmount + auction.minimumIncrement).toLocaleString("en-IN")}</p>
      </div>

      <p>Place a higher bid to stay in the running! The auction ends at ${new Date(auction.endTime).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" })}.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "⚠️ You've Been Outbid!",
      content,
      buttonText: "Place Higher Bid",
      buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
      footerText: "Thank you for participating in our auction!",
      includeUnsubscribe: true,
      userId: previousBidderId,
      notificationType: "bid_outbid",
    });

    const text = generatePlainTextEmail(
      "You've Been Outbid",
      `Dear ${previousBidder.fullName},\n\nYou've been outbid on this auction!\n\nVehicle: ${vehicleInfo}\nNew Highest Bid: ₹${newBidAmount.toLocaleString("en-IN")}\nMinimum Next Bid: ₹${(newBidAmount + auction.minimumIncrement).toLocaleString("en-IN")}\n\nPlace a higher bid to stay in the running!\n\nView auction: ${appUrl}/auctions/${auctionId}/live`,
      "Place Higher Bid",
      `${appUrl}/auctions/${auctionId}/live`,
      true,
      previousBidderId,
      "bid_outbid"
    );

    return await sendEmailNotification(previousBidderId, "bid_outbid", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifyBidderOutbid:", error);
    return false;
  }
}

/**
 * Bid Approved - Notify buyer
 */
export async function notifyBuyerBidApproved(
  buyerId: string,
  auctionId: string
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
        winner: {
          select: {
            fullName: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!auction || !auction.winner) {
      return false;
    }

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!buyer || !buyer.email) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `✅ Bid Approved - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${buyer.fullName},</p>
      <p>Great news! Your winning bid has been approved by the seller!</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">Purchase Confirmed</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Purchase Price:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
      </div>

      <p>Please complete the payment and contact the seller to arrange vehicle pickup/delivery.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "✅ Bid Approved!",
      content,
      buttonText: "Complete Purchase",
      buttonUrl: `${appUrl}/my-account`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: buyerId,
      notificationType: "bid_approved",
    });

    const text = generatePlainTextEmail(
      "Bid Approved",
      `Dear ${buyer.fullName},\n\nGreat news! Your winning bid has been approved by the seller!\n\nVehicle: ${vehicleInfo}\nPurchase Price: ₹${auction.currentBid.toLocaleString("en-IN")}\n\nPlease complete the payment and contact the seller.\n\nView purchase: ${appUrl}/my-account`,
      "Complete Purchase",
      `${appUrl}/my-account`,
      true,
      buyerId,
      "bid_approved"
    );

    return await sendEmailNotification(buyerId, "bid_approved", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifyBuyerBidApproved:", error);
    return false;
  }
}

/**
 * Bid Rejected - Notify buyer
 */
export async function notifyBuyerBidRejected(
  buyerId: string,
  auctionId: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
      },
    });

    if (!auction) {
      return false;
    }

    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!buyer || !buyer.email) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `❌ Bid Rejected - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${buyer.fullName},</p>
      <p>We regret to inform you that your winning bid has been rejected by the seller.</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #ef4444;">
        <h3 style="margin-top: 0; color: #ef4444;">Bid Rejected</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Your Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
        ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
      </div>

      ${rejectionReason ? `<p><strong>Rejection Reason:</strong> ${rejectionReason}</p>` : "<p>The seller has chosen not to proceed with this sale.</p>"}

      <p>You can continue browsing other auctions and place bids on other vehicles.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "❌ Bid Rejected",
      content,
      buttonText: "Browse Auctions",
      buttonUrl: `${appUrl}/auctions`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: buyerId,
      notificationType: "bid_rejected",
    });

    const text = generatePlainTextEmail(
      "Bid Rejected",
      `Dear ${buyer.fullName},\n\nWe regret to inform you that your winning bid has been rejected by the seller.\n\nVehicle: ${vehicleInfo}\nYour Bid: ₹${auction.currentBid.toLocaleString("en-IN")}${rejectionReason ? `\nReason: ${rejectionReason}` : ""}\n\nThe seller has chosen not to proceed with this sale.\n\nBrowse auctions: ${appUrl}/auctions`,
      "Browse Auctions",
      `${appUrl}/auctions`,
      true,
      buyerId,
      "bid_rejected"
    );

    return await sendEmailNotification(buyerId, "bid_rejected", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifyBuyerBidRejected:", error);
    return false;
  }
}

/**
 * Purchase Confirmed - Notify buyer
 */
export async function notifyBuyerPurchaseConfirmed(
  buyerId: string,
  purchaseId: string,
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    referenceNumber: string | null;
  },
  purchasePrice: number
): Promise<boolean> {
  try {
    const buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!buyer || !buyer.email) {
      return false;
    }

    const vehicleInfo = `${vehicle.tractorBrand}${vehicle.tractorModel ? ` ${vehicle.tractorModel}` : ""} ${vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `✅ Purchase Confirmed - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${buyer.fullName},</p>
      <p>Congratulations! Your purchase has been confirmed.</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">Purchase Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Year:</strong> ${vehicle.yearOfMfg}</p>
        <p><strong>Reference Number:</strong> ${vehicle.referenceNumber || "N/A"}</p>
        <p><strong>Purchase Price:</strong> ₹${purchasePrice.toLocaleString("en-IN")}</p>
        <p><strong>Purchase ID:</strong> ${purchaseId}</p>
      </div>

      <p>Your purchase is now pending. Please contact the seller to complete the transaction and arrange for vehicle pickup/delivery.</p>

      <p>If you have any questions, please contact our support team.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "✅ Purchase Confirmed!",
      content,
      buttonText: "View My Purchases",
      buttonUrl: `${appUrl}/my-account`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: buyerId,
      notificationType: "bid_approved",
    });

    const text = generatePlainTextEmail(
      "Purchase Confirmed",
      `Dear ${buyer.fullName},\n\nCongratulations! Your purchase has been confirmed.\n\nPurchase Details:\n- Vehicle: ${vehicleInfo}\n- Year: ${vehicle.yearOfMfg}\n- Reference Number: ${vehicle.referenceNumber || "N/A"}\n- Purchase Price: ₹${purchasePrice.toLocaleString("en-IN")}\n- Purchase ID: ${purchaseId}\n\nYour purchase is now pending. Please contact the seller to complete the transaction.\n\nView purchases: ${appUrl}/my-account`,
      "View My Purchases",
      `${appUrl}/my-account`,
      true,
      buyerId,
      "bid_approved"
    );

    return await sendEmailNotification(buyerId, "bid_approved", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifyBuyerPurchaseConfirmed:", error);
    return false;
  }
}

/**
 * Vehicle Sold - Notify seller
 */
export async function notifySellerVehicleSold(
  sellerId: string,
  vehicleId: string,
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
  },
  purchasePrice: number
): Promise<boolean> {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        fullName: true,
        email: true,
      },
    });

    if (!seller || !seller.email) {
      return false;
    }

    const vehicleInfo = `${vehicle.tractorBrand}${vehicle.tractorModel ? ` ${vehicle.tractorModel}` : ""} ${vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    
    const subject = `💰 Vehicle Sold - ${vehicleInfo}`;
    
    const content = `
      <p>Dear ${seller.fullName},</p>
      <p>Congratulations! Your vehicle has been sold!</p>
      
      <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">Sale Details</h3>
        <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
        <p><strong>Year:</strong> ${vehicle.yearOfMfg}</p>
        <p><strong>Sale Price:</strong> ₹${purchasePrice.toLocaleString("en-IN")}</p>
      </div>

      <p>Please contact the buyer to arrange for vehicle pickup/delivery and complete the transaction.</p>
    `;

    const html = generateBrandedEmailHTML({
      title: "💰 Vehicle Sold!",
      content,
      buttonText: "View Sale Details",
      buttonUrl: `${appUrl}/my-account`,
      footerText: "Thank you for using Tractor Auction Platform!",
      includeUnsubscribe: true,
      userId: sellerId,
      notificationType: "auction_ended",
    });

    const text = generatePlainTextEmail(
      "Vehicle Sold",
      `Dear ${seller.fullName},\n\nCongratulations! Your vehicle has been sold!\n\nSale Details:\n- Vehicle: ${vehicleInfo}\n- Year: ${vehicle.yearOfMfg}\n- Sale Price: ₹${purchasePrice.toLocaleString("en-IN")}\n\nPlease contact the buyer to arrange for vehicle pickup/delivery.\n\nView sale details: ${appUrl}/my-account`,
      "View Sale Details",
      `${appUrl}/my-account`,
      true,
      sellerId,
      "auction_ended"
    );

    return await sendEmailNotification(sellerId, "auction_ended", subject, html, text);
  } catch (error: any) {
    console.error("Error in notifySellerVehicleSold:", error);
    return false;
  }
}

/**
 * Auction Extended - Notify all participants
 */
export async function notifyAuctionExtended(
  auctionId: string,
  newEndTime: Date,
  extensionMinutes: number
): Promise<boolean> {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
          },
        },
        bids: {
          select: {
            bidderId: true,
          },
          distinct: ["bidderId"],
        },
      },
    });

    if (!auction) {
      return false;
    }

    const vehicleInfo = `${auction.vehicle.tractorBrand}${auction.vehicle.tractorModel ? ` ${auction.vehicle.tractorModel}` : ""} ${auction.vehicle.engineHP} HP`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.tractorauction.in";
    const formattedEndTime = newEndTime.toLocaleString("en-IN", {
      dateStyle: "long",
      timeStyle: "short",
    });

    // Notify all unique bidders
    const bidderIds = [...new Set(auction.bids.map((b) => b.bidderId))];
    let successCount = 0;

    for (const bidderId of bidderIds) {
      try {
        const bidder = await prisma.user.findUnique({
          where: { id: bidderId },
          select: {
            fullName: true,
            email: true,
          },
        });

        if (!bidder || !bidder.email) {
          continue;
        }

        const subject = `⏰ Auction Extended - ${vehicleInfo}`;

        const content = `
          <p>Dear ${bidder.fullName},</p>
          <p>The auction you're participating in has been extended!</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #f59e0b;">Auction Extended</h3>
            <p><strong>Vehicle:</strong> ${vehicleInfo}</p>
            <p><strong>New End Time:</strong> ${formattedEndTime}</p>
            <p><strong>Extended By:</strong> ${extensionMinutes} minutes</p>
            <p><strong>Current Bid:</strong> ₹${auction.currentBid.toLocaleString("en-IN")}</p>
          </div>

          <p>You still have time to place your bid! The auction will now end at ${formattedEndTime}.</p>

          <p>Don't miss out - place your bid now!</p>
        `;

        const html = generateBrandedEmailHTML({
          title: "⏰ Auction Extended!",
          content,
          buttonText: "Place Bid Now",
          buttonUrl: `${appUrl}/auctions/${auctionId}/live`,
          footerText: "Thank you for participating in our auction!",
          includeUnsubscribe: true,
          userId: bidderId,
          notificationType: "auction_ending_soon",
        });

        const text = generatePlainTextEmail(
          "Auction Extended",
          `Dear ${bidder.fullName},\n\nThe auction you're participating in has been extended!\n\nVehicle: ${vehicleInfo}\nNew End Time: ${formattedEndTime}\nExtended By: ${extensionMinutes} minutes\nCurrent Bid: ₹${auction.currentBid.toLocaleString("en-IN")}\n\nYou still have time to place your bid! The auction will now end at ${formattedEndTime}.\n\nPlace bid: ${appUrl}/auctions/${auctionId}/live`,
          "Place Bid Now",
          `${appUrl}/auctions/${auctionId}/live`,
          true,
          bidderId,
          "auction_ending_soon"
        );

        const sent = await sendEmailNotification(
          bidderId,
          "auction_ending_soon",
          subject,
          html,
          text
        );

        if (sent) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error notifying bidder ${bidderId} about auction extension:`, error);
      }
    }

    return successCount > 0;
  } catch (error: any) {
    console.error("Error in notifyAuctionExtended:", error);
    return false;
  }
}
