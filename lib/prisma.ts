import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Verify Escrow model is available (for development debugging)
if (process.env.NODE_ENV === "development") {
  // Check if escrow model exists
  if (!("escrow" in prisma)) {
    console.warn(
      "⚠️  WARNING: Escrow model not found in Prisma client. " +
      "Please run: npx prisma generate"
    );
  }
}






