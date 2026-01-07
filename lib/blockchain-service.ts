import { prisma } from './prisma';
import { generateVehicleHash, generateAuctionHash } from './blockchain';

/**
 * Generate and store blockchain hash for a vehicle
 */
export async function createVehicleBlockchainRecord(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      registrationNumber: true,
      engineNumber: true,
      chassisNumber: true,
      vehicleType: true,
      tractorBrand: true,
      yearOfMfg: true,
      sellerId: true,
      createdAt: true,
    },
  });

  if (!vehicle) {
    throw new Error('Vehicle not found');
  }

  // Generate hash
  const blockchainHash = generateVehicleHash({
    registrationNumber: vehicle.registrationNumber,
    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    vehicleType: vehicle.vehicleType,
    tractorBrand: vehicle.tractorBrand,
    yearOfMfg: vehicle.yearOfMfg,
    sellerId: vehicle.sellerId,
    createdAt: vehicle.createdAt,
  });

  // Store hash in database
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      blockchainHash,
      blockchainVerified: false, // Will be set to true after blockchain storage
    },
  });

  return {
    vehicleId: updatedVehicle.id,
    blockchainHash: updatedVehicle.blockchainHash,
  };
}

/**
 * Generate and store blockchain hash for an auction
 */
export async function createAuctionBlockchainRecord(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      vehicle: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  // Get total bids count
  const totalBids = await prisma.bid.count({
    where: { auctionId },
  });

  // Generate hash
  const blockchainHash = generateAuctionHash({
    vehicleId: auction.vehicleId,
    startTime: auction.startTime,
    endTime: auction.endTime,
    currentBid: auction.currentBid,
    winnerId: auction.winnerId,
    totalBids,
    endedAt: auction.updatedAt,
  });

  // Store hash in database
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      blockchainHash,
      blockchainVerified: false,
    },
  });

  return {
    auctionId: updatedAuction.id,
    blockchainHash: updatedAuction.blockchainHash,
  };
}

/**
 * Verify vehicle blockchain record
 */
export async function verifyVehicleBlockchainRecord(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      blockchainHash: true,
      registrationNumber: true,
      engineNumber: true,
      chassisNumber: true,
      vehicleType: true,
      tractorBrand: true,
      yearOfMfg: true,
      sellerId: true,
      createdAt: true,
    },
  });

  if (!vehicle || !vehicle.blockchainHash) {
    return {
      verified: false,
      reason: 'No blockchain record found',
    };
  }

  // Regenerate hash and compare
  const calculatedHash = generateVehicleHash({
    registrationNumber: vehicle.registrationNumber,
    engineNumber: vehicle.engineNumber,
    chassisNumber: vehicle.chassisNumber,
    vehicleType: vehicle.vehicleType,
    tractorBrand: vehicle.tractorBrand,
    yearOfMfg: vehicle.yearOfMfg,
    sellerId: vehicle.sellerId,
    createdAt: vehicle.createdAt,
  });

  const isVerified = calculatedHash === vehicle.blockchainHash;

  if (isVerified && !vehicle.blockchainVerified) {
    // Update verification status
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        blockchainVerified: true,
        blockchainVerifiedAt: new Date(),
      },
    });
  }

  return {
    verified: isVerified,
    storedHash: vehicle.blockchainHash,
    calculatedHash,
    match: isVerified,
  };
}

/**
 * Verify auction blockchain record
 */
export async function verifyAuctionBlockchainRecord(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: {
      vehicle: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!auction || !auction.blockchainHash) {
    return {
      verified: false,
      reason: 'No blockchain record found',
    };
  }

  const totalBids = await prisma.bid.count({
    where: { auctionId },
  });

  const calculatedHash = generateAuctionHash({
    vehicleId: auction.vehicleId,
    startTime: auction.startTime,
    endTime: auction.endTime,
    currentBid: auction.currentBid,
    winnerId: auction.winnerId,
    totalBids,
    endedAt: auction.updatedAt,
  });

  const isVerified = calculatedHash === auction.blockchainHash;

  if (isVerified && !auction.blockchainVerified) {
    await prisma.auction.update({
      where: { id: auctionId },
      data: {
        blockchainVerified: true,
        blockchainVerifiedAt: new Date(),
      },
    });
  }

  return {
    verified: isVerified,
    storedHash: auction.blockchainHash,
    calculatedHash,
    match: isVerified,
  };
}

/**
 * Generic function to verify blockchain record by type
 */
export async function verifyBlockchainRecord(recordType: string, recordId: string) {
  if (recordType === 'vehicle') {
    const result = await verifyVehicleBlockchainRecord(recordId);
    return {
      verified: result.verified,
      chainValid: result.match || false,
      record: {
        id: recordId,
        type: 'vehicle',
        hash: result.storedHash,
      },
    };
  } else if (recordType === 'auction') {
    const result = await verifyAuctionBlockchainRecord(recordId);
    return {
      verified: result.verified,
      chainValid: result.match || false,
      record: {
        id: recordId,
        type: 'auction',
        hash: result.storedHash,
      },
    };
  } else {
    throw new Error(`Invalid record type: ${recordType}`);
  }
}

/**
 * Get blockchain status for a record
 */
export async function getBlockchainStatus(recordType: string, recordId: string) {
  if (recordType === 'vehicle') {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: recordId },
      select: {
        blockchainHash: true,
        blockchainTxHash: true,
        blockchainVerified: true,
        blockchainVerifiedAt: true,
      },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return {
      hash: vehicle.blockchainHash,
      txHash: vehicle.blockchainTxHash,
      verified: vehicle.blockchainVerified,
      verifiedAt: vehicle.blockchainVerifiedAt,
    };
  } else if (recordType === 'auction') {
    const auction = await prisma.auction.findUnique({
      where: { id: recordId },
      select: {
        blockchainHash: true,
        blockchainTxHash: true,
        blockchainVerified: true,
        blockchainVerifiedAt: true,
      },
    });

    if (!auction) {
      throw new Error('Auction not found');
    }

    return {
      hash: auction.blockchainHash,
      txHash: auction.blockchainTxHash,
      verified: auction.blockchainVerified,
      verifiedAt: auction.blockchainVerifiedAt,
    };
  } else {
    throw new Error(`Invalid record type: ${recordType}`);
  }
}

