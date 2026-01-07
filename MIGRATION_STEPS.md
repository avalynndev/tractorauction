# Reference Numbers Migration Steps

## Step 1: Update Database Schema

Run the Prisma migration to add the `referenceNumber` fields:

```bash
npx prisma migrate dev --name add_reference_numbers
```

This will:
- Add `referenceNumber` field to `Vehicle` model (nullable, unique)
- Add `referenceNumber` field to `Auction` model (nullable, unique)
- Add indexes on both fields for fast lookups

## Step 2: Generate Prisma Client

After migration, regenerate the Prisma client:

```bash
npx prisma generate
```

## Step 3: Generate Reference Numbers for Existing Records

You have two options:

### Option A: Using the API Endpoint (Recommended)

1. Login as admin
2. Make a POST request to:
   ```
   POST /api/admin/generate-reference-numbers
   Authorization: Bearer <admin_token>
   ```

### Option B: Using the Migration Script

Run the migration script:

```bash
npx tsx scripts/migrate-reference-numbers.ts
```

This script will:
- Find all vehicles without reference numbers
- Find all auctions without reference numbers
- Generate reference numbers grouped by year
- Update the database

## Step 4: Verify Migration

1. Check that vehicles have reference numbers:
   ```sql
   SELECT COUNT(*) FROM "Vehicle" WHERE "referenceNumber" IS NULL;
   ```
   Should return 0.

2. Check that auctions have reference numbers:
   ```sql
   SELECT COUNT(*) FROM "Auction" WHERE "referenceNumber" IS NULL;
   ```
   Should return 0.

3. Check for uniqueness:
   ```sql
   SELECT "referenceNumber", COUNT(*) 
   FROM "Vehicle" 
   WHERE "referenceNumber" IS NOT NULL 
   GROUP BY "referenceNumber" 
   HAVING COUNT(*) > 1;
   ```
   Should return no rows.

## Step 5: Test New Approvals

1. Create a new vehicle listing
2. Approve it as admin
3. Verify that:
   - Vehicle gets a reference number (VH-YYYY-XXXX)
   - If it's an auction type, auction gets a reference number (AU-YYYY-XXXX)

## Step 6: Verify UI Display

1. Check admin panel - reference numbers should be visible
2. Check vehicle details modal - reference numbers should be displayed
3. Check auction pages - reference numbers should be shown

## Troubleshooting

### Issue: Migration fails with "column already exists"
- The migration may have already run
- Check if the columns exist: `SELECT * FROM "Vehicle" LIMIT 1;`
- If columns exist, skip Step 1

### Issue: Reference numbers not generating
- Check that the utility functions are working
- Verify database connection
- Check console logs for errors

### Issue: Duplicate reference numbers
- This should not happen due to unique constraints
- If it does, check the generation logic
- Manually fix duplicates if needed

## Rollback (if needed)

If you need to rollback:

```sql
ALTER TABLE "Vehicle" DROP COLUMN IF EXISTS "referenceNumber";
ALTER TABLE "Auction" DROP COLUMN IF EXISTS "referenceNumber";
```

Then revert the Prisma schema and run migration again.




























