# Setup Guide: Advanced Email Features

## 🚀 Quick Setup (5 Steps)

### Step 1: Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push
```

This will create:
- `NotificationPreferences` table
- `EmailEvent` table
- Add `emailUnsubscribed` field to `User` table

### Step 2: Configure SendGrid Webhook

1. **Login to SendGrid**: https://app.sendgrid.com/
2. **Go to**: Settings → Mail Settings → Event Webhook
3. **Click**: "Create Webhook"
4. **Set Webhook URL**: 
   ```
   https://yourdomain.com/api/webhooks/sendgrid
   ```
   (For local testing: Use ngrok or similar tool)
5. **Select Events**:
   - ✅ Processed
   - ✅ Delivered
   - ✅ Opened
   - ✅ Clicked
   - ✅ Bounce
   - ✅ Spam Report
   - ✅ Unsubscribe
   - ✅ Group Unsubscribe
6. **Click**: "Save"

### Step 3: Test Email Tracking

1. Send a test email (approve a vehicle, place a bid, etc.)
2. Open the email
3. Check database:
   ```sql
   SELECT * FROM "EmailEvent" ORDER BY timestamp DESC LIMIT 10;
   ```

### Step 4: Test Unsubscribe

1. Click unsubscribe link in any email footer
2. Should redirect to `/unsubscribe` page
3. Verify success message

### Step 5: Test Notification Preferences

1. Go to `/my-account` → Settings tab
2. Toggle any notification preference
3. Verify it saves correctly

---

## ✅ Features Overview

### 1. Branded Email Templates
- ✅ Professional header with logo
- ✅ Consistent brand colors (#0284c7)
- ✅ Responsive design
- ✅ Footer with contact info
- ✅ Social media links

### 2. Email Analytics
- ✅ Open tracking (1x1 pixel)
- ✅ Click tracking (URL wrapping)
- ✅ Event logging to database
- ✅ User agent & IP tracking

### 3. Unsubscribe System
- ✅ Unsubscribe from all emails
- ✅ Unsubscribe from specific types
- ✅ Secure token-based links
- ✅ User-friendly unsubscribe page

### 4. Notification Preferences
- ✅ Per-type toggles (11 types)
- ✅ Real-time updates
- ✅ Default: all enabled
- ✅ UI in Settings tab

### 5. Webhook Integration
- ✅ SendGrid event tracking
- ✅ Automatic unsubscribe handling
- ✅ Event storage for analytics

---

## 📊 Viewing Analytics

### Open Rate by Notification Type:
```sql
SELECT 
  notificationType,
  COUNT(*) FILTER (WHERE eventType = 'open') as opens,
  COUNT(*) FILTER (WHERE eventType = 'delivered') as delivered,
  ROUND(100.0 * COUNT(*) FILTER (WHERE eventType = 'open') / 
    NULLIF(COUNT(*) FILTER (WHERE eventType = 'delivered'), 0), 2) as open_rate_percent
FROM "EmailEvent"
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY notificationType
ORDER BY opens DESC;
```

### Click Rate:
```sql
SELECT 
  notificationType,
  COUNT(*) FILTER (WHERE eventType = 'click') as clicks,
  COUNT(*) FILTER (WHERE eventType = 'open') as opens,
  ROUND(100.0 * COUNT(*) FILTER (WHERE eventType = 'click') / 
    NULLIF(COUNT(*) FILTER (WHERE eventType = 'open'), 0), 2) as click_rate_percent
FROM "EmailEvent"
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY notificationType;
```

### Bounce Rate:
```sql
SELECT 
  COUNT(*) FILTER (WHERE eventType = 'bounce') as bounces,
  COUNT(*) FILTER (WHERE eventType = 'delivered') as delivered,
  ROUND(100.0 * COUNT(*) FILTER (WHERE eventType = 'bounce') / 
    NULLIF(COUNT(*) FILTER (WHERE eventType = 'delivered'), 0), 2) as bounce_rate_percent
FROM "EmailEvent"
WHERE timestamp > NOW() - INTERVAL '30 days';
```

---

## 🔧 Configuration

### Update Brand Colors:
Edit `lib/email-template-helper.ts`:
```typescript
const primaryColor = "#0284c7"; // Your brand color
const primaryColorDark = "#0369a1";
```

### Update Logo:
```typescript
const logoUrl = `${appUrl}/logo.png`; // Your logo URL
```

### Update Contact Info:
Edit footer section in `lib/email-template-helper.ts`

---

## 🧪 Testing

### Test Email Tracking:
1. ✅ Send email → Check database for "delivered" event
2. ✅ Open email → Check for "open" event
3. ✅ Click link → Check for "click" event

### Test Unsubscribe:
1. ✅ Click unsubscribe link → Should work
2. ✅ Try to send email → Should be blocked
3. ✅ Resubscribe → Should work again

### Test Preferences:
1. ✅ Toggle preference → Should save
2. ✅ Disable type → Should not receive that type
3. ✅ Enable type → Should receive that type

---

## 📝 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/user/notification-preferences` | GET | Get user preferences |
| `/api/user/notification-preferences` | PUT | Update preferences |
| `/api/email/unsubscribe` | GET | Unsubscribe via token |
| `/api/email/unsubscribe` | POST | Resubscribe |
| `/api/email/track` | GET | Track opens/clicks |
| `/api/webhooks/sendgrid` | POST | Receive SendGrid events |

---

## 🎉 You're All Set!

All advanced email features are now:
- ✅ Implemented
- ✅ Database ready
- ✅ API endpoints created
- ✅ UI components added
- ✅ Ready for production

**Next**: Configure SendGrid webhook and start tracking! 🚀



























