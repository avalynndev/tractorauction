"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, UserPlus, Upload, Edit, Trash2, Search, Filter,
  CheckCircle2, XCircle, MapPin, Calendar, FileText, Download
} from "lucide-react";
import toast from "react-hot-toast";
import { getDistrictsForState } from "@/lib/indian-districts";

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

interface Valuer {
  id: string;
  valuerName: string;
  phoneNumber: string;
  whatsappNumber: string;
  registrationNumber: string;
  registrationExpiryDate: string;
  state: string;
  district: string;
  city: string;
  address: string;
  pincode?: string;
  isActive: boolean;
  createdAt: string;
  inspections?: Array<{
    id: string;
    status: string;
  }>;
}

export default function ValuersPage() {
  const router = useRouter();
  const [valuers, setValuers] = useState<Valuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [selectedValuer, setSelectedValuer] = useState<Valuer | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [filterState, setFilterState] = useState("all");
  const [filterDistrict, setFilterDistrict] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    fetchValuers();
  }, [filterState, filterDistrict, filterActive]);

  useEffect(() => {
    if (filterState !== "all") {
      const districts = getDistrictsForState(filterState);
      setAvailableDistricts(districts);
      setFilterDistrict("all");
    } else {
      setAvailableDistricts([]);
      setFilterDistrict("all");
    }
  }, [filterState]);

  const fetchValuers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const params = new URLSearchParams();
      if (filterState !== "all") params.append("state", filterState);
      if (filterDistrict !== "all") params.append("district", filterDistrict);
      if (filterActive !== "all") params.append("isActive", filterActive);

      const response = await fetch(`/api/admin/valuers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setValuers(data.valuers || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Failed to load valuers:", errorData);
        toast.error(errorData.message || "Failed to load valuers");
      }
    } catch (error: any) {
      console.error("Error fetching valuers:", error);
      toast.error(error.message || "An error occurred while loading valuers");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (valuerId: string) => {
    if (!confirm("Are you sure you want to delete this valuer?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/admin/valuers/${valuerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Valuer deleted successfully");
        fetchValuers();
      } else {
        toast.error(result.message || "Failed to delete valuer");
      }
    } catch (error) {
      console.error("Error deleting valuer:", error);
      toast.error("An error occurred");
    }
  };

  const handleToggleActive = async (valuer: Valuer) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`/api/admin/valuers/${valuer.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !valuer.isActive,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Valuer ${!valuer.isActive ? "activated" : "deactivated"} successfully`);
        fetchValuers();
      } else {
        toast.error(result.message || "Failed to update valuer");
      }
    } catch (error) {
      console.error("Error updating valuer:", error);
      toast.error("An error occurred");
    }
  };

  const filteredValuers = valuers.filter(v => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        v.valuerName.toLowerCase().includes(searchLower) ||
        v.phoneNumber.includes(searchTerm) ||
        v.registrationNumber.toLowerCase().includes(searchLower) ||
        v.city.toLowerCase().includes(searchLower) ||
        v.district.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const stats = {
    total: valuers.length,
    active: valuers.filter(v => v.isActive).length,
    expired: valuers.filter(v => new Date(v.registrationExpiryDate) < new Date()).length,
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
                  <FileText className="w-8 h-8" />
                  <span>Valuer Management</span>
                </h1>
                <p className="text-blue-100 mt-1 text-sm sm:text-base">
                  Manage certified valuers/inspectors
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowBulkUpload(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                <Upload className="w-5 h-5" />
                <span>Bulk Upload</span>
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-white font-semibold"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add Valuer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Valuers</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Expired Registration</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.expired}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, phone, registration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All States</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              disabled={filterState === "all"}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="all">All Districts</option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Valuers List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Valuers List</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading valuers...</p>
            </div>
          ) : filteredValuers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No valuers found</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add First Valuer
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Registration</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Location</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredValuers.map((valuer) => {
                    const isExpired = new Date(valuer.registrationExpiryDate) < new Date();
                    return (
                      <tr key={valuer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{valuer.valuerName}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600">{valuer.phoneNumber}</p>
                          <p className="text-xs text-gray-500">WhatsApp: {valuer.whatsappNumber}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-gray-600 font-mono">{valuer.registrationNumber}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{valuer.city}, {valuer.district}, {valuer.state}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={`text-sm ${isExpired ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                              {new Date(valuer.registrationExpiryDate).toLocaleDateString()}
                            </span>
                            {isExpired && (
                              <span className="text-xs text-red-600">(Expired)</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(valuer)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              valuer.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {valuer.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedValuer(valuer);
                                setShowEditForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(valuer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add/Edit Form Modal */}
        {(showAddForm || showEditForm) && (
          <ValuerFormModal
            valuer={showEditForm ? selectedValuer : null}
            onClose={() => {
              setShowAddForm(false);
              setShowEditForm(false);
              setSelectedValuer(null);
            }}
            onSuccess={() => {
              setShowAddForm(false);
              setShowEditForm(false);
              setSelectedValuer(null);
              fetchValuers();
            }}
          />
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <BulkUploadModal
            onClose={() => setShowBulkUpload(false)}
            onSuccess={() => {
              setShowBulkUpload(false);
              fetchValuers();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Valuer Form Modal Component
function ValuerFormModal({
  valuer,
  onClose,
  onSuccess,
}: {
  valuer: Valuer | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    valuerName: valuer?.valuerName || "",
    phoneNumber: valuer?.phoneNumber || "",
    whatsappNumber: valuer?.whatsappNumber || "",
    registrationNumber: valuer?.registrationNumber || "",
    registrationExpiryDate: valuer?.registrationExpiryDate ? new Date(valuer.registrationExpiryDate).toISOString().split("T")[0] : "",
    state: valuer?.state || "",
    district: valuer?.district || "",
    city: valuer?.city || "",
    address: valuer?.address || "",
    pincode: valuer?.pincode || "",
    isActive: valuer?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    if (formData.state) {
      const districts = getDistrictsForState(formData.state);
      setAvailableDistricts(districts);
    }
  }, [formData.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const url = valuer ? `/api/admin/valuers/${valuer.id}` : "/api/admin/valuers";
      const method = valuer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(valuer ? "Valuer updated successfully" : "Valuer created successfully");
        onSuccess();
      } else {
        toast.error(result.message || "Failed to save valuer");
      }
    } catch (error) {
      console.error("Error saving valuer:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {valuer ? "Edit Valuer" : "Add New Valuer"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valuer Name *
              </label>
              <input
                type="text"
                value={formData.valuerName}
                onChange={(e) => setFormData({ ...formData, valuerName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
                pattern="[6-9][0-9]{9}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
                pattern="[6-9][0-9]{9}"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number *
              </label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Expiry Date *
              </label>
              <input
                type="date"
                value={formData.registrationExpiryDate}
                onChange={(e) => setFormData({ ...formData, registrationExpiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value, district: "" })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <select
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
                disabled={!formData.state}
              >
                <option value="">Select District</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode
              </label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                pattern="[0-9]{6}"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={3}
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex space-x-3 border-t pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50"
            >
              {loading ? "Saving..." : valuer ? "Update Valuer" : "Create Valuer"}
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

// Bulk Upload Modal Component
function BulkUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/valuers/bulk-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        onSuccess();
      } else {
        toast.error(result.message || "Failed to upload file");
        if (result.results?.errors?.length > 0) {
          console.error("Upload errors:", result.results.errors);
        }
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "Valuer Name,Phone Number,WhatsApp Number,Registration Number,Registration Expiry Date,State,District,City,Address,Pincode,Is Active\n" +
      "John Doe,9876543210,9876543210,VAL-2024-001,2025-12-31,Maharashtra,Mumbai,Mumbai,123 Main Street,400001,true";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "valuers-template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Bulk Upload Valuers</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV file with valuer details. Required columns: Valuer Name, Phone Number, WhatsApp Number, Registration Number, Registration Expiry Date (YYYY-MM-DD), State, District, City, Address, Pincode (optional), Is Active (true/false).
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="mb-4 text-blue-600 hover:underline text-sm flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Download CSV Template</span>
            </button>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            {file && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {file.name}
              </p>
            )}
          </div>

          <div className="flex space-x-3 border-t pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload File"}
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

