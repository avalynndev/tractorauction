import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { hasActiveMembership } from "@/lib/membership";

// Dynamic imports for CSV/Excel parsing
let Papa: any;
let XLSX: any;

// Load libraries dynamically
async function loadParsers() {
  try {
    if (!Papa) {
      Papa = (await import("papaparse")).default;
    }
    if (!XLSX) {
      XLSX = await import("xlsx");
    }
  } catch (error: any) {
    console.error("Error loading parsing libraries:", error);
    throw new Error(`Failed to load parsing libraries: ${error.message}`);
  }
}

interface BulkVehicleRow {
  vehicleType: string;
  saleType: string;
  saleAmount: string;
  tractorBrand: string;
  tractorModel?: string;
  engineHP: string;
  yearOfMfg: string;
  registrationNumber?: string;
  engineNumber?: string;
  chassisNumber?: string;
  hoursRun?: string;
  state: string;
  district?: string;
  runningCondition: string;
  insuranceStatus: string;
  rcCopyStatus: string;
  rcCopyType?: string;
  financeNocPapers?: string;
  readyForToken?: string;
  clutchType?: string;
  ipto?: string;
  drive?: string;
  steering?: string;
  tyreBrand?: string;
  otherFeatures?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface BulkUploadResult {
  success: boolean;
  totalRows: number;
  successful: number;
  failed: number;
  errors: ValidationError[];
  vehicleIds?: string[];
}

/**
 * Validate a single vehicle row
 */
function validateVehicleRow(row: any, rowIndex: number): { valid: boolean; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Required fields
  const requiredFields = [
    "vehicleType",
    "saleType",
    "saleAmount",
    "tractorBrand",
    "engineHP",
    "yearOfMfg",
    "state",
    "runningCondition",
    "insuranceStatus",
    "rcCopyStatus",
  ];

  for (const field of requiredFields) {
    if (!row[field] || row[field].toString().trim() === "") {
      errors.push({
        row: rowIndex + 1, // 1-based row number for user
        field,
        message: `${field} is required`,
      });
    }
  }

  // Validate vehicleType
  if (row.vehicleType && !["USED_TRACTOR", "USED_HARVESTER", "SCRAP_TRACTOR"].includes(row.vehicleType)) {
    errors.push({
      row: rowIndex + 1,
      field: "vehicleType",
      message: "vehicleType must be USED_TRACTOR, USED_HARVESTER, or SCRAP_TRACTOR",
    });
  }

  // Validate saleType
  if (row.saleType && !["AUCTION", "PREAPPROVED"].includes(row.saleType)) {
    errors.push({
      row: rowIndex + 1,
      field: "saleType",
      message: "saleType must be AUCTION or PREAPPROVED",
    });
  }

  // Validate saleAmount
  if (row.saleAmount) {
    const amount = parseFloat(row.saleAmount);
    if (isNaN(amount) || amount < 0) {
      errors.push({
        row: rowIndex + 1,
        field: "saleAmount",
        message: "saleAmount must be a valid positive number",
      });
    }
  }

  // Validate yearOfMfg
  if (row.yearOfMfg) {
    const year = parseInt(row.yearOfMfg);
    if (isNaN(year) || year < 2000 || year > 2026) {
      errors.push({
        row: rowIndex + 1,
        field: "yearOfMfg",
        message: "yearOfMfg must be between 2000 and 2026",
      });
    }
  }

  // Validate runningCondition
  if (row.runningCondition && !["Self Start", "Push Start", "Towing"].includes(row.runningCondition)) {
    errors.push({
      row: rowIndex + 1,
      field: "runningCondition",
      message: "runningCondition must be Self Start, Push Start, or Towing",
    });
  }

  // Validate insuranceStatus
  if (row.insuranceStatus && !["Active", "Inactive"].includes(row.insuranceStatus)) {
    errors.push({
      row: rowIndex + 1,
      field: "insuranceStatus",
      message: "insuranceStatus must be Active or Inactive",
    });
  }

  // Validate rcCopyStatus
  if (row.rcCopyStatus && !["Active", "Inactive"].includes(row.rcCopyStatus)) {
    errors.push({
      row: rowIndex + 1,
      field: "rcCopyStatus",
      message: "rcCopyStatus must be Active or Inactive",
    });
  }

  // Validate rcCopyType (if provided)
  if (row.rcCopyType && !["Commercial", "Private"].includes(row.rcCopyType)) {
    errors.push({
      row: rowIndex + 1,
      field: "rcCopyType",
      message: "rcCopyType must be Commercial or Private",
    });
  }

  // Validate financeNocPapers (if provided)
  if (row.financeNocPapers && !["Available", "Not Available"].includes(row.financeNocPapers)) {
    errors.push({
      row: rowIndex + 1,
      field: "financeNocPapers",
      message: "financeNocPapers must be Available or Not Available",
    });
  }

  // Validate readyForToken (if provided)
  const validReadyForToken = ["Yes", "Ready For Token", "Within 15 Days", "Within 10 Days", "Within 5 Days", "Within 2 Days"];
  if (row.readyForToken && !validReadyForToken.includes(row.readyForToken)) {
    errors.push({
      row: rowIndex + 1,
      field: "readyForToken",
      message: `readyForToken must be one of: ${validReadyForToken.join(", ")}`,
    });
  }

  // Validate clutchType (if provided)
  if (row.clutchType && !["Single", "Dual"].includes(row.clutchType)) {
    errors.push({
      row: rowIndex + 1,
      field: "clutchType",
      message: "clutchType must be Single or Dual",
    });
  }

  // Validate ipto (if provided)
  if (row.ipto && !["true", "false", "yes", "no", "1", "0"].includes(row.ipto.toString().toLowerCase())) {
    errors.push({
      row: rowIndex + 1,
      field: "ipto",
      message: "ipto must be true/false, yes/no, or 1/0",
    });
  }

  // Validate drive (if provided)
  if (row.drive && !["2 WD", "4 WD"].includes(row.drive)) {
    errors.push({
      row: rowIndex + 1,
      field: "drive",
      message: "drive must be 2 WD or 4 WD",
    });
  }

  // Validate steering (if provided)
  if (row.steering && !["Mechanical", "Power"].includes(row.steering)) {
    errors.push({
      row: rowIndex + 1,
      field: "steering",
      message: "steering must be Mechanical or Power",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Parse CSV file
 */
async function parseCSV(fileContent: string): Promise<any[]> {
  await loadParsers();
  const result = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
    transform: (value: string) => value.trim(),
  });

  return result.data;
}

/**
 * Parse Excel file
 */
async function parseExcel(fileBuffer: Buffer): Promise<any[]> {
  try {
    await loadParsers();
    if (!XLSX) {
      throw new Error("XLSX library not loaded");
    }
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });
    
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Excel file has no sheets");
    }
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in Excel file`);
    }
    
    const data = XLSX.utils.sheet_to_json(worksheet, {
      defval: "", // Default value for empty cells
      raw: false, // Convert all values to strings
    });

    return data;
  } catch (error: any) {
    console.error("Excel parsing error:", error);
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Convert vehicle row to database format
 */
function convertRowToVehicleData(row: any, sellerId: string) {
  // Parse ipto boolean
  let ipto: boolean | null = null;
  if (row.ipto) {
    const iptoValue = row.ipto.toString().toLowerCase();
    ipto = ["true", "yes", "1"].includes(iptoValue);
  }

  // Parse otherFeatures (semicolon or comma-separated) and convert to string
  let otherFeaturesString: string | null = null;
  if (row.otherFeatures) {
    const featuresString = row.otherFeatures.toString().trim();
    if (featuresString.length > 0) {
      // Handle both semicolon and comma separators
      const featuresArray = featuresString
        .split(/[;,]/)
        .map((f: string) => f.trim())
        .filter((f: string) => f.length > 0);
      
      if (featuresArray.length > 0) {
        // Convert to comma-separated string (matching single upload format)
        otherFeaturesString = featuresArray.join(", ");
      }
    }
  }

  // Parse saleAmount with better error handling
  const saleAmountStr = row.saleAmount?.toString().trim() || "";
  const saleAmount = saleAmountStr ? parseFloat(saleAmountStr) : 0;
  
  if (isNaN(saleAmount) || saleAmount <= 0) {
    throw new Error(`Invalid saleAmount: ${row.saleAmount}. Must be a positive number.`);
  }

  // Parse yearOfMfg with better error handling
  const yearOfMfgStr = row.yearOfMfg?.toString().trim() || "";
  const yearOfMfg = yearOfMfgStr ? parseInt(yearOfMfgStr) : 0;
  
  if (isNaN(yearOfMfg) || yearOfMfg < 2000 || yearOfMfg > 2026) {
    throw new Error(`Invalid yearOfMfg: ${row.yearOfMfg}. Must be between 2000 and 2026.`);
  }

  return {
    sellerId,
    vehicleType: row.vehicleType,
    saleType: row.saleType,
    saleAmount,
    basePrice: saleAmount, // Same as saleAmount for now
    tractorBrand: row.tractorBrand,
    tractorModel: row.tractorModel?.toString().trim() || null,
    engineHP: row.engineHP?.toString().trim() || "",
    yearOfMfg,
    registrationNumber: row.registrationNumber?.toString().trim() || null,
    engineNumber: row.engineNumber?.toString().trim() || null,
    chassisNumber: row.chassisNumber?.toString().trim() || null,
    hoursRun: row.hoursRun?.toString().trim() || null,
    state: row.state?.toString().trim() || "",
    district: row.district?.toString().trim() || null,
    runningCondition: row.runningCondition,
    insuranceStatus: row.insuranceStatus,
    rcCopyStatus: row.rcCopyStatus,
    rcCopyType: row.rcCopyType?.toString().trim() || null,
    financeNocPapers: row.financeNocPapers?.toString().trim() || null,
    readyForToken: row.readyForToken?.toString().trim() || null,
    clutchType: row.clutchType?.toString().trim() || null,
    ipto,
    drive: row.drive?.toString().trim() || null,
    steering: row.steering?.toString().trim() || null,
    tyreBrand: row.tyreBrand?.toString().trim() || null,
    otherFeatures: otherFeaturesString,
    status: row.saleType === "PREAPPROVED" ? "APPROVED" : "PENDING",
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Check membership
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";
    if (!isAdmin) {
      const hasMembership = await hasActiveMembership(decoded.userId);
      if (!hasMembership) {
        return NextResponse.json(
          { message: "You need an active membership to list vehicles. Please subscribe to a membership plan." },
          { status: 403 }
        );
      }
    }

    // Get file from form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ message: "File size too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Read file content
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let rows: any[] = [];

    // Parse file based on extension
    if (fileName.endsWith(".csv")) {
      const fileContent = fileBuffer.toString("utf-8");
      rows = await parseCSV(fileContent);
    } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      rows = await parseExcel(fileBuffer);
    } else {
      return NextResponse.json({ message: "Unsupported file format. Please upload CSV or Excel file." }, { status: 400 });
    }

    if (rows.length === 0) {
      return NextResponse.json({ message: "File is empty or contains no data." }, { status: 400 });
    }

    // Validate all rows
    const allErrors: ValidationError[] = [];
    const validRows: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateVehicleRow(row, i);

      if (validation.valid) {
        validRows.push(row);
      } else {
        allErrors.push(...validation.errors);
      }
    }

    // If there are validation errors, return them
    if (allErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          totalRows: rows.length,
          successful: 0,
          failed: rows.length,
          errors: allErrors,
          message: `Validation failed for ${allErrors.length} field(s) across ${rows.length} row(s). Please fix the errors and try again.`,
        },
        { status: 400 }
      );
    }

    // Create vehicles in database
    const vehicleIds: string[] = [];
    const createdVehicles: any[] = [];
    const creationErrors: ValidationError[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const vehicleData = convertRowToVehicleData(row, decoded.userId);
        const vehicle = await prisma.vehicle.create({
          data: vehicleData,
        });
        vehicleIds.push(vehicle.id);
        createdVehicles.push(vehicle);
      } catch (error: any) {
        console.error(`Error creating vehicle at row ${i + 1}:`, error);
        creationErrors.push({
          row: i + 1, // 1-based row number
          field: "database",
          message: error.message || "Failed to create vehicle",
        });
      }
    }

    // If there were any creation errors, return them
    if (creationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          totalRows: rows.length,
          successful: vehicleIds.length,
          failed: rows.length - vehicleIds.length,
          errors: creationErrors,
          message: `Failed to create ${creationErrors.length} vehicle(s). ${vehicleIds.length} vehicle(s) were created successfully.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      totalRows: rows.length,
      successful: vehicleIds.length,
      failed: 0,
      errors: [],
      vehicleIds,
      message: `Successfully uploaded ${vehicleIds.length} vehicle(s).`,
    });
  } catch (error: any) {
    console.error("Bulk upload error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "An error occurred while processing the file",
        error: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

