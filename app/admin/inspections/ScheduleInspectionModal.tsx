"use client";

import { useState, useEffect } from "react";
import { XCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

interface ScheduleInspectionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScheduleInspectionModal({
  onClose,
  onSuccess,
}: ScheduleInspectionModalProps) {
  const [formData, setFormData] = useState({
    vehicleId: "",
    scheduledDate: "",
    scheduledTime: "",
    inspectionType: "COMPREHENSIVE",
    assignedValuerId: "",
    notes: "",
  });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [valuers, setValuers] = useState<any[]>([]);
  const [filterState, setFilterState] = useState("all");
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchValuers();
  }, [filterState]);

  // Auto-set filter state when vehicle is selected
  useEffect(() => {
    if (formData.vehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);
      if (selectedVehicle && selectedVehicle.state) {
        setFilterState(selectedVehicle.state);
      }
    }
  }, [formData.vehicleId, vehicles]);

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        setLoadingVehicles(false);
        return;
      }

      // Fetch all APPROVED and AUCTION vehicles - show all vehicles pending for valuation
      // Note: We need to fetch both statuses because:
      // - PREAPPROVED vehicles have status "APPROVED" after approval
      // - AUCTION vehicles have status "AUCTION" after approval
      const response = await fetch("/api/admin/vehicles?status=APPROVED,AUCTION", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const vehiclesList = data.vehicles || [];
        
        // Show all approved vehicles - admin can schedule inspection for any of them
        setVehicles(vehiclesList);
        
        if (vehiclesList.length === 0) {
          toast.info("No approved vehicles available for inspection scheduling");
        } else {
          console.log(`Loaded ${vehiclesList.length} approved vehicles available for inspection`);
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        toast.error(errorData.message || "Failed to load vehicles");
        console.error("Error fetching vehicles:", errorData);
        setVehicles([]);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("An error occurred while loading vehicles");
      setVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchValuers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const params = new URLSearchParams();
      params.append("isActive", "true");
      if (filterState !== "all") {
        params.append("state", filterState);
      }

      const response = await fetch(`/api/admin/valuers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setValuers(data.valuers || []);
      }
    } catch (error) {
      console.error("Error fetching valuers:", error);
      setValuers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Combine date and time
      const scheduledDateTime = `${formData.scheduledDate}T${formData.scheduledTime}:00`;

      if (!formData.assignedValuerId) {
        toast.error("Please select a valuer");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/inspections/schedule", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicleId: formData.vehicleId,
          scheduledDate: scheduledDateTime,
          inspectionType: formData.inspectionType,
          assignedValuerId: formData.assignedValuerId,
          notes: formData.notes || null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Inspection scheduled successfully");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to schedule inspection");
      }
    } catch (error: any) {
      console.error("Error scheduling inspection:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    `${v.tractorBrand} ${v.tractorModel || ""} ${v.referenceNumber || ""}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Calendar className="w-6 h-6" />
              <span>Schedule Inspection</span>
            </h2>
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
            {loadingVehicles ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2 bg-gray-50 flex items-center justify-center">
                <span className="text-gray-600">Loading vehicles...</span>
              </div>
            ) : (
              <>
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
                  {filteredVehicles.length === 0 ? (
                    <option value="" disabled>No vehicles available for inspection</option>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.tractorBrand} {vehicle.tractorModel || ""} - {vehicle.referenceNumber || vehicle.id.substring(0, 8)}
                        {vehicle.state ? ` (${vehicle.state})` : ""}
                      </option>
                    ))
                  )}
                </select>
                {filteredVehicles.length === 0 && !loadingVehicles && (
                  <p className="text-sm text-gray-500 mt-1">
                    No approved vehicles available for inspection scheduling
                  </p>
                )}
              </>
            )}
          </div>

          {/* Scheduled Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date *
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min={minDate}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Time *
              </label>
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
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

          {/* Filter Valuers by State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Valuers by State (Optional)
            </label>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">All States</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {formData.vehicleId && vehicles.find(v => v.id === formData.vehicleId) && (
              <p className="text-xs text-gray-500 mt-1">
                Vehicle location: {vehicles.find(v => v.id === formData.vehicleId)?.state}
              </p>
            )}
          </div>

          {/* Assigned Valuer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Valuer *
            </label>
            <select
              value={formData.assignedValuerId}
              onChange={(e) => setFormData({ ...formData, assignedValuerId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Select a valuer</option>
              {valuers.map((valuer) => (
                <option key={valuer.id} value={valuer.id}>
                  {valuer.valuerName} - {valuer.registrationNumber} ({valuer.city}, {valuer.state})
                </option>
              ))}
            </select>
            {valuers.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                No active valuers found. Please add valuers first.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="Any additional notes for the inspection..."
            />
          </div>

          {/* Submit */}
          <div className="flex space-x-3 border-t pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50"
            >
              {loading ? "Scheduling..." : "Schedule Inspection"}
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

