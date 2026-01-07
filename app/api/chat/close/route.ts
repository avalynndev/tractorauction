import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Close or resolve a chat (admin only)
 */
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { chatId, status } = body;

    if (!chatId || !status) {
      return NextResponse.json(
        { message: "Chat ID and status are required" },
        { status: 400 }
      );
    }

    if (!["OPEN", "CLOSED", "RESOLVED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status" },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { status: status as "OPEN" | "CLOSED" | "RESOLVED" },
    });

    return NextResponse.json({
      message: "Chat status updated successfully",
      chat,
    });
  } catch (error) {
    console.error("Close chat error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


























