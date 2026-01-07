"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Clock, XCircle, FileText, Plus, Filter, Search } from "lucide-react";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "@/lib/date-format";
import BackButton from "@/components/navigation/BackButton";
import Pagination from "@/components/ui/Pagination";

interface Dispute {
  id: string;
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
  };
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

export default function MyDisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    fetchDisputes();
  }, [filterStatus, page]);

  const fetchDisputes = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.append("status", filterStatus);
      }
      params.append("page", page.toString());
      params.append("limit", "20");

      const response = await fetch(`/api/disputes?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setDisputes(data.data || []);
        setPagination(data.pagination || pagination);
      } else if (response.status === 401) {
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

  // Client-side search filtering (server-side pagination is already applied)
  const filteredDisputes = disputes.filter((dispute) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      dispute.reason.toLowerCase().includes(query) ||
      dispute.description.toLowerCase().includes(query) ||
      disputeTypeLabels[dispute.disputeType]?.toLowerCase().includes(query)
    );
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getVehicleInfo = (dispute: Dispute) => {
    if (dispute.purchase?.vehicle) {
      return dispute.purchase.vehicle;
    }
    if (dispute.auction?.vehicle) {
      return dispute.auction.vehicle;
    }
    if (dispute.vehicle) {
      return dispute.vehicle;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="container mx-auto max-w-6xl">
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
      <div className="container mx-auto max-w-6xl">
        <BackButton href="/my-account" label="Back to My Account" />

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Disputes</h1>
              <p className="text-gray-600">View and manage your dispute cases</p>
            </div>
            <Link
              href="/my-account/disputes/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              File New Dispute
            </Link>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search disputes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          {/* Disputes List */}
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Disputes Found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "No disputes match your filters"
                  : "You haven't filed any disputes yet"}
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Link
                  href="/my-account/disputes/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  File Your First Dispute
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDisputes.map((dispute) => {
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
                      {/* Vehicle Image */}
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
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {/* Dispute Details */}
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

                        {vehicle && (
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Vehicle:</span> {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP ({vehicle.yearOfMfg})
                          </div>
                        )}

                        {dispute.resolution && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                            <p className="text-sm font-semibold text-green-900 mb-1">Resolution:</p>
                            <p className="text-sm text-green-800">{dispute.resolution}</p>
                            {dispute.resolutionAction && (
                              <p className="text-xs text-green-700 mt-1">
                                Action: {dispute.resolutionAction}
                              </p>
                            )}
                            {dispute.refundAmount && (
                              <p className="text-xs text-green-700 mt-1">
                                Refund Amount: ₹{dispute.refundAmount.toLocaleString("en-IN")}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Filed: {formatDate(dispute.createdAt)}</span>
                          {dispute.resolvedAt && (
                            <span>Resolved: {formatDate(dispute.resolvedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && disputes.length > 0 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrev={pagination.hasPrev}
              onPageChange={handlePageChange}
              total={pagination.total}
              limit={pagination.limit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

