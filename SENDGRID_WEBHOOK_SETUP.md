# SendGrid Webhook Setup - Detailed Guide

## 🎯 What is a Webhook?

A webhook is a way for SendGrid to automatically notify your application when email events happen (like when someone opens an email, clicks a link, or unsubscribes).

---

## 📍 Step-by-Step: Configure SendGrid Webhook

### Step 1: Access SendGrid Dashboard

1. **Open your browser** and go to: https://app.sendgrid.com/
2. **Login** with your SendGrid credentials
3. You should see the SendGrid dashboard

### Step 2: Navigate to Webhook Settings

**Method 1: Via Settings Menu**
1. Look at the **left sidebar**
2. Click on **"Settings"** (gear icon at the bottom)
3. In the Settings menu, click on **"Mail Settings"**
4. Scroll down and click on **"Event Webhook"**

**Method 2: Direct URL**
- Go directly to: https://app.sendgrid.com/settings/mail_settings/event_webhook

### Step 3: Create Webhook

1. **Click the "Create Webhook" button** (usually a blue button on the right)
   
   If you already have a webhook, you'll see:
   - "Edit" button to modify existing webhook
   - Or "Add Another Webhook" to create additional one

### Step 4: Configure Webhook URL

**For Production (Live Website):**

1. **HTTP POST URL** field:
   ```
   https://www.tractorauction.in/api/webhooks/sendgrid
   ```
   - Replace `www.tractorauction.in` with your actual domain
   - Make sure to use `https://` (not `http://`)
   - The path `/api/webhooks/sendgrid` must match exactly

2. **HTTP POST URL** should look like:
   ```
   https://yourdomain.com/api/webhooks/sendgrid
   ```

**For Local Development (Testing):**

You need to expose your local server to the internet. Use **ngrok**:

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Or install via npm: `npm install -g ngrok`
   - Or via Chocolatey: `choco install ngrok`

2. **Start your Next.js server:**
   ```bash
   npm run dev
   ```
   Server should be running on `http://localhost:3000`

3. **In a new terminal, start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** from ngrok output:
   ```
   Forwarding  https://abc123def456.ngrok.io -> http://localhost:3000
   ```
   Copy: `https://abc123def456.ngrok.io`

5. **Use this URL in SendGrid:**
   ```
   https://abc123def456.ngrok.io/api/webhooks/sendgrid
   ```

   ⚠️ **Note**: ngrok URLs change each time you restart ngrok (unless you have a paid plan). You'll need to update the webhook URL each time.

### Step 5: Select Events to Track

Check the following checkboxes (these are the important ones):

**Essential Events:**
- ✅ **Processed** - Email was sent to SendGrid
- ✅ **Delivered** - Email was delivered to recipient's inbox
- ✅ **Opened** - Recipient opened the email
- ✅ **Clicked** - Recipient clicked a link in the email
- ✅ **Bounce** - Email bounced (invalid email address)
- ✅ **Spam Report** - Recipient marked email as spam
- ✅ **Unsubscribe** - Recipient clicked unsubscribe link
- ✅ **Group Unsubscribe** - Recipient unsubscribed via email client

**Optional Events:**
- ⬜ **Dropped** - Email was dropped (optional)
- ⬜ **Deferred** - Delivery was deferred (optional)
- ⬜ **Group Resubscribe** - Recipient resubscribed (optional)

**Recommended**: Check all the essential events above.

### Step 6: Test Webhook (Optional but Recommended)

1. **Click "Test Your Integration"** button (if available)
2. SendGrid will send a test event to your webhook
3. **Check your server logs** to see if the event was received
4. **Check database** to see if event was stored:
   ```sql
   SELECT * FROM "EmailEvent" ORDER BY timestamp DESC LIMIT 1;
   ```

### Step 7: Save Webhook

1. **Click "Save"** button at the bottom of the page
2. You should see a success message
3. The webhook should show as **"Active"** or have a green checkmark

### Step 8: Verify Webhook Status

After saving, you should see:
- ✅ Webhook URL displayed
- ✅ Status: "Active" or green checkmark
- ✅ List of selected events
- ✅ Option to "Edit" or "Delete"

---

## 🧪 Testing the Webhook

### Test 1: Send Test Email

1. **In your application**, trigger an email:
   - Approve a vehicle (sends email to seller)
   - Place a bid (sends email to bidder)
   - Or any action that sends an email

2. **Check SendGrid Dashboard:**
   - Go to **Activity** → **Webhook Events**
   - You should see events being sent to your webhook
   - Status should be "200" (success)

3. **Check Your Server Logs:**
   - Look for: `"SendGrid webhook received"`
   - Should see event data being logged

4. **Check Database:**
   ```sql
   SELECT * FROM "EmailEvent" 
   ORDER BY timestamp DESC 
   LIMIT 5;
   ```
   Should see events stored

