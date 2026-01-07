# How to Clear Cache - Step by Step Guide

## 🧹 Clear Next.js Build Cache

### Method 1: Using PowerShell (Windows)

1. **Open PowerShell** in your project directory (`D:\www.tractorauction.in`)

2. **Clear the `.next` folder:**
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Clear node_modules cache (optional):**
   ```powershell
   Remove-Item -Recurse -Force node_modules\.cache
   ```

4. **Restart your development server:**
   ```powershell
   npm run dev
   ```

---

### Method 2: Using Command Prompt (Windows)

1. **Open Command Prompt** in your project directory

2. **Clear the `.next` folder:**
   ```cmd
   rmdir /s /q .next
   ```

3. **Clear node_modules cache (optional):**
   ```cmd
   rmdir /s /q node_modules\.cache
   ```

4. **Restart your development server:**
   ```cmd
   npm run dev
   ```

---

### Method 3: Manual Delete (Windows)

1. **Stop your development server** (Press `Ctrl+C`)

2. **Open File Explorer** and navigate to:
   ```
   D:\www.tractorauction.in
   ```

3. **Delete the `.next` folder:**
   - Right-click on `.next` folder
   - Select "Delete"
   - Confirm deletion

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

---

## 🔄 Complete Cache Clear (All Caches)

If you want to clear **all** caches (more thorough):

### PowerShell:
```powershell
# Stop server first (Ctrl+C)

# Clear Next.js cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Clear node_modules cache
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue

# Clear npm cache (optional)
npm cache clean --force

# Restart server
npm run dev
```

### Command Prompt:
```cmd
# Stop server first (Ctrl+C)

# Clear Next.js cache
rmdir /s /q .next

# Clear node_modules cache
rmdir /s /q node_modules\.cache

# Clear npm cache (optional)
npm cache clean --force

# Restart server
npm run dev
```

---

## ⚠️ Important Notes

1. **Always stop your development server** before clearing cache
   - Press `Ctrl+C` in the terminal where the server is running

2. **The `.next` folder will be recreated** automatically when you restart the server

3. **Clearing cache won't delete your code** - it only removes build artifacts

4. **If you get "file in use" errors:**
   - Make sure the server is completely stopped
   - Close any editors that might have the files open
   - Try again

---

## 🎯 Quick Commands Reference

| Action | PowerShell | Command Prompt |
|--------|-----------|----------------|
| Clear `.next` | `Remove-Item -Recurse -Force .next` | `rmdir /s /q .next` |
| Clear node_modules cache | `Remove-Item -Recurse -Force node_modules\.cache` | `rmdir /s /q node_modules\.cache` |
| Clear npm cache | `npm cache clean --force` | `npm cache clean --force` |
| Restart server | `npm run dev` | `npm run dev` |

---

## ✅ After Clearing Cache

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Wait for the build to complete** (first build after clearing cache takes longer)

3. **Check if the error is resolved**

---

## 🆘 Troubleshooting

### Error: "Cannot delete .next folder"
- **Solution:** Make sure the development server is stopped (Ctrl+C)

### Error: "File is in use"
- **Solution:** Close VS Code or any editor, then try again

### Error: "Access denied"
- **Solution:** Run PowerShell/Command Prompt as Administrator

---

**That's it!** After clearing the cache and restarting, your build errors should be resolved. 🎉


























