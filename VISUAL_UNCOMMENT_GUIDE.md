# Visual Guide: Uncomment Profile Photo Code

## 📋 Complete Checklist

### ✅ Step 1: Update Prisma Schema (Already Done!)
The schema has been updated. If you haven't run the migration yet:
```bash
npx prisma db push
npx prisma generate
```

---

## 📝 Step 2: Uncomment Code in 3 Files

### File 1: `app/api/user/profile/photo/route.ts`

#### Change 1: Line 84 (Upload Photo - Save to Database)
**FIND THIS:**
```typescript
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        // profilePhoto: photoUrl, // Uncomment after adding field to schema
      },
```

**CHANGE TO:**
```typescript
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profilePhoto: photoUrl,
      },
```

---

#### Change 2: Line 89 (Upload Photo - Return in Response)
**FIND THIS:**
```typescript
      select: {
        id: true,
        fullName: true,
        // profilePhoto: true, // Uncomment after adding field to schema
      },
```

**CHANGE TO:**
```typescript
      select: {
        id: true,
        fullName: true,
        profilePhoto: true,
      },
```

---

#### Change 3: Line 134 (Delete Photo - Remove from Database)
**FIND THIS:**
```typescript
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        // profilePhoto: null, // Uncomment after adding field to schema
      },
```

**CHANGE TO:**
```typescript
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        profilePhoto: null,
      },
```

---

#### Change 4: Line 138 (Delete Photo - Return in Response)
**FIND THIS:**
```typescript
      select: {
        id: true,
        // profilePhoto: true, // Uncomment after adding field to schema
      },
```

**CHANGE TO:**
```typescript
      select: {
        id: true,
        profilePhoto: true,
      },
```

---

### File 2: `app/api/user/update/route.ts`

#### Change 5: Line 93 (Update Profile - Return Photo)
**FIND THIS:**
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

**CHANGE TO:**
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

---

### File 3: `app/api/user/me/route.ts`

#### Change 6: Line 42 (Get User - Return Photo)
**FIND THIS:**
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

**CHANGE TO:**
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

---

## 🎯 Quick Method: Find and Replace

### Option 1: Manual Find & Replace
1. Open each file
2. Press `Ctrl+H` (or `Cmd+H` on Mac) to open Find & Replace
3. Find: `// profilePhoto:`
4. Replace: `profilePhoto:`
5. Click "Replace All" (be careful - only do this in the 3 files mentioned)
6. Save the file

### Option 2: Search in All Files
1. Press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
2. Search for: `// profilePhoto`
3. This will show all 6 occurrences
4. Click on each one and remove the `//`
5. Save all files

---

## ✅ Final Verification

After making all changes, your code should look like this:

### ✅ Correct (Uncommented):
```typescript
profilePhoto: photoUrl,
profilePhoto: true,
profilePhoto: null,
```

### ❌ Wrong (Still Commented):
```typescript
// profilePhoto: photoUrl,
// profilePhoto: true,
// profilePhoto: null,
```

---

## 🧪 Test It

1. **Save all files**
2. **Restart your dev server:**
   ```bash
   npm run dev
   ```
3. **Go to My Account page**
4. **Try uploading a profile photo**
5. **If it works, you're done!** ✅

---

## 🆘 Troubleshooting

### Error: "Unknown field 'profilePhoto'"
- **Solution:** Make sure you ran `npx prisma db push` and `npx prisma generate`

### Error: "Cannot read property 'profilePhoto'"
- **Solution:** Make sure you uncommented all 6 lines

### Photo not showing after upload
- **Solution:** Check browser console for errors, verify Cloudinary is configured

---

**That's it!** Follow these steps and your profile photo feature will work. 🎉


























