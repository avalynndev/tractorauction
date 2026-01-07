# Quick Start: Auction Status Automation

## 🚀 5-Minute Setup

### Step 1: Generate Cron Secret

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Add to Environment Variables

Add to your `.env` file:
```env
CRON_SECRET="your-generated-secret-here"
```

### Step 3: Choose Your Cron Service

#### Option A: Vercel Cron (If using Vercel)

1. The `vercel.json` file is already configured
2. Deploy to Vercel
3. Add `CRON_SECRET` to Vercel Environment Variables
4. Done! Cron runs automatically every minute

#### Option B: External Cron Service (cron-job.org)

1. Go to https://cron-job.org
2. Sign up (free)
3. Create new cron job:
   - **URL**: `https://yourdomain.com/api/cron/auction-status`
   - **Schedule**: Every 1 minute (`*/1 * * * *`)
   - **Method**: GET
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
4. Save and activate

#### Option C: GitHub Actions (Free)

1. Create `.github/workflows/auction-cron.yml`:
```yaml
name: Auction Status Automation

on:
  schedule:
    - cron: '* * * * *'
  workflow_dispatch:

jobs:
  update-auction-status:
    runs-on: ubuntu-latest
    steps:
      - name: Call Auction Status API
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/auction-status
```

2. Add `CRON_SECRET` to GitHub Secrets (Settings → Secrets)

### Step 4: Test

```bash
# Test manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/auction-status
```

Expected response:
```json
{
  "success": true,
  "message": "Auction status automation completed",
  "summary": {
    "started": 0,
    "ended": 0,
    "errors": 0
  }
}
```

## ✅ What It Does

- ✅ Automatically starts auctions when `startTime` is reached
- ✅ Automatically ends auctions when `endTime` is reached
- ✅ Determines winners (highest bidder)
- ✅ Sends email notifications
- ✅ Updates bid statuses

## 📋 Checklist

- [ ] Generated `CRON_SECRET`
- [ ] Added to `.env` file
- [ ] Set up cron service (Vercel/External/GitHub)
- [ ] Tested manually
- [ ] Verified auctions are starting/ending automatically

## 📚 Full Documentation

See `AUCTION_STATUS_AUTOMATION.md` for detailed setup and troubleshooting.

---

**That's it!** Your auction automation is now running. 🎉


























