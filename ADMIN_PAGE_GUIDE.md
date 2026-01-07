# Admin Page Guide

## Overview

The admin page allows administrators to review and approve/reject vehicle listings submitted by sellers.

## Access

- **URL:** http://localhost:3000/admin
- **Access:** Only users with `role = "ADMIN"` can access
- **Authentication:** Must be logged in

## Features

### 1. View Pending Vehicles
- Lists all vehicles with status "PENDING"
- Shows vehicle cards with:
  - Vehicle photo
  - Brand, HP, Year
  - State, Type, Sale Type
  - Sale Amount
  - Seller information

### 2. View Vehicle Details
- Click "View Details" button
- Opens modal with complete vehicle information:
  - All vehicle specifications
  - Seller contact information
  - Vehicle photos

### 3. Approve Vehicle
- Click green checkmark (✓) button
- Or click "Approve Vehicle" in details modal
- Vehicle status changes to "APPROVED"
- Vehicle becomes visible in listings (Auctions or Pre-approved)

### 4. Reject Vehicle
- Click red X button
- Or click "Reject Vehicle" in details modal
- Vehicle status changes to "REJECTED"
- Vehicle is removed from pending list

## API Endpoints

### Get Pending Vehicles
```
GET /api/admin/vehicles/pending
Authorization: Bearer <token>
```

### Get Vehicle Details
```
GET /api/admin/vehicles/[id]
Authorization: Bearer <token>
```

### Approve Vehicle
```
POST /api/admin/vehicles/[id]/approve
Authorization: Bearer <token>
```

### Reject Vehicle
```
POST /api/admin/vehicles/[id]/reject
Authorization: Bearer <token>
```

## Creating an Admin User

See `CREATE_ADMIN_USER.md` for detailed instructions.

**Quick method:**
1. Open Prisma Studio: `npx prisma studio`
2. Go to User table
3. Find your user
4. Change `role` to `ADMIN`
5. Save

## Workflow

1. **Seller uploads vehicle** → Status: PENDING
2. **Admin reviews** → Views details in admin panel
3. **Admin approves** → Status: APPROVED → Vehicle appears in listings
4. **OR Admin rejects** → Status: REJECTED → Vehicle hidden

## Vehicle Status Flow

```
PENDING → APPROVED → (AUCTION/SOLD)
     ↓
  REJECTED
```

## Security

- ✅ Admin-only access (role check)
- ✅ Authentication required
- ✅ Token validation
- ✅ Server-side authorization

## UI Features

- **Responsive Design:** Works on desktop and mobile
- **Card Layout:** Easy to scan multiple vehicles
- **Quick Actions:** Approve/Reject buttons on each card
- **Detail Modal:** Full vehicle information
- **Status Badges:** Clear visual indicators
- **Empty State:** Friendly message when no pending vehicles

## Next Steps

After approving a vehicle:
- If `saleType = "PREAPPROVED"` → Appears in Pre-approved listings
- If `saleType = "AUCTION"` → Admin can schedule auction (future feature)

## Troubleshooting

### "Access denied. Admin only."
- User role is not ADMIN
- Update user role in database

### "No pending vehicles"
- All vehicles have been reviewed
- Or no vehicles have been uploaded yet

### Can't see Admin link in header
- User is not logged in
- User role is not ADMIN
- Refresh page after updating role

## Summary

✅ Admin page created at `/admin`
✅ Lists all pending vehicles
✅ View full vehicle details
✅ Approve/reject functionality
✅ Admin-only access
✅ Secure API endpoints

The admin panel is ready to use! 🎉

