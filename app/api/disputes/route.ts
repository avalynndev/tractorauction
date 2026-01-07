import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";
import {
  parsePaginationParams,
  createPaginatedResponse,
  getPrismaPagination,
} from "@/lib/pagination";

const createDisputeSchema = z.object({
  purchaseId: z.string().optional(),
  auctionId: z.string().optional(),
  vehicleId: z.string().optional(),
  disputeType: z.enum([
    "REFUND_REQUEST",
    "RETURN_REQUEST",
    "QUALITY_ISSUE",
    "MISMATCH_DESCRIPTION",
    "DELIVERY_ISSUE",
    "PAYMENT_ISSUE",
    "SELLER_MISCONDUCT",
    "FRAUD",
    "OTHER",
  ]),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  evidence: z.array(z.string()).optional().default([]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
});

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

    const body = await request.json();
    const validatedData = createDisputeSchema.parse(body);

    // Validate that at least one related entity is provided
    if (!validatedData.purchaseId && !validatedData.auctionId && !validatedData.vehicleId) {
      return NextResponse.json(
        { message: "At least one of purchaseId, auctionId, or vehicleId must be provided" },
        { status: 400 }
      );
    }

    // Verify purchase exists and belongs to user (if provided)
    if (validatedData.purchaseId) {
      const purchase = await prisma.purchase.findUnique({
        where: { id: validatedData.purchaseId },
      });

      if (!purchase) {
        return NextResponse.json(
          { message: "Purchase not found" },
          { status: 404 }
        );
      }

      if (purchase.buyerId !== decoded.userId) {
        return NextResponse.json(
          { message: "You can only file disputes for your own purchases" },
          { status: 403 }
        );
      }
    }

    // Verify auction exists (if provided)
    if (validatedData.auctionId) {
      const auction = await prisma.auction.findUnique({
        where: { id: validatedData.auctionId },
      });

      if (!auction) {
        return NextResponse.json(
          { message: "Auction not found" },
          { status: 404 }
        );
      }
    }

    // Verify vehicle exists (if provided)
    if (validatedData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: validatedData.vehicleId },
      });

      if (!vehicle) {
        return NextResponse.json(
          { message: "Vehicle not found" },
          { status: 404 }
        );
      }
    }

    // Create dispute - only include IDs if they have values
    const disputeData: any = {
      filerId: decoded.userId,
      disputeType: validatedData.disputeType,
      reason: validatedData.reason,
      description: validatedData.description,
      evidence: validatedData.evidence || [],
      priority: validatedData.priority || "MEDIUM",
      status: "PENDING",
    };

    // Only add IDs if they are provided and not empty
    if (validatedData.purchaseId && validatedData.purchaseId.trim() !== "") {
      disputeData.purchaseId = validatedData.purchaseId;
    }
    if (validatedData.auctionId && validatedData.auctionId.trim() !== "") {
      disputeData.auctionId = validatedData.auctionId;
    }
    if (validatedData.vehicleId && validatedData.vehicleId.trim() !== "") {
      disputeData.vehicleId = validatedData.vehicleId;
    }

    console.log("Creating dispute with data:", disputeData);

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: disputeData,
      include: {
        filer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        purchase: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
          },
        },
        auction: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            mainPhoto: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Dispute filed successfully",
        dispute,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Create dispute error:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const disputeType = searchParams.get("disputeType");

    // Parse pagination parameters
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPrismaPagination(page, limit);

    // Build where clause
    const where: any = {
      filerId: decoded.userId,
    };

    if (status) {
      where.status = status;
    }

    if (disputeType) {
      where.disputeType = disputeType;
    }

    // Get total count for pagination
    const total = await prisma.dispute.count({ where });

    const disputes = await prisma.dispute.findMany({
      where,
      skip,
      take,
      include: {
        purchase: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
          },
        },
        auction: {
          include: {
            vehicle: {
              select: {
                id: true,
                tractorBrand: true,
                tractorModel: true,
                engineHP: true,
                yearOfMfg: true,
                mainPhoto: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            tractorBrand: true,
            tractorModel: true,
            engineHP: true,
            yearOfMfg: true,
            mainPhoto: true,
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(createPaginatedResponse(disputes, page, limit, total));
  } catch (error) {
    console.error("Get disputes error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

