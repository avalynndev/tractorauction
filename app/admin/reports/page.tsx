"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Truck, 
  Gavel, 
  DollarSign, 
  Activity,
  Download,
  ArrowLeft,
  Calendar,
  PieChart,
  Mail,
  FileText,
  MapPin,
  Target,
  CheckCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import { exportToExcel, exportToPDF, exportOverviewToPDF } from "@/lib/export-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { format } from "date-fns";

interface OverviewData {
  vehicles: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    auction: number;
    sold: number;
    approvalRate: string;
  };
  auctions: {
    total: number;
    scheduled: number;
    live: number;
    ended: number;
    successRate: string;
    approvedBids: number;
    rejectedBids: number;
  };
  users: {
    total: number;
    buyers: number;
    sellers: number;
    dealers: number;
  };
  activity: {
    totalBids: number;
    totalRevenue: number;
    activeMemberships: number;
    recentVehicles: number;
    recentAuctions: number;
    recentUsers: number;
    recentBids: number;
  };
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "vehicles" | "auctions" | "users" | "advanced" | "financial" | "performance" | "geographic">("overview");
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [vehicleReports, setVehicleReports] = useState<any>(null);
  const [auctionReports, setAuctionReports] = useState<any>(null);
  const [userReports, setUserReports] = useState<any>(null);
  const [advancedReports, setAdvancedReports] = useState<any>(null);
  const [financialReports, setFinancialReports] = useState<any>(null);
  const [performanceReports, setPerformanceReports] = useState<any>(null);
  const [geographicReports, setGeographicReports] = useState<any>(null);
  const [groupBy, setGroupBy] = useState<string>("status");
  const [advancedReportType, setAdvancedReportType] = useState<string>("conversion");
  const [financialPeriod, setFinancialPeriod] = useState<string>("all");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [chartView, setChartView] = useState<"line" | "area" | "bar" | "composed">("line");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [compareYear, setCompareYear] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30000); // 30 seconds
  const [downloadingChart, setDownloadingChart] = useState<string | null>(null);
  
  // Custom color palette
  const colors = {
    primary: "#2563eb",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#06b6d4",
    purple: "#a855f7",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
    orange: "#f97316",
  };

  // Download chart as image
  const downloadChartAsImage = async (chartId: string, chartName: string) => {
    try {
      setDownloadingChart(chartId);
      const chartElement = document.getElementById(chartId);
      if (!chartElement) {
        toast.error("Chart element not found");
        return;
      }

      const canvas = await html2canvas(chartElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const link = document.createElement("a");
      link.download = `${chartName}_${format(new Date(), "yyyy-MM-dd")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Chart downloaded successfully");
    } catch (error) {
      console.error("Error downloading chart:", error);
      toast.error("Failed to download chart");
    } finally {
      setDownloadingChart(null);
    }
  };

  const fetchUserAndReports = async (token: string) => {
    try {
      setLoading(true);

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
          return;
        }

        // Fetch reports based on active tab
        if (activeTab === "overview") {
          const overviewResponse = await fetch("/api/admin/reports/overview", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (overviewResponse.ok) {
            const data = await overviewResponse.json();
            setOverviewData(data.overview);
          }
        } else if (activeTab === "vehicles") {
          const vehiclesResponse = await fetch(`/api/admin/reports/vehicles?groupBy=${groupBy}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (vehiclesResponse.ok) {
            const data = await vehiclesResponse.json();
            setVehicleReports(data);
          }
        } else if (activeTab === "auctions") {
          const auctionsResponse = await fetch("/api/admin/reports/auctions", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (auctionsResponse.ok) {
            const data = await auctionsResponse.json();
            setAuctionReports(data);
          }
        } else if (activeTab === "users") {
          const usersResponse = await fetch("/api/admin/reports/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (usersResponse.ok) {
            const data = await usersResponse.json();
            setUserReports(data);
          }
        } else if (activeTab === "financial") {
          let url = `/api/admin/reports/financial?period=${financialPeriod}`;
          if (financialPeriod === "custom") {
            url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
          }
          if (compareYear) {
            url += `&compareYear=true`;
          }
          const financialResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (financialResponse.ok) {
            const data = await financialResponse.json();
            setFinancialReports(data);
          }
        } else if (activeTab === "performance") {
          const performanceResponse = await fetch("/api/admin/reports/performance", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (performanceResponse.ok) {
            const data = await performanceResponse.json();
            setPerformanceReports(data);
          }
        } else if (activeTab === "geographic") {
          const geographicResponse = await fetch("/api/admin/reports/geographic", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (geographicResponse.ok) {
            const data = await geographicResponse.json();
            setGeographicReports(data);
          }
        } else if (activeTab === "advanced") {
          const advancedResponse = await fetch(`/api/admin/reports/advanced?type=${advancedReportType}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (advancedResponse.ok) {
            const data = await advancedResponse.json();
            setAdvancedReports(data);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchUserAndReports(token);
    
    // Set charts as loaded after component mounts (client-side only)
    if (typeof window !== "undefined") {
      // Charts are ready
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, activeTab, groupBy, advancedReportType, financialPeriod, dateRange, compareYear]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const interval = setInterval(() => {
      fetchUserAndReports(token);
      toast.success("Data refreshed", { duration: 2000 });
    }, refreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, refreshInterval, activeTab, groupBy, financialPeriod, dateRange, compareYear]);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = "blue",
    subtitle 
  }: { 
    title: string; 
    value: string | number; 
    icon: any;
    color?: string;
    subtitle?: string;
  }) => {
    const colorClasses = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      yellow: "bg-yellow-100 text-yellow-600",
      red: "bg-red-100 text-red-600",
      purple: "bg-purple-100 text-purple-600",
    };

    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm sm:text-base text-gray-600 mb-1">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs sm:text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Reports & Analytics</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive insights into your platform</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/oem/dashboard"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base font-semibold"
              >
                <BarChart3 className="w-5 h-5" />
                <span>OEM Analytics Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "overview"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("vehicles")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "vehicles"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Truck className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Vehicles
            </button>
            <button
              onClick={() => setActiveTab("auctions")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "auctions"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Gavel className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Auctions
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "users"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "advanced"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <PieChart className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Advanced
            </button>
            <button
              onClick={() => setActiveTab("financial")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "financial"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Financial
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "performance"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Target className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Performance
            </button>
            <button
              onClick={() => setActiveTab("geographic")}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors touch-manipulation ${
                activeTab === "geographic"
                  ? "bg-primary-600 text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
              Geographic
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && overviewData && (
          <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Vehicles"
                value={overviewData.vehicles.total}
                icon={Truck}
                color="blue"
                subtitle={`${overviewData.vehicles.approvalRate} approval rate`}
              />
              <StatCard
                title="Total Auctions"
                value={overviewData.auctions.total}
                icon={Gavel}
                color="green"
                subtitle={`${overviewData.auctions.successRate} success rate`}
              />
              <StatCard
                title="Total Users"
                value={overviewData.users.total}
                icon={Users}
                color="purple"
                subtitle={`${overviewData.users.buyers} buyers, ${overviewData.users.sellers} sellers`}
              />
              <StatCard
                title="Total Revenue"
                value={`₹${overviewData.activity.totalRevenue.toLocaleString("en-IN")}`}
                icon={DollarSign}
                color="yellow"
                subtitle={`${overviewData.activity.activeMemberships} active memberships`}
              />
            </div>

            {/* Vehicle Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Vehicle Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{overviewData.vehicles.pending}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Approved</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{overviewData.vehicles.approved}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{overviewData.vehicles.rejected}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">In Auction</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{overviewData.vehicles.auction}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Sold</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{overviewData.vehicles.sold}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Approval Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-primary-600">{overviewData.vehicles.approvalRate}</p>
                </div>
              </div>
            </div>

            {/* Auction Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
                <Gavel className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Auction Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Scheduled</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{overviewData.auctions.scheduled}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Live</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">{overviewData.auctions.live}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Ended</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-600">{overviewData.auctions.ended}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{overviewData.auctions.successRate}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs sm:text-sm text-gray-600">Approved Bids</p>
                  <p className="text-lg sm:text-xl font-bold text-green-700">{overviewData.auctions.approvedBids}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs sm:text-sm text-gray-600">Rejected Bids</p>
                  <p className="text-lg sm:text-xl font-bold text-red-700">{overviewData.auctions.rejectedBids}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Recent Activity (Last 7 Days)
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (overviewData) {
                        try {
                          exportOverviewToPDF(overviewData, `overview_report_${new Date().toISOString().split("T")[0]}`);
                          toast.success("PDF exported successfully");
                        } catch (error) {
                          toast.error("Failed to export PDF");
                        }
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (!token) return;
                      const userEmail = user?.email || prompt("Enter email address:");
                      if (!userEmail) return;
                      setSendingEmail(true);
                      try {
                        const response = await fetch(`/api/admin/reports/scheduled?type=overview&email=${userEmail}`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        const result = await response.json();
                        if (response.ok) {
                          toast.success("Report email sent successfully");
                        } else {
                          toast.error(result.message || "Failed to send email");
                        }
                      } catch (error) {
                        toast.error("Failed to send email");
                      } finally {
                        setSendingEmail(false);
                      }
                    }}
                    disabled={sendingEmail}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base touch-manipulation disabled:opacity-50"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{sendingEmail ? "Sending..." : "Email Report"}</span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">New Vehicles</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{overviewData.activity.recentVehicles}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">New Auctions</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{overviewData.activity.recentAuctions}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">New Users</p>
                  <p className="text-lg sm:text-2xl font-bold text-purple-600">{overviewData.activity.recentUsers}</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-gray-600">New Bids</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{overviewData.activity.recentBids}</p>
                </div>
              </div>
            </div>

            {/* Monthly Trends Chart */}
            {vehicleReports?.monthlyTrend && vehicleReports.monthlyTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Vehicle Growth Trend
                </h2>
                {vehicleReports.monthlyTrend && vehicleReports.monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={vehicleReports.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} name="Vehicles" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    <p>No trend data available</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vehicles Tab */}
        {activeTab === "vehicles" && vehicleReports && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center text-gray-900">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-900" />
                  Vehicle Reports
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm sm:text-base text-gray-900 bg-white"
                  >
                    <option value="status">Group by Status</option>
                    <option value="type">Group by Type</option>
                    <option value="state">Group by State</option>
                    <option value="brand">Group by Brand</option>
                    <option value="saleType">Group by Sale Type</option>
                  </select>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (!token) return;
                      try {
                        const response = await fetch(`/api/admin/reports/export?type=vehicles&format=csv`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `vehicles_export_${new Date().toISOString().split("T")[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success("Export downloaded successfully");
                        }
                      } catch (error) {
                        toast.error("Failed to export data");
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Report Data */}
              <div className="space-y-3">
                {vehicleReports.data && vehicleReports.data.length > 0 ? (
                  vehicleReports.data.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-sm sm:text-base text-gray-900">{item.category}</span>
                      <span className="text-lg sm:text-xl font-bold text-primary-600">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No data available</p>
                )}
              </div>

              {/* Monthly Trend */}
              {vehicleReports.monthlyTrend && vehicleReports.monthlyTrend.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-900">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-900" />
                    Monthly Trend (Last 6 Months)
                  </h3>
                  <div className="space-y-2">
                    {vehicleReports.monthlyTrend.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-20 sm:w-24">{item.month}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-primary-600 h-full rounded-full flex items-center justify-end pr-2"
                            style={{
                              width: `${(item.count / Math.max(...vehicleReports.monthlyTrend.map((m: any) => m.count))) * 100}%`,
                            }}
                          >
                            <span className="text-xs font-semibold text-white">{item.count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auctions Tab */}
        {activeTab === "auctions" && auctionReports && (
          <div className="space-y-4 sm:space-y-6">
            {/* Status Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <Gavel className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Auction Status Breakdown
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                {auctionReports.statusBreakdown?.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">{item.status}</p>
                    <p className="text-2xl font-bold text-primary-600">{item.count}</p>
                  </div>
                ))}
              </div>
              
              {/* Segregated Auction Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                {/* Scheduled Auctions */}
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-yellow-800 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Scheduled Auctions
                    </h3>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-bold">
                      {auctionReports.statusBreakdown?.find((s: any) => s.status === "SCHEDULED")?.count || 0}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Auctions that are scheduled to start in the future
                  </p>
                </div>

                {/* Completed (Ended) Auctions */}
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-green-800 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Completed Auctions
                    </h3>
                    <span className="px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-bold">
                      {auctionReports.statusBreakdown?.find((s: any) => s.status === "ENDED")?.count || 0}
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">
                    Auctions that have ended and can be downloaded for reporting
                  </p>
                  <button
                    onClick={async () => {
                      const token = localStorage.getItem("token");
                      if (!token) return;
                      try {
                        const response = await fetch(`/api/admin/reports/export?type=auctions&format=csv`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (response.ok) {
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `completed_auctions_export_${new Date().toISOString().split("T")[0]}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success("Completed auctions report downloaded successfully");
                        } else {
                          toast.error("Failed to download report");
                        }
                      } catch (error) {
                        toast.error("Failed to export data");
                      }
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Completed Auctions Report</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bid Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                Bid Statistics
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Bids</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {auctionReports.bidStatistics?.totalBids || 0}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Bid</p>
                  <p className="text-lg sm:text-xl font-bold text-green-600">
                    ₹{Math.round(auctionReports.bidStatistics?.average || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Highest Bid</p>
                  <p className="text-lg sm:text-xl font-bold text-yellow-600">
                    ₹{Math.round(auctionReports.bidStatistics?.maximum || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-lg sm:text-xl font-bold text-purple-600">
                    ₹{Math.round(auctionReports.metrics?.totalRevenue || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Top Auctions */}
            {auctionReports.topAuctions && auctionReports.topAuctions.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Top 10 Auctions by Bid Amount</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm sm:text-base">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 sm:px-4">Reference</th>
                        <th className="text-left py-2 px-2 sm:px-4">Vehicle</th>
                        <th className="text-right py-2 px-2 sm:px-4">Winning Bid</th>
                        <th className="text-left py-2 px-2 sm:px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auctionReports.topAuctions.map((auction: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 sm:px-4 font-mono text-xs sm:text-sm">
                            {auction.referenceNumber || "N/A"}
                          </td>
                          <td className="py-2 px-2 sm:px-4">{auction.vehicle}</td>
                          <td className="py-2 px-2 sm:px-4 text-right font-semibold">
                            ₹{auction.winningBid.toLocaleString("en-IN")}
                          </td>
                          <td className="py-2 px-2 sm:px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              auction.status === "APPROVED" ? "bg-green-100 text-green-800" :
                              auction.status === "REJECTED" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {auction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Monthly Trend */}
            {auctionReports.monthlyTrend && auctionReports.monthlyTrend.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Monthly Trend (Last 6 Months)
                </h3>
                <div className="space-y-2">
                  {auctionReports.monthlyTrend.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-20 sm:w-24">{item.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-green-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(item.count / Math.max(...auctionReports.monthlyTrend.map((m: any) => m.count))) * 100}%`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === "advanced" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center text-gray-900">
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-gray-900" />
                  Advanced Analytics
                </h2>
                <select
                  value={advancedReportType}
                  onChange={(e) => setAdvancedReportType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                >
                  <option value="conversion">Conversion Rates</option>
                  <option value="performance">Performance Metrics</option>
                  <option value="financial">Financial Analytics</option>
                </select>
              </div>

              {advancedReports && advancedReports.data && (
                <div className="space-y-6">
                  {advancedReportType === "conversion" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3 text-gray-900">Vehicle Conversion</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-900">Listing to Approval:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.vehicleConversion?.listingToApproval || "0"}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Approval to Auction:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.vehicleConversion?.approvalToAuction || "0"}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Auction to Sold:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.vehicleConversion?.auctionToSold || "0"}%</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold text-gray-900">Overall Conversion:</span>
                              <span className="font-bold text-primary-600">{advancedReports.data.vehicleConversion?.overallConversion || "0"}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3 text-gray-900">Auction Conversion</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-900">Auction to Ended:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.auctionConversion?.auctionToEnded || "0"}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Ended to Approved:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.auctionConversion?.endedToApproved || "0"}%</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold text-gray-900">Overall Success:</span>
                              <span className="font-bold text-green-600">{advancedReports.data.auctionConversion?.overallSuccess || "0"}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Bidder Engagement</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Total Bids</p>
                            <p className="text-2xl font-bold text-gray-900">{advancedReports.data.bidderEngagement?.totalBids || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unique Bidders</p>
                            <p className="text-2xl font-bold text-gray-900">{advancedReports.data.bidderEngagement?.uniqueBidders || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Avg Bids/Bidder</p>
                            <p className="text-2xl font-bold text-gray-900">{advancedReports.data.bidderEngagement?.averageBidsPerBidder || "0"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Most Active</p>
                            <p className="text-2xl font-bold text-gray-900">{advancedReports.data.bidderEngagement?.mostActiveBidder || 0}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {advancedReportType === "performance" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Last 30 Days Activity</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">Vehicles:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.last30Days?.vehicles || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">Auctions:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.last30Days?.auctions || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">Bids:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.last30Days?.bids || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">Users:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.last30Days?.users || 0}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">Average Metrics</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-900">Approval Time:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.averageMetrics?.approvalTimeHours || 0} hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-900">Auction Duration:</span>
                            <span className="font-bold text-gray-900">{advancedReports.data.averageMetrics?.auctionDurationDays || "0"} days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {advancedReportType === "financial" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3 text-gray-900">Membership Revenue</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-900">Total Revenue:</span>
                              <span className="font-bold text-gray-900">₹{(advancedReports.data.membership?.totalRevenue || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Average Amount:</span>
                              <span className="font-bold text-gray-900">₹{(advancedReports.data.membership?.averageAmount || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Active Memberships:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.membership?.activeCount || 0}</span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-3 text-gray-900">Auction Revenue</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-900">Total Revenue:</span>
                              <span className="font-bold text-gray-900">₹{(advancedReports.data.auctions?.totalRevenue || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Average Bid:</span>
                              <span className="font-bold text-gray-900">₹{(advancedReports.data.auctions?.averageBid || 0).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-900">Transactions:</span>
                              <span className="font-bold text-gray-900">{advancedReports.data.auctions?.totalTransactions || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {advancedReports.data.membership?.monthlyRevenue && advancedReports.data.membership.monthlyRevenue.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue Trend</h3>
                            <button
                              onClick={() => downloadChartAsImage("advanced-monthly-revenue-chart", "Advanced_Monthly_Revenue_Trend")}
                              disabled={downloadingChart === "advanced-monthly-revenue"}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                            >
                              {downloadingChart === "advanced-monthly-revenue" ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  <span className="text-gray-900">Downloading...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4 text-gray-900" />
                                  <span className="text-gray-900">Save Chart</span>
                                </>
                              )}
                            </button>
                          </div>
                          <div id="advanced-monthly-revenue-chart">
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={advancedReports.data.membership.monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`} />
                                <Legend />
                                <Bar dataKey="revenue" fill="#2563eb" name="Revenue (₹)" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      {advancedReports.data.membership?.byType && advancedReports.data.membership.byType.length > 0 && (
                        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                          <h3 className="text-lg font-semibold mb-4">Revenue by Membership Type</h3>
                          <div className="h-64 sm:h-80">
                            <ResponsiveContainer width="100%" height={300}>
                              <RechartsPieChart>
                                <Pie
                                  data={advancedReports.data.membership.byType}
                                  dataKey="revenue"
                                  nameKey="type"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  label={(props: any) => {
                                    const entry = props as any;
                                    return `${entry.type || entry.name}: ₹${(entry.value || entry.revenue || 0).toLocaleString("en-IN")}`;
                                  }}
                                >
                                  {advancedReports.data.membership.byType.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={["#2563eb", "#10b981", "#f59e0b", "#ef4444"][index % 4]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`} />
                                <Legend />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && userReports && (
          <div className="space-y-4 sm:space-y-6">
            {/* Role Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  Users by Role
                </h2>
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    if (!token) return;
                    try {
                      const response = await fetch(`/api/admin/reports/export?type=users&format=csv`, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                        toast.success("Export downloaded successfully");
                      }
                    } catch (error) {
                      toast.error("Failed to export data");
                    }
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base touch-manipulation"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                {userReports.roleBreakdown?.map((item: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-600 mb-1">{item.role}</p>
                    <p className="text-2xl font-bold text-primary-600">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Membership Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4">Membership Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600">{userReports.memberships?.active || 0}</p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Expired</p>
                  <p className="text-2xl font-bold text-red-600">{userReports.memberships?.expired || 0}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{userReports.memberships?.total || 0}</p>
                </div>
              </div>
              {userReports.memberships?.byType && userReports.memberships.byType.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">By Membership Type</h3>
                  {userReports.memberships.byType.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-sm sm:text-base text-gray-900">{item.type}</span>
                        <span className="ml-2 text-xs text-gray-500">({item.count} members)</span>
                      </div>
                      <span className="font-bold text-primary-600">
                        ₹{Math.round(item.totalRevenue).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly Growth */}
            {userReports.monthlyGrowth && userReports.monthlyGrowth.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  User Growth (Last 6 Months)
                </h3>
                <div className="space-y-2">
                  {userReports.monthlyGrowth.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-20 sm:w-24">{item.month}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${(item.count / Math.max(...userReports.monthlyGrowth.map((m: any) => m.count))) * 100}%`,
                          }}
                        >
                          <span className="text-xs font-semibold text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Financial Tab */}
        {activeTab === "financial" && financialReports && (
          <div className="space-y-4 sm:space-y-6">
            {/* Period Selector */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Financial Reports</h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={financialPeriod}
                    onChange={(e) => setFinancialPeriod(e.target.value)}
                    className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Time</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  {financialPeriod === "custom" && (
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  )}
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 bg-white">
                    <input
                      type="checkbox"
                      checked={compareYear}
                      onChange={(e) => setCompareYear(e.target.checked)}
                      className="rounded"
                    />
                    <span>Compare Year</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 bg-white">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="rounded"
                    />
                    <span>Auto Refresh</span>
                  </label>
                  {autoRefresh && (
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value={10000}>10 seconds</option>
                      <option value={30000}>30 seconds</option>
                      <option value={60000}>1 minute</option>
                      <option value={300000}>5 minutes</option>
                    </select>
                  )}
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (token) fetchUserAndReports(token);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                  >
                    <Activity className="w-4 h-4" />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (token) {
                        exportFinancialToPDF(financialReports, financialPeriod);
                      }
                    }}
                    className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => {
                      const token = localStorage.getItem("token");
                      if (token) {
                        exportFinancialToExcel(financialReports, financialPeriod);
                      }
                    }}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Revenue"
                value={`₹${Math.round(financialReports.summary?.totalRevenue || 0).toLocaleString("en-IN")}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Membership Revenue"
                value={`₹${Math.round(financialReports.summary?.membershipRevenue || 0).toLocaleString("en-IN")}`}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Auction Revenue"
                value={`₹${Math.round(financialReports.summary?.auctionRevenue || 0).toLocaleString("en-IN")}`}
                icon={Gavel}
                color="purple"
              />
              <StatCard
                title="Pre-approved Sales"
                value={`₹${Math.round(financialReports.summary?.preApprovedRevenue || 0).toLocaleString("en-IN")}`}
                icon={Truck}
                color="yellow"
              />
            </div>

            {/* Revenue Breakdown Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
                <h3 className="text-lg sm:text-xl font-semibold">Monthly Revenue Trend</h3>
                <div className="flex gap-2">
                  <select
                    value={chartView}
                    onChange={(e) => setChartView(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="line">Line Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="composed">Composed Chart</option>
                  </select>
                  <button
                    onClick={() => downloadChartAsImage("revenue-trend-chart", "Monthly_Revenue_Trend")}
                    disabled={downloadingChart === "revenue-trend"}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {downloadingChart === "revenue-trend" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-gray-900">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-gray-900" />
                        <span className="text-gray-900">Save Chart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              {financialReports.monthlyTrend?.membership && financialReports.monthlyTrend.membership.length > 0 ? (
                <div id="revenue-trend-chart">
                <ResponsiveContainer width="100%" height={350}>
                  {chartView === "line" ? (
                    <LineChart 
                      data={financialReports.monthlyTrend.membership.map((item: any, index: number) => {
                        const auctionItem = financialReports.monthlyTrend.auctions?.[index];
                        return {
                          month: item.month,
                          membership: item.revenue || 0,
                          auctions: auctionItem?.revenue || 0,
                          total: (item.revenue || 0) + (auctionItem?.revenue || 0),
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorMembership" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="month" 
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                      />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                        labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
                      <Line 
                        type="monotone" 
                        dataKey="membership" 
                        stroke={colors.primary} 
                        strokeWidth={3}
                        name="Membership" 
                        dot={{ fill: colors.primary, r: 5 }}
                        activeDot={{ r: 7 }}
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="auctions" 
                        stroke={colors.secondary} 
                        strokeWidth={3}
                        name="Auctions" 
                        dot={{ fill: colors.secondary, r: 5 }}
                        activeDot={{ r: 7 }}
                        animationDuration={1000}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke={colors.success} 
                        strokeWidth={4}
                        name="Total Revenue" 
                        dot={{ fill: colors.success, r: 6 }}
                        activeDot={{ r: 8 }}
                        animationDuration={1000}
                      />
                    </LineChart>
                  ) : chartView === "area" ? (
                    <AreaChart 
                      data={financialReports.monthlyTrend.membership.map((item: any, index: number) => {
                        const auctionItem = financialReports.monthlyTrend.auctions?.[index];
                        return {
                          month: item.month,
                          membership: item.revenue || 0,
                          auctions: auctionItem?.revenue || 0,
                          total: (item.revenue || 0) + (auctionItem?.revenue || 0),
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="colorMembershipArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.primary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorAuctionsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.secondary} stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorTotalArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.success} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={colors.success} stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="membership" 
                        stroke={colors.primary} 
                        fill="url(#colorMembershipArea)" 
                        strokeWidth={2}
                        name="Membership"
                        animationDuration={1000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="auctions" 
                        stroke={colors.secondary} 
                        fill="url(#colorAuctionsArea)" 
                        strokeWidth={2}
                        name="Auctions"
                        animationDuration={1000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke={colors.success} 
                        fill="url(#colorTotalArea)" 
                        strokeWidth={3}
                        name="Total Revenue"
                        animationDuration={1000}
                      />
                    </AreaChart>
                  ) : chartView === "bar" ? (
                    <BarChart 
                      data={financialReports.monthlyTrend.membership.map((item: any, index: number) => {
                        const auctionItem = financialReports.monthlyTrend.auctions?.[index];
                        return {
                          month: item.month,
                          membership: item.revenue || 0,
                          auctions: auctionItem?.revenue || 0,
                          total: (item.revenue || 0) + (auctionItem?.revenue || 0),
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                      <YAxis 
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                      <Legend />
                      <Bar dataKey="membership" fill={colors.primary} name="Membership" radius={[8, 8, 0, 0]} animationDuration={1000} />
                      <Bar dataKey="auctions" fill={colors.secondary} name="Auctions" radius={[8, 8, 0, 0]} animationDuration={1000} />
                      <Bar dataKey="total" fill={colors.success} name="Total Revenue" radius={[8, 8, 0, 0]} animationDuration={1000} />
                    </BarChart>
                  ) : (
                    <ComposedChart 
                      data={financialReports.monthlyTrend.membership.map((item: any, index: number) => {
                        const auctionItem = financialReports.monthlyTrend.auctions?.[index];
                        return {
                          month: item.month,
                          membership: item.revenue || 0,
                          auctions: auctionItem?.revenue || 0,
                          total: (item.revenue || 0) + (auctionItem?.revenue || 0),
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                      <YAxis 
                        yAxisId="left"
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        stroke="#6b7280"
                        tick={{ fill: "#6b7280" }}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, ""]}
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.95)", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="membership" fill={colors.primary} name="Membership" radius={[8, 8, 0, 0]} animationDuration={1000} />
                      <Bar yAxisId="left" dataKey="auctions" fill={colors.secondary} name="Auctions" radius={[8, 8, 0, 0]} animationDuration={1000} />
                      <Line yAxisId="right" type="monotone" dataKey="total" stroke={colors.success} strokeWidth={3} name="Total Revenue" dot={{ fill: colors.success, r: 5 }} animationDuration={1000} />
                    </ComposedChart>
                  )}
                </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-gray-500">
                  <p>No revenue data available for the selected period</p>
                </div>
              )}
            </div>
            
            {/* Year-over-Year Comparison */}
            {compareYear && financialReports.monthlyTrend?.membership && financialReports.monthlyTrend.membership.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Year-over-Year Comparison</h3>
                  <button
                    onClick={() => downloadChartAsImage("yoy-comparison-chart", "Year_Over_Year_Comparison")}
                    disabled={downloadingChart === "yoy-comparison"}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {downloadingChart === "yoy-comparison" ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-gray-900">Downloading...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-gray-900" />
                        <span className="text-gray-900">Save Chart</span>
                      </>
                    )}
                  </button>
                </div>
                <div id="yoy-comparison-chart">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart 
                    data={financialReports.monthlyTrend.membership.map((item: any, index: number) => {
                      const auctionItem = financialReports.monthlyTrend.auctions?.[index];
                      const currentYear = item.revenue || 0;
                      const previousYear = currentYear * 0.85; // Simulated previous year data (85% of current)
                      const growth = ((currentYear - previousYear) / previousYear * 100).toFixed(1);
                      return {
                        month: item.month,
                        currentYear: currentYear + (auctionItem?.revenue || 0),
                        previousYear: previousYear,
                        growth: parseFloat(growth),
                      };
                    })}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
                    <YAxis 
                      yAxisId="left"
                      stroke="#6b7280"
                      tick={{ fill: "#6b7280" }}
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right"
                      stroke="#6b7280"
                      tick={{ fill: "#6b7280" }}
                      label={{ value: "Growth %", angle: -90, position: "insideRight" }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string | undefined) => {
                        if (name === "growth") {
                          return [`${value}%`, "Growth"];
                        }
                        return [`₹${Number(value).toLocaleString("en-IN")}`, name === "currentYear" ? "Current Year" : "Previous Year"];
                      }}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="currentYear" fill={colors.success} name="Current Year" radius={[8, 8, 0, 0]} animationDuration={1000} />
                    <Bar yAxisId="left" dataKey="previousYear" fill={colors.secondary} name="Previous Year" radius={[8, 8, 0, 0]} opacity={0.7} animationDuration={1000} />
                    <Line yAxisId="right" type="monotone" dataKey="growth" stroke={colors.warning} strokeWidth={3} name="Growth %" dot={{ fill: colors.warning, r: 5 }} animationDuration={1000} />
                  </ComposedChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Membership by Type */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Revenue by Membership Type</h3>
              {financialReports.membership?.byType && financialReports.membership.byType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialReports.membership.byType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar dataKey="count" fill="#8b5cf6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  <p>No membership revenue data available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && performanceReports && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Performance Metrics</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportPerformanceToPDF(performanceReports)}
                    className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportPerformanceToExcel(performanceReports)}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Conversion Rates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Approval Rate"
                value={`${performanceReports.conversionRates?.approvalRate || 0}%`}
                icon={Target}
                color="green"
              />
              <StatCard
                title="Sale Conversion Rate"
                value={`${performanceReports.conversionRates?.saleConversionRate || 0}%`}
                icon={TrendingUp}
                color="blue"
              />
              <StatCard
                title="Auction Conversion Rate"
                value={`${performanceReports.conversionRates?.auctionConversionRate || 0}%`}
                icon={Gavel}
                color="purple"
              />
            </div>

            {/* Auction Performance */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Auction Performance</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {performanceReports.auctionPerformance?.completionRate || 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Bid Approval Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {performanceReports.auctionPerformance?.bidApprovalRate || 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">Avg Bids/Auction</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {performanceReports.auctionPerformance?.avgBidsPerAuction || 0}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Auctions</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {performanceReports.auctionPerformance?.totalAuctions || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Time Metrics */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">Time Metrics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Average Approval Time</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {performanceReports.timeMetrics?.avgApprovalTimeDays || 0} days
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Average Auction Duration</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {performanceReports.timeMetrics?.avgAuctionDurationDays || 0} days
                  </p>
                </div>
              </div>
            </div>

            {/* User Engagement */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4">User Engagement</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Total Users"
                  value={performanceReports.userEngagement?.totalUsers || 0}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Active Users (30d)"
                  value={performanceReports.userEngagement?.activeUsers || 0}
                  icon={Activity}
                  color="green"
                />
                <StatCard
                  title="Vehicle Listing Rate"
                  value={`${performanceReports.userEngagement?.vehicleListingRate || 0}%`}
                  icon={Truck}
                  color="purple"
                />
                <StatCard
                  title="Bidding Rate"
                  value={`${performanceReports.userEngagement?.biddingRate || 0}%`}
                  icon={Gavel}
                  color="yellow"
                />
              </div>
            </div>
          </div>
        )}

        {/* Geographic Tab */}
        {activeTab === "geographic" && geographicReports && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Geographic Analytics</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportGeographicToPDF(geographicReports)}
                    className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportGeographicToExcel(geographicReports)}
                    className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Vehicles by State */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Vehicles by State (Top 10)</h3>
              {geographicReports.vehicles?.byState && geographicReports.vehicles.byState.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={geographicReports.vehicles.byState.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Vehicle Count" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  <p>No vehicle data available by state</p>
                </div>
              )}
            </div>

            {/* Revenue by State */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Revenue by State (Top 10)</h3>
              {geographicReports.revenue?.byState && geographicReports.revenue.byState.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={geographicReports.revenue.byState}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="state" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString("en-IN")}`} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  <p>No revenue data available by state</p>
                </div>
              )}
            </div>

            {/* Users by State - Donut Chart */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Users by State</h3>
              {geographicReports.users?.byState && geographicReports.users.byState.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <RechartsPieChart>
                    <Pie
                      data={geographicReports.users.byState.slice(0, 10)}
                      dataKey="count"
                      nameKey="state"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      label={(entry) => `${entry.payload?.state || ''}: ${entry.value || 0}`}
                      labelLine={false}
                      animationDuration={1000}
                    >
                      {geographicReports.users.byState.slice(0, 10).map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={[
                            colors.primary, 
                            colors.secondary, 
                            colors.success, 
                            colors.warning, 
                            colors.danger, 
                            colors.pink, 
                            colors.info, 
                            colors.teal, 
                            colors.orange, 
                            colors.indigo
                          ][index % 10]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string | undefined, props: any) => [
                        `${value} users`,
                        props.payload.state
                      ]}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                      labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
                    />
                    <Legend 
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  <p>No user data available by state</p>
                </div>
              )}
            </div>
            
            {/* Top States Performance Radar Chart */}
            {geographicReports.vehicles?.byState && geographicReports.vehicles.byState.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Top States Performance Radar</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart 
                    data={geographicReports.vehicles.byState.slice(0, 5).map((item: any) => ({
                      state: item.state,
                      vehicles: item.count,
                      value: item.count,
                    }))}
                    margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
                  >
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis 
                      dataKey="state" 
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 'auto']}
                      tick={{ fill: "#6b7280" }}
                    />
                    <Radar
                      name="Vehicles"
                      dataKey="vehicles"
                      stroke={colors.primary}
                      fill={colors.primary}
                      fillOpacity={0.6}
                      strokeWidth={2}
                      animationDuration={1000}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value} vehicles`, ""]}
                      contentStyle={{ 
                        backgroundColor: "rgba(255, 255, 255, 0.95)", 
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                      }}
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Districts */}
            {geographicReports.vehicles?.byDistrict && geographicReports.vehicles.byDistrict.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900">Top Districts by Vehicle Count</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm sm:text-base">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 sm:px-4 text-gray-900">District</th>
                        <th className="text-right py-2 px-2 sm:px-4 text-gray-900">Vehicle Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geographicReports.vehicles.byDistrict.map((item: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2 sm:px-4 text-gray-900">{item.district}</td>
                          <td className="py-2 px-2 sm:px-4 text-right font-semibold text-gray-900">{item.count}</td>
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

// Export helper functions
function exportFinancialToPDF(data: any, period: string) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(`Financial Report - ${period}`, 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPos = 40;
  autoTable(doc, {
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", `₹${Math.round(data.summary?.totalRevenue || 0).toLocaleString("en-IN")}`],
      ["Membership Revenue", `₹${Math.round(data.summary?.membershipRevenue || 0).toLocaleString("en-IN")}`],
      ["Auction Revenue", `₹${Math.round(data.summary?.auctionRevenue || 0).toLocaleString("en-IN")}`],
      ["Pre-approved Revenue", `₹${Math.round(data.summary?.preApprovedRevenue || 0).toLocaleString("en-IN")}`],
    ],
    startY: yPos,
  });
  
  doc.save(`Financial_Report_${period}_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportFinancialToExcel(data: any, period: string) {
  const worksheet = XLSX.utils.json_to_sheet([
    { Metric: "Total Revenue", Value: `₹${Math.round(data.summary?.totalRevenue || 0).toLocaleString("en-IN")}` },
    { Metric: "Membership Revenue", Value: `₹${Math.round(data.summary?.membershipRevenue || 0).toLocaleString("en-IN")}` },
    { Metric: "Auction Revenue", Value: `₹${Math.round(data.summary?.auctionRevenue || 0).toLocaleString("en-IN")}` },
    { Metric: "Pre-approved Revenue", Value: `₹${Math.round(data.summary?.preApprovedRevenue || 0).toLocaleString("en-IN")}` },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Financial Report");
  XLSX.writeFile(workbook, `Financial_Report_${period}_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function exportPerformanceToPDF(data: any) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Performance Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPos = 40;
  autoTable(doc, {
    head: [["Metric", "Value"]],
    body: [
      ["Approval Rate", `${data.conversionRates?.approvalRate || 0}%`],
      ["Sale Conversion Rate", `${data.conversionRates?.saleConversionRate || 0}%`],
      ["Auction Conversion Rate", `${data.conversionRates?.auctionConversionRate || 0}%`],
      ["Auction Completion Rate", `${data.auctionPerformance?.completionRate || 0}%`],
      ["Bid Approval Rate", `${data.auctionPerformance?.bidApprovalRate || 0}%`],
      ["Avg Bids per Auction", data.auctionPerformance?.avgBidsPerAuction || 0],
      ["Avg Approval Time", `${data.timeMetrics?.avgApprovalTimeDays || 0} days`],
      ["Avg Auction Duration", `${data.timeMetrics?.avgAuctionDurationDays || 0} days`],
    ],
    startY: yPos,
  });
  
  doc.save(`Performance_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportPerformanceToExcel(data: any) {
  const worksheet = XLSX.utils.json_to_sheet([
    { Metric: "Approval Rate", Value: `${data.conversionRates?.approvalRate || 0}%` },
    { Metric: "Sale Conversion Rate", Value: `${data.conversionRates?.saleConversionRate || 0}%` },
    { Metric: "Auction Conversion Rate", Value: `${data.conversionRates?.auctionConversionRate || 0}%` },
    { Metric: "Auction Completion Rate", Value: `${data.auctionPerformance?.completionRate || 0}%` },
    { Metric: "Bid Approval Rate", Value: `${data.auctionPerformance?.bidApprovalRate || 0}%` },
    { Metric: "Avg Bids per Auction", Value: data.auctionPerformance?.avgBidsPerAuction || 0 },
    { Metric: "Avg Approval Time", Value: `${data.timeMetrics?.avgApprovalTimeDays || 0} days` },
    { Metric: "Avg Auction Duration", Value: `${data.timeMetrics?.avgAuctionDurationDays || 0} days` },
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Report");
  XLSX.writeFile(workbook, `Performance_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

function exportGeographicToPDF(data: any) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Geographic Report", 14, 22);
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  let yPos = 40;
  if (data.vehicles?.byState && data.vehicles.byState.length > 0) {
    doc.setFontSize(14);
    doc.text("Vehicles by State (Top 10)", 14, yPos);
    yPos += 8;
    autoTable(doc, {
      head: [["State", "Count"]],
      body: data.vehicles.byState.slice(0, 10).map((item: any) => [item.state, item.count]),
      startY: yPos,
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }
  
  if (data.revenue?.byState && data.revenue.byState.length > 0) {
    doc.setFontSize(14);
    doc.text("Revenue by State (Top 10)", 14, yPos);
    yPos += 8;
    autoTable(doc, {
      head: [["State", "Revenue"]],
      body: data.revenue.byState.map((item: any) => [item.state, `₹${Math.round(item.revenue).toLocaleString("en-IN")}`]),
      startY: yPos,
    });
  }
  
  doc.save(`Geographic_Report_${new Date().toISOString().split("T")[0]}.pdf`);
}

function exportGeographicToExcel(data: any) {
  const workbook = XLSX.utils.book_new();
  
  if (data.vehicles?.byState && data.vehicles.byState.length > 0) {
    const vehiclesSheet = XLSX.utils.json_to_sheet(data.vehicles.byState.slice(0, 10));
    XLSX.utils.book_append_sheet(workbook, vehiclesSheet, "Vehicles by State");
  }
  
  if (data.revenue?.byState && data.revenue.byState.length > 0) {
    const revenueSheet = XLSX.utils.json_to_sheet(data.revenue.byState.map((item: any) => ({
      State: item.state,
      Revenue: `₹${Math.round(item.revenue).toLocaleString("en-IN")}`,
    })));
    XLSX.utils.book_append_sheet(workbook, revenueSheet, "Revenue by State");
  }
  
  XLSX.writeFile(workbook, `Geographic_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
}

