import { NextRequest, NextResponse } from 'next/server';
import { verifyVehicleBlockchainRecord } from '@/lib/blockchain-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vehicleId = params.id;
    const verification = await verifyVehicleBlockchainRecord(vehicleId);

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

