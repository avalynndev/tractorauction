# Seller Approval Workflow Enhancements

## Overview
This document describes the enhanced seller approval workflow with notifications and deadline management.

## Features Implemented

### 1. Enhanced Seller Approval UI
- **Detailed Bid Information**: Sellers can see:
  - Winning bid amount
  - Reserve price
  - Total number of bids received
  - Buyer's full details (name, location, phone, WhatsApp)

- **Rejection Reason Field**: Optional field (up to 500 characters) when rejecting bids

- **Improved Status Display**: Clear visual indicators for:
  - PENDING (yellow/red based on deadline)
  - APPROVED (green)
  - REJECTED (red)

### 2. Approval Deadline System
- **Default Deadline**: 7 days after auction ends (configurable via `APPROVAL_DEADLINE_DAYS` env variable)
- **Deadline Countdown**: Real-time countdown showing:
  - Days remaining
  - Hours remaining (when < 24 hours)
  - Minutes remaining (when < 1 hour)
- **Overdue Indicator**: Visual warning when deadline has passed

### 3. Notification System

#### SMS Notifications (via existing SMS service)
- **Seller Notifications**:
  - When auction ends (with winning bid details)
  - Reminder notifications (3 days before deadline)
  - 24-hour deadline warning
- **Buyer Notifications**:
  - When bid is approved (with seller contact info)
  - When bid is rejected

#### Notification Providers
- Uses existing SMS service (Twilio/MSG91/TextLocal)
- Falls back to console logging in development mode
- Supports all configured SMS providers

### 4. Admin Dashboard Enhancements
- **Pending Approvals Filter**: Tab to view only auctions awaiting seller approval
- **Badge Count**: Shows number of pending approvals
- **Seller Contact Info**: Display seller details for follow-up
- **Deadline Tracking**: Shows which approvals are approaching deadline

### 5. Buyer View Enhancements
- **Approval Status**: Buyers can see approval status of their winning bids
- **Status Updates**: Real-time updates in:
  - "My Account" page
  - Auction detail pages
- **Notifications**: SMS alerts when bid is approved/rejected

## API Endpoints

### 1. Approve/Reject Bid
```
POST /api/auctions/[id]/approve
Body: {
  approvalStatus: "APPROVED" | "REJECTED",
  rejectionReason?: string (optional, max 500 chars)
}
```
- Automatically sends notification to buyer
- Creates purchase record if approved
- Updates vehicle status to SOLD if approved

### 2. Reminder Notifications
```
POST /api/auctions/reminders
```
- Sends reminders to sellers with pending approvals
- Can be called manually by admin or via cron job
- Sends:
  - Regular reminders (3 days before deadline)
  - 24-hour warnings

```
GET /api/auctions/reminders
```
- Returns list of pending approvals with deadline info
- Admin only

## Environment Variables

Add to `.env` file:
```env
# Approval deadline in days (default: 7)
APPROVAL_DEADLINE_DAYS=7

# SMS Configuration (use existing SMS provider settings)
# See SMS_PROVIDERS_ALTERNATIVES.md for setup
```

## Usage

### For Sellers
1. When auction ends, seller receives SMS notification
2. Seller logs into "My Account" → "My Auctions"
3. Sees pending approval with:
   - Winning bid details
   - Buyer information
   - Deadline countdown
4. Can approve or reject with optional reason
5. Receives reminder notifications if not responded

### For Buyers
1. When seller approves/rejects, buyer receives SMS notification
2. Buyer can check status in "My Account" → "Buy" tab
3. Status updates in real-time

### For Admins
1. View all auctions in admin dashboard
2. Filter by "Pending Seller Approval"
3. See deadline status and seller contact info
4. Can manually trigger reminder notifications

## Setting Up Reminder Cron Job

To automatically send reminders, set up a cron job:

```bash
# Run every 6 hours
0 */6 * * * curl -X POST https://your-domain.com/api/auctions/reminders \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Or use a service like:
- **Vercel Cron Jobs**: Add to `vercel.json`
- **GitHub Actions**: Schedule workflow
- **External Cron Service**: EasyCron, Cron-job.org, etc.

Example `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/auctions/reminders",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## Notification Messages

### Seller - Auction Ended
```
Dear [Seller Name], Your auction for [Vehicle] has ended. 
Winning bid: ₹[Amount] by [Buyer Name]. 
Please approve or reject within 7 days. 
Login: www.tractorauction.in/my-account/auctions
```

### Seller - Reminder
```
Dear [Seller Name], Reminder: Please approve/reject the winning bid 
of ₹[Amount] for [Vehicle]. [X] day(s) remaining. 
Login: www.tractorauction.in/my-account/auctions
```

### Seller - Deadline Warning
```
Dear [Seller Name], URGENT: Approval deadline for [Vehicle] 
(Winning bid: ₹[Amount]) expires in 24 hours. Please take action. 
Login: www.tractorauction.in/my-account/auctions
```

### Buyer - Bid Approved
```
Dear [Buyer Name], Congratulations! Your bid of ₹[Amount] for [Vehicle] 
has been approved by seller [Seller Name]. Contact: [Phone]. 
Login: www.tractorauction.in/my-account
```

### Buyer - Bid Rejected
```
Dear [Buyer Name], Your bid of ₹[Amount] for [Vehicle] has been 
rejected by the seller. Login: www.tractorauction.in/my-account
```

## Code Structure

### Key Files
- `lib/notifications.ts` - Notification utility functions
- `lib/sms.ts` - Enhanced SMS service (supports general messages)
- `app/api/auctions/[id]/approve/route.ts` - Approval endpoint with notifications
- `app/api/auctions/[id]/end/route.ts` - Auction end with seller notification
- `app/api/auctions/reminders/route.ts` - Reminder system
- `app/my-account/auctions/page.tsx` - Enhanced seller UI with deadline
- `app/admin/auctions/page.tsx` - Admin dashboard with pending filter

## Testing

### Test Notifications (Development Mode)
In development, notifications are logged to console instead of sending SMS:
```
[CONSOLE MODE] SMS Notification to [phone]:
[Message content]
```

### Test Approval Flow
1. Create an auction
2. End the auction (admin)
3. Check seller receives notification (console log)
4. Seller approves/rejects
5. Check buyer receives notification (console log)

## Future Enhancements

Potential improvements:
1. Email notifications (in addition to SMS)
2. In-app notifications (notification center)
3. Automatic rejection if deadline passes
4. Escalation to admin if deadline passes
5. Notification preferences (opt-in/opt-out)
6. Multiple reminder intervals (configurable)

## Troubleshooting

### Notifications Not Sending
1. Check SMS provider configuration (see `SMS_PROVIDERS_ALTERNATIVES.md`)
2. Verify environment variables are set
3. Check console logs for errors
4. In development, notifications are logged to console

### Deadline Not Showing
1. Ensure auction status is "ENDED"
2. Check `sellerApprovalStatus` is "PENDING"
3. Verify `APPROVAL_DEADLINE_DAYS` is set (default: 7)

### Reminders Not Working
1. Verify cron job is set up correctly
2. Check API endpoint is accessible
3. Verify admin token if using manual trigger
4. Check server logs for errors




























