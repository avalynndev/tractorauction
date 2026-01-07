"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Gavel, Clock, CheckCircle, XCircle, Eye, AlertTriangle } from "lucide-react";
import { formatDateTime } from "@/lib/date-format";
import { getApprovalDeadlineRemaining, calculateApprovalDeadline } from "@/lib/auction-utils";
import BackButton from "@/components/navigation/BackButton";

interface Auction {
  id: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  reservePrice: number;
  status: string;
  sellerApprovalStatus: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    mainPhoto: string | null;
    saleAmount: number;
  };
  winner: {
    id: string;
    fullName: string;
    phoneNumber: string;
    whatsappNumber: string;
    city: string;
    state: string;
  } | null;
  bids: Array<{
    id: string;
    bidAmount: number;
    bidTime: string;
    bidder: {
      fullName: string;
      phoneNumber: string;
    };
  }>;
}

export default function MyAuctionsPage() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingAuctionId, setRejectingAuctionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserAndAuctions(token);
  }, [router]);

  const fetchUserAndAuctions = async (token: string) => {
    try {
      // Get user role
      const userResponse = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserRole(userData.role);

        // Fetch seller's auctions (for SELLER and DEALER)
        if (userData.role === "SELLER" || userData.role === "DEALER") {
          const auctionsResponse = await fetch("/api/my-account/auctions/seller", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (auctionsResponse.ok) {
            const auctionsData = await auctionsResponse.json();
            setAuctions(auctionsData);
          }
        }
        
        // Fetch buyer's bids (for BUYER and DEALER)
        if (userData.role === "BUYER" || userData.role === "DEALER") {
          const bidsResponse = await fetch("/api/my-account/auctions/buyer", {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (bidsResponse.ok) {
            const bidsData = await bidsResponse.json();
            // For dealers, merge with existing auctions if any
            setAuctions((prev) => {
              if (userData.role === "DEALER" && prev.length > 0) {
                return [...prev, ...bidsData];
              }
              return bidsData;
            });
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (auctionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Find auction to show bid amount in confirmation
    const auction = auctions.find(a => a.id === auctionId);
    const bidAmount = auction?.currentBid || 0;
    
    const confirmed = confirm(
      `Are you sure you want to approve the winning bid of ₹${bidAmount.toLocaleString("en-IN")}?\n\n` +
      `This will complete the sale and mark the vehicle as SOLD.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/auctions/${auctionId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalStatus: "APPROVED" }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Bid of ₹${bidAmount.toLocaleString("en-IN")} approved successfully!`);
        fetchUserAndAuctions(token);
      } else {
        toast.error(result.message || "Failed to approve bid");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleReject = async (auctionId: string) => {
    setRejectingAuctionId(auctionId);
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectingAuctionId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/auctions/${rejectingAuctionId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          approvalStatus: "REJECTED",
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Bid rejected successfully");
        setShowRejectModal(false);
        setRejectingAuctionId(null);
        setRejectionReason("");
        fetchUserAndAuctions(token);
      } else {
        toast.error(result.message || "Failed to reject bid");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/my-account" label="Back to My Account" />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-900">
            {userRole === "SELLER" || userRole === "DEALER" ? "My Auctions" : "My Bids"}
          </h1>
        </div>

        {auctions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-lg">
              {userRole === "SELLER" || userRole === "DEALER"
                ? "You don't have any auctions yet."
                : "You haven't placed any bids yet."}
            </p>
            <Link
              href={userRole === "SELLER" || userRole === "DEALER" ? "/sell/upload" : "/auctions"}
              className="text-primary-600 hover:underline mt-4 inline-block"
            >
              {userRole === "SELLER" || userRole === "DEALER" ? "List a Vehicle" : "Browse Auctions"}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {auctions.map((auction) => (
              <div key={auction.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel || ""} {auction.vehicle.engineHP} HP
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <span className={`ml-2 font-semibold ${
                          auction.status === "LIVE" ? "text-red-600" :
                          auction.status === "ENDED" ? "text-gray-600" :
                          "text-yellow-600"
                        }`}>
                          {auction.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Bidding Status:</span>
                        <span className="ml-2 font-semibold text-green-600">
                          {auction.status === "LIVE" ? "Active" : auction.status === "ENDED" ? "Ended" : "Scheduled"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Total Bids:</span>
                        <span className="ml-2 font-semibold text-primary-600">
                          {auction.bids?.length || 0} {auction.bids?.length === 1 ? 'bid' : 'bids'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">End Time:</span>
                        <span className="ml-2">
                          {formatDateTime(auction.endTime)}
                        </span>
                      </div>
                      {auction.status === "ENDED" && auction.winner && (
                        <div>
                          <span className="text-gray-500">Winner:</span>
                          <span className="ml-2 font-semibold">{auction.winner.fullName}</span>
                        </div>
                      )}
                    </div>
                    {(userRole === "SELLER" || userRole === "DEALER") && auction.status === "ENDED" && auction.sellerApprovalStatus === "PENDING" && (() => {
                      const deadlineRemaining = getApprovalDeadlineRemaining(new Date(auction.endTime));
                      const deadlineDate = calculateApprovalDeadline(new Date(auction.endTime));
                      
                      return (
                        <div className={`mt-4 p-4 rounded-lg border-2 ${
                          deadlineRemaining.isOverdue 
                            ? "bg-red-50 border-red-300" 
                            : deadlineRemaining.days <= 1 
                            ? "bg-orange-50 border-orange-300"
                            : "bg-yellow-50 border-yellow-200"
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className={`text-sm font-semibold mb-1 ${
                                deadlineRemaining.isOverdue 
                                  ? "text-red-800" 
                                  : deadlineRemaining.days <= 1 
                                  ? "text-orange-800"
                                  : "text-yellow-800"
                              }`}>
                                <strong>⚠️ Action Required:</strong> Your auction has ended. Please review and approve/reject the winning bid.
                              </p>
                              {deadlineRemaining.isOverdue ? (
                                <p className="text-xs text-red-700 font-semibold flex items-center mt-2">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  DEADLINE PASSED - Please take action immediately
                                </p>
                              ) : (
                                <p className="text-xs text-gray-700 mt-2">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  Deadline: {formatDateTime(deadlineDate.toISOString())} 
                                  {deadlineRemaining.days > 0 && ` (${deadlineRemaining.days} day${deadlineRemaining.days > 1 ? 's' : ''} remaining)`}
                                  {deadlineRemaining.days === 0 && deadlineRemaining.hours > 0 && ` (${deadlineRemaining.hours} hour${deadlineRemaining.hours > 1 ? 's' : ''} remaining)`}
                                  {deadlineRemaining.days === 0 && deadlineRemaining.hours === 0 && ` (${deadlineRemaining.minutes} minute${deadlineRemaining.minutes > 1 ? 's' : ''} remaining)`}
                                </p>
                              )}
                            </div>
                          </div>
                        
                        {/* Winning Bid Details */}
                        {auction.winner && (
                          <div className="bg-white rounded-lg p-4 mb-3 border border-yellow-300">
                            <h4 className="font-semibold text-gray-800 mb-2">Winning Bid Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-600">Winning Bid Amount:</span>
                                <span className="ml-2 font-bold text-primary-600 text-lg">
                                  ₹{auction.currentBid.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Reserve Price:</span>
                                <span className="ml-2 font-medium">
                                  ₹{auction.reservePrice.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Buyer Name:</span>
                                <span className="ml-2 font-semibold">{auction.winner.fullName}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2">{auction.winner.city}, {auction.winner.state}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Phone:</span>
                                <span className="ml-2">{auction.winner.phoneNumber}</span>
                              </div>
                              {auction.winner.whatsappNumber && (
                                <div>
                                  <span className="text-gray-600">WhatsApp:</span>
                                  <span className="ml-2">{auction.winner.whatsappNumber}</span>
                                </div>
                              )}
                            </div>
                            {auction.bids && auction.bids.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <span className="text-gray-600 text-xs">Total Bids Received: </span>
                                <span className="font-semibold text-primary-600">{auction.bids.length}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleApprove(auction.id)}
                            className="flex items-center space-x-1 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Approve Bid</span>
                          </button>
                          <button
                            onClick={() => handleReject(auction.id)}
                            className="flex items-center space-x-1 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject Bid</span>
                          </button>
                        </div>
                      </div>
                      );
                    })()}
                    {auction.sellerApprovalStatus === "APPROVED" && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <p className="text-green-800 font-semibold text-lg">Bid Approved - Sale Completed</p>
                        </div>
                        {auction.winner && (
                          <div className="text-sm text-green-700 space-y-1">
                            <p>
                              <span className="font-medium">Winning Bid:</span> ₹{auction.currentBid.toLocaleString("en-IN")}
                            </p>
                            <p>
                              <span className="font-medium">Buyer:</span> {auction.winner.fullName}
                            </p>
                            <p className="text-xs text-green-600 mt-2">
                              The vehicle has been marked as SOLD. Please contact the buyer to complete the transaction.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {auction.sellerApprovalStatus === "REJECTED" && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-2">
                        <div className="flex items-center space-x-2 mb-2">
                          <XCircle className="w-5 h-5 text-red-600" />
                          <p className="text-red-800 font-semibold text-lg">Bid Rejected</p>
                        </div>
                        <p className="text-sm text-red-700">
                          The winning bid has been rejected. The auction is now closed.
                        </p>
                      </div>
                    )}
                  </div>
                  <Link
                    href={`/auctions/${auction.id}/live`}
                    className="ml-4 flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl my-auto">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Winning Bid</h3>
              <p className="text-sm text-gray-600">
                Are you sure you want to reject this winning bid? This action cannot be undone.
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection (optional)..."
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {rejectionReason.length}/500 characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingAuctionId(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors touch-manipulation text-base"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors touch-manipulation text-base"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

