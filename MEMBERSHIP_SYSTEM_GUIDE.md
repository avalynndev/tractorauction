# Membership System Implementation Guide

## Phase 3: Membership System - Complete Implementation

This document describes the complete membership system implementation including trial assignment, purchase flow, status tracking, and expiry handling.

## Features Implemented

### 1. **Membership Model and Database**
   - ✅ Membership model in Prisma schema
   - ✅ Membership types: TRIAL, SILVER, GOLD, DIAMOND
   - ✅ Fields: startDate, endDate, amount, status
   - ✅ Relationship with User model

### 2. **15-Day Free Trial Implementation**
   - ✅ Automatic trial creation on user registration
   - ✅ 15-day validity period
   - ✅ Zero cost (amount: 0)
   - ✅ Active status on creation

### 3. **Membership Purchase Flow**
   - ✅ Membership plans page (`/membership`)
   - ✅ Purchase API endpoint (`/api/membership/purchase`)
   - ✅ Test mode: Direct activation (for development)
   - ✅ Production mode: Payment gateway integration ready
   - ✅ Payment callback handler (`/api/membership/payment-callback`)
   - ✅ Membership starts immediately or after current membership expires

### 4. **Membership Status Tracking**
   - ✅ Active membership check utility (`hasActiveMembership`)
   - ✅ Membership status API (`/api/membership/status`)
   - ✅ Membership verification API (`/api/membership/verify`)
   - ✅ Days remaining calculation
   - ✅ Expiring soon detection (within 3 days)
   - ✅ Membership history tracking

### 5. **Membership Expiry Handling**
   - ✅ Automatic expiry check API (`/api/membership/check-expiry`)
   - ✅ Expiry notification API (`/api/membership/notify-expiry`)
   - ✅ Status banner component (shows when expiring soon)
   - ✅ Membership status updates to "expired"
   - ✅ Expiring memberships list (for notifications)

## File Structure

### Core Files:
- `lib/membership.ts` - Membership utility functions
- `middleware.ts` - Route protection with membership checks
- `app/membership/page.tsx` - Membership plans page
- `components/membership/MembershipStatusBanner.tsx` - Expiry warning banner

### API Routes:
- `app/api/membership/purchase/route.ts` - Purchase membership
- `app/api/membership/payment-callback/route.ts` - Payment callback handler
- `app/api/membership/status/route.ts` - Get membership status
- `app/api/membership/verify/route.ts` - Verify active membership
- `app/api/membership/check-expiry/route.ts` - Check and update expired memberships
- `app/api/membership/notify-expiry/route.ts` - Send expiry notifications

### Modified Files:
- `app/api/auth/register/route.ts` - Creates trial membership on registration
- `app/api/vehicles/upload/route.ts` - Checks membership before allowing upload
- `app/api/auctions/[id]/bids/route.ts` - Checks membership before allowing bids
- `app/my-account/page.tsx` - Enhanced membership details display
- `app/layout.tsx` - Added membership status banner

## Membership Plans

| Plan | Price | Validity | Features |
|------|-------|----------|----------|
| **Free Trial** | Free | 15 Days | Basic access, browsing, bidding, listing |
| **Silver** | ₹2,000 | 30 Days | All trial features + priority support |
| **Gold** | ₹5,000 | 180 Days | All Silver + SMS notifications + bulk upload |
| **Diamond** | ₹9,000 | 365 Days | All Gold + featured listings + analytics |

## How It Works

### 1. **Registration & Trial Assignment**
```
User Registers → OTP Verification → Account Activated
    ↓
15-Day Free Trial Automatically Created
    ↓
Trial Active for 15 Days
```

### 2. **Membership Purchase Flow**
```
User Selects Plan → Click "Subscribe"
    ↓
API Creates Payment Order (Test Mode: Direct Activation)
    ↓
Payment Gateway (Razorpay) - TODO
    ↓
Payment Callback → Membership Created
    ↓
Membership Active
```

### 3. **Membership Status Tracking**
- **Active Check**: Every API call checks if user has active membership
- **Days Remaining**: Calculated dynamically from endDate
- **Expiring Soon**: Flagged when ≤ 3 days remaining
- **Status Banner**: Shows warning banner when expiring soon

