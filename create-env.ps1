# PowerShell script to create .env file

if (Test-Path .env) {
    Write-Host ".env file already exists!" -ForegroundColor Yellow
    Write-Host "Please manually update DATABASE_URL with your PostgreSQL credentials."
} else {
    @"
# Database
DATABASE_URL="postgresql://postgres:root@localhost:5432/tractorauction?schema=public"

# JWT Secret
JWT_SECRET="your-secret-key-change-in-production"

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload (Cloudinary or AWS S3)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host ".env file created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Please update the following in .env file:" -ForegroundColor Yellow
    Write-Host "1. DATABASE_URL - Replace 'password' with your PostgreSQL password" -ForegroundColor Yellow
    Write-Host "2. JWT_SECRET - Use a strong random string" -ForegroundColor Yellow
}





























