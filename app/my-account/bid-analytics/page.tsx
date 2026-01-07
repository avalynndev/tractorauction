"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gavel,
  TrendingUp,
  Award,
  DollarSign,
  BarChart3,
  Calendar,
  MapPin,
  Truck,
  Activity,
  ArrowLeft,
  Trophy,
  Target,
  TrendingDown,
  Package,
  ShoppingCart,
} from "lucide-react";
import PageLoader from "@/components/ui/PageLoader";
import toast from "react-hot-toast";

interface BidAnalyticsData {
  overview: {
    totalBids: number;
    totalAuctionsBidOn: number;
    totalWonAuctions: number;
    winRate: number;
    successRate: number;
    activeBids: number;
  };
  bidAmounts: {
    totalBidAmount: number;
    averageBidAmount: number;
    highestBid: number;
    lowestBid: number;
    averageWinningBidAmount: number;
  };
  averages: {
    averageBidsPerAuction: number;
  };
  breakdowns: {
    byVehicleType: Record<string, number>;
    byState: Record<string, number>;
    byBrand: Record<string, number>;
  };
  timeBased: {
    last30Days: number;
    last90Days: number;
    last1Year: number;
    monthlyBids: Record<string, number>;
    monthlyWins: Record<string, number>;
  };
  topAuctions: Array<{
    auctionId: string;
    bidCount: number;
    vehicle: {
      vehicleType: string;
      tractorBrand: string;
      state: string;
      yearOfMfg: number;
    };
    highestBid: number;
    status: string;
    won: boolean;
  }>;
}

