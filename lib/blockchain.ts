import crypto from 'crypto';

/**
 * Generate SHA-256 hash from data
 */
export function generateHash(data: string | object): string {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Generate vehicle blockchain hash
 * Includes all critical vehicle identification data
 */
export function generateVehicleHash(vehicleData: {
  registrationNumber?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  vehicleType: string;
  tractorBrand: string;
  yearOfMfg: number;
  sellerId: string;
  createdAt: Date;
}): string {
  // Create a normalized object with only critical fields
  const normalizedData = {
    registrationNumber: vehicleData.registrationNumber || '',
    engineNumber: vehicleData.engineNumber || '',
    chassisNumber: vehicleData.chassisNumber || '',
    vehicleType: vehicleData.vehicleType,
    tractorBrand: vehicleData.tractorBrand,
    yearOfMfg: vehicleData.yearOfMfg,
    sellerId: vehicleData.sellerId,
    timestamp: vehicleData.createdAt.toISOString(),
  };

  // Sort keys to ensure consistent hashing
  const sortedData = Object.keys(normalizedData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalizedData[key as keyof typeof normalizedData];
      return acc;
    }, {} as Record<string, any>);

  return generateHash(sortedData);
}

/**
 * Generate auction blockchain hash
 * Includes auction result and winner information
 */
export function generateAuctionHash(auctionData: {
  vehicleId: string;
  startTime: Date;
  endTime: Date;
  currentBid: number;
  winnerId?: string | null;
  totalBids: number;
  endedAt: Date;
}): string {
  const normalizedData = {
    vehicleId: auctionData.vehicleId,
    startTime: auctionData.startTime.toISOString(),
    endTime: auctionData.endTime.toISOString(),
    currentBid: auctionData.currentBid,
    winnerId: auctionData.winnerId || '',
    totalBids: auctionData.totalBids,
    endedAt: auctionData.endedAt.toISOString(),
  };

  const sortedData = Object.keys(normalizedData)
    .sort()
    .reduce((acc, key) => {
      acc[key] = normalizedData[key as keyof typeof normalizedData];
      return acc;
    }, {} as Record<string, any>);

  return generateHash(sortedData);
}

/**
 * Verify hash matches data
 */
export function verifyHash(data: string | object, hash: string): boolean {
  const calculatedHash = generateHash(data);
  return calculatedHash === hash;
}

/**
 * Format hash for display (first 8 + last 8 characters)
 */
export function formatHashForDisplay(hash: string): string {
  if (hash.length < 16) return hash;
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
}
