# Where to Find Blockchain Records - Quick Guide

## 📍 Current Locations

### 1. **Vehicle Detail Pages** ✅
**URL**: `http://localhost:3000/vehicles/[vehicle-id]`

- Blockchain verification badge is displayed on the vehicle detail page
- Shows blockchain hash and verification status
- Click "Verify" to verify the blockchain record

**How to access:**
1. Go to any vehicle listing (auctions or pre-approved)
2. Click on a vehicle card
3. Scroll to see the blockchain verification section

---

### 2. **Database (PostgreSQL)** ✅

**Using Prisma Studio:**
```bash
npx prisma studio
```

Then:
1. Open `Vehicle` table
2. Look for columns: `blockchainHash`, `blockchainVerified`, `blockchainVerifiedAt`
3. Or open `Auction` table for auction blockchain records

**Using SQL:**
```sql
-- View vehicles with blockchain records
SELECT id, referenceNumber, blockchainHash, blockchainVerified 
FROM "Vehicle" 
WHERE blockchainHash IS NOT NULL;

-- View auctions with blockchain records
SELECT id, referenceNumber, blockchainHash, blockchainVerified 
FROM "Auction" 
WHERE blockchainHash IS NOT NULL;
```

---

### 3. **API Endpoints** ✅

**Verify Vehicle:**
```
GET /api/blockchain/verify/vehicle/[vehicle-id]
```

**Verify Auction:**
```
GET /api/blockchain/verify/auction/[auction-id]
```

**Example:**
```bash
# In browser console or API client
fetch('/api/blockchain/verify/vehicle/[vehicle-id]')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 4. **Admin Panel** ✅

**URL**: `http://localhost:3000/admin`

When viewing vehicle details in admin panel, blockchain information is available.

---

## 🔍 Quick Check Methods

### Method 1: Check Database
```bash
# Open Prisma Studio
npx prisma studio

# Navigate to Vehicle table
# Look for blockchainHash column
```

### Method 2: Check Vehicle Page
1. Visit: `http://localhost:3000/vehicles/[any-vehicle-id]`
2. Look for blockchain verification badge
3. The hash should be displayed

### Method 3: Use API
```javascript
// In browser console
const vehicleId = 'your-vehicle-id';
fetch(`/api/blockchain/verify/vehicle/${vehicleId}`)
  .then(r => r.json())
  .then(d => console.log('Blockchain:', d));
```

---

## 📊 What Gets Stored

### Vehicle Blockchain Record Contains:
- Registration Number
- Engine Number
- Chassis Number
- Vehicle Type
- Tractor Brand
- Year of Manufacture
- Seller ID
- Timestamp

### Auction Blockchain Record Contains:
- Vehicle ID
- Start Time
- End Time
- Current Bid
- Winner ID
- Total Bids
- Ended At timestamp

---

## ✅ Verification Status

- **blockchainHash**: SHA-256 hash (64 characters)
- **blockchainVerified**: `true` if verified, `false` if not yet verified
- **blockchainVerifiedAt**: Timestamp when verification was performed

---

## 🚀 Next Steps

1. **View in Database**: Use Prisma Studio to see all blockchain records
2. **View on Website**: Visit vehicle detail pages to see blockchain badges
3. **Verify Records**: Use the verification API or click "Verify" button on vehicle pages

For detailed information, see: `docs/WHERE_TO_FIND_BLOCKCHAIN_RECORDS.md`

