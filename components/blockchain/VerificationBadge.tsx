"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

interface VerificationBadgeProps {
  recordType: "VEHICLE" | "AUCTION" | "BID" | "PURCHASE";
  recordId: string;
  className?: string;
  showDetails?: boolean;
}

export default function VerificationBadge({
  recordType,
  recordId,
  className = "",
  showDetails = false,
}: VerificationBadgeProps) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const response = await fetch(
          `/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}`
        );
        if (response.ok) {
          const data = await response.json();
          setVerified(data.verified);
          setHash(data.hash);
          setTxHash(data.txHash);
        }
      } catch (error) {
        console.error("Verification check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [recordType, recordId]);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Verifying...</span>
      </div>
    );
  }

  if (verified) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <ShieldCheck className="w-5 h-5 text-green-600" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-green-700">
            Blockchain Verified
          </span>
          {showDetails && hash && (
            <span className="text-xs text-gray-500 font-mono">
              {hash.substring(0, 16)}...
            </span>
          )}
          {showDetails && txHash && (
            <a
              href={`https://polygonscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              View on Blockchain
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <ShieldAlert className="w-5 h-5 text-gray-400" />
      <span className="text-sm text-gray-500">Not Verified</span>
    </div>
  );
}

