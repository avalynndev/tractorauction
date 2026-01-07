# Step-by-Step Guide: Create Database Tables

This guide will walk you through creating all database tables for the Tractor Auction application.

## Prerequisites Checklist

Before starting, make sure you have:
- ✅ PostgreSQL installed and running
- ✅ Database `tractorauction` created
- ✅ `.env` file with correct `DATABASE_URL`
- ✅ Dependencies installed (`npm install` completed)

---

## Step 1: Verify Database Connection

### 1.1 Check if PostgreSQL is Running

**Windows:**
- Press `Win + R`, type `services.msc`, press Enter
- Look for "PostgreSQL" service
- Make sure it's **Running** (if not, right-click → Start)

**Or check via Command Line:**
```bash
# Try to connect to PostgreSQL
psql -U postgres
```

If it asks for password and connects, PostgreSQL is running! Type `\q` to exit.

### 1.2 Verify Database Exists

```bash
# Connect to PostgreSQL
psql -U postgres

# List all databases
\l

# Check if 'tractorauction' database exists
# If you see it in the list, you're good!
# If not, create it:
CREATE DATABASE tractorauction;

# Exit
\q
```

---

## Step 2: Verify .env File

### 2.1 Check .env File

Open `.env` file in your project root. It should have:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual PostgreSQL password
- If your password has special characters, you may need to URL-encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`

**Example:**
```env
# If your password is: mypass@123
DATABASE_URL="postgresql://postgres:mypass%40123@localhost:5432/tractorauction?schema=public"
```

### 2.2 Test Connection (Optional)

You can test if the connection string works:

```bash
# This will try to connect using Prisma
npx prisma db pull
```

If it connects successfully, you're ready for the next step!

---

## Step 3: Generate Prisma Client

This step creates the Prisma client that will be used to interact with the database.

### 3.1 Run the Command

```bash
npx prisma generate
```

### 3.2 What to Expect

You should see output like:
```
✔ Generated Prisma Client (version 5.x.x) to ./node_modules/.prisma/client in XXXms
```

**If you see errors:**
- **"Can't reach database server"** → PostgreSQL is not running
- **"password authentication failed"** → Wrong password in `.env`
- **"database does not exist"** → Create database first (Step 1.2)

---

## Step 4: Create Database Tables

This is the main step that creates all tables in your database.

### 4.1 Run the Migration Command

```bash
npx prisma db push
```

### 4.2 What Happens

This command will:
1. Read `prisma/schema.prisma` file
2. Compare it with your database
3. Create all tables, columns, indexes, and relationships
4. Show you what changes will be made

### 4.3 Expected Output

You should see something like:

```
✔ Generated Prisma Client (5.x.x) to ./node_modules/.prisma/client

The following schema(s) have changed:

+ User
+ Membership
+ Vehicle
+ Auction
+ Bid
+ Purchase

✔ Your database is now in sync with your Prisma schema.

```

### 4.4 If You See Errors

**Error: "Can't reach database server"**
```
Solution:
1. Make sure PostgreSQL service is running
2. Check DATABASE_URL in .env file
3. Verify database name is correct
```

**Error: "password authentication failed"**
```
Solution:
1. Check your PostgreSQL password
2. Update DATABASE_URL in .env file
3. Make sure password is URL-encoded if it has special characters
```

**Error: "database does not exist"**
```
Solution:
1. Create the database first:
   psql -U postgres
   CREATE DATABASE tractorauction;
   \q
```

---

## Step 5: Verify Tables Were Created

### 5.1 Open Prisma Studio (Database GUI)

```bash
npx prisma studio
```

This will:
- Open a web browser automatically
- Show you all your database tables
- Allow you to view and edit data

**You should see these tables:**
- ✅ User
- ✅ Membership
- ✅ Vehicle
- ✅ Auction
- ✅ Bid
- ✅ Purchase

### 5.2 Or Check via Command Line

```bash
# Connect to database
psql -U postgres -d tractorauction

# List all tables
\dt

# You should see:
# - User
# - Membership
# - Vehicle
# - Auction
# - Bid
# - Purchase

# Exit
\q
```

---

## Step 6: Test the Application

### 6.1 Start the Development Server

```bash
npm run dev
```

### 6.2 Test Registration

1. Open browser: http://localhost:3000
2. Click "Register" button
3. Fill in the registration form
4. Submit the form
5. Check Prisma Studio to see if user was created!

---

## Complete Command Sequence

Here's the complete sequence of commands to run:

```bash
# Step 1: Generate Prisma Client
npx prisma generate

# Step 2: Create database tables
npx prisma db push

# Step 3: (Optional) Open database GUI to verify
npx prisma studio

# Step 4: Start the application
npm run dev
```

---

## Tables That Will Be Created

### 1. User Table
- Stores user information (name, phone, address, etc.)
- Fields: id, fullName, phoneNumber, whatsappNumber, address, city, district, state, pincode, role, isActive, etc.

### 2. Membership Table
- Stores membership information
- Fields: id, userId, membershipType, startDate, endDate, amount, status

### 3. Vehicle Table
- Stores vehicle listings
- Fields: id, sellerId, vehicleType, saleType, saleAmount, tractorBrand, engineHP, yearOfMfg, etc.

### 4. Auction Table
- Stores auction information
- Fields: id, vehicleId, startTime, endTime, currentBid, reservePrice, minimumIncrement, status

### 5. Bid Table
- Stores bid information
- Fields: id, auctionId, bidderId, bidAmount, bidTime, isWinningBid

### 6. Purchase Table
- Stores purchase information
- Fields: id, vehicleId, buyerId, purchasePrice, purchaseType, status

---

## Troubleshooting

### Problem: "Prisma schema not found"
**Solution:** Make sure `prisma/schema.prisma` file exists in your project root.

### Problem: "Environment variable not found: DATABASE_URL"
**Solution:** 
1. Make sure `.env` file exists in project root
2. Check that `DATABASE_URL` is in the file
3. No spaces around the `=` sign

### Problem: Tables created but application still shows errors
**Solution:**
1. Restart the development server (`npm run dev`)
2. Clear Prisma cache: `npx prisma generate --force`

### Problem: Can't see tables in Prisma Studio
**Solution:**
1. Make sure `npx prisma db push` completed successfully
2. Check that you're connected to the correct database
3. Refresh Prisma Studio (close and reopen)

---

## Success Indicators

✅ **You're successful if:**
1. `npx prisma generate` completes without errors
2. `npx prisma db push` shows "Your database is now in sync"
3. Prisma Studio shows all 6 tables
4. Application starts without database errors
5. You can register a new user successfully

---

## Next Steps

After tables are created:
1. ✅ Database is ready
2. Test user registration
3. Test vehicle upload
4. Continue with other features

---

## Quick Reference

```bash
# Generate Prisma Client
npx prisma generate

# Create/Update tables
npx prisma db push

# View database in browser
npx prisma studio

# View database in terminal
psql -U postgres -d tractorauction

# Start application
npm run dev
```

---

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify PostgreSQL is running
3. Check `.env` file configuration
4. Make sure database exists
5. Review the troubleshooting section above

Good luck! 🚀





























