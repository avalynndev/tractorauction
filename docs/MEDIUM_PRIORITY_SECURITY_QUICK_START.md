# Medium Priority Security - Quick Start Guide

## 🚀 Quick Setup

### 1. Environment Variables

Add these to your `.env` file:

```env
# Session Management
REFRESH_TOKEN_SECRET=your-32-character-or-longer-secret-key-here

# Encryption
ENCRYPTION_KEY=your-32-character-or-longer-encryption-key-here

# Virus Scanning (Optional)
ENABLE_VIRUS_SCAN=false
VIRUSTOTAL_API_KEY=your-virustotal-api-key  # Optional
CLAMAV_ENABLED=false  # Optional

# DDoS Protection - CAPTCHA (Optional)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret  # Optional
RECAPTCHA_SITE_KEY=your-recaptcha-site-key  # Optional
```

### 2. Update Login to Use Token Pairs

**File**: `app/api/auth/verify-otp/route.ts`

```typescript
// Replace:
const token = generateToken(user.id, user.phoneNumber);

// With:
import { generateTokenPair } from "@/lib/session";
const { accessToken, refreshToken, expiresIn } = generateTokenPair({
  userId: user.id,
  phoneNumber: user.phoneNumber,
});

// Return both tokens
return NextResponse.json({
  message: "OTP verified successfully",
  accessToken,
  refreshToken,
  expiresIn,
  // ... rest of response
});
```

### 3. Enable Virus Scanning (Optional)

**File**: `lib/cloudinary.ts` (already integrated)

Just set in `.env`:
```env
ENABLE_VIRUS_SCAN=true
VIRUSTOTAL_API_KEY=your-key
```

### 4. Enable CAPTCHA (Optional)

**Frontend**: Add CAPTCHA widget to forms
**Backend**: Already integrated in middleware

Set in `.env`:
```env
RECAPTCHA_SECRET_KEY=your-secret
RECAPTCHA_SITE_KEY=your-site-key
```

### 5. Use API Versioning

Create versioned routes:
- `/api/v1/users` - Version 1
- `/api/v2/users` - Version 2

See `app/api/v1/example/route.ts` for example.

## ✅ What's Already Working

1. ✅ **Session Management**: `lib/session.ts` ready to use
2. ✅ **Encryption**: `lib/encryption.ts` ready to use
3. ✅ **Virus Scanning**: Integrated into `lib/cloudinary.ts`
4. ✅ **DDoS Protection**: Integrated into `middleware.ts`
5. ✅ **API Versioning**: `lib/api-versioning.ts` ready to use

## 📝 Next Steps

1. **Test the implementations** in development
2. **Configure environment variables** as needed
3. **Update login endpoints** to use token pairs
4. **Add CAPTCHA widgets** to frontend forms
5. **Create versioned API routes** for new features

See `docs/MEDIUM_PRIORITY_SECURITY.md` for detailed documentation.

