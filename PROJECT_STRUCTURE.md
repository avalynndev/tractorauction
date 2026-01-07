# Project Structure Guide

## Understanding Next.js Structure

This is a **Next.js application** which combines both **frontend** and **backend** in one project. Unlike traditional setups, there are no separate `frontend/` and `backend/` folders.

## 📁 Project Structure

```
www.tractorauction.in/
│
├── app/                          # 🎨 FRONTEND PAGES (React Components)
│   ├── page.tsx                  # Homepage (/)
│   ├── layout.tsx                # Root layout (header/footer)
│   ├── globals.css               # Global styles
│   │
│   ├── register/                 # Registration page (/register)
│   │   └── page.tsx
│   ├── login/                    # Login page (/login)
│   │   └── page.tsx
│   ├── verify-otp/               # OTP verification (/verify-otp)
│   │   └── page.tsx
│   ├── my-account/               # User dashboard (/my-account)
│   │   └── page.tsx
│   ├── auctions/                 # Auctions listing (/auctions)
│   │   └── page.tsx
│   ├── preapproved/              # Pre-approved vehicles (/preapproved)
│   │   └── page.tsx
│   ├── sell/                     # Seller pages
│   │   └── upload/               # Vehicle upload (/sell/upload)
│   │       └── page.tsx
│   ├── how-it-works/             # Static page (/how-it-works)
│   │   └── page.tsx
│   ├── why-choose-us/            # Static page (/why-choose-us)
│   │   └── page.tsx
│   ├── contact/                  # Contact page (/contact)
│   │   └── page.tsx
│   │
│   └── api/                      # 🔧 BACKEND API ROUTES
│       ├── auth/                 # Authentication APIs
│       │   ├── register/        # POST /api/auth/register
│       │   │   └── route.ts
│       │   ├── login/           # POST /api/auth/login
│       │   │   └── route.ts
│       │   ├── verify-otp/      # POST /api/auth/verify-otp
│       │   │   └── route.ts
│       │   └── resend-otp/      # POST /api/auth/resend-otp
│       │       └── route.ts
│       │
│       ├── user/                 # User APIs
│       │   └── me/              # GET /api/user/me
│       │       └── route.ts
│       │
│       ├── vehicles/             # Vehicle APIs
│       │   ├── upload/          # POST /api/vehicles/upload
│       │   │   └── route.ts
│       │   └── preapproved/     # GET /api/vehicles/preapproved
│       │       └── route.ts
│       │
│       └── auctions/              # Auction APIs
│           └── route.ts          # GET /api/auctions
│
├── components/                    # 🧩 REUSABLE COMPONENTS
│   └── layout/
│       ├── Header.tsx            # Navigation header
│       └── Footer.tsx            # Footer with contact info
│
├── lib/                          # 🔨 UTILITY FUNCTIONS
│   ├── prisma.ts                # Database client
│   └── auth.ts                  # Authentication helpers
│
├── prisma/                       # 🗄️ DATABASE SCHEMA
│   └── schema.prisma            # Database models
│
├── public/                       # 📁 STATIC FILES
│   └── favicon.ico              # Website icon
│
├── .env                          # 🔐 ENVIRONMENT VARIABLES (create this!)
├── package.json                  # 📦 Project dependencies
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS config
└── next.config.js                # Next.js configuration

```

## 🎯 Key Points

### Frontend (User Interface)
- **Location**: `app/` directory
- **Files**: All `page.tsx` files
- **Components**: `components/` directory
- **Styles**: `app/globals.css` and Tailwind CSS

### Backend (API Routes)
- **Location**: `app/api/` directory
- **Files**: All `route.ts` files
- **Format**: Each folder = one API endpoint
- **Example**: `app/api/auth/register/route.ts` = `POST /api/auth/register`

### Database
- **Schema**: `prisma/schema.prisma`
- **Client**: `lib/prisma.ts`
- **Connection**: Configured in `.env` file

## 🚀 How to Run the Application

### Step 1: Install Dependencies
```bash
npm install
```
This installs all required packages (Next.js, React, Prisma, etc.)

### Step 2: Set Up Database
1. Create `.env` file (if not exists)
2. Update `DATABASE_URL` with your PostgreSQL credentials
3. Run migrations:
```bash
npx prisma generate
npx prisma db push
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Open Browser
Visit: **http://localhost:3000**

## 📍 Important URLs

When running `npm run dev`, you can access:

- **Homepage**: http://localhost:3000
- **Register**: http://localhost:3000/register
- **Login**: http://localhost:3000/login
- **Auctions**: http://localhost:3000/auctions
- **Pre-approved**: http://localhost:3000/preapproved
- **My Account**: http://localhost:3000/my-account
- **Contact**: http://localhost:3000/contact

**API Endpoints** (for testing with Postman/Thunder Client):
- POST http://localhost:3000/api/auth/register
- POST http://localhost:3000/api/auth/login
- POST http://localhost:3000/api/auth/verify-otp
- GET http://localhost:3000/api/vehicles/preapproved
- GET http://localhost:3000/api/auctions

## 🔍 Finding Files

### Looking for a Page?
- Check `app/[page-name]/page.tsx`
- Example: Login page = `app/login/page.tsx`

### Looking for an API?
- Check `app/api/[endpoint]/route.ts`
- Example: Register API = `app/api/auth/register/route.ts`

### Looking for Components?
- Check `components/` directory
- Example: Header = `components/layout/Header.tsx`

### Looking for Database Models?
- Check `prisma/schema.prisma`
- All tables and relationships are defined here

## ✅ Quick Checklist

Before running, make sure:
- [ ] `node_modules/` folder exists (run `npm install`)
- [ ] `.env` file exists with `DATABASE_URL`
- [ ] PostgreSQL database is created
- [ ] Database tables are created (`npx prisma db push`)

## 🆘 Common Issues

**"Cannot find module"**
- Solution: Run `npm install`

**"Database connection failed"**
- Solution: Check `.env` file `DATABASE_URL`

**"Page not found"**
- Solution: Make sure you're accessing correct URL (e.g., `/register` not `/register.html`)

**"Prisma client not generated"**
- Solution: Run `npx prisma generate`

## 📚 Next Steps

1. Install dependencies: `npm install`
2. Set up database: See `POSTGRESQL_SETUP_GUIDE.md`
3. Run the app: `npm run dev`
4. Test registration: Visit http://localhost:3000/register





























