# Database Migration Steps - Detailed Guide

## 📋 Overview

This migration adds:
1. `NotificationPreferences` table - Stores user notification preferences
2. `EmailEvent` table - Stores email tracking events
3. `emailUnsubscribed` field to `User` table

---

## Method 1: Using Prisma (Recommended)

### Step 1: Open Terminal

1. **Open PowerShell** (Windows) or Terminal (Mac/Linux)
2. **Navigate to project:**
   ```bash
   cd D:\www.tractorauction.in
   ```

### Step 2: Check Prisma is Installed

```bash
npx prisma --version
```

Should show version number. If error, install Prisma:
```bash
npm install prisma @prisma/client
```

### Step 3: Verify Database Connection

Check your `.env` file has correct `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tractorauction?schema=public"
```

Test connection:
```bash
npx prisma db pull
```

**Expected**: Should connect and show existing tables

**If Error**: 
- Check PostgreSQL is running
- Verify database credentials
- Check `DATABASE_URL` format

### Step 4: Review Schema File

Open `prisma/schema.prisma` and verify you see:

```prisma
model NotificationPreferences {
  id                    String   @id @default(cuid())
  userId                String   @unique
  vehicleApproved       Boolean  @default(true)
  // ... other fields
}

model EmailEvent {
  id                String   @id @default(cuid())
  userId            String
  email             String
  // ... other fields
}

model User {
  // ... existing fields
  emailUnsubscribed    Boolean      @default(false)
  notificationPreferences NotificationPreferences?
}
```

If you see these, schema is ready.

### Step 5: Generate Prisma Client

This updates Prisma to recognize new models:

```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (X.XX.XX) to .\node_modules\.prisma\client in XXXms
```

**If you see errors:**
- Check schema syntax
- Verify Prisma is installed
- Check Node.js version

### Step 6: Push Schema to Database

This creates the tables:

```bash
npx prisma db push
```

**Expected Output:**
```
✔ Your database is now in sync with your Prisma schema.

The following changes were applied:

  • CreateTable `NotificationPreferences`
  • CreateTable `EmailEvent`
  • AlterTable `User` (add column `emailUnsubscribed`)
```

**If you see "We need to reset the schema" warning:**

⚠️ **DO NOT TYPE 'Y'** - This will delete all your data!

