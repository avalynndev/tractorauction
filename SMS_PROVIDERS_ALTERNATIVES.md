# SMS Provider Alternatives - Setup Guide

## Overview
The system now supports multiple SMS providers with automatic fallback. You can use any of these providers:

1. **Twilio** (International, works globally)
2. **MSG91** (Popular in India, cost-effective)
3. **TextLocal** (Popular in India, easy setup)
4. **Console Mode** (Development/Testing - logs OTP to console)

## Option 1: MSG91 (Recommended for India)

### Why MSG91?
- ✅ Very popular in India
- ✅ Lower cost than Twilio (~₹0.15-0.30 per SMS)
- ✅ Better delivery rates in India
- ✅ Easy setup and approval
- ✅ Good documentation

### Setup Steps:

1. **Sign Up**
   - Go to https://msg91.com/
   - Create account
   - Complete KYC (required for production)

2. **Get Credentials**
   - Go to Dashboard → API → Auth Key
   - Copy your **Auth Key**
   - Go to Settings → Sender ID
   - Create/Get your **Sender ID** (6 characters, e.g., "TRACTR")

3. **Create OTP Template** (Required)
   - Go to Templates → Create Template
   - Template Type: **OTP**
   - Message: `Your Tractor Auction OTP is {{otp}}. Valid for 10 minutes. Do not share this OTP with anyone.`
   - Get **Template ID** after approval

4. **Add to `.env`**:
   ```env
   MSG91_AUTH_KEY="your_auth_key_here"
   MSG91_SENDER_ID="TRACTR"
   MSG91_TEMPLATE_ID="your_template_id_here"
   ```

### Pricing:
- **Trial**: Free credits for testing
- **Production**: ~₹0.15-0.30 per SMS
- **Bulk**: Even cheaper for high volume

---

## Option 2: TextLocal (Easy Setup for India)

### Why TextLocal?
- ✅ Very easy setup
- ✅ Good for small to medium volume
- ✅ Lower cost (~₹0.20-0.40 per SMS)
- ✅ Quick approval process

### Setup Steps:

1. **Sign Up**
   - Go to https://www.textlocal.in/
   - Create account
   - Verify email and phone

2. **Get API Key**
   - Go to Dashboard → API → API Key
   - Generate API Key
   - Copy the key

3. **Get Sender ID**
   - Go to Settings → Sender ID
   - Create Sender ID (6 characters)
   - Wait for approval (usually instant)

4. **Add to `.env`**:
   ```env
   TEXTLOCAL_API_KEY="your_api_key_here"
   TEXTLOCAL_SENDER_ID="TRACTR"
   ```

### Pricing:
- **Trial**: Free credits
- **Production**: ~₹0.20-0.40 per SMS
- **Pay-as-you-go**: No monthly fees

---

## Option 3: Keep Using Twilio

If you want to continue with Twilio:

1. **Fix Common Issues**:
   - Verify phone numbers in Twilio Console (trial accounts)
   - Check account balance
   - Verify credentials in `.env`

2. **Check Twilio Logs**:
   - Go to Twilio Console → Monitor → Logs → Messaging
   - Check for error codes and messages

3. **Common Twilio Errors**:
   - **21608**: Unverified number (add to verified list)
   - **21211**: Invalid phone number format
   - **21408**: Permission denied

---

## Option 4: Console Mode (Development)

For development/testing without SMS:

1. **Don't add any SMS provider credentials**
2. **OTP will be logged to console**
3. **Use dummy OTP**: `999999` for testing

---

## How the System Works

### Automatic Provider Selection:
1. System checks which providers are configured
2. Uses provider in this order:
   - Twilio (if configured)
   - MSG91 (if configured)
   - TextLocal (if configured)
   - Console (if none configured)

### Automatic Fallback:
- If primary provider fails, automatically tries others
- Ensures OTP delivery even if one provider has issues

### Example Flow:
```
1. Try Twilio → Fails
2. Try MSG91 → Success ✅
3. OTP delivered!
```

---

## Quick Comparison

| Provider | Cost/SMS | Setup Time | India Delivery | Best For |
|----------|----------|------------|----------------|----------|
| **MSG91** | ₹0.15-0.30 | 1-2 days | ⭐⭐⭐⭐⭐ | India-focused apps |
| **TextLocal** | ₹0.20-0.40 | Few hours | ⭐⭐⭐⭐ | Quick setup |
| **Twilio** | ₹0.50-1.00 | 1 day | ⭐⭐⭐ | Global apps |

---

## Recommended Setup for India

**For Production**: Use **MSG91**
- Best cost-effectiveness
- Best delivery rates in India
- Good support

**For Quick Testing**: Use **TextLocal**
- Fastest setup
- Easy approval
- Good for development

**For Global**: Use **Twilio**
- Works worldwide
- More expensive
- Better for international users

---

## Environment Variables

### For MSG91:
```env
MSG91_AUTH_KEY="your_auth_key"
MSG91_SENDER_ID="TRACTR"
MSG91_TEMPLATE_ID="your_template_id"
```

### For TextLocal:
```env
TEXTLOCAL_API_KEY="your_api_key"
TEXTLOCAL_SENDER_ID="TRACTR"
```

### For Twilio:
```env
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="xxxxx"
TWILIO_PHONE_NUMBER="+91xxxxx"
```

---

## Testing

After setting up any provider:

1. **Test Registration**:
   - Register with your phone number
   - Check if OTP is received

2. **Test Login**:
   - Login with phone number
   - Check if OTP is received

3. **Check Server Logs**:
   - Look for `✅ [Provider] OTP sent to...`
   - If you see `❌`, check error message

---

## Support Links

- **MSG91**: https://msg91.com/ | Support: support@msg91.com
- **TextLocal**: https://www.textlocal.in/ | Support: support@textlocal.in
- **Twilio**: https://www.twilio.com/ | Support: support@twilio.com

---

**Recommendation**: For India, use **MSG91** - it's the most cost-effective and reliable option.





























