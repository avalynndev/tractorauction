/**
 * Script to backfill identification numbers for existing users
 * Run with: npx ts-node scripts/backfill-user-ids.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillUserIds() {
  console.log('Starting backfill of user identification numbers...');
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { identificationNumber: null },
        { identificationNumber: undefined },
      ],
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${users.length} users without identification numbers`);

  for (const user of users) {
    try {
      const dateStr = user.createdAt.toISOString().slice(0, 10).replace(/-/g, '');
      
      // Count users registered on the same day (including this user)
      const startOfDay = new Date(user.createdAt);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(user.createdAt);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Count users created on the same day, ordered by creation time
      const usersOnSameDay = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      
      // Find the index of current user in the same-day list
      const userIndex = usersOnSameDay.findIndex(u => u.id === user.id);
      const sequentialNumber = String(userIndex + 1).padStart(4, '0');
      const identificationNumber = `TA-${dateStr}-${sequentialNumber}`;
      
      // Check if this ID already exists (shouldn't happen, but just in case)
      const existing = await prisma.user.findUnique({
        where: { identificationNumber },
      });
      
      if (existing && existing.id !== user.id) {
        console.log(`⚠️  ID ${identificationNumber} already exists, generating alternative...`);
        // Add a suffix if collision occurs
        const alternativeNumber = String(usersOnSameDay.length + 1).padStart(4, '0');
        const alternativeId = `TA-${dateStr}-${alternativeNumber}`;
        
        await prisma.user.update({
          where: { id: user.id },
          data: { identificationNumber: alternativeId },
        });
        
        console.log(`✓ Updated user ${user.fullName} (${user.phoneNumber}): ${alternativeId}`);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { identificationNumber },
        });
        
        console.log(`✓ Updated user ${user.fullName} (${user.phoneNumber}): ${identificationNumber}`);
      }
    } catch (error) {
      console.error(`✗ Error updating user ${user.id}:`, error);
    }
  }
  
  console.log('\n✅ Backfill complete!');
  
  // Verify all users have IDs
  const usersWithoutIds = await prisma.user.count({
    where: {
      OR: [
        { identificationNumber: null },
        { identificationNumber: undefined },
      ],
    },
  });
  
  if (usersWithoutIds > 0) {
    console.log(`⚠️  Warning: ${usersWithoutIds} users still don't have identification numbers`);
  } else {
    console.log('✓ All users now have identification numbers');
  }
}

backfillUserIds()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





























