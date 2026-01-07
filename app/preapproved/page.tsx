"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IndianRupee, MapPin, Calendar, Truck, Search, Filter, X, SlidersHorizontal, GitCompare } from "lucide-react";
import { getDistrictsForState } from "@/lib/indian-districts";
import VehicleActions from "@/components/vehicles/VehicleActions";
import QuickViewModal from "@/components/vehicles/QuickViewModal";
import VehicleComparison, { addToComparison } from "@/components/vehicles/VehicleComparison";
import RecommendedVehicles from "@/components/vehicles/RecommendedVehicles";
import VoiceSearch from "@/components/search/VoiceSearch";
import AdvancedSearch from "@/components/search/AdvancedSearch";
import Pagination from "@/components/ui/Pagination";
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
  { value: "SCRAP_TRACTOR", label: "Scrap Tractor" },
];

const runningConditions = [
  { value: "all", label: "All Conditions" },
  { value: "Self Start", label: "Self Start" },
  { value: "Push Start", label: "Push Start" },
  { value: "Towing", label: "Towing" },
];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "yearNew", label: "Year: Newest" },
  { value: "yearOld", label: "Year: Oldest" },
];

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);

interface Vehicle {
  id: string;
  vehicleType: string;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  state: string;
  saleAmount: number;
  saleType?: string;
  mainPhoto: string | null;
  runningCondition?: string;
  createdAt: string;
  seller?: {
    district?: string | null;
  };
}

