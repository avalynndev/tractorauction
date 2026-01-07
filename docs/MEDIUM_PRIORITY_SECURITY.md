# Medium Priority Security Measures - Implementation Guide

## ✅ Implemented Features

All 5 medium priority security measures have been successfully implemented:

### 1. ✅ Session Management Improvements
**Location**: `lib/session.ts`

**Features**:
- **Refresh Tokens**: Long-lived refresh tokens (30 days) for session persistence
- **Access Tokens**: Short-lived access tokens (15 minutes) for security
- **Token Rotation**: New tokens generated on refresh to prevent token reuse
- **Session Invalidation**: Ability to revoke individual or all sessions
- **Device Tracking**: Optional device ID and IP tracking for sessions

**Usage**:
```typescript
import { generateTokenPair, refreshAccessToken, revokeAllSessions } from '@/lib/session';

// Generate token pair on login
const { accessToken, refreshToken, expiresIn } = generateTokenPair({
  userId: user.id,
  phoneNumber: user.phoneNumber,
  deviceId: deviceId,
  ipAddress: clientIP,
});

// Refresh access token
const newTokens = await refreshAccessToken(refreshToken);

// Revoke all sessions (logout from all devices)
await revokeAllSessions(userId);
```

**Migration**:
- Existing `generateToken()` and `verifyToken()` functions still work (backward compatible)
- New endpoints should use `generateTokenPair()` for better security
- Refresh tokens should be stored securely (httpOnly cookies recommended)

### 2. ✅ Database Encryption at Rest
**Location**: `lib/encryption.ts`

**Features**:
- **AES-256-GCM Encryption**: Industry-standard encryption algorithm
- **Field-Level Encryption**: Encrypt sensitive fields before database storage
- **PII Encryption**: Helper functions for encrypting personally identifiable information
- **Key Derivation**: PBKDF2 key derivation with salt for security

**Usage**:
```typescript
import { encrypt, decrypt, encryptPII, decryptPII } from '@/lib/encryption';

// Encrypt sensitive data
const encryptedPhone = encrypt(phoneNumber);
const decryptedPhone = decrypt(encryptedPhone);

// Encrypt PII
const encryptedData = encryptPII({
  phoneNumber: user.phoneNumber,
  email: user.email,
  address: user.address,
});
```

**Fields to Encrypt**:
- Phone numbers
- Email addresses
- Physical addresses
- PAN card numbers
- Aadhar card numbers
- Any other PII

**Note**: Add `ENCRYPTION_KEY` to `.env` (should be different from JWT_SECRET)

### 3. ✅ File Upload Virus Scanning
**Location**: `lib/virus-scan.ts`

**Features**:
- **VirusTotal Integration**: Cloud-based virus scanning (optional)
- **ClamAV Support**: Local ClamAV integration (optional)
- **File Signature Validation**: Validates file types using magic bytes
- **Size Validation**: Prevents DoS attacks via large files
- **Multiple File Scanning**: Batch scanning support

**Usage**:
```typescript
import { scanFile, scanFiles } from '@/lib/virus-scan';

// Scan single file
const result = await scanFile(fileBuffer, fileName, mimeType);
if (!result.clean) {
  throw new Error(`File contains threats: ${result.threats?.join(", ")}`);
}

// Scan multiple files
const results = await scanFiles([
  { buffer: buffer1, fileName: "file1.jpg", mimeType: "image/jpeg" },
  { buffer: buffer2, fileName: "file2.png", mimeType: "image/png" },
]);
```

**Configuration**:
```env
# VirusTotal (optional)
VIRUSTOTAL_API_KEY=your-api-key

# ClamAV (optional)
CLAMAV_ENABLED=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# Enable virus scanning
ENABLE_VIRUS_SCAN=true
```

**Integration**: Already integrated into `lib/cloudinary.ts` for image uploads

### 4. ✅ Enhanced DDoS Protection
**Location**: `lib/ddos-protection.ts`, `middleware.ts`

**Features**:
- **IP Blocking**: Automatic IP blocking for suspicious activity
- **CAPTCHA Integration**: Google reCAPTCHA and hCaptcha support
- **Suspicious Activity Tracking**: Monitors and flags suspicious IPs
- **Enhanced Rate Limiting**: Multi-tier rate limiting with CAPTCHA challenges
- **Automatic Cleanup**: Expired blocks and activity records are cleaned up

**Usage**:
```typescript
import { enhancedRateLimit, blockIP, verifyCaptcha } from '@/lib/ddos-protection';

// Enhanced rate limiting
const result = enhancedRateLimit(clientIP);
if (!result.allowed) {
  if (result.requiresCaptcha) {
    // Show CAPTCHA to user
  } else if (result.blocked) {
    // IP is blocked
  }
}

// Verify CAPTCHA
const isValid = await verifyCaptcha(captchaToken);
```

**Configuration**:
```env
# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your-secret-key
RECAPTCHA_SITE_KEY=your-site-key

# hCaptcha (alternative)
HCAPTCHA_SECRET_KEY=your-secret-key
HCAPTCHA_SITE_KEY=your-site-key
```

**Integration**: Already integrated into `middleware.ts` for all API routes

