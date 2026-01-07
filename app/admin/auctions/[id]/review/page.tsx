"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, IndianRupee, Clock, User, ShieldCheck, Gavel } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatDateTime } from "@/lib/date-format";

interface Bid {
  id: string;
  bidAmount: number;
  bidTime: string;
  bidder: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email: string | null;
    whatsappNumber: string | null;
  };
}

interface Auction {
  id: string;
  reservePrice: number;
  status: string;
  endTime: string;
  reservePriceMet: boolean;
  highestBid: {
    id: string;
    amount: number;
    bidTime: string;
    bidder: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email: string | null;
    };
  } | null;
  totalBids: number;
  uniqueBidders: number;
}

export default function AdminAuctionReviewPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingWinner, setConfirmingWinner] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchAuctionBids();
  }, [auctionId]);

  // Auto-select earliest bid if there's a tie
  useEffect(() => {
    if (bids.length > 0 && auction) {
      const highestAmount = bids[0].bidAmount;
      const tieBids = bids.filter(bid => bid.bidAmount === highestAmount);
      
      // If there's a tie and no winner selected yet, auto-select earliest bid
      if (tieBids.length > 1 && !selectedWinnerId && auction.reservePriceMet) {
        const earliestBid = [...tieBids].sort((a, b) => 
          new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime()
        )[0];
        setSelectedWinnerId(earliestBid.id);
      } else if (tieBids.length === 1 && !selectedWinnerId && auction.reservePriceMet) {
        // No tie, just select the highest bid
        setSelectedWinnerId(tieBids[0].id);
      }
    }
  }, [bids, auction, selectedWinnerId]);

  const fetchAuctionBids = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/auctions/${auctionId}/bids`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAuction(data.auction);
        setBids(data.bids);
        // Auto-select highest bid if reserve met
        // For ties, select the earliest bid (first in sorted array is highest, if tie then earliest)
        if (data.highestBid && data.auction.reservePriceMet) {
          // Check for ties
          const highestAmount = data.highestBid.amount;
          const tieBids = data.bids.filter((bid: Bid) => bid.bidAmount === highestAmount);
          
          if (tieBids.length > 1) {
            // Multiple bids with same amount - select earliest (first by bidTime)
            const earliestBid = tieBids.sort((a: Bid, b: Bid) => 
              new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime()
            )[0];
            setSelectedWinnerId(earliestBid.id);
          } else {
            setSelectedWinnerId(data.highestBid.id);
          }
        }
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to load auction bids");
        router.push("/admin");
      }
    } catch (error) {
      console.error("Error fetching auction bids:", error);
      toast.error("Failed to load auction bids");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWinner = async () => {
    if (!selectedWinnerId) {
      toast.error("Please select a winner");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setConfirmingWinner(true);
    try {
      const selectedBid = bids.find(b => b.id === selectedWinnerId);
      if (!selectedBid) {
        toast.error("Selected bid not found");
        return;
      }

      const response = await fetch(`/api/admin/auctions/${auctionId}/confirm-winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          winnerBidId: selectedWinnerId,
          winnerId: selectedBid.bidder.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Winner confirmed successfully!");
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to confirm winner");
      }
    } catch (error) {
      console.error("Error confirming winner:", error);
      toast.error("An error occurred");
    } finally {
      setConfirmingWinner(false);
      setShowConfirmModal(false);
    }
  };

  const handleMarkFailed = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!confirm("Are you sure you want to mark this auction as failed? This will notify all bidders.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/auctions/${auctionId}/mark-failed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Auction marked as failed");
        setTimeout(() => {
          router.push("/admin");
        }, 2000);
      } else {
        toast.error(result.message || "Failed to mark auction as failed");
      }
    } catch (error) {
      console.error("Error marking auction as failed:", error);
      toast.error("An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction bids...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Auction not found</p>
          <Link href="/admin" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  // Find tie-breaker candidates (bids with same highest amount)
  const highestAmount = bids.length > 0 ? bids[0].bidAmount : 0;
  const tieBids = bids.filter(bid => bid.bidAmount === highestAmount);
  const hasTie = tieBids.length > 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Auction Bids Review</h1>
          <p className="text-gray-600 mt-2">Auction ID: {auctionId.slice(-8)}</p>
        </div>

        {/* Auction Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Reserve Price</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{auction.reservePrice.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Highest Bid</p>
              <p className="text-xl font-bold text-primary-600">
                {auction.highestBid ? (
                  <>₹{auction.highestBid.amount.toLocaleString("en-IN")}</>
                ) : (
                  <span className="text-gray-400">No bids</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Bids</p>
              <p className="text-xl font-bold text-gray-900">{auction.totalBids}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Unique Bidders</p>
              <p className="text-xl font-bold text-gray-900">{auction.uniqueBidders}</p>
            </div>
          </div>

          {/* Reserve Price Status */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            {auction.reservePriceMet ? (
              <div className="flex items-center bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-semibold">
                  Reserve Price Met ✓
                </span>
              </div>
            ) : (
              <div className="flex items-center bg-red-50 border border-red-200 rounded-lg p-3">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-semibold">
                  Reserve Price NOT Met ✗
                </span>
                <span className="text-red-700 ml-2 text-sm">
                  (Highest: ₹{auction.highestBid?.amount.toLocaleString("en-IN") || 0} / Required: ₹{auction.reservePrice.toLocaleString("en-IN")})
                </span>
              </div>
            )}
          </div>

          {/* Tie Warning */}
          {hasTie && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-yellow-800 font-semibold mb-1">Tie Detected!</p>
                  <p className="text-sm text-yellow-700">
                    {tieBids.length} bids have the same highest amount (₹{highestAmount.toLocaleString("en-IN")}).
                    The earliest bid will be selected as the winner.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bids Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">All Bids (Sorted by Amount)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review all bids and select the winner
            </p>
          </div>

          {bids.length === 0 ? (
            <div className="p-12 text-center">
              <Gavel className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bids placed in this auction</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Select
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bid Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bidder
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bid Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bids.map((bid, index) => {
                    const isSelected = selectedWinnerId === bid.id;
                    const isHighest = index === 0;
                    const isTie = tieBids.some(tb => tb.id === bid.id);
                    
                    return (
                      <tr
                        key={bid.id}
                        className={`hover:bg-gray-50 ${
                          isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
                        } ${isHighest ? "bg-green-50" : ""}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="winner"
                            checked={isSelected}
                            onChange={() => setSelectedWinnerId(bid.id)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            index === 0
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <IndianRupee className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-lg font-bold text-gray-900">
                              {bid.bidAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{bid.bidder.fullName}</p>
                            <p className="text-xs text-gray-500">ID: {bid.bidder.id.slice(-8)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <p>{bid.bidder.phoneNumber}</p>
                            {bid.bidder.email && (
                              <p className="text-xs text-gray-500">{bid.bidder.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDateTime(bid.bidTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isHighest && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Highest
                            </span>
                          )}
                          {isTie && !isHighest && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Tie
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          {auction.reservePriceMet ? (
            <>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={!selectedWinnerId || confirmingWinner}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirm Winner
              </button>
              <button
                onClick={handleMarkFailed}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Mark as Failed
              </button>
            </>
          ) : (
            <button
              onClick={handleMarkFailed}
              className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
            >
              <XCircle className="w-5 h-5 mr-2" />
              Mark Auction as Failed (Reserve Not Met)
            </button>
          )}
        </div>

        {/* Winner Confirmation Modal */}
        {showConfirmModal && selectedWinnerId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Confirm Winner</h2>
              {(() => {
                const selectedBid = bids.find(b => b.id === selectedWinnerId);
                if (!selectedBid) return null;
                return (
                  <>
                    <div className="mb-6">
                      <p className="text-gray-600 mb-4">
                        Are you sure you want to confirm this bidder as the winner?
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-semibold text-lg mb-2">{selectedBid.bidder.fullName}</p>
                        <p className="text-sm text-gray-600 mb-2">Phone: {selectedBid.bidder.phoneNumber}</p>
                        {selectedBid.bidder.email && (
                          <p className="text-sm text-gray-600 mb-2">Email: {selectedBid.bidder.email}</p>
                        )}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-500">Winning Bid Amount</p>
                          <p className="text-2xl font-bold text-primary-600">
                            ₹{selectedBid.bidAmount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirmModal(false)}
                        disabled={confirmingWinner}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleConfirmWinner}
                        disabled={confirmingWinner}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {confirmingWinner ? "Confirming..." : "Confirm Winner"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

