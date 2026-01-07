# Quick Start: SendGrid Setup (5 Minutes)

## 🎯 Recommended Provider: SendGrid

**Why?** Easiest setup, 100 free emails/day, excellent deliverability, perfect for your use case.

---

## Step-by-Step Setup

### 1. Create SendGrid Account (2 minutes)
1. Visit: https://signup.sendgrid.com/
2. Click **Start for Free**
3. Fill in your details:
   - Email: Your business email
   - Password: Create a strong password
   - Company: Tractor Auction
4. Click **Create Account**
5. Verify your email address

### 2. Create API Key (1 minute)
1. After login, go to: **Settings** → **API Keys** (left sidebar)
2. Click **Create API Key** (top right)
3. Fill in:
   - **API Key Name**: `Tractor Auction Production`
   - **API Key Permissions**: Select **Full Access** (or **Restricted Access** → Enable only "Mail Send")
4. Click **Create & View**
5. **⚠️ IMPORTANT**: Copy the API key immediately! It looks like:
   ```
   SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   You won't be able to see it again!

### 3. Verify Sender Email (2 minutes)
1. Go to: **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in:
   - **From Email**: `noreply@tractorauction.in` (or your email)
   - **From Name**: `Tractor Auction`
   - **Reply To**: `contact@tractorauction.in`
   - **Company Address**: Your business address
4. Click **Create**
5. Check your email and click the verification link

### 4. Add to Your .env File
Open your `.env` file and add:

```env
# Email Service - SendGrid
SENDGRID_API_KEY="SG.your-actual-api-key-here"
FROM_EMAIL="noreply@tractorauction.in"
```

Replace `SG.your-actual-api-key-here` with the API key you copied in Step 2.

### 5. Test It! (1 minute)
1. Restart your development server:
   ```bash
   npm run dev
   ```
2. Go to your admin panel
3. Approve a vehicle (this will trigger an email)
4. Check the seller's email inbox

---

## ✅ You're Done!

Your email notifications are now active. Users will receive emails for:
- ✅ Vehicle approval/rejection
- ✅ Auction events
- ✅ Bid notifications
- ✅ And more!

---

## 🔍 Troubleshooting

### Emails Not Sending?
1. **Check API Key**: Make sure it's correct in `.env`
2. **Check FROM_EMAIL**: Must be verified in SendGrid
3. **Check Console**: Look for error messages in your terminal
4. **Check Spam Folder**: First emails might go to spam

### API Key Not Working?
- Make sure there are no extra spaces
- The key should start with `SG.`
- Try creating a new API key

### Emails Going to Spam?
1. Verify your sender email in SendGrid
2. For better deliverability, verify your domain (advanced)

---

## 📊 Free Tier Limits

- **100 emails per day** (3,000 per month)
- Perfect for starting out!
- Upgrade when you need more

---

## 💰 Pricing (When You Grow)

- **Free**: 100 emails/day
- **Essentials ($19.95/month)**: 40,000 emails/month
- **Pro ($89.95/month)**: 100,000 emails/month

You can start free and upgrade later!

---

## 🎉 Next Steps

1. ✅ SendGrid account created
2. ✅ API key added to `.env`
3. ✅ Sender email verified
4. ✅ Test email sent

**Your email notification system is ready!** 🚀

For more details, see `EMAIL_PROVIDER_GUIDE.md`



