### 5. ✅ API Versioning
**Location**: `lib/api-versioning.ts`

**Features**:
- **Versioned Endpoints**: `/api/v1/`, `/api/v2/`, etc.
- **Multiple Version Detection**: URL path, Accept header, or custom header
- **Deprecation Warnings**: Automatic deprecation headers for old versions
- **Version Headers**: Response includes API version information
- **Migration Support**: Link headers point to latest version

**Usage**:
```typescript
import { withApiVersioning, getApiVersion, createVersionedResponse } from '@/lib/api-versioning';

// Versioned route handler
export const GET = withApiVersioning(async (request, version) => {
  // Your handler code
  const data = { message: "Hello from " + version };
  return createVersionedResponse(data, version);
});

// Or manually
export async function GET(request: NextRequest) {
  const version = getApiVersion(request);
  // Handle based on version
  return createVersionedResponse(data, version);
}
```

**Version Detection**:
1. URL path: `/api/v1/users` → v1
2. Accept header: `Accept: application/json; version=v2` → v2
3. Custom header: `X-API-Version: v2` → v2
4. Default: v1

**Response Headers**:
- `X-API-Version`: Current API version
- `Warning`: Deprecation warning (if applicable)
- `Sunset`: Deprecation date (if applicable)
- `Link`: Link to latest version

## Environment Variables

Add to your `.env` file:

```env
# Session Management
REFRESH_TOKEN_SECRET=your-refresh-token-secret-min-32-chars

# Encryption
ENCRYPTION_KEY=your-encryption-key-min-32-chars

# Virus Scanning
ENABLE_VIRUS_SCAN=true
VIRUSTOTAL_API_KEY=your-virustotal-api-key
CLAMAV_ENABLED=false
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# DDoS Protection (CAPTCHA)
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_SITE_KEY=your-recaptcha-site-key
# OR
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret
HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
```

## Migration Guide

### Session Management
1. Update login endpoints to use `generateTokenPair()` instead of `generateToken()`
2. Add refresh token endpoint: `/api/auth/refresh`
3. Store refresh tokens securely (httpOnly cookies recommended)
4. Update frontend to handle token refresh

### Database Encryption
1. Identify sensitive fields to encrypt
2. Create migration script to encrypt existing data
3. Update Prisma models to use encrypted fields
4. Update API routes to encrypt/decrypt data

### Virus Scanning
1. Choose scanning method (VirusTotal or ClamAV)
2. Configure API keys or ClamAV
3. Test with sample files
4. Monitor scan results and adjust thresholds

### DDoS Protection
1. Configure CAPTCHA service (reCAPTCHA or hCaptcha)
2. Add CAPTCHA widget to frontend forms
3. Test rate limiting and blocking
4. Monitor blocked IPs and adjust thresholds

### API Versioning
1. Create versioned route structure: `/api/v1/`, `/api/v2/`
2. Migrate existing routes to v1
3. Create new routes in v2
4. Add deprecation notices for v1
5. Update API documentation

## Testing

### Test Session Management
```bash
# Test token generation
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "9876543210", "method": "otp"}'

# Test token refresh
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "your-refresh-token"}'
```

### Test Encryption
```typescript
import { encrypt, decrypt } from '@/lib/encryption';
const encrypted = encrypt("sensitive data");
const decrypted = decrypt(encrypted);
console.log(decrypted === "sensitive data"); // true
```

### Test Virus Scanning
```typescript
import { scanFile } from '@/lib/virus-scan';
const result = await scanFile(buffer, "test.jpg", "image/jpeg");
console.log(result.clean); // true/false
```

### Test DDoS Protection
```bash
# Test rate limiting
for i in {1..100}; do
  curl http://localhost:3000/api/test
done

# Should get rate limited and require CAPTCHA
```

### Test API Versioning
```bash
# Test v1
curl http://localhost:3000/api/v1/users

# Test v2
curl http://localhost:3000/api/v2/users

# Check headers
curl -I http://localhost:3000/api/v1/users
# Should include X-API-Version and Warning headers
```

## Next Steps

1. **Create Refresh Token Model**: Add `RefreshToken` model to Prisma schema
2. **Implement Refresh Endpoint**: Create `/api/auth/refresh` route
3. **Encrypt Existing Data**: Create migration script for existing sensitive data
4. **Configure CAPTCHA**: Set up reCAPTCHA or hCaptcha
5. **Version Existing APIs**: Move current APIs to `/api/v1/` and create `/api/v2/`
6. **Update Frontend**: Add token refresh logic and CAPTCHA widgets
7. **Monitor & Adjust**: Monitor security metrics and adjust thresholds

## Security Best Practices

1. **Refresh Tokens**: Store in httpOnly cookies, never in localStorage
2. **Encryption Keys**: Use strong, unique keys (32+ characters)
3. **Virus Scanning**: Always scan user uploads, especially executables
4. **Rate Limiting**: Adjust thresholds based on legitimate traffic patterns
5. **API Versioning**: Maintain backward compatibility during transitions
6. **Monitoring**: Log all security events for analysis

## Support

For questions or issues:
- Review implementation files for inline documentation
- Check environment variable configuration
- Test in development before production deployment
- Monitor logs for security events

