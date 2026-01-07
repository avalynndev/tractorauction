"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import toast from "react-hot-toast";

interface MembershipStatus {
  hasActiveMembership: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean;
  message: string;
}

export default function MembershipStatusBanner() {
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("/api/membership/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.hasActiveMembership && data.isExpiringSoon) {
          setStatus(data);
        }
      })
      .catch(() => {
        // Silently fail - banner is optional
      });
  }, []);

  if (!status || dismissed) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            <strong>Membership Expiring Soon:</strong> {status.message}
          </p>
          <Link
            href="/membership"
            className="text-sm text-yellow-900 underline font-semibold mt-1 inline-block"
          >
            Renew Now →
          </Link>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-600 hover:text-yellow-800 ml-4"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}





























