"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Shield, DollarSign, Clock, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, Filter, Search,
  Eye, FileText, Download, TrendingUp, Users
} from "lucide-react";
import toast from "react-hot-toast";

interface Escrow {
  id: string;
  amount: number;
  escrowFee: number;
  status: "PENDING" | "HELD" | "RELEASED" | "REFUNDED" | "DISPUTE" | "CANCELLED";
  paymentMethod?: string;
  paymentId?: string;
  paymentReference?: string;
  heldAt: string;
  releasedAt?: string;
  refundedAt?: string;
  releaseReason?: string;
  refundReason?: string;
  disputeRaised: boolean;
  disputeRaisedBy?: string;
  disputeDescription?: string;
  disputeResolved: boolean;
  disputeResolution?: string;
  createdAt: string;
  purchase: {
    id: string;
    purchasePrice: number;
    status: string;
    buyer: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email?: string;
    };
    vehicle: {
      id: string;
      tractorBrand: string;
      tractorModel?: string;
      referenceNumber?: string;
      seller: {
        id: string;
        fullName: string;
        phoneNumber: string;
        email?: string;
      };
    };
  };
}

export default function EscrowManagementPage() {
  const router = useRouter();
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [releaseReason, setReleaseReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [disputeResolution, setDisputeResolution] = useState("");

  useEffect(() => {
    fetchEscrows();
  }, [selectedStatus]);

  // Test endpoint to diagnose issues
  const testEscrowConnection = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/escrow/test", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Escrow Test Results:", data);
      
      if (data.results) {
        if (!data.results.databaseCheck.tableExists) {
          toast.error("Escrow table does not exist in database. Run: npx prisma db push", { duration: 10000 });
        } else if (!data.results.modelCheck.exists) {
          toast.error("Escrow model not in Prisma client. Restart server after: npx prisma generate", { duration: 10000 });
        } else {
          toast.success("Escrow connection test passed!", { duration: 5000 });
        }
      }
    } catch (error) {
      console.error("Test error:", error);
    }
  };

  const fetchEscrows = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const statusParam = selectedStatus !== "all" ? `status=${selectedStatus}` : "";
      const url = `/api/escrow/list${statusParam ? `?${statusParam}` : ""}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEscrows(data.escrows || []);
      } else {
        // Try to get error message from response
        let errorData: any = { message: `HTTP ${response.status}: ${response.statusText}` };
        const contentType = response.headers.get("content-type");
        
        try {
          // Clone response before reading to avoid consuming it
          const responseClone = response.clone();
          
          if (contentType && contentType.includes("application/json")) {
            errorData = await responseClone.json();
          } else {
            const text = await responseClone.text();
            if (text) {
              try {
                // Try to parse as JSON even if content-type doesn't say so
                errorData = JSON.parse(text);
              } catch {
                errorData = { 
                  message: text || `HTTP ${response.status}: ${response.statusText}`,
                  status: response.status,
                  statusText: response.statusText
                };
              }
            }
          }
        } catch (e: any) {
          console.error("Error parsing error response:", e);
          errorData = { 
            message: `HTTP ${response.status}: ${response.statusText}`,
            status: response.status,
            statusText: response.statusText,
            parseError: e.message
          };
        }
        
        console.error("Failed to load escrows:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url,
          contentType: response.headers.get("content-type"),
          hasErrorData: Object.keys(errorData).length > 0
        });
        
        // Check if it's a database schema issue
        if (errorData.code === "DATABASE_SCHEMA_MISSING" || errorData.error?.includes("does not exist") || errorData.message?.includes("does not exist")) {
          toast.error("Database schema needs to be updated. Please run: npx prisma generate && npx prisma db push", { duration: 8000 });
        } else if (response.status === 401) {
          toast.error("Unauthorized. Please login again.");
          router.push("/login");
        } else if (response.status === 403) {
          toast.error("Access denied. Admin privileges required.");
        } else if (response.status === 404) {
          toast.error("Escrow API endpoint not found. Please check the route configuration.");
        } else {
          toast.error(errorData.message || errorData.error || `Failed to load escrow transactions (${response.status})`);
        }
      }
    } catch (error: any) {
      console.error("Error fetching escrows:", error);
      const errorMessage = error.message || "An error occurred while loading escrow transactions";
      toast.error(errorMessage);
      
      // Check if it's a network error
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        toast.error("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: string) => {
    if (!releaseReason.trim()) {
      toast.error("Please provide a reason for release");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/escrow/release", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          escrowId,
          reason: releaseReason,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Escrow funds released successfully");
        setReleaseReason("");
        setShowDetails(false);
        fetchEscrows();
      } else {
        toast.error(result.message || "Failed to release escrow");
      }
    } catch (error) {
      console.error("Error releasing escrow:", error);
      toast.error("An error occurred");
    }
  };

  const handleRefund = async (escrowId: string) => {
    if (!refundReason.trim()) {
      toast.error("Please provide a reason for refund");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/escrow/refund", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          escrowId,
          reason: refundReason,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Escrow refunded successfully");
        setRefundReason("");
        setShowDetails(false);
        fetchEscrows();
      } else {
        toast.error(result.message || "Failed to refund escrow");
      }
    } catch (error) {
      console.error("Error refunding escrow:", error);
      toast.error("An error occurred");
    }
  };

  const handleResolveDispute = async (escrowId: string, resolution: "release" | "refund") => {
    if (!disputeResolution.trim()) {
      toast.error("Please provide a resolution description");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const endpoint = resolution === "release" ? "/api/escrow/release" : "/api/escrow/refund";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          escrowId,
          reason: disputeResolution,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Dispute resolved: ${resolution === "release" ? "Funds released" : "Funds refunded"}`);
        setDisputeResolution("");
        setShowDetails(false);
        fetchEscrows();
      } else {
        toast.error(result.message || "Failed to resolve dispute");
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: Escrow["status"]) => {
    switch (status) {
      case "HELD":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "RELEASED":
        return "bg-green-100 text-green-800 border-green-300";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DISPUTE":
        return "bg-red-100 text-red-800 border-red-300";
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "CANCELLED":
        return "bg-gray-200 text-gray-600 border-gray-400";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const stats = {
    total: escrows.length,
    held: escrows.filter(e => e.status === "HELD").length,
    released: escrows.filter(e => e.status === "RELEASED").length,
    refunded: escrows.filter(e => e.status === "REFUNDED").length,
    dispute: escrows.filter(e => e.status === "DISPUTE").length,
    totalAmount: escrows.reduce((sum, e) => sum + e.amount, 0),
    heldAmount: escrows.filter(e => e.status === "HELD").reduce((sum, e) => sum + e.amount, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg p-6 mb-6">
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
                  <span>Escrow Management</span>
                </h1>
                <p className="text-indigo-100 mt-1 text-sm sm:text-base">
                  Manage escrow transactions and disputes
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Escrows</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Held</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.held}</p>
                <p className="text-xs text-gray-500 mt-1">₹{stats.heldAmount.toLocaleString()}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Released</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.released}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Disputes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.dispute}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="HELD">Held</option>
              <option value="RELEASED">Released</option>
              <option value="REFUNDED">Refunded</option>
              <option value="DISPUTE">Dispute</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button
              onClick={fetchEscrows}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={testEscrowConnection}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              title="Test Escrow connection"
            >
              <Shield className="w-4 h-4" />
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* Escrow List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Escrow Transactions</h2>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
              <p className="text-gray-600 mt-2">Loading escrow transactions...</p>
            </div>
          ) : escrows.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No escrow transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Vehicle</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Buyer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {escrows.map((escrow) => (
                    <tr key={escrow.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="text-sm font-mono text-gray-600">
                          {escrow.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {escrow.purchase.vehicle.tractorBrand} {escrow.purchase.vehicle.tractorModel}
                          </p>
                          {escrow.purchase.vehicle.referenceNumber && (
                            <p className="text-xs text-gray-500">
                              Ref: {escrow.purchase.vehicle.referenceNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{escrow.purchase.buyer.fullName}</p>
                          <p className="text-xs text-gray-500">{escrow.purchase.buyer.phoneNumber}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-gray-900">₹{escrow.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Fee: ₹{escrow.escrowFee.toLocaleString()}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(escrow.status)}`}>
                          {escrow.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(escrow.heldAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedEscrow(escrow);
                            setShowDetails(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && selectedEscrow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Escrow Details</h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedEscrow(null);
                      setReleaseReason("");
                      setRefundReason("");
                      setDisputeResolution("");
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Escrow Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Escrow ID</p>
                    <p className="font-mono text-sm font-semibold">{selectedEscrow.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedEscrow.status)}`}>
                      {selectedEscrow.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-bold text-lg">₹{selectedEscrow.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Escrow Fee</p>
                    <p className="font-semibold">₹{selectedEscrow.escrowFee.toLocaleString()}</p>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Brand & Model</p>
                      <p className="font-semibold">
                        {selectedEscrow.purchase.vehicle.tractorBrand} {selectedEscrow.purchase.vehicle.tractorModel}
                      </p>
                    </div>
                    {selectedEscrow.purchase.vehicle.referenceNumber && (
                      <div>
                        <p className="text-sm text-gray-600">Reference Number</p>
                        <p className="font-semibold">{selectedEscrow.purchase.vehicle.referenceNumber}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Buyer & Seller Info */}
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Buyer</h3>
                    <p className="text-sm">{selectedEscrow.purchase.buyer.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedEscrow.purchase.buyer.phoneNumber}</p>
                    {selectedEscrow.purchase.buyer.email && (
                      <p className="text-xs text-gray-500">{selectedEscrow.purchase.buyer.email}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Seller</h3>
                    <p className="text-sm">{selectedEscrow.purchase.vehicle.seller.fullName}</p>
                    <p className="text-xs text-gray-500">{selectedEscrow.purchase.vehicle.seller.phoneNumber}</p>
                    {selectedEscrow.purchase.vehicle.seller.email && (
                      <p className="text-xs text-gray-500">{selectedEscrow.purchase.vehicle.seller.email}</p>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                {selectedEscrow.paymentMethod && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Payment Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="font-semibold">{selectedEscrow.paymentMethod}</p>
                      </div>
                      {selectedEscrow.paymentId && (
                        <div>
                          <p className="text-sm text-gray-600">Payment ID</p>
                          <p className="font-mono text-sm">{selectedEscrow.paymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dispute Info */}
                {selectedEscrow.disputeRaised && (
                  <div className="border-t pt-4 bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2">Dispute Information</h3>
                    <p className="text-sm text-gray-700 mb-2">{selectedEscrow.disputeDescription}</p>
                    {selectedEscrow.disputeResolved && selectedEscrow.disputeResolution && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <p className="text-sm font-semibold text-green-900">Resolution:</p>
                        <p className="text-sm text-green-800">{selectedEscrow.disputeResolution}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="border-t pt-4 space-y-3">
                  {selectedEscrow.status === "HELD" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Release Reason
                        </label>
                        <textarea
                          value={releaseReason}
                          onChange={(e) => setReleaseReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Enter reason for releasing funds to seller..."
                        />
                        <button
                          onClick={() => handleRelease(selectedEscrow.id)}
                          className="mt-2 w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold"
                        >
                          Release Funds to Seller
                        </button>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Refund Reason
                        </label>
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={2}
                          placeholder="Enter reason for refunding to buyer..."
                        />
                        <button
                          onClick={() => handleRefund(selectedEscrow.id)}
                          className="mt-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                        >
                          Refund to Buyer
                        </button>
                      </div>
                    </>
                  )}

                  {selectedEscrow.status === "DISPUTE" && !selectedEscrow.disputeResolved && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dispute Resolution
                        </label>
                        <textarea
                          value={disputeResolution}
                          onChange={(e) => setDisputeResolution(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                          placeholder="Enter resolution details..."
                        />
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <button
                            onClick={() => handleResolveDispute(selectedEscrow.id, "release")}
                            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold"
                          >
                            Release to Seller
                          </button>
                          <button
                            onClick={() => handleResolveDispute(selectedEscrow.id, "refund")}
                            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold"
                          >
                            Refund to Buyer
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

