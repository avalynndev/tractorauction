import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

const reviewSchema = z.object({
  vehicleId: z.string(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

/**
 * GET /api/reviews?vehicleId={id} - Get reviews for a vehicle
 * POST /api/reviews - Create a review
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { vehicleId },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 10) / 10,
      totalReviews: reviews.length,
      ratingDistribution,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const validatedData = reviewSchema.parse(body);

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: validatedData.vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Check if user has already reviewed this vehicle
    const existingReview = await prisma.review.findFirst({
      where: {
        vehicleId: validatedData.vehicleId,
        reviewerId: decoded.userId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { message: "You have already reviewed this vehicle" },
        { status: 400 }
      );
    }

    // Check if user has purchased this vehicle (for verified review)
    const purchase = await prisma.purchase.findFirst({
      where: {
        vehicleId: validatedData.vehicleId,
        buyerId: decoded.userId,
        status: "completed",
      },
    });

    // Create review
    const review = await prisma.review.create({
      data: {
        vehicleId: validatedData.vehicleId,
        reviewerId: decoded.userId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        isVerified: !!purchase,
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Create review error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























