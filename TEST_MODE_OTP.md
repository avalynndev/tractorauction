# Test Mode: Dummy OTP Setup

## ✅ Changes Made

I've updated the application to support a dummy OTP `999999` for testing purposes.

### What Was Changed:

1. **OTP Verification** (`app/api/auth/verify-otp/route.ts`)
   - Now accepts `999999` as a valid OTP
   - Skips expiry check for dummy OTP
   - Works for both registration and login

2. **Registration** (`app/api/auth/register/route.ts`)
   - In development mode, automatically sets OTP to `999999`
   - Logs a helpful message in console

3. **Login** (`app/api/auth/login/route.ts`)
   - In development mode, automatically sets OTP to `999999`
   - Logs a helpful message in console

4. **Resend OTP** (`app/api/auth/resend-otp/route.ts`)
   - In development mode, resends `999999` as OTP

5. **OTP Verification Page** (`app/verify-otp/page.tsx`)
   - Shows a helpful hint in development mode
   - Displays: "Test Mode: Use 999999 as OTP for testing"

---

## 🧪 How to Use

### For Registration:
1. Fill the registration form
2. Submit the form
3. On OTP verification page, enter: `999999`
4. Click "Verify OTP"
5. ✅ You'll be logged in!

### For Login:
1. Enter your phone number on login page
2. Click "Send OTP"
3. On OTP verification page, enter: `999999`
4. Click "Verify OTP"
5. ✅ You'll be logged in!

---

## 🔧 How It Works

### Automatic Test Mode Detection:
- **Development Mode:** Automatically enabled when `NODE_ENV === "development"`
- **Production Mode:** Disabled (uses real OTP generation)

### Manual Test Mode:
You can also enable test mode manually by adding to `.env`:
```env
TEST_MODE=true
```

---

## 📝 Console Messages

When in test mode, you'll see in the console:
```
[TEST MODE] OTP for 9876543210: 999999 (Use 999999 to verify)
```

---

## 🚀 Testing Flow

### Registration Flow:
1. Visit: http://localhost:3000/register
2. Fill all fields
3. Submit → Redirected to OTP page
4. Enter: `999999`
5. Verify → Logged in and redirected to My Account

### Login Flow:
1. Visit: http://localhost:3000/login
2. Enter phone number
3. Click "Send OTP" → Redirected to OTP page
4. Enter: `999999`
5. Verify → Logged in and redirected to My Account

---

## ⚠️ Important Notes

1. **Development Only:** This feature is automatically enabled in development mode
2. **Production:** In production, real OTPs will be generated and sent via SMS
3. **Security:** Never use dummy OTP in production environment
4. **OTP Display:** The hint on OTP page only shows in development mode

---

## 🔄 Disable Test Mode

To disable test mode and use real OTPs:

1. **Set environment to production:**
   ```env
   NODE_ENV=production
   ```

2. **Or remove TEST_MODE from .env:**
   ```env
   # Remove or set to false
   TEST_MODE=false
   ```

---

## ✅ Verification

After making these changes:

1. **Restart your development server:**
   ```bash
   # Stop current server (Ctrl + C)
   npm run dev
   ```

2. **Test registration:**
   - Register a new user
   - Use `999999` as OTP
   - Should work!

3. **Test login:**
   - Login with existing user
   - Use `999999` as OTP
   - Should work!

---

## 📋 Summary

- ✅ Dummy OTP `999999` works for all OTP verification
- ✅ Automatically enabled in development mode
- ✅ Helpful hint shown on OTP page
- ✅ Console logs show test mode status
- ✅ No SMS required for testing

**You can now test registration and login without needing real OTP!** 🎉





























