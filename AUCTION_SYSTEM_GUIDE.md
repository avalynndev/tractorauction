# Auction System Implementation Guide

## Phase 6: Auction System - Complete Implementation

This document describes the complete auction bidding system with real-time updates, bid management, and seller approval workflow.

## Features Implemented

### 1. **Real-Time Bidding with WebSockets**
   - Socket.io integration for live bid updates
   - Automatic UI updates when new bids are placed
   - Connection status indicator

### 2. **Live Auction Interface**
   - Dedicated live auction page (`/auctions/[id]/live`)
   - Real-time countdown timer
   - Current bid display
   - Recent bids list
   - Bid placement form with validation

### 3. **Bid Increment Logic**
   - Enforces minimum bid increment per auction
   - Validates bid amount against current bid + increment
   - Shows minimum bid requirement to users
   - Quick bid button for minimum amount

### 4. **Auction Timer**
   - Real-time countdown showing time remaining
   - Displays "Starts in..." for scheduled auctions
   - Shows "Auction Ended" when time expires
   - Updates every second

### 5. **Highest Bidder Tracking**
   - Automatically marks winning bid
   - Updates auction currentBid field
   - Tracks all bids with bidder information
   - Shows winner after auction ends

### 6. **Seller Approval Workflow**
   - After auction ends, seller can approve/reject highest bid
   - Seller sees pending approval status in "My Auctions"
   - On approval: Creates purchase record and marks vehicle as SOLD
   - On rejection: Auction remains ended but no sale

### 7. **Admin Auction Management**
   - View all auctions (scheduled, live, ended)
   - Manually start auctions
   - Manually end auctions
   - View bid history and winner information
   - Access via `/admin/auctions`

## File Structure

### New Files Created:
- `server.js` - Custom Next.js server with Socket.io
- `lib/socket.ts` - Socket.io helper functions
- `app/api/socket/route.ts` - Socket endpoint placeholder
- `app/api/auctions/[id]/route.ts` - Get single auction details
- `app/api/auctions/[id]/bids/route.ts` - Place bid & get bids
- `app/api/auctions/[id]/start/route.ts` - Admin: Start auction
- `app/api/auctions/[id]/end/route.ts` - Admin: End auction
- `app/api/auctions/[id]/approve/route.ts` - Seller: Approve/reject bid
- `app/api/auctions/update-status/route.ts` - Auto-update auction statuses
- `app/api/admin/auctions/route.ts` - Admin: Get all auctions
- `app/api/my-account/auctions/seller/route.ts` - Seller's auctions
- `app/api/my-account/auctions/buyer/route.ts` - Buyer's auctions
- `app/auctions/[id]/live/page.tsx` - Live auction page
- `app/admin/auctions/page.tsx` - Admin auction management
- `app/my-account/auctions/page.tsx` - User's auctions/bids

### Modified Files:
- `package.json` - Updated scripts to use custom server
- `app/auctions/page.tsx` - Links to live auction page
- `app/vehicles/[id]/page.tsx` - Links to live auction for auction vehicles
- `app/my-account/page.tsx` - Added "My Auctions" link
- `app/admin/page.tsx` - Added "Manage Auctions" link

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration
```bash
npx prisma db push
```

### 3. Start Development Server
```bash
npm run dev
```

The custom server (`server.js`) will start Next.js with Socket.io support.

### 4. Set Up Automatic Auction Status Updates (Optional)

You can set up a cron job or scheduled task to call `/api/auctions/update-status` periodically (every minute) to automatically start and end auctions based on their scheduled times.

Example cron job:
```bash
*/1 * * * * curl -X POST http://localhost:3000/api/auctions/update-status
```

Or use a service like:
- Vercel Cron Jobs
- GitHub Actions
- External cron service

## Usage Guide

### For Buyers:

1. **Browse Auctions**
   - Visit `/auctions` to see all live and scheduled auctions
   - Click "Bid Now" on any live auction

2. **Place Bids**
   - Go to `/auctions/[id]/live` for live auction page
   - Enter bid amount (must be at least current bid + minimum increment)
   - Click "Place Bid" or use "Quick Bid" button
   - See real-time updates as other users bid

3. **View My Bids**
   - Go to "My Account" → "Buy" tab → "My Auctions"
   - See all auctions where you've placed bids
   - Track winning bids and auction outcomes

