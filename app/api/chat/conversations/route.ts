import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Get all conversations for a user (or all chats for admin)
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    let chats;

    if (user?.role === "ADMIN") {
      // Admin can see all chats
      chats = await prisma.chat.findMany({
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
              profilePhoto: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: { isRead: false, senderId: { not: decoded.userId } },
              },
            },
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      });
    } else {
      // Regular users see only their chats
      chats = await prisma.chat.findMany({
        where: { userId: decoded.userId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              email: true,
              profilePhoto: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: {
                where: { isRead: false, senderId: { not: decoded.userId } },
              },
            },
          },
        },
        orderBy: {
          lastMessageAt: "desc",
        },
      });
    }

    return NextResponse.json({
      conversations: chats.map((chat) => ({
        id: chat.id,
        status: chat.status,
        lastMessageAt: chat.lastMessageAt,
        unreadCount: chat._count.messages,
        lastMessage: chat.messages[0] || null,
        user: chat.user,
        createdAt: chat.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























