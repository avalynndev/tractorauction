# PowerShell script to help update DATABASE_URL in .env file

Write-Host "=== Update PostgreSQL Password in .env ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file first." -ForegroundColor Yellow
    exit 1
}

# Read current .env
$envContent = Get-Content .env

# Show current DATABASE_URL
$currentDbUrl = $envContent | Select-String "DATABASE_URL"
Write-Host "Current DATABASE_URL:" -ForegroundColor Yellow
Write-Host $currentDbUrl -ForegroundColor Gray
Write-Host ""

# Ask for new password
Write-Host "Enter your PostgreSQL password:" -ForegroundColor Cyan
Write-Host "(The password you set when installing PostgreSQL)" -ForegroundColor Gray
$password = Read-Host "Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
    Write-Host "Error: Password cannot be empty!" -ForegroundColor Red
    exit 1
}

# URL encode special characters
$passwordEncoded = [System.Web.HttpUtility]::UrlEncode($passwordPlain)

# Build new DATABASE_URL
$newDbUrl = "DATABASE_URL=`"postgresql://postgres:$passwordEncoded@localhost:5432/tractorauction?schema=public`""

# Update .env file
$newContent = $envContent | ForEach-Object {
    if ($_ -match "^DATABASE_URL=") {
        $newDbUrl
    } else {
        $_
    }
}

# Write updated content
$newContent | Set-Content .env -Encoding UTF8

Write-Host ""
Write-Host "✓ .env file updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "New DATABASE_URL:" -ForegroundColor Yellow
Write-Host $newDbUrl -ForegroundColor Gray
Write-Host ""
Write-Host "Next step: Test the connection with:" -ForegroundColor Cyan
Write-Host "  npx prisma db push" -ForegroundColor White





























