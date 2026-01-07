# Step-by-Step Guide: How to Run SQL in Your Database

## Step 1: Running SQL to Add Reference Number Columns

### Method 1: Using pgAdmin (GUI - Easiest)

1. **Open pgAdmin**
   - If you don't have it, download from: https://www.pgadmin.org/download/

2. **Connect to Your Database**
   - In the left panel, expand "Servers"
   - Expand your server (usually "PostgreSQL 15" or similar)
   - Expand "Databases"
   - Find and expand your database (e.g., "tractorauction" or whatever you named it)
   - Right-click on your database → "Query Tool"

3. **Open the SQL File**
   - In the Query Tool window, click "Open File" button (folder icon)
   - Navigate to your project folder
   - Select `ADD_REFERENCE_COLUMNS.sql`
   - Or copy-paste the SQL from the file

4. **Execute the SQL**
   - Click the "Execute" button (play icon) or press F5
   - You should see "Success" message
   - Check the output panel at the bottom

5. **Verify**
   - Run this query to verify:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('Vehicle', 'Auction') 
   AND column_name = 'referenceNumber';
   ```
   - You should see 2 rows returned

---

### Method 2: Using DBeaver (Free GUI Tool)

1. **Download and Install DBeaver**
   - Download from: https://dbeaver.io/download/
   - Install and open DBeaver

2. **Connect to Your Database**
   - Click "New Database Connection" (plug icon)
   - Select "PostgreSQL"
   - Enter connection details:
     - Host: `localhost`
     - Port: `5432` (default)
     - Database: Your database name
     - Username: Your PostgreSQL username
     - Password: Your PostgreSQL password
   - Click "Test Connection" → "Finish"

3. **Open SQL Editor**
   - Right-click on your database connection
   - Select "SQL Editor" → "New SQL Script"
   - Or press Ctrl+` (backtick)

4. **Run the SQL**
   - Open `ADD_REFERENCE_COLUMNS.sql` file
   - Copy all SQL commands
   - Paste into DBeaver SQL editor
   - Click "Execute SQL Script" button (or press Ctrl+Enter)
   - Check the "Log" tab for success messages

---

### Method 3: Using Command Line (psql)

1. **Open Command Prompt or Terminal**
   - Windows: Press Win+R, type `cmd`, press Enter
   - Mac/Linux: Open Terminal

2. **Connect to PostgreSQL**
   ```bash
   psql -h localhost -U your_username -d your_database_name
   ```
   
   Example:
   ```bash
   psql -h localhost -U postgres -d tractorauction
   ```
   
   - It will ask for password (type it and press Enter)
   - You should see: `your_database_name=#`

3. **Run the SQL File**
   ```bash
   \i ADD_REFERENCE_COLUMNS.sql
   ```
   
   Or if the file is in a different location:
   ```bash
   \i "D:\www.tractorauction.in\ADD_REFERENCE_COLUMNS.sql"
   ```

4. **Or Copy-Paste SQL Directly**
   - Open `ADD_REFERENCE_COLUMNS.sql` in a text editor
   - Copy all the SQL commands
   - Paste into the psql terminal
   - Press Enter to execute

