import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get single auction details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const auctionId = resolvedParams.id;

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
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
            inspectionReports: {
              where: {
                status: {
                  in: ["COMPLETED", "APPROVED"],
                },
              },
              orderBy: {
                inspectionDate: "desc",
              },
              take: 3, // Show latest 3 reports
              select: {
                id: true,
                inspectionDate: true,
                inspectionType: true,
                status: true,
                overallCondition: true,
                issuesCount: true,
                criticalIssues: true,
                verifiedAt: true,
              },
            },
          },
          // Include all vehicle fields needed for CompleteVehicleDetails
        },
        winner: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        bids: {
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
          take: 10, // Get last 10 bids
        },
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(auction);
  } catch (error) {
    console.error("Error fetching auction:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}




