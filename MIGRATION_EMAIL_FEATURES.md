# Database Migration: Advanced Email Features

## ⚠️ Important: Run This Migration

The advanced email features require database schema changes. Follow these steps:

### Step 1: Review Schema Changes

The following changes will be made to your database:

1. **New Table**: `NotificationPreferences`
   - Stores per-user notification preferences
   - 11 boolean fields for different notification types

2. **New Table**: `EmailEvent`
   - Stores email tracking events (opens, clicks, bounces, etc.)
   - Used for analytics

3. **User Table Update**:
   - Add `emailUnsubscribed` field (Boolean, default: false)

### Step 2: Run Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema to database
npx prisma db push
```

### Step 3: Verify Migration

Check that tables were created:

```sql
-- Check NotificationPreferences table
SELECT * FROM "NotificationPreferences" LIMIT 1;

-- Check EmailEvent table
SELECT * FROM "EmailEvent" LIMIT 1;

-- Check User table has emailUnsubscribed field
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'emailUnsubscribed';
```

### Step 4: Test

1. Go to `/my-account` → Settings
2. Check that notification preferences load
3. Toggle a preference
4. Verify it saves

---

## 🔄 Migration SQL (Alternative Method)

If `npx prisma db push` doesn't work, you can run SQL directly:

```sql
-- Add emailUnsubscribed to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailUnsubscribed" BOOLEAN DEFAULT false;

-- Create NotificationPreferences table
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
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- Create index
CREATE INDEX IF NOT EXISTS "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- Add foreign key
ALTER TABLE "NotificationPreferences" 
ADD CONSTRAINT "NotificationPreferences_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create EmailEvent table
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

-- Create indexes for EmailEvent
CREATE INDEX IF NOT EXISTS "EmailEvent_userId_idx" ON "EmailEvent"("userId");
CREATE INDEX IF NOT EXISTS "EmailEvent_email_idx" ON "EmailEvent"("email");
CREATE INDEX IF NOT EXISTS "EmailEvent_notificationType_idx" ON "EmailEvent"("notificationType");
CREATE INDEX IF NOT EXISTS "EmailEvent_eventType_idx" ON "EmailEvent"("eventType");
CREATE INDEX IF NOT EXISTS "EmailEvent_timestamp_idx" ON "EmailEvent"("timestamp");
```

After running SQL, sync Prisma:

```bash
npx prisma db pull
npx prisma generate
```

---

## ✅ Migration Complete

After migration:
- ✅ `NotificationPreferences` table created
- ✅ `EmailEvent` table created
- ✅ `User.emailUnsubscribed` field added
- ✅ All indexes created
- ✅ Foreign keys set up

**You're ready to use advanced email features!** 🎉



