interface SellerAnalyticsData {
  overview: {
    totalVehicles: number;
    totalSoldVehicles: number;
    totalAuctions: number;
    activeListings: number;
    totalRevenue: number;
    averageSalePrice: number;
    approvalRate: number;
    conversionRate: number;
    sellerApprovalRate: number;
  };
  vehicles: {
    byStatus: Record<string, number>;
    bySaleType: Record<string, number>;
    byVehicleType: Record<string, number>;
    byBrand: Record<string, number>;
    byState: Record<string, number>;
    averageListingPrice: number;
  };
  auctions: {
    byStatus: Record<string, number>;
    endedCount: number;
    liveCount: number;
    scheduledCount: number;
    averageBidsPerAuction: number;
    averageFinalBid: number;
  };
  timeBased: {
    last30Days: number;
    last90Days: number;
    last1Year: number;
    monthlyListings: Record<string, number>;
    monthlySales: Record<string, number>;
  };
  topVehicles: Array<{
    vehicleId: string;
    salePrice: number;
    vehicleType: string;
    tractorBrand: string;
    yearOfMfg: number;
    state: string;
    status: string;
    saleType: string;
    hasAuction: boolean;
    auctionStatus?: string;
    bidCount: number;
  }>;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bidAnalytics, setBidAnalytics] = useState<BidAnalyticsData | null>(null);
  const [sellerAnalytics, setSellerAnalytics] = useState<SellerAnalyticsData | null>(null);

  useEffect(() => {
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      getCookie("token");

    if (!token || token === "undefined" || token === "null") {
      router.push("/login");
      return;
    }

    fetchAllAnalytics(token);
  }, [router]);

  const fetchAllAnalytics = async (token: string) => {
    try {
      // Fetch both analytics in parallel
      const [bidResponse, sellerResponse] = await Promise.all([
        fetch("/api/my-account/bids/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/my-account/seller-analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (bidResponse.ok) {
        const bidData = await bidResponse.json();
        setBidAnalytics(bidData);
      } else if (bidResponse.status !== 401) {
        // If 401, user will be redirected, otherwise just don't set bid analytics
        console.log("No bid analytics available");
      }

      if (sellerResponse.ok) {
        const sellerData = await sellerResponse.json();
        setSellerAnalytics(sellerData);
      } else if (sellerResponse.status !== 401) {
        // If 401, user will be redirected, otherwise just don't set seller analytics
        console.log("No seller analytics available");
      }

      if (bidResponse.status === 401 || sellerResponse.status === 401) {
        router.push("/login");
        return;
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const formatMonthLabel = (key: string) => {
    const [year, month] = key.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!bidAnalytics && !sellerAnalytics) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-600">No analytics data available.</p>
            <Link
              href="/my-account"
              className="text-primary-600 hover:underline mt-4 inline-block"
            >
              Back to My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/my-account"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Account
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive statistics and insights about your activity
          </p>
        </div>

        {/* BID ANALYTICS SECTION */}
        {bidAnalytics && (
          <div className="mb-12">
            <div className="bg-white rounded-lg shadow-sm border-2 border-primary-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <Gavel className="w-6 h-6 mr-3 text-primary-600" />
                Bid Analytics
              </h2>
              <p className="text-gray-600">
                Statistics and insights about your bidding activity
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Bids</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(bidAnalytics.overview.totalBids)}
                    </p>
                  </div>
                  <div className="bg-primary-100 rounded-full p-3">
                    <Gavel className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Auctions Bid On</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(bidAnalytics.overview.totalAuctionsBidOn)}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Won Auctions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(bidAnalytics.overview.totalWonAuctions)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <Trophy className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Win Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {bidAnalytics.overview.winRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <TrendingUp className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Bid Amount</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(bidAnalytics.bidAmounts.averageBidAmount)}
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <DollarSign className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Bids</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(bidAnalytics.overview.activeBids)}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bid Amounts Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Bid Amount Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="text-sm text-gray-600">Total Bid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bidAnalytics.bidAmounts.totalBidAmount)}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Average Bid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bidAnalytics.bidAmounts.averageBidAmount)}
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Highest Bid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bidAnalytics.bidAmounts.highestBid)}
                  </p>
                </div>
                <div className="border-l-4 border-gray-500 pl-4">
                  <p className="text-sm text-gray-600">Lowest Bid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bidAnalytics.bidAmounts.lowestBid)}
                  </p>
                </div>
                <div className="border-l-4 border-yellow-500 pl-4">
                  <p className="text-sm text-gray-600">Avg Winning Bid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(bidAnalytics.bidAmounts.averageWinningBidAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Time-based Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Activity Over Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Last 30 Days</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(bidAnalytics.timeBased.last30Days)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Last 90 Days</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(bidAnalytics.timeBased.last90Days)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Last Year</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(bidAnalytics.timeBased.last1Year)}
                  </p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Bids & Wins (Last 12 Months)
                </h4>
                <div className="space-y-2">
                  {Object.keys(bidAnalytics.timeBased.monthlyBids)
                    .sort()
                    .map((key) => {
                      const bids = bidAnalytics.timeBased.monthlyBids[key];
                      const wins = bidAnalytics.timeBased.monthlyWins[key] || 0;
                      const maxBids = Math.max(
                        ...Object.values(bidAnalytics.timeBased.monthlyBids),
                        1
                      );
                      const bidsWidth = (bids / maxBids) * 100;
                      const winsWidth = wins > 0 ? (wins / maxBids) * 100 : 0;

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 font-medium w-24">
                              {formatMonthLabel(key)}
                            </span>
                            <div className="flex-1 mx-4">
                              <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-primary-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                  style={{ width: `${bidsWidth}%` }}
                                >
                                  {bids > 0 && `${bids} bids`}
                                </div>
                                {wins > 0 && (
                                  <div
                                    className="absolute top-0 left-0 h-full bg-green-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                    style={{ width: `${winsWidth}%` }}
                                  >
                                    {wins > 0 && `${wins} wins`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-600 text-xs w-16 text-right">
                              {wins}/{bids}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary-500 rounded"></div>
                    <span className="text-sm text-gray-600">Bids</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Wins</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* By Vehicle Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  By Vehicle Type
                </h4>
                <div className="space-y-3">
                  {Object.entries(bidAnalytics.breakdowns.byVehicleType)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => {
                      const total = bidAnalytics.overview.totalBids;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {type.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By State */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  By State
                </h4>
                <div className="space-y-3">
                  {Object.entries(bidAnalytics.breakdowns.byState)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([state, count]) => {
                      const total = bidAnalytics.overview.totalBids;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={state}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{state}</span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Brand */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  By Brand
                </h4>
                <div className="space-y-3">
                  {Object.entries(bidAnalytics.breakdowns.byBrand)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([brand, count]) => {
                      const total = bidAnalytics.overview.totalBids;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={brand}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{brand}</span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Top Auctions */}
            {bidAnalytics.topAuctions.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Most Bid On Auctions
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vehicle
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Bids
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Highest Bid
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bidAnalytics.topAuctions.map((auction) => (
                        <tr key={auction.auctionId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {auction.vehicle.tractorBrand} {auction.vehicle.yearOfMfg}
                              </div>
                              <div className="text-sm text-gray-500">
                                {auction.vehicle.vehicleType.replace(/_/g, " ")} •{" "}
                                {auction.vehicle.state}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {auction.bidCount}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(auction.highestBid)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                auction.status === "ENDED"
                                  ? "bg-gray-100 text-gray-800"
                                  : auction.status === "LIVE"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {auction.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {auction.won ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                <Trophy className="w-3 h-3 mr-1" />
                                Won
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELLER ANALYTICS SECTION */}
        {sellerAnalytics && (
          <div>
            <div className="bg-white rounded-lg shadow-sm border-2 border-green-200 p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <Package className="w-6 h-6 mr-3 text-green-600" />
                Sell Analytics
              </h2>
              <p className="text-gray-600">
                Performance metrics and statistics about your selling activity
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(sellerAnalytics.overview.totalVehicles)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sold Vehicles</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(sellerAnalytics.overview.totalSoldVehicles)}
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <ShoppingCart className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(sellerAnalytics.overview.totalRevenue)}
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <DollarSign className="w-8 h-8 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {sellerAnalytics.overview.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Listings</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(sellerAnalytics.overview.activeListings)}
                    </p>
                  </div>
                  <div className="bg-orange-100 rounded-full p-3">
                    <Activity className="w-8 h-8 text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Sale Price</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(sellerAnalytics.overview.averageSalePrice)}
                    </p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {sellerAnalytics.overview.approvalRate.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <Award className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Auctions</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatNumber(sellerAnalytics.overview.totalAuctions)}
                    </p>
                  </div>
                  <div className="bg-primary-100 rounded-full p-3">
                    <Gavel className="w-8 h-8 text-primary-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue & Pricing */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Revenue & Pricing Statistics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(sellerAnalytics.overview.totalRevenue)}
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="text-sm text-gray-600">Average Sale Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(sellerAnalytics.overview.averageSalePrice)}
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="text-sm text-gray-600">Average Listing Price</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(sellerAnalytics.vehicles.averageListingPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Auction Statistics */}
            {sellerAnalytics.overview.totalAuctions > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Gavel className="w-5 h-5 mr-2" />
                  Auction Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Ended Auctions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sellerAnalytics.auctions.endedCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Live Auctions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sellerAnalytics.auctions.liveCount}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Bids per Auction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sellerAnalytics.auctions.averageBidsPerAuction.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Avg Final Bid</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(sellerAnalytics.auctions.averageFinalBid)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Time-based Statistics */}
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Activity Over Time
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Listings (Last 30 Days)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(sellerAnalytics.timeBased.last30Days)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Listings (Last 90 Days)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(sellerAnalytics.timeBased.last90Days)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Listings (Last Year)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(sellerAnalytics.timeBased.last1Year)}
                  </p>
                </div>
              </div>

              {/* Monthly Chart */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Monthly Listings & Sales (Last 12 Months)
                </h4>
                <div className="space-y-2">
                  {Object.keys(sellerAnalytics.timeBased.monthlyListings)
                    .sort()
                    .map((key) => {
                      const listings = sellerAnalytics.timeBased.monthlyListings[key];
                      const sales = sellerAnalytics.timeBased.monthlySales[key] || 0;
                      const maxListings = Math.max(
                        ...Object.values(sellerAnalytics.timeBased.monthlyListings),
                        1
                      );
                      const listingsWidth = (listings / maxListings) * 100;
                      const salesWidth = sales > 0 ? (sales / maxListings) * 100 : 0;

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-700 font-medium w-24">
                              {formatMonthLabel(key)}
                            </span>
                            <div className="flex-1 mx-4">
                              <div className="relative h-8 bg-gray-100 rounded overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-green-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                  style={{ width: `${listingsWidth}%` }}
                                >
                                  {listings > 0 && `${listings} listed`}
                                </div>
                                {sales > 0 && (
                                  <div
                                    className="absolute top-0 left-0 h-full bg-blue-500 flex items-center justify-end pr-2 text-white text-xs font-medium"
                                    style={{ width: `${salesWidth}%` }}
                                  >
                                    {sales > 0 && `${sales} sold`}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-gray-600 text-xs w-16 text-right">
                              {sales}/{listings}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Listings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-600">Sales</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* By Vehicle Type */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  By Vehicle Type
                </h4>
                <div className="space-y-3">
                  {Object.entries(sellerAnalytics.vehicles.byVehicleType)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([type, count]) => {
                      const total = sellerAnalytics.overview.totalVehicles;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={type}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">
                              {type.replace(/_/g, " ")}
                            </span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Brand */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  By Brand
                </h4>
                <div className="space-y-3">
                  {Object.entries(sellerAnalytics.vehicles.byBrand)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([brand, count]) => {
                      const total = sellerAnalytics.overview.totalVehicles;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={brand}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{brand}</span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By State */}
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  By State
                </h4>
                <div className="space-y-3">
                  {Object.entries(sellerAnalytics.vehicles.byState)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([state, count]) => {
                      const total = sellerAnalytics.overview.totalVehicles;
                      const percentage = (count / total) * 100;
                      return (
                        <div key={state}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">{state}</span>
                            <span className="text-sm text-gray-600">
                              {count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Top Vehicles */}
            {sellerAnalytics.topVehicles.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2" />
                  Top Performing Vehicles
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Vehicle
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Sale Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Sale Type
                        </th>
                        {sellerAnalytics.topVehicles.some((v) => v.hasAuction) && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Bids
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sellerAnalytics.topVehicles.map((vehicle) => (
                        <tr key={vehicle.vehicleId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {vehicle.tractorBrand} {vehicle.yearOfMfg}
                              </div>
                              <div className="text-sm text-gray-500">
                                {vehicle.vehicleType.replace(/_/g, " ")} • {vehicle.state}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(vehicle.salePrice)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                vehicle.status === "SOLD"
                                  ? "bg-green-100 text-green-800"
                                  : vehicle.status === "APPROVED" || vehicle.status === "AUCTION"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {vehicle.saleType.replace(/_/g, " ")}
                          </td>
                          {sellerAnalytics.topVehicles.some((v) => v.hasAuction) && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {vehicle.hasAuction ? vehicle.bidCount : "-"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
