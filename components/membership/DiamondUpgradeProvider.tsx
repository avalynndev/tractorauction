"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import DiamondUpgradeModal from "./DiamondUpgradeModal";

export default function DiamondUpgradeProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [userMembership, setUserMembership] = useState<string | null>(null);
  const [isDiamond, setIsDiamond] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastShownRef = useRef<number>(0);

  // Check user membership status
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const checkMembership = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setIsDiamond(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
          cache: 'no-store',
        });

        if (abortController.signal.aborted || !isMounted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const membershipType = data.membership?.membershipType || data.user?.membership?.membershipType || null;
          if (isMounted) {
            setUserMembership(membershipType);
            setIsDiamond(membershipType === "DIAMOND");
          }
        } else {
          // Handle non-ok responses silently
          if (isMounted) {
            setIsDiamond(false);
          }
        }
      } catch (error: any) {
        // Silently handle network errors - don't spam console
        if (error.name === 'AbortError') {
          // Request was cancelled, ignore
          return;
        }
        
        // Only log if it's not a network error (which is expected sometimes)
        if (!error.message?.includes('fetch') && !error.message?.includes('Failed')) {
          console.error("Error checking membership:", error);
        }
        
        if (isMounted) {
          setIsDiamond(false);
        }
      }
    };

    checkMembership();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [pathname]);

  // Function to check if we should show the modal
  const shouldShowModal = (): boolean => {
    // Don't show if user is Diamond member
    if (isDiamond) return false;

    // Don't show on login/register pages or my-account (where they can upgrade)
    if (
      pathname?.includes("/login") ||
      pathname?.includes("/register") ||
      pathname?.includes("/verify-otp") ||
      pathname?.includes("/my-account")
    ) {
      return false;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) return false;

    // Check if modal was shown in last 30 minutes
    const now = Date.now();
    const lastShown = lastShownRef.current;
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (lastShown && (now - lastShown) < thirtyMinutes) {
      return false; // Don't show if shown within last 30 minutes
    }

    return true;
  };

  // Show modal function
  const showModalIfNeeded = () => {
    if (shouldShowModal()) {
      setShowModal(true);
      lastShownRef.current = Date.now();
      // Store in localStorage to persist across sessions
      localStorage.setItem("diamondUpgradeLastShown", Date.now().toString());
    }
  };

  // Show on mount (when opening application)
  useEffect(() => {
    // Small delay to ensure page is loaded
    const timer = setTimeout(() => {
      if (shouldShowModal()) {
        showModalIfNeeded();
      }
    }, 2000); // 2 seconds after page load

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiamond, pathname]);

  // Show every 30 minutes
  useEffect(() => {
    if (isDiamond) return; // Don't set interval for Diamond members

    // Load last shown time from localStorage
    const lastShownStr = localStorage.getItem("diamondUpgradeLastShown");
    if (lastShownStr) {
      lastShownRef.current = parseInt(lastShownStr, 10);
    }

    // Set interval to check every 30 minutes
    intervalRef.current = setInterval(() => {
      if (shouldShowModal()) {
        showModalIfNeeded();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiamond, pathname]);

  // Show on beforeunload (when closing application)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (shouldShowModal()) {
        // Store that we should show on next visit
        localStorage.setItem("diamondUpgradeShowOnNextVisit", "true");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is being hidden (user switching tabs or closing)
        if (shouldShowModal()) {
          localStorage.setItem("diamondUpgradeShowOnNextVisit", "true");
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiamond, pathname]);

  // Check on pathname change (navigation)
  useEffect(() => {
    // Check if we should show on this page
    const showOnNextVisit = localStorage.getItem("diamondUpgradeShowOnNextVisit");
    if (showOnNextVisit === "true") {
      localStorage.removeItem("diamondUpgradeShowOnNextVisit");
      // Small delay to ensure smooth transition
      setTimeout(() => {
        if (shouldShowModal()) {
          showModalIfNeeded();
        }
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleClose = () => {
    setShowModal(false);
  };

  const handleUpgrade = () => {
    setShowModal(false);
    // Navigate to membership page or my-account
    router.push("/my-account#membership-details");
  };

  // Don't render anything if user is Diamond member
  if (isDiamond) return null;

  return (
    <DiamondUpgradeModal
      isOpen={showModal}
      onClose={handleClose}
      onUpgrade={handleUpgrade}
    />
  );
}

