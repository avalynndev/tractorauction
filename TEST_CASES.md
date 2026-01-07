# Test Cases - Sealed Bidding, EMD, Auto-Extend & Admin Review

## Prerequisites

1. **Database Migration**: Run `npx prisma db push` to apply schema changes
2. **Prisma Generate**: Run `npx prisma generate` (if needed)
3. **Test Users**: Create test users with different roles:
   - Admin user
   - Seller user
   - Buyer user (with active membership)
   - Another buyer user (for testing multiple bidders)

---

## TEST SUITE 1: Sealed Bidding System

### Test Case 1.1: Create Sealed Auction
**Objective**: Verify that auctions can be created with sealed bidding enabled

**Steps**:
1. Login as Admin or Seller
2. Create a new vehicle listing
3. Set `saleType` to "AUCTION"
4. In admin approval, ensure `biddingType` is set to "SEALED" (default)
5. Approve the vehicle

**Expected Results**:
- ✅ Auction is created with `biddingType: "SEALED"`
- ✅ Auction appears in auction listings
- ✅ Auction shows "SEALED BIDDING" badge when live

**Database Check**:
```sql
SELECT id, biddingType, bidVisibility FROM "Auction" WHERE id = '<auction_id>';
-- Should show: biddingType = 'SEALED', bidVisibility = 'HIDDEN'
```

---

### Test Case 1.2: Bids Hidden During Live Auction
**Objective**: Verify that bids are not visible to other users during sealed auction

**Steps**:
1. Create a sealed auction (or use existing)
2. Start the auction (set status to LIVE)
3. Login as Buyer 1
4. Place a bid (e.g., ₹50,000)
5. Login as Buyer 2 (different browser/incognito)
6. View the same auction page
7. Check if Buyer 1's bid is visible

**Expected Results**:
- ✅ Buyer 2 cannot see Buyer 1's bid amount
- ✅ Buyer 2 cannot see Buyer 1's name
- ✅ Only bid count is visible (e.g., "1 bid")
- ✅ "SEALED BIDDING" badge is displayed
- ✅ Message: "Your bids are confidential"

**API Test**:
```bash
# As Buyer 1
GET /api/auctions/{auctionId}/bids
# Should return: Only Buyer 1's own bids

# As Buyer 2
GET /api/auctions/{auctionId}/bids
# Should return: Only Buyer 2's own bids (empty if no bids)
```

---

### Test Case 1.3: User Sees Only Own Bids
**Objective**: Verify users can see their own bids during sealed auction

**Steps**:
1. Login as Buyer 1
2. Navigate to live sealed auction
3. Place multiple bids (e.g., ₹50,000, ₹55,000, ₹60,000)
4. Check "Your Bids" section

**Expected Results**:
- ✅ "Your Bids (Confidential)" section appears
- ✅ All of Buyer 1's bids are displayed
- ✅ Each bid shows: Bid #, Amount, Time
- ✅ "Highest" badge on winning bid (if applicable)
- ✅ Other users' bids are NOT visible

---

### Test Case 1.4: Admin Can See All Bids
**Objective**: Verify admin can see all bids for review

**Steps**:
1. End the sealed auction (set status to ENDED)
2. Login as Admin
3. Navigate to `/admin/auctions/{auctionId}/review`
4. Check bids table

**Expected Results**:
- ✅ All bids from all bidders are visible
- ✅ Bids are sorted by amount (descending)
- ✅ Bidder information is displayed (name, contact, email)
- ✅ Bid timestamps are shown

**API Test**:
```bash
# As Admin
GET /api/admin/auctions/{auctionId}/bids
# Should return: All bids with full bidder information
```

---

### Test Case 1.5: Bids Revealed After Auction Ends
**Objective**: Verify all bids are visible after auction ends

**Steps**:
1. End the sealed auction
2. Login as any user (Buyer 1, Buyer 2, or Guest)
3. View the auction page
4. Check bid history

**Expected Results**:
- ✅ All bids are now visible to everyone
- ✅ Bid amounts and bidder names are displayed
- ✅ Bid history is shown publicly
- ✅ Winner is announced (if confirmed)

