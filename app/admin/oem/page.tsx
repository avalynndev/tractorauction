"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Factory, Plus, Edit, Trash2, Search, X, Check, ArrowLeft, Phone, Mail, User, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

interface OEM {
  id: string;
  oemName: string;
  phoneNumber: string;
  email?: string | null;
  countryRetailHead?: string | null;
  countryRetailHeadPhone?: string | null;
  countryRetailHeadEmail?: string | null;
  zonalRetailHead?: string | null;
  zonalRetailHeadPhone?: string | null;
  zonalRetailHeadEmail?: string | null;
  stateRetailHead?: string | null;
  stateRetailHeadPhone?: string | null;
  stateRetailHeadEmail?: string | null;
  countrySalesHead?: string | null;
  countrySalesHeadPhone?: string | null;
  countrySalesHeadEmail?: string | null;
  zonalSalesHead?: string | null;
  zonalSalesHeadPhone?: string | null;
  zonalSalesHeadEmail?: string | null;
  stateSalesHead?: string | null;
  stateSalesHeadPhone?: string | null;
  stateSalesHeadEmail?: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function OEMManagementPage() {
  const router = useRouter();
  const [oems, setOems] = useState<OEM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingOEM, setEditingOEM] = useState<OEM | null>(null);
  const [formData, setFormData] = useState({
    oemName: "",
    phoneNumber: "",
    email: "",
    countryRetailHead: "",
    countryRetailHeadPhone: "",
    countryRetailHeadEmail: "",
    zonalRetailHead: "",
    zonalRetailHeadPhone: "",
    zonalRetailHeadEmail: "",
    stateRetailHead: "",
    stateRetailHeadPhone: "",
    stateRetailHeadEmail: "",
    countrySalesHead: "",
    countrySalesHeadPhone: "",
    countrySalesHeadEmail: "",
    zonalSalesHead: "",
    zonalSalesHeadPhone: "",
    zonalSalesHeadEmail: "",
    stateSalesHead: "",
    stateSalesHeadPhone: "",
    stateSalesHeadEmail: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchOEMs(token);
  }, [router]);

