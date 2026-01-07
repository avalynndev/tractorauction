# Blockchain Implementation Guide for Tractor Auction Platform

## Table of Contents
1. [Overview](#overview)
2. [Use Cases](#use-cases)
3. [Architecture Decision](#architecture-decision)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Code Implementation](#code-implementation)
6. [Testing](#testing)
7. [Deployment](#deployment)

---

## Overview

This guide will help you implement blockchain features for your tractor auction platform to ensure:
- **Immutable Records**: Vehicle and auction data cannot be tampered with
- **Transparency**: All transactions are verifiable
- **Trust**: Buyers and sellers can verify authenticity
- **Audit Trail**: Complete history of all changes

---

## Use Cases

### 1. **Vehicle Authenticity Verification**
- Store vehicle details (VIN, registration, engine number) on blockchain
- Prevent tampering with vehicle information
- Verify vehicle history and ownership

### 2. **Auction Transparency**
- Record auction results immutably
- Track all bids and winners
- Prevent auction manipulation

### 3. **Transaction History**
- Immutable record of all purchases
- Ownership transfer tracking
- Payment verification

### 4. **Document Verification**
- Store document hashes (RC, insurance, etc.)
- Verify document authenticity
- Prevent document forgery

---

## Architecture Decision

### Option 1: **Hybrid Approach (Recommended for MVP)**
- **Hash Generation**: Use SHA-256 to create cryptographic hashes
- **Storage**: Store hashes in database (already in schema)
- **Verification**: Verify hashes match original data
- **Future**: Can migrate to full blockchain later

**Pros:**
- Fast implementation
- Low cost
- No gas fees
- Easy to test

**Cons:**
- Not fully decentralized
- Requires trust in database

### Option 2: **Full Blockchain (Ethereum/Polygon)**
- **Smart Contracts**: Deploy contracts for vehicle/auction records
- **Transactions**: Store data on-chain
- **Verification**: Query blockchain directly

**Pros:**
- Fully decentralized
- Maximum trust
- Public verification

**Cons:**
- Higher cost (gas fees)
- Slower transactions
- More complex setup

### Option 3: **IPFS + Blockchain**
- **IPFS**: Store large data (images, documents) on IPFS
- **Blockchain**: Store IPFS hashes on blockchain
- **Verification**: Verify both IPFS and blockchain

**Pros:**
- Decentralized storage
- Lower blockchain costs
- Scalable

**Cons:**
- More complex architecture
- IPFS pinning costs

---

## Step-by-Step Implementation

### Phase 1: Setup (Day 1)

#### Step 1.1: Install Required Packages

```bash
npm install crypto ethers ipfs-http-client
npm install --save-dev @types/crypto
```

#### Step 1.2: Create Blockchain Utility Library

Create `lib/blockchain.ts` for hash generation and verification.

#### Step 1.3: Create Blockchain Service

Create `lib/blockchain-service.ts` for blockchain operations.

---

### Phase 2: Hash Generation (Day 2)

#### Step 2.1: Generate Vehicle Hash
- Create hash from vehicle data (registration, engine, chassis numbers)
- Store hash in database
- Display hash to users

#### Step 2.2: Generate Auction Hash
- Create hash from auction data (vehicle, bids, winner)
- Store hash when auction ends
- Verify auction integrity

---

### Phase 3: Blockchain Integration (Day 3-4)

#### Step 3.1: Setup Ethereum/Polygon (Optional)
- Create wallet
- Get API keys (Infura/Alchemy)
- Deploy smart contract (if using full blockchain)

#### Step 3.2: Store Hashes on Blockchain
- Create transaction to store hash
- Get transaction hash
- Store transaction hash in database

---

### Phase 4: Verification System (Day 5)

#### Step 4.1: Create Verification API
- Endpoint to verify vehicle hash
- Endpoint to verify auction hash
- Return verification status

#### Step 4.2: Create Verification UI
- Show blockchain status on vehicle pages
- Show verification badge
- Allow users to verify manually

---

### Phase 5: Testing & Documentation (Day 6)

#### Step 5.1: Test Hash Generation
- Test with sample vehicles
- Verify hash consistency
- Test edge cases

#### Step 5.2: Test Verification
- Test verification API
- Test UI components
- Document process

---

## Code Implementation

### Step 1: Create Blockchain Utility Library

**File: `lib/blockchain.ts`**

```typescript
import crypto from 'crypto';

/**
 * Generate SHA-256 hash from data
 */
export function generateHash(data: string | object): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Generate vehicle blockchain hash
 * Includes all critical vehicle identification data
 */
export function generateVehicleHash(vehicleData: {
  registrationNumber?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  vehicleType: string;
  tractorBrand: string;
  yearOfMfg: number;
  sellerId: string;
  createdAt: Date;
}): string {
  // Create a normalized object with only critical fields
  const normalizedData = {
    registrationNumber: vehicleData.registrationNumber || '',
    engineNumber: vehicleData.engineNumber || '',
    chassisNumber: vehicleData.chassisNumber || '',
    vehicleType: vehicleData.vehicleType,
    tractorBrand: vehicleData.tractorBrand,
    yearOfMfg: vehicleData.yearOfMfg,
    sellerId: vehicleData.sellerId,
    timestamp: vehicleData.createdAt.toISOString(),
  };

  // Sort keys to ensure consistent hashing
  const sortedData = Object.keys(normalizedData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalizedData[key as keyof typeof normalizedData];
      return acc;
    }, {} as Record<string, any>);

  return generateHash(sortedData);
}

/**
 * Generate auction blockchain hash
 * Includes auction result and winner information
 */
export function generateAuctionHash(auctionData: {
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  currentBid: number;
  winnerId?: string | null;
  totalBids: number;
  endedAt: Date;
}): string {
  const normalizedData = {
    vehicleId: auctionData.vehicleId,
    startTime: auctionData.startTime.toISOString(),
    endTime: auctionData.endTime.toISOString(),
    currentBid: auctionData.currentBid,
    winnerId: auctionData.winnerId || '',
    totalBids: auctionData.totalBids,
    endedAt: auctionData.endedAt.toISOString(),
  };

  const sortedData = Object.keys(normalizedData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalizedData[key as keyof typeof normalizedData];
      return acc;
    }, {} as Record<string, any>);

  return generateHash(sortedData);
}

/**
 * Verify hash matches data
 */
export function verifyHash(data: string | object, hash: string): boolean {
  const calculatedHash = generateHash(data);
  return calculatedHash === hash;
}

/**
 * Format hash for display (first 8 + last 8 characters)
 */
export function formatHashForDisplay(hash: string): string {
  if (hash.length < 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}
```

---

### Step 2: Create Blockchain Service

**File: `lib/blockchain-service.ts`**

```typescript
import { prisma } from './prisma';
import { generateVehicleHash, generateAuctionHash } from './blockchain';

/**
 * Generate and store blockchain hash for a vehicle
 */
export async function createVehicleBlockchainRecord(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      registrationNumber: true,
      engineNumber: true,
      chassisNumber: true,
      vehicleType: true,
      tractorBrand: true,
      yearOfMfg: true,
      sellerId: true,
      createdAt: true,
    },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Generate hash
  const blockchainHash = generateVehicleHash({
    registrationNumber: vehicle.registrationNumber,
    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    vehicleType: vehicle.vehicleType,
    tractorBrand: vehicle.tractorBrand,
    yearOfMfg: vehicle.yearOfMfg,
    sellerId: vehicle.sellerId,
    createdAt: vehicle.createdAt,
  });

  // Store hash in database
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      blockchainHash,
      blockchainVerified: false, // Will be set to true after blockchain storage
    },
  });

  return {
    vehicleId: updatedVehicle.id,
    blockchainHash: updatedVehicle.blockchainHash,
  };
}

/**
 * Generate and store blockchain hash for an auction
 */
export async function createAuctionBlockchainRecord(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      vehicle: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  // Get total bids count
  const totalBids = await prisma.bid.count({
    where: { auctionId },
  });

  // Generate hash
  const blockchainHash = generateAuctionHash({
    vehicleId: auction.vehicleId,
    startTime: auction.startTime,
    endTime: auction.endTime,
    currentBid: auction.currentBid,
    winnerId: auction.winnerId,
    totalBids,
    endedAt: auction.updatedAt,
  });

  // Store hash in database
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      blockchainHash,
      blockchainVerified: false,
    },
  });

  return {
    auctionId: updatedAuction.id,
    blockchainHash: updatedAuction.blockchainHash,
  };
}

/**
 * Verify vehicle blockchain record
 */
export async function verifyVehicleBlockchainRecord(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      blockchainHash: true,
      registrationNumber: true,
      engineNumber: true,
      chassisNumber: true,
      vehicleType: true,
      tractorBrand: true,
      yearOfMfg: true,
      sellerId: true,
      createdAt: true,
    },
  });

  if (!vehicle || !vehicle.blockchainHash) {
    return {
      verified: false,
      reason: 'No blockchain record found',
    };
  }

  // Regenerate hash and compare
  const calculatedHash = generateVehicleHash({
    registrationNumber: vehicle.registrationNumber,
    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    vehicleType: vehicle.vehicleType,
    tractorBrand: vehicle.tractorBrand,
    yearOfMfg: vehicle.yearOfMfg,
    sellerId: vehicle.sellerId,
    createdAt: vehicle.createdAt,
  });

  const isVerified = calculatedHash === vehicle.blockchainHash;

  if (isVerified && !vehicle.blockchainVerified) {
    // Update verification status
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        blockchainVerified: true,
        blockchainVerifiedAt: new Date(),
      },
    });
  }

  return {
    verified: isVerified,
    storedHash: vehicle.blockchainHash,
    calculatedHash,
    match: isVerified,
  };
}

/**
 * Verify auction blockchain record
 */
export async function verifyAuctionBlockchainRecord(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      vehicle: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!auction || !auction.blockchainHash) {
    return {
      verified: false,
      reason: 'No blockchain record found',
    };
  }

  const totalBids = await prisma.bid.count({
    where: { auctionId },
  });

  const calculatedHash = generateAuctionHash({
    vehicleId: auction.vehicleId,
    startTime: auction.startTime,
    endTime: auction.endTime,
    currentBid: auction.currentBid,
    winnerId: auction.winnerId,
    totalBids,
    endedAt: auction.updatedAt,
  });

  const isVerified = calculatedHash === auction.blockchainHash;

  if (isVerified && !auction.blockchainVerified) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        blockchainVerified: true,
        blockchainVerifiedAt: new Date(),
      },
    });
  }

  return {
    verified: isVerified,
    storedHash: auction.blockchainHash,
    calculatedHash,
    match: isVerified,
  };
}
```

---

### Step 3: Update Vehicle Upload API

**File: `app/api/vehicles/upload/route.ts`**

Add blockchain hash generation after vehicle creation:

```typescript
// After vehicle is created successfully
import { createVehicleBlockchainRecord } from '@/lib/blockchain-service';

// ... existing code ...

// After vehicle creation, generate blockchain hash
try {
  await createVehicleBlockchainRecord(vehicle.id);
  console.log('Blockchain hash generated for vehicle:', vehicle.id);
} catch (error) {
  console.error('Failed to generate blockchain hash:', error);
  // Don't fail the request, just log the error
}
```

---

### Step 4: Update Auction End Logic

**File: `app/api/auctions/[id]/end/route.ts`** (or wherever auction ends)

Add blockchain hash generation when auction ends:

```typescript
import { createAuctionBlockchainRecord } from '@/lib/blockchain-service';

// After auction ends successfully
try {
  await createAuctionBlockchainRecord(auction.id);
  console.log('Blockchain hash generated for auction:', auction.id);
} catch (error) {
  console.error('Failed to generate blockchain hash:', error);
}
```

---

### Step 5: Create Verification API

**File: `app/api/blockchain/verify/vehicle/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyVehicleBlockchainRecord } from '@/lib/blockchain-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
    const verification = await verifyVehicleBlockchainRecord(vehicleId);

    return NextResponse.json({
      success: true,
      ...verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Verification failed',
      },
      { status: 500 }
    );
  }
}
```

**File: `app/api/blockchain/verify/auction/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuctionBlockchainRecord } from '@/lib/blockchain-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = params.id;
    const verification = await verifyAuctionBlockchainRecord(auctionId);

    return NextResponse.json({
      success: true,
      ...verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Verification failed',
      },
      { status: 500 }
    );
  }
}
```

---

### Step 6: Create UI Components

**File: `components/blockchain/BlockchainBadge.tsx`**

```typescript
"use client";

import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { formatHashForDisplay } from '@/lib/blockchain';

interface BlockchainBadgeProps {
  hash?: string | null;
  verified?: boolean;
  type: 'vehicle' | 'auction';
  id: string;
}

export default function BlockchainBadge({
  hash,
  verified,
  type,
  id,
}: BlockchainBadgeProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    message?: string;
  } | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/blockchain/verify/${type}/${id}`);
      const data = await response.json();

      if (data.success) {
        setVerificationStatus({
          verified: data.verified,
          message: data.verified
            ? 'Blockchain record verified successfully'
            : 'Blockchain record verification failed',
        });
      }
    } catch (error) {
      setVerificationStatus({
        verified: false,
        message: 'Verification error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!hash) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <ShieldAlert className="w-4 h-4" />
        <span>No blockchain record</span>
      </div>
    );
  }

  const isVerified = verified || verificationStatus?.verified;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isVerified ? (
          <ShieldCheck className="w-5 h-5 text-green-500" />
        ) : (
          <Shield className="w-5 h-5 text-yellow-500" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isVerified ? 'Blockchain Verified' : 'Blockchain Recorded'}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {formatHashForDisplay(hash)}
          </span>
        </div>
      </div>
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Now'
        )}
      </button>
      {verificationStatus && (
        <p
          className={`text-xs ${
            verificationStatus.verified ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {verificationStatus.message}
        </p>
      )}
    </div>
  );
}
```

---

### Step 7: Add to Vehicle Detail Page

**File: `app/vehicles/[id]/page.tsx`** (or wherever vehicle details are shown)

```typescript
import BlockchainBadge from '@/components/blockchain/BlockchainBadge';

// In your component:
<BlockchainBadge
  hash={vehicle.blockchainHash}
  verified={vehicle.blockchainVerified}
  type="vehicle"
  id={vehicle.id}
/>
```

---

## Testing

### Test Hash Generation

```typescript
// Test script: scripts/test-blockchain.ts
import { generateVehicleHash, verifyHash } from '../lib/blockchain';

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

const hash = generateVehicleHash(testVehicle);
console.log('Generated hash:', hash);

// Test verification
const isValid = verifyHash(testVehicle, hash);
console.log('Verification result:', isValid); // Should be true
```

Run test:
```bash
npx tsx scripts/test-blockchain.ts
```

---

## Deployment

### Environment Variables

Add to `.env`:

```env
# Blockchain Configuration (Optional - for future Ethereum/Polygon integration)
BLOCKCHAIN_NETWORK=mainnet
BLOCKCHAIN_RPC_URL=
BLOCKCHAIN_PRIVATE_KEY=
BLOCKCHAIN_CONTRACT_ADDRESS=
```

### Database Migration

The schema already has blockchain fields, so no migration needed. Just ensure:

```bash
npx prisma generate
npx prisma db push
```

---

## Next Steps (Advanced)

### 1. Integrate with Ethereum/Polygon

1. Install ethers.js: `npm install ethers`
2. Create smart contract for storing hashes
3. Deploy contract to testnet/mainnet
4. Update `blockchain-service.ts` to store on-chain

### 2. Add IPFS for Document Storage

1. Install IPFS: `npm install ipfs-http-client`
2. Upload documents to IPFS
3. Store IPFS hash on blockchain
4. Retrieve documents from IPFS

### 3. Create Blockchain Explorer Page

1. Create `/blockchain-explorer` page
2. Show all blockchain records
3. Allow searching by hash
4. Display verification status

---

## Summary

You now have:
✅ Hash generation for vehicles and auctions
✅ Database storage of hashes
✅ Verification API endpoints
✅ UI components for displaying blockchain status
✅ Testing utilities

**Next**: Implement the code following the steps above, then test and deploy!

