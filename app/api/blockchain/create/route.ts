import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import {
  createVehicleBlockchainRecord,
  createAuctionBlockchainRecord,
  createBidBlockchainRecord,
  createPurchaseBlockchainRecord,
} from "@/lib/blockchain";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
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
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can create blockchain records" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { recordType, recordId } = body;

    if (!recordType || !recordId) {
      return NextResponse.json(
        { message: "recordType and recordId are required" },
        { status: 400 }
      );
    }

    let hash: string;

    switch (recordType) {
      case "VEHICLE":
        hash = await createVehicleBlockchainRecord(recordId);
        break;
      case "AUCTION":
        hash = await createAuctionBlockchainRecord(recordId);
        break;
      case "BID":
        hash = await createBidBlockchainRecord(recordId);
        break;
      case "PURCHASE":
        hash = await createPurchaseBlockchainRecord(recordId);
        break;
      default:
        return NextResponse.json(
          { message: "Invalid recordType. Must be VEHICLE, AUCTION, BID, or PURCHASE" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      message: "Blockchain record created successfully",
      hash,
      recordType,
      recordId,
    });
  } catch (error: any) {
    console.error("Create blockchain record error:", error);
    return handleApiError(error);
  }
}

