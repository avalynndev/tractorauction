import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const eligibilitySchema = z.object({
  isEligibleForBid: z.boolean(),
  reason: z.string().optional().nullable(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const bidderId = params.id;
    const body = await request.json();
    const validatedData = eligibilitySchema.parse(body);

    // Check if bidder exists
    const bidder = await prisma.user.findUnique({
      where: { id: bidderId },
      select: { id: true, role: true },
    });

    if (!bidder) {
      return NextResponse.json({ message: "Bidder not found" }, { status: 404 });
    }

    if (bidder.role !== "BUYER" && bidder.role !== "DEALER") {
      return NextResponse.json(
        { message: "User is not a bidder" },
        { status: 400 }
      );
    }

    // Update bidder eligibility
    await prisma.user.update({
      where: { id: bidderId },
      data: {
        isEligibleForBid: validatedData.isEligibleForBid,
        eligibleForBidReason: validatedData.reason || null,
      },
    });

    return NextResponse.json({
      message: `Bidder ${validatedData.isEligibleForBid ? "enabled" : "disabled"} successfully`,
      isEligibleForBid: validatedData.isEligibleForBid,
    });
  } catch (error: any) {
    console.error("Error updating bidder eligibility:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



