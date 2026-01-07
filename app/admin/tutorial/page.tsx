"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Download, FileText, Users, Gavel, Package, Settings, ArrowLeft, ChevronDown, ChevronUp, Building2, UserCheck, FileCheck } from "lucide-react";
import toast from "react-hot-toast";

type DocumentCategory = "all" | "kyc" | "buyer" | "seller" | "dealer" | "auction" | "preapproved" | "admin" | "workflow";

export default function TutorialPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>("all");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["kyc-overview"]));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const downloadDocument = (category: DocumentCategory) => {
    const content = generateDocumentContent(category);
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TractorAuction_${category === "all" ? "Complete" : category}_Documentation_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${category === "all" ? "Complete" : category} documentation`);
  };

  const generateDocumentContent = (category: DocumentCategory): string => {
    let content = "";
    
    if (category === "all" || category === "kyc") {
      content += generateKYCDocumentation();
    }
    
    if (category === "all" || category === "buyer") {
      content += generateBuyerDocumentation();
    }
    
    if (category === "all" || category === "seller") {
      content += generateSellerDocumentation();
    }
    
    if (category === "all" || category === "dealer") {
      content += generateDealerDocumentation();
    }
    
    if (category === "all" || category === "auction") {
      content += generateAuctionDocumentation();
    }
    
    if (category === "all" || category === "preapproved") {
      content += generatePreapprovedDocumentation();
    }
    
    if (category === "all" || category === "admin") {
      content += generateAdminDocumentation();
    }
    
    if (category === "all" || category === "workflow") {
      content += generateWorkflowDocumentation();
    }
    
    return content;
  };

  const generateKYCDocumentation = (): string => {
    return `
================================================================================
KYC (KNOW YOUR CUSTOMER) DOCUMENTATION
================================================================================

OVERVIEW
--------
KYC (Know Your Customer) is a mandatory process to verify the identity of all users
registering on the Tractor Auction platform. This ensures security, compliance, and
builds trust in the marketplace.

IDENTIFICATION NUMBER SYSTEM
-----------------------------
Every registered user receives a unique Identification Number:
- Format: TA-YYYYMMDD-XXXX
  * TA = Tractor Auction prefix
  * YYYYMMDD = Registration date (e.g., 20241215)
  * XXXX = 4-digit sequential number (0001-9999)
- Example: TA-20241215-0001
- Uniqueness: Each identification number is unique and cannot be duplicated
- Purpose: Used for tracking, support, and verification purposes

================================================================================
BUYER KYC DETAILS
================================================================================

REQUIRED INFORMATION DURING REGISTRATION:
-----------------------------------------
1. Personal Information
   - Full Name (Minimum 2 characters)
   - Phone Number (10-digit, must start with 6-9)
   - WhatsApp Number (10-digit, must start with 6-9)
   - Email Address (Optional but recommended)

2. Address Information
   - Complete Address (Minimum 5 characters)
   - City (Required)
   - District (Required)
   - State (Required - Selected from Indian States list)
   - Pincode (6-digit code)

3. Role Selection
   - Role: BUYER
   - Purpose: To purchase tractors through auctions or pre-approved listings

4. Verification Process
   - OTP sent to registered phone number
   - 6-digit OTP verification required
   - OTP valid for 10 minutes
   - Account activated after successful OTP verification

STORED KYC DATA:
---------------
- User ID (Unique CUID)
- Full Name
- Phone Number (Unique, indexed)
- WhatsApp Number
- Email (Optional, unique if provided)
- Complete Address
- City
- District
- State
- Pincode
- Identification Number (TA-YYYYMMDD-XXXX format)
- Role: BUYER
- Account Status: isActive (false until OTP verified)
- Profile Photo (Optional, can be uploaded later)
- Created At & Updated At timestamps

BUYER CAPABILITIES:
------------------
- Browse pre-approved vehicles
- Participate in live auctions
- Place bids on auction vehicles
- Add vehicles to watchlist
- Shortlist vehicles for comparison
- View vehicle details
- Contact sellers via chat
- Purchase pre-approved vehicles
- View purchase history
- Leave reviews for purchased vehicles
- Access RTO details (Gold/Diamond members only)

MEMBERSHIP TIERS FOR BUYERS:
---------------------------
1. TRIAL (Default)
   - Basic access to browse vehicles
   - Limited features

2. SILVER
   - Enhanced browsing capabilities
   - Priority support

3. GOLD
   - Access to RTO details lookup
   - Priority bidding
   - Enhanced features

4. DIAMOND
   - Full access including RTO details
   - Premium support
   - All platform features

================================================================================
SELLER KYC DETAILS
================================================================================

REQUIRED INFORMATION DURING REGISTRATION:
-----------------------------------------
1. Personal Information
   - Full Name (Minimum 2 characters)
   - Phone Number (10-digit, must start with 6-9)
   - WhatsApp Number (10-digit, must start with 6-9)
   - Email Address (Optional but recommended)

2. Address Information
   - Complete Address (Minimum 5 characters)
   - City (Required)
   - District (Required)
   - State (Required - Selected from Indian States list)
   - Pincode (6-digit code)

3. Role Selection
   - Role: SELLER
   - Purpose: To list and sell tractors through auctions or pre-approved listings

4. Verification Process
   - OTP sent to registered phone number
   - 6-digit OTP verification required
   - OTP valid for 10 minutes
   - Account activated after successful OTP verification

STORED KYC DATA:
---------------
- User ID (Unique CUID)
- Full Name
- Phone Number (Unique, indexed)
- WhatsApp Number
- Email (Optional, unique if provided)
- Complete Address
- City
- District
- State
- Pincode
- Identification Number (TA-YYYYMMDD-XXXX format)
- Role: SELLER
- Account Status: isActive (false until OTP verified)
- Profile Photo (Optional, can be uploaded later)
- Created At & Updated At timestamps

SELLER CAPABILITIES:
-------------------
- List vehicles for sale (Auction or Pre-approved)
- Upload vehicle details and photos
- Set sale price or reserve price
- Manage vehicle listings
- View vehicle status (Pending, Approved, Rejected, Auction, Sold)
- Receive notifications for:
  * Vehicle approval/rejection
  * Auction scheduling
  * Auction start/end
  * Bid placements
  * Purchase confirmations
- Approve/reject auction winners
- View sales history
- Chat with potential buyers

VEHICLE LISTING REQUIREMENTS:
----------------------------
When listing a vehicle, sellers must provide:
- Vehicle Type (Used Tractor, Used Harvester, Scrap Tractor)
- Sale Type (Auction or Pre-approved)
- Sale Amount / Base Price
- Tractor Brand & Model
- Engine HP
- Year of Manufacturing
- Registration Number (Optional)
- Engine Number (Optional)
- Chassis Number (Optional)
- Hours Run (Optional)
- State & District
- Running Condition
- Insurance Status
- RC Copy Status & Type
- Main Photo (Required)
- Sub Photos (Multiple)
- Additional features (Clutch Type, IPTO, Drive, Steering, Tyre Brand, etc.)

================================================================================
DEALER KYC DETAILS
================================================================================

REQUIRED INFORMATION DURING REGISTRATION:
-----------------------------------------
1. Personal Information
   - Full Name (Minimum 2 characters)
   - Phone Number (10-digit, must start with 6-9)
   - WhatsApp Number (10-digit, must start with 6-9)
   - Email Address (Optional but recommended)

2. Address Information
   - Complete Address (Minimum 5 characters)
   - City (Required)
   - District (Required)
   - State (Required - Selected from Indian States list)
   - Pincode (6-digit code)

3. Role Selection
   - Role: DEALER
   - Purpose: To both buy and sell tractors (dual functionality)

4. Verification Process
   - OTP sent to registered phone number
   - 6-digit OTP verification required
   - OTP valid for 10 minutes
   - Account activated after successful OTP verification

STORED KYC DATA:
---------------
- User ID (Unique CUID)
- Full Name
- Phone Number (Unique, indexed)
- WhatsApp Number
- Email (Optional, unique if provided)
- Complete Address
- City
- District
- State
- Pincode
- Identification Number (TA-YYYYMMDD-XXXX format)
- Role: DEALER
- Account Status: isActive (false until OTP verified)
- Profile Photo (Optional, can be uploaded later)
- Created At & Updated At timestamps

DEALER CAPABILITIES:
-------------------
Dealers have combined capabilities of both Buyers and Sellers:
- All Buyer capabilities (browse, bid, purchase, etc.)
- All Seller capabilities (list vehicles, manage sales, etc.)
- Bulk operations (if implemented)
- Business account features
- Enhanced reporting and analytics

================================================================================
KYC VERIFICATION WORKFLOW
================================================================================

STEP 1: REGISTRATION
-------------------
1. User visits /register page
2. Selects role (BUYER, SELLER, or DEALER)
3. Fills in all required KYC fields
4. Submits registration form
5. System validates all fields:
   - Phone number format (10 digits, starts with 6-9)
   - Email format (if provided)
   - Pincode format (6 digits)
   - Address minimum length
   - All required fields present

STEP 2: OTP GENERATION
---------------------
1. System generates unique identification number (TA-YYYYMMDD-XXXX)
2. System generates 6-digit OTP
   - Development/Test mode: Always 999999
   - Production: Random 6-digit number
3. OTP stored with 10-minute expiry
4. OTP sent via SMS to registered phone number
5. User redirected to /verify-otp page

STEP 3: OTP VERIFICATION
-----------------------
1. User enters 6-digit OTP
2. System validates:
   - OTP matches stored OTP
   - OTP not expired (within 10 minutes)
3. If valid:
   - User account activated (isActive = true)
   - JWT token generated
   - User redirected to appropriate dashboard
4. If invalid:
   - Error message displayed
   - Option to resend OTP

STEP 4: ACCOUNT ACTIVATION
-------------------------
1. Account status changed to active
2. User can now:
   - Access platform features
   - List vehicles (if Seller/Dealer)
   - Participate in auctions (if Buyer/Dealer)
   - Update profile information

================================================================================
DATA SECURITY & PRIVACY
================================================================================

PROTECTED INFORMATION:
--------------------
- Phone numbers are unique and indexed for quick lookup
- Email addresses are unique (if provided) and indexed
- Identification numbers are unique and indexed
- Passwords are hashed (if password-based auth is implemented)
- OTPs are temporary and expire after 10 minutes

DATA RETENTION:
-------------
- User data is retained as long as account is active
- Identification numbers are permanent and cannot be changed
- Profile photos are stored securely
- All timestamps (createdAt, updatedAt) are maintained

COMPLIANCE:
----------
- KYC data collection follows Indian regulations
- User consent obtained during registration
- Data used only for platform operations
- Users can update their information via My Account page

================================================================================
END OF KYC DOCUMENTATION
================================================================================

`;
  };

  const generateBuyerDocumentation = (): string => {
    return `
================================================================================
BUYER ROLE DOCUMENTATION
================================================================================

OVERVIEW
--------
Buyers are users who register to purchase tractors through the platform.
They can participate in auctions or buy pre-approved vehicles.

REGISTRATION PROCESS
-------------------
1. Visit /register page
2. Select "Buy Tractors" role
3. Complete KYC form (see KYC Documentation)
4. Verify OTP
5. Account activated

KEY PAGES & FEATURES
-------------------
1. Home Page (/)
   - Browse featured vehicles
   - Quick access to auctions and pre-approved vehicles
   - Voice search capability

2. Pre-Approved Vehicles (/preapproved)
   - Browse all pre-approved listings
   - Search and filter vehicles
   - Quick View and Detailed View options
   - Compare vehicles
   - Voice search

3. Auctions Page (/auctions)
   - Live Auctions tab
   - Upcoming Auctions tab
   - View auction details
   - Place bids on live auctions
   - Voice search

4. Live Auction Detail (/auctions/[id]/live)
   - View complete vehicle details
   - Real-time bid updates
   - Place bids
   - View bidding history
   - Complete Vehicle Details button

5. My Account (/my-account)
   - Personal Details
   - Membership Details
   - Purchase History
   - Bid History
   - Watchlist
   - Shortlisted Items
   - Security Settings

BUYER WORKFLOW
-------------
1. Registration & KYC Verification
2. Browse Vehicles (Pre-approved or Auctions)
3. Search/Filter vehicles by:
   - Brand, Model, HP, Year
   - Price range
   - Location (State, District)
   - Condition
4. View Vehicle Details
5. Add to Watchlist or Shortlist
6. For Pre-approved: Direct Purchase
7. For Auctions: Place Bids
8. Win Auction or Complete Purchase
9. Complete Payment (external process)
10. Receive Vehicle

MEMBERSHIP BENEFITS
------------------
- TRIAL: Basic access
- SILVER: Enhanced features
- GOLD: RTO lookup access, priority bidding
- DIAMOND: Full access, premium support

NOTIFICATIONS
------------
Buyers receive notifications for:
- Auction start/end
- Bid placed successfully
- Outbid notifications
- Auction won
- Purchase confirmations
- Membership expiry

================================================================================
END OF BUYER DOCUMENTATION
================================================================================

`;
  };

  const generateSellerDocumentation = (): string => {
    return `
================================================================================
SELLER ROLE DOCUMENTATION
================================================================================

OVERVIEW
--------
Sellers are users who register to list and sell tractors on the platform.
They can list vehicles for auction or as pre-approved sales.

REGISTRATION PROCESS
-------------------
1. Visit /register page
2. Select "Sell Tractors" role
3. Complete KYC form (see KYC Documentation)
4. Verify OTP
5. Account activated

KEY PAGES & FEATURES
-------------------
1. List Your Vehicle (/sell/upload)
   - Upload vehicle details
   - Select sale type (Auction or Pre-approved)
   - Upload photos
   - Set pricing
   - Submit for approval

2. My Account (/my-account)
   - View listed vehicles
   - Check vehicle status
   - View sales history
   - Manage profile

3. Vehicle Status Tracking
   - PENDING: Awaiting admin approval
   - APPROVED: Listed and visible
   - REJECTED: Not approved (with reason)
   - AUCTION: Active auction
   - SOLD: Vehicle sold

SELLER WORKFLOW
--------------
1. Registration & KYC Verification
2. Navigate to "List Your Vehicle"
3. Fill vehicle details form:
   - Basic Information (Type, Brand, Model, HP, Year)
   - Vehicle Numbers (Registration, Engine, Chassis)
   - Location & Condition
   - Photos (Main + Sub photos)
   - Sale Type & Pricing
4. Submit for Admin Review
5. Admin Reviews Vehicle
6. If Approved:
   - Pre-approved: Listed immediately
   - Auction: Admin schedules auction
7. Vehicle Listed
8. Receive Bids/Purchases
9. For Auctions: Approve/Reject Winner
10. Complete Sale Transaction

VEHICLE LISTING FORM FIELDS
---------------------------
Required Fields:
- Vehicle Type (Used Tractor/Harvester/Scrap)
- Sale Type (Auction/Pre-approved)
- Tractor Brand
- Tractor Model
- Engine HP
- Year of Manufacturing
- Sale Amount / Base Price
- State
- District
- Running Condition
- Insurance Status
- RC Copy Status
- Main Photo

Optional Fields:
- Registration Number
- Engine Number
- Chassis Number
- Hours Run
- RC Copy Type
- Finance NOC Papers
- Ready for Token
- Clutch Type
- IPTO
- Drive
- Steering
- Tyre Brand
- Other Features
- Sub Photos (multiple)

ADMIN APPROVAL PROCESS
---------------------
1. Seller submits vehicle
2. Vehicle status: PENDING
3. Admin reviews in /admin page
4. Admin can:
   - Approve (sets status to APPROVED)
   - Reject (sets status to REJECTED with reason)
   - For Auctions: Set start/end times, reserve price, increment
5. If approved:
   - Pre-approved: Visible on /preapproved page
   - Auction: Admin creates auction record

NOTIFICATIONS
------------
Sellers receive notifications for:
- Vehicle approved
- Vehicle rejected (with reason)
- Auction scheduled
- Auction started
- Auction ended
- Bid placed on auction
- Auction winner selected
- Purchase completed

================================================================================
END OF SELLER DOCUMENTATION
================================================================================

`;
  };

  const generateDealerDocumentation = (): string => {
    return `
================================================================================
DEALER ROLE DOCUMENTATION
================================================================================

OVERVIEW
--------
Dealers are users who can both buy and sell tractors. They have combined
capabilities of Buyers and Sellers, making them ideal for business operations.

REGISTRATION PROCESS
-------------------
1. Visit /register page
2. Select "Buy & Sell Tractors" role
3. Complete KYC form (see KYC Documentation)
4. Verify OTP
5. Account activated

CAPABILITIES
-----------
Dealers have ALL capabilities of both Buyers and Sellers:

BUYER CAPABILITIES:
- Browse pre-approved vehicles
- Participate in live auctions
- Place bids
- Add to watchlist/shortlist
- Purchase vehicles
- View purchase history
- Leave reviews
- Access RTO details (Gold/Diamond)

SELLER CAPABILITIES:
- List vehicles for sale
- Upload vehicle details
- Manage listings
- View sales history
- Approve/reject auction winners
- Chat with buyers

DEALER WORKFLOW
--------------
As a Seller:
1. List vehicles for sale
2. Manage inventory
3. Complete sales

As a Buyer:
1. Source vehicles for inventory
2. Participate in auctions
3. Purchase vehicles
4. Build inventory

BUSINESS FEATURES
---------------
- Dual role functionality
- Inventory management
- Sales and purchase tracking
- Business analytics (if implemented)
- Bulk operations (if implemented)

================================================================================
END OF DEALER DOCUMENTATION
================================================================================

`;
  };

  const generateAuctionDocumentation = (): string => {
    return `
================================================================================
AUCTION SYSTEM DOCUMENTATION
================================================================================

OVERVIEW
--------
The auction system allows sellers to list vehicles for time-bound bidding,
where buyers compete by placing increasing bids until the auction ends.

AUCTION LIFECYCLE
----------------
1. SELLER lists vehicle with sale type: AUCTION
2. ADMIN reviews and approves vehicle
3. ADMIN schedules auction:
   - Start Time
   - End Time
   - Reserve Price (minimum bid)
   - Minimum Increment (bid step)
4. Auction Status: SCHEDULED
5. Auction becomes LIVE at start time
6. Buyers place bids
7. Auction ends at end time
8. Winner determined (highest bidder)
9. Seller approves/rejects winner
10. If approved: Sale completed

AUCTION STATUSES
---------------
- SCHEDULED: Created but not yet started
- LIVE: Currently active, accepting bids
- ENDED: Auction closed, winner determined

AUCTION DURATION RULES
---------------------
Default duration based on reserve price:
- < ₹2,00,000: 1 day
- ₹2,00,000 - ₹4,99,999: 2 days
- ≥ ₹5,00,000: 3 days

Admin can override these defaults.

MINIMUM BID INCREMENTS
---------------------
Default increments based on reserve price:
- < ₹1,00,000: ₹2,000
- ₹1,00,000 - ₹2,99,999: ₹5,000
- ₹3,00,000 - ₹6,99,999: ₹10,000
- ≥ ₹7,00,000: ₹20,000

Admin can set custom increments.

BIDDING PROCESS
--------------
1. Buyer views live auction
2. Current bid displayed
3. Buyer enters bid amount
4. System validates:
   - Bid > current bid + minimum increment
   - Bid > reserve price
   - Auction is LIVE
   - Buyer has active account
5. If valid: Bid placed, current bid updated
6. All participants notified
7. Previous highest bidder notified (if outbid)

SELLER APPROVAL WORKFLOW
-----------------------
After auction ends:
1. Winner automatically determined
2. Seller receives notification
3. Seller can:
   - APPROVE: Sale proceeds
   - REJECT: Provide rejection reason
4. If approved: Purchase record created
5. If rejected: Auction may be re-listed

ADMIN AUCTION MANAGEMENT
-----------------------
Admin can:
- View all auctions (/admin/auctions)
- Create missing auctions for approved vehicles
- Schedule auctions with custom times
- Set reserve prices and increments
- Monitor live auctions
- View auction history
- Manage auction settings

LIVE AUCTION PAGE FEATURES
-------------------------
- Real-time bid updates
- Countdown timer
- Current highest bid
- Bid history
- Complete vehicle details
- Place bid form
- Winner announcement (after end)

NOTIFICATIONS
------------
- Auction scheduled (to seller and potential bidders)
- Auction started (to all interested buyers)
- Bid placed (to seller and other bidders)
- Outbid notification (to previous highest bidder)
- Auction ended (to seller and winner)
- Winner approval/rejection (to winner)

================================================================================
END OF AUCTION DOCUMENTATION
================================================================================

`;
  };

  const generatePreapprovedDocumentation = (): string => {
    return `
================================================================================
PRE-APPROVED VEHICLES DOCUMENTATION
================================================================================

OVERVIEW
--------
Pre-approved vehicles are listings that are immediately available for purchase
at a fixed price, without the auction process.

LISTING PROCESS
--------------
1. SELLER lists vehicle with sale type: PREAPPROVED
2. Sets fixed sale amount
3. ADMIN reviews and approves
4. Vehicle immediately visible on /preapproved page
5. Buyers can purchase directly

PRE-APPROVED VS AUCTION
----------------------
PRE-APPROVED:
- Fixed price
- Immediate purchase
- No bidding
- Instant availability

AUCTION:
- Competitive bidding
- Time-bound
- Dynamic pricing
- Winner selection

BUYER WORKFLOW FOR PRE-APPROVED
------------------------------
1. Browse /preapproved page
2. Search/Filter vehicles
3. View vehicle details:
   - Quick View (modal)
   - Detailed View (full page)
4. Compare vehicles (if multiple selected)
5. Purchase vehicle
6. Complete payment
7. Receive vehicle

SELLER WORKFLOW FOR PRE-APPROVED
-------------------------------
1. List vehicle with PREAPPROVED sale type
2. Set sale amount
3. Submit for approval
4. Admin approves
5. Vehicle listed
6. Receive purchase requests
7. Complete sale

ADMIN APPROVAL
-------------
Admin reviews pre-approved vehicles same as auction vehicles:
- Verify vehicle details
- Check photos
- Approve or reject
- No scheduling needed (unlike auctions)

FEATURES
-------
- Quick View modal
- Detailed View page
- Comparison tool
- Search and filters
- Voice search
- Watchlist
- Shortlist

================================================================================
END OF PRE-APPROVED DOCUMENTATION
================================================================================

`;
  };

  const generateAdminDocumentation = (): string => {
    return `
================================================================================
ADMIN ROLE DOCUMENTATION
================================================================================

OVERVIEW
--------
Admins manage the entire platform, including vehicle approvals, auction
scheduling, user management, and system oversight.

ADMIN PAGES
----------
1. Admin Dashboard (/admin)
   - Pending vehicle approvals
   - Bulk operations
   - Filters (State, District)
   - Vehicle details modal
   - Approve/Reject actions

2. Manage Auctions (/admin/auctions)
   - View all auctions
   - Create missing auctions
   - Schedule auctions
   - Monitor live auctions

3. Reports (/admin/reports)
   - Platform analytics
   - User statistics
   - Sales reports
   - Auction performance

4. Chat Support (/admin/chat)
   - User support tickets
   - Chat management
   - Issue resolution

5. Tutorial (/admin/tutorial)
   - Complete documentation
   - Downloadable guides
   - Training materials

ADMIN CAPABILITIES
-----------------
VEHICLE MANAGEMENT:
- Review pending vehicles
- Approve vehicles
- Reject vehicles (with reason)
- Set auction parameters
- Bulk approve/reject
- Filter by location
- View complete vehicle details

AUCTION MANAGEMENT:
- Create auction records
- Schedule auction times
- Set reserve prices
- Set minimum increments
- Monitor live auctions
- View auction history

USER MANAGEMENT:
- View user details
- Manage user accounts
- Handle support requests
- Monitor platform activity

SYSTEM MANAGEMENT:
- View reports and analytics
- Manage platform settings
- Handle disputes
- Ensure compliance

VEHICLE APPROVAL PROCESS
-----------------------
1. Seller submits vehicle
2. Vehicle appears in /admin (status: PENDING)
3. Admin reviews:
   - Vehicle details
   - Photos
   - Documentation
   - Pricing
4. Admin actions:
   - APPROVE:
     * Pre-approved: Status → APPROVED, visible immediately
     * Auction: Status → APPROVED, create auction record
   - REJECT:
     * Status → REJECTED
     * Provide rejection reason
     * Seller notified

BULK OPERATIONS
-------------
- Select multiple vehicles
- Bulk approve
- Bulk create auctions
- Apply bulk auction settings
- Filter by state/district

AUCTION SCHEDULING
----------------
For auction vehicles:
1. Admin sets:
   - Start Date & Time
   - End Date & Time
   - Reserve Price (if different from base price)
   - Minimum Increment
2. System creates auction record
3. Auction scheduled
4. Auto-starts at start time
5. Auto-ends at end time

CERTIFIED & FINANCE BADGES
--------------------------
Admin can mark vehicles with:
- Certified badge (quality assurance)
- Finance Available badge (financing options)

These badges appear on vehicle listings.

================================================================================
END OF ADMIN DOCUMENTATION
================================================================================

`;
  };

  const generateWorkflowDocumentation = (): string => {
    return `
================================================================================
BUSINESS WORKFLOW DOCUMENTATION
================================================================================

OVERALL PLATFORM FLOW
--------------------

┌─────────────────────────────────────────────────────────────────┐
│                    USER REGISTRATION                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │  BUYER   │  │  SELLER  │  │  DEALER   │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│       │             │             │                             │
│       └─────────────┴─────────────┘                            │
│                    │                                            │
│              KYC VERIFICATION                                   │
│              (OTP Process)                                      │
│                    │                                            │
│              ACCOUNT ACTIVATED                                  │
└────────────────────┼────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐              ┌─────▼─────┐
   │  BUYER  │              │  SELLER   │
   │  FLOW   │              │   FLOW    │
   └────┬────┘              └─────┬─────┘
        │                         │
        │                         │
┌───────▼─────────────────────────▼──────────┐
│         PLATFORM OPERATIONS                │
└───────────────────────────────────────────┘

SELLER WORKFLOW
---------------

1. REGISTRATION
   └─> KYC Verification
       └─> Account Activated

2. LIST VEHICLE
   └─> Fill Vehicle Form (/sell/upload)
       └─> Select Sale Type (Auction/Pre-approved)
           └─> Upload Details & Photos
               └─> Submit for Approval

3. ADMIN REVIEW
   └─> Vehicle Status: PENDING
       └─> Admin Reviews
           ├─> APPROVE
           │   ├─> Pre-approved: Status → APPROVED, Listed
           │   └─> Auction: Status → APPROVED, Auction Created
           └─> REJECT
               └─> Status → REJECTED, Reason Provided

4. VEHICLE LISTED
   ├─> Pre-approved: Available for Purchase
   └─> Auction: Scheduled, Becomes LIVE

5. SALE PROCESS
   ├─> Pre-approved: Direct Purchase
   └─> Auction: Bidding → Winner → Seller Approval

6. SALE COMPLETED
   └─> Status → SOLD

BUYER WORKFLOW
-------------

1. REGISTRATION
   └─> KYC Verification
       └─> Account Activated

2. BROWSE VEHICLES
   ├─> Pre-approved (/preapproved)
   └─> Auctions (/auctions)

3. SEARCH & FILTER
   └─> Find Desired Vehicle

4. VIEW DETAILS
   ├─> Quick View (Modal)
   └─> Detailed View (Full Page)

5. DECISION
   ├─> Pre-approved: Purchase Directly
   └─> Auction: Place Bid

6. AUCTION PROCESS (if applicable)
   └─> Place Bids
       └─> Win Auction
           └─> Seller Approval
               └─> Purchase Confirmed

7. COMPLETE PURCHASE
   └─> Payment (External)
       └─> Receive Vehicle

AUCTION WORKFLOW
---------------

┌─────────────────────────────────────────┐
│  SELLER LISTS VEHICLE (Auction Type)    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ADMIN APPROVES & SCHEDULES AUCTION    │
│  - Start Time                           │
│  - End Time                             │
│  - Reserve Price                        │
│  - Minimum Increment                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AUCTION STATUS: SCHEDULED              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AUCTION BECOMES LIVE                    │
│  Status: LIVE                            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BUYERS PLACE BIDS                      │
│  - Validate bid amount                  │
│  - Update current bid                   │
│  - Notify participants                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  AUCTION ENDS                           │
│  Status: ENDED                          │
│  Winner: Highest Bidder                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  SELLER APPROVAL                        │
│  ├─> APPROVE: Sale Completed           │
│  └─> REJECT: Provide Reason            │
└─────────────────────────────────────────┘

PRE-APPROVED WORKFLOW
--------------------

┌─────────────────────────────────────────┐
│  SELLER LISTS VEHICLE (Pre-approved)   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ADMIN APPROVES                         │
│  Status: APPROVED                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  VEHICLE LISTED ON /preapproved         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BUYER BROWSES & SELECTS                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  BUYER PURCHASES                        │
│  Status: SOLD                           │
└─────────────────────────────────────────┘

DEPARTMENT-WISE WORKFLOWS
------------------------

SALES DEPARTMENT:
- Vehicle listing management
- Price negotiations
- Sale completion
- Customer communication

OPERATIONS DEPARTMENT:
- Vehicle verification
- Quality checks
- Documentation
- Logistics coordination

TECHNICAL DEPARTMENT:
- Platform maintenance
- Feature development
- Bug fixes
- System optimization

CUSTOMER SUPPORT:
- User assistance
- Issue resolution
- Chat support
- Query handling

ADMIN DEPARTMENT:
- Vehicle approvals
- Auction scheduling
- User management
- Platform oversight
- Reporting

================================================================================
END OF WORKFLOW DOCUMENTATION
================================================================================

`;
  };

  const categories: { id: DocumentCategory; label: string; icon: any }[] = [
    { id: "all", label: "Complete Documentation", icon: FileText },
    { id: "kyc", label: "KYC Details", icon: UserCheck },
    { id: "buyer", label: "Buyer Guide", icon: Users },
    { id: "seller", label: "Seller Guide", icon: Package },
    { id: "dealer", label: "Dealer Guide", icon: Building2 },
    { id: "auction", label: "Auction System", icon: Gavel },
    { id: "preapproved", label: "Pre-approved", icon: FileCheck },
    { id: "admin", label: "Admin Guide", icon: Settings },
    { id: "workflow", label: "Workflows", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
                  <BookOpen className="w-8 h-8" />
                  <span>Platform Tutorial & Documentation</span>
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  Complete reference guide for new employees and operations
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Download className="w-6 h-6 text-blue-600" />
            <span>Download Documentation</span>
          </h2>
          <p className="text-gray-600 mb-4">
            Download complete documentation by category. Files are updated automatically with the latest project information.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => downloadDocument(category.id)}
                  className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg border-2 border-blue-200 hover:border-blue-300 transition-all shadow-sm hover:shadow-md"
                >
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-800 text-sm">{category.label}</span>
                  <Download className="w-4 h-4 text-blue-600 ml-auto" />
                </button>
              );
            })}
          </div>
        </div>

        {/* KYC Documentation Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection("kyc-overview")}
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <UserCheck className="w-6 h-6 text-green-600" />
              <span>KYC (Know Your Customer) Documentation</span>
            </h2>
            {expandedSections.has("kyc-overview") ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </div>

          {expandedSections.has("kyc-overview") && (
            <div className="mt-6 space-y-6">
              {/* Identification Number System */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h3 className="font-bold text-blue-900 mb-2">Identification Number System</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  <li>Format: <strong>TA-YYYYMMDD-XXXX</strong></li>
                  <li>TA = Tractor Auction prefix</li>
                  <li>YYYYMMDD = Registration date (e.g., 20241215)</li>
                  <li>XXXX = 4-digit sequential number (0001-9999)</li>
                  <li>Example: <strong>TA-20241215-0001</strong></li>
                  <li>Each number is unique and permanent</li>
                </ul>
              </div>

              {/* Buyer KYC */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Buyer KYC Details</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Required Information:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Full Name (min 2 characters)</li>
                      <li>Phone Number (10-digit, starts with 6-9)</li>
                      <li>WhatsApp Number (10-digit)</li>
                      <li>Email Address (Optional)</li>
                      <li>Complete Address</li>
                      <li>City, District, State, Pincode</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Capabilities:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Browse pre-approved vehicles</li>
                      <li>Participate in live auctions</li>
                      <li>Place bids</li>
                      <li>Add to watchlist/shortlist</li>
                      <li>Purchase vehicles</li>
                      <li>Access RTO details (Gold/Diamond members)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seller KYC */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                  <Package className="w-5 h-5 text-green-600" />
                  <span>Seller KYC Details</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Required Information:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Full Name (min 2 characters)</li>
                      <li>Phone Number (10-digit, starts with 6-9)</li>
                      <li>WhatsApp Number (10-digit)</li>
                      <li>Email Address (Optional)</li>
                      <li>Complete Address</li>
                      <li>City, District, State, Pincode</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Capabilities:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>List vehicles for sale</li>
                      <li>Upload vehicle details and photos</li>
                      <li>Set sale price or reserve price</li>
                      <li>Manage vehicle listings</li>
                      <li>Approve/reject auction winners</li>
                      <li>View sales history</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Dealer KYC */}
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-3 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span>Dealer KYC Details</span>
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Required Information:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>Full Name (min 2 characters)</li>
                      <li>Phone Number (10-digit, starts with 6-9)</li>
                      <li>WhatsApp Number (10-digit)</li>
                      <li>Email Address (Optional)</li>
                      <li>Complete Address</li>
                      <li>City, District, State, Pincode</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Capabilities:</h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                      <li>All Buyer capabilities</li>
                      <li>All Seller capabilities</li>
                      <li>Dual role functionality</li>
                      <li>Business account features</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Verification Workflow */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-lg text-gray-900 mb-3">KYC Verification Workflow</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>Registration:</strong> User fills KYC form with all required details</li>
                  <li><strong>OTP Generation:</strong> System generates unique ID number and sends OTP via SMS</li>
                  <li><strong>OTP Verification:</strong> User enters 6-digit OTP (valid for 10 minutes)</li>
                  <li><strong>Account Activation:</strong> Account activated (isActive = true) after successful verification</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Additional Sections */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Key Pages</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• /admin - Vehicle approvals</li>
                <li>• /admin/auctions - Auction management</li>
                <li>• /admin/tutorial - This page</li>
                <li>• /auctions - Live & upcoming auctions</li>
                <li>• /preapproved - Pre-approved vehicles</li>
                <li>• /sell/upload - List vehicle</li>
                <li>• /my-account - User dashboard</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">User Roles</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>BUYER:</strong> Purchase vehicles</li>
                <li>• <strong>SELLER:</strong> List and sell vehicles</li>
                <li>• <strong>DEALER:</strong> Buy and sell vehicles</li>
                <li>• <strong>ADMIN:</strong> Platform management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This documentation is automatically generated and reflects the current state of the platform. 
            Download specific sections as needed for training and reference purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

























