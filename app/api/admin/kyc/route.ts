import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Get all pending KYC requests
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
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required" },
        { status: 403 }
      );
    }

    const status = request.nextUrl.searchParams.get("status") || "PENDING";

    const kycUsers = await prisma.user.findMany({
      where: {
        kycStatus: status as any,
        OR: [
          { panCard: { not: null } },
          { aadharCard: { not: null } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        panCard: true,
        aadharCard: true,
        kycStatus: true,
        kycSubmittedAt: true,
        kycApprovedAt: true,
        kycRejectedAt: true,
        kycRejectionReason: true,
        createdAt: true,
      },
      orderBy: {
        kycSubmittedAt: "desc",
      },
    });

    return NextResponse.json({ users: kycUsers });
  } catch (error) {
    console.error("Error fetching KYC requests:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Approve or reject KYC
export async function PATCH(request: NextRequest) {
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
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Forbidden. Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action, rejectionReason } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { message: "User ID and action are required" },
        { status: 400 }
      );
    }

    if (!["APPROVE", "REJECT"].includes(action)) {
      return NextResponse.json(
        { message: "Invalid action. Must be APPROVE or REJECT" },
        { status: 400 }
      );
    }

    const updateData: any = {
      kycApprovedBy: decoded.userId,
    };

    if (action === "APPROVE") {
      updateData.kycStatus = "APPROVED";
      updateData.kycApprovedAt = new Date();
      updateData.kycRejectedAt = null;
      updateData.kycRejectionReason = null;
    } else {
      updateData.kycStatus = "REJECTED";
      updateData.kycRejectedAt = new Date();
      updateData.kycRejectionReason = rejectionReason || "No reason provided";
      updateData.kycApprovedAt = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        kycStatus: true,
        kycApprovedAt: true,
        kycRejectedAt: true,
        kycRejectionReason: true,
      },
    });

    return NextResponse.json({
      message: `KYC ${action === "APPROVE" ? "approved" : "rejected"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating KYC status:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
