---

## TEST SUITE 2: EMD (Earnest Money Deposit) System

### Test Case 2.1: Create Auction with EMD Requirement
**Objective**: Verify auctions can require EMD

**Steps**:
1. Login as Admin
2. Create/approve a vehicle auction
3. Set `emdRequired: true` and `emdAmount: 5000` (or any amount)
4. Save auction

**Expected Results**:
- ✅ Auction is created with EMD requirement
- ✅ EMD amount is stored in database
- ✅ Auction shows EMD requirement on details page

**Database Check**:
```sql
SELECT id, emdRequired, emdAmount FROM "Auction" WHERE id = '<auction_id>';
-- Should show: emdRequired = true, emdAmount = 5000
```

---

### Test Case 2.2: EMD Payment Flow
**Objective**: Verify EMD payment process works

**Steps**:
1. Login as Buyer
2. Navigate to auction with EMD requirement
3. Try to place a bid (should show EMD required notice)
4. Click "Pay EMD Now"
5. Complete EMD payment via Razorpay (or test mode)
6. Verify EMD status

**Expected Results**:
- ✅ "EMD Required" notice appears before bidding
- ✅ "Pay EMD Now" button is visible
- ✅ EMD payment modal opens
- ✅ Payment can be completed (test mode or real)
- ✅ EMD status changes to "PAID"
- ✅ "✓ EMD Paid" indicator appears
- ✅ Bidding is now enabled

**API Test**:
```bash
# Check EMD status
GET /api/auctions/{auctionId}/emd
# Should return: { emdRequired: true, emdStatus: "PAID", ... }

# After payment
GET /api/auctions/{auctionId}/emd
# Should return: { emdStatus: "PAID", emd: { status: "PAID", ... } }
```

---

### Test Case 2.3: Bid Blocked Without EMD
**Objective**: Verify bidding is blocked if EMD not paid

**Steps**:
1. Login as Buyer (without paid EMD)
2. Navigate to auction with EMD requirement
3. Try to place a bid directly (without paying EMD)

**Expected Results**:
- ✅ Bid placement is blocked
- ✅ Error message: "EMD of ₹X is required to place bids"
- ✅ User is redirected to pay EMD

**API Test**:
```bash
# Try to place bid without EMD
POST /api/auctions/{auctionId}/bids
Body: { "bidAmount": 50000 }
# Should return: 403 Forbidden with EMD required message
```

---

### Test Case 2.4: EMD Applied to Balance Payment
**Objective**: Verify EMD is applied to winner's balance payment

**Steps**:
1. Complete auction with winner
2. Winner pays EMD (already done)
3. Admin confirms winner
4. Winner proceeds to balance payment
5. Check balance calculation

**Expected Results**:
- ✅ Balance = Total Amount - EMD
- ✅ EMD status changes to "APPLIED"
- ✅ Purchase record shows `emdApplied: true`
- ✅ Purchase record shows `balanceAmount` and `emdAmount`

**Note**: This will be tested when balance payment flow is implemented.

---

### Test Case 2.5: EMD Refund for Non-Winners
**Objective**: Verify EMD is refunded to non-winners

**Steps**:
1. Complete auction with winner
2. Admin confirms winner
3. Admin refunds EMDs to non-winners
4. Check EMD status for non-winners

**Expected Results**:
- ✅ Non-winners' EMD status changes to "REFUNDED"
- ✅ `refundedAt` timestamp is set
- ✅ Refund notification sent (if implemented)

**API Test**:
```bash
# Admin refunds all non-winners
POST /api/admin/auctions/{auctionId}/emd/refund
Body: { "refundAll": true }
# Should return: { refundedCount: X, ... }
```

---

## TEST SUITE 3: Auto-Extend Logic

### Test Case 3.1: Auto-Extend Triggered
**Objective**: Verify auction extends when bid placed near end time

**Steps**:
1. Create auction with:
   - `autoExtendEnabled: true`
   - `autoExtendMinutes: 5`
   - `autoExtendThreshold: 2` (minutes)
