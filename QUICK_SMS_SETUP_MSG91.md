# Quick Setup: MSG91 for SMS OTP (Recommended for India)

## Why MSG91?
- ✅ **Lower Cost**: ~₹0.15-0.30 per SMS (vs ₹0.50-1.00 for Twilio)
- ✅ **Better Delivery**: Optimized for Indian networks
- ✅ **Easy Setup**: Simple API, quick approval
- ✅ **Reliable**: Used by many Indian startups

## Quick Setup (5 minutes)

### Step 1: Sign Up
1. Go to https://msg91.com/
2. Click "Sign Up" or "Get Started"
3. Enter your details and verify email

### Step 2: Get Credentials
1. **Login** to MSG91 Dashboard
2. Go to **API** → **Auth Key**
3. Copy your **Auth Key** (starts with numbers/letters)

### Step 3: Create Sender ID
1. Go to **Settings** → **Sender ID**
2. Click **Add Sender ID**
3. Enter: `TRACTR` (or any 6 characters)
4. Submit and wait for approval (usually instant)

### Step 4: Add to `.env`
```env
MSG91_AUTH_KEY="your_auth_key_here"
MSG91_SENDER_ID="TRACTR"
```

### Step 5: Test
1. Restart your dev server: `npm run dev`
2. Try registration/login
3. Check if OTP is received

## That's It! 🎉

The system will automatically use MSG91 if configured.

## Troubleshooting

### OTP not received?
1. **Check Auth Key**: Make sure it's correct
2. **Check Sender ID**: Must be approved (check dashboard)
3. **Check Balance**: Add credits if needed
4. **Check Logs**: Server console will show errors

### Common Issues:
- **"Invalid Auth Key"**: Check your auth key in dashboard
- **"Sender ID not approved"**: Wait for approval or use different ID
- **"Insufficient balance"**: Add credits to your account

## Pricing
- **Trial**: Free credits for testing
- **Production**: ~₹0.15-0.30 per SMS
- **Bulk**: Even cheaper for high volume

## Support
- **Website**: https://msg91.com/
- **Support**: support@msg91.com
- **Docs**: https://docs.msg91.com/

---

**Recommendation**: Use MSG91 for India - it's the best option!





























