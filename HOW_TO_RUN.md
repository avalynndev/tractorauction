# How to Run the Tractor Auction Application

## ✅ Step 1: Install Dependencies (DONE!)
Dependencies have been installed. You should see a `node_modules/` folder now.

## ✅ Step 2: Set Up Database

1. **Make sure PostgreSQL is running**
2. **Create the database:**
   ```bash
   psql -U postgres
   CREATE DATABASE tractorauction;
   \q
   ```

3. **Update .env file:**
   - Open `.env` file in the project root
   - Update `DATABASE_URL` with your PostgreSQL password:
     ```env
     DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/tractorauction?schema=public"
     ```

4. **Create database tables:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## ✅ Step 3: Run the Application

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000
```

## ✅ Step 4: Open in Browser

Visit: **http://localhost:3000**

## 📂 Where Are the Files?

### Frontend Pages (What users see)
- `app/page.tsx` → Homepage
- `app/register/page.tsx` → Registration page
- `app/login/page.tsx` → Login page
- `app/auctions/page.tsx` → Auctions listing
- `app/preapproved/page.tsx` → Pre-approved vehicles
- `app/my-account/page.tsx` → User dashboard
- `app/sell/upload/page.tsx` → Vehicle upload form

### Backend API (Server-side code)
- `app/api/auth/register/route.ts` → Registration API
- `app/api/auth/login/route.ts` → Login API
- `app/api/auth/verify-otp/route.ts` → OTP verification API
- `app/api/vehicles/upload/route.ts` → Vehicle upload API
- `app/api/vehicles/preapproved/route.ts` → Get pre-approved vehicles
- `app/api/auctions/route.ts` → Get auctions

### Components (Reusable UI)
- `components/layout/Header.tsx` → Navigation header
- `components/layout/Footer.tsx` → Footer

### Database
- `prisma/schema.prisma` → Database structure
- `lib/prisma.ts` → Database connection

## 🎯 Quick Test

1. Start the server: `npm run dev`
2. Open browser: http://localhost:3000
3. Click "Register" button
4. Fill the registration form
5. Check if it works!

## 🔧 Available Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Check code quality
npx prisma studio    # Open database GUI
npx prisma db push   # Update database schema
```

## 📍 Important Notes

- **No separate frontend/backend folders** - Next.js combines both
- **Frontend** = `app/` directory (all `page.tsx` files)
- **Backend** = `app/api/` directory (all `route.ts` files)
- **One command runs everything**: `npm run dev`

## 🆘 Troubleshooting

**Port 3000 already in use?**
```bash
# Use a different port
npm run dev -- -p 3001
```

**Database connection error?**
- Check PostgreSQL is running
- Verify `.env` file has correct `DATABASE_URL`
- Make sure database `tractorauction` exists

**Module not found?**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

## ✅ You're Ready!

Everything is set up. Just:
1. Update `.env` with your database password
2. Run `npx prisma db push`
3. Run `npm run dev`
4. Open http://localhost:3000

That's it! 🎉





























