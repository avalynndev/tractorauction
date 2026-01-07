# Quick Database Setup

## Step 1: Install PostgreSQL (if not installed)

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for `postgres` user

## Step 2: Create Database

**Using Command Line:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE tractorauction;

# Exit
\q
```

**Or using pgAdmin:**
- Open pgAdmin 4
- Right-click "Databases" → Create → Database
- Name: `tractorauction`

## Step 3: Create .env File

1. Copy the example:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` and update DATABASE_URL:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
   ```
   
   Replace `YOUR_PASSWORD` with your PostgreSQL password.

## Step 4: Run Migrations

```bash
# Generate Prisma client
npx prisma generate

# Create tables in database
npx prisma db push
```

## Step 5: Verify

```bash
# Open database GUI
npx prisma studio
```

This opens at http://localhost:5555 - you should see all your tables!

## Connection String Format

```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

**Example:**
```
postgresql://postgres:mypassword123@localhost:5432/tractorauction?schema=public
```

## Troubleshooting

- **Can't connect?** Make sure PostgreSQL service is running
- **Wrong password?** Check your `.env` file password matches PostgreSQL
- **Database not found?** Create it first (Step 2)

For detailed instructions, see `POSTGRESQL_SETUP_GUIDE.md`





























