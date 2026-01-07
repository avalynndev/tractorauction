import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { z } from "zod";

// Get Socket.io instance from global (set by server.js)
declare global {
  var io: any;
}

const sendMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
  chatId: z.string().optional(), // Optional - will create new chat if not provided
});

/**
 * Send a chat message
 * Creates a new chat if chatId is not provided
 */
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
    const validatedData = sendMessageSchema.parse(body);

    let chat;
    
    // If chatId provided, use existing chat, otherwise create new one
    if (validatedData.chatId) {
      chat = await prisma.chat.findUnique({
        where: { id: validatedData.chatId },
      });

      if (!chat) {
        return NextResponse.json(
          { message: "Chat not found" },
          { status: 404 }
        );
      }

      if (chat.userId !== decoded.userId) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 403 }
        );
      }
    } else {
      // Create new chat
      chat = await prisma.chat.create({
        data: {
          userId: decoded.userId,
          status: "OPEN",
        },
      });
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: decoded.userId,
        message: validatedData.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profilePhoto: true,
          },
        },
      },
    });

    // Update chat's lastMessageAt
    await prisma.chat.update({
      where: { id: chat.id },
      data: { lastMessageAt: new Date() },
    });

    // Emit real-time message via Socket.io
    if (global.io) {
      global.io.to(`chat-${chat.id}`).emit("newMessage", chatMessage);
    }

    return NextResponse.json({
      message: "Message sent successfully",
      chatMessage,
      chatId: chat.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid input data", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Send message error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

