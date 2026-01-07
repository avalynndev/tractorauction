# Build Error Fix Guide

## Quick Start

### On VPS (Recommended)
```bash
cd /var/www/html/www.tractorauction.in
bash scripts/quick-fix.sh
npm run build
```

## Scripts Created

### 1. `scripts/quick-fix.sh` ⭐ **Use This First**
- Simple, safe, targeted fixes
- Best for VPS deployment
- Fixes most common issues automatically

### 2. `scripts/fix-build-errors.sh`
- Comprehensive scanning
- Detailed reporting
- Optional auto-fix mode

### 3. `scripts/fix-build-errors.js`
- Node.js version (runs on local machine)
- Most accurate pattern matching
- Best for local development

## What Gets Fixed

✅ **Async Route Params** (Next.js 16 breaking change)
- Old: `{ params: { id: string } }` → `params.id`
- New: `{ params: Promise<{ id: string }> }` → `const { id } = await params`

✅ **Function Call Arguments**
- `notifySellerVehicleSold` - removes extra `purchase.buyer` argument
- `notifySellerAuctionScheduled` - reports missing arguments

✅ **Type Issues**
- `doc.setFont(undefined)` → `doc.setFont("helvetica")`
- `targetType = parsed.notificationType` → `targetType = parsed.notificationType || null`

⚠️ **Prisma Queries** (Reports only, needs manual fix)
- Detects queries with both `include` and `select`
- Manual fix required: remove `include` or move to `select`

## Usage

### Option 1: Quick Fix (VPS)
```bash
# On VPS
bash scripts/quick-fix.sh
npm run build
```

### Option 2: Comprehensive Check (VPS)
```bash
# Check only
bash scripts/fix-build-errors.sh --check

# Fix automatically
bash scripts/fix-build-errors.sh --fix
npm run build
```

### Option 3: Local Development
```bash
# On local machine (Windows/Mac/Linux)
node scripts/fix-build-errors.js --check
node scripts/fix-build-errors.js --fix
npm run build
```

## Current Build Errors to Fix

Based on recent errors, here's what needs fixing:

1. ✅ `app/api/purchases/[id]/approve/route.ts` - Fixed locally
2. ⚠️ `app/api/inspections/[id]/public/route.ts` - Prisma include+select (manual)
3. ⚠️ `app/api/inspections/schedule/route.ts` - Missing variable (check line 136)
4. ⚠️ Any other route files with async params issues

## Step-by-Step VPS Fix

```bash
# 1. Navigate to project
cd /var/www/html/www.tractorauction.in

# 2. Make scripts executable
chmod +x scripts/*.sh

# 3. Run quick fix
bash scripts/quick-fix.sh

# 4. Build
npm run build

# 5. If errors remain, check specific files
# Example:
nano app/api/inspections/schedule/route.ts
# Look for: const assignedValuerId = searchParams.get("assignedValuerId");

# 6. After fixes, restart PM2
pm2 restart tractorauction
```

## Manual Fixes Needed

### 1. Prisma Include + Select
**File:** `app/api/inspections/[id]/public/route.ts`

**Problem:**
```typescript
prisma.vehicleInspectionReport.findUnique({
  where: { id: reportId },
  include: { vehicle: { select: {...} } },
  select: { ... }
});
```

**Fix:**
```typescript
prisma.vehicleInspectionReport.findUnique({
  where: { id: reportId },
  select: {
    ...fields...,
    vehicle: {
      select: { ... }
    }
  }
});
```

### 2. Missing Variable Declaration
**File:** `app/api/inspections/schedule/route.ts`

**Check line 136:**
```typescript
const assignedValuerId = searchParams.get("assignedValuerId");
```

If missing, add it.

## After Fixing

1. ✅ Run `npm run build` - should succeed
2. ✅ Restart PM2: `pm2 restart tractorauction`
3. ✅ Check logs: `pm2 logs tractorauction`
4. ✅ Test the application
5. ✅ Commit to Git: `git add . && git commit -m "Fix build errors"`

## Troubleshooting

### Script Permission Denied
```bash
chmod +x scripts/*.sh
```

### Script Makes Wrong Changes
```bash
# Restore from Git
git checkout app/api/
```

### Still Getting Errors
1. Check the specific error message
2. Open the file with `nano`
3. Compare with working examples
4. Fix manually

## Next Steps

After all fixes:
1. Push to GitHub
2. Pull on VPS from GitHub
3. Run `npm run build`
4. Restart PM2
5. Verify deployment

