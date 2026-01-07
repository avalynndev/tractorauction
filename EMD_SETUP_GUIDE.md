# EMD Setup Guide - How to Create Auctions with EMD Requirement

## Overview

Earnest Money Deposit (EMD) is a refundable deposit that buyers must pay before placing bids in an auction. This guide shows you exactly where and how to set EMD requirements.

---

## 📍 Where to Set EMD

### Option 1: Individual Vehicle Approval (Recommended for Testing)

1. **Login as Admin**
   - Navigate to `/admin`
   - Click on "Approvals" button (if not already active)

2. **Find Pending Vehicle**
   - Look for a vehicle with `saleType: "AUCTION"`
   - Click "View Details" button

3. **In the Vehicle Details Modal**
   - Scroll down to "Auction Settings" section
   - You'll see:
     - Reserved Price
     - Start Date & Time
     - End Date & Time
     - Min. Bid Increment
     - **EMD Settings** (NEW!)

4. **Enable EMD**
   - ✅ Check the checkbox: "Require Earnest Money Deposit (EMD)"
   - Enter EMD Amount (e.g., 5000)
   - Click "Approve" button

5. **Result**
   - Auction is created with `emdRequired: true`
   - `emdAmount` is set to your specified amount

---

### Option 2: Bulk Approval (For Multiple Vehicles)

1. **Login as Admin**
   - Navigate to `/admin`
   - Click on "Approvals" button

2. **Select Vehicles**
   - Check the boxes next to multiple auction vehicles
   - Scroll to "Bulk Auction Settings" section

3. **Set Bulk EMD**
   - ✅ Check "EMD Required" checkbox
   - Enter "EMD Amount" (e.g., 5000)
   - This will apply to all selected vehicles

4. **Apply Settings**
   - Click "Bulk Approve" or "Create Auctions"
   - All selected vehicles will have EMD requirement

---

## 🎯 Visual Guide

### Individual Approval Modal

```
┌─────────────────────────────────────────┐
│  Vehicle Details                        │
├─────────────────────────────────────────┤
│  ... Vehicle Info ...                   │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Auction Settings                   │ │
│  ├───────────────────────────────────┤ │
│  │ Reserved Price (₹)                │ │
│  │ [___________]                      │ │
│  │                                     │ │
│  │ Start Date & Time                   │ │
│  │ [___________]                      │ │
│  │                                     │ │
│  │ End Date & Time                     │ │
│  │ [___________]                      │ │
│  │                                     │ │
│  │ Min. Bid Increment (₹)              │ │
│  │ [___________]                      │ │
│  │                                     │ │
│  │ ┌───────────────────────────────┐ │ │
│  │ │ EMD Settings                    │ │ │
│  │ ├───────────────────────────────┤ │ │
│  │ │ ☑ Require EMD                  │ │ │
│  │ │ EMD Amount (₹)                 │ │ │
│  │ │ [5000]                         │ │ │
│  │ └───────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Approve] [Reject]                     │
└─────────────────────────────────────────┘
```

### Bulk Settings Section

```
┌─────────────────────────────────────────┐
│  Bulk Auction Settings (Optional)        │
├─────────────────────────────────────────┤
│  Reserved Price (₹)  │  EMD Required    │
│  [___________]       │  ☑ Enable EMD    │
│                      │                   │
│  EMD Amount (₹)      │  Start Date       │
│  [5000]             │  [___________]   │
│                      │                   │
│  End Date           │  Min. Increment   │
│  [___________]       │  [___________]   │
└─────────────────────────────────────────┘
```

---

## ✅ Verification

### Check if EMD is Set

**Method 1: Database Query**
```sql
SELECT id, emdRequired, emdAmount 
FROM "Auction" 
WHERE vehicleId = '<vehicle_id>';
```

**Expected Result:**
```
id: "abc123"
emdRequired: true
emdAmount: 5000
```

**Method 2: View Auction Page**
1. Navigate to `/auctions/{id}/live`
2. Look for "EMD Required" notice
3. Should show: "A refundable EMD of ₹5,000 is required"

---

## 🔧 API Endpoints

### Create Auction with EMD

**Endpoint:** `POST /api/admin/vehicles/{id}/approve`

