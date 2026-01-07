# Step-by-Step Guide: Database Migration & SendGrid Webhook Setup

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ PostgreSQL database running
- ✅ `.env` file configured with `DATABASE_URL`
- ✅ SendGrid account created (see `SETUP_SENDGRID.md`)
- ✅ SendGrid API key in `.env` file

---

## Part 1: Database Migration

### Step 1: Open Terminal/Command Prompt

1. Open your terminal (PowerShell, CMD, or Git Bash on Windows)
2. Navigate to your project directory:
   ```bash
   cd D:\www.tractorauction.in
   ```

### Step 2: Check Current Database Connection

Verify your database is accessible:

```bash
# Test Prisma connection
npx prisma db pull
```

If this works, your database connection is good. If you get an error, check your `DATABASE_URL` in `.env` file.

### Step 3: Review Schema Changes

Open `prisma/schema.prisma` and verify you see:
- `NotificationPreferences` model
- `EmailEvent` model
- `emailUnsubscribed` field in `User` model

### Step 4: Generate Prisma Client

This updates Prisma to recognize the new schema:

```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client (X.XX.XX) to .\node_modules\.prisma\client in XXXms
```

**If you see errors:**
- Make sure PostgreSQL is running
- Check `DATABASE_URL` in `.env` file
- Verify database credentials

### Step 5: Push Schema to Database

This creates the new tables and columns:

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
- Type `N` (No) to cancel
- Use the SQL method below instead

### Step 6: Verify Migration

Check that tables were created:

**Option A: Using Prisma Studio (Visual)**
```bash
npx prisma studio
```
This opens a browser at `http://localhost:5555`. You should see:
- ✅ `NotificationPreferences` table
- ✅ `EmailEvent` table
- ✅ `User` table with `emailUnsubscribed` column

**Option B: Using SQL Query**

Connect to your PostgreSQL database and run:

```sql
-- Check NotificationPreferences table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'NotificationPreferences';

-- Check EmailEvent table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'EmailEvent';

-- Check User table has emailUnsubscribed column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'emailUnsubscribed';
```

**Expected Results:**
- All three queries should return rows (tables/columns exist)

### Step 7: Test the Migration

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test notification preferences:**
   - Go to `http://localhost:3000/my-account`
   - Click "Settings" tab
   - You should see "Notification Preferences" section
   - Toggle a preference
   - It should save without errors

3. **Check browser console:**
   - Open Developer Tools (F12)
   - Check for any errors
   - Should see no database-related errors

---

## Part 2: SendGrid Webhook Configuration

### Step 1: Login to SendGrid

1. Go to: https://app.sendgrid.com/
2. Login with your SendGrid credentials

### Step 2: Navigate to Webhook Settings

1. **Click on "Settings"** in the left sidebar
2. **Click on "Mail Settings"** (under Settings)
3. **Click on "Event Webhook"** (in the Mail Settings list)

You should see a page titled "Event Webhook Settings"

### Step 3: Create New Webhook

1. **Click the "Create Webhook" button** (or "Add Webhook" if none exist)

2. **Fill in the webhook details:**

   **HTTP POST URL:**
   ```
   https://yourdomain.com/api/webhooks/sendgrid
   ```
   
   **For Local Development (using ngrok):**
   - Install ngrok: https://ngrok.com/download
   - Run: `ngrok http 3000`
   - Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
   - Use: `https://abc123.ngrok.io/api/webhooks/sendgrid`
   
   **For Production:**
   - Replace `yourdomain.com` with your actual domain
   - Example: `https://www.tractorauction.in/api/webhooks/sendgrid`

3. **Select Events to Track:**
   
   Check the following checkboxes:
   - ✅ **Processed** - Email sent to SendGrid
   - ✅ **Delivered** - Email delivered to recipient
   - ✅ **Opened** - Email opened by recipient
   - ✅ **Clicked** - Link clicked in email
   - ✅ **Bounce** - Email bounced
   - ✅ **Spam Report** - Marked as spam
   - ✅ **Unsubscribe** - User unsubscribed
   - ✅ **Group Unsubscribe** - Group unsubscribe
   - ✅ **Dropped** - Email dropped (optional)
   - ✅ **Deferred** - Delivery deferred (optional)

4. **Test Webhook (Optional):**
   - Click "Test Your Integration"
   - SendGrid will send a test event
   - Check your server logs to see if it's received

5. **Click "Save"** at the bottom

### Step 4: Verify Webhook is Active

After saving, you should see:
- ✅ Green checkmark or "Active" status
- ✅ Your webhook URL listed
- ✅ Events you selected shown

### Step 5: Test Webhook (Local Development)

**If testing locally with ngrok:**

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or use npm: npm install -g ngrok
   ```

2. **Start your Next.js server:**
   ```bash
   npm run dev
   ```

3. **Start ngrok in another terminal:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Update SendGrid webhook URL:**
   - Go back to SendGrid webhook settings
   - Edit webhook
   - Update URL to: `https://abc123.ngrok.io/api/webhooks/sendgrid`
   - Save

6. **Send a test email:**
   - Approve a vehicle or place a bid
   - Check ngrok dashboard for incoming requests
   - Check your server logs

### Step 6: Test Webhook (Production)

1. **Deploy your application** to production (Vercel, Railway, etc.)

2. **Update webhook URL** in SendGrid:
   ```
   https://www.tractorauction.in/api/webhooks/sendgrid
   ```
   (Replace with your actual domain)

3. **Send a test email** from your application

4. **Check webhook logs:**
   - Go to SendGrid → Activity → Webhook Events
   - You should see events being sent
   - Check your server logs for received events

