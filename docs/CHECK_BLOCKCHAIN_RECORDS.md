# How to Check if Blockchain Records are Created

This guide shows you multiple ways to verify if blockchain records have been created for vehicles, auctions, bids, and purchases.

## Table of Contents
1. [Using the Verification API](#using-verification-api)
2. [Checking in the Database](#checking-database)
3. [Using the UI Components](#using-ui)
4. [Browser Console Method](#browser-console)
5. [Admin Dashboard Check](#admin-dashboard)

---

## 1. Using the Verification API

### Check via API Endpoint

**GET** `/api/blockchain/verify?recordType=VEHICLE&recordId=vehicle-id`

#### Example: Check Vehicle Record

```bash
curl "http://localhost:3000/api/blockchain/verify?recordType=VEHICLE&recordId=YOUR_VEHICLE_ID"
```

**Response:**
```json
{
  "verified": true,
  "chainValid": true,
  "hash": "a1b2c3d4e5f6...",
  "txHash": null,
  "verifiedAt": "2024-01-01T00:00:00Z",
  "record": {
    "id": "record-id",
    "recordType": "VEHICLE",
    "recordId": "vehicle-id",
    "blockHash": "a1b2c3d4e5f6...",
    "verified": true
  }
}
```

#### JavaScript/TypeScript Example

```typescript
async function checkBlockchainRecord(recordType: string, recordId: string) {
  const response = await fetch(
    `/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}`
  );
  
  if (response.ok) {
    const data = await response.json();
    
    if (data.verified && data.chainValid) {
      console.log("✓ Blockchain record ex
      ists and is valid");
      console.log("Hash:", data.hash);
      return true;
    } else {
      console.log("✗ Blockchain record not verified");
      return false;
    }
  } else {
    console.log("✗ No blockchain record found");
    return false;
  }
}

// Usage
await checkBlockchainRecord("VEHICLE", "vehicle-id-123");
await checkBlockchainRecord("AUCTION", "auction-id-456");
await checkBlockchainRecord("BID", "bid-id-789");
await checkBlockchainRecord("PURCHASE", "purchase-id-012");
```

---

## 2. Checking in the Database

### Using Prisma Studio

1. Open Prisma Studio:
```bash
npx prisma studio
```

2. Navigate to `BlockchainRecord` table
3. Filter by:
   - `recordType` = "VEHICLE", "AUCTION", "BID", or "PURCHASE"
   - `recordId` = your record ID

### Using SQL Query

```sql
-- Check if blockchain record exists for a vehicle
SELECT * FROM "BlockchainRecord" 
WHERE "recordType" = 'VEHICLE' 
AND "recordId" = 'your-vehicle-id';

-- Check if blockchain record exists for an auction
SELECT * FROM "BlockchainRecord" 
WHERE "recordType" = 'AUCTION' 
AND "recordId" = 'your-auction-id';

-- Check all blockchain records
SELECT * FROM "BlockchainRecord" 
ORDER BY "createdAt" DESC;

-- Count records by type
SELECT "recordType", COUNT(*) as count 
FROM "BlockchainRecord" 
GROUP BY "recordType";
```

### Check Directly on Vehicle/Auction Table

```sql
-- Check vehicle blockchain status
SELECT id, "blockchainHash", "blockchainVerified", "blockchainVerifiedAt"
FROM "Vehicle"
WHERE id = 'your-vehicle-id';

-- Check auction blockchain status
SELECT id, "blockchainHash", "blockchainVerified", "blockchainVerifiedAt"
FROM "Auction"
WHERE id = 'your-auction-id';

-- Check bid blockchain status
SELECT id, "blockchainHash", "blockchainVerified", "blockchainVerifiedAt"
FROM "Bid"
WHERE id = 'your-bid-id';

-- Check purchase blockchain status
SELECT id, "blockchainHash", "blockchainVerified", "blockchainVerifiedAt"
FROM "Purchase"
WHERE id = 'your-purchase-id';
```

---

## 3. Using the UI Components

### On Vehicle Detail Page

1. Navigate to any vehicle detail page: `/vehicles/[id]`
2. Look for the **Verification Badge** near the vehicle title
3. If verified, you'll see:
   - ✓ Green shield icon
   - "Blockchain Verified" text
   - Hash preview (if `showDetails` is enabled)

4. Scroll down to see **Verification Details** section with:
   - Full blockchain hash
   - Transaction hash (if available)
   - Verification timestamp
   - Chain integrity status

### Verification Badge Component

The badge automatically checks and displays verification status:

```tsx
<VerificationBadge
  recordType="VEHICLE"
  recordId={vehicle.id}
  showDetails={true}
/>
```

**Visual Indicators:**
- ✅ **Green Shield** = Verified
- ⚠️ **Gray Shield** = Not Verified
- 🔄 **Spinner** = Checking...

---

## 4. Browser Console Method

### Open Browser DevTools

1. Open any page (e.g., vehicle detail page)
2. Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
3. Go to **Console** tab
4. Run these commands:

```javascript
// Check vehicle blockchain record
fetch('/api/blockchain/verify?recordType=VEHICLE&recordId=YOUR_VEHICLE_ID')
  .then(r => r.json())
  .then(data => {
    console.log('Blockchain Status:', data);
    console.log('Verified:', data.verified);
    console.log('Hash:', data.hash);
  });

// Check auction blockchain record
fetch('/api/blockchain/verify?recordType=AUCTION&recordId=YOUR_AUCTION_ID')
  .then(r => r.json())
  .then(data => console.log('Auction Blockchain:', data));

// Check all blockchain records (requires admin API)
fetch('/api/admin/blockchain/records') // If this endpoint exists
  .then(r => r.json())
  .then(data => console.log('All Records:', data));
```

---

## 5. Admin Dashboard Check

### Create Admin Endpoint (Optional)

You can create an admin endpoint to list all blockchain records:

```typescript
// app/api/admin/blockchain/records/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("recordType");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    if (recordType) {
      where.recordType = recordType;
    }

    const records = await prisma.blockchainRecord.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get counts by type
    const counts = await prisma.blockchainRecord.groupBy({
      by: ["recordType"],
      _count: true,
    });

    return NextResponse.json({
      records,
      counts: counts.map(c => ({
        type: c.recordType,
        count: c._count,
      })),
      total: records.length,
    });
  } catch (error) {
    console.error("Error fetching blockchain records:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Use the Admin Endpoint

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:3000/api/admin/blockchain/records?limit=50"
```

---

## Quick Check Script

### Node.js Script

Create a file `check-blockchain.js`:

```javascript
// check-blockchain.js
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN';

async function checkRecord(recordType, recordId) {
  try {
    const response = await fetch(
      `${BASE_URL}/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}`
    );
    
    const data = await response.json();
    
    if (data.verified) {
      console.log(`✅ ${recordType} ${recordId}: VERIFIED`);
      console.log(`   Hash: ${data.hash?.substring(0, 20)}...`);
      console.log(`   Verified At: ${data.verifiedAt}`);
    } else {
      console.log(`❌ ${recordType} ${recordId}: NOT VERIFIED`);
    }
  } catch (error) {
    console.log(`❌ ${recordType} ${recordId}: ERROR - ${error.message}`);
  }
}

// Usage
checkRecord('VEHICLE', 'vehicle-id-123');
checkRecord('AUCTION', 'auction-id-456');
```

Run it:
```bash
node check-blockchain.js
```

---

## Verification Checklist

Use this checklist to verify blockchain records:

- [ ] **Vehicle Record Created**
  - Check via API: `/api/blockchain/verify?recordType=VEHICLE&recordId=...`
  - Check in database: `Vehicle.blockchainHash` is not null
  - Check in UI: Verification badge shows "Verified"

- [ ] **Auction Record Created**
  - Check via API: `/api/blockchain/verify?recordType=AUCTION&recordId=...`
  - Check in database: `Auction.blockchainHash` is not null
  - Check chain integrity: `chainValid` is true

- [ ] **Bid Record Created**
  - Check via API: `/api/blockchain/verify?recordType=BID&recordId=...`
  - Check in database: `Bid.blockchainHash` is not null

- [ ] **Purchase Record Created**
  - Check via API: `/api/blockchain/verify?recordType=PURCHASE&recordId=...`
  - Check in database: `Purchase.blockchainHash` is not null

---

## Common Issues

### Record Not Found

**Problem:** API returns `verified: false` or 404

**Solutions:**
1. Check if record exists in database
2. Verify recordType and recordId are correct
3. Create blockchain record manually via API

### Chain Invalid

**Problem:** `chainValid: false`

**Solutions:**
1. Check if previous records exist
2. Verify no data was modified after blockchain creation
3. Recreate blockchain records in order

### Hash Mismatch

**Problem:** Hash doesn't match expected value

**Solutions:**
1. Verify data hasn't been modified
2. Check if blockchain record was created with correct data
3. Recreate the blockchain record

---

## Summary

**Easiest Method:** Use the verification API endpoint
```bash
GET /api/blockchain/verify?recordType=VEHICLE&recordId=vehicle-id
```

**Most Detailed:** Check in database using Prisma Studio or SQL

**User-Friendly:** Check in UI - verification badge and details section

**For Developers:** Use browser console or create admin scripts

