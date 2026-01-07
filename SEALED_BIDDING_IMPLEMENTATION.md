# Sealed/Closed Bidding Implementation Guide

## Current State Analysis

### ✅ What's Currently Implemented (Partial Sealed Bidding)

Looking at `app/auctions/[id]/live/page.tsx`:

1. **Bid Count Display** (Line 808):
   ```tsx
   <span className="font-semibold text-primary-600">
     {auction.bids.length} {auction.bids.length === 1 ? 'bid' : 'bids'}
   </span>
   ```
   - Shows total number of bids
   - ✅ Good for sealed bidding

2. **Confidential Message** (Line 816):
   ```tsx
   <p className="text-xs text-gray-600 text-center">
     💡 Bid amounts are confidential. Place your best bid!
   </p>
   ```
   - Message indicates sealed bidding intent
   - ✅ Good messaging

3. **Current Bid Hidden During Live** (Line 795-819):
   - During live auction: Shows "Bidding Active" but NOT the current bid amount
   - After auction ends: Shows winning bid
   - ✅ Partially correct

### ❌ What's Missing (True Sealed Bidding)

1. **Bid History Visibility**:
   - Current: `auction.bids` array is fetched and could be displayed
   - Required: Bids should be completely hidden from all users during auction
   - Required: Only show user's own bids during auction

2. **API Endpoint Security**:
   - Current: `/api/auctions/[id]/bids` returns ALL bids to any authenticated user
   - Required: Return only user's own bids during auction
   - Required: Return all bids only after auction ends OR for admin

3. **Bid Position Calculation** (Line 395):
   - Current: Calculates user's position by sorting all bids
   - Required: Don't show position during sealed bidding (or show only "Your bid is recorded")

4. **WebSocket Updates**:
   - Current: May broadcast bid updates to all users
   - Required: Only broadcast bid count, NOT bid amounts or bidder info

---

## Required Changes for True Sealed Bidding

### 1. Database Schema Updates

```prisma
model Auction {
  // ... existing fields ...
  biddingType         BiddingType         @default(SEALED) // OPEN or SEALED
  bidVisibility       BidVisibility       @default(HIDDEN) // VISIBLE or HIDDEN
  // ... existing fields ...
}

enum BiddingType {
  OPEN    // Bids visible to all (traditional)
  SEALED  // Bids hidden until auction ends (closed auction)
}

enum BidVisibility {
  VISIBLE  // Show bids to all users
  HIDDEN   // Hide bids from other users (sealed)
}
```

### 2. API Route Changes

#### Current: `/api/auctions/[id]/bids` (GET)
**Problem**: Returns all bids to any authenticated user

**Required Changes**:
```typescript
export async function GET(request: NextRequest, { params }) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { bids: true }
  });

  // Check if auction is sealed and still live
  const isSealed = auction.biddingType === "SEALED";
  const isLive = auction.status === "LIVE" && new Date() < auction.endTime;
  const isAdmin = decoded.role === "ADMIN";

  if (isSealed && isLive && !isAdmin) {
    // Return only user's own bids
    const userBids = await prisma.bid.findMany({
      where: {
        auctionId,
        bidderId: decoded.userId
      },
      orderBy: { bidTime: "desc" }
    });
    return NextResponse.json(userBids);
  } else {
    // Auction ended or admin - return all bids
    const allBids = await prisma.bid.findMany({
      where: { auctionId },
      include: { bidder: { select: { id: true, fullName: true } } },
      orderBy: { bidAmount: "desc" }
    });
    return NextResponse.json(allBids);
  }
}
```

#### New Route: `/api/auctions/[id]/bids/my` (GET)
**Purpose**: Explicitly get only user's own bids

```typescript
export async function GET(request: NextRequest, { params }) {
  const token = request.headers.get("authorization")?.substring(7);
  const decoded = verifyToken(token);
  
  const userBids = await prisma.bid.findMany({
    where: {
      auctionId: params.id,
      bidderId: decoded.userId
    },
    orderBy: { bidTime: "desc" }
  });
  
  return NextResponse.json(userBids);
}
```

#### New Route: `/api/admin/auctions/[id]/bids` (GET)
**Purpose**: Admin-only route to see all bids (for post-auction review)

```typescript
export async function GET(request: NextRequest, { params }) {
  // Verify admin
  const token = request.headers.get("authorization")?.substring(7);
  const decoded = verifyToken(token);
  
  if (decoded.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  
  const allBids = await prisma.bid.findMany({
    where: { auctionId: params.id },
    include: {
      bidder: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          email: true
        }
      }
    },
    orderBy: { bidAmount: "desc" }
  });
  
  return NextResponse.json(allBids);
}
```

### 3. Frontend Changes

#### Update Live Auction Page (`app/auctions/[id]/live/page.tsx`)

**Remove**:
- Bid history display during live auction
- Current bid amount display (if sealed)
- Bidder names/info (if sealed)

