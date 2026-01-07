#!/bin/bash

# Script to find and fix common Next.js 16 build errors on VPS
# Usage: ./scripts/fix-build-errors.sh [--check|--fix]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

MODE="${1:---check}"
FIXED=0
FOUND=0

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  Next.js 16 Build Error Fixer${NC}"
echo -e "${CYAN}========================================${NC}\n"

# Find all route.ts files
echo -e "${BLUE}Finding route files...${NC}"
ROUTE_FILES=$(find app/api -name "route.ts" -type f)
FILE_COUNT=$(echo "$ROUTE_FILES" | wc -l)
echo -e "${BLUE}Found $FILE_COUNT route files\n${NC}"

# Function to check and fix async params
fix_async_params() {
    local file="$1"
    local modified=0
    
    # Fix old sync params type: { params: { id: string } } -> { params: Promise<{ id: string }> }
    if grep -q "{ params }: { params: { id: string } }" "$file"; then
        echo -e "${YELLOW}  ⚠️  Found old sync params type in $file${NC}"
        if [ "$MODE" = "--fix" ]; then
            sed -i 's/{ params }: { params: { id: string } }/{ params }: { params: Promise<{ id: string }> }/g' "$file"
            modified=1
            echo -e "${GREEN}     ✓ Fixed params type${NC}"
        fi
        FOUND=$((FOUND + 1))
    fi
    
    # Fix direct params.id access (needs manual review, but we can detect it)
    if grep -q "params: Promise" "$file" && grep -q "params\.id" "$file" && ! grep -q "await params" "$file"; then
        echo -e "${YELLOW}  ⚠️  Found direct params.id access in $file (may need await)${NC}"
        FOUND=$((FOUND + 1))
    fi
    
    return $modified
}

# Function to check Prisma queries
check_prisma_queries() {
    local file="$1"
    
    # Check for both include and select
    if grep -q "include:" "$file" && grep -q "select:" "$file"; then
        # Check if they're in the same query block (simplified check)
        if awk '/\.findUnique|\.findFirst|\.findMany|\.create|\.update|\.upsert/,/^[[:space:]]*\)/ {if (/include:/ && /select:/) found=1} END {exit !found}' "$file" 2>/dev/null; then
            echo -e "${YELLOW}  ⚠️  Found Prisma query with both include and select in $file${NC}"
            echo -e "${CYAN}     → Manual fix required: remove include or move relations to select${NC}"
            FOUND=$((FOUND + 1))
        fi
    fi
}

# Function to check function calls
check_function_calls() {
    local file="$1"
    
    # Check notifySellerVehicleSold calls
    if grep -q "notifySellerVehicleSold" "$file"; then
        # Count arguments in calls (simplified)
        while IFS= read -r line; do
            # Count commas in the function call
            arg_count=$(echo "$line" | grep -o "," | wc -l)
            if [ "$arg_count" -gt 3 ]; then
                echo -e "${YELLOW}  ⚠️  notifySellerVehicleSold called with too many arguments in $file${NC}"
                echo -e "${CYAN}     → Remove extra arguments (likely purchase.buyer)${NC}"
                FOUND=$((FOUND + 1))
            fi
        done < <(grep "notifySellerVehicleSold" "$file")
    fi
    
    # Check notifySellerAuctionScheduled calls
    if grep -q "notifySellerAuctionScheduled" "$file"; then
        while IFS= read -r line; do
            arg_count=$(echo "$line" | grep -o "," | wc -l)
            if [ "$arg_count" -lt 3 ]; then
                echo -e "${YELLOW}  ⚠️  notifySellerAuctionScheduled called with too few arguments in $file${NC}"
                echo -e "${CYAN}     → Add missing arguments (startTime, endTime)${NC}"
                FOUND=$((FOUND + 1))
            fi
        done < <(grep "notifySellerAuctionScheduled" "$file")
    fi
}

# Function to check type issues
check_type_issues() {
    local file="$1"
    
    # Check for undefined in setFont
    if grep -q "doc.setFont(undefined" "$file"; then
        echo -e "${YELLOW}  ⚠️  Found doc.setFont(undefined in $file${NC}"
        if [ "$MODE" = "--fix" ]; then
            sed -i 's/doc\.setFont(undefined/doc.setFont("helvetica"/g' "$file"
            echo -e "${GREEN}     ✓ Fixed setFont undefined${NC}"
            FIXED=$((FIXED + 1))
        else
            echo -e "${CYAN}     → Replace undefined with \"helvetica\"${NC}"
        fi
        FOUND=$((FOUND + 1))
    fi
    
    # Check for undefined in type assignments
    if grep -q "targetType = parsed.notificationType" "$file" && ! grep -q "targetType = parsed.notificationType || null" "$file"; then
        echo -e "${YELLOW}  ⚠️  Found targetType assignment issue in $file${NC}"
        if [ "$MODE" = "--fix" ]; then
            sed -i 's/targetType = parsed\.notificationType/targetType = parsed.notificationType || null/g' "$file"
            echo -e "${GREEN}     ✓ Fixed targetType assignment${NC}"
            FIXED=$((FIXED + 1))
        else
            echo -e "${CYAN}     → Change to: targetType = parsed.notificationType || null${NC}"
        fi
        FOUND=$((FOUND + 1))
    fi
}

# Process each file
echo -e "${BLUE}Scanning files...${NC}\n"

while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo -e "${CYAN}Checking: $file${NC}"
        
        fix_async_params "$file"
        check_prisma_queries "$file"
        check_function_calls "$file"
        check_type_issues "$file"
        
        echo ""
    fi
done <<< "$ROUTE_FILES"

# Summary
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  SUMMARY${NC}"
echo -e "${CYAN}========================================${NC}\n"

if [ "$FIXED" -gt 0 ]; then
    echo -e "${GREEN}✅ Fixed $FIXED issue(s)${NC}"
fi

if [ "$FOUND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $FOUND issue(s)${NC}"
    if [ "$MODE" = "--check" ]; then
        echo -e "${BLUE}💡 Run with --fix to automatically fix issues${NC}"
    fi
else
    echo -e "${GREEN}✅ No issues found!${NC}"
fi

echo ""

# Exit with error code if issues found
if [ "$FOUND" -gt 0 ]; then
    exit 1
fi

exit 0

