# How to Create an Admin User

## Method 1: Using Prisma Studio (Easiest)

1. **Open Prisma Studio:**
   ```bash
   npx prisma studio
   ```

2. **Navigate to Users:**
   - Click on "User" in the left sidebar
   - Find the user you want to make admin

3. **Update Role:**
   - Click on the user
   - Find the "role" field
   - Change from "BUYER" or "SELLER" to "ADMIN"
   - Click "Save 1 change"

4. **Done!** ✅
   - User is now an admin
   - Can access `/admin` page

---

## Method 2: Using SQL (Direct Database)

1. **Connect to PostgreSQL:**
   ```bash
   psql -U postgres -d tractorauction
   ```

2. **Update User Role:**
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE "phoneNumber" = 'YOUR_PHONE_NUMBER';
   ```

3. **Verify:**
   ```sql
   SELECT id, "fullName", "phoneNumber", role FROM "User" WHERE role = 'ADMIN';
   ```

4. **Exit:**
   ```sql
   \q
   ```

---

## Method 3: Using pgAdmin

1. **Open pgAdmin**
2. **Connect to database**
3. **Navigate to:** `tractorauction` → `Schemas` → `public` → `Tables` → `User`
4. **Right-click** → `View/Edit Data` → `All Rows`
5. **Find your user** and update the `role` column to `ADMIN`
6. **Save**

---

## Method 4: Create New Admin User via Registration

1. **Register a new user** via the registration page
2. **After registration**, update the role to ADMIN using any method above

---

## Verify Admin Access

1. **Login** with the admin user
2. **Check header** - should see "Admin" button (purple)
3. **Click "Admin"** - should go to `/admin` page
4. **Should see** pending vehicles for approval

---

## Admin Features

Once you're an admin, you can:
- ✅ View all pending vehicles
- ✅ See vehicle details
- ✅ Approve vehicles
- ✅ Reject vehicles
- ✅ Access admin dashboard at `/admin`

---

## Quick Test

1. Create/update user to ADMIN role
2. Login with that user
3. Visit: http://localhost:3000/admin
4. Should see admin dashboard with pending vehicles

---

## Security Note

⚠️ **Important:** Only trusted users should have ADMIN role. Admin users can:
- Approve/reject all vehicle listings
- Access all vehicle data
- Potentially access user data

Make sure to secure admin accounts properly!





