**Instead:**
1. Type `N` to cancel
2. Use Method 2 (SQL) below
3. Or use `--accept-data-loss` flag (only if you're okay losing data)

### Step 7: Verify Migration

**Option A: Using Prisma Studio (Easiest)**

```bash
npx prisma studio
```

This opens browser at `http://localhost:5555`. You should see:
- ✅ `NotificationPreferences` table
- ✅ `EmailEvent` table
- ✅ `User` table (with `emailUnsubscribed` column)

**Option B: Using SQL**

Connect to PostgreSQL and run:

```sql
-- Check NotificationPreferences table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'NotificationPreferences';
-- Should return 1 row

-- Check EmailEvent table
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'EmailEvent';
-- Should return 1 row

-- Check User table column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'emailUnsubscribed';
-- Should return: emailUnsubscribed | boolean | false
```

### Step 8: Test the Migration

1. **Start your server:**
   ```bash
   npm run dev
   ```

2. **Go to**: `http://localhost:3000/my-account`
3. **Click**: "Settings" tab
4. **Check**: "Notification Preferences" section appears
5. **Toggle**: A notification preference
6. **Verify**: No errors, preference saves

---

## Method 2: Using SQL Directly (Alternative)

Use this if `npx prisma db push` asks to reset schema.

### Step 1: Connect to PostgreSQL

**Using psql:**
```bash
psql -U postgres -d tractorauction
```

**Using pgAdmin:**
- Open pgAdmin
- Connect to your database
- Open Query Tool

**Using DBeaver/Other GUI:**
- Connect to database
- Open SQL editor

### Step 2: Run Migration SQL

Copy and paste this SQL:

```sql
-- Step 1: Add emailUnsubscribed to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "emailUnsubscribed" BOOLEAN DEFAULT false;

-- Step 2: Create NotificationPreferences table
CREATE TABLE IF NOT EXISTS "NotificationPreferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vehicleApproved" BOOLEAN NOT NULL DEFAULT true,
  "vehicleRejected" BOOLEAN NOT NULL DEFAULT true,
  "auctionScheduled" BOOLEAN NOT NULL DEFAULT true,
  "auctionStarted" BOOLEAN NOT NULL DEFAULT true,
  "auctionEnded" BOOLEAN NOT NULL DEFAULT true,
  "bidPlaced" BOOLEAN NOT NULL DEFAULT true,
  "bidOutbid" BOOLEAN NOT NULL DEFAULT true,
  "bidApproved" BOOLEAN NOT NULL DEFAULT true,
  "bidRejected" BOOLEAN NOT NULL DEFAULT true,
  "membershipExpiring" BOOLEAN NOT NULL DEFAULT true,
  "membershipExpired" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create unique constraint on userId
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreferences_userId_key" 
ON "NotificationPreferences"("userId");

-- Step 4: Create index on userId
CREATE INDEX IF NOT EXISTS "NotificationPreferences_userId_idx" 
ON "NotificationPreferences"("userId");

-- Step 5: Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'NotificationPreferences_userId_fkey'
  ) THEN
    ALTER TABLE "NotificationPreferences" 
    ADD CONSTRAINT "NotificationPreferences_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Step 6: Create EmailEvent table
CREATE TABLE IF NOT EXISTS "EmailEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "notificationType" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventData" TEXT,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create indexes for EmailEvent
CREATE INDEX IF NOT EXISTS "EmailEvent_userId_idx" 
ON "EmailEvent"("userId");

CREATE INDEX IF NOT EXISTS "EmailEvent_email_idx" 
ON "EmailEvent"("email");

CREATE INDEX IF NOT EXISTS "EmailEvent_notificationType_idx" 
ON "EmailEvent"("notificationType");

CREATE INDEX IF NOT EXISTS "EmailEvent_eventType_idx" 
ON "EmailEvent"("eventType");

CREATE INDEX IF NOT EXISTS "EmailEvent_timestamp_idx" 
ON "EmailEvent"("timestamp");
```

### Step 3: Verify SQL Migration

Run these queries:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('NotificationPreferences', 'EmailEvent')
ORDER BY table_name;

-- Should return 2 rows

-- Check User column
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'emailUnsubscribed';

-- Should return: emailUnsubscribed | boolean | false
```

### Step 4: Sync Prisma with Database

After running SQL, sync Prisma:

```bash
# Pull schema from database
npx prisma db pull

# Generate Prisma client
npx prisma generate
```

This updates Prisma to match your database.

---

## Method 3: Using Prisma Migrate (Advanced)

For production environments with migration history:

```bash
# Create migration file
npx prisma migrate dev --name add_email_features

# Apply migration
npx prisma migrate deploy
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] `NotificationPreferences` table exists
- [ ] `EmailEvent` table exists
- [ ] `User.emailUnsubscribed` column exists
- [ ] All indexes created
- [ ] Foreign keys set up
- [ ] Prisma client generated
- [ ] Server starts without errors
- [ ] Settings tab loads notification preferences
- [ ] Preferences can be toggled and saved

---

## 🔍 Troubleshooting

### Error: "Table already exists"

**Solution**: Tables already created. Continue to next step.

### Error: "Column already exists"

**Solution**: Column already added. Migration partially done. Continue.

### Error: "Can't reach database server"

**Solution**:
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check firewall/network settings
- Test connection: `psql -U postgres -d tractorauction`

### Error: "Permission denied"

**Solution**:
- Check database user has CREATE TABLE permission
- Use superuser (postgres) for migration
- Or grant permissions to your user

### Error: Prisma client out of sync

**Solution**:
```bash
npx prisma generate
```

### Error: Schema drift detected

**Solution**:
```bash
npx prisma db pull
npx prisma generate
```

---

## 📊 Quick Verification Queries

### Check All Tables:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Table Structure:
```sql
-- NotificationPreferences columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'NotificationPreferences'
ORDER BY ordinal_position;

-- EmailEvent columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'EmailEvent'
ORDER BY ordinal_position;
```

### Check Indexes:
```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('NotificationPreferences', 'EmailEvent')
ORDER BY tablename, indexname;
```

---

## 🎉 Migration Complete!

Once verified, your database is ready for advanced email features!

**Next**: Configure SendGrid webhook (see `SENDGRID_WEBHOOK_SETUP.md`)



























