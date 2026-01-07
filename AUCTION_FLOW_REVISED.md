# Revised End-to-End Closed E-Auction Flow (With EMD)

## Flow Overview (Based on Your Sample Logic)

```
START → [Admin/SELLER: Create Vehicle Auction] → [System: Status=Draft→Scheduled]

↓ Parallel paths ↓

[Guest: Browse Public Listings] → Decision: "Register?"
  ↓ YES → [Bidder: Complete Registration + KYC] → [System: Verify & Approve]
  ↓ NO → END (browsing only)

[Bidder: View Auction Details] → Decision: "Pay Membership?"
  ↓ NO → "Membership Required" error → Back to details
  ↓ YES → [Bidder: Pay Membership] → [System: Verify Payment] → Decision: "Payment Success?"
    ↓ NO → Error notification → Retry
    ↓ YES → [System: Grant Auction Access] → Status: "Eligible to Bid"

[Bidder: View Auction Details] → Decision: "Pay EMD?(Earnest Money Deposit)"
  ↓ NO → "EMD Required" error → Back to details
  ↓ YES → [Bidder: Pay EMD] → [System: Verify Payment] → Decision: "Payment Success?"
    ↓ NO → Error notification → Retry
    ↓ YES → [System: Grant Auction Access] → Status: "Eligible to Bid"

[Auction: Start Time Reached] → [System: Status=Live] → Notify eligible bidders

[BIDDER LIVE BIDDING PHASE - Closed/Sealed]:
[Bidder: View Timer + Tractor Details (NO bid visibility)]
→ [Bidder: Click "Place Sealed Bid"]
→ [Input: Bid Amount + Optional Docs]
→ Decision: "Valid bid? (≥min, increment, before end)"
  ↓ NO → "Invalid Bid" error → Retry
  ↓ YES → [2-Step Confirm: Preview → Final Submit]
→ [System: Record Sealed Bid (invisible to all bidders)]
→ [Bidder: "Bid #XYZ Confirmed" + Timestamp]
→ Loop until [Decision: "Auction End Time?"]

[Auction: End Time Reached + Auto-extension if enabled]
→ [System: Lock ALL Bidding] → Status=Closed

[ADMIN POST-AUCTION PHASE]:
[Admin: View All Sealed Bids Table]
→ Decision: "Highest bid ≥ Reserve Price?"
  ↓ NO → [System: Auction Failed] → Notify all → END
  ↓ YES → Decision: "Tie-breaker needed?"
    ↓ YES → [Admin: Select earliest/highest]
    ↓ NO → [System: Auto-select Highest]
→ [Admin: Confirm Winner] → [System: Notify Winner + Non-winners]
→ [Winner: Pay Balance] → Decision: "Payment received?"
  ↓ NO → [Extend/Forfeit] → Re-auction?
  ↓ YES → [System: Generate Invoice + Transfer Ownership]
→ ALL END: Update statuses, Refund EMDs, Archive
```

---

## Key Differences from Previous Analysis

### 🔴 CRITICAL: Sealed/Closed Bidding System
- **Bids are NOT visible during auction** (unlike open bidding)
- Bidders only see their own bids
- All bids revealed only after auction ends
- Admin reviews all bids post-auction

### 🔴 CRITICAL: EMD (Earnest Money Deposit) System
- **EMD required before bidding** (separate from membership)
- EMD amount configurable per auction
- EMD refunded to non-winners
- EMD applied to balance payment for winner

### 🔴 CRITICAL: Admin Post-Auction Review
- Admin sees all sealed bids
- Admin confirms winner
- Tie-breaker logic (earliest bid wins if same amount)
- Reserve price check by admin

### 🔴 CRITICAL: Balance Payment
- Winner pays balance (Total - EMD)
- Payment deadline enforcement
- Forfeit logic if payment fails

---

## Revised Implementation Order

### PHASE 1: Foundation & EMD System (Week 1)

#### Task 1.1: Database Schema Updates
- [ ] Add `emdAmount` to Auction model
- [ ] Add `emdRequired` boolean to Auction
- [ ] Create `EarnestMoneyDeposit` model:
  - `id`, `auctionId`, `bidderId`, `amount`, `status` (PENDING, PAID, REFUNDED, FORFEITED, APPLIED)
  - `paymentId`, `paymentReference`, `paidAt`, `refundedAt`
  - `appliedToBalance` boolean