2. Set auction end time to 2 minutes from now
3. Wait until 1 minute before end time
4. Place a bid
5. Check auction end time

**Expected Results**:
- ✅ Auction end time is extended by 5 minutes
- ✅ Extension count increases by 1
- ✅ Timer updates automatically
- ✅ Extension notification appears
- ✅ All participants see updated end time

**Database Check**:
```sql
SELECT endTime, extensionCount FROM "Auction" WHERE id = '<auction_id>';
-- endTime should be extended, extensionCount should be 1
```

---

### Test Case 3.2: Multiple Extensions
**Objective**: Verify multiple extensions work up to maximum limit

**Steps**:
1. Create auction with `maxExtensions: 3`
2. Place bids near end time multiple times
3. Check extension count

**Expected Results**:
- ✅ First 3 extensions work (extensionCount: 1, 2, 3)
- ✅ 4th extension is blocked (max limit reached)
- ✅ Extension count badge shows correct number
- ✅ Auction ends after maximum extensions

---

### Test Case 3.3: Extension Not Triggered After Threshold
**Objective**: Verify extension doesn't trigger if bid placed too early

**Steps**:
1. Create auction ending in 5 minutes
2. Place bid when 3 minutes remain (above 2-minute threshold)
3. Check auction end time

**Expected Results**:
- ✅ Auction end time does NOT change
- ✅ Extension count remains 0
- ✅ No extension notification

---

### Test Case 3.4: Extension Display on Frontend
**Objective**: Verify extension count is displayed correctly

**Steps**:
1. Trigger an extension (place bid near end time)
2. View auction page
3. Check timer section

**Expected Results**:
- ✅ Extension badge appears: "Extended 1 time"
- ✅ Timer shows new end time
- ✅ Extension notification toast appears
- ✅ WebSocket updates timer in real-time

---

### Test Case 3.5: Auto-Extend Disabled
**Objective**: Verify auto-extend can be disabled

**Steps**:
1. Create auction with `autoExtendEnabled: false`
2. Place bid near end time
3. Check auction end time

**Expected Results**:
- ✅ Auction end time does NOT change
- ✅ No extension occurs
- ✅ Auction ends at original time

---

## TEST SUITE 4: Admin Post-Auction Review

### Test Case 4.1: Access Admin Review Page
**Objective**: Verify admin can access bids review page

**Steps**:
1. End a sealed auction
2. Login as Admin
3. Navigate to `/admin/auctions/{auctionId}/review`
4. Check page loads

**Expected Results**:
- ✅ Page loads successfully
- ✅ All bids are displayed in table
- ✅ Bids are sorted by amount (descending)
- ✅ Reserve price status is shown
- ✅ Highest bid is highlighted

**Access Control**:
- ✅ Non-admin users cannot access (403 Forbidden)
- ✅ Unauthenticated users redirected to login

---

### Test Case 4.2: Reserve Price Check
**Objective**: Verify reserve price validation

**Steps**:
1. Create auction with `reservePrice: 100000`
2. Place bids: ₹80,000, ₹90,000, ₹95,000
3. End auction
4. Admin reviews bids

**Expected Results**:
- ✅ Reserve price status shows "NOT MET"
- ✅ Red warning: "Reserve Price NOT Met"
- ✅ "Mark as Failed" button is prominent
- ✅ Cannot confirm winner (reserve not met)

**Steps (Reserve Met)**:
1. Place bid: ₹110,000 (above reserve)
2. End auction
3. Admin reviews

**Expected Results**:
- ✅ Reserve price status shows "MET"
- ✅ Green indicator: "Reserve Price Met ✓"
- ✅ "Confirm Winner" button is enabled

---

### Test Case 4.3: Winner Selection
**Objective**: Verify admin can select and confirm winner

**Steps**:
1. End sealed auction with multiple bids
2. Admin reviews bids
3. Select highest bid (radio button)
4. Click "Confirm Winner"
5. Confirm in modal

**Expected Results**:
- ✅ Winner is selected (radio button checked)
- ✅ Confirmation modal shows winner details
- ✅ Winner confirmation succeeds
- ✅ Auction `winnerId` is set
- ✅ Winner bid `isWinningBid` is true
- ✅ Other bids `isWinningBid` is false
- ✅ Auction status remains "ENDED"
- ✅ Seller approval status set to "PENDING"

