# Step-by-Step Guide: Uncomment Profile Photo Code

## ⚠️ Important: Do This AFTER Running Database Migration

**First, make sure you've run the database migration:**
```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profilePhoto" TEXT;
```

And updated `prisma/schema.prisma` to include `profilePhoto String?` in the User model.

---

## 📝 Step-by-Step Instructions

### File 1: `app/api/user/profile/photo/route.ts`

#### Step 1.1: Uncomment Line 84 (Upload Photo)
1. Open the file: `app/api/user/profile/photo/route.ts`
2. Find **line 84** (look for `// profilePhoto: photoUrl,`)
3. You'll see:
   ```typescript
   data: {
     // profilePhoto: photoUrl, // Uncomment after adding field to schema
   },
   ```
4. **Change it to:**
   ```typescript
   data: {
     profilePhoto: photoUrl,
   },
   ```
   (Remove the `//` at the beginning of the line)

#### Step 1.2: Uncomment Line 89 (Select Profile Photo - Upload)
1. Still in the same file, find **line 89** (look for `// profilePhoto: true,`)
2. You'll see:
   ```typescript
   select: {
     id: true,
     fullName: true,
     // profilePhoto: true, // Uncomment after adding field to schema
   },
   ```
3. **Change it to:**
   ```typescript
   select: {
     id: true,
     fullName: true,
     profilePhoto: true,
   },
   ```
   (Remove the `//` at the beginning of the line)

#### Step 1.3: Uncomment Line 134 (Delete Photo)
1. Still in the same file, scroll down to **line 134** (in the DELETE function)
2. You'll see:
   ```typescript
   data: {
     // profilePhoto: null, // Uncomment after adding field to schema
   },
   ```
3. **Change it to:**
   ```typescript
   data: {
     profilePhoto: null,
   },
   ```
   (Remove the `//` at the beginning of the line)

#### Step 1.4: Uncomment Line 138 (Select Profile Photo - Delete)
1. Still in the same file, find **line 138**
2. You'll see:
   ```typescript
   select: {
     id: true,
     // profilePhoto: true, // Uncomment after adding field to schema
   },
   ```
3. **Change it to:**
   ```typescript
   select: {
     id: true,
     profilePhoto: true,
   },
   ```
   (Remove the `//` at the beginning of the line)

---

### File 2: `app/api/user/update/route.ts`

#### Step 2.1: Uncomment Line 93
1. Open the file: `app/api/user/update/route.ts`
2. Find **line 93** (look for `// profilePhoto: true,`)
3. You'll see:
   ```typescript
   select: {
     id: true,
     fullName: true,
     phoneNumber: true,
     whatsappNumber: true,
     email: true,
     address: true,
     city: true,
     district: true,
     state: true,
     pincode: true,
     role: true,
     // profilePhoto: true, // Uncomment after adding field to schema
   },
   ```
4. **Change it to:**
   ```typescript
   select: {
     id: true,
     fullName: true,
     phoneNumber: true,
     whatsappNumber: true,
     email: true,
     address: true,
     city: true,
     district: true,
     state: true,
     pincode: true,
     role: true,
     profilePhoto: true,
   },
   ```
   (Remove the `//` at the beginning of the line)

---

### File 3: `app/api/user/me/route.ts`

#### Step 3.1: Uncomment Line 42
1. Open the file: `app/api/user/me/route.ts`
2. Find **line 42** (look for `// profilePhoto: true,`)
3. You'll see:
   ```typescript
   select: {
     id: true,
     identificationNumber: true,
     fullName: true,
     phoneNumber: true,
     whatsappNumber: true,
     email: true,
     address: true,
     city: true,
     district: true,
     state: true,
     pincode: true,
     role: true,
     isActive: true,
     createdAt: true,
     // profilePhoto: true, // Uncomment after adding field to schema
   },
   ```
4. **Change it to:**
   ```typescript
   select: {
     id: true,
     identificationNumber: true,
     fullName: true,
     phoneNumber: true,
     whatsappNumber: true,
     email: true,
     address: true,
     city: true,
     district: true,
     state: true,
     pincode: true,
     role: true,
     isActive: true,
     createdAt: true,
     profilePhoto: true,
   },
   ```
   (Remove the `//` at the beginning of the line)

---

## ✅ Quick Reference: All Lines to Uncomment

| File | Line | What to Change |
|------|------|----------------|
| `app/api/user/profile/photo/route.ts` | 84 | `// profilePhoto: photoUrl,` → `profilePhoto: photoUrl,` |
| `app/api/user/profile/photo/route.ts` | 89 | `// profilePhoto: true,` → `profilePhoto: true,` |
| `app/api/user/profile/photo/route.ts` | 134 | `// profilePhoto: null,` → `profilePhoto: null,` |
| `app/api/user/profile/photo/route.ts` | 138 | `// profilePhoto: true,` → `profilePhoto: true,` |
| `app/api/user/update/route.ts` | 93 | `// profilePhoto: true,` → `profilePhoto: true,` |
| `app/api/user/me/route.ts` | 42 | `// profilePhoto: true,` → `profilePhoto: true,` |

---

## 🎯 Visual Example

### Before (Commented):
```typescript
data: {
  // profilePhoto: photoUrl, // Uncomment after adding field to schema
},
```

### After (Uncommented):
```typescript
data: {
  profilePhoto: photoUrl,
},
```

**What changed:**
- Removed `//` from the beginning
- Removed the comment at the end (optional, but recommended)

---

## 🔍 How to Find Lines Quickly

### Method 1: Using Search in Your Editor
1. Press `Ctrl+F` (or `Cmd+F` on Mac)
2. Search for: `// profilePhoto`
3. This will highlight all commented lines
4. Go through each one and remove the `//`

### Method 2: Using Line Numbers
1. Enable line numbers in your editor (usually in View → Show Line Numbers)
2. Navigate directly to the line numbers mentioned above
3. Remove the `//` from those lines

---

## ✅ Verification Checklist

After uncommenting, verify:

- [ ] File 1: `app/api/user/profile/photo/route.ts` - 4 lines uncommented
- [ ] File 2: `app/api/user/update/route.ts` - 1 line uncommented
- [ ] File 3: `app/api/user/me/route.ts` - 1 line uncommented
- [ ] No syntax errors (check for red underlines)
- [ ] Save all files

---

## 🧪 Test After Uncommenting

1. **Restart your development server:**
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

2. **Test profile photo upload:**
   - Go to My Account page
   - Click "Upload Photo" in Profile Photo section
   - Select an image
   - Photo should upload and display

3. **If you get errors:**
   - Make sure database migration was run
   - Make sure `prisma/schema.prisma` has `profilePhoto String?`
   - Run `npx prisma generate`
   - Restart the server

---

## 📝 Summary

**Total lines to uncomment: 6 lines across 3 files**

1. **app/api/user/profile/photo/route.ts** - 4 lines (lines 84, 89, 134, 138)
2. **app/api/user/update/route.ts** - 1 line (line 93)
3. **app/api/user/me/route.ts** - 1 line (line 42)

**Action:** Remove `//` from the beginning of each line that says `// profilePhoto`

---

**That's it!** Once you've uncommented all 6 lines, the profile photo feature will be fully functional. 🎉


























