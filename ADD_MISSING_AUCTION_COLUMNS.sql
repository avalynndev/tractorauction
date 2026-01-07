-- Add missing columns to Auction table
-- This includes rejectionReason and approvalDeadline that were added to schema

-- Add rejectionReason column (if it doesn't exist)
ALTER TABLE "Auction" 
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Add approvalDeadline column (if it doesn't exist)
ALTER TABLE "Auction" 
ADD COLUMN IF NOT EXISTS "approvalDeadline" TIMESTAMP;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Auction' 
AND column_name IN ('rejectionReason', 'approvalDeadline');




























