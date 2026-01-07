"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileCheck, Plus, Eye, Edit, Trash2,
  RefreshCw, Filter, Search, CheckCircle2, XCircle,
  Clock, AlertTriangle, Download, Camera, FileText, Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import ScheduleInspectionModal from "./ScheduleInspectionModal";

interface InspectionReport {
  id: string;
  vehicleId: string;
  inspectedBy: string;
  inspectionDate: string;
  inspectionType: string;
  status: string;
  engineCondition?: string;
  transmissionCondition?: string;
  hydraulicSystem?: string;
  electricalSystem?: string;
  bodyCondition?: string;
  tyreCondition?: string;
  overallCondition?: string;
  odometerReading?: string;
  hoursRun?: string;
  issuesFound?: string;
  issuesCount: number;
  criticalIssues: number;
  inspectionPhotos: string[];
  inspectionDocument?: string;
  notes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  createdAt: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel?: string;
    referenceNumber?: string;
    registrationNumber?: string;
  };
}

export default function InspectionsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    fetchReports();
    
    // Check if there's a reportId in the URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const reportId = urlParams.get("reportId");
    if (reportId) {
      fetchReportById(reportId);
    }
  }, [selectedStatus]);

  const fetchReportById = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/inspections/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedReport(data.report);
        setShowDetails(true);
        // Remove reportId from URL
        window.history.replaceState({}, "", "/admin/inspections");
      } else {
        toast.error("Inspection report not found");
      }
    } catch (error: any) {
      console.error("Error fetching report:", error);
      toast.error("Failed to load inspection report");
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const statusParam = selectedStatus !== "all" ? `&status=${selectedStatus}` : "";
      const response = await fetch(`/api/inspections/list?${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        toast.error(errorData.message || "Failed to load inspection reports");
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error);
      toast.error("An error occurred while loading inspection reports");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this inspection report?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/inspections/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Inspection report deleted successfully");
        fetchReports();
      } else {
        toast.error(result.message || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("An error occurred");
    }
  };

  const handleApprove = async (reportId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/inspections/${reportId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "APPROVED",
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Inspection report approved");
        fetchReports();
        if (selectedReport?.id === reportId) {
          setShowDetails(false);
        }
      } else {
        toast.error(result.message || "Failed to approve report");
      }
    } catch (error) {
      console.error("Error approving report:", error);
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-300";
      case "EXPIRED":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getConditionColor = (condition?: string) => {
    if (!condition) return "text-gray-500";
    switch (condition.toLowerCase()) {
      case "excellent":
        return "text-green-600 font-semibold";
      case "good":
        return "text-blue-600 font-semibold";
      case "fair":
        return "text-yellow-600 font-semibold";
      case "poor":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  const stats = {
    total: reports.length,
    approved: reports.filter(r => r.status === "APPROVED").length,
    completed: reports.filter(r => r.status === "COMPLETED").length,
    pending: reports.filter(r => r.status === "PENDING" || r.status === "IN_PROGRESS").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 mb-6">
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
                  <FileCheck className="w-8 h-8" />
                  <span>Vehicle Inspection Reports</span>
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  Manage and review vehicle inspection reports
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>New Inspection</span>
              </button>
              <Link
                href="/admin/valuers"
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                <FileText className="w-5 h-5" />
                <span>Manage Valuers</span>
              </Link>
              <button
                onClick={() => setShowScheduleForm(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                <Calendar className="w-5 h-5" />
                <span>Schedule Inspection</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
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
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.completed}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-500" />
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <button
              onClick={fetchReports}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Inspection Reports</h2>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600 mt-2">Loading inspection reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No inspection reports found</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Report
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Vehicle</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Condition</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Issues</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {report.vehicle.tractorBrand} {report.vehicle.tractorModel}
                          </p>
                          {report.vehicle.registrationNumber && (
                            <p className="text-xs text-gray-600 font-medium">
                              Reg: {report.vehicle.registrationNumber}
                            </p>
                          )}
                          {report.vehicle.referenceNumber && (
                            <p className="text-xs text-gray-500">
                              Ref: {report.vehicle.referenceNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{report.inspectionType}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">
                          {new Date(report.inspectionDate).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${getConditionColor(report.overallCondition)}`}>
                          {report.overallCondition || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {report.criticalIssues > 0 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">
                              {report.criticalIssues} Critical
                            </span>
                          )}
                          {report.issuesCount > 0 && (
                            <span className="text-sm text-gray-600">
                              {report.issuesCount} total
                            </span>
                          )}
                          {report.issuesCount === 0 && (
                            <span className="text-sm text-green-600">No issues</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowDetails(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {report.status === "COMPLETED" && (
                            <button
                              onClick={() => handleApprove(report.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && selectedReport && (
          <InspectionDetailsModal
            report={selectedReport}
            onClose={() => {
              setShowDetails(false);
              setSelectedReport(null);
            }}
            onApprove={() => {
              handleApprove(selectedReport.id);
            }}
            onRefresh={fetchReports}
          />
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <CreateInspectionModal
            onClose={() => setShowCreateForm(false)}
            onSuccess={() => {
              setShowCreateForm(false);
              fetchReports();
            }}
          />
        )}

        {/* Schedule Inspection Modal */}
        {showScheduleForm && (
          <ScheduleInspectionModal
            onClose={() => setShowScheduleForm(false)}
            onSuccess={() => {
              setShowScheduleForm(false);
              fetchReports();
            }}
          />
        )}
      </div>
    </div>
  );
}

function InspectionDetailsModal({
  report,
  onClose,
  onApprove,
  onRefresh,
}: {
  report: InspectionReport;
  onClose: () => void;
  onApprove: () => void;
  onRefresh: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getConditionColor = (condition?: string) => {
    if (!condition) return "text-gray-500";
    switch (condition.toLowerCase()) {
      case "excellent":
        return "text-green-600 font-semibold";
      case "good":
        return "text-blue-600 font-semibold";
      case "fair":
        return "text-yellow-600 font-semibold";
      case "poor":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Inspection Report Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Vehicle</p>
              <p className="font-bold text-lg">
                {report.vehicle.tractorBrand} {report.vehicle.tractorModel}
              </p>
              {report.vehicle.registrationNumber && (
                <p className="text-sm text-gray-600 font-medium">Reg: {report.vehicle.registrationNumber}</p>
              )}
              {report.vehicle.referenceNumber && (
                <p className="text-sm text-gray-500">Ref: {report.vehicle.referenceNumber}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(report.status)}`}>
                {report.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inspection Type</p>
              <p className="font-semibold">{report.inspectionType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inspection Date</p>
              <p className="font-semibold">{new Date(report.inspectionDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Condition Assessment */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Condition Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Engine</p>
                <p className={`font-semibold ${getConditionColor(report.engineCondition)}`}>
                  {report.engineCondition || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Transmission</p>
                <p className={`font-semibold ${getConditionColor(report.transmissionCondition)}`}>
                  {report.transmissionCondition || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Hydraulic System</p>
                <p className={`font-semibold ${getConditionColor(report.hydraulicSystem)}`}>
                  {report.hydraulicSystem || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Electrical System</p>
                <p className={`font-semibold ${getConditionColor(report.electricalSystem)}`}>
                  {report.electricalSystem || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Body</p>
                <p className={`font-semibold ${getConditionColor(report.bodyCondition)}`}>
                  {report.bodyCondition || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tyres</p>
                <p className={`font-semibold ${getConditionColor(report.tyreCondition)}`}>
                  {report.tyreCondition || "N/A"}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Overall Condition</p>
              <p className={`text-lg font-bold ${getConditionColor(report.overallCondition)}`}>
                {report.overallCondition || "Not Assessed"}
              </p>
            </div>
          </div>

          {/* Issues */}
          {(report.issuesCount > 0 || report.issuesFound) && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Issues Found</h3>
              <div className="flex items-center space-x-4 mb-3">
                <div className="px-3 py-1 bg-red-100 text-red-800 rounded-lg">
                  <span className="font-semibold">{report.criticalIssues}</span> Critical
                </div>
                <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg">
                  <span className="font-semibold">{report.issuesCount}</span> Total Issues
                </div>
              </div>
              {report.issuesFound && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.issuesFound}</p>
                </div>
              )}
            </div>
          )}

          {/* Photos */}
          {report.inspectionPhotos && report.inspectionPhotos.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Inspection Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.inspectionPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Inspection photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <a
                      href={photo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    >
                      <Eye className="w-6 h-6 text-white" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document */}
          {report.inspectionDocument && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Inspection Document</h3>
              <a
                href={report.inspectionDocument}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>View Document</span>
              </a>
            </div>
          )}

          {/* Notes */}
          {report.notes && (
            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {report.notes}
              </p>
            </div>
          )}

          {/* Verification Info */}
          {report.verifiedBy && report.verifiedAt && (
            <div className="border-t pt-4 bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Verification</h3>
              <p className="text-sm text-green-800">
                Verified on {new Date(report.verifiedAt).toLocaleDateString()}
              </p>
              {report.verificationNotes && (
                <p className="text-sm text-green-700 mt-2">{report.verificationNotes}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-4 flex space-x-3">
            {report.status === "COMPLETED" && (
              <button
                onClick={onApprove}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold"
              >
                Approve Report
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateInspectionModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    inspectionType: "COMPREHENSIVE",
    engineCondition: "",
    transmissionCondition: "",
    hydraulicSystem: "",
    electricalSystem: "",
    bodyCondition: "",
    tyreCondition: "",
    overallCondition: "",
    odometerReading: "",
    hoursRun: "",
    issuesFound: "",
    issuesCount: "0",
    criticalIssues: "0",
    notes: "",
  });
  const [inspectionPhotos, setInspectionPhotos] = useState<File[]>([]);
  const [inspectionDocument, setInspectionDocument] = useState<File | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("/api/admin/vehicles?status=APPROVED", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formDataToSend = new FormData();
      formDataToSend.append("vehicleId", formData.vehicleId);
      formDataToSend.append("inspectionType", formData.inspectionType);
      if (formData.engineCondition) formDataToSend.append("engineCondition", formData.engineCondition);
      if (formData.transmissionCondition) formDataToSend.append("transmissionCondition", formData.transmissionCondition);
      if (formData.hydraulicSystem) formDataToSend.append("hydraulicSystem", formData.hydraulicSystem);
      if (formData.electricalSystem) formDataToSend.append("electricalSystem", formData.electricalSystem);
      if (formData.bodyCondition) formDataToSend.append("bodyCondition", formData.bodyCondition);
      if (formData.tyreCondition) formDataToSend.append("tyreCondition", formData.tyreCondition);
      if (formData.overallCondition) formDataToSend.append("overallCondition", formData.overallCondition);
      if (formData.odometerReading) formDataToSend.append("odometerReading", formData.odometerReading);
      if (formData.hoursRun) formDataToSend.append("hoursRun", formData.hoursRun);
      if (formData.issuesFound) formDataToSend.append("issuesFound", formData.issuesFound);
      formDataToSend.append("issuesCount", formData.issuesCount);
      formDataToSend.append("criticalIssues", formData.criticalIssues);
      if (formData.notes) formDataToSend.append("notes", formData.notes);

      // Repair costs
      const repairCosts: any = {};
      let totalCost = 0;
      if (formData.engineCost) {
        repairCosts.engine = parseFloat(formData.engineCost);
        totalCost += repairCosts.engine;
      }
      if (formData.transmissionCost) {
        repairCosts.transmission = parseFloat(formData.transmissionCost);
        totalCost += repairCosts.transmission;
      }
      if (formData.hydraulicCost) {
        repairCosts.hydraulic = parseFloat(formData.hydraulicCost);
        totalCost += repairCosts.hydraulic;
      }
      if (formData.electricalCost) {
        repairCosts.electrical = parseFloat(formData.electricalCost);
        totalCost += repairCosts.electrical;
      }
      if (formData.bodyCost) {
        repairCosts.body = parseFloat(formData.bodyCost);
        totalCost += repairCosts.body;
      }
      if (formData.tyreCost) {
        repairCosts.tyres = parseFloat(formData.tyreCost);
        totalCost += repairCosts.tyres;
      }
      if (formData.otherCost) {
        repairCosts.other = parseFloat(formData.otherCost);
        totalCost += repairCosts.other;
      }

      if (Object.keys(repairCosts).length > 0) {
        formDataToSend.append("estimatedRepairCosts", JSON.stringify(repairCosts));
        formDataToSend.append("totalEstimatedCost", totalCost.toString());
      }

      inspectionPhotos.forEach((photo) => {
        formDataToSend.append("inspectionPhotos", photo);
      });

      if (inspectionDocument) {
        formDataToSend.append("inspectionDocument", inspectionDocument);
      }

      const response = await fetch("/api/inspections/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Inspection report created successfully");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to create inspection report");
      }
    } catch (error: any) {
      console.error("Error creating report:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    `${v.tractorBrand} ${v.tractorModel || ""} ${v.referenceNumber || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Create Inspection Report</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Vehicle *
            </label>
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
            />
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select a vehicle</option>
              {filteredVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.tractorBrand} {vehicle.tractorModel} - {vehicle.referenceNumber || vehicle.id.substring(0, 8)}
                </option>
              ))}
            </select>
          </div>

          {/* Inspection Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Type *
            </label>
            <select
              value={formData.inspectionType}
              onChange={(e) => setFormData({ ...formData, inspectionType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="BASIC">Basic</option>
              <option value="COMPREHENSIVE">Comprehensive</option>
              <option value="PRE_SALE">Pre-Sale</option>
              <option value="POST_SALE">Post-Sale</option>
              <option value="WARRANTY">Warranty</option>
            </select>
          </div>

          {/* Condition Assessment */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Condition Assessment</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: "engineCondition", label: "Engine" },
                { key: "transmissionCondition", label: "Transmission" },
                { key: "hydraulicSystem", label: "Hydraulic System" },
                { key: "electricalSystem", label: "Electrical System" },
                { key: "bodyCondition", label: "Body" },
                { key: "tyreCondition", label: "Tyres" },
                { key: "overallCondition", label: "Overall" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  <select
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Mileage/Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Odometer Reading
              </label>
              <input
                type="text"
                value={formData.odometerReading}
                onChange={(e) => setFormData({ ...formData, odometerReading: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 50000 km"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours Run
              </label>
              <input
                type="text"
                value={formData.hoursRun}
                onChange={(e) => setFormData({ ...formData, hoursRun: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g., 2500 hours"
              />
            </div>
          </div>

          {/* Issues */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Issues Count
              </label>
              <input
                type="number"
                value={formData.issuesCount}
                onChange={(e) => setFormData({ ...formData, issuesCount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Critical Issues Count
              </label>
              <input
                type="number"
                value={formData.criticalIssues}
                onChange={(e) => setFormData({ ...formData, criticalIssues: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issues Found (Description)
            </label>
            <textarea
              value={formData.issuesFound}
              onChange={(e) => setFormData({ ...formData, issuesFound: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Describe any issues found during inspection..."
            />
          </div>

          {/* Estimated Repair Costs */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Estimated Repair Costs (₹)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                <input
                  type="number"
                  value={formData.engineCost}
                  onChange={(e) => setFormData({ ...formData, engineCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transmission</label>
                <input
                  type="number"
                  value={formData.transmissionCost}
                  onChange={(e) => setFormData({ ...formData, transmissionCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hydraulic</label>
                <input
                  type="number"
                  value={formData.hydraulicCost}
                  onChange={(e) => setFormData({ ...formData, hydraulicCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Electrical</label>
                <input
                  type="number"
                  value={formData.electricalCost}
                  onChange={(e) => setFormData({ ...formData, electricalCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <input
                  type="number"
                  value={formData.bodyCost}
                  onChange={(e) => setFormData({ ...formData, bodyCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tyres</label>
                <input
                  type="number"
                  value={formData.tyreCost}
                  onChange={(e) => setFormData({ ...formData, tyreCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
                <input
                  type="number"
                  value={formData.otherCost}
                  onChange={(e) => setFormData({ ...formData, otherCost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setInspectionPhotos(files);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {inspectionPhotos.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {inspectionPhotos.length} photo(s) selected
              </p>
            )}
          </div>

          {/* Document */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inspection Document (PDF)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setInspectionDocument(file);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {inspectionDocument && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {inspectionDocument.name}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Any additional notes or observations..."
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-3 border-t pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Inspection Report"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

