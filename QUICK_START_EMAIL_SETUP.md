# Quick Start: Email Features Setup (10 Minutes)

## 🎯 Goal

Set up database tables and SendGrid webhook for advanced email features.

---

## Part 1: Database Migration (5 minutes)

### Step 1: Open Terminal
```bash
cd D:\www.tractorauction.in
```

### Step 2: Generate Prisma Client
```bash
npx prisma generate
```
✅ **Expected**: "Generated Prisma Client" message

### Step 3: Push Schema to Database
```bash
npx prisma db push
```
✅ **Expected**: "Your database is now in sync" message

⚠️ **If it asks to reset schema**: Type `N` and use SQL method (see below)

### Step 4: Verify (Optional)
```bash
npx prisma studio
```
Opens browser - check for `NotificationPreferences` and `EmailEvent` tables

---

## Part 2: SendGrid Webhook (5 minutes)

### Step 1: Login to SendGrid
Go to: https://app.sendgrid.com/

### Step 2: Go to Webhook Settings
1. Click **Settings** (left sidebar)
2. Click **Mail Settings**
3. Click **Event Webhook**

### Step 3: Create Webhook
1. Click **"Create Webhook"** button
2. **HTTP POST URL**: 
   ```
   https://www.tractorauction.in/api/webhooks/sendgrid
   ```
   (Replace with your domain)

3. **Select Events** (check these):
   - ✅ Processed
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Bounce
   - ✅ Spam Report
   - ✅ Unsubscribe
   - ✅ Group Unsubscribe

4. Click **"Save"**

### Step 4: Verify
- Webhook shows as **"Active"**
- URL is correct
- Events are selected

---

## ✅ Done!

Your email features are now configured!

**Test it:**
1. Send a test email (approve a vehicle)
2. Check database: `SELECT * FROM "EmailEvent" LIMIT 5;`
3. Check SendGrid → Activity → Webhook Events

---

## 🔧 If Prisma Migration Fails

Run this SQL instead (see `DATABASE_MIGRATION_STEPS.md` for full SQL):

```sql
-- Add column to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailUnsubscribed" BOOLEAN DEFAULT false;

-- Create NotificationPreferences table
CREATE TABLE IF NOT EXISTS "NotificationPreferences" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE,
  "vehicleApproved" BOOLEAN DEFAULT true,
  "vehicleRejected" BOOLEAN DEFAULT true,
  "auctionScheduled" BOOLEAN DEFAULT true,
  "auctionStarted" BOOLEAN DEFAULT true,
  "auctionEnded" BOOLEAN DEFAULT true,
  "bidPlaced" BOOLEAN DEFAULT true,
  "bidOutbid" BOOLEAN DEFAULT true,
  "bidApproved" BOOLEAN DEFAULT true,
  "bidRejected" BOOLEAN DEFAULT true,
  "membershipExpiring" BOOLEAN DEFAULT true,
  "membershipExpired" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create EmailEvent table
CREATE TABLE IF NOT EXISTS "EmailEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "notificationType" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "eventData" TEXT,
  "timestamp" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "userAgent" TEXT,
  "ipAddress" TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");
CREATE INDEX IF NOT EXISTS "EmailEvent_userId_idx" ON "EmailEvent"("userId");
CREATE INDEX IF NOT EXISTS "EmailEvent_email_idx" ON "EmailEvent"("email");
CREATE INDEX IF NOT EXISTS "EmailEvent_timestamp_idx" ON "EmailEvent"("timestamp");
```

Then sync Prisma:
```bash
npx prisma db pull
npx prisma generate
```

---

## 📚 Detailed Guides

- `DATABASE_MIGRATION_STEPS.md` - Full database migration guide
- `SENDGRID_WEBHOOK_SETUP.md` - Detailed webhook setup
- `STEP_BY_STEP_EMAIL_SETUP.md` - Complete setup guide

---

**That's it! You're ready to use advanced email features!** 🎉



























