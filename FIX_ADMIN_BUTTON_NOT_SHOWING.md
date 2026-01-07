# Fix Admin Button Not Showing

## Problem
User role is already set to `ADMIN` in database, but admin button is not showing in the header.

## Root Cause
The JWT token was created **before** the role was changed to ADMIN. The token contains the old role information.

## Solution

### Step 1: Logout and Login Again

**This is the most important step!**

1. **Logout** from the application
   - Click "Sign Out" button
   - Or clear localStorage manually (F12 → Application → Local Storage → Clear)

2. **Login again** with admin phone number:
   - Phone: **9515131723**
   - OTP: **999999** (test mode)

3. **Check browser console** (F12 → Console tab)
   - You should see: `User data from API: {role: "ADMIN", ...}`
   - You should see: `Setting user role to: ADMIN`

4. **Admin button should now appear!**

### Step 2: Verify in Browser Console

Open browser DevTools (F12) and check:

1. **Console Tab:**
   - Look for: `User data from API:`
   - Check if `role: "ADMIN"` is present

2. **Network Tab:**
   - Filter: `/api/user/me`
   - Click on the request
   - Check **Response** tab
   - Should show: `"role": "ADMIN"`

### Step 3: If Still Not Working

**Clear everything and try again:**

1. **Clear Browser Cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Clear data

2. **Clear LocalStorage:**
   - F12 → Application tab → Local Storage
   - Right-click → Clear
   - Refresh page

3. **Login again:**
   - Phone: **9515131723**
   - OTP: **999999**

### Step 4: Manual Role Check

If you want to verify the role is being fetched:

1. Open browser console (F12)
2. Type:
   ```javascript
   fetch('/api/user/me', {
     headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
   }).then(r => r.json()).then(console.log)
   ```
3. Check the output - `role` should be `"ADMIN"`

## Why This Happens

JWT tokens contain user information **at the time of login**. If you:
1. Login as regular user
2. Change role to ADMIN in database
3. Token still has old role

**Solution:** Logout and login again to get a new token with updated role.

## Debug Mode

In development mode, you'll see the current role displayed next to the buttons:
- Look for: `Role: ADMIN` (small gray text)

This helps verify the role is being fetched correctly.

## Quick Test

1. ✅ Role in database: **ADMIN** (already done)
2. ✅ Logout from app
3. ✅ Login with **9515131723** / **999999**
4. ✅ Check console for role logs
5. ✅ Admin button should appear!

## Still Not Working?

If the admin button still doesn't show after logout/login:

1. **Check browser console for errors**
2. **Verify API response** (Network tab → `/api/user/me`)
3. **Check if role is exactly "ADMIN"** (case-sensitive in enum, but we check both cases)
4. **Try in incognito/private window** to rule out cache issues





























