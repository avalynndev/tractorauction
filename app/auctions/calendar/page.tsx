"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Gavel,
  Clock,
  MapPin,
  IndianRupee,
  ArrowLeft,
  Filter,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";

interface Auction {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  currentBid: number;
  reservePrice: number;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    state: string;
    district: string | null;
    mainPhoto: string | null;
    vehicleType: string;
  };
  _count: {
    bids: number;
  };
}

interface AuctionsByDate {
  [date: string]: Auction[];
}

export default function AuctionCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [auctionsByDate, setAuctionsByDate] = useState<AuctionsByDate>({});
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Calculate month start and end dates
  const getMonthRange = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return { start, end };
  };

  // Calculate week start and end dates
  const getWeekRange = (date: Date) => {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day; // Adjust to Sunday (0 = Sunday)
    const start = new Date(dateCopy.getFullYear(), dateCopy.getMonth(), diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const fetchAuctions = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const startStr = startDate.toISOString().split("T")[0];
      const endStr = endDate.toISOString().split("T")[0];

      const response = await fetch(
        `/api/auctions/calendar?startDate=${startStr}&endDate=${endStr}&status=${statusFilter}`
      );

      if (response.ok) {
        const data = await response.json();
        setAuctionsByDate(data.auctionsByDate || {});
      } else {
        toast.error("Failed to load auctions");
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "month") {
      const { start, end } = getMonthRange(currentDate);
      fetchAuctions(start, end);
    } else {
      const { start, end } = getWeekRange(new Date(currentDate));
      fetchAuctions(start, end);
    }
  }, [currentDate, viewMode, statusFilter]);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getWeekDays = (date: Date) => {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day; // Adjust to Sunday
    const weekStart = new Date(dateCopy.getFullYear(), dateCopy.getMonth(), diff);
    const days: Date[] = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getAuctionCount = (date: Date) => {
    const dateKey = formatDate(date);
    return auctionsByDate[dateKey]?.length || 0;
  };

  const getAuctionsForDate = (date: Date) => {
    const dateKey = formatDate(date);
    return auctionsByDate[dateKey] || [];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "LIVE":
        return "bg-red-500";
      case "SCHEDULED":
        return "bg-blue-500";
      case "ENDED":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const selectedDateAuctions = selectedDate ? getAuctionsForDate(selectedDate) : [];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton href="/auctions" />
          <div className="flex items-center justify-between mt-4 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <CalendarIcon className="w-8 h-8 text-primary-600" />
                <span>Auction Calendar</span>
              </h1>
              <p className="text-gray-600 mt-2">
                View and schedule auctions visually
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    viewMode === "month"
                      ? "bg-primary-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    viewMode === "week"
                      ? "bg-primary-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter by Status</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "All" },
                { value: "SCHEDULED", label: "Scheduled" },
                { value: "LIVE", label: "Live" },
                { value: "ENDED", label: "Ended" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    statusFilter === option.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => (viewMode === "month" ? navigateMonth("prev") : navigateWeek("prev"))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
            <button
              onClick={() => (viewMode === "month" ? navigateMonth("next") : navigateWeek("next"))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Status Legend */}
          {!loading && (
            <div className="flex items-center justify-center gap-4 mb-4 text-sm flex-wrap">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Scheduled</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Live</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600">Ended</span>
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : viewMode === "month" ? (
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-700 py-2 text-sm"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="aspect-square"></div>;
                }

                const auctionCount = getAuctionCount(date);
                const isToday =
                  formatDate(date) === formatDate(new Date());
                const isSelected =
                  selectedDate && formatDate(date) === formatDate(selectedDate);

                return (
                  <button
                    key={formatDate(date)}
                    onClick={() => setSelectedDate(date)}
                    className={`aspect-square border-2 rounded-lg p-2 hover:bg-gray-50 transition-colors relative ${
                      isToday
                        ? "border-primary-600 bg-primary-50"
                        : isSelected
                        ? "border-primary-500 bg-primary-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold mb-1 ${
                        isToday ? "text-primary-600" : "text-gray-900"
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {auctionCount > 0 && (
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-semibold text-gray-700">
                          {auctionCount}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-gray-700 py-2 text-sm"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Week days */}
              <div className="grid grid-cols-7 gap-2">
                {getWeekDays(currentDate).map((date) => {
                  const auctionCount = getAuctionCount(date);
                  const isToday = formatDate(date) === formatDate(new Date());
                  const isSelected =
                    selectedDate && formatDate(date) === formatDate(selectedDate);

                  return (
                    <button
                      key={formatDate(date)}
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[100px] border-2 rounded-lg p-3 hover:bg-gray-50 transition-colors ${
                        isToday
                          ? "border-primary-600 bg-primary-50"
                          : isSelected
                          ? "border-primary-500 bg-primary-100"
                          : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`text-sm font-semibold mb-2 ${
                          isToday ? "text-primary-600" : "text-gray-900"
                        }`}
                      >
                        {date.getDate()}
                      </div>
                      {auctionCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-gray-700">
                              {auctionCount} auction{auctionCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Selected Date Auctions */}
        {selectedDate && selectedDateAuctions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Auctions on {selectedDate.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedDateAuctions.map((auction) => (
                <Link
                  key={auction.id}
                  href={`/auctions/${auction.id}/live`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {auction.vehicle.mainPhoto && (
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image
                          src={auction.vehicle.mainPhoto}
                          alt={auction.vehicle.tractorBrand}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            auction.status
                          )} text-white`}
                        >
                          {auction.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel || ""}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(auction.startTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {auction.vehicle.district || ""}{" "}
                            {auction.vehicle.district && ","} {auction.vehicle.state}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-semibold">
                            {auction.currentBid.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {auction._count.bids > 0 && (
                          <div className="flex items-center space-x-1">
                            <Gavel className="w-4 h-4" />
                            <span>{auction._count.bids} bid{auction._count.bids > 1 ? "s" : ""}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {selectedDate && selectedDateAuctions.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <p className="text-gray-600">
              No auctions scheduled for{" "}
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