### Step 7: Verify Webhook is Working

**Check Database:**
```sql
-- Check if events are being received
SELECT * FROM "EmailEvent" 
ORDER BY timestamp DESC 
LIMIT 10;
```

**Check Server Logs:**
- Look for: `"SendGrid webhook received"`
- Should see events being logged

**Check SendGrid Dashboard:**
- Go to SendGrid → Activity → Webhook Events
- Should see events being sent to your webhook

---

## Part 3: Testing Everything Together

### Test 1: Send Email with Tracking

1. **As Admin**, approve a vehicle
2. **Check seller's email** inbox
3. **Open the email**
4. **Check database:**
   ```sql
   SELECT * FROM "EmailEvent" 
   WHERE eventType = 'open' 
   ORDER BY timestamp DESC 
   LIMIT 1;
   ```
   Should see an "open" event

### Test 2: Click Tracking

1. **Click a link** in the email (e.g., "View My Vehicles")
2. **Check database:**
   ```sql
   SELECT * FROM "EmailEvent" 
   WHERE eventType = 'click' 
   ORDER BY timestamp DESC 
   LIMIT 1;
   ```
   Should see a "click" event with the URL

### Test 3: Unsubscribe

1. **Click unsubscribe link** in email footer
2. **Should redirect** to `/unsubscribe` page
3. **See success message**
4. **Check database:**
   ```sql
   SELECT emailUnsubscribed FROM "User" 
   WHERE email = 'seller-email@example.com';
   ```
   Should be `true`

### Test 4: Notification Preferences

1. **Go to** `/my-account` → Settings tab
2. **Toggle** a notification preference (e.g., "Vehicle Approved")
3. **Check it saves** (no errors)
4. **Check database:**
   ```sql
   SELECT vehicleApproved FROM "NotificationPreferences" 
   WHERE "userId" = 'your-user-id';
   ```
   Should match your toggle

### Test 5: Webhook Events

1. **Send an email** (approve vehicle, place bid, etc.)
2. **Check SendGrid dashboard:**
   - Go to Activity → Webhook Events
   - Should see events sent to your webhook
3. **Check database:**
   ```sql
   SELECT eventType, COUNT(*) 
   FROM "EmailEvent" 
   GROUP BY eventType;
   ```
   Should see various event types

---

## 🔧 Troubleshooting

### Database Migration Issues

**Problem**: `npx prisma db push` asks to reset schema
**Solution**: 
- Type `N` to cancel
- Use SQL method from `MIGRATION_EMAIL_FEATURES.md`
- Or manually add columns using SQL

**Problem**: `Error: P1001: Can't reach database server`
**Solution**:
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Check firewall settings

**Problem**: `Error: Column already exists`
**Solution**:
- Columns already exist, migration partially done
- Continue to next step

### SendGrid Webhook Issues

**Problem**: Webhook not receiving events
**Solution**:
- Verify webhook URL is correct
- Check webhook is "Active" in SendGrid
- For local: Make sure ngrok is running
- Check server logs for errors
- Verify webhook endpoint is accessible

**Problem**: `404 Not Found` in webhook logs
**Solution**:
- Check webhook URL path: `/api/webhooks/sendgrid`
- Verify file exists: `app/api/webhooks/sendgrid/route.ts`
- Restart your server

**Problem**: Webhook receives events but database not updated
**Solution**:
- Check server logs for errors
- Verify database connection
- Check Prisma client is generated: `npx prisma generate`

### Email Tracking Issues

**Problem**: Opens not being tracked
**Solution**:
- Check email HTML includes tracking pixel
- Verify tracking endpoint is accessible
- Check browser console for errors
- Some email clients block tracking pixels

**Problem**: Clicks not being tracked
**Solution**:
- Verify links are being wrapped
- Check redirect is working
- Some email clients strip tracking URLs

---

## ✅ Verification Checklist

After completing setup, verify:

- [ ] Database migration completed successfully
- [ ] `NotificationPreferences` table exists
- [ ] `EmailEvent` table exists
- [ ] `User.emailUnsubscribed` column exists
- [ ] SendGrid webhook created and active
- [ ] Webhook URL is correct
- [ ] All events selected in SendGrid
- [ ] Test email sent successfully
- [ ] Email tracking working (opens/clicks)
- [ ] Unsubscribe link works
- [ ] Notification preferences save correctly
- [ ] Webhook receives events
- [ ] Events stored in database

---

## 📊 Quick Verification Commands

### Check Database Tables:
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('NotificationPreferences', 'EmailEvent', 'User');
```

### Check Recent Email Events:
```sql
SELECT 
  notificationType,
  eventType,
  timestamp,
  email
FROM "EmailEvent" 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Check User Preferences:
```sql
SELECT 
  u.email,
  u."emailUnsubscribed",
  np."vehicleApproved",
  np."bidPlaced"
FROM "User" u
LEFT JOIN "NotificationPreferences" np ON u.id = np."userId"
WHERE u.email IS NOT NULL
LIMIT 10;
```

---

## 🎉 Success!

If all checks pass, your advanced email features are fully configured and working!

**Next Steps:**
- Monitor email analytics in database
- Customize email templates as needed
- Set up automated reports (optional)
- Monitor webhook events regularly

---

## 📞 Need Help?

If you encounter issues:
1. Check server logs for errors
2. Verify database connection
3. Check SendGrid webhook status
4. Review troubleshooting section above
5. Check Prisma/Next.js documentation

**Your email system is now enterprise-ready!** 🚀



