**Request Body:**
```json
{
  "basePrice": 100000,
  "auctionStartTime": "2024-01-15T10:00:00Z",
  "auctionEndTime": "2024-01-17T10:00:00Z",
  "minimumIncrement": 5000,
  "emdRequired": true,
  "emdAmount": 5000
}
```

**Response:**
```json
{
  "message": "Vehicle approved successfully",
  "auction": {
    "id": "abc123",
    "emdRequired": true,
    "emdAmount": 5000,
    ...
  }
}
```

---

## 📝 Step-by-Step Example

### Example: Create Auction with ₹5,000 EMD

1. **Login as Admin**
   ```
   URL: http://localhost:3000/admin
   ```

2. **Click "Approvals"** (if not active)

3. **Find Vehicle**
   - Look for: "Mahindra 50 HP" with status "PENDING"
   - Click "View Details"

4. **Set Auction Settings**
   - Reserved Price: `100000`
   - Start Date: `2024-01-15 10:00`
   - End Date: `2024-01-17 10:00`
   - Min. Increment: `5000`

5. **Enable EMD**
   - ✅ Check "Require Earnest Money Deposit (EMD)"
   - EMD Amount: `5000`

6. **Approve**
   - Click "Approve" button
   - Success message appears

7. **Verify**
   - Navigate to `/auctions`
   - Find the auction
   - Click to view details
   - Should see "EMD Required: ₹5,000"

---

## 🎯 Where EMD Appears

### 1. Admin Approval Modal
- ✅ Checkbox: "Require Earnest Money Deposit (EMD)"
- ✅ Input: "EMD Amount (₹)"
- Location: Individual vehicle approval modal, "Auction Settings" section

### 2. Bulk Settings
- ✅ Checkbox: "EMD Required"
- ✅ Input: "EMD Amount (₹)"
- Location: Bulk Auction Settings section (above vehicle grid)

### 3. Live Auction Page
- ✅ Notice: "EMD Required" (if not paid)
- ✅ Badge: "EMD Paid" (if paid)
- ✅ Button: "Pay EMD Now"
- Location: `/auctions/{id}/live`

### 4. Database
- ✅ `Auction.emdRequired` (Boolean)
- ✅ `Auction.emdAmount` (Float, nullable)

---

## ⚠️ Important Notes

1. **EMD is Optional**
   - Default: `emdRequired: false`
   - Only set if you want to require EMD

2. **EMD Amount**
   - Should be a reasonable amount (e.g., 1-5% of reserve price)
   - Common amounts: ₹2,000 - ₹10,000

3. **Bulk vs Individual**
   - Individual: Set per vehicle (more control)
   - Bulk: Apply to multiple vehicles (faster)

4. **Cannot Change After Approval**
   - EMD settings are set when auction is created
   - Cannot modify later (would need to cancel and recreate)

---

## 🐛 Troubleshooting

### Issue: EMD checkbox not showing
**Solution:** 
- Make sure vehicle `saleType` is "AUCTION"
- Check browser console for errors
- Refresh the page

### Issue: EMD not saving
**Solution:**
- Check that `emdAmount` is provided when `emdRequired` is true
- Verify API response for errors
- Check database directly

### Issue: EMD not appearing on auction page
**Solution:**
- Verify `emdRequired: true` in database
- Check that `emdAmount` is set
- Clear browser cache

---

## 📊 Quick Reference

| Field | Type | Required | Default | Example |
|-------|------|----------|---------|---------|
| `emdRequired` | Boolean | No | `false` | `true` |
| `emdAmount` | Number | Yes (if emdRequired) | `null` | `5000` |

---

## ✅ Checklist

Before testing EMD:
- [ ] Login as Admin
- [ ] Navigate to `/admin`
- [ ] Find pending auction vehicle
- [ ] Click "View Details"
- [ ] Scroll to "Auction Settings"
- [ ] Check "Require EMD" checkbox
- [ ] Enter EMD amount
- [ ] Click "Approve"
- [ ] Verify auction created with EMD
- [ ] Test bidding (should require EMD payment)

---

## 🚀 Next Steps

After setting EMD:
1. Test EMD payment flow
2. Test bidding with/without EMD
3. Test EMD refund for non-winners
4. Test EMD applied to balance payment

---

**Need Help?** Check `TEST_CASES.md` for detailed test scenarios!



