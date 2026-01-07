# Cron Job Setup for Watchlist Alerts

The watchlist alerts system requires a background job to periodically check for price drops and auction starts. This document explains how to set it up.

## Option 1: Vercel Cron (Recommended for Vercel Deployments)

If you're deploying to Vercel, use Vercel Cron Jobs.

### Setup

1. **Create `vercel.json`** (already created in project root):
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

2. **Schedule Format**: `*/10 * * * *` means "every 10 minutes"
   - Change to `*/5 * * * *` for every 5 minutes
   - Change to `0 * * * *` for every hour
   - See [cron expression guide](https://crontab.guru/)

3. **Deploy to Vercel**: The cron job will automatically be set up when you deploy.

4. **Optional: Add API Key Protection**:
   - Set `CRON_API_KEY` in Vercel environment variables
   - The endpoint will require this key in the `x-api-key` header

## Option 2: External Cron Service

If not using Vercel, use an external cron service:

### Services:
- **cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **Cronitor** (Free tier available)
- **GitHub Actions** (Free for public repos)

### Setup Steps:

1. **Get your API endpoint URL**:
   - Production: `https://www.tractorauction.in/api/watchlist/check-alerts`
   - Development: `http://localhost:3000/api/watchlist/check-alerts` (for testing)

2. **Configure the cron service**:
   - URL: Your API endpoint
   - Method: GET
   - Schedule: Every 10 minutes (or your preferred interval)
   - Headers (if using API key): `x-api-key: YOUR_CRON_API_KEY`

3. **Test the endpoint**:
   ```bash
   curl https://www.tractorauction.in/api/watchlist/check-alerts
   ```

## Option 3: Manual Testing

For development/testing, you can manually trigger the check:

```bash
# Using curl
curl http://localhost:3000/api/watchlist/check-alerts

# Or visit in browser
http://localhost:3000/api/watchlist/check-alerts
```

## Recommended Schedule

- **Development**: Every 5-10 minutes
- **Production**: Every 5-10 minutes (balance between responsiveness and server load)

## Monitoring

The endpoint returns:
```json
{
  "message": "Watchlist alerts checked",
  "notificationsCreated": {
    "priceDrops": 2,
    "auctionStarts": 1
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Monitor this to ensure:
- The cron job is running
- Notifications are being created
- No errors are occurring

## Security

If using an external cron service, protect the endpoint:

1. Set `CRON_API_KEY` in environment variables
2. The endpoint checks for `x-api-key` header
3. Only requests with the correct key will be processed

## Troubleshooting

### Cron job not running
- Check Vercel dashboard → Cron Jobs
- Verify the schedule format is correct
- Check server logs for errors

### No notifications being created
- Verify users have items in their watchlist
- Check notification preferences are enabled
- Verify vehicles have price changes or auctions starting
- Check server logs for errors

### Too many notifications
- Increase the cron interval (e.g., every 15 minutes instead of 5)
- Check if price changes are being tracked correctly

## Testing Checklist

1. ✅ Add items to watchlist
2. ✅ Enable watchlist notifications in user preferences
3. ✅ Change vehicle price (as admin)
4. ✅ Verify notification is created
5. ✅ Check notification appears in user's notification list
6. ✅ Test auction start notification
7. ✅ Verify cron job is running on schedule


