# How to Run the Fix Script - Step by Step

## Method 1: Using Browser Console (Easiest)

### Step 1: Open Your Application
1. Make sure your Next.js app is running (`npm run dev`)
2. Open your browser and go to: `http://localhost:3000` (or your app URL)

### Step 2: Login as Admin
1. Login with your admin account:
   - Phone: **9515131723**
   - OTP: **999999**

### Step 3: Open Browser Developer Tools
1. Press **F12** on your keyboard
   - OR right-click anywhere on the page → Select **"Inspect"** or **"Inspect Element"**
   - OR press **Ctrl + Shift + I** (Windows) / **Cmd + Option + I** (Mac)

### Step 4: Go to Console Tab
1. In the Developer Tools window, click on the **"Console"** tab
   - It's usually at the top of the Developer Tools window

### Step 5: Copy and Paste the Code
1. Copy this entire code block:

```javascript
fetch('/api/admin/vehicles/create-missing-auctions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Success!', data);
  alert(`Created ${data.auctions?.length || 0} auction(s)!`);
})
.catch(error => {
  console.error('❌ Error:', error);
  alert('Error: ' + error.message);
});
```

2. Paste it into the Console
3. Press **Enter**

### Step 6: Check the Result
- You should see a success message in the console
- A popup alert will show how many auctions were created
- Example: `Created 2 auction(s)!`

### Step 7: Verify on Auction Page
1. Go to the **Auction page** (`/auctions`)
2. The approved vehicles should now appear!

---

## Method 2: Using PowerShell/Command Line (Alternative)

If you prefer using the terminal:

### Step 1: Get Your Token
1. Open browser console (F12)
2. Run: `localStorage.getItem('token')`
3. Copy the token value

### Step 2: Run in PowerShell
Open PowerShell in your project directory and run:

```powershell
$token = "YOUR_TOKEN_HERE"  # Paste your token here

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/vehicles/create-missing-auctions" -Method POST -Headers $headers
Write-Host "Created $($response.auctions.Count) auction(s)!" -ForegroundColor Green
$response | ConvertTo-Json
```

**Replace `YOUR_TOKEN_HERE` with your actual token!**

---

## Method 3: Using Postman or Similar Tool

1. **URL:** `POST http://localhost:3000/api/admin/vehicles/create-missing-auctions`
2. **Headers:**
   - `Authorization`: `Bearer YOUR_TOKEN_HERE`
   - `Content-Type`: `application/json`
3. **Send Request**
4. Check response

---

## Troubleshooting

### Error: "Unauthorized" or "Invalid token"
- **Solution:** Make sure you're logged in as admin
- Logout and login again
- Get a fresh token

### Error: "Access denied. Admin only."
- **Solution:** Your user role must be "ADMIN" in the database
- Check in Prisma Studio that your role is set to ADMIN

### Error: "Failed to fetch" or Network Error
- **Solution:** Make sure your Next.js app is running (`npm run dev`)
- Check the URL is correct (should be `http://localhost:3000`)

### No auctions created
- **Solution:** Check if there are any approved auction vehicles
- The script only creates auctions for vehicles that:
  - Have `saleType = "AUCTION"`
  - Have `status = "APPROVED"` or `"AUCTION"`
  - Don't already have an auction record

### Console shows errors
- **Solution:** Check the browser console for detailed error messages
- Make sure you're on the correct page (any page is fine, as long as you're logged in)

---

## Quick Test

After running the script, check:

1. ✅ **Console shows success message**
2. ✅ **Alert popup shows number of auctions created**
3. ✅ **Go to `/auctions` page - vehicles should appear**

---

## What the Script Does

1. ✅ Finds all vehicles with `saleType = "AUCTION"` and `status = "APPROVED"` or `"AUCTION"`
2. ✅ Checks if they have an auction record (if not, creates one)
3. ✅ Creates auction with:
   - Start time: Now
   - End time: 7 days from now
   - Reserve price: Vehicle's basePrice or saleAmount
   - Minimum increment: 5% of reserve (min ₹1,000)
   - Current bid: Starts at reserve price
4. ✅ Updates vehicle status to "AUCTION"
5. ✅ Returns list of created auctions

---

## Expected Output

**Success Response:**
```json
{
  "message": "Created 2 auction(s)",
  "auctions": [
    {
      "vehicleId": "clx123...",
      "auctionId": "clx456...",
      "tractorBrand": "MAHINDRA"
    },
    {
      "vehicleId": "clx789...",
      "auctionId": "clx012...",
      "tractorBrand": "SWARAJ"
    }
  ]
}
```

---

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Verify you're logged in** as admin
3. **Check database** in Prisma Studio:
   - Vehicles should have `saleType = "AUCTION"`
   - Vehicles should have `status = "APPROVED"` or `"AUCTION"`
4. **Try logging out and logging in again** to get a fresh token





























