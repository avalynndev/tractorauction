"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, FileCheck, Calendar, MapPin, Truck, CheckCircle2,
  Clock, AlertTriangle, Edit, Eye, XCircle
} from "lucide-react";
import toast from "react-hot-toast";

interface InspectionReport {
  id: string;
  vehicleId: string;
  scheduledDate: string;
  inspectionType: string;
  status: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel?: string;
    referenceNumber?: string;
    state: string;
    district?: string;
  };
}

export default function ValuerInspectionsPage() {
  const router = useRouter();
  const [inspections, setInspections] = useState<InspectionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [valuerId, setValuerId] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<InspectionReport | null>(null);
  const [showInspectionForm, setShowInspectionForm] = useState(false);

  useEffect(() => {
    // Check if valuer is logged in
    const valuerPhone = localStorage.getItem("valuerPhone");
    const valuerId = localStorage.getItem("valuerId");
    
    if (!valuerPhone || !valuerId) {
      toast.error("Please login as valuer first");
      router.push("/valuer/login");
      return;
    }

    fetchValuerAndInspections();
  }, []);

  const fetchValuerAndInspections = async () => {
    try {
      setLoading(true);
      
      // Get valuer ID from localStorage (set during login)
      const storedValuerId = localStorage.getItem("valuerId");
      const adminToken = localStorage.getItem("token"); // Use admin token for API access

      if (!storedValuerId) {
        toast.error("Valuer ID not found. Please login again.");
        router.push("/valuer/login");
        return;
      }

      setValuerId(storedValuerId);

      // Fetch assigned inspections
      // Valuers can access their own inspections without admin token
      const inspectionsResponse = await fetch(`/api/inspections/schedule?assignedValuerId=${storedValuerId}`, {
        // No auth header needed - API will verify valuer ID
      });

      if (inspectionsResponse.ok) {
        const inspectionsData = await inspectionsResponse.json();
        setInspections(inspectionsData.inspections || []);
      } else {
        const errorData = await inspectionsResponse.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to fetch inspections:", errorData);
        toast.error(errorData.message || "Failed to load inspections");
      }
    } catch (error: any) {
      console.error("Error fetching inspections:", error);
      toast.error(error.message || "Failed to load inspections");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "PENDING":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const stats = {
    total: inspections.length,
    pending: inspections.filter(i => i.status === "PENDING").length,
    inProgress: inspections.filter(i => i.status === "IN_PROGRESS").length,
    completed: inspections.filter(i => i.status === "COMPLETED" || i.status === "APPROVED").length,
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
                  <span>My Inspections</span>
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  View and complete assigned inspections
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
                <p className="text-gray-600 text-sm font-medium">Total Assigned</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-500" />
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
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">In Progress</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{stats.inProgress}</p>
              </div>
              <Edit className="w-12 h-12 text-orange-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
        </div>

        {/* Inspections List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Assigned Inspections</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading inspections...</p>
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-12">
              <FileCheck className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No inspections assigned</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Vehicle</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Scheduled Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {inspection.vehicle.tractorBrand} {inspection.vehicle.tractorModel}
                          </p>
                          {inspection.vehicle.referenceNumber && (
                            <p className="text-xs text-gray-500">
                              Ref: {inspection.vehicle.referenceNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{inspection.inspectionType}</span>
                      </td>
                      <td className="py-3 px-4">
                        {inspection.scheduledDate ? (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {new Date(inspection.scheduledDate).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not scheduled</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {inspection.vehicle.district || ""} {inspection.vehicle.district && ","} {inspection.vehicle.state}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inspection.status)}`}>
                          {inspection.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {(inspection.status === "PENDING" || inspection.status === "IN_PROGRESS") && (
                            <button
                              onClick={() => {
                                setSelectedInspection(inspection);
                                setShowInspectionForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Fill Inspection Form"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedInspection(inspection);
                              // View inspection details
                              window.open(`/inspections/${inspection.id}`, "_blank");
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
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

        {/* Inspection Form Modal */}
        {showInspectionForm && selectedInspection && (
          <ValuerInspectionFormModal
            inspection={selectedInspection}
            onClose={() => {
              setShowInspectionForm(false);
              setSelectedInspection(null);
            }}
            onSuccess={() => {
              setShowInspectionForm(false);
              setSelectedInspection(null);
              fetchValuerAndInspections();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Valuer Inspection Form Modal
function ValuerInspectionFormModal({
  inspection,
  onClose,
  onSuccess,
}: {
  inspection: InspectionReport;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
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
    // Repair costs
    engineCost: "",
    transmissionCost: "",
    hydraulicCost: "",
    electricalCost: "",
    bodyCost: "",
    tyreCost: "",
    otherCost: "",
  });
  const [inspectionPhotos, setInspectionPhotos] = useState<File[]>([]);
  const [inspectionDocument, setInspectionDocument] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token"); // Optional - admin token
      const valuerId = localStorage.getItem("valuerId"); // Required for valuers
      
      // Valuers can submit without admin token
      if (!token && !valuerId) {
        toast.error("Please login as valuer first");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("vehicleId", inspection.vehicleId);
      formDataToSend.append("inspectionType", inspection.inspectionType);
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

      // Update existing inspection
      // valuerId is already declared at the top of the function
      const headers: HeadersInit = {};
      // Add admin token if available, otherwise use valuer ID header
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      if (valuerId) {
        headers["x-valuer-id"] = valuerId;
      }

      const response = await fetch(`/api/inspections/${inspection.id}`, {
        method: "PUT",
        headers,
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Inspection report submitted successfully. Waiting for admin approval.");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to submit inspection report");
      }
    } catch (error: any) {
      console.error("Error submitting inspection:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Fill Inspection Report</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Vehicle Information</h3>
            <p className="text-sm text-gray-600">
              {inspection.vehicle.tractorBrand} {inspection.vehicle.tractorModel} - {inspection.vehicle.referenceNumber || "N/A"}
            </p>
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
              {[
                { key: "engineCost", label: "Engine" },
                { key: "transmissionCost", label: "Transmission" },
                { key: "hydraulicCost", label: "Hydraulic" },
                { key: "electricalCost", label: "Electrical" },
                { key: "bodyCost", label: "Body" },
                { key: "tyreCost", label: "Tyres" },
                { key: "otherCost", label: "Other" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="number"
                    value={(formData as any)[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="0"
                    min="0"
                  />
                </div>
              ))}
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
              {loading ? "Submitting..." : "Submit Inspection Report"}
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