### For Sellers:

1. **List Vehicle for Auction**
   - Upload vehicle and select "Auction" as sale type
   - Admin will approve and schedule the auction

2. **Approve Winning Bid**
   - After auction ends, go to "My Account" → "Sell" tab → "My Auctions"
   - See pending approval auctions
   - Click "Approve Bid" or "Reject Bid"
   - On approval, vehicle status changes to SOLD

### For Admins:

1. **Approve Vehicles**
   - Go to `/admin` to see pending vehicles
   - Set auction schedule (start time, end time, increment)
   - Approve vehicles to create auction records

2. **Manage Auctions**
   - Go to `/admin/auctions` to see all auctions
   - Manually start scheduled auctions if needed
   - Manually end live auctions if needed
   - View bid history and winners

3. **Bulk Operations**
   - Use bulk scheduling to set same times for multiple auctions
   - Bulk approve vehicles with same schedule

## API Endpoints

### Public Endpoints:
- `GET /api/auctions` - Get all live/scheduled auctions
- `GET /api/auctions/[id]` - Get single auction details
- `GET /api/auctions/[id]/bids` - Get bids for an auction

### Authenticated Endpoints:
- `POST /api/auctions/[id]/bids` - Place a bid (requires active membership)
- `GET /api/my-account/auctions/seller` - Get seller's auctions
- `GET /api/my-account/auctions/buyer` - Get buyer's auctions
- `POST /api/auctions/[id]/approve` - Seller approve/reject bid

### Admin Endpoints:
- `GET /api/admin/auctions` - Get all auctions
- `POST /api/auctions/[id]/start` - Start an auction
- `POST /api/auctions/[id]/end` - End an auction
- `POST /api/auctions/update-status` - Auto-update statuses

## WebSocket Events

### Client → Server:
- `join-auction` - Join an auction room (auctionId)
- `leave-auction` - Leave an auction room (auctionId)

### Server → Client:
- `new-bid` - New bid placed (data: { bid, currentBid })
- `auction-ended` - Auction has ended

## Bid Validation Rules

1. **Membership Required**: User must have active membership (trial or paid)
2. **Auction Status**: Auction must be LIVE
3. **Time Check**: Current time must be between startTime and endTime
4. **Self-Bid Prevention**: Seller cannot bid on their own vehicle
5. **Minimum Increment**: Bid must be >= currentBid + minimumIncrement
6. **Reserve Price**: First bid must meet or exceed reserve price

## Auction Status Flow

1. **SCHEDULED** → Created when admin approves auction vehicle
2. **LIVE** → Automatically starts at startTime (or manually by admin)
3. **ENDED** → Automatically ends at endTime (or manually by admin)
   - Winner is determined (highest bidder)
   - Seller approval status set to PENDING
4. **APPROVED** → Seller approves winning bid
   - Purchase record created
   - Vehicle status → SOLD
5. **REJECTED** → Seller rejects winning bid
   - Auction remains ended
   - Vehicle can be relisted

## Testing the System

1. **Create Test Users**:
   - Register as Seller
   - Register as Buyer
   - Set one user as ADMIN in database

2. **Test Auction Flow**:
   - Seller uploads vehicle (Auction type)
   - Admin approves and schedules auction
   - Buyer places bids
   - Auction ends automatically or manually
   - Seller approves/rejects bid

3. **Test Real-Time Updates**:
   - Open live auction page in multiple browsers
   - Place bid in one browser
   - See update in other browsers instantly

## Troubleshooting

### Socket.io Not Connecting:
- Ensure `server.js` is running (not `next dev` directly)
- Check that Socket.io path matches (`/api/socket`)
- Verify CORS settings in `server.js`

### Bids Not Updating in Real-Time:
- Check browser console for Socket.io errors
- Verify Socket.io server is running
- Check network tab for WebSocket connection

### Auction Status Not Updating:
- Call `/api/auctions/update-status` manually
- Set up cron job for automatic updates
- Check database for correct startTime/endTime values

## Next Steps

1. Set up automatic auction status updates (cron job)
2. Add email/SMS notifications for:
   - Auction starting
   - New bid placed
   - Outbid notifications
   - Auction ending
   - Seller approval required
3. Add payment integration for completed sales
4. Add bid history export/reporting
5. Add auction analytics dashboard





























