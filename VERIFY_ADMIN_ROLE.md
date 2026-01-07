# Verify Admin Role - Quick Guide

## Problem
Admin button is not showing even though you're logged in with admin account (9515131723).

## Solution Steps

### Step 1: Verify User Role in Database

**Option A: Using Prisma Studio (Easiest)**

1. Open Prisma Studio:
   ```powershell
   npx prisma studio
   ```

2. Navigate to **User** table
3. Find user with phone number: **9515131723**
4. Check the **role** field - it should be **ADMIN**
5. If it's not ADMIN:
   - Click on the user row
   - Change **role** dropdown to **ADMIN**
   - Click **Save 1 change**

**Option B: Using pgAdmin**

1. Open pgAdmin
2. Connect to your database
3. Navigate to: `tractorauction` → `Schemas` → `public` → `Tables` → `User`
4. Right-click → **View/Edit Data** → **All Rows**
5. Find row with `phoneNumber = '9515131723'`
6. Check `role` column - should be `ADMIN`
7. If not, double-click the cell and change to `ADMIN`
8. Press Enter to save

**Option C: Using SQL Query**

```sql
-- Check current role
SELECT id, "fullName", "phoneNumber", role 
FROM "User" 
WHERE "phoneNumber" = '9515131723';

-- Update role to ADMIN
UPDATE "User" 
SET role = 'ADMIN' 
WHERE "phoneNumber" = '9515131723';
```

### Step 2: Refresh the Page

After updating the role:
1. **Logout** from the application
2. **Login again** with phone number: 9515131723
3. Use OTP: **999999** (test mode)
4. The Admin button should now appear in the header

### Step 3: Verify Admin Button Appears

The Admin button should appear:
- **Desktop**: Purple "Admin" button next to "My Account" and "Sign Out"
- **Mobile**: Purple "Admin" button in the mobile menu

## Troubleshooting

### Still Not Showing?

1. **Clear browser cache and localStorage:**
   - Open browser DevTools (F12)
   - Go to **Application** tab → **Local Storage**
   - Delete all items
   - Refresh page and login again

2. **Check browser console for errors:**
   - Open DevTools (F12)
   - Go to **Console** tab
   - Look for any errors related to `/api/user/me`

3. **Verify API returns correct role:**
   - Open DevTools → **Network** tab
   - Login and check the `/api/user/me` request
   - Response should show: `"role": "ADMIN"`

4. **Check if user exists:**
   ```sql
   SELECT * FROM "User" WHERE "phoneNumber" = '9515131723';
   ```

## Quick Fix Script

If you want to quickly set a user as admin, run this in Prisma Studio or pgAdmin:

```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE "phoneNumber" = '9515131723';
```

Then logout and login again!

## Expected Result

✅ Admin button appears in header (purple button)
✅ Clicking Admin button goes to `/admin` page
✅ Admin page shows pending vehicles for approval





























