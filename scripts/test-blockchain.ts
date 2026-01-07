import { generateVehicleHash, generateAuctionHash } from '../lib/blockchain';

// Test vehicle hash
const testVehicle = {
  registrationNumber: 'MH12AB1234',
  engineNumber: 'ENG123456',
  chassisNumber: 'CHS789012',
  vehicleType: 'USED_TRACTOR',
  tractorBrand: 'Mahindra',
  yearOfMfg: 2020,
  sellerId: 'test-seller-id',
  createdAt: new Date(),
};

const vehicleHash = generateVehicleHash(testVehicle);
console.log('✅ Vehicle Hash:', vehicleHash);

// Test auction hash
const testAuction = {
  vehicleId: 'test-vehicle-id',
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-02'),
  currentBid: 500000,
  winnerId: 'test-winner-id',
  totalBids: 10,
  endedAt: new Date('2024-01-02'),
};

const auctionHash = generateAuctionHash(testAuction);
console.log('✅ Auction Hash:', auctionHash);

console.log('\n✅ Blockchain hash generation is working!');

