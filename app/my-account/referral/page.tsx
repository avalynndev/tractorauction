"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Users,
  Gift,
  TrendingUp,
  QrCode,
  Link as LinkIcon,
} from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import toast from "react-hot-toast";

interface ReferralStats {
  referralCode: string | null;
  referralCount: number;
  referralRewards: number;
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  referrals: Array<{
    id: string;
    referredUser: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string | null;
      createdAt: string;
      isActive: boolean;
    };
    status: string;
    rewardAmount: number;
    rewardType: string | null;
    rewardGiven: boolean;
    createdAt: string;
  }>;
  referredBy: {
    id: string;
    fullName: string;
    phoneNumber: string;
  } | null;
}

export default function ReferralPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      getCookie("token");

    if (!token || token === "undefined" || token === "null") {
      router.push("/login");
      return;
    }

    fetchReferralData(token);
  }, [router]);

  const fetchReferralData = async (token: string) => {
    try {
      // Fetch referral code/link
      const codeResponse = await fetch("/api/referral/generate", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        setReferralLink(codeData.referralLink);
      }

      // Fetch stats
      const statsResponse = await fetch("/api/referral/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        if (statsResponse.status === 401) {
          router.push("/login");
        } else {
          toast.error("Failed to load referral data");
        }
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
      toast.error("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Tractor Auction - Get Great Deals!",
          text: `Use my referral code ${stats?.referralCode} to join Tractor Auction and get exclusive benefits!`,
          url: referralLink,
        });
      } catch (error: any) {
        if (error.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">No referral data available.</p>
            <Link
              href="/my-account"
              className="text-primary-600 hover:underline mt-4 inline-block"
            >
              Back to My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/my-account"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Account
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-600 mt-2">
            Invite friends and earn rewards when they join!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.totalReferrals}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Referrals</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.activeReferrals}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Rewards</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ₹{stats.referralRewards.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <Gift className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Referral Code Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referral Code</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={stats.referralCode || ""}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg font-bold"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referral Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={handleShare}
                  className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Share your referral code or link with friends. When they register using your code,
            you'll both earn rewards!
          </p>
        </div>

        {/* Referred By Section */}
        {stats.referredBy && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              You were referred by
            </h3>
            <p className="text-blue-800">
              {stats.referredBy.fullName} ({stats.referredBy.phoneNumber})
            </p>
          </div>
        )}

        {/* Referrals List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Referrals</h2>
          {stats.referrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No referrals yet. Start sharing your referral code!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {referral.referredUser.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {referral.referredUser.phoneNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(referral.referredUser.createdAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            referral.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : referral.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {referral.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {referral.rewardGiven ? (
                          <span className="text-green-600 font-medium">
                            ₹{referral.rewardAmount.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-gray-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

