# Fix: 500 Error - Profile Photo Field

## 🔴 Problem
You're getting a 500 error when accessing `/api/user/me` and `/admin/reports` because the code is trying to use the `profilePhoto` field, but the database column doesn't exist yet.

## ✅ Solution

I've temporarily commented out the `profilePhoto` fields in all API routes. Now you have two options:

### Option 1: Run Database Migration First (Recommended)

1. **Run the database migration:**
   ```bash
   # Using Prisma
   npx prisma db push
   npx prisma generate
   
   # OR using SQL directly
   # Connect to your database and run:
   ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
   ```

2. **After migration, uncomment these lines:**
   - `app/api/user/me/route.ts` - Line 42
   - `app/api/user/update/route.ts` - Line 93
   - `app/api/user/profile/photo/route.ts` - Lines 83, 88, 134, 138

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

### Option 2: Keep It Commented (Temporary)

If you don't need profile photos right now, you can keep the fields commented out. The app will work, but profile photo features won't be available.

---

## 📝 Files Modified (Temporarily)

I've commented out `profilePhoto` in these files:

1. ✅ `app/api/user/me/route.ts` - Line 42
2. ✅ `app/api/user/update/route.ts` - Line 93  
3. ✅ `app/api/user/profile/photo/route.ts` - Lines 83, 88, 134, 138

---

## 🧪 Test After Migration

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the API:**
   - Go to `/admin/reports` - should work now
   - Go to `/my-account` - should work now
   - Try uploading a profile photo (after uncommenting)

---

## ⚠️ Important

**The app should work now**, but profile photo features will be disabled until you:
1. Run the database migration
2. Uncomment the `profilePhoto` fields in the API routes

---

## 🔄 Quick Uncomment Guide

After running the migration, search for `// profilePhoto` in these files and remove the `//`:

- `app/api/user/me/route.ts`
- `app/api/user/update/route.ts`
- `app/api/user/profile/photo/route.ts`

Or use the detailed guide in `STEP_BY_STEP_UNCOMMENT_PROFILE_PHOTO.md`

---

**The 500 error should be fixed now!** Try accessing `/admin/reports` again. 🎉


























