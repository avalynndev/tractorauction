# Blockchain Verification Implementation

This document describes the blockchain verification system implemented in the Tractor Auction platform.

## Overview

The blockchain verification system provides cryptographic proof of authenticity for:
- **Vehicles**: Ownership and listing records
- **Auctions**: Auction results and winner verification
- **Bids**: Bid history and authenticity
- **Purchases**: Transaction records and ownership transfers

## Architecture

### Cryptographic Hashing
- Uses SHA-256 for generating cryptographic hashes
- Creates a chain of records linked by previous hash
- Ensures immutability and tamper detection

### Database Schema

#### Vehicle Model
```prisma
blockchainHash      String?  @unique
blockchainTxHash    String?
blockchainVerified   Boolean  @default(false)
blockchainVerifiedAt DateTime?
```

#### Auction Model
```prisma
blockchainHash       String?  @unique
blockchainTxHash     String?
blockchainVerified   Boolean  @default(false)
blockchainVerifiedAt DateTime?
```

#### Bid Model
```prisma
blockchainHash    String?  @unique
blockchainTxHash  String?
blockchainVerified Boolean @default(false)
blockchainVerifiedAt DateTime?
```

#### Purchase Model
```prisma
blockchainHash          String?  @unique
blockchainTxHash        String?
blockchainVerified      Boolean  @default(false)
blockchainVerifiedAt    DateTime?
```

#### BlockchainRecord Model
```prisma
model BlockchainRecord {
  id                String   @id
  recordType        String   // "VEHICLE" | "AUCTION" | "BID" | "PURCHASE"
  recordId          String
  previousHash      String?
  dataHash          String
  blockHash         String
  blockchainTxHash  String?
  verified          Boolean  @default(false)
  verifiedAt        DateTime?
  metadata          String?
  createdAt         DateTime
}
```

## API Endpoints

### Create Blockchain Record
**POST** `/api/blockchain/create`
- **Auth**: Required (Admin only)
- **Body**:
  ```json
  {
    "recordType": "VEHICLE" | "AUCTION" | "BID" | "PURCHASE",
    "recordId": "record-id"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Blockchain record created successfully",
    "hash": "blockchain-hash",
    "recordType": "VEHICLE",
    "recordId": "record-id"
  }
  ```

### Verify Blockchain Record
**GET** `/api/blockchain/verify?recordType=VEHICLE&recordId=vehicle-id`
- **Auth**: Not required (public)
- **Response**:
  ```json
  {
    "verified": true,
    "chainValid": true,
    "hash": "blockchain-hash",
    "txHash": "transaction-hash",
    "verifiedAt": "2024-01-01T00:00:00Z",
    "record": { ... }
  }
  ```

## Usage

### Creating Blockchain Records

#### For Vehicles
```typescript
import { createVehicleBlockchainRecord } from '@/lib/blockchain';

const hash = await createVehicleBlockchainRecord(vehicleId);
```

#### For Auctions
```typescript
import { createAuctionBlockchainRecord } from '@/lib/blockchain';

const hash = await createAuctionBlockchainRecord(auctionId);
```

#### For Bids
```typescript
import { createBidBlockchainRecord } from '@/lib/blockchain';

const hash = await createBidBlockchainRecord(bidId);
```

#### For Purchases
```typescript
import { createPurchaseBlockchainRecord } from '@/lib/blockchain';

const hash = await createPurchaseBlockchainRecord(purchaseId);
```

### Verifying Records

```typescript
import { verifyBlockchainRecord } from '@/lib/blockchain';

const result = await verifyBlockchainRecord('VEHICLE', vehicleId);
// Returns: { verified: boolean, record: any, chainValid: boolean }
```

### UI Components

#### Verification Badge
```tsx
import VerificationBadge from '@/components/blockchain/VerificationBadge';

<VerificationBadge
  recordType="VEHICLE"
  recordId={vehicle.id}
  showDetails={true}
/>
```

#### Verification Details
```tsx
import VerificationDetails from '@/components/blockchain/VerificationDetails';

<VerificationDetails
  recordType="VEHICLE"
  recordId={vehicle.id}
/>
```

## How It Works

### 1. Record Creation
When a blockchain record is created:
1. Extract relevant data from the record (vehicle, auction, bid, or purchase)
2. Generate a SHA-256 hash of the data
3. Get the previous blockchain record's hash (for chain linking)
4. Combine previous hash + data hash to create block hash
5. Store in `BlockchainRecord` table
6. Update the original record with blockchain hash

### 2. Chain Linking
Each record links to the previous record:
- First record: `previousHash = null`
- Subsequent records: `previousHash = previous record's blockHash`
- Creates an immutable chain

### 3. Verification
When verifying:
1. Look up the blockchain record
2. Verify chain integrity by checking:
   - Previous hash exists and is valid
   - Block hash matches expected calculation
   - Chain is unbroken
3. Return verification status

### 4. External Blockchain Integration
- `blockchainTxHash` field stores transaction hash if record is stored on external blockchain (Ethereum, Polygon, etc.)
- Can be integrated with blockchain services for additional verification
- Links to blockchain explorers (e.g., PolygonScan)

## Integration Points

### Automatic Verification
- **Vehicle Approval**: When admin approves a vehicle, create blockchain record
- **Auction Completion**: When auction ends, create blockchain record
- **Winning Bid**: When bid is marked as winning, create blockchain record
- **Purchase Completion**: When purchase is completed, create blockchain record

### Manual Verification
- Admins can manually create blockchain records via API
- Useful for retroactively verifying existing records

## Security Features

1. **Immutable Records**: Once created, records cannot be modified
2. **Chain Integrity**: Each record verifies the previous record
3. **Tamper Detection**: Any modification breaks the chain
4. **Cryptographic Proof**: SHA-256 hashing provides strong security

## Future Enhancements

1. **External Blockchain**: Integrate with Ethereum/Polygon for public verification
2. **Smart Contracts**: Deploy smart contracts for automatic verification
3. **IPFS Storage**: Store full record data on IPFS for decentralization
4. **Multi-chain Support**: Support multiple blockchain networks
5. **Verification Dashboard**: Admin dashboard for managing verifications
6. **Batch Verification**: Verify multiple records at once
7. **Verification Reports**: Generate reports of verified records

## Setup Instructions

1. **Install Dependencies**:
```bash
npm install crypto-js --legacy-peer-deps
```

2. **Update Database Schema**:
```bash
npx prisma generate
npx prisma db push
```

3. **Create Blockchain Records**:
- Use admin API to create records for existing data
- Or integrate automatic creation in relevant workflows

4. **Display Verification**:
- Add `VerificationBadge` component to vehicle/auction pages
- Add `VerificationDetails` component for detailed view

## Example Workflow

1. **Seller lists vehicle** → Vehicle created
2. **Admin approves vehicle** → Blockchain record created automatically
3. **Auction starts** → Auction blockchain record created
4. **Bids placed** → Bid blockchain records created
5. **Auction ends** → Final auction record updated
6. **Purchase completed** → Purchase blockchain record created
7. **Users can verify** → Check verification status on any record

## Troubleshooting

### Record Not Verified
- Check if blockchain record exists in `BlockchainRecord` table
- Verify hash calculation is correct
- Check chain integrity

### Chain Invalid
- Previous record may be missing
- Hash calculation may be incorrect
- Data may have been modified

### API Errors
- Ensure admin token is valid
- Check record exists before creating record
- Verify recordType and recordId are correct

