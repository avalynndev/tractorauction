import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Get all approved feedbacks (for homepage) or user's own feedback
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includePending = searchParams.get("includePending") === "true";
    const authHeader = request.headers.get("authorization");
    
    let userId: string | null = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    const where: any = {};
    
    // If user is authenticated and wants to see pending, show their own pending feedback
    if (includePending && userId) {
      where.OR = [
        { status: "APPROVED" },
        { status: "PENDING", reviewerId: userId },
      ];
    } else if (!includePending) {
      where.status = "APPROVED";
    } else {
      // If includePending is true but no auth, only show approved
      where.status = "APPROVED";
    }

    const feedbacks = await prisma.platformFeedback.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Submit feedback (members only)
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

    // Get user and check if they have active membership
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        memberships: {
          where: {
            status: "active",
            endDate: { gte: new Date() },
          },
          orderBy: { endDate: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has active membership (or is admin)
    if (user.role !== "ADMIN" && user.memberships.length === 0) {
      return NextResponse.json(
        { message: "Only members can submit feedback. Please purchase a membership first." },
        { status: 403 }
      );
    }

    // Check if user already submitted feedback
    const existingFeedback = await prisma.platformFeedback.findFirst({
      where: { reviewerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Allow multiple feedbacks, but warn if recent one is pending
    if (existingFeedback && existingFeedback.status === "PENDING") {
      return NextResponse.json(
        { message: "You already have a pending feedback. Please wait for admin approval." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      businessRating,
      serviceRating,
      webAppRating,
      mobileAppRating,
      detailedFeedback,
      tractorIndustrySince,
    } = body;

    // Validate ratings (1-5)
    if (
      !businessRating ||
      !serviceRating ||
      !webAppRating ||
      !mobileAppRating ||
      businessRating < 1 ||
      businessRating > 5 ||
      serviceRating < 1 ||
      serviceRating > 5 ||
      webAppRating < 1 ||
      webAppRating > 5 ||
      mobileAppRating < 1 ||
      mobileAppRating > 5
    ) {
      return NextResponse.json(
        { message: "All ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    if (!detailedFeedback || detailedFeedback.trim().length < 10) {
      return NextResponse.json(
        { message: "Detailed feedback must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await prisma.platformFeedback.create({
      data: {
        reviewerId: user.id,
        businessRating: parseInt(businessRating),
        serviceRating: parseInt(serviceRating),
        webAppRating: parseInt(webAppRating),
        mobileAppRating: parseInt(mobileAppRating),
        detailedFeedback: detailedFeedback.trim(),
        tractorIndustrySince: tractorIndustrySince ? parseInt(tractorIndustrySince) : null,
        status: "PENDING",
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
          },
        },
      },
    });

    return NextResponse.json({
      message: "Feedback submitted successfully. It will be reviewed by admin.",
      feedback,
    });
  } catch (error: any) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