- [ ] Add `biddingType` enum to Auction (OPEN, SEALED)
- [ ] Add `bidVisibility` to Auction (VISIBLE, HIDDEN)
- [ ] Add `balanceAmount` to Purchase (for auction purchases)
- [ ] Add `emdApplied` to Purchase

#### Task 1.2: EMD Payment Flow
- [ ] Create `/api/auctions/[id]/emd` route:
  - `GET`: Check EMD status for user
  - `POST`: Initiate EMD payment
- [ ] EMD payment page/component
- [ ] EMD payment callback handler
- [ ] EMD status check before bidding
- [ ] EMD eligibility verification

#### Task 1.3: Sealed Bidding Infrastructure
- [ ] Update Auction model to support sealed bidding
- [ ] Modify bid API to hide bids from other users
- [ ] Update live auction page to show "Sealed Bidding" mode
- [ ] Remove bid history display during auction
- [ ] Show only user's own bids

---

### PHASE 2: Sealed Bidding Interface (Week 2)

#### Task 2.1: Pre-Bidding Checks
- [ ] Membership verification before auction access
- [ ] EMD payment verification
- [ ] Eligibility status display
- [ ] "Pay EMD" button/flow
- [ ] "Pay Membership" button/flow

#### Task 2.2: Sealed Bidding UI
- [ ] Remove public bid history from live page
- [ ] Show "Sealed Bidding" indicator
- [ ] Display only user's own bids
- [ ] "Place Sealed Bid" button
- [ ] Bid amount input with validation
- [ ] Optional document upload for bid
- [ ] 2-step confirmation (Preview → Submit)
- [ ] Bid confirmation message with bid number
- [ ] "Your Bids" section (only user's bids)

#### Task 2.3: Bid Validation (Sealed Mode)
- [ ] Minimum bid validation
- [ ] Increment validation
- [ ] Time-based validation (before end)
- [ ] EMD status check
- [ ] Membership status check
- [ ] Duplicate bid prevention (optional - allow multiple bids)

---

### PHASE 3: Auction End & Auto-Extend (Week 2-3)

#### Task 3.1: Auto-Extend Logic
- [ ] Auto-extend if bid placed in last X minutes
- [ ] Configurable extension rules
- [ ] Maximum extension limit
- [ ] Extension notifications
- [ ] Timer update with extension

#### Task 3.2: Auction Closure
- [ ] Lock bidding at end time
- [ ] Status update to CLOSED
- [ ] Notify all bidders
- [ ] Final bid count display
- [ ] Auction end confirmation

---

### PHASE 4: Admin Post-Auction Review (Week 3)

#### Task 4.1: Admin Bids Review Interface
- [ ] Create `/admin/auctions/[id]/review` page
- [ ] Display all sealed bids in table
- [ ] Sort by bid amount (descending)
- [ ] Show bidder information
- [ ] Show bid timestamp
- [ ] Show bid documents (if any)
- [ ] Reserve price indicator
- [ ] "Highest bid meets reserve?" indicator

#### Task 4.2: Winner Determination Logic
- [ ] Auto-select highest bid
- [ ] Tie-breaker logic (earliest bid wins)
- [ ] Reserve price check
- [ ] "Auction Failed" if reserve not met
- [ ] Admin confirmation required
- [ ] Winner selection UI

#### Task 4.3: Winner Notification
- [ ] Winner notification (email/SMS)
- [ ] Non-winner notifications
- [ ] Auction failed notifications
- [ ] Notification templates

---

### PHASE 5: Balance Payment & Settlement (Week 4)

#### Task 5.1: Balance Payment Flow
- [ ] Calculate balance (Total - EMD)
- [ ] Winner payment page
- [ ] Payment deadline (24-48 hours)
- [ ] Payment instructions
- [ ] Payment tracking
- [ ] Payment confirmation

#### Task 5.2: EMD Application
- [ ] Apply EMD to balance for winner
- [ ] Calculate remaining balance
- [ ] Update EMD status to APPLIED
- [ ] Display EMD applied amount

#### Task 5.3: Payment Failure Handling
- [ ] Payment deadline tracking
- [ ] Reminder notifications
- [ ] Forfeit logic (if payment fails)
- [ ] Re-auction option
- [ ] EMD forfeiture process

---

### PHASE 6: EMD Refund Process (Week 4)

#### Task 6.1: EMD Refund for Non-Winners
- [ ] Automatic refund after winner confirmed
- [ ] Refund API endpoint
- [ ] Refund status tracking
- [ ] Refund notification
- [ ] Refund history

#### Task 6.2: EMD Refund for Failed Auctions
- [ ] Refund all EMDs if reserve not met
- [ ] Refund all EMDs if auction cancelled
- [ ] Refund processing
- [ ] Refund confirmation

---

### PHASE 7: Invoice & Documentation (Week 5)

#### Task 7.1: Invoice Generation
- [ ] Generate invoice for winner
- [ ] Include EMD amount
- [ ] Include balance amount
- [ ] Tax calculations
- [ ] Download PDF
- [ ] Email invoice

#### Task 7.2: Transaction Completion
- [ ] Payment confirmation
- [ ] Invoice generation
- [ ] Ownership transfer initiation
- [ ] Delivery coordination
- [ ] Transaction completion status

---

### PHASE 8: Delivery & Transfer (Week 5-6)

#### Task 8.1: Delivery Coordination
- [ ] Winner-seller communication
- [ ] Delivery scheduling
- [ ] Delivery address confirmation
- [ ] Delivery tracking
- [ ] Delivery confirmation

#### Task 8.2: Vehicle Transfer
- [ ] RC transfer process
- [ ] Insurance transfer
- [ ] NOC generation
- [ ] Document upload
- [ ] Transfer completion

---

### PHASE 9: Enhanced Features (Week 6-7)

#### Task 9.1: Auction Discovery
- [ ] Auction calendar
- [ ] Advanced search
- [ ] Auction reminders
- [ ] Watchlist functionality

#### Task 9.2: User Experience
- [ ] Quick bid buttons (for sealed bids)
- [ ] Bid amount calculator
- [ ] Enhanced timer
- [ ] Mobile optimization

#### Task 9.3: Analytics & Reporting
- [ ] Auction performance metrics
- [ ] Bidder statistics
- [ ] Revenue reports
- [ ] EMD tracking

---

## Database Schema Changes Required

```prisma
model Auction {
  // ... existing fields ...
  emdAmount           Float?              // EMD amount for this auction
  emdRequired         Boolean             @default(false)
  biddingType         BiddingType         @default(SEALED) // OPEN or SEALED
  bidVisibility       BidVisibility       @default(HIDDEN) // VISIBLE or HIDDEN
  autoExtendEnabled   Boolean             @default(true)
  autoExtendMinutes   Int                 @default(5) // Extend by 5 minutes
  autoExtendThreshold Int                 @default(2) // If bid in last 2 minutes
  maxExtensions       Int                 @default(3) // Maximum 3 extensions
  extensionCount      Int                 @default(0)
  // ... existing fields ...
}

enum BiddingType {
  OPEN    // Bids visible to all
  SEALED  // Bids hidden until auction ends
}

enum BidVisibility {
  VISIBLE  // Show bids to all
  HIDDEN   // Hide bids from others
}

model EarnestMoneyDeposit {
  id                String    @id @default(cuid())
  auctionId         String
  bidderId          String
  amount            Float
  status            EMDStatus @default(PENDING)
  paymentId         String?
  paymentReference  String?
  paidAt            DateTime?
  refundedAt        DateTime?
  appliedToBalance  Boolean   @default(false)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  auction           Auction   @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  bidder            User      @relation(fields: [bidderId], references: [id], onDelete: Cascade)
  
  @@unique([auctionId, bidderId])
  @@index([auctionId])
  @@index([bidderId])
  @@index([status])
}

enum EMDStatus {
  PENDING    // Payment initiated
  PAID       // Payment confirmed
  REFUNDED   // Refunded to non-winner
  FORFEITED  // Forfeited due to non-payment
  APPLIED    // Applied to balance payment
}

model Purchase {
  // ... existing fields ...
  balanceAmount     Float?   // Balance after EMD applied
  emdApplied        Boolean  @default(false)
  emdAmount         Float?   // EMD amount applied
  // ... existing fields ...
}
```

---

## API Routes Required

### EMD Routes
- `GET /api/auctions/[id]/emd` - Check EMD status
- `POST /api/auctions/[id]/emd/pay` - Initiate EMD payment
- `POST /api/auctions/[id]/emd/payment-callback` - EMD payment callback
- `POST /api/auctions/[id]/emd/refund` - Refund EMD (admin)

### Sealed Bidding Routes
- `GET /api/auctions/[id]/bids/my` - Get user's own bids only
- `POST /api/auctions/[id]/bids/sealed` - Place sealed bid
- `GET /api/auctions/[id]/bids/all` - Get all bids (admin only, post-auction)

### Admin Review Routes
- `GET /api/admin/auctions/[id]/bids` - Get all sealed bids for review
- `POST /api/admin/auctions/[id]/confirm-winner` - Confirm winner
- `POST /api/admin/auctions/[id]/mark-failed` - Mark auction as failed

### Balance Payment Routes
- `GET /api/auctions/[id]/winner/payment` - Get balance payment details
- `POST /api/auctions/[id]/winner/payment` - Initiate balance payment
- `POST /api/auctions/[id]/winner/payment-callback` - Balance payment callback

---

## UI Components Required

### Pre-Bidding
- `EMDPaymentModal` - EMD payment interface
- `MembershipPaymentModal` - Membership payment (if needed)
- `EligibilityStatus` - Show eligibility status
- `PreBiddingChecks` - Verify membership + EMD

### Sealed Bidding
- `SealedBidForm` - Place sealed bid form
- `MyBidsList` - Show only user's bids
- `BidConfirmation` - Confirm bid placement
- `SealedBiddingIndicator` - Show "Sealed Bidding" badge

### Admin Review
- `AdminBidsReviewTable` - All bids table
- `WinnerSelectionPanel` - Select and confirm winner
- `ReservePriceChecker` - Check reserve price status
- `TieBreakerSelector` - Handle tie-breaker

### Post-Auction
- `WinnerDashboard` - Winner's post-auction dashboard
- `BalancePaymentFlow` - Balance payment interface
- `EMDRefundStatus` - EMD refund status
- `AuctionResultsPage` - Public results page

---

## Implementation Priority

### 🔴 CRITICAL (Must Have - Week 1-2)
1. EMD System (Payment, Verification, Refund)
2. Sealed Bidding Infrastructure
3. Pre-Bidding Checks (Membership + EMD)
4. Sealed Bid Placement
5. Admin Bids Review Interface

### 🟡 HIGH (Important - Week 3-4)
1. Auto-Extend Logic
2. Winner Determination
3. Balance Payment Flow
4. EMD Application to Balance
5. EMD Refund Process

### 🟢 MEDIUM (Enhancement - Week 5-6)
1. Invoice Generation
2. Delivery Coordination
3. Transaction Completion
4. Enhanced UI/UX

---

## Testing Checklist

### EMD Flow
- [ ] EMD payment initiation
- [ ] EMD payment callback
- [ ] EMD status verification
- [ ] EMD application to balance
- [ ] EMD refund to non-winners
- [ ] EMD forfeiture on payment failure

### Sealed Bidding
- [ ] Bids hidden from other users
- [ ] User can see own bids
- [ ] Admin can see all bids post-auction
- [ ] Bid validation works
- [ ] Multiple bids allowed (if applicable)

### Winner Selection
- [ ] Highest bid selection
- [ ] Tie-breaker logic (earliest wins)
- [ ] Reserve price check
- [ ] Auction failed if reserve not met
- [ ] Winner notification
- [ ] Non-winner notification

### Balance Payment
- [ ] Balance calculation (Total - EMD)
- [ ] Payment deadline enforcement
- [ ] Payment success handling
- [ ] Payment failure handling
- [ ] Forfeit logic

---

## Key Decisions Needed

1. **EMD Amount**: Fixed per auction or percentage of reserve price?
2. **EMD Refund Timing**: Immediate or after winner confirmation?
3. **Multiple Bids**: Allow users to place multiple sealed bids?
4. **Tie-Breaker**: Earliest bid wins, or admin decides?
5. **Payment Deadline**: 24 hours or 48 hours?
6. **Auto-Extend**: Enabled by default or per auction?
7. **Bid Visibility**: Completely hidden or show bid count only?

---

## Next Steps

1. **Review this revised plan** with stakeholders
2. **Confirm EMD amount logic** (fixed vs percentage)
3. **Start with Phase 1** (EMD System + Sealed Bidding Infrastructure)
4. **Implement incrementally** - test each phase
5. **Gather feedback** after each phase

---

## Summary

This revised plan incorporates:
- ✅ EMD system (payment, verification, refund)
- ✅ Sealed/closed bidding (bids hidden during auction)
- ✅ Admin post-auction review
- ✅ Balance payment flow
- ✅ Tie-breaker logic
- ✅ Complete end-to-end flow

**Total Estimated Time**: 6-7 weeks for complete implementation
**Critical Path**: EMD → Sealed Bidding → Admin Review → Balance Payment



