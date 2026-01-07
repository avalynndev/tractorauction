-- Migration: Add Advanced Features tables
-- Run this SQL to add watchlist, reviews, shortlist, and recent views functionality

-- Create WatchlistItem table
CREATE TABLE IF NOT EXISTS "WatchlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WatchlistItem_pkey" PRIMARY KEY ("id")
);

-- Create ShortlistedItem table
CREATE TABLE IF NOT EXISTS "ShortlistedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortlistedItem_pkey" PRIMARY KEY ("id")
);

-- Create Review table
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "comment" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- Create RecentView table
CREATE TABLE IF NOT EXISTS "RecentView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentView_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys
DO $$ BEGIN
    ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "WatchlistItem" ADD CONSTRAINT "WatchlistItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShortlistedItem" ADD CONSTRAINT "ShortlistedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ShortlistedItem" ADD CONSTRAINT "ShortlistedItem_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Review" ADD CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RecentView" ADD CONSTRAINT "RecentView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "RecentView" ADD CONSTRAINT "RecentView_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "WatchlistItem_userId_vehicleId_key" ON "WatchlistItem"("userId", "vehicleId");
CREATE INDEX IF NOT EXISTS "WatchlistItem_userId_idx" ON "WatchlistItem"("userId");
CREATE INDEX IF NOT EXISTS "WatchlistItem_vehicleId_idx" ON "WatchlistItem"("vehicleId");

CREATE UNIQUE INDEX IF NOT EXISTS "ShortlistedItem_userId_vehicleId_key" ON "ShortlistedItem"("userId", "vehicleId");
CREATE INDEX IF NOT EXISTS "ShortlistedItem_userId_idx" ON "ShortlistedItem"("userId");
CREATE INDEX IF NOT EXISTS "ShortlistedItem_vehicleId_idx" ON "ShortlistedItem"("vehicleId");

CREATE INDEX IF NOT EXISTS "Review_vehicleId_idx" ON "Review"("vehicleId");
CREATE INDEX IF NOT EXISTS "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX IF NOT EXISTS "Review_rating_idx" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "Review_createdAt_idx" ON "Review"("createdAt");

CREATE INDEX IF NOT EXISTS "RecentView_userId_idx" ON "RecentView"("userId");
CREATE INDEX IF NOT EXISTS "RecentView_vehicleId_idx" ON "RecentView"("vehicleId");
CREATE INDEX IF NOT EXISTS "RecentView_viewedAt_idx" ON "RecentView"("viewedAt");


























