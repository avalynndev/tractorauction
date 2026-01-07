import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/**
 * @swagger
 * /api/watchlist:
 *   get:
 *     tags:
 *       - Watchlist
 *     summary: Get user's watchlist
 *     description: Retrieve all vehicles in the user's watchlist
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Watchlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 watchlist:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       vehicleId:
 *                         type: string
 *                       vehicle:
 *                         $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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

    const watchlist = await prisma.watchlistItem.findMany({
      where: { userId: decoded.userId },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                city: true,
                state: true,
              },
            },
            auction: {
              select: {
                id: true,
                status: true,
                currentBid: true,
                endTime: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ watchlist });
  } catch (error) {
    console.error("Get watchlist error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/watchlist:
 *   post:
 *     tags:
 *       - Watchlist
 *     summary: Add vehicle to watchlist
 *     description: Add a vehicle to the user's watchlist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 example: "cm1234567890"
 *     responses:
 *       200:
 *         description: Vehicle added to watchlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 watchlistItem:
 *                   type: object
 *       400:
 *         description: Vehicle already in watchlist or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
    const { vehicleId } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Check if already in watchlist
    const existing = await prisma.watchlistItem.findUnique({
      where: {
        userId_vehicleId: {
          userId: decoded.userId,
          vehicleId: vehicleId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Vehicle already in watchlist" },
        { status: 400 }
      );
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId: decoded.userId,
        vehicleId: vehicleId,
        lastKnownPrice: vehicle.saleAmount || vehicle.basePrice || null,
      },
      include: {
        vehicle: {
          include: {
            seller: {
              select: {
                id: true,
                fullName: true,
                city: true,
                state: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Added to watchlist",
      watchlistItem,
    });
  } catch (error) {
    console.error("Add to watchlist error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/watchlist:
 *   delete:
 *     tags:
 *       - Watchlist
 *     summary: Remove vehicle from watchlist
 *     description: Remove a vehicle from the user's watchlist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID to remove from watchlist
 *     responses:
 *       200:
 *         description: Vehicle removed from watchlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function DELETE(request: NextRequest) {
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
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json(
        { message: "Vehicle ID is required" },
        { status: 400 }
      );
    }

    // Remove from watchlist
    await prisma.watchlistItem.deleteMany({
      where: {
        userId: decoded.userId,
        vehicleId: vehicleId,
      },
    });

    return NextResponse.json({
      message: "Removed from watchlist",
    });
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}











