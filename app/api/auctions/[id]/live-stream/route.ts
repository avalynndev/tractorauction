import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { generateLiveStreamCredentials } from "@/lib/cloudinary";
import { handleApiError } from "@/lib/errors";

interface RouteParams {
  params: {
    id: string;
  };
}

// Start live stream for an auction
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can start live streams" },
        { status: 403 }
      );
    }

    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      include: { vehicle: true },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    // Generate live stream credentials
    const streamName = `auction-${auction.id}`;
    const { streamUrl, streamKey } = await generateLiveStreamCredentials(streamName);

    // Generate HLS playback URL (Cloudinary format)
    const hlsUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/${streamName}.m3u8`;

    // Update auction with live stream info
    const updatedAuction = await prisma.auction.update({
      where: { id: params.id },
      data: {
        isLiveStreaming: true,
        liveStreamUrl: hlsUrl,
        liveStreamKey: streamKey,
        liveStreamStatus: "starting",
      },
    });

    return NextResponse.json({
      message: "Live stream started",
      streamUrl,
      streamKey,
      hlsUrl,
      auction: updatedAuction,
    });
  } catch (error: any) {
    console.error("Live stream start error:", error);
    return handleApiError(error);
  }
}

// Get live stream status
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        isLiveStreaming: true,
        liveStreamUrl: true,
        liveStreamStatus: true,
        status: true,
      },
    });

    if (!auction) {
      return NextResponse.json(
        { message: "Auction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      isLiveStreaming: auction.isLiveStreaming,
      liveStreamUrl: auction.liveStreamUrl,
      liveStreamStatus: auction.liveStreamStatus,
      auctionStatus: auction.status,
    });
  } catch (error: any) {
    console.error("Get live stream status error:", error);
    return handleApiError(error);
  }
}

// Stop live stream
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can stop live streams" },
        { status: 403 }
      );
    }

    const updatedAuction = await prisma.auction.update({
      where: { id: params.id },
      data: {
        isLiveStreaming: false,
        liveStreamStatus: "ended",
      },
    });

    return NextResponse.json({
      message: "Live stream stopped",
      auction: updatedAuction,
    });
  } catch (error: any) {
    console.error("Stop live stream error:", error);
    return handleApiError(error);
  }
}

