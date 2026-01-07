"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Factory, LogOut, BarChart3, TrendingUp, MapPin, Building2, Calendar, DollarSign, Users, PieChart as PieChartIcon, Truck, Gavel } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function OEMDashboardPage() {
  const router = useRouter();
  const [oemInfo, setOemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "state" | "zone" | "dealer" | "brand" | "model" | "district" | "month" | "ta-contribution">("overview");
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    const oemId = localStorage.getItem("oemId");
    const oemName = localStorage.getItem("oemName");
    const oemPhone = localStorage.getItem("oemPhone");

    if (!oemId || !oemName || !oemPhone) {
      router.push("/oem/login");
      return;
    }

    setOemInfo({
      id: oemId,
      name: oemName,
      phone: oemPhone,
    });

    fetchAnalytics("overview");
    setLoading(false);
  }, [router]);

  const fetchAnalytics = async (viewType: string, filterValue?: string, month?: string) => {
    try {
      const params = new URLSearchParams({ viewType });
      if (filterValue) params.append("filterValue", filterValue);
      if (month) params.append("month", month);

      const response = await fetch(`/api/oem/analytics?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to fetch analytics" }));
        console.error("Analytics API error:", errorData);
        toast.error(errorData.message || "Failed to fetch analytics");
      }
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      toast.error(error.message || "Error loading analytics. Please check your connection.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("oemId");
    localStorage.removeItem("oemName");
    localStorage.removeItem("oemPhone");
    localStorage.removeItem("oemCompanyName");
    router.push("/oem/login");
  };

  useEffect(() => {
    if (activeTab) {
      fetchAnalytics(activeTab);
    }
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!analyticsData?.data || !Array.isArray(analyticsData.data)) return [];
    
    return analyticsData.data
      .map((item: any, index: number) => ({
        name: item.name || item.brand || `Item ${index + 1}`,
        value: item.totalCount || 0,
        estimatedValue: item.estimatedValue || 0,
        saleValue: item.saleValue || 0,
        auctionValue: item.auctionValue || 0,
      }))
      .filter((item: any) => item.value > 0)
      .slice(0, 10); // Limit to top 10 for readability
  };

  // Prepare bar chart data
  const getBarChartData = () => {
    if (!analyticsData?.data || !Array.isArray(analyticsData.data)) return [];
    
    return analyticsData.data
      .map((item: any, index: number) => ({
        name: (item.name || item.brand || `Item ${index + 1}`).substring(0, 15),
        Count: item.totalCount || 0,
        "Est. Value": Math.round((item.estimatedValue || 0) / 100000),
        "Sale Value": Math.round((item.saleValue || 0) / 100000),
        "Auction Value": Math.round((item.auctionValue || 0) / 100000),
      }))
      .filter((item: any) => item.Count > 0)
      .slice(0, 10);
  };

  // Calculate overview metrics
  const getOverviewMetrics = () => {
    if (analyticsData?.overview) {
      return {
        totalCount: analyticsData.overview.totalCount || 0,
        estimatedValue: analyticsData.overview.estimatedValue || 0,
        saleValue: analyticsData.overview.saleValue || 0,
        auctionValue: analyticsData.overview.auctionValue || 0,
        totalDealers: analyticsData.overview.totalDealers || 0,
        activeDealers: analyticsData.overview.activeDealers || 0,
      };
    }
    
    if (analyticsData?.data && Array.isArray(analyticsData.data)) {
      return {
        totalCount: analyticsData.data.reduce((sum: number, item: any) => sum + (item.totalCount || 0), 0),
        estimatedValue: analyticsData.data.reduce((sum: number, item: any) => sum + (item.estimatedValue || 0), 0),
        saleValue: analyticsData.data.reduce((sum: number, item: any) => sum + (item.saleValue || 0), 0),
        auctionValue: analyticsData.data.reduce((sum: number, item: any) => sum + (item.auctionValue || 0), 0),
        totalDealers: 0,
        activeDealers: 0,
      };
    }
    
    return {
      totalCount: 0,
      estimatedValue: 0,
      saleValue: 0,
      auctionValue: 0,
      totalDealers: 0,
      activeDealers: 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const metrics = getOverviewMetrics();
  const pieData = getPieChartData();
  const barData = getBarChartData();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Factory className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">OEM Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {oemInfo?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex flex-wrap gap-1 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "overview"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("state")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "state"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            State Wise
          </button>
          <button
            onClick={() => setActiveTab("zone")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "zone"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Zone Wise
          </button>
          <button
            onClick={() => setActiveTab("dealer")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "dealer"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Dealer Wise
          </button>
          <button
            onClick={() => setActiveTab("brand")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "brand"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Brand Wise
          </button>
          <button
            onClick={() => setActiveTab("model")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "model"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Model Wise
          </button>
          <button
            onClick={() => setActiveTab("district")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "district"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            District Wise
          </button>
          <button
            onClick={() => setActiveTab("month")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "month"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Month Wise
          </button>
          <button
            onClick={() => setActiveTab("ta-contribution")}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
              activeTab === "ta-contribution"
                ? "bg-primary-600 text-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            TA Contribution
          </button>
        </div>

        {/* Analytics Content */}
        <div className="space-y-6">
          {/* Overview Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm font-medium">Total Vehicles</p>
                <Truck className="w-6 h-6 text-blue-200" />
              </div>
              <p className="text-3xl font-bold">{formatNumber(metrics.totalCount)}</p>
              <p className="text-blue-100 text-xs mt-1">Dealer Stock</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm font-medium">Estimated Value</p>
                <TrendingUp className="w-6 h-6 text-green-200" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.estimatedValue)}</p>
              <p className="text-green-100 text-xs mt-1">Total Stock Value</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100 text-sm font-medium">Sale Value</p>
                <DollarSign className="w-6 h-6 text-purple-200" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.saleValue)}</p>
              <p className="text-purple-100 text-xs mt-1">
                {metrics.estimatedValue > 0 
                  ? `${((metrics.saleValue / metrics.estimatedValue) * 100).toFixed(1)}% Conversion`
                  : "No sales"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-orange-100 text-sm font-medium">Auction Value</p>
                <Gavel className="w-6 h-6 text-orange-200" />
              </div>
              <p className="text-3xl font-bold">{formatCurrency(metrics.auctionValue)}</p>
              <p className="text-orange-100 text-xs mt-1">
                {metrics.estimatedValue > 0 
                  ? `${((metrics.auctionValue / metrics.estimatedValue) * 100).toFixed(1)}% via Auction`
                  : "No auctions"}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          {analyticsData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Distribution by Count */}
              {pieData.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <PieChartIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Distribution by Count
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Pie Chart - Distribution by Value */}
              {pieData.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <PieChartIcon className="w-5 h-5 mr-2 text-primary-600" />
                    Distribution by Estimated Value
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="estimatedValue"
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Bar Chart - Comparison */}
              {barData.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
                    Performance Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Count" fill="#0088FE" name="Vehicle Count" />
                      <Bar dataKey="Est. Value" fill="#00C49F" name="Est. Value (Lakhs)" />
                      <Bar dataKey="Sale Value" fill="#FFBB28" name="Sale Value (Lakhs)" />
                      <Bar dataKey="Auction Value" fill="#FF8042" name="Auction Value (Lakhs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Detailed Data Table */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace("-", " ")} Analytics
            </h2>
            
            {analyticsData?.data && analyticsData.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auction %</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.data.map((item: any, index: number) => {
                      const salePercentage = item.estimatedValue > 0 
                        ? ((item.saleValue / item.estimatedValue) * 100).toFixed(2) 
                        : "0.00";
                      const auctionPercentage = item.estimatedValue > 0 
                        ? ((item.auctionValue / item.estimatedValue) * 100).toFixed(2) 
                        : "0.00";
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100">
                                <span className="text-primary-600 font-semibold text-sm">
                                  {(item.name || item.brand || item.id || "N/A").charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {item.name || item.brand || item.id || "N/A"}
                                </div>
                                {item.state && (
                                  <div className="text-sm text-gray-500">{item.state}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {formatNumber(item.totalCount || 0)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(item.estimatedValue || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                            {formatCurrency(item.saleValue || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-orange-600">
                            {formatCurrency(item.auctionValue || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(parseFloat(salePercentage), 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{salePercentage}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${Math.min(parseFloat(auctionPercentage), 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{auctionPercentage}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : analyticsData?.overview ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Overview Analytics</p>
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-600">Total Dealers</p>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalDealers}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-600">Active Dealers</p>
                      <p className="text-2xl font-bold text-green-600">{metrics.activeDealers}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-600">Total Vehicles</p>
                      <p className="text-2xl font-bold text-blue-600">{formatNumber(metrics.totalCount)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow">
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.estimatedValue)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
