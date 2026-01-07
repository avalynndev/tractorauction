# Build Error Fix Scripts

This directory contains scripts to automatically find and fix common Next.js 16 build errors.

## Scripts

### 1. `quick-fix.sh` (Recommended for VPS)
**Simple, targeted fixes for common issues**

```bash
# On VPS
bash scripts/quick-fix.sh
```

**Fixes:**
- ✅ Async params in route handlers
- ✅ `notifySellerVehicleSold` extra arguments
- ✅ `doc.setFont(undefined)` → `doc.setFont("helvetica")`
- ✅ `targetType` undefined → null
- ⚠️ Reports Prisma include+select issues (needs manual fix)

### 2. `fix-build-errors.sh` (Comprehensive check)
**Detailed scanning and optional auto-fix**

```bash
# Check only (no changes)
bash scripts/fix-build-errors.sh --check

# Check and fix automatically
bash scripts/fix-build-errors.sh --fix
```

**Features:**
- Scans all route files
- Reports all issues found
- Can auto-fix some issues
- Color-coded output

### 3. `fix-build-errors.js` (Node.js version)
**Most comprehensive, runs on local machine**

```bash
# Check only
node scripts/fix-build-errors.js --check

# Check and fix
node scripts/fix-build-errors.js --fix
```

**Features:**
- Works on Windows/Mac/Linux
- Most accurate pattern matching
- Detailed reporting
- Can fix complex issues

## Common Issues Fixed

### 1. Async Route Params (Next.js 16)
**Problem:**
```typescript
// Old (Next.js 15)
{ params }: { params: { id: string } }
const id = params.id;
```

**Fixed:**
```typescript
// New (Next.js 16)
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

### 2. Function Call Arguments
**Problem:**
```typescript
// Too many arguments
notifySellerVehicleSold(sellerId, vehicleId, vehicle, price, buyer);
```

**Fixed:**
```typescript
// Correct (4 arguments)
notifySellerVehicleSold(sellerId, vehicleId, vehicle, price);
```

### 3. Prisma Queries
**Problem:**
```typescript
// Can't use both
prisma.model.findUnique({
  include: { relation: true },
  select: { field: true }
});
```

**Fixed:**
```typescript
// Use only select
prisma.model.findUnique({
  select: {
    field: true,
    relation: { select: { ... } }
  }
});
```

### 4. Type Issues
**Problem:**
```typescript
doc.setFont(undefined, "bold");
targetType = parsed.notificationType; // may be undefined
```

**Fixed:**
```typescript
doc.setFont("helvetica", "bold");
targetType = parsed.notificationType || null;
```

## Usage on VPS

### Step 1: Upload scripts
```bash
# Make sure scripts are in the project
cd /var/www/html/www.tractorauction.in
ls scripts/
```

### Step 2: Run quick fix
```bash
bash scripts/quick-fix.sh
```

### Step 3: Build
```bash
npm run build
```

### Step 4: Fix remaining issues manually
If there are still errors, check the output and fix manually using `nano`.

## Manual Fixes

Some issues require manual fixes:

1. **Prisma include + select**: Remove `include` and move relations to `select`
2. **Complex async params**: Some route handlers need careful review
3. **Function signatures**: Check the actual function definition

## Troubleshooting

### Script doesn't run
```bash
chmod +x scripts/*.sh
```

### Script makes wrong changes
```bash
# Restore from Git
git checkout app/api/

# Or restore from backup
```

### Still getting errors
1. Check the specific error message
2. Look at the file mentioned
3. Compare with working files
4. Fix manually with `nano`

## Best Practices

1. **Always backup** before running fix scripts
2. **Test locally** first if possible
3. **Review changes** after running scripts
4. **Run build** after fixes to verify
5. **Commit fixes** to Git for tracking

## Example Workflow

```bash
# 1. Check current status
npm run build 2>&1 | tee build-errors.log

# 2. Run quick fix
bash scripts/quick-fix.sh

# 3. Build again
npm run build

# 4. If errors remain, check specific files
nano app/api/path/to/route.ts

# 5. After all fixes, commit
git add .
git commit -m "Fix Next.js 16 build errors"
```

