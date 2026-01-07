# Auction Status Automation - Setup Guide

## Overview

The Auction Status Automation system automatically manages auction lifecycles:
- **SCHEDULED → LIVE**: When `startTime` is reached
- **LIVE → ENDED**: When `endTime` is reached
- **Winner Determination**: Automatically determines the highest bidder when auction ends
- **Email Notifications**: Sends notifications to sellers and bidders when auctions start/end

## API Endpoints

### 1. Primary Cron Endpoint (Recommended)
**URL**: `/api/cron/auction-status`  
**Methods**: GET, POST  
**Security**: Protected by `CRON_SECRET` environment variable

### 2. Alternative Endpoint
**URL**: `/api/auctions/update-status`  
**Methods**: GET, POST  
**Security**: Protected by `CRON_SECRET` environment variable

Both endpoints perform the same operations. Use `/api/cron/auction-status` for clarity.

## Setup Instructions

### Option 1: Vercel Cron Jobs (Recommended for Vercel Deployments)

1. **Create `vercel.json` in project root**:
```json
{
  "crons": [
    {
      "path": "/api/cron/auction-status",
      "schedule": "* * * * *"
    }
  ]
}
```

2. **Set Environment Variable**:
   - Go to Vercel Dashboard → Project Settings → Environment Variables
   - Add `CRON_SECRET` with a strong random string (e.g., generate with `openssl rand -hex 32`)

3. **Deploy**: Vercel will automatically set up the cron job

**Note**: Vercel Cron runs on the minute (every 1 minute). The schedule `* * * * *` means every minute.

### Option 2: External Cron Service

Use services like:
- **cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **Cronitor** (Free tier available)
- **GitHub Actions** (Free for public repos)

#### Setup with cron-job.org:

1. Sign up at https://cron-job.org
2. Create a new cron job:
   - **URL**: `https://yourdomain.com/api/cron/auction-status`
   - **Schedule**: Every 1 minute (`*/1 * * * *`)
   - **Request Method**: GET or POST
   - **Headers**: 
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```
3. Save and activate

#### Setup with GitHub Actions:

Create `.github/workflows/auction-cron.yml`:
```yaml
name: Auction Status Automation

on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:  # Allow manual trigger

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

Add `CRON_SECRET` to GitHub Secrets.

### Option 3: Self-Hosted Cron (Linux Server)

Add to crontab (`crontab -e`):
```bash
# Run every minute
* * * * * curl -X GET -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/auction-status
```

Or use a more robust script:
```bash
#!/bin/bash
# /usr/local/bin/auction-cron.sh

CRON_SECRET="your-secret-here"
DOMAIN="https://yourdomain.com"

response=$(curl -s -w "\n%{http_code}" -X GET \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$DOMAIN/api/cron/auction-status")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" -eq 200 ]; then
  echo "$(date): Success - $body" >> /var/log/auction-cron.log
else
  echo "$(date): Error - HTTP $http_code - $body" >> /var/log/auction-cron.log
fi
```

Make executable and add to crontab:
```bash
chmod +x /usr/local/bin/auction-cron.sh
* * * * * /usr/local/bin/auction-cron.sh
```

## Environment Variables

### Required
- `CRON_SECRET`: Secret token for authenticating cron requests
  - Generate with: `openssl rand -hex 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Should be at least 32 characters long

### Optional
- `NODE_ENV`: Set to `production` for production environment
  - In development, cron endpoint works without secret (with warning)

## How It Works

### 1. Starting Auctions (SCHEDULED → LIVE)

**Trigger**: When current time >= `startTime` and < `endTime`

**Actions**:
- Updates auction status to `LIVE`
- Sends email notification to seller
- Sends email notification to users watching the auction

### 2. Ending Auctions (LIVE → ENDED)

**Trigger**: When current time >= `endTime`

**Actions**:
- Finds highest bidder (bid with maximum `bidAmount`)
- Updates auction status to `ENDED`
- Sets `winnerId` to highest bidder's ID
- Updates `currentBid` to highest bid amount
- Marks winning bid with `isWinningBid: true`
- Unmarks all other bids
- Sends email notification to seller
- Sends email notification to winner (if exists)
- Sends email notification to other bidders

### 3. Winner Determination Logic

```typescript
// Get highest bid
const highestBid = bids.sort((a, b) => b.bidAmount - a.bidAmount)[0];

