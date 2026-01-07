# Twilio SMS OTP Integration Guide

## Overview
This guide will help you set up Twilio SMS service for sending OTP codes to users during registration and login.

## Prerequisites
1. A Twilio account (Sign up at https://www.twilio.com/try-twilio)
2. A verified phone number (for testing) or a Twilio phone number (for production)

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Complete the account setup

## Step 2: Get Twilio Credentials

### Get Account SID and Auth Token

1. Log in to Twilio Console: https://console.twilio.com/
2. Go to **Account** → **Account Info** (or click on your account name in top right)
3. You'll see:
   - **Account SID**: Starts with `AC` (e.g., `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - **Auth Token**: Click "View" to reveal (keep this secret!)

4. Copy both values - you'll need them for `.env` file

### Get Twilio Phone Number

1. Go to **Phone Numbers** → **Manage** → **Buy a number**
   - For testing, you can use a free trial number
   - For production, you'll need to purchase a number

2. Select:
   - **Country**: India (for Indian phone numbers)
   - **Capabilities**: Check "SMS"
   - Click **Search**

3. Choose a number and click **Buy**
   - Trial accounts get a free number for testing
   - Production accounts need to purchase

4. Copy the phone number (with country code, e.g., `+91XXXXXXXXXX`)

## Step 3: Verify Phone Numbers (For Testing)

### For Trial Account:
1. Go to **Phone Numbers** → **Manage** → **Verified Caller IDs**
2. Click **Add a new Caller ID**
3. Enter your phone number (where you want to receive OTPs for testing)
4. Verify via call or SMS
5. Only verified numbers can receive SMS in trial mode

### Important Notes:
- **Trial accounts** can only send SMS to verified phone numbers
- **Production accounts** can send to any number
- To upgrade to production, add funds to your account

## Step 4: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add the following variables:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_PHONE_NUMBER="+91XXXXXXXXXX"
```

3. Replace the values with your actual Twilio credentials
4. **Important**: Never commit `.env` file to git (it's already in `.gitignore`)

## Step 5: Test the Integration

### Test Registration:
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to registration page
3. Enter your verified phone number
4. Submit registration
5. You should receive OTP via SMS

### Test Login:
1. Go to login page
2. Enter your phone number
3. Click "Send OTP"
4. You should receive OTP via SMS

## Step 6: Verify SMS Delivery

### Check Twilio Console:
1. Go to **Monitor** → **Logs** → **Messaging**
2. You'll see all SMS sent/received
3. Check delivery status:
   - ✅ **Delivered**: SMS sent successfully
   - ❌ **Failed**: Check error message

### Common Issues:
- **"The number is unverified"**: Add number to verified list (trial accounts only)
- **"Insufficient balance"**: Add funds to your Twilio account
- **"Invalid phone number"**: Check number format (should be +91XXXXXXXXXX)

## How It Works

### Registration Flow:
1. User enters phone number and details
2. System generates 6-digit OTP
3. OTP sent via Twilio SMS
4. User receives OTP on phone
5. User enters OTP to verify

### Login Flow:
1. User enters phone number
2. System generates new OTP
3. OTP sent via Twilio SMS
4. User receives OTP on phone
5. User enters OTP to login

### Resend OTP Flow:
1. User clicks "Resend OTP"
2. System generates new OTP
3. OTP sent via Twilio SMS
4. Previous OTP becomes invalid

## Phone Number Format

The system automatically formats Indian phone numbers:
- **Input**: `9876543210` (10 digits)
- **Formatted**: `+919876543210` (with country code)

For other countries, ensure phone number includes country code:
- **Format**: `+[country code][phone number]`
- **Example**: `+919876543210` (India), `+1234567890` (USA)

## Test Mode vs Production Mode

### Test Mode (`TEST_MODE=true`):
- Uses dummy OTP: `999999`
- No SMS sent (saves Twilio credits)
- Useful for development/testing
- OTP logged to console

### Production Mode (Twilio configured):
- Real OTP generated (6 digits)
- SMS sent via Twilio
- OTP valid for 10 minutes
- Secure and production-ready

## Cost Considerations

### Twilio Pricing (India):
- **SMS to India**: ~₹0.50 - ₹1.00 per SMS
- **Free Trial**: $15.50 credit (enough for ~100-200 SMS)
- **Pay-as-you-go**: No monthly fees, only pay for what you use

### Cost Optimization:
- Use test mode during development
- Verify numbers for testing (free in trial)
- Monitor usage in Twilio dashboard
- Set up usage alerts

## Troubleshooting

### Issue: SMS not received
**Solutions**:
1. Check phone number is verified (trial accounts)
2. Check Twilio account balance
3. Check phone number format
4. Check Twilio logs for errors
5. Verify Twilio credentials in `.env`

### Issue: "Twilio is not configured"
**Solutions**:
1. Check `.env` file has all three variables
2. Restart development server after adding `.env` variables
3. Verify no typos in variable names
4. Check values are not empty

### Issue: "Invalid phone number format"
**Solutions**:
1. Ensure phone number is 10 digits (for India)
2. System auto-adds +91 for Indian numbers
3. For other countries, include country code manually

### Issue: SMS delivery failed
**Solutions**:
1. Check Twilio account balance
2. Check phone number is valid
3. Check Twilio logs for specific error
4. Verify phone number is not blocked

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Rotate Auth Token** periodically
3. **Monitor SMS usage** for unusual activity
4. **Set up usage alerts** in Twilio dashboard
5. **Use environment variables** - Never hardcode credentials

## Production Checklist

Before going live:

- [ ] Twilio account upgraded (if needed)
- [ ] Production phone number purchased
- [ ] All environment variables set
- [ ] Test SMS delivery to real numbers
- [ ] Monitor SMS costs
- [ ] Set up usage alerts
- [ ] Test OTP expiry (10 minutes)
- [ ] Test resend OTP functionality
- [ ] Verify error handling

## Support

- **Twilio Documentation**: https://www.twilio.com/docs
- **Twilio Support**: https://support.twilio.com/
- **Twilio Console**: https://console.twilio.com/
- **Twilio Status**: https://status.twilio.com/

## Files Modified

- `lib/twilio.ts` - Twilio utility functions
- `app/api/auth/register/route.ts` - Registration OTP sending
- `app/api/auth/login/route.ts` - Login OTP sending
- `app/api/auth/resend-otp/route.ts` - Resend OTP sending
- `ENV_FILE_EXAMPLE.txt` - Environment variables documentation

## Testing Checklist

- [x] Install Twilio SDK
- [x] Create Twilio utility functions
- [x] Integrate with registration API
- [x] Integrate with login API
- [x] Integrate with resend OTP API
- [x] Add environment variables
- [x] Create setup guide
- [ ] Test SMS delivery (after Twilio setup)
- [ ] Test OTP verification
- [ ] Test resend OTP
- [ ] Test error handling

---

**Last Updated**: After Twilio integration implementation
**Status**: ✅ Ready for Testing (after Twilio account setup)





























