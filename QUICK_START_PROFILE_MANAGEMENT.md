# Quick Start: User Profile Management

## 🚀 Setup Steps

### Step 1: Database Migration

Add profile photo field to User table:

```bash
# Option 1: Using SQL directly
psql -d your_database -f ADD_PROFILE_PHOTO_FIELD.sql

# Option 2: Using Prisma (recommended)
# First, update prisma/schema.prisma to add:
# profilePhoto String?
# Then run:
npx prisma db push
npx prisma generate
```

### Step 2: Uncomment Profile Photo Code

After migration, uncomment these lines:

**In `app/api/user/profile/photo/route.ts`**:
- Line with `// profilePhoto: photoUrl,` → Remove `//`
- Line with `// profilePhoto: true,` → Remove `//`

**In `app/api/user/update/route.ts`**:
- Line with `// profilePhoto: true,` → Remove `//`

**In `app/api/user/me/route.ts`**:
- Line with `// profilePhoto: true,` → Remove `//`

### Step 3: Test Features

1. **Profile Photo**:
   - Go to My Account → Profile Photo section
   - Click "Upload Photo"
   - Select an image (JPG, PNG, or WebP, max 5MB)
   - Photo should appear

2. **Change Password**:
   - Go to My Account → Security Settings
   - Click "Change Password"
   - Enter current password
   - Enter new password (min 6 characters)
   - Confirm new password
   - Click "Change Password"

3. **Change Phone Number**:
   - Go to My Account → Security Settings
   - Click "Change Phone"
   - Enter new phone number
   - Click "Send OTP"
   - Enter OTP received
   - Click "Verify & Update"

4. **Update Profile Details**:
   - Go to My Account → Personal Details
   - Click "Edit"
   - Update any field
   - Click "Save Changes"

## ✅ Features Available

- ✅ Upload/Change/Delete Profile Photo
- ✅ Change Password (with verification)
- ✅ Change Phone Number (with OTP)
- ✅ Update Personal Details
- ✅ Email Management
- ✅ Notification Preferences

## 📝 Notes

- Profile photo requires database migration first
- Password change requires current password
- Phone change requires OTP verification
- All changes require authentication

---

**That's it!** Your profile management is ready to use. 🎉


























