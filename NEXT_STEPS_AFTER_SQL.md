# Next Steps After Adding Columns

## ✅ Step 1 Complete: Columns Added Successfully!

You've verified that the `referenceNumber` columns exist in both `Vehicle` and `Auction` tables.

## Step 2: Sync Prisma with Database

Now we need to tell Prisma about these new columns:

```bash
# This pulls the current database schema into Prisma
npx prisma db pull

# Regenerate Prisma client to use the new columns
npx prisma generate
```

**What this does:**
- `db pull` - Reads your database structure and updates `schema.prisma`
- `generate` - Creates the Prisma client with the new fields

**Expected output:**
- You should see "Prisma schema pulled from database"
- Then "Generated Prisma Client"

## Step 3: Generate Reference Numbers for Existing Records

Now generate reference numbers for vehicles and auctions that already exist:

### Option A: Using the Migration Script (Recommended)

```bash
npx tsx scripts/migrate-reference-numbers.ts
```

**What this does:**
- Finds all vehicles without reference numbers
- Finds all auctions without reference numbers
- Generates unique reference numbers for each
- Updates the database

**Expected output:**
```
Starting reference number migration...
Found X vehicles without reference numbers
Updated vehicle abc123 with reference number VH-2025-0001
...
Updated X vehicles
Found Y auctions without reference numbers
Updated auction xyz789 with reference number AU-2025-0001
...
Updated Y auctions
✅ Migration completed successfully!
```

### Option B: Using the API Endpoint

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Login as admin** in your application

3. **Make a POST request** to generate reference numbers:
   - Use Postman, curl, or browser console
   - Endpoint: `POST /api/admin/generate-reference-numbers`
   - Headers: `Authorization: Bearer <your_admin_token>`

   **Using curl:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/generate-reference-numbers \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
   ```

## Step 4: Verify Reference Numbers Were Generated

### Check in Database:

```sql
-- Check vehicles with reference numbers
SELECT id, "referenceNumber", "tractorBrand", "status" 
FROM "Vehicle" 
WHERE "referenceNumber" IS NOT NULL 
LIMIT 10;

-- Check auctions with reference numbers
SELECT id, "referenceNumber", "vehicleId", "status" 
FROM "Auction" 
WHERE "referenceNumber" IS NOT NULL 
LIMIT 10;
```

**Expected result:**
- You should see reference numbers like `VH-2025-0001`, `VH-2025-0002`, etc.
- And auction numbers like `AU-2025-0001`, `AU-2025-0002`, etc.

### Check in Application:

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Login as admin** and go to `/admin`

3. **Check vehicle cards** - you should see reference numbers displayed

4. **Click on a vehicle** to view details - reference number should be shown

## Step 5: Test New Approvals

Test that new vehicles get reference numbers automatically:

1. **Create a test vehicle** (or use existing pending vehicle)

2. **Approve it as admin**

3. **Check that it got a reference number:**
   - Should see `VH-2025-XXXX` format
   - If it's an auction type, should also see `AU-2025-XXXX`

## Troubleshooting

### Issue: "Cannot find module 'tsx'"
**Solution:**
```bash
npm install -D tsx
```

### Issue: "Prisma Client not generated"
**Solution:**
```bash
npx prisma generate
```

### Issue: Reference numbers not showing in UI
**Solution:**
- Make sure you ran `npx prisma generate` after `db pull`
- Restart your dev server
- Clear browser cache

### Issue: Script fails with database error
**Solution:**
- Check your `.env` file has correct `DATABASE_URL`
- Make sure database is running
- Verify you have write permissions

## Summary Checklist

- [x] SQL executed successfully (2 rows returned)
- [ ] Run `npx prisma db pull`
- [ ] Run `npx prisma generate`
- [ ] Run migration script or API to generate reference numbers
- [ ] Verify reference numbers in database
- [ ] Verify reference numbers in admin panel
- [ ] Test approving a new vehicle

## What Happens Next

After completing these steps:

1. **All existing vehicles** will have reference numbers (VH-YYYY-XXXX)
2. **All existing auctions** will have reference numbers (AU-YYYY-XXXX)
3. **New vehicles** approved by admin will automatically get reference numbers
4. **New auctions** created will automatically get reference numbers
5. **Reference numbers** will be displayed in admin panel and details pages

You're all set! 🎉




























