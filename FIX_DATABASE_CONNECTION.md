# Fix Database Connection Error

## Error Message
```
Error: P1000: Authentication failed against database server at `localhost`
```

This means Prisma cannot connect to your PostgreSQL database.

## Step-by-Step Fix

### Step 1: Check PostgreSQL is Running

**Windows:**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Look for "PostgreSQL" service
4. Make sure it shows **Running**
5. If it's not running, right-click → **Start**

**Or test via command line:**
```bash
psql -U postgres
```
- If it asks for password and connects → PostgreSQL is running ✅
- If it says "connection refused" → PostgreSQL is not running ❌

### Step 2: Verify Database Exists

```bash
# Connect to PostgreSQL
psql -U postgres

# List all databases
\l

# Check if 'tractorauction' exists
# If you see it → Good! ✅
# If not → Create it:
CREATE DATABASE tractorauction;

# Exit
\q
```

### Step 3: Check .env File

Open `.env` file in your project root and verify:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
```

**Important:**
- Replace `YOUR_PASSWORD` with your **actual PostgreSQL password**
- The password you set when installing PostgreSQL
- If you forgot the password, you may need to reset it

### Step 4: Test Connection Manually

Try connecting directly:

```bash
psql -U postgres -d tractorauction
```

Enter your password when prompted. If this works, your credentials are correct.

### Step 5: Common Issues

#### Issue 1: Wrong Password
**Solution:** Update `.env` file with correct password

#### Issue 2: Password Has Special Characters
If your password contains special characters, you need to URL-encode them:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

**Example:**
- Password: `mypass@123`
- Encoded: `mypass%40123`
- Connection string: `postgresql://postgres:mypass%40123@localhost:5432/tractorauction?schema=public`

#### Issue 3: Database Doesn't Exist
**Solution:** Create it:
```bash
psql -U postgres
CREATE DATABASE tractorauction;
\q
```

#### Issue 4: PostgreSQL Not Running
**Solution:** Start PostgreSQL service (see Step 1)

### Step 6: Reset PostgreSQL Password (If Needed)

If you forgot your password:

**Windows:**
1. Stop PostgreSQL service
2. Edit `pg_hba.conf` file (usually in `C:\Program Files\PostgreSQL\[version]\data\`)
3. Change `md5` to `trust` for local connections
4. Restart PostgreSQL service
5. Connect without password:
   ```bash
   psql -U postgres
   ```
6. Change password:
   ```sql
   ALTER USER postgres WITH PASSWORD 'newpassword';
   ```
7. Change `pg_hba.conf` back to `md5`
8. Restart PostgreSQL service

### Step 7: Verify .env Format

Make sure your `.env` file looks exactly like this (no extra spaces):

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tractorauction?schema=public"
```

**NOT:**
```env
DATABASE_URL = "postgresql://..."  ❌ (spaces around =)
DATABASE_URL="postgresql://..."    ✅ (no spaces)
```

### Step 8: Test Again

After fixing the issue, try again:

```bash
npx prisma db push
```

## Quick Checklist

- [ ] PostgreSQL service is running
- [ ] Database `tractorauction` exists
- [ ] `.env` file has correct `DATABASE_URL`
- [ ] Password is correct (or URL-encoded if special chars)
- [ ] No spaces around `=` in `.env` file

## Still Having Issues?

1. Double-check your PostgreSQL installation
2. Verify you can connect using `psql -U postgres`
3. Make sure the database name matches exactly: `tractorauction`
4. Check that port 5432 is not blocked by firewall

## Success!

Once you can run `npx prisma db push` successfully, you'll see:
```
✔ Your database is now in sync with your Prisma schema.
```

Then proceed to verify with:
```bash
npx prisma studio
```





























