"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, XCircle, FileText, Filter, Search, Eye, MessageSquare, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "@/lib/date-format";
import Pagination from "@/components/ui/Pagination";

interface Dispute {
  id: string;
  filerId: string;
  purchaseId?: string;
  auctionId?: string;
  vehicleId?: string;
  disputeType: string;
  reason: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
  resolutionAction?: string;
  refundAmount?: number;
  adminComments?: string;
  filer: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string;
  };
  purchase?: {
    id: string;
    purchasePrice: number;
    vehicle: {
      id: string;
      tractorBrand: string;
      tractorModel: string | null;
      engineHP: string;
      yearOfMfg: number;
      mainPhoto: string | null;
    };
    buyer: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
  };
  auction?: {
    id: string;
    vehicle: {
      id: string;
      tractorBrand: string;
      tractorModel: string | null;
      engineHP: string;
      yearOfMfg: number;
      mainPhoto: string | null;
    };
  };
  vehicle?: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    mainPhoto: string | null;
    seller: {
      id: string;
      fullName: string;
      phoneNumber: string;
    };
  };
  resolver?: {
    id: string;
    fullName: string;
  };
}

interface DisputeStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  rejected: number;
  urgent: number;
}

const disputeTypeLabels: Record<string, string> = {
  REFUND_REQUEST: "Refund Request",
  RETURN_REQUEST: "Return Request",
  QUALITY_ISSUE: "Quality Issue",
  MISMATCH_DESCRIPTION: "Mismatch Description",
  DELIVERY_ISSUE: "Delivery Issue",
  PAYMENT_ISSUE: "Payment Issue",
  SELLER_MISCONDUCT: "Seller Misconduct",
  FRAUD: "Fraud",
  OTHER: "Other",
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  RESOLVED: { label: "Resolved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  CLOSED: { label: "Closed", color: "bg-gray-100 text-gray-800", icon: XCircle },
  ESCALATED: { label: "Escalated", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-800" },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

export default function AdminDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [resolutionData, setResolutionData] = useState({
    status: "RESOLVED",
    resolution: "",
    resolutionAction: "",
    refundAmount: "",
    adminComments: "",
  });

  useEffect(() => {
    fetchDisputes();
  }, [filterStatus, filterPriority, page]);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      if (filterPriority !== "all") params.append("priority", filterPriority);
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/admin/disputes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.data || []);
        setPagination(data.pagination || pagination);
        setStats(data.stats || null);
      } else if (response.status === 401 || response.status === 403) {
        router.push("/login");
      } else {
        toast.error("Failed to load disputes");
      }
    } catch (error) {
      console.error("Error fetching disputes:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (disputeId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/admin/disputes/${disputeId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success("Dispute status updated");
        fetchDisputes();
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("An error occurred");
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: resolutionData.status,
          resolution: resolutionData.resolution,
          resolutionAction: resolutionData.resolutionAction,
          refundAmount: resolutionData.refundAmount ? parseFloat(resolutionData.refundAmount) : undefined,
          adminComments: resolutionData.adminComments,
        }),
      });

      if (response.ok) {
        toast.success("Dispute resolved successfully");
        setShowResolutionModal(false);
        setSelectedDispute(null);
        setResolutionData({
          status: "RESOLVED",
          resolution: "",
          resolutionAction: "",
          refundAmount: "",
          adminComments: "",
        });
        fetchDisputes();
      } else {
        const result = await response.json();
        toast.error(result.message || "Failed to resolve dispute");
      }
    } catch (error) {
      console.error("Error resolving dispute:", error);
      toast.error("An error occurred");
    }
  };

  const getVehicleInfo = (dispute: Dispute) => {
    if (dispute.purchase?.vehicle) return dispute.purchase.vehicle;
    if (dispute.auction?.vehicle) return dispute.auction.vehicle;
    if (dispute.vehicle) return dispute.vehicle;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading disputes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dispute Management</h1>
          <p className="text-gray-600">Manage and resolve customer disputes</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-4 border-l-4 border-yellow-500">
              <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
              <div className="text-sm text-yellow-600">Pending</div>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="text-2xl font-bold text-blue-700">{stats.underReview}</div>
              <div className="text-sm text-blue-600">Under Review</div>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="text-2xl font-bold text-green-700">{stats.resolved}</div>
              <div className="text-sm text-green-600">Resolved</div>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
              <div className="text-sm text-red-600">Rejected</div>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-4 border-l-4 border-orange-500">
              <div className="text-2xl font-bold text-orange-700">{stats.urgent}</div>
              <div className="text-sm text-orange-600">Urgent</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Disputes Found</h3>
            <p className="text-gray-600">No disputes match your filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const vehicle = getVehicleInfo(dispute);
              const StatusIcon = statusConfig[dispute.status]?.icon || Clock;
              const statusInfo = statusConfig[dispute.status] || statusConfig.PENDING;
              const priorityInfo = priorityConfig[dispute.priority] || priorityConfig.MEDIUM;

              return (
                <div
                  key={dispute.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {vehicle?.mainPhoto && (
                      <div className="flex-shrink-0">
                        <img
                          src={
                            vehicle.mainPhoto.startsWith("http")
                              ? vehicle.mainPhoto
                              : `/uploads/${vehicle.mainPhoto}`
                          }
                          alt={vehicle.tractorBrand}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {dispute.reason}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {dispute.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color} flex items-center gap-1`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityInfo.color}`}>
                          {priorityInfo.label} Priority
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                          {disputeTypeLabels[dispute.disputeType] || dispute.disputeType}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 mb-3">
                        <p><strong>Filed by:</strong> {dispute.filer.fullName} ({dispute.filer.phoneNumber})</p>
                        {vehicle && (
                          <p><strong>Vehicle:</strong> {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP</p>
                        )}
                      </div>

                      {dispute.resolution && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                          <p className="text-sm font-semibold text-green-900 mb-1">Resolution:</p>
                          <p className="text-sm text-green-800">{dispute.resolution}</p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDetailsModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        {dispute.status !== "RESOLVED" && dispute.status !== "REJECTED" && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(dispute.id, "UNDER_REVIEW")}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-semibold"
                            >
                              Mark Under Review
                            </button>
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowResolutionModal(true);
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Resolve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(dispute.id, "REJECTED")}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Filed: {formatDate(dispute.createdAt)}
                        {dispute.resolvedAt && ` • Resolved: ${formatDate(dispute.resolvedAt)}`}
                        {dispute.resolver && ` • By: ${dispute.resolver.fullName}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Dispute Details</h2>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedDispute(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Reason</h3>
                    <p className="text-gray-700">{selectedDispute.reason}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Type</h3>
                      <p className="text-gray-700">{disputeTypeLabels[selectedDispute.disputeType]}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Priority</h3>
                      <p className="text-gray-700">{priorityConfig[selectedDispute.priority]?.label}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Filer Information</h3>
                    <p className="text-gray-700">
                      {selectedDispute.filer.fullName}<br />
                      {selectedDispute.filer.phoneNumber}<br />
                      {selectedDispute.filer.email}
                    </p>
                  </div>
                  {selectedDispute.adminComments && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Admin Comments</h3>
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedDispute.adminComments}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Modal */}
        {showResolutionModal && selectedDispute && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Resolve Dispute</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={resolutionData.status}
                      onChange={(e) => setResolutionData({ ...resolutionData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="RESOLVED">Resolved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Details *</label>
                    <textarea
                      value={resolutionData.resolution}
                      onChange={(e) => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Enter resolution details..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Resolution Action</label>
                    <input
                      type="text"
                      value={resolutionData.resolutionAction}
                      onChange={(e) => setResolutionData({ ...resolutionData, resolutionAction: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="e.g., Refund issued, Vehicle replaced, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount (₹)</label>
                    <input
                      type="number"
                      value={resolutionData.refundAmount}
                      onChange={(e) => setResolutionData({ ...resolutionData, refundAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Admin Comments (Internal)</label>
                    <textarea
                      value={resolutionData.adminComments}
                      onChange={(e) => setResolutionData({ ...resolutionData, adminComments: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Internal notes (not visible to user)..."
                    />
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => {
                      setShowResolutionModal(false);
                      setSelectedDispute(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    disabled={!resolutionData.resolution}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Resolve Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!loading && disputes.length > 0 && (
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
      </div>
    </div>
  );
}

