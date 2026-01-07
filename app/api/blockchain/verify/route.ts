import { NextRequest, NextResponse } from "next/server";
import { verifyBlockchainRecord, getBlockchainStatus } from "@/lib/blockchain-service";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recordType = searchParams.get("recordType");
    const recordId = searchParams.get("recordId");

    if (!recordType || !recordId) {
      return NextResponse.json(
        { message: "recordType and recordId are required" },
        { status: 400 }
      );
    }

    const verification = await verifyBlockchainRecord(recordType, recordId);
    const status = await getBlockchainStatus(recordType, recordId);

    return NextResponse.json({
      verified: verification.verified && verification.chainValid,
      chainValid: verification.chainValid,
      hash: status.hash,
      txHash: status.txHash,
      verifiedAt: status.verifiedAt,
      record: verification.record,
    });
  } catch (error: any) {
    console.error("Blockchain verification error:", error);
    return handleApiError(error);
  }
}

