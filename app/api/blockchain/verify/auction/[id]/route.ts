import { NextRequest, NextResponse } from 'next/server';
import { verifyAuctionBlockchainRecord } from '@/lib/blockchain-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auctionId = params.id;
    const verification = await verifyAuctionBlockchainRecord(auctionId);

    return NextResponse.json({
      success: true,
      ...verification,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Verification failed',
      },
      { status: 500 }
    );
  }
}

