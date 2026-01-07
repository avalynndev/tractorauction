"use client";

import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { formatHashForDisplay } from '@/lib/blockchain';

interface BlockchainBadgeProps {
  hash?: string | null;
  verified?: boolean;
  type: 'vehicle' | 'auction';
  id: string;
}

export default function BlockchainBadge({
  hash,
  verified,
  type,
  id,
}: BlockchainBadgeProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<{
    verified: boolean;
    message?: string;
  } | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/blockchain/verify/${type}/${id}`);
      const data = await response.json();

      if (data.success) {
        setVerificationStatus({
          verified: data.verified,
          message: data.verified
            ? 'Blockchain record verified successfully'
            : 'Blockchain record verification failed',
        });
      }
    } catch (error) {
      setVerificationStatus({
        verified: false,
        message: 'Verification error',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!hash) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <ShieldAlert className="w-4 h-4" />
        <span>No blockchain record</span>
      </div>
    );
  }

  const isVerified = verified || verificationStatus?.verified;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {isVerified ? (
          <ShieldCheck className="w-5 h-5 text-green-500" />
        ) : (
          <Shield className="w-5 h-5 text-yellow-500" />
        )}
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {isVerified ? 'Blockchain Verified' : 'Blockchain Recorded'}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {formatHashForDisplay(hash)}
          </span>
        </div>
      </div>
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50 flex items-center gap-1"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Now'
        )}
      </button>
      {verificationStatus && (
        <p
          className={`text-xs ${
            verificationStatus.verified ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {verificationStatus.message}
        </p>
      )}
    </div>
  );
}

