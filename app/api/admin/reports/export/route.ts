import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    // Check if user is admin
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

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "vehicles"; // vehicles, auctions, users
    const format = searchParams.get("format") || "csv"; // csv, json

    let data: any[] = [];
    let filename = "";

    switch (type) {
      case "vehicles":
        const vehicles = await prisma.vehicle.findMany({
          include: {
            seller: {
              select: {
                fullName: true,
                phoneNumber: true,
                state: true,
                district: true,
              },
            },
            auction: {
              select: {
                referenceNumber: true,
                status: true,
                currentBid: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = vehicles.map(v => ({
          referenceNumber: v.referenceNumber || "",
          vehicleType: v.vehicleType,
          saleType: v.saleType,
          tractorBrand: v.tractorBrand,
          tractorModel: v.tractorModel || "",
          engineHP: v.engineHP,
          yearOfMfg: v.yearOfMfg,
          state: v.state,
          district: v.district || "",
          status: v.status,
          saleAmount: v.saleAmount,
          sellerName: v.seller.fullName,
          sellerPhone: v.seller.phoneNumber,
          auctionReference: v.auction?.referenceNumber || "",
          auctionStatus: v.auction?.status || "",
          createdAt: v.createdAt.toISOString(),
        }));
        filename = `vehicles_export_${new Date().toISOString().split("T")[0]}`;
        break;

      case "auctions":
        const now = new Date();
        const auctions = await prisma.auction.findMany({
          where: {
            OR: [
              { status: "ENDED" },
              { endTime: { lte: now } }, // Include auctions where endTime has passed
            ],
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
                phoneNumber: true,
              },
            },
            bids: {
              include: {
                bidder: {
                  select: {
                    fullName: true,
                    phoneNumber: true,
                  },
                },
              },
              orderBy: {
                bidAmount: "desc",
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = auctions.map(a => {
          // Get top 3 bidders sorted by bid amount
          const sortedBids = a.bids.sort((b1, b2) => b2.bidAmount - b1.bidAmount);
          const winner = sortedBids[0]?.bidder || a.winner;
          const secondHighest = sortedBids[1]?.bidder || null;
          const thirdHighest = sortedBids[2]?.bidder || null;

          return {
            referenceNumber: a.referenceNumber || "",
            vehicleReference: a.vehicle?.referenceNumber || "",
            vehicle: `${a.vehicle?.tractorBrand || ""} ${a.vehicle?.tractorModel || ""} ${a.vehicle?.engineHP || ""} HP`.trim(),
            tractorBrand: a.vehicle?.tractorBrand || "",
            tractorModel: a.vehicle?.tractorModel || "",
            status: a.status,
            startTime: a.startTime?.toISOString() || "",
            endTime: a.endTime?.toISOString() || "",
            currentBid: a.currentBid || 0,
            reservePrice: a.reservePrice || 0,
            sellerApprovalStatus: a.sellerApprovalStatus || "",
            // Winner details
            winnerName: winner?.fullName || "",
            winnerPhone: winner?.phoneNumber || "",
            // Second highest bidder
            secondHighestBidderName: secondHighest?.fullName || "",
            secondHighestBidderPhone: secondHighest?.phoneNumber || "",
            // Third highest bidder
            thirdHighestBidderName: thirdHighest?.fullName || "",
            thirdHighestBidderPhone: thirdHighest?.phoneNumber || "",
            // Seller details
            sellerName: a.vehicle?.seller?.fullName || "",
            sellerPhone: a.vehicle?.seller?.phoneNumber || "",
            // Vehicle location
            state: a.vehicle?.state || "",
            district: a.vehicle?.district || "",
            // Vehicle identification
            vehicleRegistrationNumber: a.vehicle?.registrationNumber || "",
            engineNumber: a.vehicle?.engineNumber || "",
            chassisNumber: a.vehicle?.chassisNumber || "",
            yearOfManufacturing: a.vehicle?.yearOfMfg || "",
            createdAt: a.createdAt?.toISOString() || "",
          };
        });
        filename = `ended_auctions_export_${new Date().toISOString().split("T")[0]}`;
        break;

      case "users":
        const users = await prisma.user.findMany({
          include: {
            memberships: {
              where: {
                endDate: { gte: new Date() },
              },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            _count: {
              select: {
                vehicles: true,
                bids: true,
                purchases: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });

        data = users.map(u => ({
          fullName: u.fullName,
          phoneNumber: u.phoneNumber,
          email: u.email || "",
          role: u.role,
          state: u.state,
          district: u.district,
          city: u.city,
          isActive: u.isActive,
          membershipType: u.memberships[0]?.membershipType || "NONE",
          membershipEndDate: u.memberships[0]?.endDate.toISOString() || "",
          totalVehicles: u._count.vehicles,
          totalBids: u._count.bids,
          totalPurchases: u._count.purchases,
          createdAt: u.createdAt.toISOString(),
        }));
        filename = `users_export_${new Date().toISOString().split("T")[0]}`;
        break;

      default:
        return NextResponse.json(
          { message: "Invalid export type" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json(
          { message: "No data to export" },
          { status: 400 }
        );
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(",")
        ),
      ];

      const csv = csvRows.join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // Return JSON
      return NextResponse.json(data, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error: any) {
    console.error("Error exporting data:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        message: "Internal server error", 
        error: error?.message || String(error),
        details: process.env.NODE_ENV === "development" ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}







