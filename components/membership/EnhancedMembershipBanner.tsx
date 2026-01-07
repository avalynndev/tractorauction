"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, X, Package, Check, Clock, IndianRupee, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface MembershipStatus {
  hasActiveMembership: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean;
  isTrial?: boolean;
  isExpired?: boolean;
  message: string;
  membership?: {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    amount: number;
    status: string;
  };
}

interface MembershipPlan {
  type: "SILVER" | "GOLD" | "DIAMOND";
  name: string;
  price: number;
  validity: number;
  features: string[];
  popular?: boolean;
}

const membershipPlans: MembershipPlan[] = [
  {
    type: "SILVER",
    name: "Silver Membership",
    price: 2000,
    validity: 30,
    features: [
      "30 days access",
      "Unlimited bidding",
      "List unlimited vehicles",
      "Priority support",
      "Email notifications",
    ],
  },
  {
    type: "GOLD",
    name: "Gold Membership",
    price: 5000,
    validity: 180,
    popular: true,
    features: [
      "180 days access",
      "Unlimited bidding",
      "List unlimited vehicles",
      "Priority support",
      "Email & SMS notifications",
      "Early access to new auctions",
      "Bulk vehicle upload",
    ],
  },
  {
    type: "DIAMOND",
    name: "Diamond Membership",
    price: 9000,
    validity: 365,
    features: [
      "365 days access (Best Value)",
      "Unlimited bidding",
      "List unlimited vehicles",
      "24/7 Priority support",
      "Email & SMS notifications",
      "Early access to new auctions",
      "Bulk vehicle upload",
      "Featured vehicle listings",
      "Analytics dashboard",
    ],
  },
];

export default function EnhancedMembershipBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMembershipStatus = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch("/api/membership/status", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        // Show banner if:
        // 1. No active membership (expired or never had one)
        // 2. On free trial
        // 3. Expiring soon
        if (
          !data.hasActiveMembership ||
          data.isTrial ||
          data.isExpiringSoon
        ) {
          setStatus(data);
          // Auto-expand plans if trial or expired
          if (data.isTrial || data.isExpired) {
            setShowPlans(true);
          }
        } else {
          setStatus(null); // Hide banner if membership is active and not expiring
        }
      })
      .catch(() => {
        // Silently fail - banner is optional
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMembershipStatus();

    // Listen for membership updates (e.g., after successful payment)
    const handleMembershipUpdate = () => {
      fetchMembershipStatus();
    };

    window.addEventListener("membershipUpdated", handleMembershipUpdate);
    return () => {
      window.removeEventListener("membershipUpdated", handleMembershipUpdate);
    };
  }, []);

  // Don't show banner on membership page (to avoid duplication)
  // Check this AFTER all hooks are called
  if (pathname === "/membership") {
    return null;
  }

  if (loading || !status || dismissed) return null;

  const isTrial = status.isTrial && status.hasActiveMembership;
  const isExpired = status.isExpired || (!status.hasActiveMembership && !isTrial);
  const isExpiringSoon = status.isExpiringSoon && !isTrial;

  return (
    <div className="mb-6">
      {/* Main Banner */}
      <div
        className={`border-l-4 p-4 rounded-r-lg shadow-md ${
          isExpired
            ? "bg-red-50 border-red-500"
            : isTrial
            ? "bg-blue-50 border-blue-500"
            : "bg-yellow-50 border-yellow-500"
        }`}
      >
        <div className="flex items-start">
          <AlertCircle
            className={`w-6 h-6 mr-3 mt-0.5 flex-shrink-0 ${
              isExpired
                ? "text-red-600"
                : isTrial
                ? "text-blue-600"
                : "text-yellow-600"
            }`}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3
                className={`font-bold text-lg ${
                  isExpired
                    ? "text-red-800"
                    : isTrial
                    ? "text-blue-800"
                    : "text-yellow-800"
                }`}
              >
                {isExpired
                  ? "Membership Expired"
                  : isTrial
                  ? "Free Trial Active"
                  : "Membership Expiring Soon"}
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className={`ml-4 hover:opacity-70 ${
                  isExpired
                    ? "text-red-600"
                    : isTrial
                    ? "text-blue-600"
                    : "text-yellow-600"
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p
              className={`text-sm mb-3 ${
                isExpired
                  ? "text-red-700"
                  : isTrial
                  ? "text-blue-700"
                  : "text-yellow-700"
              }`}
            >
              {status.message}
            </p>

            {/* Trial/Expired Details */}
            {(isTrial || isExpired) && (
              <div
                className={`mb-3 p-3 rounded-lg ${
                  isExpired
                    ? "bg-red-100"
                    : "bg-blue-100"
                }`}
              >
                {isTrial && status.daysRemaining > 0 && (
                  <div className="flex items-center text-blue-800">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm font-semibold">
                      {status.daysRemaining} days remaining in your free trial
                    </span>
                  </div>
                )}
                {isExpired && (
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm font-semibold">
                      Your membership access has ended. Subscribe now to continue.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPlans(!showPlans)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                  isExpired
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : isTrial
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-yellow-600 text-white hover:bg-yellow-700"
                }`}
              >
                {showPlans ? "Hide Plans" : "View Membership Plans"}
              </button>
              <Link
                href="/membership"
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors border-2 ${
                  isExpired
                    ? "border-red-600 text-red-600 hover:bg-red-50"
                    : isTrial
                    ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                    : "border-yellow-600 text-yellow-600 hover:bg-yellow-50"
                }`}
              >
                Subscribe Now →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Membership Plans Section */}
      {showPlans && (
        <div className="mt-4 bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Choose Your Membership Plan
            </h3>
            <p className="text-gray-600">
              Select the perfect plan to unlock all features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {membershipPlans.map((plan) => (
              <div
                key={plan.type}
                className={`bg-white rounded-lg border-2 p-5 relative ${
                  plan.popular
                    ? "border-primary-600 transform scale-105 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <Package
                    className={`w-10 h-10 mx-auto mb-2 ${
                      plan.popular ? "text-primary-600" : "text-gray-400"
                    }`}
                  />
                  <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                  <div className="flex items-baseline justify-center mb-1">
                    <IndianRupee className="w-5 h-5" />
                    <span className="text-3xl font-bold">
                      {plan.price.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Valid for {plan.validity} days
                  </p>
                </div>

                <ul className="space-y-2 mb-4 min-h-[180px]">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/membership"
                  className={`block w-full py-2.5 rounded-lg font-semibold text-center transition-colors ${
                    plan.popular
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-800 text-white hover:bg-gray-900"
                  }`}
                >
                  Subscribe Now
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              All plans include secure payment via Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

