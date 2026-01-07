# Blockchain Quick Start Guide

## Overview
This guide will help you quickly implement and test blockchain features in your tractor auction platform.

## What's Already Implemented

✅ **Database Schema**: Blockchain fields already exist in `Vehicle` and `Auction` models
✅ **Hash Generation**: Utility functions for creating cryptographic hashes
✅ **Verification APIs**: Endpoints to verify blockchain records
✅ **UI Components**: Badge components to display blockchain status

## Quick Implementation Steps

### Step 1: Test Hash Generation (5 minutes)

Create a test script to verify blockchain hash generation works:

**File: `scripts/test-blockchain.ts`**

```typescript
import { generateVehicleHash, generateAuctionHash } from '../lib/blockchain';

// Test vehicle hash
const testVehicle = {
  registrationNumber: 'MH12AB1234',
  engineNumber: 'ENG123456',
  chassisNumber: 'CHS789012',
  vehicleType: 'USED_TRACTOR',
  tractorBrand: 'Mahindra',
  yearOfMfg: 2020,
  sellerId: 'test-seller-id',
  createdAt: new Date(),
};

const vehicleHash = generateVehicleHash(testVehicle);
console.log('✅ Vehicle Hash:', vehicleHash);

// Test auction hash
const testAuction = {
  vehicleId: 'test-vehicle-id',
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-02'),
  currentBid: 500000,
  winnerId: 'test-winner-id',
  totalBids: 10,
  endedAt: new Date('2024-01-02'),
};

const auctionHash = generateAuctionHash(testAuction);
console.log('✅ Auction Hash:', auctionHash);

console.log('\n✅ Blockchain hash generation is working!');
```

Run the test:
```bash
npx tsx scripts/test-blockchain.ts
```

---

### Step 2: Verify Vehicle Upload Integration (Already Done!)

The vehicle upload API (`app/api/vehicles/upload/route.ts`) now automatically generates blockchain hashes when a vehicle is uploaded.

**Test it:**
1. Upload a new vehicle through the UI
2. Check the database - the `blockchainHash` field should be populated
3. The hash is generated automatically, no manual action needed

---

### Step 3: Add Blockchain Badge to Vehicle Pages

Add the blockchain badge to your vehicle detail pages:

**Example: `app/auctions/[id]/page.tsx` or vehicle detail page**

```typescript
import BlockchainBadge from '@/components/blockchain/BlockchainBadge';

// In your component JSX:
<BlockchainBadge
  hash={vehicle.blockchainHash}
  verified={vehicle.blockchainVerified}
  type="vehicle"
  id={vehicle.id}
/>
```

---

### Step 4: Test Verification API

Test the verification endpoint:

```bash
# Replace VEHICLE_ID with an actual vehicle ID
curl http://localhost:3000/api/blockchain/verify/vehicle/VEHICLE_ID
```

Expected response:
```json
{
  "success": true,
  "verified": true,
  "storedHash": "abc123...",
  "calculatedHash": "abc123...",
  "match": true
}
```

---

### Step 5: Add to Auction End Logic

When an auction ends, generate a blockchain hash. Find where auctions are ended and add:

```typescript
import { createAuctionBlockchainRecord } from '@/lib/blockchain-service';

// After auction ends
try {
  await createAuctionBlockchainRecord(auction.id);
  console.log('Blockchain hash generated for auction:', auction.id);
} catch (error) {
  console.error('Failed to generate blockchain hash:', error);
}
```

---

## How It Works

### 1. **Hash Generation**
- When a vehicle is uploaded, a SHA-256 hash is generated from critical vehicle data
- The hash is stored in the database
- This hash acts as a "fingerprint" of the vehicle data

### 2. **Verification**
- Users can verify the blockchain record by clicking "Verify Now"
- The system regenerates the hash from current data
- If hashes match, the data hasn't been tampered with

### 3. **Display**
- The `BlockchainBadge` component shows:
  - ✅ Green shield: Verified
  - ⚠️ Yellow shield: Recorded but not verified
  - ❌ Gray: No blockchain record

---

## Testing Checklist

- [ ] Upload a new vehicle - verify hash is generated
- [ ] Check vehicle detail page - verify badge appears
- [ ] Click "Verify Now" - verify status updates
- [ ] End an auction - verify auction hash is generated
- [ ] Test verification API endpoints

---

## Next Steps (Advanced)

### Option 1: Store on Ethereum/Polygon Blockchain

1. Install ethers.js:
```bash
npm install ethers
```

2. Create smart contract for storing hashes
3. Deploy to testnet (Polygon Mumbai)
4. Update `blockchain-service.ts` to store on-chain

### Option 2: Use IPFS for Document Storage

1. Install IPFS:
```bash
npm install ipfs-http-client
```

2. Upload vehicle documents to IPFS
3. Store IPFS hash on blockchain
4. Retrieve documents from IPFS

---

## Troubleshooting

### Hash not generated on vehicle upload
- Check server logs for errors
- Verify `createVehicleBlockchainRecord` is being called
- Ensure vehicle data is complete

### Verification fails
- Check if hash exists in database
- Verify vehicle data hasn't changed
- Check server logs for errors

### Badge not showing
- Verify `blockchainHash` field exists in database
- Check component import path
- Verify vehicle data is passed correctly

---

## Support

For detailed implementation guide, see: `docs/BLOCKCHAIN_IMPLEMENTATION_GUIDE.md`

