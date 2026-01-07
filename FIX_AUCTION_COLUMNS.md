# Fix Missing Auction Columns

## Problem
The `rejectionReason` and `approvalDeadline` columns are missing from the Auction table in the database, causing approval errors.

## Solution: Add Missing Columns via SQL

### Step 1: Run SQL to Add Columns

Open your PostgreSQL client (pgAdmin, DBeaver, or psql) and run:

```sql
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
```

**Expected Result**: Should return 2 rows showing both columns.

### Step 2: Sync Prisma Schema

After running SQL:

```bash
npx prisma db pull
npx prisma generate
```

### Step 3: Verify Schema

Check that `prisma/schema.prisma` now includes:
- `rejectionReason String?`
- `approvalDeadline DateTime?`

### Step 4: Test Approval

Try approving a vehicle again - it should work now.

## Quick SQL Script

You can also use the file `ADD_MISSING_AUCTION_COLUMNS.sql` I created - just run it in your database client.




