5. **Verify**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name IN ('Vehicle', 'Auction') 
   AND column_name = 'referenceNumber';
   ```

6. **Exit psql**
   ```bash
   \q
   ```

---

### Method 4: Using VS Code with PostgreSQL Extension

1. **Install PostgreSQL Extension**
   - Open VS Code
   - Go to Extensions (Ctrl+Shift+X)
   - Search for "PostgreSQL" by Chris Kolkman
   - Install it

2. **Connect to Database**
   - Press Ctrl+Shift+P
   - Type "PostgreSQL: Add Connection"
   - Enter your database details:
     - Host: `localhost`
     - Port: `5432`
     - Database: Your database name
     - Username: Your username
     - Password: Your password

3. **Run SQL**
   - Open `ADD_REFERENCE_COLUMNS.sql` in VS Code
   - Right-click in the SQL file
   - Select "Execute Query"
   - Or press Ctrl+Alt+E

---

### Method 5: Using Prisma Studio (Limited)

1. **Open Prisma Studio**
   ```bash
   npx prisma studio
   ```
   - This opens a browser window at http://localhost:5555

2. **Note**: Prisma Studio doesn't have a direct SQL editor
   - You'll need to use one of the other methods above
   - Or use Prisma Studio just to verify data after running SQL

---

## What the SQL Does (Line by Line)

Let me explain what each part of the SQL does:

```sql
-- This adds a new column called "referenceNumber" to the Vehicle table
-- IF NOT EXISTS means it won't error if the column already exists
ALTER TABLE "Vehicle" 
ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;
```

```sql
-- This creates a unique constraint on referenceNumber
-- The WHERE clause means only non-null values must be unique
-- This allows multiple NULL values (which is what we want initially)
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_referenceNumber_key" 
ON "Vehicle"("referenceNumber") 
WHERE "referenceNumber" IS NOT NULL;
```

```sql
-- This creates an index for fast searching/lookup by referenceNumber
CREATE INDEX IF NOT EXISTS "Vehicle_referenceNumber_idx" 
ON "Vehicle"("referenceNumber");
```

The same pattern is repeated for the Auction table.

---

## Verification Queries

After running the SQL, verify it worked:

### Check if columns exist:
```sql
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('Vehicle', 'Auction') 
AND column_name = 'referenceNumber';
```

**Expected Result**: Should return 2 rows:
- Row 1: Vehicle | referenceNumber | text | YES
- Row 2: Auction | referenceNumber | text | YES

### Check if indexes were created:
```sql
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE tablename IN ('Vehicle', 'Auction') 
AND indexname LIKE '%referenceNumber%';
```

**Expected Result**: Should return 4 rows (2 unique indexes + 2 regular indexes)

### Check current data (should all be NULL initially):
```sql
-- Check Vehicle table
SELECT id, "referenceNumber", "tractorBrand" 
FROM "Vehicle" 
LIMIT 5;

-- Check Auction table
SELECT id, "referenceNumber", "vehicleId" 
FROM "Auction" 
LIMIT 5;
```

**Expected Result**: All `referenceNumber` values should be `NULL` (empty)

---

## Troubleshooting

### Error: "permission denied"
- Your database user doesn't have ALTER TABLE permission
- Solution: Connect as a user with admin privileges (usually `postgres`)

### Error: "relation does not exist"
- Table names are case-sensitive in PostgreSQL
- Make sure you're using exact table names: `"Vehicle"` and `"Auction"` (with quotes and capital letters)

### Error: "column already exists"
- This is actually fine! The `IF NOT EXISTS` clause should prevent this
- If you see this, the column was already added - you can proceed

### Error: "syntax error"
- Make sure you're copying the entire SQL file
- Check for any missing quotes or semicolons
- Try running each ALTER TABLE command separately

---

## Next Steps After Running SQL

Once SQL is executed successfully:

1. **Sync Prisma with Database**:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

2. **Generate Reference Numbers**:
   ```bash
   npx tsx scripts/migrate-reference-numbers.ts
   ```

3. **Test the Application**:
   - Start your dev server
   - Approve a vehicle as admin
   - Check that it gets a reference number

---

## Quick Reference: SQL Commands Summary

```sql
-- Add columns (safe, won't delete data)
ALTER TABLE "Vehicle" ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;
ALTER TABLE "Auction" ADD COLUMN IF NOT EXISTS "referenceNumber" TEXT;

-- Add unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_referenceNumber_key" 
ON "Vehicle"("referenceNumber") WHERE "referenceNumber" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Auction_referenceNumber_key" 
ON "Auction"("referenceNumber") WHERE "referenceNumber" IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "Vehicle_referenceNumber_idx" ON "Vehicle"("referenceNumber");
CREATE INDEX IF NOT EXISTS "Auction_referenceNumber_idx" ON "Auction"("referenceNumber");
```

That's it! Choose the method that's easiest for you.




