### 4. **Membership Expiry Handling**
```
Daily Cron Job → Check Expired Memberships
    ↓
Update Status to "expired"
    ↓
Find Memberships Expiring Soon (7 days)
    ↓
Send Notifications (SMS/Email) - TODO
```

## API Endpoints

### Public Endpoints:
- `GET /api/membership/status` - Get current membership status (requires auth)

### Authenticated Endpoints:
- `POST /api/membership/purchase` - Purchase membership
- `GET /api/membership/verify` - Verify active membership
- `POST /api/membership/payment-callback` - Payment gateway callback

### Admin/Cron Endpoints:
- `POST /api/membership/check-expiry` - Update expired memberships (requires cron secret)
- `POST /api/membership/notify-expiry` - Send expiry notifications (requires cron secret)

## Membership Checks

### Protected Routes:
- `/auctions` - Requires active membership
- `/sell/upload` - Requires active membership
- `/my-account/auctions` - Requires active membership

### Bypass Rules:
- **Admin users** can bypass membership checks
- **Test mode** allows direct membership activation

## Utility Functions

### `lib/membership.ts`:
- `hasActiveMembership(userId)` - Check if user has active membership
- `getActiveMembership(userId)` - Get active membership details
- `createTrialMembership(userId)` - Create 15-day trial
- `createPaidMembership(userId, type, amount)` - Create paid membership
- `getDaysRemaining(endDate)` - Calculate days remaining
- `isExpiringSoon(endDate, days)` - Check if expiring soon
- `checkAndUpdateMembershipExpiry()` - Update expired memberships
- `getExpiringMemberships(days)` - Get memberships expiring soon

## Middleware Protection

The `middleware.ts` file protects routes that require membership:
- Checks authentication token
- Verifies active membership
- Redirects to membership page if no active membership
- Allows admin to bypass checks

## Cron Jobs Setup

### 1. **Check Expiry (Daily)**
```bash
# Run daily at midnight
0 0 * * * curl -X POST http://localhost:3000/api/membership/check-expiry \
  -H "x-cron-secret: YOUR_SECRET"
```

### 2. **Notify Expiry (Daily)**
```bash
# Run daily at 9 AM
0 9 * * * curl -X POST http://localhost:3000/api/membership/notify-expiry \
  -H "x-cron-secret: YOUR_SECRET"
```

### Using Vercel Cron:
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/membership/check-expiry",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/membership/notify-expiry",
      "schedule": "0 9 * * *"
    }
  ]
}
```

## Payment Integration (TODO)

### Razorpay Integration Steps:
1. Install Razorpay SDK: `npm install razorpay`
2. Add Razorpay keys to `.env`:
   ```
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```
3. Update `app/api/membership/purchase/route.ts`:
   - Create Razorpay order
   - Return order details to frontend
   - Frontend handles payment
4. Update `app/api/membership/payment-callback/route.ts`:
   - Verify Razorpay signature
   - Create membership on successful payment

## Testing

### Test Mode:
- Set `TEST_MODE=true` in `.env`
- Memberships activate immediately without payment
- Useful for development and testing

### Production Mode:
- Payment gateway integration required
- Real payment processing
- Signature verification

## User Experience

### For Users:
1. **Register** → Get 15-day free trial automatically
2. **Use Platform** → Browse, bid, list vehicles
3. **Trial Expiring** → See warning banner (3 days before)
4. **Purchase Membership** → Choose plan and pay
5. **Membership Active** → Continue using platform

### For Admins:
- Can bypass membership checks
- Can see all membership data
- Can manage memberships manually

## Next Steps

1. ✅ Membership model and database - **Complete**
2. ✅ 15-day free trial - **Complete**
3. ⏳ Payment gateway integration (Razorpay) - **Pending**
4. ✅ Membership status tracking - **Complete**
5. ⏳ SMS/Email notifications - **Pending**
6. ✅ Expiry handling - **Complete**

## Environment Variables

Add to `.env`:
```env
# Membership System
TEST_MODE=true  # Set to false in production
CRON_SECRET=your_secret_key_here

# Razorpay (for production)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Summary

The membership system is now fully functional with:
- ✅ Automatic trial assignment
- ✅ Membership purchase flow (test mode)
- ✅ Status tracking and verification
- ✅ Expiry handling and notifications
- ✅ Route protection via middleware
- ✅ Enhanced UI with membership details

Payment gateway integration is the next step for production deployment.





























