"use client";

import { useState, useEffect } from "react";
import { Search, X, Save, History, Filter, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { getDistrictsForState } from "@/lib/indian-districts";

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

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);

interface SearchFilters {
  search?: string;
  vehicleType?: string;
  brand?: string;
  state?: string;
  district?: string;
  minPrice?: string;
  maxPrice?: string;
  minYear?: string;
  maxYear?: string;
  minHP?: string;
  maxHP?: string;
  runningCondition?: string;
  insuranceStatus?: string;
  rcCopyStatus?: string;
  isCertified?: string;
  isFinanceAvailable?: string;
  sortBy?: string;
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  showSaveSearch?: boolean;
  searchType?: "auction" | "preapproved";
  sortOptions?: Array<{ value: string; label: string }>;
}

const defaultSortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
  { value: "yearNew", label: "Year: Newest" },
  { value: "yearOld", label: "Year: Oldest" },
];

const auctionSortOptions = [
  { value: "startTime", label: "Start Time" },
  { value: "endTime", label: "End Time" },
  { value: "yearNew", label: "Year: Newest" },
  { value: "yearOld", label: "Year: Oldest" },
];

export default function AdvancedSearch({
  onSearch,
  initialFilters = {},
  showSaveSearch = true,
  searchType = "preapproved",
  sortOptions
}: AdvancedSearchProps) {
  const displaySortOptions = sortOptions || (searchType === "auction" ? auctionSortOptions : defaultSortOptions);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState<Array<{ id: string; name: string; filters: SearchFilters }>>([]);
  const [searchHistory, setSearchHistory] = useState<SearchFilters[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Load saved searches and history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`savedSearches_${searchType}`);
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading saved searches:", e);
      }
    }

    const history = localStorage.getItem(`searchHistory_${searchType}`);
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error("Error loading search history:", e);
      }
    }
  }, [searchType]);

  // Sync filters when initialFilters change
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters(initialFilters);
    }
  }, [initialFilters]);

  // Update districts when state changes
  useEffect(() => {
    if (filters.state && filters.state !== "all") {
      const districts = getDistrictsForState(filters.state);
      setAvailableDistricts(districts);
      if (filters.district && !districts.includes(filters.district)) {
        setFilters({ ...filters, district: "all" });
      }
    } else {
      setAvailableDistricts([]);
      setFilters({ ...filters, district: "all" });
    }
  }, [filters.state]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleSearch = () => {
    // Save to history
    const history = [...searchHistory];
    history.unshift(filters);
    const limitedHistory = history.slice(0, 10); // Keep last 10 searches
    setSearchHistory(limitedHistory);
    localStorage.setItem(`searchHistory_${searchType}`, JSON.stringify(limitedHistory));

    onSearch(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      search: "",
      vehicleType: "all",
      brand: "all",
      state: "all",
      district: "all",
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      minHP: "",
      maxHP: "",
      runningCondition: "all",
      insuranceStatus: "all",
      rcCopyStatus: "all",
      isCertified: "all",
      isFinanceAvailable: "all",
      sortBy: searchType === "auction" ? "startTime" : "newest",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      alert("Please enter a name for this search");
      return;
    }

    const newSavedSearch = {
      id: Date.now().toString(),
      name: saveSearchName,
      filters: { ...filters },
    };

    const updated = [...savedSearches, newSavedSearch];
    setSavedSearches(updated);
    localStorage.setItem(`savedSearches_${searchType}`, JSON.stringify(updated));
    setShowSaveModal(false);
    setSaveSearchName("");
  };

  const handleLoadSavedSearch = (savedFilters: SearchFilters) => {
    setFilters(savedFilters);
    onSearch(savedFilters);
  };

  const handleLoadHistory = (historyFilters: SearchFilters) => {
    setFilters(historyFilters);
    onSearch(historyFilters);
    setShowHistory(false);
  };

  const handleDeleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem(`savedSearches_${searchType}`, JSON.stringify(updated));
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value && value !== "all" && value !== ""
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by brand, model, HP, registration number, year, engine number, chassis number..."
          value={filters.search || ""}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
          {showSaveSearch && savedSearches.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 flex items-center gap-1"
              title="Search History"
            >
              <History className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleSearch}
            className="px-4 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div className="absolute z-50 mt-2 w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="p-2 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Recent Searches</h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {searchHistory.map((historyFilters, index) => (
              <button
                key={index}
                onClick={() => handleLoadHistory(historyFilters)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded text-sm"
              >
                {historyFilters.search || "Advanced Search"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.vehicleType || "all"}
          onChange={(e) => handleFilterChange("vehicleType", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          {vehicleTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={filters.brand || "all"}
          onChange={(e) => handleFilterChange("brand", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Brands</option>
          {tractorBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>

        <select
          value={filters.state || "all"}
          onChange={(e) => handleFilterChange("state", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All States</option>
          {indianStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>

        {availableDistricts.length > 0 && (
          <select
            value={filters.district || "all"}
            onChange={(e) => handleFilterChange("district", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Districts</option>
            {availableDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>More Filters</span>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Range (₹)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Year Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year Range
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.minYear || ""}
                  onChange={(e) => handleFilterChange("minYear", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Min Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.maxYear || ""}
                  onChange={(e) => handleFilterChange("maxYear", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Max Year</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* HP Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Engine HP Range
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min HP"
                  value={filters.minHP || ""}
                  onChange={(e) => handleFilterChange("minHP", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max HP"
                  value={filters.maxHP || ""}
                  onChange={(e) => handleFilterChange("maxHP", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Running Condition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Running Condition
              </label>
              <select
                value={filters.runningCondition || "all"}
                onChange={(e) => handleFilterChange("runningCondition", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {runningConditions.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Status
              </label>
              <select
                value={filters.insuranceStatus || "all"}
                onChange={(e) => handleFilterChange("insuranceStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="Valid">Valid</option>
                <option value="Expired">Expired</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>

            {/* RC Copy Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RC Copy Status
              </label>
              <select
                value={filters.rcCopyStatus || "all"}
                onChange={(e) => handleFilterChange("rcCopyStatus", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>

            {/* Certified */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Certified Vehicle
              </label>
              <select
                value={filters.isCertified || "all"}
                onChange={(e) => handleFilterChange("isCertified", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Finance Available */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Finance Available
              </label>
              <select
                value={filters.isFinanceAvailable || "all"}
                onChange={(e) => handleFilterChange("isFinanceAvailable", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={filters.sortBy || (searchType === "auction" ? "startTime" : "newest")}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                {displaySortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Saved Searches */}
      {showSaveSearch && savedSearches.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Saved Searches</h3>
            <button
              onClick={() => setShowSaveModal(true)}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <Save className="w-4 h-4" />
              Save Current Search
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {savedSearches.map((saved) => (
              <div
                key={saved.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
              >
                <button
                  onClick={() => handleLoadSavedSearch(saved.filters)}
                  className="hover:text-primary-600"
                >
                  {saved.name}
                </button>
                <button
                  onClick={() => handleDeleteSavedSearch(saved.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Search Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Save Search</h3>
            <input
              type="text"
              placeholder="Enter search name..."
              value={saveSearchName}
              onChange={(e) => setSaveSearchName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              onKeyPress={(e) => e.key === "Enter" && handleSaveSearch()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveSearchName("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSearch}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

