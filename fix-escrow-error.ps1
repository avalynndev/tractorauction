# Fix Escrow Error Script
# This script will help fix the Prisma Escrow model error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fixing Escrow Error" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if server is running
Write-Host "Step 1: Checking if dev server is running..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "WARNING: Node.js processes detected!" -ForegroundColor Red
    Write-Host "Please stop the dev server (Ctrl+C) before running this script." -ForegroundColor Red
    Write-Host ""
    $continue = Read-Host "Have you stopped the dev server? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Exiting. Please stop the server and try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "No Node.js processes found. Good!" -ForegroundColor Green
}
Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "Step 2: Regenerating Prisma Client..." -ForegroundColor Yellow
try {
    npx prisma generate
    Write-Host "Prisma client regenerated successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error regenerating Prisma client: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Clear Next.js cache (if possible)
Write-Host "Step 3: Attempting to clear Next.js cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    try {
        Remove-Item -Recurse -Force ".next" -ErrorAction Stop
        Write-Host "Next.js cache cleared successfully!" -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not fully clear .next cache (some files may be locked)" -ForegroundColor Yellow
        Write-Host "This is okay - the server restart will handle it." -ForegroundColor Yellow
    }
} else {
    Write-Host ".next folder not found. That's okay." -ForegroundColor Green
}
Write-Host ""

# Step 4: Verify Escrow model
Write-Host "Step 4: Verifying Escrow model in Prisma client..." -ForegroundColor Yellow
$escrowCheck = Get-Content "node_modules\.prisma\client\index.d.ts" -ErrorAction SilentlyContinue | Select-String -Pattern "prisma\.escrow" -Quiet
if ($escrowCheck) {
    Write-Host "✓ Escrow model found in Prisma client!" -ForegroundColor Green
} else {
    Write-Host "✗ Escrow model NOT found in Prisma client!" -ForegroundColor Red
    Write-Host "Please check your prisma/schema.prisma file." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Final instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start your development server: npm run dev" -ForegroundColor White
Write-Host "2. The Escrow page should now work at /admin/escrow" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors:" -ForegroundColor Yellow
Write-Host "- Make sure the dev server was completely stopped" -ForegroundColor White
Write-Host "- Try deleting .next folder manually after stopping server" -ForegroundColor White
Write-Host "- Restart your IDE/editor" -ForegroundColor White
Write-Host ""

























