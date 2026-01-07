# How to Update .env File with PostgreSQL Password

## Quick Guide

### Step 1: Open .env File
Open the `.env` file in your project root directory (`d:\www.tractorauction.in\.env`)

### Step 2: Find DATABASE_URL Line
Look for this line:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/tractorauction?schema=public"
```

### Step 3: Replace the Password
Change `root` to your **actual PostgreSQL password**.

**Format:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
```

**Example:**
If your PostgreSQL password is `mypassword123`:
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/tractorauction?schema=public"
```

### Step 4: Special Characters in Password

If your password contains special characters, you need to URL-encode them:

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

**Example:**
- Password: `my@pass#123`
- Encoded: `my%40pass%23123`
- Connection string: `postgresql://postgres:my%40pass%23123@localhost:5432/tractorauction?schema=public`

### Step 5: Save the File
Save the `.env` file after making changes.

### Step 6: Test the Connection

After updating, test if it works:

```bash
npx prisma db push
```

If successful, you'll see:
```
✔ Your database is now in sync with your Prisma schema.
```

---

## Don't Know Your PostgreSQL Password?

### Option 1: Try Common Defaults
- `postgres`
- `root`
- `admin`
- `password`
- (blank/empty)

### Option 2: Reset PostgreSQL Password

**Windows:**

1. **Stop PostgreSQL Service**
   - Press `Win + R`
   - Type `services.msc`
   - Find "PostgreSQL" service
   - Right-click → Stop

2. **Edit pg_hba.conf**
   - Location: `C:\Program Files\PostgreSQL\[version]\data\pg_hba.conf`
   - Find line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save file

3. **Start PostgreSQL Service**
   - In Services, right-click PostgreSQL → Start

4. **Connect and Change Password**
   ```bash
   psql -U postgres
   ```
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword';
   ```
   ```sql
   \q
   ```

5. **Revert pg_hba.conf**
   - Change `trust` back to `md5`
   - Restart PostgreSQL service

6. **Update .env**
   - Use the new password you just set

### Option 3: Check if Password is Stored

Some PostgreSQL installations store credentials in:
- Windows Credential Manager
- Installation notes/documentation
- Configuration files

---

## Complete .env File Example

Here's what your complete `.env` file should look like:

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"

# JWT Secret
JWT_SECRET="your-secret-key-change-in-production"

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload (Cloudinary or AWS S3)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# SMS Service (Twilio)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

**Important:** Only update the `DATABASE_URL` line with your password!

---

## Quick Test

After updating `.env`, test the connection:

```bash
# Test connection
npx prisma db push
```

**Success:**
```
✔ Your database is now in sync with your Prisma schema.
```

**Failure:**
```
Error: P1000: Authentication failed
```
→ Password is still wrong, try again or reset password

---

## Need Help?

If you're still having issues:
1. Verify PostgreSQL is running
2. Check database `tractorauction` exists
3. Try connecting manually: `psql -U postgres -d tractorauction`
4. See `FIX_DATABASE_CONNECTION.md` for more help





























