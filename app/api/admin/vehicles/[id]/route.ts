import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Resolve params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;

    // Get vehicle details
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: resolvedParams.id },
      include: {
        seller: {
          select: {
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            address: true,
            city: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    // Resolve params if it's a Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;

    const existing = await prisma.vehicle.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 }
      );
    }

    // Do not allow editing SOLD vehicles
    if (existing.status === "SOLD") {
      return NextResponse.json(
        { message: "Cannot edit a SOLD vehicle" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const data: any = {};

    // Simple string fields
    const stringFields = [
      "vehicleType",
      "saleType",
      "tractorBrand",
      "tractorModel",
      "engineHP",
      "registrationNumber",
      "engineNumber",
      "chassisNumber",
      "hoursRun",
      "state",
      "runningCondition",
      "insuranceStatus",
      "rcCopyStatus",
      "rcCopyType",
      "financeNocPapers",
      "readyForToken",
      "clutchType",
      "drive",
      "steering",
      "tyreBrand",
      "otherFeatures",
    ];

    stringFields.forEach((field) => {
      if (field in body) {
        const value = body[field];
        data[field] = value === "" ? null : String(value);
      }
    });

    // Numeric fields
    if ("saleAmount" in body) {
      const v = Number(body.saleAmount);
      if (isNaN(v) || v < 0) {
        return NextResponse.json(
          { message: "Invalid saleAmount" },
          { status: 400 }
        );
      }
      data.saleAmount = v;
    }

    if ("basePrice" in body) {
      const v = body.basePrice === null || body.basePrice === ""
        ? null
        : Number(body.basePrice);
      if (v !== null && (isNaN(v) || v < 0)) {
        return NextResponse.json(
          { message: "Invalid basePrice" },
          { status: 400 }
        );
      }
      data.basePrice = v;
    }

    if ("yearOfMfg" in body || "yearOfMfg".toLowerCase() in body) {
      const raw = body.yearOfMfg ?? body.yearofmfg ?? body.yearOfmfg;
      const v = parseInt(raw, 10);
      if (isNaN(v) || v < 2000 || v > 2100) {
        return NextResponse.json(
          { message: "Invalid yearOfMfg" },
          { status: 400 }
        );
      }
      data.yearOfMfg = v;
    }

    // Boolean-like fields
    if ("ipto" in body) {
      if (body.ipto === null || body.ipto === "") {
        data.ipto = null;
      } else {
        data.ipto = Boolean(body.ipto);
      }
    }

    // Status can be adjusted (but not to SOLD here)
    if ("status" in body && body.status !== "SOLD") {
      data.status = body.status;
    }

    const updated = await prisma.vehicle.update({
      where: { id: resolvedParams.id },
      data,
      include: {
        seller: {
          select: {
            fullName: true,
            phoneNumber: true,
            whatsappNumber: true,
            address: true,
            city: true,
            district: true,
            state: true,
            pincode: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

