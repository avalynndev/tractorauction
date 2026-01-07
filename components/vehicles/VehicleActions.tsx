"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Bookmark, Eye, Share2, MessageCircle, GitCompare } from "lucide-react";
import toast from "react-hot-toast";
import { addToComparison } from "./VehicleComparison";

interface VehicleActionsProps {
  vehicleId: string;
  saleType: "AUCTION" | "PREAPPROVED";
  className?: string;
  showLabels?: boolean;
  onWatchlistChange?: (isInWatchlist: boolean) => void;
  onShortlistChange?: (isShortlisted: boolean) => void;
}

export default function VehicleActions({
  vehicleId,
  saleType,
  className = "",
  showLabels = false,
  onWatchlistChange,
  onShortlistChange,
}: VehicleActionsProps) {
  const router = useRouter();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadStatus = async () => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (isMounted) {
        setIsAuthenticated(!!token);
      }
      
      if (token && isMounted) {
        await checkWatchlistStatus(token, abortController);
        if (saleType === "AUCTION" && isMounted) {
          await checkShortlistStatus(token, abortController);
        }
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [vehicleId, saleType]);

  const checkWatchlistStatus = async (token: string, abortController?: AbortController) => {
    try {
      const controller = abortController || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch("/api/watchlist", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          return; // Silently ignore aborted requests
        }
        // Silently handle network errors - watchlist status is not critical
        return;
      }

      if (controller.signal.aborted) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const inWatchlist = data.watchlist?.some(
          (item: any) => item.vehicleId === vehicleId
        );
        setIsInWatchlist(inWatchlist);
        onWatchlistChange?.(inWatchlist);
      }
    } catch (error: any) {
      // Silently handle errors - watchlist status is not critical
      if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error checking watchlist:", error);
        }
      }
    }
  };

  const checkShortlistStatus = async (token: string, abortController?: AbortController) => {
    try {
      const controller = abortController || new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch("/api/shortlist", {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          return; // Silently ignore aborted requests
        }
        // Silently handle network errors - shortlist status is not critical
        return;
      }

      if (controller.signal.aborted) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        const shortlisted = data.shortlist?.some(
          (item: any) => item.vehicleId === vehicleId
        );
        setIsShortlisted(shortlisted);
        onShortlistChange?.(shortlisted);
      }
    } catch (error: any) {
      // Silently handle errors - shortlist status is not critical
      if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error checking shortlist:", error);
        }
      }
    }
  };

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please login to add to watchlist");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    try {
      if (isInWatchlist) {
        const response = await fetch(`/api/watchlist?vehicleId=${vehicleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          setIsInWatchlist(false);
          onWatchlistChange?.(false);
          toast.success("Removed from watchlist");
        } else {
          toast.error("Failed to remove from watchlist");
        }
      } else {
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vehicleId }),
        });
        
        if (response.ok) {
          setIsInWatchlist(true);
          onWatchlistChange?.(true);
          toast.success("Added to watchlist");
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to add to watchlist");
        }
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleShortlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.error("Please login to shortlist for bidding");
      return;
    }

    if (saleType !== "AUCTION") {
      toast.error("Only auction vehicles can be shortlisted");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    try {
      if (isShortlisted) {
        const response = await fetch(`/api/shortlist?vehicleId=${vehicleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          setIsShortlisted(false);
          onShortlistChange?.(false);
          toast.success("Removed from shortlist");
        } else {
          toast.error("Failed to remove from shortlist");
        }
      } else {
        const response = await fetch("/api/shortlist", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vehicleId }),
        });
        
        if (response.ok) {
          setIsShortlisted(true);
          onShortlistChange?.(true);
          toast.success("Shortlisted for bidding");
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to shortlist");
        }
      }
    } catch (error) {
      console.error("Error toggling shortlist:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this vehicle",
          text: "I found this vehicle on Tractor Auction",
          url: `${window.location.origin}/vehicles/${vehicleId}`,
        });
      } catch (error) {
        // User cancelled or error occurred
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/vehicles/${vehicleId}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const recordView = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      try {
        await fetch("/api/recent-views", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vehicleId }),
        });
      } catch (error) {
        // Silent fail for view tracking
      }
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    recordView();
    router.push(`/vehicles/${vehicleId}`);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleWatchlistToggle}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors ${
          isInWatchlist
            ? "bg-red-100 text-red-600 hover:bg-red-200"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        } disabled:opacity-50`}
        title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
      >
        <Heart className={`w-5 h-5 ${isInWatchlist ? "fill-current" : ""}`} />
        {showLabels && (
          <span className="ml-1 text-sm">
            {isInWatchlist ? "Saved" : "Save"}
          </span>
        )}
      </button>

      {saleType === "AUCTION" && (
        <button
          onClick={handleShortlistToggle}
          disabled={loading}
          className={`p-2 rounded-lg transition-colors ${
            isShortlisted
              ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } disabled:opacity-50`}
          title={isShortlisted ? "Remove from shortlist" : "Shortlist for bidding"}
        >
          <Bookmark className={`w-5 h-5 ${isShortlisted ? "fill-current" : ""}`} />
          {showLabels && (
            <span className="ml-1 text-sm">
              {isShortlisted ? "Shortlisted" : "Shortlist"}
            </span>
          )}
        </button>
      )}

      <button
        onClick={handleViewDetails}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        title="View details"
      >
        <Eye className="w-5 h-5" />
        {showLabels && <span className="ml-1 text-sm">View</span>}
      </button>

      <button
        onClick={handleShare}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
        {showLabels && <span className="ml-1 text-sm">Share</span>}
      </button>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          addToComparison(vehicleId);
        }}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        title="Add to Comparison"
      >
        <GitCompare className="w-5 h-5" />
        {showLabels && <span className="ml-1 text-sm">Compare</span>}
      </button>
    </div>
  );
}

