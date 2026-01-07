"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, XCircle, AlertTriangle, Bug, 
  Zap, Monitor, Smartphone, Globe, 
  FileText, Download, ArrowLeft, 
  RefreshCw, Activity, Shield, 
  Clock, Users, Package, Gavel,
  CheckSquare, Square, Filter,
  TrendingUp, AlertCircle, Info
} from "lucide-react";
import toast from "react-hot-toast";

interface TestCase {
  id: string;
  category: string;
  name: string;
  description: string;
  status: "passed" | "failed" | "pending" | "skipped";
  priority: "high" | "medium" | "low";
  lastTested?: Date;
  notes?: string;
}

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "closed";
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  stepsToReproduce: string[];
  expectedBehavior: string;
  actualBehavior: string;
  browser?: string;
  device?: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "critical";
  threshold: { good: number; warning: number };
}

export default function QAPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"dashboard" | "test-cases" | "bugs" | "performance" | "compatibility" | "checklist">("dashboard");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    loadTestCases();
    loadBugReports();
    loadPerformanceMetrics();
  }, []);

  const loadTestCases = () => {
    // Load test cases from localStorage or API
    const saved = localStorage.getItem("qa_test_cases");
    if (saved) {
      setTestCases(JSON.parse(saved));
    } else {
      setTestCases(generateDefaultTestCases());
    }
  };

  const loadBugReports = () => {
    const saved = localStorage.getItem("qa_bug_reports");
    if (saved) {
      setBugReports(JSON.parse(saved));
    }
  };

  const loadPerformanceMetrics = () => {
    // Simulate performance metrics
    setPerformanceMetrics([
      { name: "Page Load Time", value: 1.2, unit: "s", status: "good", threshold: { good: 2, warning: 3 } },
      { name: "API Response Time", value: 150, unit: "ms", status: "good", threshold: { good: 200, warning: 500 } },
      { name: "Database Query Time", value: 45, unit: "ms", status: "good", threshold: { good: 100, warning: 200 } },
      { name: "Image Load Time", value: 0.8, unit: "s", status: "good", threshold: { good: 1, warning: 2 } },
    ]);
  };

  const generateDefaultTestCases = (): TestCase[] => {
    return [
      // Authentication Tests
      { id: "auth-001", category: "Authentication", name: "User Registration", description: "Verify user can register with all required fields", status: "pending", priority: "high" },
      { id: "auth-002", category: "Authentication", name: "OTP Verification", description: "Verify OTP is sent and can be verified", status: "pending", priority: "high" },
      { id: "auth-003", category: "Authentication", name: "Login Flow", description: "Verify user can login with phone number", status: "pending", priority: "high" },
      { id: "auth-004", category: "Authentication", name: "Session Management", description: "Verify JWT token is stored and validated", status: "pending", priority: "high" },
      
      // Vehicle Listing Tests
      { id: "vehicle-001", category: "Vehicle Listing", name: "Upload Vehicle Form", description: "Verify seller can upload vehicle with all fields", status: "pending", priority: "high" },
      { id: "vehicle-002", category: "Vehicle Listing", name: "Image Upload", description: "Verify main and sub photos can be uploaded", status: "pending", priority: "high" },
      { id: "vehicle-003", category: "Vehicle Listing", name: "Form Validation", description: "Verify all required fields are validated", status: "pending", priority: "medium" },
      { id: "vehicle-004", category: "Vehicle Listing", name: "Bulk Upload", description: "Verify bulk upload functionality", status: "pending", priority: "low" },
      
      // Auction Tests
      { id: "auction-001", category: "Auction", name: "Create Auction", description: "Verify admin can create auction from approved vehicle", status: "pending", priority: "high" },
      { id: "auction-002", category: "Auction", name: "Place Bid", description: "Verify buyer can place bid on live auction", status: "pending", priority: "high" },
      { id: "auction-003", category: "Auction", name: "Bid Validation", description: "Verify bid amount validation (minimum increment)", status: "pending", priority: "high" },
      { id: "auction-004", category: "Auction", name: "Auction Timer", description: "Verify auction countdown timer works correctly", status: "pending", priority: "medium" },
      { id: "auction-005", category: "Auction", name: "Winner Selection", description: "Verify highest bidder is selected as winner", status: "pending", priority: "high" },
      { id: "auction-006", category: "Auction", name: "Seller Approval", description: "Verify seller can approve/reject winner", status: "pending", priority: "high" },
      
      // Pre-approved Tests
      { id: "preapproved-001", category: "Pre-approved", name: "Browse Vehicles", description: "Verify buyers can browse pre-approved vehicles", status: "pending", priority: "high" },
      { id: "preapproved-002", category: "Pre-approved", name: "Search & Filter", description: "Verify search and filter functionality", status: "pending", priority: "medium" },
      { id: "preapproved-003", category: "Pre-approved", name: "Quick View", description: "Verify quick view modal displays vehicle details", status: "pending", priority: "medium" },
      { id: "preapproved-004", category: "Pre-approved", name: "Detailed View", description: "Verify detailed view page shows all information", status: "pending", priority: "high" },
      { id: "preapproved-005", category: "Pre-approved", name: "Purchase Flow", description: "Verify purchase flow for pre-approved vehicles", status: "pending", priority: "high" },
      
      // Admin Tests
      { id: "admin-001", category: "Admin", name: "Vehicle Approval", description: "Verify admin can approve/reject vehicles", status: "pending", priority: "high" },
      { id: "admin-002", category: "Admin", name: "Bulk Operations", description: "Verify bulk approve/reject functionality", status: "pending", priority: "medium" },
      { id: "admin-003", category: "Admin", name: "Auction Scheduling", description: "Verify admin can schedule auctions", status: "pending", priority: "high" },
      { id: "admin-004", category: "Admin", name: "User Management", description: "Verify admin can view and manage users", status: "pending", priority: "medium" },
      { id: "admin-005", category: "Admin", name: "Reports", description: "Verify reports page displays correct data", status: "pending", priority: "low" },
      
      // UI/UX Tests
      { id: "ui-001", category: "UI/UX", name: "Responsive Design", description: "Verify pages are responsive on mobile/tablet/desktop", status: "pending", priority: "high" },
      { id: "ui-002", category: "UI/UX", name: "Navigation", description: "Verify all navigation links work correctly", status: "pending", priority: "high" },
      { id: "ui-003", category: "UI/UX", name: "Loading States", description: "Verify loading indicators show during API calls", status: "pending", priority: "medium" },
      { id: "ui-004", category: "UI/UX", name: "Error Messages", description: "Verify error messages are clear and helpful", status: "pending", priority: "medium" },
      { id: "ui-005", category: "UI/UX", name: "Toast Notifications", description: "Verify toast notifications appear correctly", status: "pending", priority: "low" },
      
      // Security Tests
      { id: "security-001", category: "Security", name: "Authentication Required", description: "Verify protected routes require authentication", status: "pending", priority: "high" },
      { id: "security-002", category: "Security", name: "Admin Authorization", description: "Verify admin-only routes are protected", status: "pending", priority: "high" },
      { id: "security-003", category: "Security", name: "Input Validation", description: "Verify all user inputs are validated", status: "pending", priority: "high" },
      { id: "security-004", category: "Security", name: "SQL Injection", description: "Verify database queries are safe from SQL injection", status: "pending", priority: "high" },
      { id: "security-005", category: "Security", name: "XSS Protection", description: "Verify user inputs are sanitized", status: "pending", priority: "high" },
      
      // Performance Tests
      { id: "perf-001", category: "Performance", name: "Page Load Speed", description: "Verify pages load within acceptable time", status: "pending", priority: "medium" },
      { id: "perf-002", category: "Performance", name: "API Response Time", description: "Verify API endpoints respond quickly", status: "pending", priority: "medium" },
      { id: "perf-003", category: "Performance", name: "Image Optimization", description: "Verify images are optimized and load quickly", status: "pending", priority: "low" },
      { id: "perf-004", category: "Performance", name: "Database Queries", description: "Verify database queries are optimized", status: "pending", priority: "medium" },
    ];
  };

  const updateTestCaseStatus = (id: string, status: TestCase["status"], notes?: string) => {
    const updated = testCases.map(tc => 
      tc.id === id 
        ? { ...tc, status, lastTested: new Date(), notes: notes || tc.notes }
        : tc
    );
    setTestCases(updated);
    localStorage.setItem("qa_test_cases", JSON.stringify(updated));
    toast.success("Test case updated");
  };

  const addBugReport = (bug: Omit<BugReport, "id" | "reportedAt">) => {
    const newBug: BugReport = {
      ...bug,
      id: `BUG-${Date.now()}`,
      reportedAt: new Date(),
    };
    const updated = [newBug, ...bugReports];
    setBugReports(updated);
    localStorage.setItem("qa_bug_reports", JSON.stringify(updated));
    toast.success("Bug report added");
  };

  const updateBugStatus = (id: string, status: BugReport["status"]) => {
    const updated = bugReports.map(bug =>
      bug.id === id ? { ...bug, status } : bug
    );
    setBugReports(updated);
    localStorage.setItem("qa_bug_reports", JSON.stringify(updated));
    toast.success("Bug status updated");
  };

  const downloadTestReport = () => {
    const report = generateTestReport();
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QA_Test_Report_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Test report downloaded");
  };

  const generateTestReport = (): string => {
    const categories = Array.from(new Set(testCases.map(tc => tc.category)));
    let report = `================================================================================
QA TEST REPORT - TRACTOR AUCTION PLATFORM
Generated: ${new Date().toLocaleString()}
================================================================================

SUMMARY
-------
Total Test Cases: ${testCases.length}
Passed: ${testCases.filter(tc => tc.status === "passed").length}
Failed: ${testCases.filter(tc => tc.status === "failed").length}
Pending: ${testCases.filter(tc => tc.status === "pending").length}
Skipped: ${testCases.filter(tc => tc.status === "skipped").length}

Pass Rate: ${((testCases.filter(tc => tc.status === "passed").length / testCases.length) * 100).toFixed(1)}%

`;

    categories.forEach(category => {
      const categoryTests = testCases.filter(tc => tc.category === category);
      report += `\n${category.toUpperCase()}\n`;
      report += `${"=".repeat(category.length)}\n\n`;
      
      categoryTests.forEach(tc => {
        const statusIcon = tc.status === "passed" ? "✓" : tc.status === "failed" ? "✗" : tc.status === "skipped" ? "-" : "○";
        report += `${statusIcon} [${tc.priority.toUpperCase()}] ${tc.name}\n`;
        report += `   Description: ${tc.description}\n`;
        if (tc.lastTested) {
          report += `   Last Tested: ${tc.lastTested.toLocaleString()}\n`;
        }
        if (tc.notes) {
          report += `   Notes: ${tc.notes}\n`;
        }
        report += `\n`;
      });
    });

    report += `\n\nBUG REPORTS\n`;
    report += `${"=".repeat(50)}\n\n`;
    if (bugReports.length === 0) {
      report += "No bug reports.\n";
    } else {
      bugReports.forEach(bug => {
        report += `[${bug.severity.toUpperCase()}] ${bug.title}\n`;
        report += `Status: ${bug.status}\n`;
        report += `Reported: ${bug.reportedAt.toLocaleString()}\n`;
        report += `Description: ${bug.description}\n\n`;
      });
    }

    return report;
  };

  const filteredTestCases = testCases.filter(tc => {
    const categoryMatch = selectedCategory === "all" || tc.category === selectedCategory;
    const statusMatch = selectedStatus === "all" || tc.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const categories = Array.from(new Set(testCases.map(tc => tc.category)));
  const stats = {
    total: testCases.length,
    passed: testCases.filter(tc => tc.status === "passed").length,
    failed: testCases.filter(tc => tc.status === "failed").length,
    pending: testCases.filter(tc => tc.status === "pending").length,
    skipped: testCases.filter(tc => tc.status === "skipped").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center space-x-3">
                  <Shield className="w-8 h-8" />
                  <span>Testing & Quality Assurance</span>
                </h1>
                <p className="text-green-100 mt-1 text-sm sm:text-base">
                  Comprehensive testing tools and quality assurance dashboard
                </p>
              </div>
            </div>
            <button
              onClick={downloadTestReport}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
            >
              <Download className="w-5 h-5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: Activity },
              { id: "test-cases", label: "Test Cases", icon: CheckSquare },
              { id: "bugs", label: "Bug Reports", icon: Bug },
              { id: "performance", label: "Performance", icon: Zap },
              { id: "compatibility", label: "Compatibility", icon: Monitor },
              { id: "checklist", label: "Checklist", icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all font-semibold ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Tests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <CheckSquare className="w-12 h-12 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Passed</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.passed}</p>
                  </div>
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Failed</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{stats.failed}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Test Cases by Category */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Test Cases by Category</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => {
                  const categoryTests = testCases.filter(tc => tc.category === category);
                  const passed = categoryTests.filter(tc => tc.status === "passed").length;
                  const total = categoryTests.length;
                  const percentage = total > 0 ? (passed / total) * 100 : 0;
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{category}</h3>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{passed}/{total} passed</span>
                        <span className="text-sm font-semibold text-gray-900">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 80 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Bugs */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Bug Reports</h2>
              {bugReports.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No bug reports yet</p>
              ) : (
                <div className="space-y-3">
                  {bugReports.slice(0, 5).map(bug => (
                    <div key={bug.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{bug.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          bug.severity === "critical" ? "bg-red-100 text-red-800" :
                          bug.severity === "high" ? "bg-orange-100 text-orange-800" :
                          bug.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {bug.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{bug.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Status: {bug.status}</span>
                        <span>Reported: {bug.reportedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Cases Tab */}
        {activeTab === "test-cases" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Status</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                    <option value="skipped">Skipped</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Cases List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Test Cases ({filteredTestCases.length})</h2>
              <div className="space-y-3">
                {filteredTestCases.map(tc => (
                  <div key={tc.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            tc.priority === "high" ? "bg-red-100 text-red-800" :
                            tc.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {tc.priority}
                          </span>
                          <span className="text-xs text-gray-500">{tc.category}</span>
                        </div>
                        <h3 className="font-semibold text-gray-900">{tc.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{tc.description}</p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => updateTestCaseStatus(tc.id, "passed")}
                          className={`p-2 rounded-lg transition-colors ${
                            tc.status === "passed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-green-50"
                          }`}
                          title="Mark as Passed"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateTestCaseStatus(tc.id, "failed")}
                          className={`p-2 rounded-lg transition-colors ${
                            tc.status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600 hover:bg-red-50"
                          }`}
                          title="Mark as Failed"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => updateTestCaseStatus(tc.id, "skipped")}
                          className={`p-2 rounded-lg transition-colors ${
                            tc.status === "skipped" ? "bg-gray-200 text-gray-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title="Skip"
                        >
                          <Square className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {tc.lastTested && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last tested: {tc.lastTested.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bugs Tab */}
        {activeTab === "bugs" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bug Reports</h2>
              <BugReportForm onSubmit={addBugReport} />
              
              <div className="mt-6 space-y-3">
                {bugReports.map(bug => (
                  <div key={bug.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-gray-900">{bug.title}</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            bug.severity === "critical" ? "bg-red-100 text-red-800" :
                            bug.severity === "high" ? "bg-orange-100 text-orange-800" :
                            bug.severity === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {bug.severity}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            bug.status === "open" ? "bg-red-100 text-red-800" :
                            bug.status === "in-progress" ? "bg-yellow-100 text-yellow-800" :
                            bug.status === "resolved" ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          }`}>
                            {bug.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{bug.description}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p><strong>Expected:</strong> {bug.expectedBehavior}</p>
                          <p><strong>Actual:</strong> {bug.actualBehavior}</p>
                          {bug.browser && <p><strong>Browser:</strong> {bug.browser}</p>}
                          {bug.device && <p><strong>Device:</strong> {bug.device}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        <select
                          value={bug.status}
                          onChange={(e) => updateBugStatus(bug.id, e.target.value as BugReport["status"])}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {performanceMetrics.map(metric => (
                  <div key={metric.name} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{metric.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        metric.status === "good" ? "bg-green-100 text-green-800" :
                        metric.status === "warning" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {metric.status}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.value} {metric.unit}
                    </p>
                    <div className="mt-2 text-xs text-gray-500">
                      Threshold: Good &lt; {metric.threshold.good}{metric.unit}, Warning &lt; {metric.threshold.warning}{metric.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Compatibility Tab */}
        {activeTab === "compatibility" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Browser & Device Compatibility</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Recommended Browsers</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Chrome", "Firefox", "Safari", "Edge"].map(browser => (
                    <div key={browser} className="border border-gray-200 rounded-lg p-3 text-center">
                      <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-semibold text-gray-900">{browser}</p>
                      <p className="text-xs text-gray-500">Latest version</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Device Testing</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {["Desktop", "Tablet", "Mobile"].map(device => (
                    <div key={device} className="border border-gray-200 rounded-lg p-3 text-center">
                      {device === "Desktop" ? <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-600" /> :
                       device === "Tablet" ? <Monitor className="w-8 h-8 mx-auto mb-2 text-gray-600" /> :
                       <Smartphone className="w-8 h-8 mx-auto mb-2 text-gray-600" />}
                      <p className="font-semibold text-gray-900">{device}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === "checklist" && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pre-Deployment Checklist</h2>
            <TestingChecklist />
          </div>
        )}
      </div>
    </div>
  );
}

function BugReportForm({ onSubmit }: { onSubmit: (bug: Omit<BugReport, "id" | "reportedAt">) => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as BugReport["severity"],
    stepsToReproduce: [""],
    expectedBehavior: "",
    actualBehavior: "",
    browser: "",
    device: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: formData.title,
      description: formData.description,
      severity: formData.severity,
      status: "open",
      reportedBy: "Admin",
      stepsToReproduce: formData.stepsToReproduce.filter(s => s.trim() !== ""),
      expectedBehavior: formData.expectedBehavior,
      actualBehavior: formData.actualBehavior,
      browser: formData.browser || undefined,
      device: formData.device || undefined,
    });
    setFormData({
      title: "",
      description: "",
      severity: "medium",
      stepsToReproduce: [""],
      expectedBehavior: "",
      actualBehavior: "",
      browser: "",
      device: "",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-gray-900 mb-3">Report New Bug</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          rows={3}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as BugReport["severity"] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Browser</label>
          <input
            type="text"
            value={formData.browser}
            onChange={(e) => setFormData({ ...formData, browser: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="e.g., Chrome 120"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Behavior</label>
        <input
          type="text"
          value={formData.expectedBehavior}
          onChange={(e) => setFormData({ ...formData, expectedBehavior: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Actual Behavior</label>
        <input
          type="text"
          value={formData.actualBehavior}
          onChange={(e) => setFormData({ ...formData, actualBehavior: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold"
      >
        Submit Bug Report
      </button>
    </form>
  );
}

function TestingChecklist() {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const checklistItems = [
    { category: "Authentication", items: [
      { id: "auth-1", text: "User registration works correctly" },
      { id: "auth-2", text: "OTP verification functions properly" },
      { id: "auth-3", text: "Login/logout works" },
      { id: "auth-4", text: "Session management is secure" },
    ]},
    { category: "Vehicle Management", items: [
      { id: "vehicle-1", text: "Vehicle upload form validates all fields" },
      { id: "vehicle-2", text: "Image uploads work correctly" },
      { id: "vehicle-3", text: "Admin approval/rejection works" },
      { id: "vehicle-4", text: "Vehicle status updates correctly" },
    ]},
    { category: "Auction System", items: [
      { id: "auction-1", text: "Auctions can be created and scheduled" },
      { id: "auction-2", text: "Bidding functionality works" },
      { id: "auction-3", text: "Bid validation is correct" },
      { id: "auction-4", text: "Winner selection works" },
      { id: "auction-5", text: "Seller approval flow works" },
    ]},
    { category: "UI/UX", items: [
      { id: "ui-1", text: "All pages are responsive" },
      { id: "ui-2", text: "Navigation works on all pages" },
      { id: "ui-3", text: "Loading states display correctly" },
      { id: "ui-4", text: "Error messages are clear" },
      { id: "ui-5", text: "Toast notifications work" },
    ]},
    { category: "Security", items: [
      { id: "sec-1", text: "Protected routes require authentication" },
      { id: "sec-2", text: "Admin routes are properly secured" },
      { id: "sec-3", text: "Input validation prevents SQL injection" },
      { id: "sec-4", text: "XSS protection is in place" },
    ]},
    { category: "Performance", items: [
      { id: "perf-1", text: "Pages load within acceptable time" },
      { id: "perf-2", text: "API responses are fast" },
      { id: "perf-3", text: "Images are optimized" },
      { id: "perf-4", text: "Database queries are efficient" },
    ]},
  ];

  return (
    <div className="space-y-6">
      {checklistItems.map(section => (
        <div key={section.category} className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">{section.category}</h3>
          <div className="space-y-2">
            {section.items.map(item => (
              <label key={item.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                <input
                  type="checkbox"
                  checked={checkedItems.has(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className={checkedItems.has(item.id) ? "line-through text-gray-500" : "text-gray-900"}>
                  {item.text}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Progress:</strong> {checkedItems.size} / {checklistItems.reduce((sum, s) => sum + s.items.length, 0)} items completed
        </p>
      </div>
    </div>
  );
}

























