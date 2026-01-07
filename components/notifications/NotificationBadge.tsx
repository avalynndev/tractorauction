"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import Link from "next/link";

export default function NotificationBadge() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchUnreadCount(token);

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount(token);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async (token: string) => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Link
      href="/my-account/notifications"
      className="relative inline-flex items-center justify-center p-2 text-gray-700 hover:text-primary-700 transition-colors"
      title="Notifications"
    >
      <Bell className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full min-w-[20px]">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}