**Add**:
- "Sealed Bidding" indicator badge
- "Your Bids" section (only user's own bids)
- Bid confirmation with bid number
- Message: "Your bids are confidential. All bids will be revealed after auction ends."

**Example Changes**:

```tsx
// Before (shows all bids):
{auction.bids.map(bid => (
  <div key={bid.id}>
    {bid.bidder.fullName}: ₹{bid.bidAmount}
  </div>
))}

// After (sealed bidding):
{isSealed && isLive ? (
  <div>
    <p className="text-sm text-gray-600 mb-4">
      💡 This is a sealed auction. Your bids are confidential.
    </p>
    {/* Show only user's own bids */}
    {myBids.map(bid => (
      <div key={bid.id} className="bg-blue-50 p-3 rounded mb-2">
        <p className="font-semibold">Your Bid #{bid.id.slice(-6)}</p>
        <p className="text-lg">₹{bid.bidAmount.toLocaleString("en-IN")}</p>
        <p className="text-xs text-gray-500">
          Placed: {formatDateTime(bid.bidTime)}
        </p>
      </div>
    ))}
  </div>
) : (
  // After auction ends - show all bids
  <div>
    {auction.bids.map(bid => (
      <div key={bid.id}>
        {bid.bidder.fullName}: ₹{bid.bidAmount}
      </div>
    ))}
  </div>
)}
```

### 4. WebSocket Updates

**Current**: May broadcast bid details to all users

**Required**: Only broadcast:
- Bid count (total number of bids)
- Auction status
- Time remaining
- NOT bid amounts
- NOT bidder information

```typescript
// In bid placement API
if (global.io) {
  // For sealed bidding - only broadcast count, not details
  if (auction.biddingType === "SEALED") {
    const bidCount = await prisma.bid.count({ where: { auctionId } });
    global.io.to(`auction-${auctionId}`).emit("bid-update", {
      bidCount,
      // Don't send bid amount or bidder info
    });
  } else {
    // Open bidding - send full details
    global.io.to(`auction-${auctionId}`).emit("new-bid", {
      bid: newBid,
      currentBid: updatedAuction.currentBid,
    });
  }
}
```

### 5. Admin Review Interface

**New Page**: `/admin/auctions/[id]/review`

**Features**:
- Table showing ALL bids (sorted by amount, descending)
- Bidder information (name, contact)
- Bid amount
- Bid timestamp
- Reserve price indicator
- "Highest bid meets reserve?" check
- Winner selection interface
- Tie-breaker tool (if same amount, earliest wins)

---

## Implementation Checklist

### Phase 1: Database & API (Week 1)
- [ ] Add `biddingType` and `bidVisibility` to Auction model
- [ ] Update `/api/auctions/[id]/bids` to filter by user during sealed live auction
- [ ] Create `/api/auctions/[id]/bids/my` route
- [ ] Create `/api/admin/auctions/[id]/bids` route
- [ ] Update bid placement API to handle sealed bidding

### Phase 2: Frontend Updates (Week 1-2)
- [ ] Update live auction page to hide bid history during sealed auction
- [ ] Add "Sealed Bidding" indicator badge
- [ ] Add "Your Bids" section (only user's own bids)
- [ ] Remove current bid amount display during live sealed auction
- [ ] Update WebSocket handlers to not broadcast bid details
- [ ] Add bid confirmation with bid number

### Phase 3: Admin Review (Week 2)
- [ ] Create admin bids review page
- [ ] Add winner selection interface
- [ ] Add tie-breaker logic
- [ ] Add reserve price check
- [ ] Add winner confirmation flow

### Phase 4: Post-Auction Display (Week 2)
- [ ] Show all bids after auction ends
- [ ] Display winner information
- [ ] Show bid history publicly
- [ ] Add auction results page

---

## Key Differences: Open vs Sealed Bidding

| Feature | Open Bidding (Current Partial) | Sealed Bidding (Required) |
|---------|-------------------------------|---------------------------|
| **Bid Visibility** | All users see all bids | Only user sees own bids |
| **Current Bid** | Visible to all | Hidden during auction |
| **Bid History** | Visible to all | Hidden during auction |
| **Bidder Names** | Visible | Hidden during auction |
| **Bid Amounts** | Visible | Hidden during auction |
| **Bid Count** | Visible | Visible (OK) |
| **After Auction** | All bids visible | All bids revealed |
| **Admin Review** | Not needed | Required for winner selection |

---

## User Experience Flow

### During Sealed Auction (Live):
1. User sees auction details
2. User sees timer
3. User sees "Sealed Bidding" badge
4. User sees bid count (e.g., "15 bids placed")
5. User sees ONLY their own bids
6. User places bid → Gets confirmation with bid number
7. User does NOT see other users' bids
8. User does NOT see current highest bid

### After Auction Ends:
1. All bids are revealed
2. All users can see bid history
3. Winner is announced
4. Admin reviews and confirms winner

### Admin Post-Auction:
1. Admin sees all bids in table
2. Admin checks reserve price
3. Admin selects winner (or auto-selects highest)
4. Admin confirms winner
5. System notifies winner and non-winners

---

## Testing Scenarios

1. **Sealed Bidding During Live Auction**:
   - [ ] User A places bid → Only sees their own bid
   - [ ] User B places bid → Only sees their own bid
   - [ ] User A cannot see User B's bid
   - [ ] Bid count updates for all users
   - [ ] Current bid amount is hidden

2. **After Auction Ends**:
   - [ ] All users can see all bids
   - [ ] Bid history is displayed
   - [ ] Winner is shown

3. **Admin Review**:
   - [ ] Admin can see all bids
   - [ ] Admin can see bidder information
   - [ ] Admin can select winner
   - [ ] Reserve price check works

---

## Summary

**Current State**: Partial sealed bidding (bids somewhat hidden, but not fully implemented)

**Required State**: True sealed bidding where:
- ✅ Bids completely hidden during auction
- ✅ Users only see their own bids
- ✅ Admin sees all bids for review
- ✅ All bids revealed after auction ends
- ✅ Winner determined by admin review

**Priority**: HIGH - This is a core feature of closed e-auction systems



