-- Safe SQL script to add referenceNumber columns
-- This will NOT delete any data
-- Run this directly in your PostgreSQL database

-- Add referenceNumber column to Vehicle table (if it doesn't exist)
ALTER TABLE "Vehicle" 
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;

-- Add unique constraint (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_referenceNumber_key" 
ON "Vehicle"("referenceNumber") 
WHERE "referenceNumber" IS NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Vehicle_referenceNumber_idx" 
ON "Vehicle"("referenceNumber");

-- Add referenceNumber column to Auction table (if it doesn't exist)
ALTER TABLE "Auction" 
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;

-- Add unique constraint (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS "Auction_referenceNumber_key" 
ON "Auction"("referenceNumber") 
WHERE "referenceNumber" IS NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Auction_referenceNumber_idx" 
ON "Auction"("referenceNumber");

-- Verify the columns were added
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('Vehicle', 'Auction') 
AND column_name = 'referenceNumber';




























