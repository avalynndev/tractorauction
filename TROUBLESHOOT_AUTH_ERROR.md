# Troubleshooting: Authentication Failed Error

## Current Error
```
Error: P1000: Authentication failed against database server at `localhost`
```

This means Prisma can connect to PostgreSQL, but the password is wrong.

## Step-by-Step Fix

### Step 1: Verify PostgreSQL is Running

**Check Services:**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "PostgreSQL" service
4. Make sure it shows **Running**
5. If **Stopped**, right-click → **Start**

---

### Step 2: Test Password Manually

Since you created the database using pgAdmin, you know the password works there. Let's verify it works from command line.

**Option A: Test in pgAdmin**
1. Open pgAdmin
2. Try to connect - if it works, your password is correct
3. Note the exact password you're using

**Option B: Test with psql (if available)**
Try connecting with the full path:
```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d tractorauction
```
Enter your password. If it connects, password is correct.

---

### Step 3: Check .env File Format

Open `.env` file and verify the `DATABASE_URL` line:

**Correct format:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
```

**Common mistakes:**
1. ❌ Extra spaces: `DATABASE_URL = "postgresql://..."`
   ✅ Correct: `DATABASE_URL="postgresql://..."`

2. ❌ Wrong password: `postgres:wrongpassword@`
   ✅ Correct: `postgres:correctpassword@`

3. ❌ Special characters not encoded
   ✅ See Step 4 below

---

### Step 4: Handle Special Characters in Password

If your password has special characters, they MUST be URL-encoded:

| Character | Encoded |
|-----------|---------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `/` | `%2F` |
| `?` | `%3F` |
| ` ` (space) | `%20` |

**Examples:**

**Password: `mypass@123`**
- Wrong: `postgres:mypass@123@`
- Correct: `postgres:mypass%40123@`
- Full line: `DATABASE_URL="postgresql://postgres:mypass%40123@localhost:5432/tractorauction?schema=public"`

**Password: `pass#word$123`**
- Wrong: `postgres:pass#word$123@`
- Correct: `postgres:pass%23word%24123@`
- Full line: `DATABASE_URL="postgresql://postgres:pass%23word%24123@localhost:5432/tractorauction?schema=public"`

---

### Step 5: Reset PostgreSQL Password (If Needed)

If you're not sure about the password, you can reset it:

**Windows:**

1. **Stop PostgreSQL Service**
   - Press `Win + R` → `services.msc`
   - Find "PostgreSQL" → Right-click → Stop

2. **Edit pg_hba.conf**
   - Location: `C:\Program Files\PostgreSQL\[version]\data\pg_hba.conf`
   - Find line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save file

3. **Start PostgreSQL Service**
   - In Services, right-click PostgreSQL → Start

4. **Connect and Change Password**
   ```bash
   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
   ```
   (No password needed now)
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword123';
   \q
   ```

5. **Revert pg_hba.conf**
   - Change `trust` back to `md5`
   - Restart PostgreSQL service

6. **Update .env**
   - Use the new password: `newpassword123`

---

### Step 6: Verify .env File Location

Make sure `.env` file is in the project root:
- Location: `d:\www.tractorauction.in\.env`
- Not in a subfolder
- File name is exactly `.env` (not `.env.txt`)

---

### Step 7: Test After Fixing

After updating `.env`:

```bash
npx prisma db push
```

**Success:**
```
✔ Your database is now in sync with your Prisma schema.
```

**Still failing:**
- Double-check password
- Verify PostgreSQL is running
- Check for special characters
- Try resetting password

---

## Quick Checklist

- [ ] PostgreSQL service is running
- [ ] Database `tractorauction` exists (created in pgAdmin)
- [ ] `.env` file has correct password
- [ ] No spaces around `=` in `.env`
- [ ] Special characters are URL-encoded
- [ ] Password matches what works in pgAdmin

---

## Common Issues

### Issue 1: Password Works in pgAdmin but Not in .env
**Solution:** 
- Copy password exactly as you type it in pgAdmin
- Check for special characters that need encoding
- Make sure no extra spaces

### Issue 2: Forgot Password
**Solution:** Reset it (see Step 5 above)

### Issue 3: Special Characters
**Solution:** URL-encode them (see Step 4 above)

---

## Test Connection Script

You can test if your connection string works:

```bash
# This will try to connect and show the error
npx prisma db push
```

If it says "Authentication failed", the password is wrong.
If it says "Can't reach database server", PostgreSQL isn't running.

---

## Still Having Issues?

1. **Verify password in pgAdmin:**
   - Open pgAdmin
   - Try connecting
   - Note the exact password

2. **Update .env:**
   - Use the exact same password
   - URL-encode special characters

3. **Test again:**
   ```bash
   npx prisma db push
   ```

Good luck! 🚀





























