#!/bin/bash

# Quick fix script for common Next.js 16 build errors
# Run this on VPS: bash scripts/quick-fix.sh

set -e

echo "🔧 Quick Fix Script for Build Errors"
echo "===================================="
echo ""

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true

# Fix 1: Async params in blockchain routes
echo "1. Fixing async params in blockchain routes..."
find app/api/blockchain -name "route.ts" -type f | while read file; do
    if grep -q "{ params }: { params: { id: string } }" "$file"; then
        echo "   Fixing: $file"
        sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
        
        # Also fix direct params.id access
        if grep -q "const.*= params.id" "$file"; then
            sed -i 's/const \([a-zA-Z]*\) = params\.id/const { id: \1 } = await params/g' "$file"
        fi
    fi
done

# Fix 2: notifySellerVehicleSold - remove extra argument
echo "2. Fixing notifySellerVehicleSold calls..."
find app/api -name "route.ts" -type f -exec grep -l "notifySellerVehicleSold" {} \; | while read file; do
    # Remove purchase.buyer argument (5th argument)
    if grep -q "purchase\.buyer" "$file"; then
        echo "   Fixing: $file"
        # Remove the line with purchase.buyer and the comma before it
        sed -i '/purchase\.buyer$/d' "$file"
        # Remove trailing comma from previous line
        sed -i 's/purchase\.purchasePrice,$/purchase.purchasePrice/' "$file"
    fi
done

# Fix 3: notifySellerAuctionScheduled - add missing arguments
echo "3. Checking notifySellerAuctionScheduled calls..."
find app/api -name "route.ts" -type f -exec grep -l "notifySellerAuctionScheduled" {} \; | while read file; do
    # This needs manual review, just report
    if grep -q "notifySellerAuctionScheduled.*newAuction\.id" "$file" && ! grep -q "notifySellerAuctionScheduled.*startTime.*endTime" "$file"; then
        echo "   ⚠️  Manual fix needed in: $file"
        echo "      Add startTime and endTime arguments"
    fi
done

# Fix 4: doc.setFont(undefined
echo "4. Fixing doc.setFont(undefined..."
find app/api -name "route.ts" -type f -exec grep -l "doc.setFont(undefined" {} \; | while read file; do
    echo "   Fixing: $file"
    sed -i 's/doc\.setFont(undefined/doc.setFont("helvetica"/g' "$file"
done

# Fix 5: targetType assignment
echo "5. Fixing targetType assignment..."
find app/api -name "route.ts" -type f -exec grep -l "targetType = parsed.notificationType" {} \; | while read file; do
    if ! grep -q "targetType = parsed.notificationType || null" "$file"; then
        echo "   Fixing: $file"
        sed -i 's/targetType = parsed\.notificationType$/targetType = parsed.notificationType || null/g' "$file"
    fi
done

# Fix 6: Prisma include + select (report only, needs manual fix)
echo "6. Checking for Prisma include + select issues..."
find app/api -name "route.ts" -type f | while read file; do
    if grep -q "include:" "$file" && grep -q "select:" "$file"; then
        # Simple check - if both appear close together, might be an issue
        lines_with_include=$(grep -n "include:" "$file" | head -1 | cut -d: -f1)
        lines_with_select=$(grep -n "select:" "$file" | head -1 | cut -d: -f1)
        if [ -n "$lines_with_include" ] && [ -n "$lines_with_select" ]; then
            diff=$((lines_with_select - lines_with_include))
            if [ "$diff" -lt 50 ] && [ "$diff" -gt -50 ]; then
                echo "   ⚠️  Possible include + select issue in: $file (needs manual review)"
            fi
        fi
    fi
done

echo ""
echo "✅ Quick fixes applied!"
echo ""
echo "Next steps:"
echo "1. Run: npm run build"
echo "2. Check for remaining errors"
echo "3. Fix any manual issues reported above"

