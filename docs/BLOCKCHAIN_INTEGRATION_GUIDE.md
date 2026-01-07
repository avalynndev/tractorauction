# Blockchain Integration Guide

This guide explains how to integrate blockchain verification into your workflows, both manually via API and automatically in approval workflows.

## Table of Contents
1. [Using Admin API to Create Records](#using-admin-api)
2. [Automatic Integration in Workflows](#automatic-integration)
3. [Examples and Code Snippets](#examples)

---

## Using Admin API to Create Records

### Prerequisites
- Admin authentication token
- Record ID (vehicle, auction, bid, or purchase)

### API Endpoint

**POST** `/api/blockchain/create`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "recordType": "VEHICLE" | "AUCTION" | "BID" | "PURCHASE",
  "recordId": "record-id-here"
}
```

### Examples

#### 1. Create Blockchain Record for a Vehicle

```bash
curl -X POST http://localhost:3000/api/blockchain/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordType": "VEHICLE",
    "recordId": "vehicle-id-here"
  }'
```

#### 2. Create Blockchain Record for an Auction

```bash
curl -X POST http://localhost:3000/api/blockchain/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordType": "AUCTION",
    "recordId": "auction-id-here"
  }'
```

#### 3. Create Blockchain Record for a Bid

```bash
curl -X POST http://localhost:3000/api/blockchain/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordType": "BID",
    "recordId": "bid-id-here"
  }'
```

#### 4. Create Blockchain Record for a Purchase

```bash
curl -X POST http://localhost:3000/api/blockchain/create \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recordType": "PURCHASE",
    "recordId": "purchase-id-here"
  }'
```

### JavaScript/TypeScript Example

```typescript
async function createBlockchainRecord(recordType: string, recordId: string) {
  const token = localStorage.getItem("token"); // Admin token
  
  const response = await fetch("/api/blockchain/create", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recordType,
      recordId,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log("Blockchain record created:", data.hash);
    return data;
  } else {
    const error = await response.json();
    console.error("Error:", error.message);
    throw new Error(error.message);
  }
}

// Usage
await createBlockchainRecord("VEHICLE", "vehicle-id-123");
```

### Batch Creation Script

```typescript
// Create blockchain records for all approved vehicles
async function createRecordsForAllVehicles() {
  const token = "YOUR_ADMIN_TOKEN";
  
  // Fetch all approved vehicles
  const vehiclesResponse = await fetch("/api/admin/vehicles?status=APPROVED", {
    headers: { "Authorization": `Bearer ${token}` },
  });
  const vehicles = await vehiclesResponse.json();

  // Create blockchain records
  for (const vehicle of vehicles) {
    try {
      await createBlockchainRecord("VEHICLE", vehicle.id);
      console.log(`✓ Created record for vehicle ${vehicle.id}`);
    } catch (error) {
      console.error(`✗ Failed for vehicle ${vehicle.id}:`, error);
    }
  }
}
```

---

## Automatic Integration in Workflows

### 1. Vehicle Approval Workflow

**File:** `app/api/admin/vehicles/[id]/approve/route.ts`

Add blockchain record creation after vehicle approval:

```typescript
import { createVehicleBlockchainRecord } from "@/lib/blockchain";

// After vehicle is approved (around line 119)
updatedVehicle = await prisma.vehicle.update({
  where: { id: vehicleId },
  data: updateData,
});

// Create blockchain record automatically
try {
  await createVehicleBlockchainRecord(vehicleId);
  console.log(`Blockchain record created for vehicle ${vehicleId}`);
} catch (error) {
  console.error(`Failed to create blockchain record for vehicle ${vehicleId}:`, error);
  // Don't fail the approval if blockchain creation fails
}
```

### 2. Auction Winner Confirmation Workflow

**File:** `app/api/admin/auctions/[id]/confirm-winner/route.ts`

Add blockchain record creation after winner confirmation:

```typescript
import { createAuctionBlockchainRecord, createBidBlockchainRecord } from "@/lib/blockchain";

// After winner is confirmed (around line 207)
await tx.purchase.create({
  data: { /* ... */ },
});

// Create blockchain records after transaction
try {
  // Create auction blockchain record
  await createAuctionBlockchainRecord(auctionId);
  
  // Create bid blockchain record
  await createBidBlockchainRecord(winnerBidId);
  
  console.log(`Blockchain records created for auction ${auctionId}`);
} catch (error) {
  console.error(`Failed to create blockchain records:`, error);
}
```

### 3. Bid Placement Workflow

**File:** `app/api/auctions/[id]/bids/route.ts` (or wherever bids are created)

Add blockchain record creation after bid is placed:

```typescript
import { createBidBlockchainRecord } from "@/lib/blockchain";

