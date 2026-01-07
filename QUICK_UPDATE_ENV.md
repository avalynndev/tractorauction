# Quick Guide: Update .env Password

## Method 1: Manual Update (Recommended)

### Step 1: Open .env File
Open `.env` file in your project root: `d:\www.tractorauction.in\.env`

### Step 2: Find This Line
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/tractorauction?schema=public"
```

### Step 3: Replace `root` with Your Password
Change it to:
```env
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/tractorauction?schema=public"
```

**Example:** If your password is `mypassword123`:
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/tractorauction?schema=public"
```

### Step 4: Save the File
Press `Ctrl + S` to save

### Step 5: Test Connection
```bash
npx prisma db push
```

---

## Method 2: Use Helper Script

Run this command:
```bash
powershell -ExecutionPolicy Bypass -File update-password.ps1
```

The script will:
1. Ask for your PostgreSQL password
2. Automatically update the .env file
3. URL-encode special characters if needed

---

## What Password Should I Use?

Use the password you set when installing PostgreSQL. Common options:
- The password you entered during PostgreSQL installation
- Default might be: `postgres`, `root`, `admin`, or blank

**Don't remember?** See `UPDATE_ENV_PASSWORD.md` for password reset instructions.

---

## Special Characters in Password?

If your password has special characters, they need to be URL-encoded:

| Character | Use This Instead |
|-----------|------------------|
| `@` | `%40` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |

**Example:**
- Password: `pass@123`
- Use: `pass%40123`
- Full line: `DATABASE_URL="postgresql://postgres:pass%40123@localhost:5432/tractorauction?schema=public"`

---

## After Updating

Test the connection:
```bash
npx prisma db push
```

**Success message:**
```
✔ Your database is now in sync with your Prisma schema.
```

**Error message:**
```
Error: P1000: Authentication failed
```
→ Password is still incorrect, try again

---

## Need More Help?

See `UPDATE_ENV_PASSWORD.md` for:
- Detailed instructions
- Password reset guide
- Troubleshooting tips





























