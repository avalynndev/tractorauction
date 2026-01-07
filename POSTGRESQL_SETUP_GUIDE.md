# PostgreSQL Database Setup Guide

This guide will help you set up PostgreSQL database for the Tractor Auction application.

## Option 1: Local PostgreSQL Installation (Windows)

### Step 1: Install PostgreSQL

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the PostgreSQL installer for Windows
   - Or use: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

2. **Run the Installer**
   - Run the downloaded `.exe` file
   - Follow the installation wizard
   - **Important**: Remember the password you set for the `postgres` superuser
   - Default port is `5432` (keep this)
   - Complete the installation

3. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version

### Step 2: Create Database

**Method 1: Using pgAdmin (GUI Tool)**
1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Connect to your PostgreSQL server (use the password you set during installation)
3. Right-click on "Databases" → "Create" → "Database"
4. Name: `tractorauction`
5. Click "Save"

**Method 2: Using Command Line**
1. Open Command Prompt or PowerShell
2. Connect to PostgreSQL:
   ```bash
   psql -U postgres
   ```
3. Enter your password when prompted
4. Create the database:
   ```sql
   CREATE DATABASE tractorauction;
   ```
5. Exit psql:
   ```sql
   \q
   ```

### Step 3: Create .env File

1. **Copy the example file:**
   ```bash
   copy .env.example .env
   ```
   Or manually create a file named `.env` in the project root

2. **Open `.env` file and update the DATABASE_URL:**

   **For local PostgreSQL (default settings):**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
   ```
   
   Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

   **Example:**
   ```env
   DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/tractorauction?schema=public"
   ```

   **If you created a different user:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/tractorauction?schema=public"
   ```

### Step 4: Run Database Migrations

1. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Push schema to database:**
   ```bash
   npx prisma db push
   ```

3. **Verify tables were created (optional):**
   ```bash
   npx prisma studio
   ```
   This opens a web interface to view your database tables.

## Option 2: Cloud Database (Recommended for Production)

### Using Supabase (Free Tier Available)

1. **Sign up at**: https://supabase.com
2. **Create a new project**
3. **Get connection string:**
   - Go to Project Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

4. **Update .env:**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?schema=public"
   ```
   Replace `[YOUR-PASSWORD]` and `[PROJECT-REF]` with your actual values.

### Using Railway (Free Tier Available)

1. **Sign up at**: https://railway.app
2. **Create new project** → Add PostgreSQL
3. **Get connection string:**
   - Click on PostgreSQL service
   - Go to Variables tab
   - Copy the `DATABASE_URL`

4. **Update .env:**
   ```env
   DATABASE_URL="[COPIED_CONNECTION_STRING]"
   ```

### Using Neon (Free Tier Available)

1. **Sign up at**: https://neon.tech
2. **Create a new project**
3. **Get connection string:**
   - Go to Dashboard → Connection Details
   - Copy the connection string

4. **Update .env:**
   ```env
   DATABASE_URL="[COPIED_CONNECTION_STRING]"
   ```

## Complete .env File Example

Here's a complete `.env` file with all required variables:

```env
# Database - Update with your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/tractorauction?schema=public"

# JWT Secret - Generate a random string (keep this secret!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-12345"

# OTP Configuration
OTP_EXPIRY_MINUTES=10

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# File Upload (Cloudinary) - Optional for now
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# SMS Service (Twilio) - Optional for now
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# Payment Gateway (Razorpay) - Optional for now
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
```

## Verification Steps

1. **Check database connection:**
   ```bash
   npx prisma db push
   ```
   If successful, you'll see: "Your database is now in sync with your Prisma schema."

2. **View database in Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   Opens at http://localhost:5555

3. **Test the application:**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and try registering a user.

## Troubleshooting

### Error: "Can't reach database server"
- **Solution**: Make sure PostgreSQL service is running
  - Windows: Check Services → PostgreSQL
  - Or restart: `net start postgresql-x64-XX` (replace XX with version)

### Error: "password authentication failed"
- **Solution**: Check your password in DATABASE_URL matches your PostgreSQL password
- Reset password if needed:
  ```sql
  ALTER USER postgres WITH PASSWORD 'newpassword';
  ```

### Error: "database does not exist"
- **Solution**: Create the database first (see Step 2 above)

### Error: "relation does not exist"
- **Solution**: Run `npx prisma db push` to create tables

### Connection String Format Issues
- Make sure there are no spaces in the connection string
- Encode special characters in password (e.g., `@` becomes `%40`)
- For passwords with special characters, use URL encoding:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

## Quick Setup Commands Summary

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Create .env file (copy from .env.example and update DATABASE_URL)
copy .env.example .env

# 3. Generate Prisma client
npx prisma generate

# 4. Create database tables
npx prisma db push

# 5. (Optional) Open database GUI
npx prisma studio

# 6. Start development server
npm run dev
```

## Next Steps

After setting up the database:
1. ✅ Database is ready
2. Test registration: Visit http://localhost:3000/register
3. Check database: Use `npx prisma studio` to see created users
4. Continue with SMS integration (Twilio)
5. Set up file upload (Cloudinary)

## Need Help?

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma Docs: https://www.prisma.io/docs
- Project Support: contact@tractorauction.in





