// After bid is created
const newBid = await prisma.bid.create({
  data: { /* ... */ },
});

// Create blockchain record
try {
  await createBidBlockchainRecord(newBid.id);
} catch (error) {
  console.error(`Failed to create blockchain record for bid ${newBid.id}:`, error);
}
```

### 4. Purchase Completion Workflow

**File:** `app/api/purchases/payment-callback/route.ts` (or wherever purchase is completed)

Add blockchain record creation after purchase completion:

```typescript
import { createPurchaseBlockchainRecord } from "@/lib/blockchain";

// After purchase is completed
await prisma.purchase.update({
  where: { id: purchaseId },
  data: { status: "completed" },
});

// Create blockchain record
try {
  await createPurchaseBlockchainRecord(purchaseId);
} catch (error) {
  console.error(`Failed to create blockchain record for purchase ${purchaseId}:`, error);
}
```

---

## Complete Integration Examples

### Example 1: Vehicle Approval with Blockchain

```typescript
// app/api/admin/vehicles/[id]/approve/route.ts
import { createVehicleBlockchainRecord } from "@/lib/blockchain";

export async function POST(request: NextRequest, { params }) {
  // ... existing approval logic ...

  // Update vehicle status
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: { status: "APPROVED" },
  });

  // Automatically create blockchain record
  try {
    const hash = await createVehicleBlockchainRecord(vehicleId);
    console.log(`Vehicle ${vehicleId} verified on blockchain: ${hash}`);
  } catch (error) {
    console.error(`Blockchain verification failed for vehicle ${vehicleId}:`, error);
    // Continue even if blockchain creation fails
  }

  return NextResponse.json({
    message: "Vehicle approved successfully",
    vehicle: updatedVehicle,
  });
}
```

### Example 2: Auction End with Blockchain

```typescript
// app/api/admin/auctions/[id]/confirm-winner/route.ts
import { createAuctionBlockchainRecord, createBidBlockchainRecord } from "@/lib/blockchain";

export async function POST(request: NextRequest, { params }) {
  // ... existing winner confirmation logic ...

  await prisma.$transaction(async (tx) => {
    // ... update auction, bids, create purchase ...
  });

  // Create blockchain records after transaction
  try {
    // Create auction record
    await createAuctionBlockchainRecord(auctionId);
    
    // Create winning bid record
    await createBidBlockchainRecord(winnerBidId);
    
    console.log(`Blockchain records created for auction ${auctionId}`);
  } catch (error) {
    console.error(`Blockchain verification failed:`, error);
  }

  return NextResponse.json({
    message: "Winner confirmed successfully",
  });
}
```

---

## Verification

After creating blockchain records, verify them:

```typescript
// Verify a record
const response = await fetch(
  `/api/blockchain/verify?recordType=VEHICLE&recordId=${vehicleId}`
);
const verification = await response.json();

if (verification.verified && verification.chainValid) {
  console.log("✓ Record is verified and chain is valid");
} else {
  console.log("✗ Record verification failed");
}
```

---

## Best Practices

1. **Error Handling**: Always wrap blockchain creation in try-catch blocks. Don't fail the main operation if blockchain creation fails.

2. **Async Operations**: Blockchain record creation is async. Use `await` or handle promises properly.

3. **Transaction Safety**: Create blockchain records after database transactions complete to ensure data consistency.

4. **Logging**: Log blockchain operations for debugging and auditing.

5. **Idempotency**: The blockchain service checks if a record already exists before creating a new one.

---

## Troubleshooting

### Record Already Exists
If you get an error that a record already exists, the record is already verified. You can skip creation or verify the existing record.

### Chain Invalid
If chain validation fails, check:
- Previous records exist
- Hashes are calculated correctly
- No data was modified after blockchain record creation

### API Errors
- Ensure admin token is valid
- Check record exists before creating blockchain record
- Verify recordType and recordId are correct

---

## Next Steps

1. Integrate automatic blockchain creation in vehicle approval
2. Integrate automatic blockchain creation in auction completion
3. Add blockchain verification badges to UI
4. Create admin dashboard for managing verifications
5. Set up monitoring for blockchain operations

