# Razorpay Payment Gateway Integration Guide

## Overview
This guide will help you set up Razorpay payment gateway for membership purchases in the Tractor Auction website.

## Prerequisites
1. A Razorpay account (Sign up at https://razorpay.com/)
2. Access to Razorpay Dashboard (https://dashboard.razorpay.com/)

## Step 1: Create Razorpay Account

1. Go to https://razorpay.com/
2. Click "Sign Up" and create an account
3. Complete the KYC verification process (required for live payments)
4. For testing, you can use test mode without KYC

## Step 2: Get API Keys

### For Development (Test Mode):
1. Log in to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Under **Test Mode**, click **Generate Test Key**
4. Copy the **Key ID** and **Key Secret**
5. These keys start with `rzp_test_` for Key ID

### For Production (Live Mode):
1. Complete KYC verification
2. Go to **Settings** → **API Keys**
3. Under **Live Mode**, click **Generate Live Key**
4. Copy the **Key ID** and **Key Secret**
5. These keys start with `rzp_live_` for Key ID

⚠️ **IMPORTANT**: Never share your Key Secret publicly. Keep it secure in your `.env` file.

## Step 3: Configure Environment Variables

1. Open your `.env` file in the project root
2. Add the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

3. Replace the values with your actual Razorpay keys
4. For production, update `NEXT_PUBLIC_BASE_URL` to your production URL

## Step 4: Test the Integration

### Test Mode (Development):
1. Set `TEST_MODE=true` in `.env` to bypass Razorpay (for quick testing)
2. Or use Razorpay test keys and test cards

### Test Cards (Razorpay Test Mode):
- **Card Number**: `4111 1111 1111 1111`
- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name

### Test UPI IDs:
- `success@razorpay`
- `failure@razorpay`

## Step 5: Verify Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/membership` page
3. Click "Subscribe Now" on any paid plan
4. You should see Razorpay checkout popup
5. Use test card details to complete payment
6. After successful payment, membership should be activated

## How It Works

### Payment Flow:
1. **User clicks "Subscribe Now"**
   - Frontend calls `/api/membership/purchase`
   - Backend creates Razorpay order
   - Returns order details to frontend

2. **Razorpay Checkout**
   - Frontend opens Razorpay checkout modal
   - User enters payment details
   - Razorpay processes payment

3. **Payment Success**
   - Razorpay calls `handler` function with payment details
   - Frontend sends payment details to `/api/membership/payment-callback`
   - Backend verifies Razorpay signature (security check)
   - Backend verifies payment status
   - Backend creates/activates membership
   - User is redirected to My Account page

### Security Features:
- ✅ **Signature Verification**: All payments are verified using Razorpay signatures
- ✅ **Payment Status Check**: Verifies payment is actually captured
- ✅ **Duplicate Prevention**: Prevents creating multiple memberships for same payment
- ✅ **Server-side Validation**: All critical operations happen on server

## Troubleshooting

### Issue: "Payment gateway is loading"
**Solution**: Wait a few seconds and try again. The Razorpay script loads asynchronously.

### Issue: "Invalid payment signature"
**Solution**: 
- Check that `RAZORPAY_KEY_SECRET` is correct
- Ensure you're using the same key (test/live) for both order creation and verification
- Check that payment details are not modified between order creation and callback

### Issue: "Payment not captured"
**Solution**:
- Check Razorpay dashboard for payment status
- Verify payment was actually successful
- Check network connectivity

### Issue: Test mode not working
**Solution**:
- Ensure `TEST_MODE=true` is set in `.env` for bypass mode
- Or use Razorpay test keys and test cards
- Check browser console for errors

### Issue: Razorpay popup not opening
**Solution**:
- Check browser popup blocker settings
- Ensure Razorpay script is loaded (check Network tab)
- Check browser console for JavaScript errors

## Production Checklist

Before going live:

- [ ] Complete Razorpay KYC verification
- [ ] Switch to Live API keys
- [ ] Update `NEXT_PUBLIC_BASE_URL` to production URL
- [ ] Remove `TEST_MODE=true` from `.env`
- [ ] Test with real payment (small amount)
- [ ] Set up webhook for payment status updates (optional)
- [ ] Configure payment success/failure pages
- [ ] Set up email notifications for payments
- [ ] Test refund process (if applicable)

## Webhook Setup (Recommended for Production)

Webhooks allow Razorpay to notify your application about payment status changes in real-time. This is more reliable than relying only on frontend callbacks.

### Step 1: Configure Webhook in Razorpay Dashboard

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Click **Add New Webhook**
3. Enter webhook URL: `https://yourdomain.com/api/membership/webhook`
4. Select events:
   - `payment.captured` - Payment successfully captured
   - `payment.failed` - Payment failed
   - `order.paid` - Order fully paid
5. Click **Create Webhook**
6. **Copy the Webhook Secret** (shown after creation)
7. Add to your `.env` file:
   ```env
   RAZORPAY_WEBHOOK_SECRET="your_webhook_secret_here"
   ```

### Step 2: Verify Webhook Handler

The webhook handler is already implemented at `/api/membership/webhook/route.ts`. It:
- ✅ Verifies webhook signatures for security
- ✅ Handles payment.captured events
- ✅ Handles payment.failed events
- ✅ Handles order.paid events
- ✅ Updates membership, registration, EMD, and purchase payments automatically

### Step 3: Test Webhook

1. Use Razorpay's webhook testing tool in the dashboard
2. Or make a test payment and check server logs
3. Verify that payments are processed correctly

### Webhook Events Handled

- **payment.captured**: Automatically activates memberships, updates payment status
- **payment.failed**: Logs failure for monitoring
- **order.paid**: Handles fully paid orders

### Security

- ✅ Webhook signatures are verified using HMAC SHA-256
- ✅ Only requests with valid signatures are processed
- ✅ Webhook secret stored securely in environment variables

## Support

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay Support**: support@razorpay.com
- **Razorpay Dashboard**: https://dashboard.razorpay.com/

## Files Modified

- `lib/razorpay.ts` - Razorpay utility functions
- `app/api/membership/purchase/route.ts` - Order creation
- `app/api/membership/payment-callback/route.ts` - Payment verification
- `app/membership/page.tsx` - Frontend checkout integration

## Test Mode vs Production Mode

### Test Mode (Development):
- Uses test API keys (`rzp_test_...`)
- Test cards work
- No real money is charged
- Can bypass with `TEST_MODE=true`

### Production Mode:
- Uses live API keys (`rzp_live_...`)
- Real payments are processed
- Requires KYC verification
- Signature verification is mandatory

---

**Last Updated**: After Razorpay integration implementation
**Status**: ✅ Ready for testing















