# How to Enable UPI in Razorpay Dashboard

## Issue
UPI option is not showing in Razorpay checkout popup, and cards are failing with "International cards are not supported" error.

## Solution

### Step 1: Enable UPI in Razorpay Dashboard

1. **Login to Razorpay Dashboard**
   - Go to https://dashboard.razorpay.com/
   - Login with your account credentials

2. **Navigate to Settings**
   - Click on **Settings** in the left sidebar
   - Select **Payment Methods**

3. **Enable UPI**
   - Find **UPI** in the list of payment methods
   - Toggle it **ON** (enable it)
   - Click **Save**

4. **Enable Other Payment Methods** (Optional but recommended)
   - Enable **Cards** (if not already enabled)
   - Enable **Netbanking** (if needed)
   - Enable **Wallets** (if needed)

5. **Check Payment Method Restrictions**
   - In **Settings** → **Payment Methods**
   - Look for any restrictions or filters
   - Ensure no payment methods are blocked

### Step 2: Verify Test Mode Settings

1. **Check Test Mode**
   - Ensure you're in **Test Mode** (not Live Mode)
   - Test Mode toggle should be ON (top right of dashboard)

2. **Verify API Keys**
   - Go to **Settings** → **API Keys**
   - Ensure you're using **Test Keys** (keys starting with `rzp_test_`)
   - Copy the Key ID and Key Secret to your `.env` file

### Step 3: Test UPI Payment

After enabling UPI in dashboard:

1. **Use Test UPI ID**
   - In Razorpay popup, select **UPI**
   - Enter UPI ID: `success@razorpay`
   - Click **Pay**
   - Payment should succeed

2. **Alternative Test UPI IDs**
   - `success@razorpay` - Always succeeds
   - `failure@razorpay` - Always fails (for testing error handling)

### Step 4: If UPI Still Not Showing

If UPI option still doesn't appear after enabling in dashboard:

1. **Check Account Status**
   - Ensure your Razorpay account is fully activated
   - Complete KYC if required (for live mode)

2. **Check Payment Method Configuration**
   - Go to **Settings** → **Payment Methods**
   - Ensure UPI is enabled for both **Test** and **Live** modes
   - Check if there are any account-level restrictions

3. **Contact Razorpay Support**
   - Email: support@razorpay.com
   - They can help enable UPI for your account

### Step 5: Alternative - Use Test Mode Bypass

If you can't enable UPI right now, you can use test mode bypass:

1. **Set in `.env` file:**
   ```env
   TEST_MODE=true
   ```

2. **This will:**
   - Skip Razorpay payment
   - Directly activate membership
   - Useful for development/testing

## Code Changes Made

I've updated the Razorpay checkout options to explicitly enable UPI and other payment methods:

```javascript
method: {
  upi: true,
  card: true,
  netbanking: true,
  wallet: true,
},
config: {
  display: {
    blocks: {
      banks: {
        name: "All payment methods",
        instruments: [
          { method: "upi" },
          { method: "card" },
          { method: "netbanking" },
          { method: "wallet" },
        ],
      },
    },
  },
}
```

## Testing Checklist

- [ ] UPI enabled in Razorpay dashboard
- [ ] Test mode is active
- [ ] Using test API keys (`rzp_test_...`)
- [ ] UPI option appears in checkout popup
- [ ] Test UPI ID `success@razorpay` works
- [ ] Payment completes successfully

## Troubleshooting

### UPI Not Showing
- **Check**: Dashboard → Settings → Payment Methods → UPI is enabled
- **Check**: You're using test keys, not live keys
- **Check**: Account is activated

### Cards Failing
- **Issue**: "International cards are not supported"
- **Solution**: Use Indian test cards (provided earlier) or enable UPI
- **Alternative**: Use test mode bypass (`TEST_MODE=true`)

### Payment Methods Not Appearing
- **Check**: Razorpay script is loaded correctly
- **Check**: Browser console for errors
- **Check**: Payment methods enabled in dashboard

## Support

- **Razorpay Support**: support@razorpay.com
- **Razorpay Docs**: https://razorpay.com/docs/
- **Dashboard**: https://dashboard.razorpay.com/

---

**Last Updated**: After UPI enablement fix
**Status**: Ready for testing after dashboard configuration





























