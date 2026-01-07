import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * Test endpoint to verify Escrow model and database table
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Admin only" },
        { status: 403 }
      );
    }

    const results: any = {
      prismaClientCheck: {},
      databaseCheck: {},
      modelCheck: {},
    };

    // 1. Check if escrow exists in Prisma client
    try {
      const hasEscrow = "escrow" in prisma;
      results.prismaClientCheck = {
        hasEscrowProperty: hasEscrow,
        prismaClientType: typeof prisma,
        prismaKeys: Object.keys(prisma).filter(k => !k.startsWith("_")),
      };
    } catch (e: any) {
      results.prismaClientCheck = { error: e.message };
    }

    // 2. Check if we can access the escrow model
    try {
      const escrowModel = (prisma as any).escrow;
      results.modelCheck = {
        exists: typeof escrowModel !== "undefined",
        type: typeof escrowModel,
        hasFindMany: typeof escrowModel?.findMany === "function",
      };
    } catch (e: any) {
      results.modelCheck = { error: e.message };
    }

    // 3. Try to query the database
    try {
      const count = await (prisma as any).escrow.count();
      results.databaseCheck = {
        success: true,
        tableExists: true,
        recordCount: count,
      };
    } catch (e: any) {
      results.databaseCheck = {
        success: false,
        tableExists: false,
        error: e.message,
        errorCode: e.code,
        errorName: e.name,
      };
    }

    return NextResponse.json({
      message: "Escrow test results",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Escrow test error:", error);
    return NextResponse.json(
      {
        message: "Test failed",
        error: error.message,
        errorCode: error.code,
        errorName: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

























