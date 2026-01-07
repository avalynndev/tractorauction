"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, Copy, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface VerificationDetailsProps {
  recordType: "VEHICLE" | "AUCTION" | "BID" | "PURCHASE";
  recordId: string;
}

export default function VerificationDetails({
  recordType,
  recordId,
}: VerificationDetailsProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await fetch(
          `/api/blockchain/verify?recordType=${recordType}&recordId=${recordId}`
        );
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error("Error fetching verification:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [recordType, recordId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 text-gray-500">
          <ShieldAlert className="w-5 h-5" />
          <span>Verification data not available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Blockchain Verification
        </h3>
        {data.verified ? (
          <div className="flex items-center gap-2 text-green-600">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-semibold">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <ShieldAlert className="w-5 h-5" />
            <span>Not Verified</span>
          </div>
        )}
      </div>

      {data.hash && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Block Hash
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all">
              {data.hash}
            </code>
            <button
              onClick={() => copyToClipboard(data.hash)}
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              aria-label="Copy hash"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      )}

      {data.txHash && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Transaction Hash
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="flex-1 text-sm font-mono text-gray-800 break-all">
              {data.txHash}
            </code>
            <a
              href={`https://polygonscan.com/tx/${data.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-200 rounded transition-colors"
              aria-label="View on blockchain"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
            </a>
          </div>
        </div>
      )}

      {data.verifiedAt && (
        <div className="text-sm text-gray-600">
          <span className="font-medium">Verified At:</span>{" "}
          {new Date(data.verifiedAt).toLocaleString()}
        </div>
      )}

      <div className="pt-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Chain Integrity:
          </span>
          {data.chainValid ? (
            <span className="text-sm text-green-600 font-semibold">
              ✓ Valid
            </span>
          ) : (
            <span className="text-sm text-red-600 font-semibold">
              ✗ Invalid
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

