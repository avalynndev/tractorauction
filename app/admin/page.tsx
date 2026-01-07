"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Eye, Truck, Clock, Check, X, Filter, Gavel, BarChart3, MessageCircle, Settings, Users, Package, TrendingUp, Shield, BookOpen, ShieldCheck, DollarSign, FileCheck, AlertCircle, Ban, CheckCircle2, RefreshCw, Search, Factory } from "lucide-react";
import toast from "react-hot-toast";
import { getDistrictsForState } from "@/lib/indian-districts";
// Using regular img tag since images are stored as filenames

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const tractorOEMs = [
  "Mahindra",
  "Swaraj",
  "Trakstar",
  "Sonalika",
  "John Deere",
  "TAFE",
  "Eicher",
  "Escorts",
  "Kubota",
  "New Holland",
  "Farmtrac",
  "Force Motors",
  "Indo Farm",
  "Captain",
  "Solis",
  "Preet",
  "VST",
  "Not Applicable"
];

interface Vehicle {
  id: string;
  referenceNumber?: string | null;
  vehicleType: string;
  saleType: string;
  saleAmount: number;
  basePrice: number | null;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  registrationNumber?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  hoursRun?: string | null;
  state: string;
  runningCondition: string;
  insuranceStatus: string;
  rcCopyStatus: string;
  rcCopyType?: string | null;
  financeNocPapers?: string | null;
  readyForToken?: string | null;
  clutchType?: string | null;
  ipto?: boolean | null;
  drive?: string | null;
  steering?: string | null;
  tyreBrand?: string | null;
  otherFeatures?: string | null;
  isCertified?: boolean;
  isFinanceAvailable?: boolean;
  oem?: string | null;
  status: string;
  mainPhoto: string | null;
  subPhotos?: string[];
  createdAt: string;
  auction?: {
    id: string;
    referenceNumber?: string | null;
    status: string;
    currentBid: number;
    startTime: string;
    endTime: string;
  };
  seller: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  // Per-vehicle auction settings (for the modal)
  const [auctionStart, setAuctionStart] = useState<string>("");
  const [auctionEnd, setAuctionEnd] = useState<string>("");
  const [auctionIncrement, setAuctionIncrement] = useState<string>("");
  const [reservedPrice, setReservedPrice] = useState<string>("");
  const [emdRequired, setEmdRequired] = useState<boolean>(false);
  const [emdAmount, setEmdAmount] = useState<string>("");
  // Bulk auction settings (for Create Missing Auctions)
  const [bulkAuctionStart, setBulkAuctionStart] = useState<string>("");
  const [bulkAuctionEnd, setBulkAuctionEnd] = useState<string>("");
  const [bulkAuctionIncrement, setBulkAuctionIncrement] = useState<string>("");
  const [bulkReservedPrice, setBulkReservedPrice] = useState<string>("");
  const [bulkEmdRequired, setBulkEmdRequired] = useState<boolean>(false);
  const [bulkEmdAmount, setBulkEmdAmount] = useState<string>("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<string>>(new Set());
  // Certified and Finance Available options
  const [isCertified, setIsCertified] = useState<boolean>(false);
  const [isFinanceAvailable, setIsFinanceAvailable] = useState<boolean>(false);
  // OEM selection
  const [selectedOEM, setSelectedOEM] = useState<string>("");
  // State and District filters
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  // Pending auctions and purchases
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const [pendingPurchases, setPendingPurchases] = useState<any[]>([]);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [activeSection, setActiveSection] = useState<"approvals" | "bidder-management">("approvals");
  const [bidders, setBidders] = useState<any[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);
  const [bidderSearchTerm, setBidderSearchTerm] = useState("");
  const [vehicleToReject, setVehicleToReject] = useState<string | null>(null);
  // Feedback management state
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [feedbackFilter, setFeedbackFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "all">("PENDING");
  const [showFeedbackRejectModal, setShowFeedbackRejectModal] = useState(false);
  const [feedbackRejectionReason, setFeedbackRejectionReason] = useState("");
  const [feedbackToRejectId, setFeedbackToRejectId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const handleBulkApprove = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (selectedVehicleIds.size === 0) {
      toast.error("Select at least one vehicle to bulk approve");
      return;
    }

    // Validate bulk dates if provided (for auction overrides)
    if (bulkAuctionStart && bulkAuctionEnd) {
      const start = new Date(bulkAuctionStart);
      const end = new Date(bulkAuctionEnd);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        toast.error("End time must be after start time for bulk schedule");
        return;
      }
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedVehicleIds) {
        try {
          const v = Array.isArray(vehicles) ? vehicles.find((veh) => veh.id === id) : null;
          const bodyData: any = {};
          
          // Add auction settings if applicable
          if (v && v.saleType === "AUCTION" && (bulkAuctionStart || bulkAuctionEnd || bulkAuctionIncrement || bulkReservedPrice)) {
            if (bulkAuctionStart) bodyData.auctionStartTime = bulkAuctionStart;
            if (bulkAuctionEnd) bodyData.auctionEndTime = bulkAuctionEnd;
            if (bulkAuctionIncrement) bodyData.minimumIncrement = Number(bulkAuctionIncrement);
            if (bulkReservedPrice) bodyData.basePrice = Number(bulkReservedPrice);
          }
          
          // Add certified and finance available flags
          bodyData.isCertified = isCertified;
          bodyData.isFinanceAvailable = isFinanceAvailable;
          // Add OEM if selected
          if (selectedOEM) {
            bodyData.oem = selectedOEM === "Not Applicable" ? null : selectedOEM;
          }
          
          const response = await fetch(`/api/admin/vehicles/${id}/approve`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
          });
          
          if (response.ok) {
            successCount += 1;
          } else {
            const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
            console.error(`Failed to approve vehicle ${id}:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              vehicle: v,
            });
            // Show specific error for first failure to help debug
            if (failCount === 0 && errorData.message) {
              toast.error(`Error: ${errorData.message}`, { duration: 6000 });
            }
            failCount += 1;
          }
        } catch (error: any) {
          console.error(`Error approving vehicle ${id}:`, error);
          failCount += 1;
        }
      }

      if (successCount > 0) {
        toast.success(`Approved ${successCount} vehicle(s)`);
        fetchUserAndVehicles(token);
      }
      if (failCount > 0) {
        toast.error(`Failed to approve ${failCount} vehicle(s). Check console for details.`);
      }
      setSelectedVehicleIds(new Set());
    } catch (error) {
      toast.error("Bulk approve failed");
    }
  };

  const fetchFeedbacks = async (token: string) => {
    setLoadingFeedbacks(true);
    try {
      const statusParam = feedbackFilter !== "all" ? `?status=${feedbackFilter}` : "";
      const response = await fetch(`/api/admin/feedback${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to load feedbacks");
    } finally {
      setLoadingFeedbacks(false);
    }
  };

  const handleApproveFeedback = async (feedbackId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Feedback approved successfully");
        fetchFeedbacks(token);
      } else {
        toast.error(result.message || "Failed to approve feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleRejectFeedbackClick = (feedbackId: string) => {
    setFeedbackToRejectId(feedbackId);
    setShowFeedbackRejectModal(true);
  };

  const confirmRejectFeedback = async () => {
    if (!feedbackToRejectId || !feedbackRejectionReason.trim() || feedbackRejectionReason.trim().length < 10) {
      toast.error("Please provide a detailed rejection reason (min 10 characters).");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/feedback/${feedbackToRejectId}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rejectionReason: feedbackRejectionReason }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Feedback rejected");
        fetchFeedbacks(token);
        setShowFeedbackRejectModal(false);
        setFeedbackRejectionReason("");
        setFeedbackToRejectId(null);
      } else {
        toast.error(result.message || "Failed to reject feedback");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const fetchPendingAuctions = async (token: string) => {
    setLoadingAuctions(true);
    try {
      // Fetch ended auctions with pending approval
      const response = await fetch("/api/auctions?status=ENDED&limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const auctions = data.data || [];
        // Filter auctions that need:
        // 1. Seller approval (sellerApprovalStatus === "PENDING" && winnerId exists) - for open bidding
        // 2. Admin review (status=ENDED, no winnerId, biddingType=SEALED) - for sealed bidding
        const pending = auctions.filter((auction: any) => {
          // For sealed bidding: ended but no winner confirmed yet
          if (auction.biddingType === "SEALED" && auction.status === "ENDED" && !auction.winnerId) {
            return true;
          }
          // For open bidding: seller approval pending
          if (auction.sellerApprovalStatus === "PENDING" && auction.winnerId) {
            return true;
          }
          return false;
        });
        setPendingAuctions(pending);
      }
    } catch (error) {
      console.error("Error fetching pending auctions:", error);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const fetchPendingPurchases = async (token: string) => {
    setLoadingPurchases(true);
    try {
      // Try to fetch from admin endpoint first
      const response = await fetch("/api/admin/purchases/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPendingPurchases(data.purchases || []);
      } else {
        // Fallback: fetch all purchases and filter client-side
        const allResponse = await fetch("/api/my-account/purchases", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (allResponse.ok) {
          const allData = await allResponse.json();
          const pending = (allData.purchases || []).filter((p: any) => 
            p.status === "pending" && p.purchaseType === "PREAPPROVED"
          );
          setPendingPurchases(pending);
        }
      }
    } catch (error) {
      console.error("Error fetching pending purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchBidders = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setLoadingBidders(true);
    try {
      const response = await fetch("/api/admin/bidders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBidders(data.bidders || []);
      } else {
        toast.error("Failed to fetch bidders");
      }
    } catch (error) {
      console.error("Error fetching bidders:", error);
      toast.error("An error occurred while fetching bidders");
    } finally {
      setLoadingBidders(false);
    }
  };

  const handleToggleBidderEligibility = async (bidderId: string, currentStatus: boolean, reason?: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/bidders/${bidderId}/eligibility`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isEligibleForBid: !currentStatus,
          reason: reason || null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || `Bidder ${!currentStatus ? "enabled" : "disabled"} successfully`);
        fetchBidders();
      } else {
        toast.error(result.message || "Failed to update bidder eligibility");
      }
    } catch (error) {
      console.error("Error updating bidder eligibility:", error);
      toast.error("An error occurred");
    }
  };

  const handleApproveAuction = async (auctionId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

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
        toast.success("Auction bid approved successfully");
        fetchPendingAuctions(token);
      } else {
        toast.error(result.message || "Failed to approve auction");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleRejectAuction = async (auctionId: string, rejectionReason: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/auctions/${auctionId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          approvalStatus: "REJECTED",
          rejectionReason: rejectionReason || "Rejected by admin"
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Auction bid rejected");
        fetchPendingAuctions(token);
      } else {
        toast.error(result.message || "Failed to reject auction");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleApprovePurchase = async (purchaseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Purchase approved successfully");
        fetchPendingPurchases(token);
      } else {
        toast.error(result.message || "Failed to approve purchase");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user data first (blocking for auth check)
    fetchUserAndVehicles(token);
    
    // Fetch other data in parallel (non-blocking)
    // Use setTimeout to allow UI to render first
    setTimeout(() => {
      fetchFeedbacks(token);
      fetchPendingAuctions(token);
      fetchPendingPurchases(token);
    }, 0);
  }, [router, feedbackFilter]);

  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  const fetchUserAndVehicles = async (token: string) => {
    try {
      // Check if user is admin
      const userResponse = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);

        if (userData.role !== "ADMIN") {
          toast.error("Access denied. Admin only.");
          router.push("/my-account");
          setLoading(false);
          return;
        }

        // Set loading to false immediately so UI can render
        setLoading(false);

        // Build query string for filters
        const params = new URLSearchParams();
        if (selectedState && selectedState !== "all") params.append("state", selectedState);
        if (selectedDistrict && selectedDistrict !== "all") params.append("district", selectedDistrict);

        // Fetch pending vehicles with filters (non-blocking - don't await)
        fetch(
          `/api/admin/vehicles/pending?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ).then(async (vehiclesResponse) => {
          if (vehiclesResponse.ok) {
            const responseData = await vehiclesResponse.json();
            // Handle paginated response - extract data array
            const vehiclesData = Array.isArray(responseData) 
              ? responseData 
              : (responseData?.data || []);
            
            // Ensure it's an array
            if (!Array.isArray(vehiclesData)) {
              console.error("Expected array but got:", vehiclesData);
              setVehicles([]);
              return;
            }
            
            setVehicles(vehiclesData);
            
            // Update available districts based on current vehicles
            updateAvailableDistricts(vehiclesData);
          }
        }).catch((error) => {
          console.error("Error fetching vehicles:", error);
        });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching user and vehicles:", error);
      toast.error("Failed to load data");
      setLoading(false);
    }
  };

  const updateAvailableDistricts = (vehiclesList: Vehicle[]) => {
    // Ensure vehiclesList is an array
    if (!Array.isArray(vehiclesList)) {
      return;
    }
    
    // Use the complete district list from the library based on selected state
    if (selectedState === "all") {
      // If no state selected, show all districts from all vehicles (fallback)
      const districts = new Set<string>();
      vehiclesList.forEach((v) => {
        if (v?.seller?.district) {
          districts.add(v.seller.district);
        }
      });
      setAvailableDistricts(Array.from(districts).sort());
    } else {
      // Get districts from the complete list for the selected state
      const districtsForState = getDistrictsForState(selectedState);
      setAvailableDistricts(districtsForState);
    }
  };

  // Update available districts when state changes
  useEffect(() => {
    if (selectedState === "all") {
      // If no state selected, keep current districts (from vehicles)
      // Don't change availableDistricts here
    } else {
      // Get districts from the complete list for the selected state
      const districtsForState = getDistrictsForState(selectedState);
      setAvailableDistricts(districtsForState);
      // Reset district selection if current selection is not in new list
      if (selectedDistrict !== "all" && !districtsForState.includes(selectedDistrict)) {
        setSelectedDistrict("all");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  // Fetch vehicles when filters change (only after initial load)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && user?.role === "ADMIN" && user) {
      // Only refetch if user is already loaded (not initial mount)
      setLoading(true);
      fetchUserAndVehicles(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState, selectedDistrict]);

  const handleApprove = async (vehicleId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const body: any = {};
      if (selectedVehicle && selectedVehicle.id === vehicleId && selectedVehicle.saleType === "AUCTION") {
        if (auctionStart) body.auctionStartTime = auctionStart;
        if (auctionEnd) body.auctionEndTime = auctionEnd;
        if (auctionIncrement) body.minimumIncrement = Number(auctionIncrement);
        if (reservedPrice) body.basePrice = Number(reservedPrice);
        if (emdRequired) {
          body.emdRequired = true;
          if (emdAmount) body.emdAmount = Number(emdAmount);
        } else {
          body.emdRequired = false;
        }
      }
      // Add certified and finance available flags
      body.isCertified = isCertified;
      body.isFinanceAvailable = isFinanceAvailable;
      // Add OEM if selected
      if (selectedOEM) {
        body.oem = selectedOEM === "Not Applicable" ? null : selectedOEM;
      }

      const response = await fetch(`/api/admin/vehicles/${vehicleId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Vehicle approved successfully");
        // Refresh list
        fetchUserAndVehicles(token);
        setShowDetails(false);
        setSelectedVehicle(null);
        setAuctionStart("");
        setAuctionEnd("");
        setAuctionIncrement("");
        setReservedPrice("");
        setEmdRequired(false);
        setEmdAmount("");
        setSelectedOEM("");
        setIsCertified(false);
        setIsFinanceAvailable(false);
      } else {
        const errorMsg = result.message || result.error || "Failed to approve vehicle";
        toast.error(errorMsg);
        console.error("Approval error:", result);
      }
    } catch (error: any) {
      console.error("Approval exception:", error);
      toast.error(error?.message || "An error occurred while approving vehicle");
    }
  };

  const handleReject = (vehicleId: string) => {
    setVehicleToReject(vehicleId);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!vehicleToReject) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    // Require rejection reason
    if (!rejectionReason.trim()) {
      toast.error("Please provide a detailed rejection reason");
      return;
    }

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleToReject}/reject`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Vehicle rejected with detailed remarks");
        // Refresh list
        fetchUserAndVehicles(token);
        setShowDetails(false);
        setSelectedVehicle(null);
        setAuctionStart("");
        setAuctionEnd("");
        setAuctionIncrement("");
        setReservedPrice("");
        setEmdRequired(false);
        setEmdAmount("");
        setSelectedOEM("");
        setIsCertified(false);
        setIsFinanceAvailable(false);
        setSelectedVehicleIds((prev) => {
          const next = new Set(prev);
          next.delete(vehicleToReject);
          return next;
        });
        // Close modal
        setShowRejectModal(false);
        setVehicleToReject(null);
        setRejectionReason("");
      } else {
        toast.error(result.message || "Failed to reject vehicle");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const viewDetails = async (vehicleId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to view details");
      return;
    }

    try {
      const response = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const vehicleData = await response.json();
        setSelectedVehicle(vehicleData);
        // Pre-fill OEM if vehicle already has one
        if (vehicleData.oem) {
          setSelectedOEM(vehicleData.oem);
        } else {
          setSelectedOEM("");
        }
        // Pre-fill certified and finance available flags
        setIsCertified(vehicleData.isCertified || false);
        setIsFinanceAvailable(vehicleData.isFinanceAvailable || false);
        // Pre-fill auction settings for auction vehicles
        if (vehicleData.saleType === "AUCTION") {
          const reservePrice = vehicleData.basePrice || vehicleData.saleAmount;
          setReservedPrice(String(reservePrice || vehicleData.saleAmount || ""));
          
          let durationDays = 1;
          if (reservePrice >= 200000 && reservePrice < 500000) {
            durationDays = 2;
          } else if (reservePrice >= 500000) {
            durationDays = 3;
          }

          const start = new Date();
          start.setHours(start.getHours() + 1); // start in 1 hour by default
          const end = new Date(start);
          end.setDate(end.getDate() + durationDays);

          setAuctionStart(formatDateTimeLocal(start));
          setAuctionEnd(formatDateTimeLocal(end));

          // Default increment suggestion
          let defaultIncrement = 5000;
          if (reservePrice < 100000) defaultIncrement = 2000;
          else if (reservePrice < 300000) defaultIncrement = 5000;
          else if (reservePrice < 700000) defaultIncrement = 10000;
          else defaultIncrement = 20000;

          setAuctionIncrement(String(defaultIncrement));
        } else {
          setAuctionStart("");
          setAuctionEnd("");
          setAuctionIncrement("");
          setReservedPrice("");
        }
        setShowDetails(true);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to load vehicle details:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        toast.error(errorData.message || `Failed to load vehicle details (${response.status})`);
      }
    } catch (error: any) {
      console.error("Error loading vehicle details:", error);
      toast.error(error?.message || "Failed to load vehicle details. Please try again.");
    }
  };

  const handleCreateMissingAuctions = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // Validate bulk dates if provided
      if (bulkAuctionStart && bulkAuctionEnd) {
        const start = new Date(bulkAuctionStart);
        const end = new Date(bulkAuctionEnd);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
          toast.error("End time must be after start time for bulk schedule");
          return;
        }
      }

      // Require selection when using bulk apply
      if (selectedVehicleIds.size === 0) {
        toast.error("Select at least one vehicle to apply bulk schedule");
        return;
      }

      const body: any = {};
      if (bulkAuctionStart) body.auctionStartTime = bulkAuctionStart;
      if (bulkAuctionEnd) body.auctionEndTime = bulkAuctionEnd;
      if (bulkAuctionIncrement) body.minimumIncrement = Number(bulkAuctionIncrement);
      if (bulkReservedPrice) body.basePrice = Number(bulkReservedPrice);
      if (bulkEmdRequired) {
        body.emdRequired = true;
        if (bulkEmdAmount) body.emdAmount = Number(bulkEmdAmount);
      } else {
        body.emdRequired = false;
      }
      body.vehicleIds = Array.from(selectedVehicleIds);

      const response = await fetch("/api/admin/vehicles/create-missing-auctions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message || `Created ${result.auctions?.length || 0} auction(s)!`);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.message || "Failed to create auctions");
      }
    } catch (error) {
      toast.error("An error occurred while creating auctions");
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

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                  Admin Dashboard
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">Review and approve vehicle listings</p>
              </div>
              <div className="space-y-6">
                {/* Primary Actions - Full Width */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Primary Actions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveSection("approvals")}
                      className="group bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 relative transform hover:scale-105"
                    >
                      <CheckCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span className="text-base">Approvals</span>
                      {(vehicles.length > 0 || pendingAuctions.length > 0 || pendingPurchases.length > 0) && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold shadow-lg animate-pulse">
                          {vehicles.length + pendingAuctions.length + pendingPurchases.length}
                        </span>
                      )}
                    </button>
                    <Link
                      href="/admin/auctions"
                      className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-base font-semibold transform hover:scale-105"
                    >
                      <Gavel className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Manage Auctions</span>
                    </Link>
                    <Link
                      href="/admin/reports"
                      className="group bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-base font-semibold transform hover:scale-105"
                    >
                      <BarChart3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Reports & Analytics</span>
                    </Link>
                  </div>
                </div>

                {/* Management & Verification */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Management & Verification</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Link
                      href="/admin/escrow"
                      className="group bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <DollarSign className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Escrow</span>
                    </Link>
                    <Link
                      href="/admin/inspections"
                      className="group bg-gradient-to-r from-cyan-600 to-cyan-700 text-white px-5 py-4 rounded-xl hover:from-cyan-700 hover:to-cyan-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <FileCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Inspections</span>
                    </Link>
                    <Link
                      href="/admin/kyc"
                      className="group bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <Shield className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>KYC Verification</span>
                    </Link>
                    <Link
                      href="/admin/oem"
                      className="group bg-gradient-to-r from-violet-600 to-violet-700 text-white px-5 py-4 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <Factory className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>OEM Manage</span>
                    </Link>
                  </div>
                </div>

                {/* Support & Communication */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Support & Communication</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    <Link
                      href="/admin/chat"
                      className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Chat Support</span>
                    </Link>
                    <Link
                      href="/admin/disputes"
                      className="group bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <AlertCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Disputes</span>
                    </Link>
                    <Link
                      href="/admin/tutorial"
                      className="group bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <BookOpen className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>Tutorial</span>
                    </Link>
                    <Link
                      href="/admin/qa"
                      className="group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-4 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center space-y-2 text-sm font-semibold transform hover:scale-105"
                    >
                      <ShieldCheck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                      <span>QA & Testing</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Approvals Section - Shows all pending approvals */}
        {activeSection === "approvals" && (
          <div className="space-y-6">
            {/* Pending Vehicles Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Truck className="w-6 h-6" />
                Pending Vehicle Approvals
                {vehicles.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                    {vehicles.length}
                  </span>
                )}
              </h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading vehicles...</p>
                </div>
              ) : !Array.isArray(vehicles) || vehicles.length === 0 ? (
                <div className="text-center py-12">
                  <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-600">No pending vehicle approvals</p>
                </div>
              ) : (
                <>
                  {/* Filters and Bulk Actions - Only show for vehicles */}
                  <div className="mb-6 space-y-4">
                    {/* State and District Filters */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Filter className="w-4 h-4 text-primary-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">Filter by Location</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
                          <select
                            value={selectedState}
                            onChange={(e) => {
                              setSelectedState(e.target.value);
                              setSelectedDistrict("all");
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                          >
                            <option value="all">All States</option>
                            {indianStates.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                          <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            disabled={selectedState === "all"}
                          >
                            <option value="all">All Districts</option>
                            {availableDistricts.map((district) => (
                              <option key={district} value={district}>
                                {district}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Bulk Auction Settings */}
                    <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">Bulk Auction Settings (Optional)</h3>
                      </div>
                      <p className="text-xs text-blue-800 mb-3">
                        These settings apply to selected auction vehicles. Leave blank to use automatic defaults.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Reserved Price (₹)</label>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={bulkReservedPrice}
                            onChange={(e) => setBulkReservedPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            placeholder="Optional"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">EMD Required</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={bulkEmdRequired}
                              onChange={(e) => {
                                setBulkEmdRequired(e.target.checked);
                                if (!e.target.checked) setBulkEmdAmount("");
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-700">Enable EMD</span>
                          </div>
                        </div>
                        {bulkEmdRequired && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">EMD Amount (₹)</label>
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={bulkEmdAmount}
                              onChange={(e) => setBulkEmdAmount(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                              placeholder="e.g., 5000"
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date &amp; Time</label>
                          <input
                            type="datetime-local"
                            value={bulkAuctionStart}
                            onChange={(e) => setBulkAuctionStart(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">End Date &amp; Time</label>
                          <input
                            type="datetime-local"
                            value={bulkAuctionEnd}
                            onChange={(e) => setBulkAuctionEnd(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Min. Bid Increment (₹)</label>
                          <input
                            type="number"
                            min={1000}
                            step={500}
                            value={bulkAuctionIncrement}
                            onChange={(e) => setBulkAuctionIncrement(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Selection Controls and Badge Options */}
                    <div className="flex flex-col lg:flex-row gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex flex-wrap items-center gap-3 flex-1">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-semibold text-gray-700">
                            Selected: <span className="text-primary-600">{selectedVehicleIds.size}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedVehicleIds(new Set(Array.isArray(vehicles) ? vehicles.map((v) => v.id) : []))}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium border border-gray-300"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedVehicleIds(new Set(Array.isArray(vehicles) ? vehicles.filter((v) => v.saleType === "AUCTION").map((v) => v.id) : []))}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium border border-gray-300"
                          >
                            Select Auctions
                          </button>
                          <button
                            onClick={() => setSelectedVehicleIds(new Set())}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs font-medium border border-gray-300"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* OEM Selection */}
                      <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
                        <label className="flex items-center space-x-2">
                          <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">OEM:</span>
                          <select
                            value={selectedOEM}
                            onChange={(e) => setSelectedOEM(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors min-w-[150px]"
                          >
                            <option value="">Select OEM</option>
                            {tractorOEMs.map((oem) => (
                              <option key={oem} value={oem}>
                                {oem}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      {/* Badge Options */}
                      <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
                        <label className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg border-2 border-blue-300 cursor-pointer hover:bg-blue-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={isCertified}
                            onChange={(e) => setIsCertified(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-semibold text-blue-700 text-xs">Certified</span>
                        </label>
                        <label className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-lg border-2 border-green-300 cursor-pointer hover:bg-green-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={isFinanceAvailable}
                            onChange={(e) => setIsFinanceAvailable(e.target.checked)}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="font-semibold text-green-700 text-xs">Finance</span>
                        </label>
                      </div>

                      {/* Bulk Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleBulkApprove}
                          disabled={selectedVehicleIds.size === 0}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-xs font-semibold"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Bulk Approve</span>
                        </button>
                        <button
                          onClick={handleCreateMissingAuctions}
                          disabled={selectedVehicleIds.size === 0}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-xs font-semibold"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Create Auctions</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 group">
                        <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
                          {vehicle.mainPhoto ? (
                            <img
                              src={
                                vehicle.mainPhoto.startsWith("http")
                                  ? vehicle.mainPhoto
                                  : `/uploads/${vehicle.mainPhoto}`
                              }
                              alt={vehicle.tractorBrand}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Truck className="w-16 h-16" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>PENDING</span>
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <label className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md cursor-pointer hover:bg-white transition-colors border border-gray-200">
                              <input
                                type="checkbox"
                                checked={selectedVehicleIds.has(vehicle.id)}
                                onChange={(e) => {
                                  setSelectedVehicleIds((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(vehicle.id);
                                    else next.delete(vehicle.id);
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                              />
                              <span className="text-xs font-semibold text-gray-700">Select</span>
                            </label>
                          </div>
                          {vehicle.saleType === "AUCTION" && (
                            <div className="absolute bottom-3 left-3">
                              <span className="bg-gradient-to-r from-red-600 to-red-700 text-white px-2 py-1 rounded text-xs font-bold shadow-md">
                                AUCTION
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-5">
                          {vehicle.referenceNumber && (
                            <div className="mb-3">
                              <span className="inline-block bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border border-blue-200">
                                {vehicle.referenceNumber}
                              </span>
                            </div>
                          )}
                          <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                            {vehicle.tractorBrand} {vehicle.engineHP} HP
                          </h3>
                          <div className="space-y-2 text-sm mb-4">
                            <div className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-500">Year</span>
                              <span className="font-semibold text-gray-900">{vehicle.yearOfMfg}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-500">State</span>
                              <span className="font-semibold text-gray-900">{vehicle.state}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-500">Type</span>
                              <span className="font-semibold text-gray-900">{vehicle.vehicleType.replace("_", " ")}</span>
                            </div>
                            <div className="flex items-center justify-between py-1 border-b border-gray-100">
                              <span className="text-gray-500">Amount</span>
                              <span className="font-bold text-lg text-primary-600">
                                ₹{vehicle.saleAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                            {vehicle.oem && (
                              <div className="flex items-center justify-between py-1">
                                <span className="text-gray-500">OEM</span>
                                <span className="font-semibold text-gray-900">{vehicle.oem}</span>
                              </div>
                            )}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">Seller</p>
                            <p className="font-semibold text-gray-900 text-sm">{vehicle.seller.fullName}</p>
                            <p className="text-xs text-gray-600">{vehicle.seller.phoneNumber}</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => viewDetails(vehicle.id)}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(vehicle.id)}
                                className="flex items-center justify-center space-x-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                                title="Approve Vehicle"
                              >
                                <Check className="w-4 h-4" />
                                <span className="hidden sm:inline">Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(vehicle.id)}
                                className="flex items-center justify-center space-x-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                                title="Reject Vehicle"
                              >
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pending Auctions Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Gavel className="w-6 h-6" />
              Pending Auction Approvals
              {pendingAuctions.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                  {pendingAuctions.length}
                </span>
              )}
            </h2>
            {loadingAuctions ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading auctions...</p>
              </div>
            ) : pendingAuctions.length === 0 ? (
              <div className="text-center py-12">
                <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No pending auction approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAuctions.map((auction: any) => (
                  <div key={auction.id} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {auction.vehicle?.tractorBrand} {auction.vehicle?.engineHP} HP
                            </h3>
                            <p className="text-sm text-gray-600">
                              Year: {auction.vehicle?.yearOfMfg} • {auction.vehicle?.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-600">
                              ₹{auction.currentBid.toLocaleString("en-IN")}
                            </div>
                            <p className="text-xs text-gray-500">Winning Bid</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Winner</p>
                            <p className="font-semibold">{auction.winner?.fullName || "N/A"}</p>
                            <p className="text-xs text-gray-600">{auction.winner?.phoneNumber || ""}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Auction Ended</p>
                            <p className="font-semibold">{new Date(auction.endTime).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:w-48">
                        {/* For sealed bidding: Show Review Bids button */}
                        {auction.biddingType === "SEALED" && !auction.winnerId ? (
                          <Link
                            href={`/admin/auctions/${auction.id}/review`}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold"
                          >
                            <Gavel className="w-4 h-4" />
                            Review All Bids
                          </Link>
                        ) : (
                          <>
                            {/* For open bidding: Show approve/reject */}
                            <button
                              onClick={() => handleApproveAuction(auction.id)}
                              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold"
                            >
                              <Check className="w-4 h-4" />
                              Approve Bid
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt("Enter rejection reason (optional):");
                                if (reason !== null) {
                                  handleRejectAuction(auction.id, reason);
                                }
                              }}
                              className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold"
                            >
                              <X className="w-4 h-4" />
                              Reject Bid
                            </button>
                          </>
                        )}
                        <Link
                          href={`/vehicles/${auction.vehicleId}`}
                          className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Vehicle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Pending Purchases Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Pending Purchase Approvals
                {pendingPurchases.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                    {pendingPurchases.length}
                  </span>
                )}
              </h2>
            {loadingPurchases ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading purchases...</p>
              </div>
            ) : pendingPurchases.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No pending purchase approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPurchases.map((purchase: any) => (
                  <div key={purchase.id} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {purchase.vehicle?.tractorBrand} {purchase.vehicle?.engineHP} HP
                            </h3>
                            <p className="text-sm text-gray-600">
                              Year: {purchase.vehicle?.yearOfMfg} • {purchase.vehicle?.state}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-primary-600">
                              ₹{purchase.purchasePrice.toLocaleString("en-IN")}
                            </div>
                            <p className="text-xs text-gray-500">Purchase Price</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-500">Buyer</p>
                            <p className="font-semibold">{purchase.buyer?.fullName || "N/A"}</p>
                            <p className="text-xs text-gray-600">{purchase.buyer?.phoneNumber || ""}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Seller</p>
                            <p className="font-semibold">{purchase.vehicle?.seller?.fullName || "N/A"}</p>
                            <p className="text-xs text-gray-600">{purchase.vehicle?.seller?.phoneNumber || ""}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Purchase Date</p>
                            <p className="font-semibold">{new Date(purchase.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Type</p>
                            <p className="font-semibold">{purchase.purchaseType === "PREAPPROVED" ? "Pre-Approved" : "Auction"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:w-48">
                        <button
                          onClick={() => handleApprovePurchase(purchase.id)}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold"
                        >
                          <Check className="w-4 h-4" />
                          Approve Purchase
                        </button>
                        <Link
                          href={`/vehicles/${purchase.vehicleId}`}
                          className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 transition-all font-semibold text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          View Vehicle
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}

        {/* Vehicle Details Modal */}
        {showDetails && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">Vehicle Details</h2>
                    <p className="text-primary-100 text-sm">{selectedVehicle.tractorBrand} {selectedVehicle.engineHP} HP</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedVehicle(null);
                      setAuctionStart("");
                      setAuctionEnd("");
                      setAuctionIncrement("");
                      setReservedPrice("");
                      setSelectedOEM("");
                      setIsCertified(false);
                      setIsFinanceAvailable(false);
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Vehicle Images */}
                {selectedVehicle.mainPhoto && (
                  <div className="mb-6">
                    <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={
                          selectedVehicle.mainPhoto.startsWith("http")
                            ? selectedVehicle.mainPhoto
                            : `/uploads/${selectedVehicle.mainPhoto}`
                        }
                        alt={selectedVehicle.tractorBrand}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                    {selectedVehicle.subPhotos && selectedVehicle.subPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {selectedVehicle.subPhotos.map((photo: string, index: number) => (
                          <div key={index} className="relative h-20 bg-gray-200 rounded overflow-hidden">
                            <img
                              src={photo.startsWith("http") ? photo : `/uploads/${photo}`}
                              alt={`${selectedVehicle.tractorBrand} ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {selectedVehicle.referenceNumber && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Vehicle Reference Number</p>
                    <p className="text-lg font-mono font-bold text-blue-800">{selectedVehicle.referenceNumber}</p>
                  </div>
                )}
                {selectedVehicle.auction?.referenceNumber && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Auction Reference Number</p>
                    <p className="text-lg font-mono font-bold text-green-800">{selectedVehicle.auction.referenceNumber}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Truck className="w-5 h-5 mr-2 text-primary-600" />
                    Vehicle Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Vehicle Type</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.vehicleType?.replace("_", " ") || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sale Type</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.saleType || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tractor Brand</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.tractorBrand || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tractor Model</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.tractorModel || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">OEM</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.oem || "Not Set"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Engine HP</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.engineHP || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Year of Manufacturing</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.yearOfMfg || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">State</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.state || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Running Condition</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.runningCondition || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Insurance Status</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.insuranceStatus || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">RC Copy Status</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.rcCopyStatus || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">RC Copy Type</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.rcCopyType || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Finance NOC Papers</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.financeNocPapers || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Registration Number</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.registrationNumber || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Engine Number</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.engineNumber || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Chassis Number</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.chassisNumber || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Hours Run</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.hoursRun || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Clutch Type</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.clutchType || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">IPTO</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.ipto !== null ? (selectedVehicle.ipto ? "Yes" : "No") : "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Drive</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.drive || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Steering</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.steering || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Tyre Brand</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.tyreBrand || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Ready For Token</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.readyForToken || "N/A"}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200 sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Other Features</p>
                      <p className="font-bold text-gray-900">{selectedVehicle.otherFeatures || "N/A"}</p>
                    </div>
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-4 border-2 border-primary-200">
                      <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sale Amount</p>
                      <p className="font-bold text-2xl text-primary-600">
                        ₹{selectedVehicle.saleAmount?.toLocaleString("en-IN") || "N/A"}
                      </p>
                    </div>
                    {selectedVehicle.saleType === "AUCTION" && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Reserved Price (Base Price)</p>
                        <p className="font-bold text-2xl text-green-600">
                          ₹{(selectedVehicle.basePrice || selectedVehicle.saleAmount || 0).toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedVehicle.saleType === "AUCTION" && (
                  <div className="mt-6 border-t-2 border-gray-200 pt-6">
                    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-5 mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Gavel className="w-6 h-6 text-red-600" />
                        <h3 className="text-xl font-bold text-gray-900">Auction Settings</h3>
                      </div>
                      <p className="text-sm text-gray-700">
                        Configure reserved price, auction schedule and minimum bid increment for this vehicle.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Reserved Price (₹) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={reservedPrice}
                          onChange={(e) => setReservedPrice(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base bg-white font-semibold"
                          placeholder="Enter reserved price"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Minimum price for auction
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={auctionStart}
                          onChange={(e) => setAuctionStart(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">Default: 1 hour from now</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={auctionEnd}
                          onChange={(e) => setAuctionEnd(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Default: 1–3 days after start (based on reserve price)
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Min. Bid Increment (₹)
                        </label>
                        <input
                          type="number"
                          min={1000}
                          step={500}
                          value={auctionIncrement}
                          onChange={(e) => setAuctionIncrement(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Default: ₹2k / ₹5k / ₹10k / ₹20k based on reserve price
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* OEM Selection */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Factory className="w-5 h-5 mr-2 text-primary-600" />
                    OEM Selection
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select OEM <span className="text-gray-500 font-normal">(Optional)</span>
                      </label>
                      <select
                        value={selectedOEM}
                        onChange={(e) => setSelectedOEM(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base bg-white"
                      >
                        <option value="">Select OEM</option>
                        {tractorOEMs.map((oem) => (
                          <option key={oem} value={oem}>
                            {oem}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-2">
                        Select the Original Equipment Manufacturer for this vehicle
                      </p>
                    </div>
                    {selectedVehicle.oem && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-xs text-gray-500 mb-1">Current OEM</p>
                        <p className="font-semibold text-blue-800">{selectedVehicle.oem}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Information */}
                {selectedVehicle.seller && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Seller Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-semibold">{selectedVehicle.seller.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-semibold">{selectedVehicle.seller.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">WhatsApp</p>
                        <p className="font-semibold">{selectedVehicle.seller.whatsappNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-semibold">{selectedVehicle.seller.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">City</p>
                        <p className="font-semibold">{selectedVehicle.seller.city}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">District</p>
                        <p className="font-semibold">{selectedVehicle.seller.district}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">State</p>
                        <p className="font-semibold">{selectedVehicle.seller.state}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Pincode</p>
                        <p className="font-semibold">{selectedVehicle.seller.pincode}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedVehicle(null);
                      setAuctionStart("");
                      setAuctionEnd("");
                      setAuctionIncrement("");
                      setReservedPrice("");
                      setSelectedOEM("");
                      setIsCertified(false);
                      setIsFinanceAvailable(false);
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Close</span>
                  </button>
                  <button
                    onClick={() => {
                      if (selectedVehicle) {
                        router.push(`/admin/vehicles/${selectedVehicle.id}/edit`);
                      }
                    }}
                    disabled={selectedVehicle.status === "SOLD"}
                    className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm"
                  >
                    <span>Edit Details</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedVehicle.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    disabled={selectedVehicle.status === "SOLD"}
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>{selectedVehicle.status === "APPROVED" ? "Move to Auction" : "Approve"}</span>
                  </button>
                  <button
                    onClick={() => handleReject(selectedVehicle.id)}
                    className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                    disabled={selectedVehicle.status === "SOLD"}
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-1">Reject Vehicle</h2>
                    <p className="text-red-100 text-sm">Please provide detailed remarks for rejection</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setVehicleToReject(null);
                      setRejectionReason("");
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Important:</strong> Please provide clear and detailed reasons for rejecting this vehicle. This information will be sent to the seller.
                        </p>
                      </div>
                    </div>
                  </div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter detailed remarks for rejection (e.g., Missing required documents, Vehicle condition issues, Incomplete information, etc.)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base resize-none"
                    rows={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Minimum 10 characters required. Be specific and helpful to the seller.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setVehicleToReject(null);
                      setRejectionReason("");
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10}
                    className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Management Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
                <MessageCircle className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Member Feedback Management</h2>
                <p className="text-sm text-gray-600">Review and approve member feedbacks</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFeedbackFilter("PENDING")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  feedbackFilter === "PENDING"
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFeedbackFilter("APPROVED")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  feedbackFilter === "APPROVED"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFeedbackFilter("REJECTED")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  feedbackFilter === "REJECTED"
                    ? "bg-red-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Rejected
              </button>
              <button
                onClick={() => setFeedbackFilter("all")}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                  feedbackFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
            </div>
          </div>

          {loadingFeedbacks ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No feedbacks found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {feedback.reviewer.profilePhoto ? (
                          <img
                            src={
                              feedback.reviewer.profilePhoto.startsWith("http")
                                ? feedback.reviewer.profilePhoto
                                : `/uploads/${feedback.reviewer.profilePhoto}`
                            }
                            alt={feedback.reviewer.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect fill='%23ddd' width='64' height='64'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3E%3C/text%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Users className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900">{feedback.reviewer.fullName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            feedback.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : feedback.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {feedback.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                          <span>{feedback.reviewer.state}</span>
                          {feedback.reviewer.district && <span>• {feedback.reviewer.district}</span>}
                          <span>• {feedback.reviewer.role}</span>
                          {feedback.tractorIndustrySince && (
                            <span>• In Tractor Industry Since {feedback.tractorIndustrySince}</span>
                          )}
                          {feedback.reviewer.memberships?.[0] && (
                            <span>• Member Since {new Date(feedback.reviewer.memberships[0].startDate).getFullYear()}</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Business</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= feedback.businessRating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Service</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= feedback.serviceRating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Web App</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= feedback.webAppRating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Mobile App</p>
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-lg ${star <= feedback.mobileAppRating ? "text-yellow-400" : "text-gray-300"}`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-700 whitespace-pre-wrap">{feedback.detailedFeedback}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          Submitted: {new Date(feedback.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {feedback.status === "PENDING" && (
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleApproveFeedback(feedback.id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center space-x-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleRejectFeedbackClick(feedback.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bidder Management Section */}
        {activeSection === "bidder-management" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-600" />
                  Bidder Management
                </h2>
                <p className="text-gray-600 text-sm">Manage bidder eligibility for auctions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search bidders..."
                    value={bidderSearchTerm}
                    onChange={(e) => setBidderSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-full sm:w-64"
                  />
                </div>
                <button
                  onClick={fetchBidders}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {loadingBidders ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading bidders...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bidders
                  .filter((bidder) => {
                    if (!bidderSearchTerm) return true;
                    const search = bidderSearchTerm.toLowerCase();
                    return (
                      bidder.fullName?.toLowerCase().includes(search) ||
                      bidder.phoneNumber?.includes(search) ||
                      bidder.email?.toLowerCase().includes(search) ||
                      bidder.identificationNumber?.toLowerCase().includes(search)
                    );
                  })
                  .map((bidder) => {
                    const hasActiveMembership = bidder.membership && bidder.membership.length > 0 && new Date(bidder.membership[0].endDate) > new Date();
                    return (
                      <div
                        key={bidder.id}
                        className={`border-2 rounded-xl p-6 transition-all ${
                          bidder.isEligibleForBid
                            ? "border-green-200 bg-green-50/50"
                            : "border-red-200 bg-red-50/50"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-bold text-gray-900">{bidder.fullName}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  bidder.isEligibleForBid
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {bidder.isEligibleForBid ? "Eligible for Bid" : "Not Eligible"}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Phone</p>
                                <p className="text-sm font-semibold text-gray-900">{bidder.phoneNumber}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">Email</p>
                                <p className="text-sm font-semibold text-gray-900">{bidder.email || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">ID Number</p>
                                <p className="text-sm font-semibold text-gray-900">{bidder.identificationNumber || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1">State</p>
                                <p className="text-sm font-semibold text-gray-900">{bidder.state}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-3 mb-3">
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                bidder.registrationFeePaid
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {bidder.registrationFeePaid ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Registration {bidder.registrationFeePaid ? "Paid" : "Pending"}</span>
                              </div>
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                hasActiveMembership
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {hasActiveMembership ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Membership {hasActiveMembership ? "Active" : "Inactive"}</span>
                              </div>
                              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                                bidder.emdPaid
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}>
                                {bidder.emdPaid ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                <span>EMD {bidder.emdPaid ? "Paid" : "Pending"}</span>
                              </div>
                            </div>
                            {bidder.eligibleForBidReason && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-xs font-semibold text-yellow-800 mb-1">Reason:</p>
                                <p className="text-xs text-yellow-700">{bidder.eligibleForBidReason}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {bidder.isEligibleForBid ? (
                              <button
                                onClick={() => {
                                  const reason = prompt("Enter reason for disabling bidder (optional):");
                                  handleToggleBidderEligibility(bidder.id, true, reason || undefined);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center space-x-2 whitespace-nowrap"
                              >
                                <Ban className="w-4 h-4" />
                                <span>Disable Bidding</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBidderEligibility(bidder.id, false)}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex items-center justify-center space-x-2 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Enable Bidding</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {bidders.filter((bidder) => {
                  if (!bidderSearchTerm) return true;
                  const search = bidderSearchTerm.toLowerCase();
                  return (
                    bidder.fullName?.toLowerCase().includes(search) ||
                    bidder.phoneNumber?.includes(search) ||
                    bidder.email?.toLowerCase().includes(search) ||
                    bidder.identificationNumber?.toLowerCase().includes(search)
                  );
                }).length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No bidders found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Rejection Modal */}
        {showFeedbackRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full shadow-2xl p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Reject Feedback</h3>
                <p className="text-gray-600 text-sm">
                  Please provide a detailed reason for rejecting this feedback.
                </p>
              </div>
              <div className="mb-4">
                <label htmlFor="feedbackRejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Remarks (min 10 characters)
                </label>
                <textarea
                  id="feedbackRejectionReason"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-base"
                  placeholder="e.g., 'Feedback contains inappropriate content or spam.'"
                  value={feedbackRejectionReason}
                  onChange={(e) => setFeedbackRejectionReason(e.target.value)}
                ></textarea>
                {feedbackRejectionReason.length < 10 && (
                  <p className="text-xs text-red-500 mt-1">
                    {10 - feedbackRejectionReason.length} characters remaining
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackRejectModal(false);
                    setFeedbackRejectionReason("");
                    setFeedbackToRejectId(null);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRejectFeedback}
                  disabled={feedbackRejectionReason.length < 10}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md hover:shadow-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

