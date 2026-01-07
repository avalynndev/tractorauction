# Quick Start Guide - Tractor Auction Website

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NEXT_PUBLIC_APP_URL`: Your application URL

Optional (for full functionality):
- Cloudinary credentials (for image uploads)
- Twilio credentials (for SMS OTP)
- Razorpay credentials (for payments)

### 3. Set Up Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-otp/
│   ├── (dashboard)/         # Protected pages
│   │   └── my-account/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication APIs
│   │   ├── vehicles/       # Vehicle APIs
│   │   └── auctions/       # Auction APIs
│   ├── auctions/           # Auction pages
│   ├── preapproved/        # Pre-approved vehicles
│   ├── sell/               # Seller pages
│   ├── how-it-works/       # Static pages
│   ├── why-choose-us/
│   ├── contact/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/             # Reusable components
│   └── layout/            # Layout components
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/                    # Utilities
│   ├── prisma.ts          # Prisma client
│   └── auth.ts            # Auth utilities
├── prisma/                 # Database
│   └── schema.prisma      # Database schema
└── public/                 # Static files
```

## Key Features Implemented

### ✅ Completed
1. **Project Setup**
   - Next.js 14 with TypeScript
   - Tailwind CSS configuration
   - Prisma ORM with PostgreSQL schema

2. **Authentication System**
   - Registration with all required fields
   - OTP-based login
   - JWT token management
   - User verification flow

3. **User Interface**
   - Responsive header with contact number
   - Footer with social media links
   - Homepage with features
   - Static pages (How It Works, Why Choose Us, Contact Us)

4. **My Account Dashboard**
   - Sell/Buy tabs
   - Membership display
   - Personal details section

5. **Seller Features**
   - Comprehensive vehicle upload form
   - All required vehicle fields
   - Image upload support

6. **Buyer Features**
   - Pre-approved vehicles listing
   - Auction listing page
   - Vehicle cards with details

### 🚧 In Progress / To Do
1. **Membership System**
   - 15-day free trial implementation
   - Membership purchase flow
   - Payment integration

2. **Auction System**
   - Real-time bidding with WebSockets
   - Live auction interface
   - Bid increment logic
   - Seller approval workflow

3. **Admin Panel**
   - Vehicle verification
   - Auction scheduling
   - User management

4. **File Upload**
   - Cloudinary/S3 integration
   - Image optimization

5. **SMS Integration**
   - Twilio setup for OTP

## Development Workflow

### Running Locally
```bash
# Development server
npm run dev

# Database migrations
npm run db:migrate

# Prisma Studio (database GUI)
npm run db:studio
```

### Building for Production
```bash
npm run build
npm start
```

## Database Models

### User
- Registration details (name, phone, address, etc.)
- Role (BUYER/SELLER/ADMIN)
- Account status

### Membership
- Type (TRIAL/SILVER/GOLD/DIAMOND)
- Start/end dates
- Status

### Vehicle
- All vehicle specifications
- Sale type (AUCTION/PREAPPROVED)
- Status (PENDING/APPROVED/etc.)
- Photos

### Auction
- Vehicle reference
- Start/end times
- Current bid
- Minimum increment
- Status

### Bid
- Auction reference
- Bidder
- Bid amount
- Timestamp

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/resend-otp` - Resend OTP

### User
- `GET /api/user/me` - Get current user (protected)

### Vehicles
- `POST /api/vehicles/upload` - Upload vehicle (protected)
- `GET /api/vehicles/preapproved` - Get pre-approved vehicles

### Auctions
- `GET /api/auctions` - Get active auctions

## Next Steps

1. **Set up database**: Create PostgreSQL database and update `.env`
2. **Run migrations**: `npx prisma db push`
3. **Test registration**: Register a test user
4. **Configure SMS**: Set up Twilio for OTP
5. **Configure file upload**: Set up Cloudinary or S3
6. **Implement real-time bidding**: Add WebSocket support
7. **Add payment gateway**: Integrate Razorpay
8. **Build admin panel**: Create admin interface

## Support

- **Phone**: 7801094747
- **Email**: contact@tractorauction.in
- **Website**: www.tractorauction.in

## Documentation

- `DEVELOPMENT_PLAN.md` - Detailed development plan
- `STEP_BY_STEP_GUIDE.md` - Step-by-step implementation guide
- `README.md` - Project overview






