// If bids exist, winner is highest bidder
// If no bids, winnerId remains null
const winnerId = highestBid ? highestBid.bidderId : null;
```

## Testing

### Manual Testing

1. **Test without authentication** (development only):
```bash
curl https://yourdomain.com/api/cron/auction-status
```

2. **Test with authentication**:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/auction-status
```

3. **Expected Response**:
```json
{
  "success": true,
  "message": "Auction status automation completed",
  "timestamp": "2025-01-XX...",
  "summary": {
    "started": 2,
    "ended": 1,
    "errors": 0
  },
  "details": {
    "startedAuctionIds": ["auction-id-1", "auction-id-2"],
    "endedAuctionIds": ["auction-id-3"]
  }
}
```

### Testing with Sample Data

1. Create a test auction with:
   - `startTime`: 1 minute in the past
   - `endTime`: 1 minute in the future
   - `status`: `SCHEDULED`

2. Run cron job manually

3. Verify:
   - Auction status changed to `LIVE`
   - Email notifications sent

4. Wait 2 minutes, then run cron again

5. Verify:
   - Auction status changed to `ENDED`
   - Winner determined (if bids exist)
   - Email notifications sent

## Monitoring

### Logs

The cron job logs all activities:
- `[Cron] Found X auctions to start`
- `[Cron] ✅ Started auction {id}`
- `[Cron] Found X auctions to end`
- `[Cron] ✅ Ended auction {id} - Winner: {name}`
- `[Cron] ❌ Error messages`

### Health Checks

Monitor the cron endpoint:
```bash
# Check if cron is accessible
curl -I https://yourdomain.com/api/cron/auction-status

# Check last run status
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/cron/auction-status | jq '.summary'
```

### Alerts

Set up alerts for:
- Cron job failures (HTTP 500)
- High error rates
- Missing cron executions

## Troubleshooting

### Issue: Cron job not running

**Solutions**:
1. Check cron service is active
2. Verify `CRON_SECRET` is set correctly
3. Check server logs for errors
4. Verify endpoint URL is correct
5. Test manually with curl

### Issue: Auctions not starting/ending

**Solutions**:
1. Check `startTime` and `endTime` are in correct timezone
2. Verify database connection
3. Check for errors in response
4. Review server logs

### Issue: Winners not determined

**Solutions**:
1. Verify bids exist for the auction
2. Check bid amounts are correct
3. Review database for bid records
4. Check logs for errors

### Issue: Email notifications not sending

**Solutions**:
1. Verify email service is configured
2. Check email logs
3. Verify user email addresses exist
4. Check notification preferences

## Best Practices

1. **Run every minute**: Ensures auctions start/end on time
2. **Use strong CRON_SECRET**: At least 32 characters, random
3. **Monitor regularly**: Check logs and response times
4. **Test in staging**: Test automation before production
5. **Backup database**: Before major changes
6. **Set up alerts**: For failures and errors

## Frequency Recommendations

- **Every 1 minute**: Recommended for production
- **Every 5 minutes**: Acceptable for low-traffic sites
- **Every 15 minutes**: Not recommended (may cause delays)

## Security Considerations

1. **Never expose CRON_SECRET**: Keep it secret
2. **Use HTTPS**: Always use encrypted connections
3. **Rate limiting**: Consider adding rate limits
4. **IP whitelisting**: Optional additional security
5. **Logging**: Log all access attempts

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Auction status automation completed",
  "timestamp": "2025-01-XX...",
  "summary": {
    "started": 2,
    "ended": 1,
    "errors": 0
  },
  "details": {
    "startedAuctionIds": ["id1", "id2"],
    "endedAuctionIds": ["id3"],
    "errors": []
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error message",
  "timestamp": "2025-01-XX..."
}
```

## Support

For issues or questions:
1. Check server logs
2. Review this documentation
3. Test manually with curl
4. Contact support team

---

**Last Updated**: January 2025


























