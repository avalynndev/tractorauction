"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gavel, Clock, MapPin, Calendar, FileText, UserCheck, CreditCard, CheckCircle2, ShieldCheck, Search, SlidersHorizontal, X, Info, Share2 } from "lucide-react";
import { getDistrictsForState } from "@/lib/indian-districts";
import toast from "react-hot-toast";
import CompleteVehicleDetails from "@/components/vehicles/CompleteVehicleDetails";
import PhotoGallery from "@/components/vehicles/PhotoGallery";
import VoiceSearch from "@/components/search/VoiceSearch";
import AdvancedSearch from "@/components/search/AdvancedSearch";
import Pagination from "@/components/ui/Pagination";
import PageLoader from "@/components/ui/PageLoader";
import VehicleCardSkeleton from "@/components/vehicles/VehicleCardSkeleton";
import ShareButton from "@/components/sharing/ShareButton";

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

const tractorBrands = [
  "MAHINDRA", "SWARAJ", "SONALIKA", "TAFE", "POWERTRAC", "FARMTRAC",
  "JOHN DEERE", "NEW HOLLAND", "EICHER", "KUBOTA", "ACE", "INDOFARM",
  "CAPTAIN", "SOLIS", "YANMAR", "OTHER"
];

const vehicleTypes = [
  { value: "all", label: "All Types" },
  { value: "USED_TRACTOR", label: "Used Tractor" },
  { value: "USED_HARVESTER", label: "Used Harvester" },
  { value: "SCRAP_TRACTOR", label: "Scrap Tractor" }
];

const runningConditions = [
  { value: "all", label: "All Conditions" },
  { value: "Self Start", label: "Self Start" },
  { value: "Push Start", label: "Push Start" },
  { value: "Towing", label: "Towing" },
];

const sortOptions = [
  { value: "startTime", label: "Start Time" },
  { value: "endTime", label: "End Time" },
  { value: "yearNew", label: "Year: Newest" },
  { value: "yearOld", label: "Year: Oldest" },
];

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);

interface Auction {
  id: string;
  referenceNumber?: string | null; // Auction reference number
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
    referenceNumber?: string | null; // Vehicle reference number
    seller: {
      fullName: string;
      phoneNumber: string;
      whatsappNumber: string;
      district: string | null;
    };
  };
  startTime: string;
  endTime: string;
  currentBid: number;
  reservePrice: number;
  minimumIncrement: number;
  status: string;
  emdRequired?: boolean;
  emdAmount?: number | null;
}

