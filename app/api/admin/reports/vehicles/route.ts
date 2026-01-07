import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

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
    const groupBy = searchParams.get("groupBy") || "status"; // status, type, state, brand

    let reportData: any = {};

    switch (groupBy) {
      case "status":
        const statusCounts = await prisma.vehicle.groupBy({
          by: ["status"],
          _count: { id: true },
        });
        reportData = statusCounts.map(item => ({
          category: item.status,
          count: item._count.id,
        }));
        break;

      case "type":
        const typeCounts = await prisma.vehicle.groupBy({
          by: ["vehicleType"],
          _count: { id: true },
        });
        reportData = typeCounts.map(item => ({
          category: item.vehicleType.replace("_", " "),
          count: item._count.id,
        }));
        break;

      case "state":
        const stateCounts = await prisma.vehicle.groupBy({
          by: ["state"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        });
        reportData = stateCounts.map(item => ({
          category: item.state,
          count: item._count.id,
        }));
        break;

      case "brand":
        const brandCounts = await prisma.vehicle.groupBy({
          by: ["tractorBrand"],
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: 10,
        });
        reportData = brandCounts.map(item => ({
          category: item.tractorBrand,
          count: item._count.id,
        }));
        break;

      case "saleType":
        const saleTypeCounts = await prisma.vehicle.groupBy({
          by: ["saleType"],
          _count: { id: true },
        });
        reportData = saleTypeCounts.map(item => ({
          category: item.saleType,
          count: item._count.id,
        }));
        break;

      default:
        reportData = [];
    }

    // Get rejection reasons
    const rejectedVehicles = await prisma.vehicle.findMany({
      where: { status: "REJECTED" },
      select: { id: true, createdAt: true },
    });

    // Get vehicles by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const vehiclesByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        COUNT(*)::bigint as count
      FROM "Vehicle"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `;

    const monthlyData = vehiclesByMonth.map(item => ({
      month: item.month,
      count: Number(item.count),
    }));

    return NextResponse.json({
      groupBy,
      data: reportData,
      monthlyTrend: monthlyData,
      totalRejected: rejectedVehicles.length,
    });
  } catch (error) {
    console.error("Error fetching vehicle reports:", error);
    return NextResponse.json(
      { message: "Internal server error", error: String(error) },
      { status: 500 }
    );
  }
}




























