"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";
import {
  Gavel,
  Clock,
  MapPin,
  Calendar,
  IndianRupee,
  ArrowLeft,
  TrendingUp,
  Users,
  FileText,
  UserCheck,
  Package,
  Info,
  X,
  ShieldCheck,
  CreditCard,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/date-format";
import CompleteVehicleDetails from "@/components/vehicles/CompleteVehicleDetails";
import PhotoGallery from "@/components/vehicles/PhotoGallery";
import TermsAndConditionsModal from "@/components/auctions/TermsAndConditionsModal";
import BackButton from "@/components/navigation/BackButton";
import VideoPlayer from "@/components/video/VideoPlayer";

interface Bid {
  id: string;
  bidAmount: number;
  bidTime: string;
  isWinningBid: boolean;
  bidder: {
    id: string;
    fullName: string;
    phoneNumber: string;
  };
}

interface Auction {
  id: string;
  startTime: string;
  endTime: string;
  currentBid: number;
  reservePrice: number;
  minimumIncrement: number;
  status: string;
  sellerApprovalStatus?: string;
  biddingType?: string; // "OPEN" or "SEALED"
  bidVisibility?: string; // "VISIBLE" or "HIDDEN"
  vehicle: {
    id: string;
    vehicleType: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    registrationNumber: string | null;
    engineNumber: string | null;
    chassisNumber: string | null;
    hoursRun: string | null;
    financeNocPapers: string | null;
    readyForToken: string | null;
    state: string;
    district: string | null;
    runningCondition: string;
    insuranceStatus: string;
    rcCopyStatus: string;
    rcCopyType: string | null;
    clutchType: string | null;
    ipto: boolean | null;
    drive: string | null;
    steering: string | null;
    tyreBrand: string | null;
    otherFeatures: string | null;
    isCertified: boolean;
    isFinanceAvailable: boolean;
    saleAmount: number;
    basePrice: number | null;
    mainPhoto: string | null;
    subPhotos: string[];
    videoUrl: string | null;
    videoThumbnail: string | null;
    seller: {
      fullName: string;
      phoneNumber: string;
      whatsappNumber: string;
    };
    inspectionReports?: Array<{
      id: string;
      inspectionDate: string;
      inspectionType: string;
      status: string;
      overallCondition: string | null;
      issuesCount: number;
      criticalIssues: number;
      verifiedAt: string | null;
    }>;
  };
  bids: Bid[];
  winner: {
    id: string;
    fullName: string;
    phoneNumber: string;
  } | null;
}

export default function LiveAuctionPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  // Check if user is admin (for testing purposes) - MUST be before any conditional returns
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  // Terms and Conditions modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isTermsModalOnPageLoad, setIsTermsModalOnPageLoad] = useState(false);
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingBidAmount, setPendingBidAmount] = useState<number | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  // Membership state
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [membershipChecked, setMembershipChecked] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showCompleteDetails, setShowCompleteDetails] = useState(false);
  const [photoGallery, setPhotoGallery] = useState<{ photos: string[]; initialIndex: number } | null>(null);
  // Bid result modal state
  const [showBidResultModal, setShowBidResultModal] = useState(false);
  const [bidResult, setBidResult] = useState<{
    isHigher: boolean;
    bidAmount: number;
    position: number;
  } | null>(null);
  // User's own bids (for sealed bidding)
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [bidCount, setBidCount] = useState(0);
  // EMD state
  const [emdStatus, setEmdStatus] = useState<{
    emdRequired: boolean;
    emdAmount?: number;
    emdStatus?: string;
    emd?: any;
  } | null>(null);
  const [showEMDModal, setShowEMDModal] = useState(false);
  const [isProcessingEMD, setIsProcessingEMD] = useState(false);

  useEffect(() => {
    fetchAuction();
    setupSocket();
    
    // Check if returning from membership purchase
    const returnUrl = sessionStorage.getItem("membershipReturnUrl");
    if (returnUrl && returnUrl.includes(auctionId)) {
      // Refresh membership status
      const token = localStorage.getItem("token");
      if (token) {
        fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.membership) {
              const endDate = new Date(data.membership.endDate);
              const isActive = endDate > new Date() && data.membership.status === "active";
              setHasActiveMembership(isActive);
              setMembershipChecked(true);
              if (isActive) {
                toast.success("Membership activated! You can now place bids.");
              }
            }
          })
          .catch((err) => console.error("Error refreshing membership:", err));
      }
      sessionStorage.removeItem("membershipReturnUrl");
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [auctionId]);

  // Check terms acceptance on page load
  useEffect(() => {
    if (!loading && auction) {
      // Check if terms were accepted today (once per day)
      const termsAcceptedDate = localStorage.getItem("auctionTermsAcceptedDate");
      const isTermsAccepted = localStorage.getItem("auctionTermsAccepted") === "true";
      
      // Check if acceptance is today (same day)
      let shouldShowTerms = true;
      if (isTermsAccepted && termsAcceptedDate) {
        const acceptedDate = new Date(termsAcceptedDate);
        const now = new Date();
        const isSameDay = 
          acceptedDate.getDate() === now.getDate() &&
          acceptedDate.getMonth() === now.getMonth() &&
          acceptedDate.getFullYear() === now.getFullYear();
        
        if (isSameDay) {
          shouldShowTerms = false;
          setTermsAccepted(true);
        }
      }

      // Show terms modal immediately if not accepted today
      if (shouldShowTerms) {
        // Set a default bid amount for display (minimum bid or reserve price)
        const defaultBidAmount = auction.currentBid > 0 
          ? auction.currentBid + auction.minimumIncrement 
          : auction.reservePrice;
        setPendingBidAmount(defaultBidAmount);
        setIsTermsModalOnPageLoad(true);
        setShowTermsModal(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, auction]);

  useEffect(() => {
    if (auction) {
      const interval = setInterval(() => {
        updateTimeRemaining();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [auction]);

  const setupSocket = () => {
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      path: "/api/socket",
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      socket.emit("join-auction", auctionId);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
      setIsConnected(false);
    });

    socket.on("new-bid", (data: { bid: Bid; currentBid: number; endTime?: string; extended?: boolean; extensionCount?: number }) => {
      // For open bidding - show bid details
      setAuction((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          currentBid: data.currentBid,
          bids: [data.bid, ...prev.bids.slice(0, 9)],
        };
        
        // Update end time if extended
        if (data.extended && data.endTime) {
          updated.endTime = data.endTime;
          updated.extensionCount = data.extensionCount || 0;
        }
        
        return updated;
      });
      
      if (data.extended) {
        toast.success(`Auction extended! New bid: ₹${data.bid.bidAmount.toLocaleString("en-IN")}`, {
          icon: "⏰",
          duration: 5000,
        });
        updateTimeRemaining();
      } else {
        toast.success(`New bid: ₹${data.bid.bidAmount.toLocaleString("en-IN")}`, {
          icon: "💰",
        });
      }
    });

    socket.on("bid-update", (data: { bidCount: number; endTime?: string; extended?: boolean; extensionCount?: number }) => {
      // For sealed bidding - only update bid count, not bid details
      setBidCount(data.bidCount);
      
      // Update auction end time if extended
      if (data.extended && data.endTime) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            endTime: data.endTime!,
            extensionCount: data.extensionCount || 0,
          };
        });
        toast.success(`Auction extended! New end time updated.`, {
          icon: "⏰",
          duration: 5000,
        });
      } else {
        toast.success(`New bid placed! Total bids: ${data.bidCount}`, {
          icon: "🔒",
        });
      }
    });
    
    socket.on("auction-extended", (data: { newEndTime: string; extensionCount: number; extendedBy: number; message: string }) => {
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          endTime: data.newEndTime,
          extensionCount: data.extensionCount,
        };
      });
      toast.success(data.message, {
        icon: "⏰",
        duration: 5000,
      });
      updateTimeRemaining();
    });

    socket.on("auction-ended", () => {
      setAuction((prev) => {
        if (!prev) return prev;
        return { ...prev, status: "ENDED" };
      });
      toast.success("Auction has ended!");
    });

    socketRef.current = socket;
  };

  const fetchAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}`);
      if (response.ok) {
        const data = await response.json();
        setAuction(data);
        setBidCount(data.bids?.length || 0);
        updateTimeRemaining();
        
        // If sealed bidding and auction is live, fetch user's own bids
        const token = localStorage.getItem("token");
        if (token && data.biddingType === "SEALED" && data.status === "LIVE") {
          fetchMyBids(token);
        }
      } else {
        toast.error("Auction not found");
        router.push("/auctions");
      }
    } catch (error) {
      toast.error("Failed to load auction");
      router.push("/auctions");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBids = async (token: string) => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const bids = await response.json();
        setMyBids(bids);
      }
    } catch (error) {
      console.error("Error fetching my bids:", error);
    }
  };

  const updateTimeRemaining = () => {
    if (!auction) return;

    const now = new Date().getTime();
    const start = new Date(auction.startTime).getTime();
    const end = new Date(auction.endTime).getTime();

    if (now < start) {
      const diff = start - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`Starts in ${hours}h ${minutes}m ${seconds}s`);
    } else if (now >= end) {
      setTimeRemaining("Auction Ended");
    } else {
      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    }
  };

  const handlePlaceBid = async () => {
    // Check if terms are accepted - if not, show terms modal
    if (!termsAccepted) {
      toast.error("Please accept the terms and conditions first");
      const defaultBidAmount = auction && auction.currentBid > 0 
        ? auction.currentBid + auction.minimumIncrement 
        : auction?.reservePrice || 0;
      setPendingBidAmount(defaultBidAmount);
      setIsTermsModalOnPageLoad(false); // Not on page load, user clicked bid button
      setShowTermsModal(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to place a bid");
      router.push("/login");
      return;
    }

    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid bid amount");
      return;
    }

    // Terms already accepted, show confirmation modal directly
    // No validation here - button is always active
    setPendingBidAmount(amount);
    setShowConfirmModal(true);
  };

  const handleTermsAccepted = () => {
    const wasOnPageLoad = isTermsModalOnPageLoad;
    setShowTermsModal(false);
    setIsTermsModalOnPageLoad(false);
    setTermsAccepted(true);
    // Store acceptance with today's date
    localStorage.setItem("auctionTermsAccepted", "true");
    localStorage.setItem("auctionTermsAcceptedDate", new Date().toISOString());
    // Show confirmation modal after terms acceptance only if user was placing a bid
    // (not if they just accepted on page load)
    if (pendingBidAmount && !wasOnPageLoad) {
      setShowConfirmModal(true);
    }
  };

  const confirmPlaceBid = async () => {
    if (!pendingBidAmount) return;

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to place a bid");
      router.push("/login");
      return;
    }

    setIsPlacingBid(true);
    setShowConfirmModal(false);
    
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bidAmount: pendingBidAmount }),
      });

      const result = await response.json();

      if (response.ok) {
        // Fetch updated auction data to get all bids and calculate position
        const updatedAuctionResponse = await fetch(`/api/auctions/${auctionId}`);
        const updatedAuction = await updatedAuctionResponse.json();
        
        // Get current user info
        const userResponse = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = await userResponse.json();
        const currentUserId = userData.id;
        
        // Get all bids sorted by amount (descending)
        const allBids = updatedAuction.bids || [];
        const sortedBids = [...allBids].sort((a: Bid, b: Bid) => b.bidAmount - a.bidAmount);
        
        // Find current user's bid position
        const userBidIndex = sortedBids.findIndex((bid: Bid) => bid.bidder.id === currentUserId);
        const position = userBidIndex >= 0 ? userBidIndex + 1 : 0;
        
        // Check if bid is higher than previous highest bid
        const previousHighestBid = auction?.currentBid || auction?.reservePrice || 0;
        const isHigher = pendingBidAmount > previousHighestBid;
        
        // For sealed bidding, don't show position (bids are hidden)
        // For open bidding, show position
        if (auction?.biddingType === "SEALED") {
          setBidResult({
            isHigher: true, // Always true for sealed (we don't know position)
            bidAmount: pendingBidAmount,
            position: 0, // Don't show position for sealed
          });
          // Refresh user's own bids
          fetchMyBids(token);
        } else {
          setBidResult({
            isHigher,
            bidAmount: pendingBidAmount,
            position,
          });
        }
        setShowBidResultModal(true);
        
        setBidAmount("");
        setPendingBidAmount(null);
        // Socket will update the UI automatically
        fetchAuction(); // Refresh to get latest data
      } else {
        // Check if error is about bid being too low
        if (result.message && result.message.includes("Bid must be at least")) {
          // Show modal for lower bid (bid was rejected, so no position)
          setBidResult({
            isHigher: false,
            bidAmount: pendingBidAmount,
            position: 0, // 0 means bid was rejected
          });
          setShowBidResultModal(true);
          // Do NOT set bidAmount - let user enter their own amount
        } else {
          toast.error(result.message || "Failed to place bid");
        }
        // Removed: Do not recommend or pre-fill bid amount
      }
    } catch (error) {
      toast.error("An error occurred while placing bid");
    } finally {
      setIsPlacingBid(false);
    }
  };

  const calculateMinimumBid = () => {
    if (!auction) return auction.reservePrice;
    const minBid = auction.currentBid >= auction.reservePrice 
      ? auction.currentBid + auction.minimumIncrement 
      : auction.reservePrice;
    return minBid;
  };

  const handlePayEMD = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to pay EMD");
      router.push("/login");
      return;
    }

    if (isProcessingEMD) return;
    setIsProcessingEMD(true);

    try {
      // Step 1: Initiate EMD payment
      const response = await fetch(`/api/auctions/${auctionId}/emd`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate EMD payment");
        setIsProcessingEMD(false);
        return;
      }

      // Handle test mode
      if (result.testMode) {
        toast.success("EMD paid successfully (Test Mode)!");
        fetchEMDStatus(token);
        setShowEMDModal(false);
        setIsProcessingEMD(false);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment gateway is loading. Please try again in a moment.");
        setIsProcessingEMD(false);
        return;
      }

      // Step 2: Initialize Razorpay checkout
      const options = {
        key: result.key,
        amount: result.amount * 100, // Amount in paise
        currency: result.currency || "INR",
        name: "Tractor Auction",
        description: `EMD for Auction #${auctionId.slice(-6)}`,
        order_id: result.orderId,
        method: {
          upi: true, card: true, netbanking: true, wallet: true,
        },
        handler: async function (response: any) {
          // Step 3: Payment successful - verify with backend
          try {
            const callbackResponse = await fetch(`/api/auctions/${auctionId}/emd/payment-callback`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                emdId: result.emdId,
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: result.amount,
              }),
            });

            const callbackResult = await callbackResponse.json();

            if (callbackResponse.ok && callbackResult.success) {
              toast.success("EMD payment successful! You can now place bids.");
              fetchEMDStatus(token);
              setShowEMDModal(false);
            } else {
              toast.error(callbackResult.message || "EMD payment verification failed");
            }
          } catch (error) {
            console.error("EMD payment callback error:", error);
            toast.error("An error occurred while verifying payment");
          } finally {
            setIsProcessingEMD(false);
          }
        },
        prefill: {
          name: result.name || "",
          email: result.email || "",
          contact: result.contact || "",
        },
        theme: { color: "#059669" },
        modal: {
          ondismiss: function () {
            setIsProcessingEMD(false);
            toast.error("EMD payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("EMD payment failed:", response);
        toast.error(`EMD payment failed: ${response.error.description || "Unknown error"}`);
        setIsProcessingEMD(false);
      });

      razorpay.open();

    } catch (error) {
      console.error("EMD payment initiation error:", error);
      toast.error("An error occurred. Please try again.");
      setIsProcessingEMD(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          const adminStatus = data.role === "ADMIN" || data.role === "admin";
          setIsAdmin(adminStatus);
          
          // Check membership status
          if (data.membership) {
            const endDate = new Date(data.membership.endDate);
            const isActive = endDate > new Date() && data.membership.status === "active";
            setHasActiveMembership(isActive);
          } else {
            setHasActiveMembership(false);
          }
          
          setAdminChecked(true);
          setMembershipChecked(true);
          console.log("Live Auction - User check:", {
            role: data.role,
            isAdmin: adminStatus,
            hasMembership: hasActiveMembership,
            auctionStatus: auction?.status
          });
        })
        .catch((err) => {
          console.error("Error checking user status:", err);
          setIsAdmin(false);
          setHasActiveMembership(false);
          setAdminChecked(true);
          setMembershipChecked(true);
        });
    } else {
      setAdminChecked(true);
      setMembershipChecked(true);
    }
  }, [auction?.status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Auction not found</p>
          <Link href="/auctions" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Auctions
          </Link>
        </div>
      </div>
    );
  }

  const minimumBid = calculateMinimumBid();
  const hasStarted = new Date() >= new Date(auction.startTime);
  const hasEnded = new Date() > new Date(auction.endTime);
  const isCurrentlyLive = hasStarted && !hasEnded;
  // An auction is live if either the status is "LIVE" OR if the current time is between start and end
  const isLive = auction.status === "LIVE" || isCurrentlyLive;
  const isSealed = auction.biddingType === "SEALED";
  const isSealedAndLive = isSealed && isCurrentlyLive && !hasEnded;
  
  // Check EMD requirement
  const emdPaid = emdStatus?.emdStatus === "PAID" || !emdStatus?.emdRequired;
  
  // Allow admin to bid even on scheduled auctions (for testing) - even before start time
  // For regular users: can bid only if auction is live AND has active membership (or is admin) AND EMD paid (if required)
  const canBid = (isAdmin && !hasEnded && (auction.status === "SCHEDULED" || auction.status === "LIVE")) ||
                 (isCurrentlyLive && !hasEnded && (hasActiveMembership || isAdmin) && emdPaid);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton href="/auctions" label="Back to Auctions" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Auction Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Video/Image */}
            <div className="bg-white rounded-lg shadow-md p-4">
              {auction.isLiveStreaming && auction.liveStreamUrl ? (
                <VideoPlayer
                  src=""
                  hlsUrl={auction.liveStreamUrl}
                  isLive={true}
                  className="w-full aspect-video"
                  controls={true}
                />
              ) : auction.vehicle.videoUrl ? (
                <VideoPlayer
                  src={auction.vehicle.videoUrl}
                  thumbnail={auction.vehicle.videoThumbnail || undefined}
                  className="w-full aspect-video"
                  controls={true}
                />
              ) : auction.vehicle.mainPhoto ? (
                <div className="relative cursor-pointer group" onClick={() => {
                  const allPhotos = [];
                  if (auction.vehicle.mainPhoto) {
                    allPhotos.push(auction.vehicle.mainPhoto);
                  }
                  if (auction.vehicle.subPhotos && auction.vehicle.subPhotos.length > 0) {
                    allPhotos.push(...auction.vehicle.subPhotos);
                  }
                  if (allPhotos.length > 0) {
                    setPhotoGallery({ photos: allPhotos, initialIndex: 0 });
                  }
                }}>
                  <img
                    src={
                      auction.vehicle.mainPhoto.startsWith("http")
                        ? auction.vehicle.mainPhoto
                        : `/uploads/${auction.vehicle.mainPhoto}`
                    }
                    alt={auction.vehicle.tractorBrand}
                    className="w-full h-96 object-cover rounded-lg transition-opacity group-hover:opacity-90"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  {auction.vehicle.subPhotos && auction.vehicle.subPhotos.length > 0 && (
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                      +{auction.vehicle.subPhotos.length} more photos
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 text-white font-semibold text-lg transition-opacity">
                      Click to view all photos
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Vehicle Details - Enhanced */}
            <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
              {/* Vehicle Title */}
              <div className="border-b border-gray-200 pb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent mb-2">
                  {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel || ""} {auction.vehicle.engineHP} HP
                </h1>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                    {auction.vehicle.vehicleType.replace("_", " ")}
                  </span>
                  {auction.vehicle.isCertified && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Certified
                    </span>
                  )}
                  {auction.vehicle.isFinanceAvailable && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      Finance Available
                    </span>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-primary-600" />
                  Basic Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Brand</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.tractorBrand}</p>
                  </div>
                  {auction.vehicle.tractorModel && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Model</p>
                      <p className="font-bold text-gray-900">{auction.vehicle.tractorModel}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Engine HP</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.engineHP} HP</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Year of Manufacturing</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.yearOfMfg}</p>
                  </div>
                  {auction.vehicle.hoursRun && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Hours Run</p>
                      <p className="font-bold text-gray-900">{auction.vehicle.hoursRun}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Running Condition</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.runningCondition}</p>
                  </div>
                </div>
              </div>

              {/* Location & Registration */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  Location & Registration
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">State</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.state}</p>
                  </div>
                  {auction.vehicle.district && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">District</p>
                      <p className="font-bold text-gray-900">{auction.vehicle.district}</p>
                    </div>
                  )}
                  {auction.vehicle.registrationNumber && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Registration Number</p>
                      <p className="font-bold text-gray-900 font-mono">{auction.vehicle.registrationNumber}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">RC Copy Status</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.rcCopyStatus}</p>
                  </div>
                  {auction.vehicle.rcCopyType && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">RC Copy Type</p>
                      <p className="font-bold text-gray-900">{auction.vehicle.rcCopyType}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Insurance Status</p>
                    <p className="font-bold text-gray-900">{auction.vehicle.insuranceStatus}</p>
                  </div>
                </div>
              </div>

              {/* Technical Specifications */}
              {(auction.vehicle.clutchType || auction.vehicle.drive || auction.vehicle.steering || auction.vehicle.ipto !== null || auction.vehicle.tyreBrand) && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-primary-600" />
                    Technical Specifications
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {auction.vehicle.clutchType && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Clutch Type</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.clutchType}</p>
                      </div>
                    )}
                    {auction.vehicle.drive && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Drive</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.drive}</p>
                      </div>
                    )}
                    {auction.vehicle.steering && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Steering</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.steering}</p>
                      </div>
                    )}
                    {auction.vehicle.ipto !== null && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">IPTO</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.ipto ? "Yes" : "No"}</p>
                      </div>
                    )}
                    {auction.vehicle.tyreBrand && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tyre Brand</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.tyreBrand}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financial & Legal */}
              {(auction.vehicle.financeNocPapers || auction.vehicle.readyForToken) && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary-600" />
                    Financial & Legal
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {auction.vehicle.financeNocPapers && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Finance NOC Papers</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.financeNocPapers}</p>
                      </div>
                    )}
                    {auction.vehicle.readyForToken && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Ready For Token</p>
                        <p className="font-bold text-gray-900">{auction.vehicle.readyForToken}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Features */}
              {auction.vehicle.otherFeatures && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-primary-600" />
                    Additional Features
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-900">{auction.vehicle.otherFeatures}</p>
                  </div>
                </div>
              )}

              {/* Inspection Reports */}
              {auction.vehicle.inspectionReports && auction.vehicle.inspectionReports.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FileCheck className="w-5 h-5 mr-2 text-primary-600" />
                    Professional Inspection Reports
                  </h2>
                  <div className="space-y-3">
                    {auction.vehicle.inspectionReports.map((report) => (
                      <Link
                        key={report.id}
                        href={`/inspections/${report.id}`}
                        className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                {report.inspectionType}
                              </span>
                              {report.status === "APPROVED" && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-xs font-semibold">Verified</span>
                                </div>
                              )}
                              {report.criticalIssues > 0 && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-xs font-semibold">
                                    {report.criticalIssues} Critical
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-gray-500">Inspection Date</p>
                                <p className="text-sm font-semibold">
                                  {new Date(report.inspectionDate).toLocaleDateString()}
                                </p>
                              </div>
                              {report.overallCondition && (
                                <div>
                                  <p className="text-xs text-gray-500">Overall Condition</p>
                                  <p className="text-sm font-semibold text-blue-600">
                                    {report.overallCondition}
                                  </p>
                                </div>
                              )}
                              {report.issuesCount > 0 && (
                                <div>
                                  <p className="text-xs text-gray-500">Issues Found</p>
                                  <p className="text-sm font-semibold">
                                    {report.issuesCount} issue{report.issuesCount > 1 ? "s" : ""}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 text-blue-600">
                            <FileCheck className="w-5 h-5" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Click on any report to view full details
                  </p>
                </div>
              )}

              {/* Engine & Chassis Numbers (if available) */}
              {(auction.vehicle.engineNumber || auction.vehicle.chassisNumber) && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-primary-600" />
                    Identification Numbers
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {auction.vehicle.engineNumber && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Engine Number</p>
                        <p className="font-bold text-gray-900 font-mono text-sm">{auction.vehicle.engineNumber}</p>
                      </div>
                    )}
                    {auction.vehicle.chassisNumber && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Chassis Number</p>
                        <p className="font-bold text-gray-900 font-mono text-sm">{auction.vehicle.chassisNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bidding Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
              {/* Status Badge */}
              <div className="mb-4">
                {isCurrentlyLive && !hasEnded ? (
                  <span className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    LIVE
                  </span>
                ) : hasEnded ? (
                  <span className="inline-block bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ENDED
                  </span>
                ) : (
                  <span className="inline-block bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    SCHEDULED
                  </span>
                )}
                {isConnected && (
                  <span className="ml-2 inline-block bg-green-500 w-2 h-2 rounded-full"></span>
                )}
              </div>

              {/* Timer */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 mr-2 text-primary-600" />
                  <span className="text-sm text-gray-600">
                    {new Date() < new Date(auction.startTime) ? "Starts in" : "Time Remaining"}
                  </span>
                </div>
                <p className="text-2xl font-bold text-center text-primary-600">{timeRemaining}</p>
              </div>

              {/* Auction Status - Hidden Bid Amounts for Sealed Bidding */}
              <div className="mb-6 p-4 bg-primary-50 rounded-lg">
                {isCurrentlyLive && !hasEnded ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">Bidding Status</span>
                      <span className="text-lg font-bold text-green-600 flex items-center">
                        <Users className="w-5 h-5 mr-1" />
                        Bidding Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Total Bids</span>
                      <span className="font-semibold text-primary-600">
                        {isSealed ? bidCount : auction.bids.length} {(isSealed ? bidCount : auction.bids.length) === 1 ? 'bid' : 'bids'}
                      </span>
                    </div>
                    {!isSealed && (
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-500">Current Bid</span>
                        <span className="font-semibold text-primary-600">
                          ₹{auction.currentBid.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Min. Bid Increment</span>
                      <span className="font-medium">₹{auction.minimumIncrement.toLocaleString("en-IN")}</span>
                    </div>
                    {isSealed && (
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <p className="text-xs text-gray-600 text-center">
                          🔒 This is a sealed auction. Your bids are confidential. All bids will be revealed after the auction ends.
                        </p>
                      </div>
                    )}
                    {!isSealed && (
                      <div className="mt-3 pt-3 border-t border-primary-200">
                        <p className="text-xs text-gray-600 text-center">
                          💡 Bid amounts are visible to all participants.
                        </p>
                      </div>
                    )}
                  </>
                ) : hasEnded ? (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Winning Bid</span>
                      <span className="text-2xl font-bold text-primary-600 flex items-center">
                        <IndianRupee className="w-5 h-5" />
                        {auction.currentBid > 0 ? auction.currentBid.toLocaleString("en-IN") : "No bids"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total Bids</span>
                      <span className="font-medium">{auction.bids.length}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Min. Bid Increment</span>
                      <span className="font-medium">₹{auction.minimumIncrement.toLocaleString("en-IN")}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Complete Vehicle Details Button */}
              <button
                onClick={() => setShowCompleteDetails(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 mb-4 touch-manipulation text-base border border-gray-300"
              >
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Complete Vehicle Details</span>
              </button>

              {/* EMD Payment Required Notice */}
              {emdStatus?.emdRequired && emdStatus.emdStatus !== "PAID" && isCurrentlyLive && !hasEnded && (
                <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                  <div className="flex items-start">
                    <ShieldCheck className="w-5 h-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-900 mb-1">
                        Earnest Money Deposit (EMD) Required
                      </p>
                      <p className="text-sm text-yellow-800 mb-3">
                        You need to pay an EMD of ₹{emdStatus.emdAmount?.toLocaleString("en-IN")} to place bids in this auction.
                      </p>
                      <button
                        onClick={() => setShowEMDModal(true)}
                        className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
                      >
                        Pay EMD Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* EMD Paid Status */}
              {emdStatus?.emdRequired && emdStatus.emdStatus === "PAID" && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <ShieldCheck className="w-4 h-4 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">
                      ✓ EMD Paid: ₹{emdStatus.emdAmount?.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              )}

              {/* Bidding Form */}
              {canBid ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter your bid amount"
                        min={minimumBid}
                        step={auction.minimumIncrement}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base sm:text-lg"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handlePlaceBid}
                    disabled={isPlacingBid || !bidAmount}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 touch-manipulation text-base"
                  >
                    <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>{isPlacingBid ? "Placing Bid..." : "Place Bid"}</span>
                  </button>
                  <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-800 font-semibold">
                      Please cross check your Bidding Vehicle details and Bid Amount
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Your Bids Section (for sealed bidding) */}
              {isSealedAndLive && myBids.length > 0 && (
                <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Your Bids (Confidential)
                  </h3>
                  <div className="space-y-2">
                    {myBids.map((bid) => (
                      <div key={bid.id} className="bg-white p-3 rounded border border-purple-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Bid #{bid.id.slice(-6).toUpperCase()}</p>
                            <p className="text-lg font-bold text-purple-700">
                              ₹{bid.bidAmount.toLocaleString("en-IN")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(bid.bidTime)}
                            </p>
                          </div>
                          {bid.isWinningBid && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                              Highest
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-purple-700 mt-3 text-center">
                    🔒 Your bids are confidential. All bids will be revealed after the auction ends.
                  </p>
                </div>
              )}

              {hasEnded ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">This auction has ended.</p>
                  {auction.winner && (
                    <div className="bg-green-50 p-4 rounded-lg mb-4">
                      <p className="text-sm text-gray-600">Winner:</p>
                      <p className="font-semibold">{auction.winner.fullName}</p>
                      <p className="text-primary-600 font-bold">
                        ₹{auction.currentBid.toLocaleString("en-IN")}
                      </p>
                    </div>
                  )}
                  
                  {/* Seller Approval Status */}
                  {auction.sellerApprovalStatus && (
                    <div className={`p-4 rounded-lg ${
                      auction.sellerApprovalStatus === "APPROVED" 
                        ? "bg-green-50 border border-green-200" 
                        : auction.sellerApprovalStatus === "REJECTED"
                        ? "bg-red-50 border border-red-200"
                        : "bg-yellow-50 border border-yellow-200"
                    }`}>
                      {auction.sellerApprovalStatus === "PENDING" && (
                        <div>
                          <p className="text-yellow-800 font-semibold mb-2">⏳ Awaiting Seller Approval</p>
                          <p className="text-sm text-yellow-700">
                            The seller is reviewing the winning bid. You will be notified once a decision is made.
                          </p>
                        </div>
                      )}
                      {auction.sellerApprovalStatus === "APPROVED" && (
                        <div>
                          <p className="text-green-800 font-semibold mb-2">✓ Bid Approved by Seller</p>
                          <p className="text-sm text-green-700">
                            Congratulations! The seller has approved the winning bid. Please contact the seller to complete the transaction.
                          </p>
                        </div>
                      )}
                      {auction.sellerApprovalStatus === "REJECTED" && (
                        <div>
                          <p className="text-red-800 font-semibold mb-2">✗ Bid Rejected by Seller</p>
                          <p className="text-sm text-red-700">
                            The seller has rejected the winning bid. This auction is now closed.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : isCurrentlyLive && !hasActiveMembership && !isAdmin ? (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-4">
                    <Package className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                    <p className="text-gray-700 font-semibold text-lg mb-2">
                      If you want to Participate bidding Become a Member Now
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      This auction is currently live. Purchase a membership to start bidding!
                    </p>
                    <button
                      onClick={() => {
                        // Store return URL in sessionStorage
                        sessionStorage.setItem("membershipReturnUrl", `/auctions/${auctionId}/live`);
                        router.push(`/membership?returnUrl=${encodeURIComponent(`/auctions/${auctionId}/live`)}`);
                      }}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                    >
                      View Membership Plans
                    </button>
                  </div>
                </div>
              ) : !isCurrentlyLive && !hasEnded ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-2">Auction will start soon.</p>
                  {isAdmin && !hasEnded && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800 mb-3">
                        <strong>Admin Testing Mode:</strong> You can place bids even though the auction is scheduled.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Bid Amount
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              ₹
                            </span>
                            <input
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              placeholder="Enter your bid amount"
                              min={minimumBid}
                              step={auction.minimumIncrement}
                              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
                            />
                          </div>
                        </div>
                        <button
                          onClick={handlePlaceBid}
                          disabled={isPlacingBid || !bidAmount}
                          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                          <Gavel className="w-5 h-5" />
                          <span>{isPlacingBid ? "Placing Bid..." : "Place Bid"}</span>
                        </button>
                        <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                          <p className="text-sm text-blue-800 font-semibold">
                            Please cross check your Bidding Vehicle details and Bid Amount
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* EMD Payment Modal */}
      {showEMDModal && emdStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Pay Earnest Money Deposit</h2>
              <button
                onClick={() => setShowEMDModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                You need to pay an Earnest Money Deposit (EMD) to participate in this auction.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-700">EMD Amount:</span>
                  <span className="font-bold text-lg text-primary-600">
                    ₹{emdStatus.emdAmount?.toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  * EMD will be refunded if you don't win, or applied to your balance payment if you win.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEMDModal(false)}
                disabled={isProcessingEMD}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePayEMD}
                disabled={isProcessingEMD}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessingEMD ? "Processing..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      {showTermsModal && (
        <TermsAndConditionsModal
          isOpen={showTermsModal}
          onAccept={handleTermsAccepted}
          onCancel={() => {
            setShowTermsModal(false);
            setIsTermsModalOnPageLoad(false);
            // If user cancels terms, redirect back to auctions page
            router.push("/auctions");
          }}
          bidAmount={pendingBidAmount || (auction ? (auction.currentBid > 0 ? auction.currentBid + auction.minimumIncrement : auction.reservePrice) : 0)}
          showOnPageLoad={isTermsModalOnPageLoad}
        />
      )}

      {/* Bid Confirmation Modal */}
      {showConfirmModal && pendingBidAmount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 shadow-xl my-auto">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <Gavel className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Confirm Your Bid
              </h3>
              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  You are bidding
                </p>
                <p className="text-3xl font-bold text-primary-600 mb-2">
                  ₹{pendingBidAmount.toLocaleString("en-IN")}
                </p>
                <p className="text-sm text-gray-500">
                  Please cross check your bid amount
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingBidAmount(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors touch-manipulation text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlaceBid}
                  disabled={isPlacingBid}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-base"
                >
                  {isPlacingBid ? "Placing..." : "Confirm Bid"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bid Result Modal */}
      {showBidResultModal && bidResult && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className={`p-6 rounded-t-xl ${bidResult.isHigher ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-red-600 to-red-700'} text-white`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold">
                  {bidResult.isHigher ? "Bid Placed Successfully!" : "Bid Lower Than Highest Bid"}
                </h3>
                <button
                  onClick={() => {
                    setShowBidResultModal(false);
                    setBidResult(null);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-2">Your Bid Amount</p>
                <p className="text-3xl font-bold text-primary-600 mb-4">
                  ₹{bidResult.bidAmount.toLocaleString("en-IN")}
                </p>
                
                {bidResult.isHigher ? (
                  <>
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-green-800 font-semibold text-lg mb-2">
                        At Present, Your Bid is the Winning Bid
                      </p>
                      {bidResult.position > 0 && (
                        <p className="text-green-700 font-bold text-xl">
                          {bidResult.position === 1 && "You are Highest Bidder*"}
                          {bidResult.position === 2 && "You are Second Highest Bidder*"}
                          {bidResult.position === 3 && "You are Third Highest Bidder*"}
                          {bidResult.position > 3 && `You are ${getOrdinal(bidResult.position)} Highest Bidder*`}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800 font-semibold text-lg">
                      Your Bid lower than Highest Bid
                    </p>
                  </div>
                )}
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-800 text-center">
                    * Conditions Apply. This is not final, Positions may change until auction ends
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowBidResultModal(false);
                  setBidResult(null);
                }}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {photoGallery && (
        <PhotoGallery
          photos={photoGallery.photos}
          isOpen={!!photoGallery}
          onClose={() => setPhotoGallery(null)}
          initialIndex={photoGallery.initialIndex}
        />
      )}

      {/* Complete Vehicle Details Modal */}
      {auction && (
        <CompleteVehicleDetails
          vehicle={auction.vehicle}
          isOpen={showCompleteDetails}
          onClose={() => setShowCompleteDetails(false)}
          isAuctionVehicle={true}
          reservePrice={auction.reservePrice}
        />
      )}
    </div>
  );
}

// Helper function to get ordinal suffix
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

