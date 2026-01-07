import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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

    // Await params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const feedbackId = resolvedParams.id;

    // Update feedback status
    const feedback = await prisma.platformFeedback.update({
      where: { id: feedbackId },
      data: {
        status: "APPROVED",
        approvedBy: decoded.userId,
        approvedAt: new Date(),
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            state: true,
            district: true,
            role: true,
            createdAt: true,
            memberships: {
              where: {
                status: "active",
              },
              orderBy: {
                startDate: "asc",
              },
              take: 1,
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Feedback approved successfully",
      feedback,
    });
  } catch (error: any) {
    console.error("Error approving feedback:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

