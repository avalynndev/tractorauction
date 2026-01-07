/**
 * Migration script to generate reference numbers for existing vehicles and auctions
 * 
 * Usage:
 * 1. Run: npx tsx scripts/migrate-reference-numbers.ts
 * 2. Or use the API endpoint: POST /api/admin/generate-reference-numbers
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateVehicleReferenceNumber(year: number, lastNumber: number): Promise<string> {
  const prefix = `VH-${year}-`;
  const nextNumber = lastNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

async function generateAuctionReferenceNumber(year: number, lastNumber: number): Promise<string> {
  const prefix = `AU-${year}-`;
  const nextNumber = lastNumber + 1;
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

async function migrateReferenceNumbers() {
  console.log("Starting reference number migration...");

  try {
    // Get all vehicles without reference numbers, ordered by creation date
    const vehiclesWithoutRef = await prisma.vehicle.findMany({
      where: {
        referenceNumber: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`Found ${vehiclesWithoutRef.length} vehicles without reference numbers`);

    // Group vehicles by year
    const vehiclesByYear = new Map<number, typeof vehiclesWithoutRef>();
    vehiclesWithoutRef.forEach((vehicle) => {
      const year = new Date(vehicle.createdAt).getFullYear();
      if (!vehiclesByYear.has(year)) {
        vehiclesByYear.set(year, []);
      }
      vehiclesByYear.get(year)!.push(vehicle);
    });

    // Generate reference numbers for each year
    let totalVehiclesUpdated = 0;
    for (const [year, vehicles] of vehiclesByYear.entries()) {
      // Find the highest existing reference number for this year
      const existingVehicles = await prisma.vehicle.findMany({
        where: {
          referenceNumber: {
            startsWith: `VH-${year}-`,
          },
        },
        orderBy: {
          referenceNumber: "desc",
        },
        take: 1,
      });

      let lastNumber = 0;
      if (existingVehicles.length > 0 && existingVehicles[0].referenceNumber) {
        const lastRef = existingVehicles[0].referenceNumber;
        const lastNumberStr = lastRef.replace(`VH-${year}-`, "");
        const parsed = parseInt(lastNumberStr, 10);
        if (!isNaN(parsed)) {
          lastNumber = parsed;
        }
      }

      // Generate reference numbers for vehicles in this year
      for (const vehicle of vehicles) {
        lastNumber++;
        const referenceNumber = await generateVehicleReferenceNumber(year, lastNumber - 1);
        
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { referenceNumber },
        });
        
        totalVehiclesUpdated++;
        console.log(`Updated vehicle ${vehicle.id} with reference number ${referenceNumber}`);
      }
    }

    console.log(`\nUpdated ${totalVehiclesUpdated} vehicles`);

    // Get all auctions without reference numbers
    const auctionsWithoutRef = await prisma.auction.findMany({
      where: {
        referenceNumber: null,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`\nFound ${auctionsWithoutRef.length} auctions without reference numbers`);

    // Group auctions by year
    const auctionsByYear = new Map<number, typeof auctionsWithoutRef>();
    auctionsWithoutRef.forEach((auction) => {
      const year = new Date(auction.createdAt).getFullYear();
      if (!auctionsByYear.has(year)) {
        auctionsByYear.set(year, []);
      }
      auctionsByYear.get(year)!.push(auction);
    });

    // Generate reference numbers for each year
    let totalAuctionsUpdated = 0;
    for (const [year, auctions] of auctionsByYear.entries()) {
      // Find the highest existing reference number for this year
      const existingAuctions = await prisma.auction.findMany({
        where: {
          referenceNumber: {
            startsWith: `AU-${year}-`,
          },
        },
        orderBy: {
          referenceNumber: "desc",
        },
        take: 1,
      });

      let lastNumber = 0;
      if (existingAuctions.length > 0 && existingAuctions[0].referenceNumber) {
        const lastRef = existingAuctions[0].referenceNumber;
        const lastNumberStr = lastRef.replace(`AU-${year}-`, "");
        const parsed = parseInt(lastNumberStr, 10);
        if (!isNaN(parsed)) {
          lastNumber = parsed;
        }
      }

      // Generate reference numbers for auctions in this year
      for (const auction of auctions) {
        lastNumber++;
        const referenceNumber = await generateAuctionReferenceNumber(year, lastNumber - 1);
        
        await prisma.auction.update({
          where: { id: auction.id },
          data: { referenceNumber },
        });
        
        totalAuctionsUpdated++;
        console.log(`Updated auction ${auction.id} with reference number ${referenceNumber}`);
      }
    }

    console.log(`\nUpdated ${totalAuctionsUpdated} auctions`);
    console.log("\n✅ Migration completed successfully!");
    console.log(`\nSummary:`);
    console.log(`- Vehicles updated: ${totalVehiclesUpdated}`);
    console.log(`- Auctions updated: ${totalAuctionsUpdated}`);

  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateReferenceNumbers()
  .then(() => {
    console.log("\nMigration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration script failed:", error);
    process.exit(1);
  });




























