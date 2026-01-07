-- Migration: Add profilePhoto field to User table
-- Run this SQL script to add profile photo support

-- Add profilePhoto column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;

-- Add index for faster queries (optional)
-- CREATE INDEX IF NOT EXISTS "User_profilePhoto_idx" ON "User"("profilePhoto");

-- Note: After running this migration, update prisma/schema.prisma to include:
-- profilePhoto String?


