export default function PreApprovedPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  
  // Search and filter states
  const [search, setSearch] = useState("");
  const [vehicleType, setVehicleType] = useState("all");
  const [brand, setBrand] = useState("all");
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minYear, setMinYear] = useState("");
  const [maxYear, setMaxYear] = useState("");
  const [runningCondition, setRunningCondition] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

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
    fetchVehicles();
  }, [vehicleType, brand, state, district, minPrice, maxPrice, minYear, maxYear, runningCondition, sortBy, page]);

  const handleAdvancedSearch = (filters: any) => {
    // Update local state with filters
    setSearch(filters.search || "");
    setVehicleType(filters.vehicleType || "all");
    setBrand(filters.brand || "all");
    setState(filters.state || "all");
    setDistrict(filters.district || "all");
    setMinPrice(filters.minPrice || "");
    setMaxPrice(filters.maxPrice || "");
    setMinYear(filters.minYear || "");
    setMaxYear(filters.maxYear || "");
    setRunningCondition(filters.runningCondition || "all");
    setSortBy(filters.sortBy || "newest");
    setPage(1); // Reset to first page
    // Fetch with new filters
    fetchVehicles(filters);
  };

  const fetchVehicles = async (searchFilters?: any) => {
    setLoading(true);
    try {
      const filters = searchFilters || {
        search,
        vehicleType,
        brand,
        state,
        district,
        minPrice,
        maxPrice,
        minYear,
        maxYear,
        runningCondition,
        sortBy,
      };

      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.vehicleType && filters.vehicleType !== "all") params.append("vehicleType", filters.vehicleType);
      if (filters.brand && filters.brand !== "all") params.append("brand", filters.brand);
      if (filters.state && filters.state !== "all") params.append("state", filters.state);
      if (filters.district && filters.district !== "all") params.append("district", filters.district);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.minYear) params.append("minYear", filters.minYear);
      if (filters.maxYear) params.append("maxYear", filters.maxYear);
      if (filters.minHP) params.append("minHP", filters.minHP);
      if (filters.maxHP) params.append("maxHP", filters.maxHP);
      if (filters.runningCondition && filters.runningCondition !== "all") params.append("runningCondition", filters.runningCondition);
      if (filters.insuranceStatus && filters.insuranceStatus !== "all") params.append("insuranceStatus", filters.insuranceStatus);
      if (filters.rcCopyStatus && filters.rcCopyStatus !== "all") params.append("rcCopyStatus", filters.rcCopyStatus);
      if (filters.isCertified && filters.isCertified !== "all") params.append("isCertified", filters.isCertified);
      if (filters.isFinanceAvailable && filters.isFinanceAvailable !== "all") params.append("isFinanceAvailable", filters.isFinanceAvailable);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch("/api/vehicles/preapproved?" + params.toString());
      if (response.ok) {
        const data = await response.json();
        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          setVehicles(data.data);
          setPagination(data.pagination || pagination);
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response (backward compatibility)
          setVehicles(data);
        }
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVehicles();
  };

  const clearFilters = () => {
    setSearch("");
    setVehicleType("all");
    setBrand("all");
    setState("all");
    setDistrict("all");
    setMinPrice("");
    setMaxPrice("");
    setMinYear("");
    setMaxYear("");
    setRunningCondition("all");
    setSortBy("newest");
  };

  const hasActiveFilters = search || vehicleType !== "all" || brand !== "all" || state !== "all" || 
    district !== "all" || minPrice || maxPrice || minYear || maxYear || runningCondition !== "all";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Legacy loading check (keeping for compatibility)
  if (false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">Pre-Approved Vehicles</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Browse directly available vehicles at fixed prices
              </p>
            </div>
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
              runningCondition,
              sortBy,
            }}
            showSaveSearch={true}
            searchType="preapproved"
          />
        </div>


        {/* Results Count */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
            {hasActiveFilters && " (filtered)"}
          </div>
        )}

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No pre-approved vehicles available at the moment.</p>
            <Link
              href="/register"
              className="text-primary-600 hover:underline mt-4 inline-block"
            >
              Register to get notified when new vehicles are listed
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.isArray(vehicles) && vehicles.map((vehicle) => {
                return (
                  <div
                    key={vehicle.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                <Link href={"/vehicles/" + vehicle.id} className="block">
                  <div className="relative h-48 bg-gray-200">
                    {vehicle.mainPhoto ? (
                      <Image
                        src={
                          vehicle.mainPhoto.startsWith("http")
                            ? vehicle.mainPhoto
                            : "/uploads/" + vehicle.mainPhoto
                        }
                        alt={vehicle.tractorBrand}
                        fill
                        className="object-cover"
                        sizes={"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                        unoptimized={!vehicle.mainPhoto.startsWith("http")}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Truck className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
                      <VehicleActions
                        vehicleId={vehicle.id}
                        saleType={vehicle.saleType as "AUCTION" | "PREAPPROVED"}
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-semibold mb-2">
                      {vehicle.tractorBrand} {vehicle.engineHP} HP
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Year: {vehicle.yearOfMfg}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{vehicle.state}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.vehicleType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-between pt-4 border-t mb-3">
                    <div className="flex items-center text-primary-600 font-bold text-xl">
                      <IndianRupee className="w-5 h-5" />
                      <span>{vehicle.saleAmount.toLocaleString("en-IN")}</span>
                    </div>
                    <ShareButton
                      url={"/vehicles/" + vehicle.id}
                      title={vehicle.tractorBrand + " " + vehicle.engineHP + " HP - " + vehicle.yearOfMfg}
                      description={"Check out this " + vehicle.vehicleType.split("_").join(" ") + " on Tractor Auction!"}
                      variant="icon"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQuickViewVehicle(vehicle);
                          setIsQuickViewOpen(true);
                        }}
                        className="text-sm text-primary-600 hover:underline"
                        type="button"
                      >
                        Quick View
                      </button>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={"/vehicles/" + vehicle.id}
                        className="text-sm text-primary-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Detailed View
                      </Link>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = addToComparison(vehicle.id);
                        // Always open comparison modal, even if vehicle wasn't added (to show existing vehicles)
                        setIsComparisonOpen(true);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-primary-600 hover:text-white rounded-lg transition-colors flex-shrink-0 flex items-center gap-1"
                      title="Add to Comparison"
                      type="button"
                    >
                      <GitCompare className="w-4 h-4" />
                      Compare
                    </button>
                  </div>
                </div>
                </div>
                );
              })}
            </div>

            {/* Pagination */}
            {!loading && Array.isArray(vehicles) && vehicles.length > 0 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                total={pagination.total}
                limit={pagination.limit}
              />
            )}
          </>
        )}

        {/* Recommended Vehicles */}
        {!loading && Array.isArray(vehicles) && vehicles.length > 0 && (
          <RecommendedVehicles limit={6} title="You May Also Like" />
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        vehicle={quickViewVehicle}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        onViewFull={() => {
          if (quickViewVehicle) {
            router.push("/vehicles/" + quickViewVehicle.id);
          }
        }}
      />

      {/* Comparison Modal */}
      <VehicleComparison
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />
    </div>
  );
}


