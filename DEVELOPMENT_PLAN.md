# Tractor Auction Website - Development Plan

## Project Overview
A mobile-responsive web application for auctioning used tractors, harvesters, and scrap tractors. The platform supports both sellers and buyers with membership tiers, auction bidding, and pre-approved direct sales.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui or custom components
- **State Management**: React Context API / Zustand
- **Forms**: React Hook Form with Zod validation
- **Image Upload**: Cloudinary or AWS S3

### Backend
- **API**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with OTP verification
- **Real-time**: WebSockets (Socket.io) for live bidding
- **Payment**: Razorpay or Stripe for membership payments

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway/Supabase (database)
- **File Storage**: Cloudinary or AWS S3
- **Email/SMS**: Twilio or AWS SES for OTP

## Development Phases

### Phase 1: Project Setup & Foundation (Week 1)
1. Initialize Next.js project with TypeScript
2. Set up Tailwind CSS and component library
3. Configure Prisma with PostgreSQL
4. Create database schema
5. Set up authentication middleware
6. Create basic layout with header/footer

### Phase 2: User Management (Week 2)
1. Registration page with all required fields
2. OTP-based login system
3. User profile management
4. Account activation workflow
5. Session management

### Phase 3: Membership System (Week 3)
1. Membership model and database
2. 15-day free trial implementation
3. Membership purchase flow
4. Membership status tracking
5. Membership expiry handling

### Phase 4: Seller Features (Week 4-5)
1. Vehicle upload form (all fields)
2. Image upload and management
3. Bulk upload with CSV/Excel
4. Vehicle listing management
5. Auction vs Pre-approved selection
6. Vehicle status tracking

### Phase 5: Buyer Features (Week 6)
1. Pre-approved vehicles listing page
2. Vehicle detail pages
3. Search and filter functionality
4. Favorites/watchlist

### Phase 6: Auction System (Week 7-8)
1. Admin auction management
2. Live auction interface
3. Real-time bidding with WebSockets
4. Bid increment logic
5. Auction timer
6. Highest bidder tracking
7. Seller approval workflow

### Phase 7: My Account Dashboard (Week 9)
1. Sell/Buy tabs
2. Membership details display
3. Vehicle status (selling/buying)
4. Bid history
5. Purchase history
6. Personal details management

### Phase 8: Static Pages & UI Polish (Week 10)
1. How It Works page
2. Why Choose Us page
3. Contact Us page
4. Homepage
5. Mobile responsiveness
6. Logo and favicon

### Phase 9: Admin Panel (Week 11)
1. Vehicle verification interface
2. Auction scheduling
3. User management
4. Reports and analytics

### Phase 10: Testing & Deployment (Week 12)
1. Unit testing
2. Integration testing
3. Security audit
4. Performance optimization
5. Production deployment
6. Documentation

## Database Schema

### Users Table
- id, fullName, phoneNumber, whatsappNumber, address, city, district, state, pincode
- email, passwordHash, role (buyer/seller/admin)
- isActive, createdAt, updatedAt

### Memberships Table
- id, userId, membershipType (trial/silver/gold/diamond)
- startDate, endDate, amount, status
- createdAt, updatedAt

### Vehicles Table
- id, sellerId, vehicleType, saleType (auction/preapproved)
- saleAmount, basePrice, tractorBrand, engineHP, yearOfMfg
- registrationNumber, engineNumber, chassisNumber, hoursRun
- state, runningCondition, insuranceStatus, rcCopyStatus
- rcCopyType, readyForToken, clutchType, ipto, drive, steering
- tyreBrand, otherFeatures, confirmationMessage
- status (pending/approved/rejected/auction/sold)
- mainPhoto, subPhotos (JSON array)
- createdAt, updatedAt

### Auctions Table
- id, vehicleId, startTime, endTime, currentBid, reservePrice
- minimumIncrement, status (scheduled/live/ended)
- winnerId, sellerApprovalStatus
- createdAt, updatedAt

### Bids Table
- id, auctionId, bidderId, bidAmount, bidTime
- isWinningBid, createdAt

## Key Features Implementation

### Authentication Flow
1. User registers with all details
2. OTP sent to mobile number
3. Account activated after OTP verification
4. Login with mobile number + OTP
5. JWT token issued for session

### Membership Flow
1. New users get 15-day free trial automatically
2. Before trial expiry, prompt for membership purchase
3. Three membership tiers with different validity
4. Check membership status on each protected route

### Auction Flow
1. Seller lists vehicle as "Auction"
2. Admin verifies and schedules auction
3. Auction goes live at scheduled time
4. Buyers bid with minimum increment
5. Auction ends, highest bidder selected
6. Seller approves/rejects bid
7. If approved, payment and transfer process

### Pre-approved Flow
1. Seller lists vehicle as "Pre-approved"
2. Admin verifies
3. Vehicle appears in Pre-approved listing
4. Buyer purchases directly at listed price

## Security Considerations
- Input validation on all forms
- SQL injection prevention (Prisma)
- XSS protection
- CSRF tokens
- Rate limiting on API routes
- Secure file uploads
- OTP expiration and validation
- JWT token expiration

## Mobile Responsiveness
- Mobile-first design approach
- Touch-friendly buttons and inputs
- Responsive image galleries
- Mobile-optimized auction interface
- Progressive Web App (PWA) capabilities

## Future Enhancements
- Android app development
- Push notifications
- Advanced search and filters
- Vehicle inspection reports
- Payment gateway integration
- Escrow services
- Rating and review system
- Analytics dashboard

