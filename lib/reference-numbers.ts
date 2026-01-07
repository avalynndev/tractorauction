import { prisma } from "@/lib/prisma";

/**
 * Generate a unique vehicle reference number
 * Format: VH-YYYY-XXXX (e.g., VH-2025-0001)
 */
export async function generateVehicleReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `VH-${year}-`;

  // Find the highest existing reference number for this year
  const vehicles = await prisma.vehicle.findMany({
    where: {
      referenceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      referenceNumber: "desc",
    },
    take: 1,
  });

  let nextNumber = 1;

  if (vehicles.length > 0 && vehicles[0].referenceNumber) {
    // Extract the number part (e.g., "0001" from "VH-2025-0001")
    const lastRef = vehicles[0].referenceNumber;
    const lastNumberStr = lastRef.replace(prefix, "");
    const lastNumber = parseInt(lastNumberStr, 10);
    
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format with leading zeros (4 digits)
  const referenceNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;

  // Double-check uniqueness (race condition protection)
  // Use findFirst instead of findUnique since @unique might not be recognized yet
  const existing = await prisma.vehicle.findFirst({
    where: { referenceNumber },
  });

  if (existing) {
    // If somehow it exists, try next number
    return generateVehicleReferenceNumber();
  }

  return referenceNumber;
}

/**
 * Generate a unique auction reference number
 * Format: AU-YYYY-XXXX (e.g., AU-2025-0001)
 */
export async function generateAuctionReferenceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AU-${year}-`;

  // Find the highest existing reference number for this year
  const auctions = await prisma.auction.findMany({
    where: {
      referenceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      referenceNumber: "desc",
    },
    take: 1,
  });

  let nextNumber = 1;

  if (auctions.length > 0 && auctions[0].referenceNumber) {
    // Extract the number part (e.g., "0001" from "AU-2025-0001")
    const lastRef = auctions[0].referenceNumber;
    const lastNumberStr = lastRef.replace(prefix, "");
    const lastNumber = parseInt(lastNumberStr, 10);
    
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  // Format with leading zeros (4 digits)
  const referenceNumber = `${prefix}${nextNumber.toString().padStart(4, "0")}`;

  // Double-check uniqueness (race condition protection)
  // Use findFirst instead of findUnique since @unique might not be recognized yet
  const existing = await prisma.auction.findFirst({
    where: { referenceNumber },
  });

  if (existing) {
    // If somehow it exists, try next number
    return generateAuctionReferenceNumber();
  }

  return referenceNumber;
}

/**
 * Generate reference numbers for existing records (migration helper)
 */
export async function generateReferenceNumbersForExistingRecords() {
  // Generate for vehicles without reference numbers
  const vehiclesWithoutRef = await prisma.vehicle.findMany({
    where: {
      referenceNumber: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const vehicle of vehiclesWithoutRef) {
    const refNumber = await generateVehicleReferenceNumber();
    await prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { referenceNumber: refNumber },
    });
  }

  // Generate for auctions without reference numbers
  const auctionsWithoutRef = await prisma.auction.findMany({
    where: {
      referenceNumber: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  for (const auction of auctionsWithoutRef) {
    const refNumber = await generateAuctionReferenceNumber();
    await prisma.auction.update({
      where: { id: auction.id },
      data: { referenceNumber: refNumber },
    });
  }

  return {
    vehiclesUpdated: vehiclesWithoutRef.length,
    auctionsUpdated: auctionsWithoutRef.length,
  };
}