### Test 2: Verify Event Types

Send an email and check what events are received:

1. **Email sent** → Should see "processed" event
2. **Email delivered** → Should see "delivered" event
3. **Email opened** → Should see "open" event (if tracking pixel loads)
4. **Link clicked** → Should see "click" event

### Test 3: Test Unsubscribe

1. **Click unsubscribe link** in an email
2. **Check SendGrid** → Should see "unsubscribe" event
3. **Check database** → User should be marked as unsubscribed

---

## 🔍 Troubleshooting Webhook Issues

### Problem: Webhook Not Receiving Events

**Check 1: Webhook URL**
- ✅ URL is correct and accessible
- ✅ Uses `https://` (not `http://`)
- ✅ Path is exactly `/api/webhooks/sendgrid`

**Check 2: Webhook Status**
- Go to SendGrid → Settings → Event Webhook
- Verify webhook shows as "Active"
- Check that events are selected

**Check 3: Server Accessibility**
- For local: Is ngrok running?
- For production: Is your server accessible?
- Test URL in browser: Should return JSON response

**Check 4: Server Logs**
- Check for errors in server logs
- Look for webhook requests in logs
- Verify endpoint is being hit

**Check 5: SendGrid Activity**
- Go to SendGrid → Activity → Webhook Events
- Check if events are being sent
- Check response status codes
- If status is not 200, there's an error

### Problem: 404 Not Found

**Solution:**
- Verify file exists: `app/api/webhooks/sendgrid/route.ts`
- Check the route path matches exactly
- Restart your Next.js server
- Clear Next.js cache: `.next` folder

### Problem: 500 Internal Server Error

**Solution:**
- Check server logs for specific error
- Verify database connection
- Check Prisma client is generated: `npx prisma generate`
- Verify `EmailEvent` table exists

### Problem: Events Not Stored in Database

**Solution:**
- Check database connection
- Verify `EmailEvent` table exists
- Check Prisma client: `npx prisma generate`
- Look for errors in server logs

### Problem: ngrok URL Changes

**Solution:**
- Each time you restart ngrok, URL changes
- Update webhook URL in SendGrid each time
- Or use ngrok paid plan for static URL
- Or use production domain for testing

---

## 📊 Monitoring Webhook Events

### In SendGrid Dashboard:

1. **Go to**: Activity → Webhook Events
2. **View**:
   - All events sent to your webhook
   - Response status codes
   - Event timestamps
   - Event types

### In Your Database:

```sql
-- Recent events
SELECT 
  eventType,
  notificationType,
  email,
  timestamp
FROM "EmailEvent"
ORDER BY timestamp DESC
LIMIT 20;

-- Events by type
SELECT 
  eventType,
  COUNT(*) as count
FROM "EmailEvent"
GROUP BY eventType
ORDER BY count DESC;

-- Events by notification type
SELECT 
  notificationType,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE eventType = 'open') as opens,
  COUNT(*) FILTER (WHERE eventType = 'click') as clicks
FROM "EmailEvent"
GROUP BY notificationType;
```

---

## 🔒 Security Considerations

### For Production:

1. **Webhook Verification** (Recommended):
   - SendGrid can sign webhook requests
   - Verify signature in your endpoint
   - Prevents fake webhook requests

2. **IP Whitelist** (Optional):
   - SendGrid provides IP ranges
   - Whitelist these IPs in your server
   - Extra security layer

3. **HTTPS Only**:
   - Always use `https://` for webhook URLs
   - Never use `http://` in production

---

## ✅ Webhook Setup Checklist

- [ ] SendGrid account created
- [ ] Navigated to Event Webhook settings
- [ ] Created new webhook
- [ ] Set correct webhook URL (production or ngrok)
- [ ] Selected all essential events
- [ ] Saved webhook
- [ ] Verified webhook is "Active"
- [ ] Tested webhook with test email
- [ ] Verified events are received
- [ ] Verified events are stored in database
- [ ] Checked webhook logs in SendGrid

---

## 🎉 Webhook is Configured!

Once all checks pass, your webhook is ready to:
- ✅ Track email opens
- ✅ Track link clicks
- ✅ Handle unsubscribes automatically
- ✅ Store events for analytics
- ✅ Monitor email performance

**Your email system is now fully configured!** 🚀

---

## 📝 Quick Reference

**Webhook URL Format:**
```
https://yourdomain.com/api/webhooks/sendgrid
```

**Local Testing with ngrok:**
```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000

# Use ngrok URL in SendGrid webhook
```

**Check Webhook Status:**
- SendGrid Dashboard → Settings → Event Webhook
- Should show "Active" status

**View Webhook Events:**
- SendGrid Dashboard → Activity → Webhook Events
- Database: `SELECT * FROM "EmailEvent"`

---

Need help? Check the troubleshooting section or review SendGrid documentation.



























