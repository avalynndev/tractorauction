"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, ArrowLeft, Save, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";

interface NotificationPreferences {
  id: string;
  vehicleApproved: boolean;
  vehicleRejected: boolean;
  auctionScheduled: boolean;
  auctionStarted: boolean;
  auctionEnded: boolean;
  bidPlaced: boolean;
  bidOutbid: boolean;
  bidApproved: boolean;
  bidRejected: boolean;
  membershipExpiring: boolean;
  membershipExpired: boolean;
  watchlistPriceDrop: boolean;
  watchlistAuctionStart: boolean;
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchPreferences(token);
  }, [router]);

  const fetchPreferences = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/user/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        toast.error("Failed to load notification preferences");
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token || !preferences) return;

    setSaving(true);
    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success("Notification preferences saved successfully");
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <p className="text-red-600">Failed to load notification preferences</p>
          </div>
        </div>
      </div>
    );
  }

  const preferenceGroups = [
    {
      title: "Vehicle Notifications",
      description: "Get notified about your vehicle listings",
      items: [
        { key: "vehicleApproved" as const, label: "Vehicle Approved", description: "When your vehicle listing is approved" },
        { key: "vehicleRejected" as const, label: "Vehicle Rejected", description: "When your vehicle listing is rejected" },
      ],
    },
    {
      title: "Auction Notifications",
      description: "Stay updated on auction activities",
      items: [
        { key: "auctionScheduled" as const, label: "Auction Scheduled", description: "When an auction is scheduled for your vehicle" },
        { key: "auctionStarted" as const, label: "Auction Started", description: "When an auction begins" },
        { key: "auctionEnded" as const, label: "Auction Ended", description: "When an auction ends" },
      ],
    },
    {
      title: "Bidding Notifications",
      description: "Track your bidding activity",
      items: [
        { key: "bidPlaced" as const, label: "Bid Placed", description: "When you place a bid" },
        { key: "bidOutbid" as const, label: "Bid Outbid", description: "When someone outbids you" },
        { key: "bidApproved" as const, label: "Bid Approved", description: "When your bid is approved by seller" },
        { key: "bidRejected" as const, label: "Bid Rejected", description: "When your bid is rejected" },
      ],
    },
    {
      title: "Membership Notifications",
      description: "Keep track of your membership status",
      items: [
        { key: "membershipExpiring" as const, label: "Membership Expiring", description: "When your membership is about to expire" },
        { key: "membershipExpired" as const, label: "Membership Expired", description: "When your membership expires" },
      ],
    },
    {
      title: "Watchlist Alerts",
      description: "Get notified about items in your watchlist",
      items: [
        { key: "watchlistPriceDrop" as const, label: "Price Drop Alerts", description: "When prices drop on items in your watchlist" },
        { key: "watchlistAuctionStart" as const, label: "Auction Start Alerts", description: "When auctions start for items in your watchlist" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton href="/my-account" />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <Bell className="w-8 h-8 text-primary-600" />
                <span>Notification Preferences</span>
              </h1>
              <p className="text-gray-600 mt-2">
                Choose which notifications you want to receive
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preferences Groups */}
        <div className="space-y-6">
          {preferenceGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="bg-white rounded-xl shadow-lg p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{group.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{group.description}</p>
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{item.label}</h3>
                        {preferences[item.key] && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={preferences[item.key]}
                        onChange={() => handleToggle(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