**Database Check**:
```sql
SELECT winnerId, currentBid, sellerApprovalStatus FROM "Auction" WHERE id = '<auction_id>';
-- Should show: winnerId set, currentBid = winning bid amount, sellerApprovalStatus = 'PENDING'

SELECT isWinningBid FROM "Bid" WHERE auctionId = '<auction_id>';
-- Only winner's bid should have isWinningBid = true
```

---

### Test Case 4.4: Tie-Breaker Logic
**Objective**: Verify tie-breaker selects earliest bid

**Steps**:
1. Create sealed auction
2. Place multiple bids with same amount:
   - Bid 1: ₹50,000 at 10:00 AM
   - Bid 2: ₹50,000 at 10:05 AM
   - Bid 3: ₹50,000 at 10:10 AM
3. End auction
4. Admin reviews bids

**Expected Results**:
- ✅ Tie warning appears: "Tie Detected! X bids have same amount"
- ✅ All tie bids are highlighted
- ✅ Earliest bid (10:00 AM) is auto-selected
- ✅ Admin can manually select different bid if needed
- ✅ Confirmation shows selected bidder

---

### Test Case 4.5: Mark Auction as Failed
**Objective**: Verify admin can mark auction as failed

**Steps**:
1. End auction with reserve NOT met
2. Admin reviews bids
3. Click "Mark Auction as Failed"
4. Confirm action

**Expected Results**:
- ✅ Auction status remains "ENDED"
- ✅ No winner is set
- ✅ Vehicle status returns to "APPROVED" (can be re-auctioned)
- ✅ All bidders are notified (if implemented)
- ✅ EMDs are refunded (if implemented)

---

### Test Case 4.6: Admin Dashboard Integration
**Objective**: Verify ended sealed auctions appear in admin dashboard

**Steps**:
1. End a sealed auction (status: ENDED, no winner)
2. Login as Admin
3. Navigate to `/admin`
4. Check "Pending Auction Approvals" section

**Expected Results**:
- ✅ Ended sealed auction appears in list
- ✅ "Review All Bids" button is visible
- ✅ Clicking button navigates to review page
- ✅ Open bidding auctions show "Approve/Reject Bid" buttons

---

## TEST SUITE 5: Integration Tests

### Test Case 5.1: Complete Sealed Auction Flow
**Objective**: End-to-end test of sealed auction with EMD

**Steps**:
1. **Setup**:
   - Create auction with `biddingType: "SEALED"`, `emdRequired: true`, `emdAmount: 5000`
   - Set auction to start in 1 hour, end in 2 hours

2. **Pre-Bidding**:
   - Buyer 1 views auction → Sees EMD requirement
   - Buyer 1 pays EMD → Status: PAID
   - Buyer 2 views auction → Sees EMD requirement
   - Buyer 2 pays EMD → Status: PAID

3. **Live Bidding**:
   - Auction goes LIVE
   - Buyer 1 places bid: ₹50,000 → Sees own bid only
   - Buyer 2 places bid: ₹55,000 → Sees own bid only
   - Buyer 1 cannot see Buyer 2's bid
   - Bid count shows: "2 bids"

4. **Auto-Extend**:
   - Wait until 1 minute before end
   - Buyer 1 places bid: ₹60,000
   - Auction extends by 5 minutes
   - All users see extension notification

5. **Auction End**:
   - Auction ends (status: ENDED)
   - All bids are now visible to everyone

6. **Admin Review**:
   - Admin reviews all bids
   - Sees: Buyer 2 (₹55,000), Buyer 1 (₹60,000)
   - Selects Buyer 1 as winner
   - Confirms winner

7. **Post-Confirmation**:
   - Winner (Buyer 1) is notified
   - Non-winner (Buyer 2) is notified
   - EMD refunded to Buyer 2 (status: REFUNDED)
   - EMD applied to Buyer 1's balance (status: APPLIED)

