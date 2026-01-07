/**
 * Script to check blockchain records
 * Usage: node scripts/check-blockchain.js [recordType] [recordId]
 * 
 * Examples:
 *   node scripts/check-blockchain.js VEHICLE vehicle-id-123
 *   node scripts/check-blockchain.js AUCTION auction-id-456
 *   node scripts/check-blockchain.js BID bid-id-789
 *   node scripts/check-blockchain.js PURCHASE purchase-id-012
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function checkBlockchainRecord(recordType, recordId) {
  try {
    console.log(`\n🔍 Checking blockchain record...`);
    console.log(`   Type: ${recordType}`);
    console.log(`   ID: ${recordId}`);
    console.log(`   URL: ${BASE_URL}/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}\n`);

    const response = await fetch(
      `${BASE_URL}/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ Record not found');
        return false;
      }
      const error = await response.json();
      console.log(`❌ Error: ${error.message}`);
      return false;
    }

    const data = await response.json();

    console.log('📊 Blockchain Record Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (data.verified && data.chainValid) {
      console.log('✅ Status: VERIFIED');
      console.log('✅ Chain: VALID');
    } else {
      console.log('❌ Status: NOT VERIFIED');
      if (!data.chainValid) {
        console.log('❌ Chain: INVALID');
      }
    }

    if (data.hash) {
      console.log(`\n🔐 Block Hash:`);
      console.log(`   ${data.hash}`);
      console.log(`   (First 20 chars: ${data.hash.substring(0, 20)}...)`);
    }

    if (data.txHash) {
      console.log(`\n🔗 Transaction Hash:`);
      console.log(`   ${data.txHash}`);
      console.log(`   View: https://polygonscan.com/tx/${data.txHash}`);
    }

    if (data.verifiedAt) {
      console.log(`\n📅 Verified At:`);
      console.log(`   ${new Date(data.verifiedAt).toLocaleString()}`);
    }

    if (data.record) {
      console.log(`\n📋 Record Details:`);
      console.log(`   Record ID: ${data.record.id}`);
      console.log(`   Previous Hash: ${data.record.previousHash || 'None (First record)'}`);
      console.log(`   Data Hash: ${data.record.dataHash?.substring(0, 20)}...`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return data.verified && data.chainValid;
  } catch (error) {
    console.error(`\n❌ Error checking blockchain record:`, error.message);
    console.error(`   Make sure the server is running at ${BASE_URL}\n`);
    return false;
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(`
Usage: node scripts/check-blockchain.js [recordType] [recordId]

Record Types:
  - VEHICLE
  - AUCTION
  - BID
  - PURCHASE

Examples:
  node scripts/check-blockchain.js VEHICLE cm123abc456
  node scripts/check-blockchain.js AUCTION cm456def789
  node scripts/check-blockchain.js BID cm789ghi012
  node scripts/check-blockchain.js PURCHASE cm012jkl345
  `);
  process.exit(1);
}

const [recordType, recordId] = args;

// Validate record type
const validTypes = ['VEHICLE', 'AUCTION', 'BID', 'PURCHASE'];
if (!validTypes.includes(recordType.toUpperCase())) {
  console.error(`❌ Invalid record type: ${recordType}`);
  console.error(`   Valid types: ${validTypes.join(', ')}`);
  process.exit(1);
}

// Check the record
checkBlockchainRecord(recordType.toUpperCase(), recordId)
  .then(verified => {
    process.exit(verified ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });

