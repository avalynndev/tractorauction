# Fix: 'psql' is not recognized

## Problem
When you run `psql -U postgres`, you get:
```
'psql' is not recognized as an internal or external command
```

This means PostgreSQL's `bin` directory is not in your system PATH.

## Solutions

### Solution 1: Use Full Path to psql (Quick Fix)

Instead of just `psql`, use the full path to the executable.

**Find PostgreSQL installation:**
1. Check these common locations:
   - `C:\Program Files\PostgreSQL\[version]\bin\psql.exe`
   - `C:\Program Files (x86)\PostgreSQL\[version]\bin\psql.exe`

2. Replace `[version]` with your PostgreSQL version (e.g., `15`, `16`, `14`)

**Example commands:**
```bash
# For PostgreSQL 16
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# For PostgreSQL 15
"C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

# For PostgreSQL 14
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres
```

**To create database:**
```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
Then in psql:
```sql
CREATE DATABASE tractorauction;
\q
```

---

### Solution 2: Add PostgreSQL to PATH (Permanent Fix)

**Windows 10/11:**

1. **Find PostgreSQL bin directory:**
   - Usually: `C:\Program Files\PostgreSQL\[version]\bin`
   - Example: `C:\Program Files\PostgreSQL\16\bin`

2. **Add to PATH:**
   - Press `Win + X` → System
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find "Path" → Click "Edit"
   - Click "New"
   - Add: `C:\Program Files\PostgreSQL\16\bin` (replace 16 with your version)
   - Click "OK" on all dialogs

3. **Restart Command Prompt/PowerShell**
   - Close and reopen your terminal
   - Now `psql` should work!

**Test:**
```bash
psql --version
```

---

### Solution 3: Use pgAdmin (GUI Tool - Easiest)

If PostgreSQL is installed, you should have **pgAdmin 4**:

1. **Open pgAdmin 4**
   - Search for "pgAdmin" in Start menu
   - Or find it in: `C:\Program Files\PostgreSQL\[version]\pgAdmin 4`

2. **Connect to Server:**
   - Enter password when prompted
   - Right-click "Databases" → Create → Database
   - Name: `tractorauction`
   - Click "Save"

3. **Done!** Database is created.

---

### Solution 4: Install PostgreSQL (If Not Installed)

If PostgreSQL is not installed:

1. **Download:**
   - Visit: https://www.postgresql.org/download/windows/
   - Or: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Install:**
   - Run the installer
   - **Remember the password** you set for `postgres` user!
   - Default port: `5432`
   - Install pgAdmin 4 (GUI tool)

3. **After installation:**
   - PostgreSQL should be in PATH automatically
   - Or use Solution 1 (full path)

---

## Quick Commands Using Full Path

### Find Your PostgreSQL Version

**Check Program Files:**
```powershell
Get-ChildItem "C:\Program Files\PostgreSQL" -Directory
```

**Or check Services:**
```powershell
Get-Service | Where-Object {$_.Name -like "*postgres*"}
```

### Connect to PostgreSQL

Once you know the path, use:
```bash
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

### Create Database

```bash
# Connect first
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres

# Then in psql prompt:
CREATE DATABASE tractorauction;
\q
```

---

## Alternative: Use pgAdmin (Recommended for Beginners)

**pgAdmin is easier if you're not comfortable with command line:**

1. **Open pgAdmin 4** (should be installed with PostgreSQL)

2. **Connect:**
   - Enter password for `postgres` user

3. **Create Database:**
   - Right-click "Databases" (left sidebar)
   - Click "Create" → "Database..."
   - Database name: `tractorauction`
   - Click "Save"

4. **Done!** Database is created.

---

## After Database is Created

Once you have the database, continue with:

```bash
# Create tables
npx prisma db push

# Verify tables
npx prisma studio

# Start application
npm run dev
```

---

## Summary

**Easiest method:** Use pgAdmin 4 (GUI tool)
- No command line needed
- Visual interface
- Just right-click → Create Database

**Command line method:** Use full path to psql
- `"C:\Program Files\PostgreSQL\[version]\bin\psql.exe" -U postgres`

**Permanent fix:** Add PostgreSQL to PATH
- Then `psql` will work from anywhere

---

## Need Help?

- **PostgreSQL not installed?** → Download from https://www.postgresql.org/download/windows/
- **Can't find pgAdmin?** → Check Start menu or reinstall PostgreSQL
- **Still having issues?** → Use pgAdmin (easiest option)





