**Expected Results**:
- ✅ All steps complete successfully
- ✅ No errors in console
- ✅ Database state is correct
- ✅ All notifications sent (if implemented)

---

### Test Case 5.2: Multiple Bidders Sealed Auction
**Objective**: Test sealed auction with 5+ bidders

**Steps**:
1. Create sealed auction
2. 5 different buyers pay EMD
3. All 5 place bids during live auction
4. End auction
5. Admin reviews all 5 bids
6. Confirm highest bidder as winner

**Expected Results**:
- ✅ All 5 bids are hidden from each other during auction
- ✅ Each bidder sees only their own bids
- ✅ Admin sees all 5 bids in review
- ✅ Winner is correctly determined
- ✅ 4 non-winners' EMDs are refunded

---

## TEST SUITE 6: Edge Cases & Error Handling

### Test Case 6.1: Bid Placement Edge Cases
**Objective**: Test various edge cases for bid placement

**Test Scenarios**:
1. **Bid without membership**: Should fail with "Membership required"
2. **Bid without EMD** (when required): Should fail with "EMD required"
3. **Bid on own vehicle**: Should fail with "Cannot bid on own vehicle"
4. **Bid after auction ended**: Should fail with "Auction has ended"
5. **Bid before auction started**: Should fail with "Auction not started"
6. **Bid below minimum**: Should fail with "Bid must be at least ₹X"

**Expected Results**:
- ✅ All error cases return appropriate error messages
- ✅ No bids are created for invalid attempts
- ✅ Auction state remains unchanged

---

### Test Case 6.2: Auto-Extend Edge Cases
**Objective**: Test edge cases for auto-extend

**Test Scenarios**:
1. **Bid placed exactly at threshold**: Should extend
2. **Bid placed 1 second before end**: Should extend
3. **Bid placed after end time**: Should NOT extend (auction ended)
4. **Maximum extensions reached**: Should NOT extend further
5. **Auto-extend disabled**: Should NOT extend

**Expected Results**:
- ✅ Extensions work correctly in all scenarios
- ✅ Maximum limit is enforced
- ✅ No extensions when disabled

---

### Test Case 6.3: Admin Review Edge Cases
**Objective**: Test edge cases for admin review

**Test Scenarios**:
1. **No bids placed**: Should show "No bids" message
2. **All bids below reserve**: Should show "Reserve NOT Met"
3. **Multiple ties**: Should auto-select earliest
4. **Confirm winner with bid below reserve**: Should fail
5. **Mark failed with bids above reserve**: Should warn admin

**Expected Results**:
- ✅ All edge cases handled gracefully
- ✅ Appropriate error messages
- ✅ No invalid state changes

---

## Database Verification Queries

### Check Auction Configuration
```sql
SELECT 
  id, 
  biddingType, 
  bidVisibility, 
  emdRequired, 
  emdAmount,
  autoExtendEnabled,
  autoExtendMinutes,
  autoExtendThreshold,
  maxExtensions,
  extensionCount
FROM "Auction" 
WHERE id = '<auction_id>';
```

### Check EMD Status
```sql
SELECT 
  id,
  auctionId,
  bidderId,
  amount,
  status,
  paidAt,
  refundedAt,
  appliedToBalance
FROM "EarnestMoneyDeposit"
WHERE auctionId = '<auction_id>';
```

### Check Bids (During Sealed Auction)
```sql
-- Should return all bids (admin view)
SELECT 
  b.id,
  b.bidAmount,
  b.bidTime,
  b.isWinningBid,
  u.fullName as bidderName
FROM "Bid" b
JOIN "User" u ON b.bidderId = u.id
WHERE b.auctionId = '<auction_id>'
ORDER BY b.bidAmount DESC;
```

### Check Winner Confirmation
```sql
SELECT 
  a.id,
  a.winnerId,
  a.currentBid,
  a.sellerApprovalStatus,
  a.status,
  v.status as vehicleStatus
FROM "Auction" a
JOIN "Vehicle" v ON a.vehicleId = v.id
WHERE a.id = '<auction_id>';
```

---

## API Endpoints to Test

