import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { parse } from "papaparse";

/**
 * Bulk upload valuers from CSV
 * Admin only
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "Only admins can bulk upload valuers" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();

    // Parse CSV
    const parseResult = parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { message: "CSV parsing error", errors: parseResult.errors },
        { status: 400 }
      );
    }

    const rows = parseResult.data as any[];
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Validate required fields
        if (!row["Valuer Name"] || !row["Phone Number"] || !row["WhatsApp Number"] || 
            !row["Registration Number"] || !row["Registration Expiry Date"] || 
            !row["State"] || !row["District"] || !row["City"] || !row["Address"]) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Check if phone number already exists
        const existingPhone = await prisma.valuer.findUnique({
          where: { phoneNumber: row["Phone Number"].toString().trim() },
        });

        if (existingPhone) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Phone number already exists`);
          continue;
        }

        // Check if registration number already exists
        const existingReg = await prisma.valuer.findUnique({
          where: { registrationNumber: row["Registration Number"].toString().trim() },
        });

        if (existingReg) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Registration number already exists`);
          continue;
        }

        // Parse expiry date
        const expiryDate = new Date(row["Registration Expiry Date"]);
        if (isNaN(expiryDate.getTime())) {
          results.failed++;
          results.errors.push(`Row ${i + 2}: Invalid registration expiry date`);
          continue;
        }

        // Create valuer
        await prisma.valuer.create({
          data: {
            valuerName: row["Valuer Name"].toString().trim(),
            phoneNumber: row["Phone Number"].toString().trim(),
            whatsappNumber: row["WhatsApp Number"].toString().trim(),
            registrationNumber: row["Registration Number"].toString().trim(),
            registrationExpiryDate: expiryDate,
            state: row["State"].toString().trim(),
            district: row["District"].toString().trim(),
            city: row["City"].toString().trim(),
            address: row["Address"].toString().trim(),
            pincode: row["Pincode"] ? row["Pincode"].toString().trim() : null,
            isActive: row["Is Active"]?.toString().toLowerCase() !== "false",
          },
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${error.message || "Unknown error"}`);
      }
    }

    return NextResponse.json({
      message: `Bulk upload completed. ${results.success} successful, ${results.failed} failed.`,
      results,
    });
  } catch (error: any) {
    console.error("Bulk upload valuers error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}