export default function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "ended">("live");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showCompleteDetails, setShowCompleteDetails] = useState(false);
  const [photoGallery, setPhotoGallery] = useState<{ photos: string[]; initialIndex: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Client-side pagination for categorized results
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Search and filter states
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [brand, setBrand] = useState("all");
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("all");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minHP, setMinHP] = useState("");
  const [maxHP, setMaxHP] = useState("");
  const [runningCondition, setRunningCondition] = useState("all");
  const [insuranceStatus, setInsuranceStatus] = useState("all");
  const [rcCopyStatus, setRcCopyStatus] = useState("all");
  const [isCertified, setIsCertified] = useState("all");
  const [isFinanceAvailable, setIsFinanceAvailable] = useState("all");
  const [sortBy, setSortBy] = useState("startTime");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update districts when state changes
  useEffect(() => {
    if (state === "all") {
      setAvailableDistricts([]);
      setDistrict("all");
    } else {
      const districts = getDistrictsForState(state);
      setAvailableDistricts(districts);
      setDistrict("all");
    }
  }, [state]);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      if (isMounted) {
        try {
          await fetchAuctions(true);
        } catch (error) {
          // Error is already handled in fetchAuctions
          console.error("Initial fetch error:", error);
        }
      }
    };

    fetchData();
    
    // Only refresh when page is visible and user is on the page
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't refresh
        return;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Refresh every 30 seconds for live auctions, but only if page is visible
    intervalId = setInterval(() => {
      if (!document.hidden && isMounted) {
        // Silently fetch in background - errors are handled internally
        fetchAuctions(false).catch(() => {
          // Silently ignore all errors in background refresh
          // Errors are already handled in fetchAuctions function
        });
      }
    }, 30000);

    return () => {
      isMounted = false;
      // Cancel any ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [vehicleType, brand, state, district, minYear, maxYear, minPrice, maxPrice, minHP, maxHP, runningCondition, insuranceStatus, rcCopyStatus, isCertified, isFinanceAvailable, sortBy]);

  const handleAdvancedSearch = (filters: any) => {
    // Update local state with filters
    setSearch(filters.search || "");
    setVehicleType(filters.vehicleType || "all");
    setBrand(filters.brand || "all");
    setState(filters.state || "all");
    setDistrict(filters.district || "all");
    setMinYear(filters.minYear || "");
    setMaxYear(filters.maxYear || "");
    setMinPrice(filters.minPrice || "");
    setMaxPrice(filters.maxPrice || "");
    setMinHP(filters.minHP || "");
    setMaxHP(filters.maxHP || "");
    setRunningCondition(filters.runningCondition || "all");
    setInsuranceStatus(filters.insuranceStatus || "all");
    setRcCopyStatus(filters.rcCopyStatus || "all");
    setIsCertified(filters.isCertified || "all");
    setIsFinanceAvailable(filters.isFinanceAvailable || "all");
    setSortBy(filters.sortBy || "startTime");
    setCurrentPage(1); // Reset to first page
    // Fetch with new filters
    fetchAuctions(true, filters);
  };
  
  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchAuctions = async (showLoading = true, searchFilters?: any) => {
    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this fetch
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    if (showLoading) {
      setLoading(true);
      setIsInitialLoad(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      const filters = searchFilters || {
        search,
        vehicleType,
        brand,
        state,
        district,
        minYear,
        maxYear,
        minPrice,
        maxPrice,
        minHP,
        maxHP,
        runningCondition,
        insuranceStatus,
        rcCopyStatus,
        isCertified,
        isFinanceAvailable,
        sortBy,
      };

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.vehicleType && filters.vehicleType !== "all") params.append("vehicleType", filters.vehicleType);
      if (filters.brand && filters.brand !== "all") params.append("brand", filters.brand);
      if (filters.state && filters.state !== "all") params.append("state", filters.state);
      if (filters.district && filters.district !== "all") params.append("district", filters.district);
      if (filters.minYear) params.append("minYear", filters.minYear);
      if (filters.maxYear) params.append("maxYear", filters.maxYear);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minHP) params.append("minHP", filters.minHP);
      if (filters.maxHP) params.append("maxHP", filters.maxHP);
      if (filters.runningCondition && filters.runningCondition !== "all") params.append("runningCondition", filters.runningCondition);
      if (filters.insuranceStatus && filters.insuranceStatus !== "all") params.append("insuranceStatus", filters.insuranceStatus);
      if (filters.rcCopyStatus && filters.rcCopyStatus !== "all") params.append("rcCopyStatus", filters.rcCopyStatus);
      if (filters.isCertified && filters.isCertified !== "all") params.append("isCertified", filters.isCertified);
      if (filters.isFinanceAvailable && filters.isFinanceAvailable !== "all") params.append("isFinanceAvailable", filters.isFinanceAvailable);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);
      // Fetch all auctions (no pagination) - we'll paginate client-side after categorization
      params.append("page", "1");
      params.append("limit", "1000"); // Large limit to get all auctions

      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response: Response;
      try {
        response = await fetch(`/api/auctions?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
          // Add cache control to prevent stale data
          cache: 'no-store',
        });
      } catch (fetchError: any) {
        // Handle fetch errors (network issues, CORS, etc.)
        if (controller.signal.aborted) {
          return;
        }
        
        // For background refreshes, silently ignore network errors
        if (!showLoading) {
          return;
        }
        
        // For initial loads, show user-friendly error
        throw new Error('Network request failed. Please check your connection.');
      }

      clearTimeout(timeoutId);

      // Check if fetch was aborted
      if (controller.signal.aborted) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          setAuctions(data.data);
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response (backward compatibility)
          setAuctions(data);
        }
      } else {
        // Handle non-ok responses
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch auctions" }));
        console.error("Failed to fetch auctions:", errorData.message || response.statusText);
        // Don't show error toast for silent refreshes
        if (showLoading) {
          toast.error(errorData.message || "Failed to load auctions. Please try again.");
        }
      }
    } catch (error: any) {
      // Check if fetch was aborted
      if (controller.signal.aborted) {
        return;
      }

      // Handle AbortError (timeout or cancellation) silently
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        // Silently ignore aborted requests
        return;
      }

      // Handle network errors - only log/show for initial loads
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('fetch')) {
        // Only log/show errors for initial loads, not background refreshes
        if (showLoading) {
          console.error("Network error fetching auctions:", error);
          toast.error("Network error. Please check your connection and try again.");
        }
        // Silently ignore network errors for background refreshes
        return;
      }

      // Handle other errors
      if (showLoading) {
        console.error("Error fetching auctions:", error);
        toast.error("An error occurred while loading auctions.");
      }
      // Silently ignore other errors for background refreshes
    } finally {
      // Only update state if fetch wasn't aborted
      if (!controller.signal.aborted) {
        if (showLoading) {
          setLoading(false);
          setIsInitialLoad(false);
        } else {
          setIsRefreshing(false);
        }
      }
      
      // Clear the abort controller reference if this was the current fetch
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleSearch = () => {
    fetchAuctions();
  };

  const clearFilters = () => {
    setSearch("");
    setVehicleType("all");
    setBrand("all");
    setState("all");
    setDistrict("all");
    setMinYear("");
    setMaxYear("");
    setMinPrice("");
    setMaxPrice("");
    setMinHP("");
    setMaxHP("");
    setRunningCondition("all");
    setInsuranceStatus("all");
    setRcCopyStatus("all");
    setIsCertified("all");
    setIsFinanceAvailable("all");
    setSortBy("startTime");
  };

  const hasActiveFilters = search || vehicleType !== "all" || brand !== "all" || state !== "all" || 
    district !== "all" || minYear || maxYear || minPrice || maxPrice || minHP || maxHP || 
    runningCondition !== "all" || insuranceStatus !== "all" || rcCopyStatus !== "all" || 
    isCertified !== "all" || isFinanceAvailable !== "all";

  // Helper function to check if auction is currently live based on time
  const isAuctionLive = (auction: Auction) => {
    const now = new Date();
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    return (now >= start && now < end) || (auction.status === "LIVE" && now < end);
  };

  const getTimeRemaining = (startTime: string, endTime: string) => {
    const now = new Date().getTime();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();

    if (isNaN(start) || isNaN(end)) return "";

    // Auction not started yet
    if (now < start) {
      const diffToStart = start - now;
      const hours = Math.floor(diffToStart / (1000 * 60 * 60));
      const minutes = Math.floor((diffToStart % (1000 * 60 * 60)) / (1000 * 60));
      return `Starts in ${hours}h ${minutes}m`;
    }

    // Auction running or ended
    const diff = end - now;
    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Separate and sort auctions - Ensure proper segregation with no overlaps
  const now = new Date();
  
  // First, categorize all auctions to ensure no overlaps
  // Ensure auctions is always an array
  const safeAuctions = Array.isArray(auctions) ? auctions : [];
  
  const categorizedAuctions = safeAuctions.map((auction) => {
    const start = new Date(auction.startTime);
    const end = new Date(auction.endTime);
    const hasStarted = now >= start;
    const hasEnded = now >= end;
    const isEndedStatus = auction.status === "ENDED";
    const isLiveStatus = auction.status === "LIVE";
    
    // Priority 1: Ended auctions (highest priority - check first)
    if (hasEnded || isEndedStatus) {
      return { auction, category: "ended" as const };
    }
    
    // Priority 2: Live auctions (currently running)
    // An auction is live if:
    // - It has started AND hasn't ended (time-based), OR
    // - Status is LIVE and hasn't ended
    if ((hasStarted && !hasEnded) || (isLiveStatus && !hasEnded)) {
      return { auction, category: "live" as const };
    }
    
    // Priority 3: Upcoming auctions (not started yet)
    // An auction is upcoming if:
    // - It hasn't started yet AND hasn't ended
    if (!hasStarted && !hasEnded) {
      return { auction, category: "upcoming" as const };
    }
    
    // Default: If somehow doesn't fit, treat as ended
    return { auction, category: "ended" as const };
  });

  // Separate into categories
  const liveAuctions = categorizedAuctions
    .filter((item) => item.category === "live")
    .map((item) => item.auction)
    .sort((a, b) => {
      // Sort by end time (ascending) - auctions ending soonest appear first
      const endA = new Date(a.endTime).getTime();
      const endB = new Date(b.endTime).getTime();
      return endA - endB;
    });

  const upcomingAuctions = categorizedAuctions
    .filter((item) => item.category === "upcoming")
    .map((item) => item.auction)
    .sort((a, b) => {
      // Sort by start time (ascending) - auctions starting soonest appear first
      const startA = new Date(a.startTime).getTime();
      const startB = new Date(b.startTime).getTime();
      return startA - startB;
    });

  const endedAuctions = categorizedAuctions
    .filter((item) => item.category === "ended")
    .map((item) => item.auction)
    .sort((a, b) => {
      // Sort by end time (descending) - most recently ended first
      const endA = new Date(a.endTime).getTime();
      const endB = new Date(b.endTime).getTime();
      return endB - endA;
    });

  const displayedAuctions = 
    activeTab === "live" ? liveAuctions : 
    activeTab === "upcoming" ? upcomingAuctions : 
    endedAuctions;

  // Apply client-side filtering to displayed auctions (for search)
  const filteredDisplayedAuctions = displayedAuctions.filter((auction) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const searchTerm = searchLower.trim();
      
      // Search in brand
      const brandMatch = auction.vehicle.tractorBrand?.toLowerCase().includes(searchTerm);
      
      // Search in model
      const modelMatch = auction.vehicle.tractorModel?.toLowerCase().includes(searchTerm);
      
      // Search in HP (engineHP)
      const hpMatch = auction.vehicle.engineHP?.toLowerCase().includes(searchTerm);
      
      // Search in year (yearOfMfg)
      const yearMatch = auction.vehicle.yearOfMfg?.toString().includes(searchTerm);
      
      // Search in registration number
      const regMatch = auction.vehicle.registrationNumber?.toLowerCase().includes(searchTerm);
      
      // Search in vehicle reference number
      const vehicleRefMatch = auction.vehicle.referenceNumber?.toLowerCase().includes(searchTerm);
      
      // Search in auction reference number
      const auctionRefMatch = auction.referenceNumber?.toLowerCase().includes(searchTerm);
      
      // Search in engine number
      const engineNumMatch = auction.vehicle.engineNumber?.toLowerCase().includes(searchTerm);
      
      // Search in chassis number
      const chassisNumMatch = auction.vehicle.chassisNumber?.toLowerCase().includes(searchTerm);
      
      // Return true if any field matches
      if (!brandMatch && !modelMatch && !hpMatch && !yearMatch && !regMatch && 
          !vehicleRefMatch && !auctionRefMatch && !engineNumMatch && !chassisNumMatch) {
        return false;
      }
    }
    return true;
  });
  
  // Client-side pagination for categorized results
  const totalPages = Math.ceil(filteredDisplayedAuctions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAuctions = filteredDisplayedAuctions.slice(startIndex, endIndex);
  
  const pagination = {
    page: currentPage,
    limit: itemsPerPage,
    total: filteredDisplayedAuctions.length,
    totalPages: totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
          {/* Enhanced Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg">
                    <Gavel className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 bg-clip-text text-transparent">
                    Auctions
                  </h1>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Calendar View Button */}
                  <Link
                    href="/auctions/calendar"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base"
                  >
                    <Calendar className="w-5 h-5 text-white" />
                    <span className="hidden sm:inline">Calendar View</span>
                    <span className="sm:hidden">Calendar</span>
                  </Link>
                  
                  {/* Count in Right Corner */}
                  {(liveAuctions.length > 0 || upcomingAuctions.length > 0) && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 via-primary-100 to-primary-50 rounded-xl border border-primary-200 shadow-md">
                      <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent">
                        {liveAuctions.length + upcomingAuctions.length}+
                      </p>
                      <p className="text-sm sm:text-base font-bold text-primary-700">
                        vehicles are awaiting for you
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-gray-600 text-base sm:text-lg mt-3 font-medium">
                Bid on vehicles in real-time. Highest bidder wins (subject to seller approval)
              </p>
            </div>
          </div>

        {/* Advanced Search Section */}
        <div className="mb-4 sm:mb-6">
          <AdvancedSearch
            onSearch={handleAdvancedSearch}
            initialFilters={{
              search,
              vehicleType,
              brand,
              state,
              district,
              minPrice,
              maxPrice,
              minYear,
              maxYear,
              minHP,
              maxHP,
              runningCondition,
              insuranceStatus,
              rcCopyStatus,
              isCertified,
              isFinanceAvailable,
              sortBy,
            }}
            showSaveSearch={true}
            searchType="auction"
            sortOptions={sortOptions}
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && (
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {paginatedAuctions.length} of {filteredDisplayedAuctions.length} auction{filteredDisplayedAuctions.length !== 1 ? "s" : ""}
              {hasActiveFilters && " (filtered)"}
            </div>
            {isRefreshing && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
                <span>Refreshing...</span>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6">
          <div className="flex space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab("live")}
              className={`group flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg transition-all rounded-lg touch-manipulation flex items-center justify-center space-x-2 ${
                activeTab === "live"
                  ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              <Gavel className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === "live" ? "text-white" : "text-gray-600"}`} />
              <span>Live Auctions</span>
              {liveAuctions.length > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold ${
                  activeTab === "live"
                    ? "bg-white/30 text-white"
                    : "bg-red-100 text-red-600"
                }`}>
                  {liveAuctions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("upcoming")}
              className={`group flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg transition-all rounded-lg touch-manipulation flex items-center justify-center space-x-2 ${
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg hover:from-primary-700 hover:to-primary-800 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === "upcoming" ? "text-white" : "text-gray-600"}`} />
              <span>Upcoming Auctions</span>
              {upcomingAuctions.length > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold ${
                  activeTab === "upcoming"
                    ? "bg-white/30 text-white"
                    : "bg-primary-100 text-primary-600"
                }`}>
                  {upcomingAuctions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("ended")}
              className={`group flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 font-bold text-base sm:text-lg transition-all rounded-lg touch-manipulation flex items-center justify-center space-x-2 ${
                activeTab === "ended"
                  ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg hover:from-gray-700 hover:to-gray-800 scale-105"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
              }`}
            >
              <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 ${activeTab === "ended" ? "text-white" : "text-gray-600"}`} />
              <span>Ended Auctions</span>
              {endedAuctions.length > 0 && (
                <span className={`px-2.5 py-1 rounded-full text-xs sm:text-sm font-bold ${
                  activeTab === "ended"
                    ? "bg-white/30 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {endedAuctions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <>
          {/* Live Auctions Tab Content */}
          {activeTab === "live" && (
            <>
            {liveAuctions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Gavel className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg font-semibold">Today there is no Live Auctions</p>
                <Link
                  href="/register"
                  className="text-primary-600 hover:underline mt-4 inline-block"
                >
                  Register to get notified when new auctions start
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                  >
                <div className="relative h-48 bg-gray-200 cursor-pointer" onClick={() => {
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
                  {auction.vehicle.mainPhoto ? (
                    <Image
                      src={
                        auction.vehicle.mainPhoto.startsWith("http")
                          ? auction.vehicle.mainPhoto
                          : `/uploads/${auction.vehicle.mainPhoto}`
                      }
                      alt={auction.vehicle.tractorBrand}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={!auction.vehicle.mainPhoto.startsWith("http")}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Gavel className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  {auction.vehicle.isCertified && (
                    <div className="absolute top-2 right-2 z-20">
                      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 border-2 border-white/30">
                        <ShieldCheck className="w-4 h-4 text-white" />
                        <span className="font-bold text-sm tracking-wide">CERTIFIED</span>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                      </div>
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-30 -z-10"></div>
                    </div>
                  )}
                  {isAuctionLive(auction) && (
                    <div className={`absolute ${auction.vehicle.isCertified ? 'top-2 left-2' : 'top-2 right-2'} bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                      LIVE
                    </div>
                  )}
                  {auction.vehicle.subPhotos && auction.vehicle.subPhotos.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                      +{auction.vehicle.subPhotos.length} more
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold mb-3 min-h-[3rem] line-clamp-2 overflow-hidden text-gray-900">
                    {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel ? auction.vehicle.tractorModel : ""} {auction.vehicle.engineHP} HP
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Engine HP:</span>
                      <span className="font-medium">{auction.vehicle.engineHP}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Year:</span>
                      <span className="font-medium">{auction.vehicle.yearOfMfg}</span>
                    </div>
                    {auction.vehicle.hoursRun && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Hours Run:</span>
                        <span className="font-medium">{auction.vehicle.hoursRun}</span>
                      </div>
                    )}
                    {auction.vehicle.financeNocPapers && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center">
                          <FileText className="w-3 h-3 mr-1 text-gray-500" />
                          Finance NOC:
                        </span>
                        <span className="font-medium">{auction.vehicle.financeNocPapers}</span>
                      </div>
                    )}
                    {auction.vehicle.readyForToken && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 flex items-center">
                          <UserCheck className="w-3 h-3 mr-1 text-gray-500" />
                          Ready For Token (Name Transfer):
                        </span>
                        <span className="font-medium">{auction.vehicle.readyForToken}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                        State:
                      </span>
                      <span className="font-medium">{auction.vehicle.state}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-gray-500" />
                        {isAuctionLive(auction) ? "Time Remaining:" : "Starts in:"}
                      </span>
                      <span className={`font-semibold ${isAuctionLive(auction) ? "text-red-600" : "text-gray-700"}`}>
                        {getTimeRemaining(auction.startTime, auction.endTime)}
                      </span>
                    </div>
                    {auction.vehicle.isFinanceAvailable && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-500 flex items-center">
                          <CreditCard className="w-4 h-4 mr-1 text-green-600" />
                          Finance:
                        </span>
                        <span className="font-bold text-green-700 text-base">
                          Finance Available
                        </span>
                      </div>
                    )}
                    {/* Reserve Price */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-gray-500 flex items-center">
                        <Gavel className="w-3 h-3 mr-1 text-gray-500" />
                        Reserve Price:
                      </span>
                      <span className="font-semibold text-orange-600">
                        ₹{auction.reservePrice?.toLocaleString("en-IN") || "N/A"}
                      </span>
                    </div>
                    {/* EMD Required */}
                    {auction.emdRequired && auction.emdAmount && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-gray-500 flex items-center">
                          <ShieldCheck className="w-3 h-3 mr-1 text-gray-500" />
                          EMD Required:
                        </span>
                        <span className="font-semibold text-yellow-600">
                          ₹{auction.emdAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pt-4 border-t mt-auto space-y-2">
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                        <ShareButton
                          url={isAuctionLive(auction) ? `/auctions/${auction.id}/live` : `/vehicles/${auction.vehicle.id}`}
                          title={`${auction.vehicle.tractorBrand} ${auction.vehicle.tractorModel || ""} ${auction.vehicle.engineHP} HP - ${auction.vehicle.yearOfMfg}`}
                          description={`Check out this ${auction.vehicle.vehicleType.replace(/_/g, " ")} auction on Tractor Auction!`}
                          variant="icon"
                          className="w-full"
                        />
                      </div>
                      {isAuctionLive(auction) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Store both vehicle and auction data
                            const vehicleWithAuction = {
                              ...auction.vehicle,
                              auctionReferenceNumber: auction.referenceNumber,
                              auctionId: auction.id,
                              isAuctionVehicle: true,
                              reservePrice: auction.reservePrice,
                            };
                            setSelectedVehicle(vehicleWithAuction);
                            setShowCompleteDetails(true);
                          }}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 border border-gray-300"
                        >
                          <Info className="w-4 h-4 text-gray-500" />
                          <span className="hidden sm:inline">Details</span>
                        </button>
                      )}
                    </div>
                    <Link
                      href={isAuctionLive(auction) ? `/auctions/${auction.id}/live` : `/vehicles/${auction.vehicle.id}`}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      onClick={(e) => {
                        const token = localStorage.getItem("token");
                        if (!token && isAuctionLive(auction)) {
                          e.preventDefault();
                          alert("Please login to place a bid");
                          window.location.href = "/login";
                        }
                      }}
                    >
                      <Gavel className="w-4 h-4 text-gray-600" />
                      <span>{isAuctionLive(auction) ? "Bid Now" : "View Details"}</span>
                    </Link>
                  </div>
                </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}

          {/* Upcoming Auctions Tab Content */}
          {activeTab === "upcoming" && (
            <>
            {upcomingAuctions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg">No upcoming auctions scheduled.</p>
                <Link
                  href="/register"
                  className="text-primary-600 hover:underline mt-4 inline-block"
                >
                  Register to get notified when new auctions start
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {auction.vehicle.mainPhoto ? (
                        <img
                          src={
                            auction.vehicle.mainPhoto.startsWith("http")
                              ? auction.vehicle.mainPhoto
                              : `/uploads/${auction.vehicle.mainPhoto}`
                          }
                          alt={auction.vehicle.tractorBrand}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Gavel className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {auction.vehicle.isCertified && (
                        <div className="absolute top-2 right-2 z-20">
                          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 border-2 border-white/30">
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span className="font-bold text-sm tracking-wide">CERTIFIED</span>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                          </div>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-30 -z-10"></div>
                        </div>
                      )}
                      {auction.status === "SCHEDULED" && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          UPCOMING
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold mb-3 min-h-[3rem] line-clamp-2 overflow-hidden">
                        {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel ? auction.vehicle.tractorModel : ""} {auction.vehicle.engineHP} HP
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Engine HP:</span>
                          <span className="font-medium">{auction.vehicle.engineHP}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Year:</span>
                          <span className="font-medium">{auction.vehicle.yearOfMfg}</span>
                        </div>
                        {auction.vehicle.hoursRun && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Hours Run:</span>
                            <span className="font-medium">{auction.vehicle.hoursRun}</span>
                          </div>
                        )}
                        {auction.vehicle.financeNocPapers && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 flex items-center">
                              <FileText className="w-3 h-3 mr-1 text-gray-500" />
                              Finance NOC:
                            </span>
                            <span className="font-medium">{auction.vehicle.financeNocPapers}</span>
                          </div>
                        )}
                        {auction.vehicle.readyForToken && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 flex items-center">
                              <UserCheck className="w-3 h-3 mr-1 text-gray-500" />
                              Ready For Token (Name Transfer):
                            </span>
                            <span className="font-medium">{auction.vehicle.readyForToken}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                            State:
                          </span>
                          <span className="font-medium">{auction.vehicle.state}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-gray-500" />
                            Starts in:
                          </span>
                          <span className="font-semibold text-gray-700">
                            {getTimeRemaining(auction.startTime, auction.endTime)}
                          </span>
                        </div>
                        {auction.vehicle.isFinanceAvailable && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-gray-500 flex items-center">
                              <CreditCard className="w-4 h-4 mr-1 text-green-600" />
                              Finance:
                            </span>
                            <span className="font-bold text-green-700 text-base">
                              Finance Available
                            </span>
                          </div>
                        )}
                        {/* Reserve Price */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-500 flex items-center">
                            <Gavel className="w-3 h-3 mr-1 text-gray-500" />
                            Reserve Price:
                          </span>
                          <span className="font-semibold text-orange-600">
                            ₹{auction.reservePrice?.toLocaleString("en-IN") || "N/A"}
                          </span>
                        </div>
                        {/* EMD Required */}
                        {auction.emdRequired && auction.emdAmount && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-gray-500 flex items-center">
                              <ShieldCheck className="w-3 h-3 mr-1 text-gray-500" />
                              EMD Required:
                            </span>
                            <span className="font-semibold text-yellow-600">
                              ₹{auction.emdAmount.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 border-t mt-auto">
                        <Link
                          href={`/auctions/${auction.id}/live`}
                          className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <Gavel className="w-4 h-4 text-gray-600" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}

          {/* Ended Auctions Tab Content */}
          {activeTab === "ended" && (
            <>
            {endedAuctions.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 text-lg">No ended auctions found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedAuctions.map((auction) => (
                  <div
                    key={auction.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full opacity-90"
                  >
                    <div className="relative h-48 bg-gray-200">
                      {auction.vehicle.mainPhoto ? (
                        <img
                          src={
                            auction.vehicle.mainPhoto.startsWith("http")
                              ? auction.vehicle.mainPhoto
                              : `/uploads/${auction.vehicle.mainPhoto}`
                          }
                          alt={auction.vehicle.tractorBrand}
                          className="w-full h-full object-cover grayscale"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Gavel className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {auction.vehicle.isCertified && (
                        <div className="absolute top-2 right-2 z-20">
                          <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center space-x-1.5 border-2 border-white/30">
                            <ShieldCheck className="w-4 h-4 text-white" />
                            <span className="font-bold text-sm tracking-wide">CERTIFIED</span>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-md animate-pulse"></div>
                          </div>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg blur opacity-30 -z-10"></div>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        ENDED
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="text-xl font-semibold mb-3 min-h-[3rem] line-clamp-2 overflow-hidden">
                        {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel ? auction.vehicle.tractorModel : ""} {auction.vehicle.engineHP} HP
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600 mb-4 flex-grow">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Engine HP:</span>
                          <span className="font-medium">{auction.vehicle.engineHP}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Year:</span>
                          <span className="font-medium">{auction.vehicle.yearOfMfg}</span>
                        </div>
                        {auction.vehicle.hoursRun && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Hours Run:</span>
                            <span className="font-medium">{auction.vehicle.hoursRun}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-500 font-semibold">Final Bid:</span>
                          <span className="font-bold text-lg text-gray-900">₹{auction.currentBid.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1 text-gray-500" />
                            State:
                          </span>
                          <span className="font-medium">{auction.vehicle.state}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1 text-gray-500" />
                            Ended:
                          </span>
                          <span className="font-semibold text-gray-700">
                            {new Date(auction.endTime).toLocaleDateString()}
                          </span>
                        </div>
                        {auction.vehicle.isFinanceAvailable && (
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-gray-500 flex items-center">
                              <CreditCard className="w-4 h-4 mr-1 text-green-600" />
                              Finance:
                            </span>
                            <span className="font-bold text-green-700 text-base">
                              Finance Available
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="pt-4 border-t mt-auto">
                        <Link
                          href={`/vehicles/${auction.vehicle.id}`}
                          className="w-full bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                        >
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
          )}

          {/* Pagination */}
          {!loading && filteredDisplayedAuctions.length > itemsPerPage && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={(newPage) => {
                setCurrentPage(newPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              total={pagination.total}
              limit={pagination.limit}
            />
          )}
        </>
      </div>
      {/* Complete Vehicle Details Modal */}
      {selectedVehicle && (
        <CompleteVehicleDetails
          vehicle={selectedVehicle}
          isOpen={showCompleteDetails}
          onClose={() => {
            setShowCompleteDetails(false);
            setSelectedVehicle(null);
          }}
          isAuctionVehicle={selectedVehicle.isAuctionVehicle || false}
          reservePrice={selectedVehicle.reservePrice}
          auctionReferenceNumber={selectedVehicle.auctionReferenceNumber}
          auctionId={selectedVehicle.auctionId}
        />
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
    </div>
  );
}