### Sealed Bidding
- `GET /api/auctions/{id}/bids` - Should return only user's bids during sealed live auction
- `GET /api/auctions/{id}/bids/my` - Should return user's own bids
- `GET /api/admin/auctions/{id}/bids` - Should return all bids (admin only)

### EMD
- `GET /api/auctions/{id}/emd` - Check EMD status
- `POST /api/auctions/{id}/emd` - Initiate EMD payment
- `POST /api/auctions/{id}/emd/payment-callback` - EMD payment callback
- `POST /api/admin/auctions/{id}/emd/refund` - Refund EMD (admin)

### Auto-Extend
- `POST /api/auctions/{id}/bids` - Place bid (triggers auto-extend if conditions met)

### Admin Review
- `GET /api/admin/auctions/{id}/bids` - Get all bids for review
- `POST /api/admin/auctions/{id}/confirm-winner` - Confirm winner
- `POST /api/admin/auctions/{id}/mark-failed` - Mark auction as failed

---

## Test Data Setup

### Create Test Auction (via Admin/API)
```json
{
  "vehicleId": "<vehicle_id>",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T12:00:00Z",
  "reservePrice": 100000,
  "minimumIncrement": 5000,
  "biddingType": "SEALED",
  "bidVisibility": "HIDDEN",
  "emdRequired": true,
  "emdAmount": 5000,
  "autoExtendEnabled": true,
  "autoExtendMinutes": 5,
  "autoExtendThreshold": 2,
  "maxExtensions": 3
}
```

---

## Success Criteria

### Sealed Bidding
- ✅ Bids completely hidden during live auction
- ✅ Users only see own bids
- ✅ Admin sees all bids for review
- ✅ All bids revealed after auction ends

### EMD System
- ✅ EMD payment works (test mode and real)
- ✅ Bidding blocked without EMD
- ✅ EMD status tracked correctly
- ✅ EMD refunded to non-winners
- ✅ EMD applied to winner's balance

### Auto-Extend
- ✅ Extends when bid placed in last 2 minutes
- ✅ Extends by 5 minutes
- ✅ Maximum 3 extensions
- ✅ Timer updates in real-time
- ✅ All participants notified

### Admin Review
- ✅ All bids visible to admin
- ✅ Reserve price check works
- ✅ Tie-breaker selects earliest
- ✅ Winner confirmation works
- ✅ Mark failed works

---

## Known Issues to Watch For

1. **WebSocket Connection**: Ensure WebSocket server is running for real-time updates
2. **Razorpay Configuration**: Test mode vs production mode
3. **Time Zones**: Ensure all times are in correct timezone
4. **Concurrent Bids**: Test multiple users bidding simultaneously
5. **Database Locks**: Watch for transaction deadlocks with high concurrency

---

## Quick Test Checklist

### Pre-Testing Setup
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`
- [ ] Create test users (Admin, Seller, Buyer 1, Buyer 2)
- [ ] Ensure WebSocket server is running
- [ ] Configure Razorpay (or use test mode)

### Core Features
- [ ] Sealed bidding: Bids hidden during auction
- [ ] EMD: Payment required before bidding
- [ ] Auto-extend: Extends when bid near end
- [ ] Admin review: Can see all bids and confirm winner

### Edge Cases
- [ ] Bid without EMD (should fail)
- [ ] Bid without membership (should fail)
- [ ] Auto-extend max limit (should stop at 3)
- [ ] Reserve price not met (should mark failed)
- [ ] Tie-breaker (should select earliest)

---

## Test Results Template

```
Test Case: [Name]
Date: [Date]
Tester: [Name]
Status: ✅ PASS / ❌ FAIL
Notes: [Any issues or observations]
```

---

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Optimize performance** if needed
3. **Add missing features** (notifications, etc.)
4. **Continue with Phase 5**: Balance Payment Flow
5. **Continue with Phase 6**: EMD Refund Process

---

## Support

If you encounter issues during testing:
1. Check browser console for errors
2. Check server logs
3. Verify database state with SQL queries
4. Test API endpoints directly with Postman/curl
5. Check WebSocket connection status