  const fetchOEMs = async (token: string) => {
    try {
      const response = await fetch("/api/admin/oem", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setOems(data.oems || []);
      } else {
        toast.error("Failed to fetch OEMs");
      }
    } catch (error) {
      console.error("Error fetching OEMs:", error);
      toast.error("Error loading OEMs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    // Validation
    if (!formData.oemName || !formData.phoneNumber) {
      toast.error("OEM Name and Contact Number are required");
      return;
    }

    if (formData.phoneNumber && !/^[6-9]\d{9}$/.test(formData.phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const url = editingOEM 
        ? `/api/admin/oem/${editingOEM.id}`
        : "/api/admin/oem";
      const method = editingOEM ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(editingOEM ? "OEM updated successfully" : "OEM registered successfully");
        setShowForm(false);
        setEditingOEM(null);
        resetForm();
        fetchOEMs(token);
      } else {
        toast.error(data.message || "Failed to save OEM");
      }
    } catch (error) {
      console.error("Error saving OEM:", error);
      toast.error("An error occurred");
    }
  };

  const handleEdit = (oem: OEM) => {
    setEditingOEM(oem);
      setFormData({
        oemName: oem.oemName ?? "",
        phoneNumber: oem.phoneNumber ?? "",
        email: oem.email ?? "",
        countryRetailHead: oem.countryRetailHead ?? "",
        countryRetailHeadPhone: oem.countryRetailHeadPhone ?? "",
        countryRetailHeadEmail: oem.countryRetailHeadEmail ?? "",
        zonalRetailHead: oem.zonalRetailHead ?? "",
        zonalRetailHeadPhone: oem.zonalRetailHeadPhone ?? "",
        zonalRetailHeadEmail: oem.zonalRetailHeadEmail ?? "",
        stateRetailHead: oem.stateRetailHead ?? "",
        stateRetailHeadPhone: oem.stateRetailHeadPhone ?? "",
        stateRetailHeadEmail: oem.stateRetailHeadEmail ?? "",
        countrySalesHead: oem.countrySalesHead ?? "",
        countrySalesHeadPhone: oem.countrySalesHeadPhone ?? "",
        countrySalesHeadEmail: oem.countrySalesHeadEmail ?? "",
        zonalSalesHead: oem.zonalSalesHead ?? "",
        zonalSalesHeadPhone: oem.zonalSalesHeadPhone ?? "",
        zonalSalesHeadEmail: oem.zonalSalesHeadEmail ?? "",
        stateSalesHead: oem.stateSalesHead ?? "",
        stateSalesHeadPhone: oem.stateSalesHeadPhone ?? "",
        stateSalesHeadEmail: oem.stateSalesHeadEmail ?? "",
      });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this OEM?")) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/oem/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("OEM deleted successfully");
        fetchOEMs(token);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete OEM");
      }
    } catch (error) {
      console.error("Error deleting OEM:", error);
      toast.error("An error occurred");
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`/api/admin/oem/${id}/toggle-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(`OEM ${!currentStatus ? "activated" : "deactivated"} successfully`);
        fetchOEMs(token);
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to update OEM status");
      }
    } catch (error) {
      console.error("Error updating OEM status:", error);
      toast.error("An error occurred");
    }
  };

  const resetForm = () => {
    setFormData({
      oemName: "",
      phoneNumber: "",
      email: "",
      countryRetailHead: "",
      countryRetailHeadPhone: "",
      countryRetailHeadEmail: "",
      zonalRetailHead: "",
      zonalRetailHeadPhone: "",
      zonalRetailHeadEmail: "",
      stateRetailHead: "",
      stateRetailHeadEmail: "",
      countrySalesHead: "",
      countrySalesHeadPhone: "",
      countrySalesHeadEmail: "",
      zonalSalesHead: "",
      zonalSalesHeadPhone: "",
      zonalSalesHeadEmail: "",
      stateSalesHead: "",
      stateSalesHeadEmail: "",
    });
  };

  const filteredOEMs = oems.filter((oem) =>
    oem.oemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    oem.phoneNumber.includes(searchTerm) ||
    (oem.email && oem.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-primary-600 hover:text-primary-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Factory className="w-8 h-8 text-primary-600" />
                OEM Management
              </h1>
              <p className="text-gray-600 mt-2">Register and manage Original Equipment Manufacturers</p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingOEM(null);
                setShowForm(true);
              }}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Register New OEM</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* OEM List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OEM Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOEMs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No OEMs found. Click "Register New OEM" to add one.
                    </td>
                  </tr>
                ) : (
                  filteredOEMs.map((oem) => (
                    <tr key={oem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="font-semibold text-gray-900">{oem.oemName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          {oem.phoneNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {oem.email ? (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-1" />
                            {oem.email}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(oem.id, oem.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            oem.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {oem.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(oem)}
                            className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(oem.id)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registration/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">
                    {editingOEM ? "Edit OEM" : "Register New OEM"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingOEM(null);
                      resetForm();
                    }}
                    className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-primary-600" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OEM Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.oemName}
                        onChange={(e) => setFormData({ ...formData, oemName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="e.g., Mahindra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OEM Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="10-digit phone number"
                        maxLength={10}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OEM Email ID
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="oem@example.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Country Retail Head */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-primary-600" />
                    Country Retail Head
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.countryRetailHead}
                        onChange={(e) => setFormData({ ...formData, countryRetailHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.countryRetailHeadPhone}
                        onChange={(e) => setFormData({ ...formData, countryRetailHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.countryRetailHeadEmail}
                        onChange={(e) => setFormData({ ...formData, countryRetailHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Zonal Retail Head */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Zonal Retail Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.zonalRetailHead}
                        onChange={(e) => setFormData({ ...formData, zonalRetailHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.zonalRetailHeadPhone}
                        onChange={(e) => setFormData({ ...formData, zonalRetailHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.zonalRetailHeadEmail}
                        onChange={(e) => setFormData({ ...formData, zonalRetailHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* State Retail Head */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">State Retail Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.stateRetailHead}
                        onChange={(e) => setFormData({ ...formData, stateRetailHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.stateRetailHeadPhone || ""}
                        onChange={(e) => setFormData({ ...formData, stateRetailHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.stateRetailHeadEmail}
                        onChange={(e) => setFormData({ ...formData, stateRetailHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Country Sales Head */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Country Sales Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.countrySalesHead}
                        onChange={(e) => setFormData({ ...formData, countrySalesHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.countrySalesHeadPhone}
                        onChange={(e) => setFormData({ ...formData, countrySalesHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.countrySalesHeadEmail}
                        onChange={(e) => setFormData({ ...formData, countrySalesHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Zonal Sales Head */}
                <div className="border-b pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Zonal Sales Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.zonalSalesHead}
                        onChange={(e) => setFormData({ ...formData, zonalSalesHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.zonalSalesHeadPhone}
                        onChange={(e) => setFormData({ ...formData, zonalSalesHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.zonalSalesHeadEmail}
                        onChange={(e) => setFormData({ ...formData, zonalSalesHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* State Sales Head */}
                <div className="pb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">State Sales Head</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={formData.stateSalesHead}
                        onChange={(e) => setFormData({ ...formData, stateSalesHead: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                      <input
                        type="tel"
                        value={formData.stateSalesHeadPhone || ""}
                        onChange={(e) => setFormData({ ...formData, stateSalesHeadPhone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email ID</label>
                      <input
                        type="email"
                        value={formData.stateSalesHeadEmail}
                        onChange={(e) => setFormData({ ...formData, stateSalesHeadEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingOEM(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <Check className="w-5 h-5" />
                    <span>{editingOEM ? "Update OEM" : "Register OEM"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

