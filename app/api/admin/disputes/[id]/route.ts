import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const updateDisputeSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED", "ESCALATED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  resolution: z.string().optional(),
  resolutionAction: z.string().optional(),
  refundAmount: z.number().optional(),
  adminComments: z.string().optional(),
});

export async function PUT(
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const disputeId = resolvedParams.id;

    if (!disputeId) {
      return NextResponse.json(
        { message: "Dispute ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateDisputeSchema.parse(body);

    // Check if dispute exists
    const existingDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!existingDispute) {
      return NextResponse.json(
        { message: "Dispute not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      lastUpdatedBy: decoded.userId,
    };

    if (validatedData.status) {
      updateData.status = validatedData.status;
      
      // If resolving, set resolvedBy and resolvedAt
      if (validatedData.status === "RESOLVED") {
        updateData.resolvedBy = decoded.userId;
        updateData.resolvedAt = new Date();
      }
    }

    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
    }

    if (validatedData.resolution !== undefined) {
      updateData.resolution = validatedData.resolution;
    }

    if (validatedData.resolutionAction !== undefined) {
      updateData.resolutionAction = validatedData.resolutionAction;
    }

    if (validatedData.refundAmount !== undefined) {
      updateData.refundAmount = validatedData.refundAmount;
    }

    if (validatedData.adminComments !== undefined) {
      updateData.adminComments = validatedData.adminComments;
    }

    // Update dispute
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: updateData,
      include: {
        filer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
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
        resolver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Dispute updated successfully",
      dispute,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Update dispute error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const disputeId = resolvedParams.id;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        filer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
            address: true,
            city: true,
            district: true,
            state: true,
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
                saleAmount: true,
              },
            },
            buyer: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
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
            seller: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        resolver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { message: "Dispute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Get dispute error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}






















