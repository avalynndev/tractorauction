import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get messages for a chat
 */
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
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { message: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns this chat or is admin
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { message: "Chat not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or owns the chat
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (chat.userId !== decoded.userId && user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get messages
    const messages = await prisma.chatMessage.findMany({
      where: { chatId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Mark messages as read if user is viewing them
    if (chat.userId === decoded.userId || user?.role === "ADMIN") {
      await prisma.chatMessage.updateMany({
        where: {
          chatId,
          senderId: { not: decoded.userId },
          isRead: false,
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      messages,
      chat,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























