# Quick Test Guide - Sealed Bidding, EMD, Auto-Extend & Admin Review

## 🚀 Quick Start

### 1. Setup (One-time)
```bash
# Apply database changes
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

### 2. Create Test Users
- **Admin**: Role = ADMIN
- **Seller**: Role = SELLER
- **Buyer 1**: Role = BUYER, Active Membership
- **Buyer 2**: Role = BUYER, Active Membership

---

## 📋 Test Scenarios (5-Minute Quick Tests)

### ✅ Test 1: Sealed Bidding (2 minutes)

**Steps**:
1. Admin creates auction with `biddingType: "SEALED"`
2. Auction goes LIVE
3. Buyer 1 places bid → Sees only own bid
4. Buyer 2 places bid → Sees only own bid
5. Buyer 1 checks → Cannot see Buyer 2's bid
6. **Expected**: Bids are hidden from each other ✅

---

### ✅ Test 2: EMD Payment (2 minutes)

**Steps**:
1. Create auction with `emdRequired: true, emdAmount: 5000`
2. Buyer tries to bid → Sees "EMD Required" notice
3. Buyer clicks "Pay EMD Now"
4. Completes payment (test mode)
5. **Expected**: EMD status = PAID, bidding enabled ✅

---

### ✅ Test 3: Auto-Extend (3 minutes)

**Steps**:
1. Create auction ending in 3 minutes
2. Wait until 1 minute before end
3. Place a bid
4. **Expected**: Auction extends by 5 minutes, timer updates ✅

---

### ✅ Test 4: Admin Review (3 minutes)

**Steps**:
1. End sealed auction with multiple bids
2. Admin navigates to `/admin/auctions/{id}/review`
3. Sees all bids in table
4. Selects highest bid
5. Clicks "Confirm Winner"
6. **Expected**: Winner confirmed, auction updated ✅

---

## 🔍 Quick Verification

### Check Sealed Bidding
```sql
SELECT biddingType, bidVisibility FROM "Auction" WHERE id = '<id>';
-- Should be: SEALED, HIDDEN
```

### Check EMD
```sql
SELECT status, amount FROM "EarnestMoneyDeposit" WHERE auctionId = '<id>';
-- Should show: PAID, 5000
```

### Check Auto-Extend
```sql
SELECT extensionCount, endTime FROM "Auction" WHERE id = '<id>';
-- extensionCount should increase, endTime should extend
```

### Check Winner
```sql
SELECT winnerId, currentBid FROM "Auction" WHERE id = '<id>';
-- winnerId should be set, currentBid = winning amount
```

---

## 🐛 Common Issues

### Issue: Bids visible during sealed auction
**Fix**: Check `biddingType = "SEALED"` and `bidVisibility = "HIDDEN"`

### Issue: EMD payment not working
**Fix**: Check Razorpay keys in `.env` or use test mode

### Issue: Auto-extend not triggering
**Fix**: Check `autoExtendEnabled = true` and bid is within threshold

### Issue: Admin review page not loading
**Fix**: Verify user is ADMIN and auction status is ENDED

---

## 📊 Test Results Checklist

- [ ] Sealed bidding: Bids hidden ✅
- [ ] EMD payment: Works ✅
- [ ] Auto-extend: Triggers correctly ✅
- [ ] Admin review: All bids visible ✅
- [ ] Winner confirmation: Works ✅
- [ ] Tie-breaker: Selects earliest ✅
- [ ] Reserve price: Check works ✅

---

## 🎯 Priority Tests

**Must Test First**:
1. Sealed bidding (core feature)
2. EMD payment (payment flow)
3. Admin review (winner selection)

**Can Test Later**:
1. Auto-extend edge cases
2. Multiple extensions
3. EMD refunds

---

## 📝 Test Data

### Create Sealed Auction
```javascript
{
  biddingType: "SEALED",
  bidVisibility: "HIDDEN",
  emdRequired: true,
  emdAmount: 5000,
  autoExtendEnabled: true,
  autoExtendMinutes: 5,
  autoExtendThreshold: 2,
  maxExtensions: 3
}
```

---

## 🔗 Key URLs

- **Admin Dashboard**: `/admin`
- **Admin Review**: `/admin/auctions/{id}/review`
- **Live Auction**: `/auctions/{id}/live`
- **Auction Listings**: `/auctions`

---

## ⚡ Quick API Tests

### Check EMD Status
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/auctions/{id}/emd
```

### Get All Bids (Admin)
```bash
curl -H "Authorization: Bearer <admin_token>" \
  http://localhost:3000/api/admin/auctions/{id}/bids
```

### Place Bid
```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"bidAmount": 50000}' \
  http://localhost:3000/api/auctions/{id}/bids
```

---

## ✅ Success Indicators

1. **Sealed Bidding**: ✅ Bids hidden, users see only own bids
2. **EMD**: ✅ Payment works, bidding enabled after payment
3. **Auto-Extend**: ✅ Timer extends, notification appears
4. **Admin Review**: ✅ All bids visible, winner can be confirmed

---

## 📞 Need Help?

1. Check `TEST_CASES.md` for detailed test cases
2. Check browser console for errors
3. Check server logs
4. Verify database state with SQL queries

---

**Ready to test?** Start with Test 1 (Sealed Bidding) - it's the quickest! 🚀



