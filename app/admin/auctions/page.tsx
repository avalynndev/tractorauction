"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Gavel, Play, Square, Eye, Clock, Users } from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-format";
import BackButton from "@/components/navigation/BackButton";
import Pagination from "@/components/common/Pagination";

interface Auction {
  id: string;
  referenceNumber?: string | null;
  startTime: string;
  endTime: string;
  currentBid: number;
  reservePrice: number;
  minimumIncrement: number;
  status: string;
  sellerApprovalStatus?: string;
  vehicle: {
    id: string;
    referenceNumber?: string | null;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    seller: {
      fullName: string;
      phoneNumber: string;
    };
  };
  bids: Array<{
    id: string;
    bidAmount: number;
    bidTime: string;
    bidder: {
      fullName: string;
    };
  }>;
  winner: {
    id: string;
    fullName: string;
  } | null;
}

export default function AdminAuctionsPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<"all" | "pending">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate filtered auctions
  const filteredAuctions = useMemo(() => {
    return filterTab === "pending"
      ? auctions.filter(a => a.status === "ENDED" && a.sellerApprovalStatus === "PENDING")
      : auctions;
  }, [auctions, filterTab]);

  // Calculate pagination values
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAuctions.length / itemsPerPage));
  }, [filteredAuctions.length, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterTab]);

  // Stable page change handler that ensures valid page numbers
  const handlePageChange = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  }, [totalPages]);

  // Calculate valid current page (clamp to valid range) - used for display only
  const validCurrentPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(Math.max(1, currentPage), totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserAndAuctions(token, true);
    
    // Only refresh when page is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        return;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Refresh every 30 seconds, but only if page is visible
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchUserAndAuctions(token, false); // false = silent refresh
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  const fetchUserAndAuctions = async (token: string, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      const userResponse = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);

        if (userData.role !== "ADMIN") {
          toast.error("Access denied. Admin only.");
          router.push("/my-account");
          return;
        }

        const auctionsResponse = await fetch("/api/admin/auctions", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (auctionsResponse.ok) {
          const auctionsData = await auctionsResponse.json();
          setAuctions(auctionsData);
        }
      }
    } catch (error) {
      if (showLoading) {
        toast.error("Failed to load auctions");
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleStartAuction = async (auctionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/auctions/${auctionId}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Auction started successfully");
        fetchUserAndAuctions(token);
      } else {
        toast.error(result.message || "Failed to start auction");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleEndAuction = async (auctionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Are you sure you want to end this auction? This will determine the winner.")) {
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auctionId}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Auction ended successfully");
        fetchUserAndAuctions(token);
      } else {
        toast.error(result.message || "Failed to end auction");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const getTimeRemaining = (startTime: string, endTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (now < start) {
      const diff = start - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${minutes}m`;
    }

    const diff = end - now;
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/admin" label="Back to Admin Dashboard" />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Auction Management</h1>
          <p className="text-gray-600">Manage live and scheduled auctions</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-1 inline-flex">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              filterTab === "all"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            All Auctions
          </button>
          <button
            onClick={() => setFilterTab("pending")}
            className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
              filterTab === "pending"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Pending Seller Approval
            {auctions.filter(a => a.status === "ENDED" && a.sellerApprovalStatus === "PENDING").length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {auctions.filter(a => a.status === "ENDED" && a.sellerApprovalStatus === "PENDING").length}
              </span>
            )}
          </button>
        </div>

        {(() => {
          const startIndex = (validCurrentPage - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          const paginatedAuctions = filteredAuctions.slice(startIndex, endIndex);

          return filteredAuctions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 text-lg">
                {filterTab === "pending" ? "No auctions pending seller approval" : "No auctions found"}
              </p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 gap-6">
              {paginatedAuctions.map((auction) => (
              <div key={auction.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {(auction.referenceNumber || auction.vehicle.referenceNumber) && (
                        <div className="flex items-center gap-2">
                          {auction.referenceNumber && (
                            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-mono font-semibold">
                              AU: {auction.referenceNumber}
                            </span>
                          )}
                          {auction.vehicle.referenceNumber && (
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-mono font-semibold">
                              VH: {auction.vehicle.referenceNumber}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-xl font-semibold">
                        {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel || ""} {auction.vehicle.engineHP} HP
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          auction.status === "LIVE"
                            ? "bg-red-100 text-red-800"
                            : auction.status === "ENDED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {auction.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="text-gray-500">Start Time:</span>
                        <p className="font-medium">{formatDateTime(auction.startTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">End Time:</span>
                        <p className="font-medium">{formatDateTime(auction.endTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Highest Bid:</span>
                        <p className="font-semibold text-primary-600">
                          ₹{auction.currentBid.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Reserve Price:</span>
                        <p className="font-medium">₹{auction.reservePrice.toLocaleString("en-IN")}</p>
                      </div>
                      {auction.winner && (
                        <div>
                          <span className="text-gray-500">Highest Bidder:</span>
                          <p className="font-semibold text-green-600">{auction.winner.fullName}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Min. Increment:</span>
                        <p className="font-medium">₹{auction.minimumIncrement.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time Remaining:</span>
                        <p className="font-medium">{getTimeRemaining(auction.startTime, auction.endTime)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Bids:</span>
                        <p className="font-medium flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {auction.bids.length}
                        </p>
                      </div>
                      {auction.winner && (
                        <div>
                          <span className="text-gray-500">Winner:</span>
                          <p className="font-semibold text-green-600">{auction.winner.fullName}</p>
                        </div>
                      )}
                      {auction.status === "ENDED" && auction.sellerApprovalStatus && (
                        <div>
                          <span className="text-gray-500">Seller Approval:</span>
                          <p className={`font-semibold ${
                            auction.sellerApprovalStatus === "APPROVED" ? "text-green-600" :
                            auction.sellerApprovalStatus === "REJECTED" ? "text-red-600" :
                            "text-yellow-600"
                          }`}>
                            {auction.sellerApprovalStatus}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Pending Approval Alert */}
                    {auction.status === "ENDED" && auction.sellerApprovalStatus === "PENDING" && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-semibold mb-2">⚠️ Awaiting Seller Approval</p>
                        <p className="text-sm text-yellow-700">
                          This auction has ended. The seller needs to approve or reject the winning bid of ₹{auction.currentBid.toLocaleString("en-IN")}.
                        </p>
                        {auction.vehicle.seller && (
                          <p className="text-xs text-yellow-600 mt-2">
                            Seller: {auction.vehicle.seller.fullName} ({auction.vehicle.seller.phoneNumber})
                          </p>
                        )}
                      </div>
                    )}
                    {auction.bids.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-2">Recent Bids:</p>
                        <div className="space-y-1">
                          {auction.bids.slice(0, 5).map((bid) => (
                            <div key={bid.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>{bid.bidder.fullName}</span>
                              <span className="font-semibold">₹{bid.bidAmount.toLocaleString("en-IN")}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      href={`/auctions/${auction.id}/live`}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    {auction.status === "SCHEDULED" && (
                      <button
                        onClick={() => handleStartAuction(auction.id)}
                        className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start</span>
                      </button>
                    )}
                    {auction.status === "LIVE" && (
                      <button
                        onClick={() => handleEndAuction(auction.id)}
                        className="flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        <Square className="w-4 h-4" />
                        <span>End</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>
            {filteredAuctions.length > itemsPerPage && (
              <div className="mt-6">
                <Pagination
                  currentPage={validCurrentPage}
                  totalPages={totalPages}
                  totalItems={filteredAuctions.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

