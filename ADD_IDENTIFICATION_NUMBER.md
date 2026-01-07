# Adding Identification Number Feature

## Overview
Every buyer and seller now gets a unique identification number upon registration. This ID is displayed in the Personal Details section of My Account page and can be used for future reference.

## ID Format
- Format: `TA-YYYYMMDD-XXXX`
- Example: `TA-20241215-0001`
- Where:
  - `TA` = Tractor Auction prefix
  - `YYYYMMDD` = Registration date
  - `XXXX` = 4-digit sequential number for that day

## Database Changes

### 1. Update Prisma Schema
The `User` model now includes an `identificationNumber` field:
```prisma
identificationNumber String @unique
```

### 2. Apply Database Migration

Run the following command to update your database:

```bash
npx prisma db push
```

Or create a migration:

```bash
npx prisma migrate dev --name add_identification_number
```

### 3. Backfill Existing Users (Optional)

If you have existing users without identification numbers, you can run this script to generate IDs for them:

```typescript
// scripts/backfill-user-ids.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillUserIds() {
  const users = await prisma.user.findMany({
    where: {
      identificationNumber: null,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  for (const user of users) {
    const dateStr = user.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Count users registered on the same day
    const startOfDay = new Date(user.createdAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(user.createdAt);
    endOfDay.setHours(23, 59, 59, 999);
    
    const usersOnSameDay = await prisma.user.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        id: {
          lte: user.id, // Users created before or at the same time
        },
      },
    });
    
    const sequentialNumber = String(usersOnSameDay).padStart(4, '0');
    const identificationNumber = `TA-${dateStr}-${sequentialNumber}`;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { identificationNumber },
    });
    
    console.log(`Updated user ${user.fullName}: ${identificationNumber}`);
  }
  
  console.log('Backfill complete!');
}

backfillUserIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

## Features

### 1. Automatic Generation
- ID is automatically generated during registration
- Format ensures uniqueness and includes registration date
- Sequential numbering per day prevents collisions

### 2. Display in My Account
- ID Number is shown at the top of Personal Details section
- Highlighted in primary color for visibility
- Read-only field (cannot be edited)

### 3. Future Reference
- Users can use this ID for:
  - Customer support inquiries
  - Account verification
  - Transaction references
  - Membership renewals

## Testing

1. Register a new user
2. Verify OTP and login
3. Go to My Account page
4. Check Personal Details section
5. Verify ID Number is displayed (format: TA-YYYYMMDD-XXXX)

## Notes

- ID numbers are unique and indexed in the database
- Format is consistent and easy to reference
- Sequential numbering resets each day
- Existing users will need backfill script if they don't have IDs





























