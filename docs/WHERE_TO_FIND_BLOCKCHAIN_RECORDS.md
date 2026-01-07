# Where to Find Blockchain Records

## Overview
Blockchain records are stored in your database and can be accessed in several ways:

---

## 1. **In the Database (PostgreSQL)**

### Vehicle Blockchain Records
- **Table**: `Vehicle`
- **Fields**:
  - `blockchainHash` - SHA-256 hash of vehicle data
  - `blockchainTxHash` - Transaction hash (if stored on blockchain)
  - `blockchainVerified` - Verification status (true/false)
  - `blockchainVerifiedAt` - Timestamp of verification

### Auction Blockchain Records
- **Table**: `Auction`
- **Fields**:
  - `blockchainHash` - SHA-256 hash of auction data
  - `blockchainTxHash` - Transaction hash (if stored on blockchain)
  - `blockchainVerified` - Verification status (true/false)
  - `blockchainVerifiedAt` - Timestamp of verification

### How to View in Database:
```sql
-- View all vehicles with blockchain records
SELECT id, referenceNumber, blockchainHash, blockchainVerified, blockchainVerifiedAt
FROM "Vehicle"
WHERE blockchainHash IS NOT NULL;

-- View all auctions with blockchain records
SELECT id, referenceNumber, blockchainHash, blockchainVerified, blockchainVerifiedAt
FROM "Auction"
WHERE blockchainHash IS NOT NULL;
```

**Using Prisma Studio:**
```bash
npx prisma studio
```
Then navigate to `Vehicle` or `Auction` tables and look for the blockchain fields.

---

## 2. **On Vehicle Detail Pages**

### URL: `/vehicles/[id]`

The vehicle detail page displays blockchain verification badges:
- **Component**: `VerificationBadge` and `VerificationDetails`
- **Location**: Shows blockchain status and hash on the vehicle detail page

**To view:**
1. Go to any vehicle detail page: `http://localhost:3000/vehicles/[vehicle-id]`
2. Look for the blockchain verification badge
3. Click to verify the blockchain record

---

## 3. **Via API Endpoints**

### Verify Vehicle Blockchain Record
```
GET /api/blockchain/verify/vehicle/[id]
```

**Example:**
```bash
curl http://localhost:3000/api/blockchain/verify/vehicle/[vehicle-id]
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "storedHash": "abc123...",
  "calculatedHash": "abc123...",
  "match": true
}
```

### Verify Auction Blockchain Record
```
GET /api/blockchain/verify/auction/[id]
```

**Example:**
```bash
curl http://localhost:3000/api/blockchain/verify/auction/[auction-id]
```

---

## 4. **In Admin Panel** (Future Enhancement)

You can view blockchain records in the admin panel when viewing vehicle details.

**URL**: `http://localhost:3000/admin`

---

## 5. **Blockchain Explorer Page** (New Feature)

A dedicated blockchain explorer page is available at:

**URL**: `http://localhost:3000/blockchain-explorer`

This page allows you to:
- View all blockchain records
- Search by hash
- Filter by type (Vehicle/Auction)
- View verification status
- See detailed blockchain information

---

## 6. **Programmatically (Code)**

### Get Vehicle Blockchain Hash
```typescript
import { prisma } from '@/lib/prisma';

const vehicle = await prisma.vehicle.findUnique({
  where: { id: vehicleId },
  select: {
    id: true,
    blockchainHash: true,
    blockchainVerified: true,
    blockchainVerifiedAt: true,
  },
});

console.log('Blockchain Hash:', vehicle?.blockchainHash);
```

### Get Auction Blockchain Hash
```typescript
const auction = await prisma.auction.findUnique({
  where: { id: auctionId },
  select: {
    id: true,
    blockchainHash: true,
    blockchainVerified: true,
    blockchainVerifiedAt: true,
  },
});

console.log('Blockchain Hash:', auction?.blockchainHash);
```

---

## Quick Access Methods

### Method 1: Database Query
```sql
-- Quick view of all blockchain records
SELECT 
  'Vehicle' as type,
  id,
  referenceNumber,
  blockchainHash,
  blockchainVerified
FROM "Vehicle"
WHERE blockchainHash IS NOT NULL
UNION ALL
SELECT 
  'Auction' as type,
  id,
  referenceNumber,
  blockchainHash,
  blockchainVerified
FROM "Auction"
WHERE blockchainHash IS NOT NULL;
```

### Method 2: API Call
```javascript
// In browser console or API client
fetch('/api/blockchain/verify/vehicle/[vehicle-id]')
  .then(res => res.json())
  .then(data => console.log(data));
```

### Method 3: Component Usage
```tsx
import BlockchainBadge from '@/components/blockchain/BlockchainBadge';

<BlockchainBadge
  hash={vehicle.blockchainHash}
  verified={vehicle.blockchainVerified}
  type="vehicle"
  id={vehicle.id}
/>
```

---

## Summary

| Location | Method | Access |
|----------|--------|--------|
| **Database** | PostgreSQL/Prisma Studio | Direct database access |
| **Vehicle Page** | UI Component | `/vehicles/[id]` |
| **API** | REST Endpoint | `/api/blockchain/verify/[type]/[id]` |
| **Explorer** | Dedicated Page | `/blockchain-explorer` |
| **Code** | Programmatic | Use Prisma queries |

---

## Next Steps

1. **View in Database**: Use Prisma Studio or pgAdmin
2. **View on Website**: Visit vehicle detail pages
3. **Use API**: Call verification endpoints
4. **Use Explorer**: Visit `/blockchain-explorer` page

For more details, see: `docs/BLOCKCHAIN_IMPLEMENTATION_GUIDE.md`

