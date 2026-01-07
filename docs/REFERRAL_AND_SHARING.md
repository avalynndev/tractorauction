# Social Sharing and Referral Program

This document describes the social sharing and referral program implementation.

## Features Implemented

### 1. Referral System

#### Database Schema
- **User Model**: Added referral fields:
  - `referralCode`: Unique code for each user
  - `referredBy`: User ID who referred this user
  - `referralCount`: Total number of successful referrals
  - `referralRewards`: Total rewards earned from referrals

- **Referral Model**: Tracks individual referrals:
  - `referrerId`: User who made the referral
  - `referredUserId`: User who was referred
  - `referralCode`: The code that was used
  - `status`: PENDING, ACTIVE, COMPLETED, EXPIRED
  - `rewardAmount`: Reward amount for this referral
  - `rewardType`: Type of reward (DISCOUNT, CREDIT, CASHBACK)
  - `rewardGiven`: Whether reward has been given

#### API Endpoints

1. **GET `/api/referral/generate`**
   - Generates or retrieves user's referral code
   - Returns referral code and referral link
   - Requires authentication

2. **GET `/api/referral/stats`**
   - Returns comprehensive referral statistics:
     - Total referrals
     - Active/completed/pending referrals
     - Referral rewards
     - List of referred users
     - Who referred the current user (if any)
   - Requires authentication

#### Registration Integration
- Registration form accepts optional `referralCode` parameter
- URL parameter `?ref=CODE` automatically fills referral code
- When a new user registers with a referral code:
  - Referral record is created
  - Referrer's `referralCount` is incremented
  - Referral status is set to PENDING

### 2. Social Sharing

#### ShareButton Component
- Reusable component for sharing content
- Supports multiple sharing methods:
  - Native Web Share API (mobile devices)
  - Copy to clipboard
  - Facebook
  - Twitter/X
  - WhatsApp
- Two variants:
  - `default`: Full button with text
  - `icon`: Icon-only button with dropdown menu

#### Integration Points
- **Auctions Page**: Share buttons on auction cards
- **Pre-approved Vehicles Page**: Share buttons on vehicle cards
- **Referral Dashboard**: Share referral links

## Usage

### For Users

1. **Get Your Referral Code**:
   - Go to `/my-account/referral`
   - Your unique referral code is displayed
   - Copy your referral link

2. **Share Your Referral**:
   - Use the share button to share via social media
   - Or copy the link and share manually
   - Share link format: `https://www.tractorauction.in/register?ref=YOURCODE`

3. **Track Referrals**:
   - View all your referrals in the referral dashboard
   - See status of each referral (Pending, Active, Completed)
   - Track your total rewards

### For Developers

#### Adding Share Button to a Page

```tsx
import ShareButton from "@/components/sharing/ShareButton";

<ShareButton
  url="/auctions/123"
  title="Auction Title"
  description="Check out this amazing auction!"
  variant="icon" // or "default"
/>
```

#### Using Referral API

```typescript
// Get referral code
const response = await fetch("/api/referral/generate", {
  headers: { Authorization: `Bearer ${token}` },
});
const { referralCode, referralLink } = await response.json();

// Get stats
const statsResponse = await fetch("/api/referral/stats", {
  headers: { Authorization: `Bearer ${token}` },
});
const stats = await statsResponse.json();
```

## Database Migration

After updating the schema, run:

```bash
npx prisma generate
npx prisma db push
```

This will:
1. Add referral fields to User model
2. Create Referral model
3. Create ReferralStatus enum
4. Add necessary indexes

## Reward System (Future Enhancement)

The referral system is set up to support rewards, but reward logic needs to be implemented:

1. **Reward Triggers**: Define when rewards are given:
   - On registration (immediate)
   - On first purchase
   - On membership purchase
   - On reaching milestones

2. **Reward Types**:
   - Discount codes
   - Account credits
   - Cashback
   - Membership extensions

3. **Admin Interface**: Create admin panel to:
   - Configure reward amounts
   - Approve/manage rewards
   - View referral analytics

## Next Steps

1. **Implement Reward Logic**: Add automatic reward distribution
2. **Admin Dashboard**: Create admin interface for referral management
3. **Email Notifications**: Notify users when they earn rewards
4. **Referral Leaderboard**: Show top referrers
5. **QR Code Generation**: Generate QR codes for referral links
6. **Analytics**: Track referral conversion rates

## Files Created/Modified

### New Files
- `app/api/referral/generate/route.ts` - Generate referral code
- `app/api/referral/stats/route.ts` - Get referral statistics
- `app/my-account/referral/page.tsx` - Referral dashboard
- `components/sharing/ShareButton.tsx` - Share button component
- `docs/REFERRAL_AND_SHARING.md` - This documentation

### Modified Files
- `prisma/schema.prisma` - Added referral fields and Referral model
- `app/api/auth/register/route.ts` - Added referral tracking
- `app/register/page.tsx` - Added referral code input field
- `app/auctions/page.tsx` - Added share buttons
- `app/preapproved/page.tsx` - Added share buttons
- `app/my-account/page.tsx` - Added referral program link

