# Vercel Deployment Guide

This guide will help you deploy the Tractor Auction application to Vercel with automatic cron job setup.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket Repository**: Your code should be in a Git repository
3. **Environment Variables**: Prepare all required environment variables

## Step 1: Prepare Environment Variables

Before deploying, ensure you have these environment variables ready:

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT
JWT_SECRET=your-secret-key-here

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset

# Razorpay (for payments)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# Twilio (for SMS/OTP)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=your-phone-number

# Optional: Cron Job Security
CRON_API_KEY=your-secure-random-key-here
```

### Optional Variables

```bash
# API URL (for Swagger docs)
NEXT_PUBLIC_API_URL=https://www.tractorauction.in

# Node Environment
NODE_ENV=production
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"

2. **Import Your Repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (if project is in root)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)

4. **Add Environment Variables**
   - Click "Environment Variables"
   - Add all required variables from Step 1
   - Set them for: Production, Preview, and Development

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add JWT_SECRET
   # ... add all other variables
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Step 3: Verify Cron Job Setup

After deployment:

1. **Check Vercel Dashboard**
   - Go to your project → Settings → Cron Jobs
   - You should see: `*/10 * * * *` → `/api/watchlist/check-alerts`

2. **Verify Cron Job is Active**
   - The cron job will run automatically every 10 minutes
   - Check the "Cron Jobs" tab in Vercel dashboard for execution logs

3. **Test the Endpoint Manually**
   ```bash
   curl https://www.tractorauction.in/api/watchlist/check-alerts
   ```
   
   Expected response:
   ```json
   {
     "message": "Watchlist alerts checked",
     "notificationsCreated": {
       "priceDrops": 0,
       "auctionStarts": 0
     },
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

## Step 4: Post-Deployment Checklist

- [ ] Database connection working
- [ ] Environment variables set correctly
- [ ] Cron job appears in Vercel dashboard
- [ ] API endpoints responding
- [ ] Authentication working
- [ ] File uploads working (Cloudinary)
- [ ] Payment gateway configured (Razorpay)
- [ ] SMS/OTP working (Twilio)

## Cron Job Configuration

The cron job is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/watchlist/check-alerts",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### Schedule Options

- `*/10 * * * *` - Every 10 minutes (current)
- `*/5 * * * *` - Every 5 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight

See [crontab.guru](https://crontab.guru) for more schedule options.

## Monitoring Cron Jobs

### View Cron Job Logs

1. Go to Vercel Dashboard → Your Project
2. Click "Cron Jobs" tab
3. View execution history and logs

### Check for Errors

- Monitor Vercel function logs
- Check database for created notifications
- Verify users are receiving notifications

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Dashboard**
   - Verify cron job is listed in Settings → Cron Jobs
   - Check if it's enabled

2. **Verify Endpoint**
   - Test the endpoint manually
   - Check for errors in function logs

3. **Check Environment Variables**
   - Ensure all required variables are set
   - Verify `CRON_API_KEY` if using API key protection

### Cron Job Running but No Notifications

1. **Check Database**
   - Verify users have items in watchlist
   - Check notification preferences are enabled
   - Verify vehicles have price changes

2. **Check Logs**
   - Review function execution logs
   - Look for errors or warnings

3. **Test Manually**
   - Trigger the endpoint manually
   - Check the response for created notifications

## Security Considerations

### API Key Protection (Optional)

If you want to protect the cron endpoint:

1. **Set Environment Variable**
   ```bash
   CRON_API_KEY=your-secure-random-key
   ```

2. **The endpoint will require this header**:
   ```bash
   x-api-key: your-secure-random-key
   ```

3. **Vercel Cron automatically includes this** (if configured)

## Production Best Practices

1. **Monitor Performance**
   - Check cron job execution time
   - Monitor database query performance
   - Watch for rate limiting

2. **Error Handling**
   - Set up error alerts
   - Monitor failed executions
   - Have fallback mechanisms

3. **Scaling**
   - Adjust cron frequency based on load
   - Consider batching notifications
   - Monitor database load

## Support

For issues with:
- **Vercel Deployment**: Check [Vercel Documentation](https://vercel.com/docs)
- **Cron Jobs**: See [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- **Application Issues**: Check application logs in Vercel dashboard


