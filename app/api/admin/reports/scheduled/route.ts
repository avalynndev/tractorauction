import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendReportEmail, isEmailConfigured } from "@/lib/email";

/**
 * Generate and send scheduled reports
 * This endpoint can be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication for cron jobs
    const apiKey = request.headers.get("x-api-key");
    const cronApiKey = process.env.CRON_API_KEY;

    if (cronApiKey && apiKey !== cronApiKey) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const reportType = body.reportType || "overview"; // overview, vehicles, auctions, users
    const emailTo = body.email || process.env.ADMIN_EMAIL || "";

    if (!emailTo) {
      return NextResponse.json(
        { message: "No email address provided" },
        { status: 400 }
      );
    }

    // Fetch report data
    let reportData: any = {};

    if (reportType === "overview") {
      // Fetch overview data (similar to overview endpoint)
      const [
        totalVehicles,
        pendingVehicles,
        approvedVehicles,
        totalAuctions,
        totalUsers,
        totalRevenue,
      ] = await Promise.all([
        prisma.vehicle.count(),
        prisma.vehicle.count({ where: { status: "PENDING" } }),
        prisma.vehicle.count({ where: { status: "APPROVED" } }),
        prisma.auction.count(),
        prisma.user.count(),
        prisma.membership.aggregate({ _sum: { amount: true } }),
      ]);

      reportData = {
        overview: {
          vehicles: {
            total: totalVehicles,
            pending: pendingVehicles,
            approved: approvedVehicles,
          },
          auctions: { total: totalAuctions },
          users: { total: totalUsers },
          activity: {
            totalRevenue: totalRevenue._sum.amount || 0,
          },
        },
      };
    }

    // Send email
    const emailSent = await sendReportEmail(emailTo, reportType, reportData, "summary");

    if (!emailSent && !isEmailConfigured()) {
      return NextResponse.json({
        message: "Email not configured. Report generated but not sent.",
        data: reportData,
      });
    }

    return NextResponse.json({
      message: "Report sent successfully",
      emailSent,
      reportType,
    });
  } catch (error) {
    console.error("Error generating scheduled report:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to manually trigger scheduled report (for testing)
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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Access denied. Admin only." },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "overview";
    const emailTo = searchParams.get("email") || process.env.ADMIN_EMAIL || "";

    if (!emailTo) {
      return NextResponse.json(
        { message: "No email address provided. Add ?email=your@email.com" },
        { status: 400 }
      );
    }

    // Fetch and send report (same as POST)
    const response = await fetch(`${request.nextUrl.origin}/api/admin/reports/scheduled`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CRON_API_KEY || "",
      },
      body: JSON.stringify({ reportType, email: emailTo }),
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error triggering scheduled report:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}

