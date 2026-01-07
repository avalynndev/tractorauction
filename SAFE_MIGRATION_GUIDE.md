# Safe Migration Guide - Adding Reference Numbers

## ⚠️ IMPORTANT: Do NOT Reset Database

If Prisma asks to reset the database, **DO NOT PROCEED** if you have important data.

## Safe Migration Methods

### Method 1: Create Migration File (Recommended)

This creates a migration file that adds the columns safely:

```bash
# Create a new migration (this will NOT delete data)
npx prisma migrate dev --name add_reference_numbers --create-only
```

This will:
- Create a migration file in `prisma/migrations/`
- NOT apply it yet (so you can review it)
- NOT delete any data

Then review the migration file, and if it looks correct:

```bash
# Apply the migration
npx prisma migrate dev
```

### Method 2: Use db push (Quick but no migration history)

If you're in development and don't need migration history:

```bash
# This syncs schema without creating migration files
npx prisma db push
```

### Method 3: Manual SQL (Safest for production)

If you want maximum control, add the columns manually:

```sql
-- Add referenceNumber to Vehicle table
ALTER TABLE "Vehicle" 
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_referenceNumber_key" 
ON "Vehicle"("referenceNumber") 
WHERE "referenceNumber" IS NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Vehicle_referenceNumber_idx" 
ON "Vehicle"("referenceNumber");

-- Add referenceNumber to Auction table
ALTER TABLE "Auction" 
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;

-- Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "Auction_referenceNumber_key" 
ON "Auction"("referenceNumber") 
WHERE "referenceNumber" IS NOT NULL;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS "Auction_referenceNumber_idx" 
ON "Auction"("referenceNumber");
```

After running SQL, regenerate Prisma client:

```bash
npx prisma generate
```

## Why Prisma Might Ask to Reset

Prisma asks to reset when:
1. There's a schema drift (database doesn't match schema)
2. You're using `migrate dev` for the first time
3. There are conflicting migrations

## What to Do If You See the Reset Prompt

1. **Type 'N' (No)** - Do not proceed
2. Check your database connection
3. Use one of the safe methods above
4. If unsure, backup your database first

## Database Backup (Before Any Migration)

Always backup before migrations in production:

```bash
# PostgreSQL backup
pg_dump -h localhost -U your_user -d your_database > backup.sql

# Or using Prisma
npx prisma db pull  # This creates a backup of your current schema
```

## Recommended Approach for Your Situation

Since you're adding new columns (not modifying existing ones), use:

```bash
# Step 1: Create migration file only (review first)
npx prisma migrate dev --name add_reference_numbers --create-only

# Step 2: Review the generated SQL in prisma/migrations/[timestamp]_add_reference_numbers/migration.sql

# Step 3: If it looks correct, apply it
npx prisma migrate dev

# Step 4: Generate Prisma client
npx prisma generate

# Step 5: Generate reference numbers for existing records
# Use the API endpoint or migration script
```

## Verification

After migration, verify:

```sql
-- Check that columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('Vehicle', 'Auction') 
AND column_name = 'referenceNumber';

-- Should show:
-- Vehicle | referenceNumber | text | YES
-- Auction | referenceNumber | text | YES
```




























