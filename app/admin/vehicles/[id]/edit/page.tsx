"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { getDistrictsForState } from "@/lib/indian-districts";
import BackButton from "@/components/navigation/BackButton";

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

interface Vehicle {
  id: string;
  vehicleType: string;
  saleType: string;
  saleAmount: number;
  basePrice: number | null;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  registrationNumber?: string | null;
  engineNumber?: string | null;
  chassisNumber?: string | null;
  hoursRun?: string | null;
  state: string;
  district?: string | null;
  runningCondition: string;
  insuranceStatus: string;
  rcCopyStatus: string;
  rcCopyType?: string | null;
  financeNocPapers?: string | null;
  readyForToken?: string | null;
  clutchType?: string | null;
  ipto?: boolean | null;
  drive?: string | null;
  steering?: string | null;
  tyreBrand?: string | null;
  otherFeatures?: string | null;
  status: string;
  mainPhoto?: string | null;
  subPhotos?: string[];
}

export default function AdminEditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [mainPhotoFile, setMainPhotoFile] = useState<File | null>(null);
  const [subPhotoFiles, setSubPhotoFiles] = useState<File[]>([]);
  const [deleteMainPhoto, setDeleteMainPhoto] = useState(false);
  const [deleteSubPhotoIndices, setDeleteSubPhotoIndices] = useState<number[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchVehicle(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  const fetchVehicle = async (token: string) => {
    try {
      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        toast.error("Failed to load vehicle");
        router.push("/admin");
        return;
      }
      const data = await res.json();
      setVehicle({
        ...data,
        subPhotos: data.subPhotos || [],
      });
      // Load districts for the vehicle's state
      if (data.state) {
        const districts = getDistrictsForState(data.state);
        setAvailableDistricts(districts);
      }
    } catch (err) {
      toast.error("Failed to load vehicle");
      router.push("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Vehicle, value: any) => {
    setVehicle((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };
      // Update districts when state changes
      if (field === "state" && value) {
        const districts = getDistrictsForState(value);
        setAvailableDistricts(districts);
        // Reset district if it's not in the new state's districts
        if (updated.district && !districts.includes(updated.district)) {
          updated.district = null;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;

    if (vehicle.status === "SOLD") {
      toast.error("Cannot edit a SOLD vehicle");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const payload: any = {
        vehicleType: vehicle.vehicleType,
        saleType: vehicle.saleType,
        saleAmount: vehicle.saleAmount,
        basePrice: vehicle.basePrice,
        tractorBrand: vehicle.tractorBrand,
        engineHP: vehicle.engineHP,
        yearOfMfg: vehicle.yearOfMfg,
        registrationNumber: vehicle.registrationNumber,
        engineNumber: vehicle.engineNumber,
        chassisNumber: vehicle.chassisNumber,
        hoursRun: vehicle.hoursRun,
        state: vehicle.state,
        runningCondition: vehicle.runningCondition,
        insuranceStatus: vehicle.insuranceStatus,
        rcCopyStatus: vehicle.rcCopyStatus,
        rcCopyType: vehicle.rcCopyType,
        readyForToken: vehicle.readyForToken,
        clutchType: vehicle.clutchType,
        ipto: vehicle.ipto,
        drive: vehicle.drive,
        steering: vehicle.steering,
        tyreBrand: vehicle.tyreBrand,
        otherFeatures: vehicle.otherFeatures,
        status: vehicle.status,
      };

      const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || "Failed to save changes");
        return;
      }

      toast.success("Vehicle updated successfully");
      router.push("/admin");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async () => {
    if (!vehicle) return;

    if (!mainPhotoFile && subPhotoFiles.length === 0 && !deleteMainPhoto && deleteSubPhotoIndices.length === 0) {
      toast.error("No changes to upload");
      return;
    }

    setUploadingImages(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const formData = new FormData();
      
      if (mainPhotoFile) {
        formData.append("mainPhoto", mainPhotoFile);
      }
      
      if (deleteMainPhoto) {
        formData.append("deleteMainPhoto", "true");
      }

      subPhotoFiles.forEach((file) => {
        formData.append("subPhotos", file);
      });

      deleteSubPhotoIndices.forEach((index) => {
        formData.append("deleteSubPhoto", index.toString());
      });

      const res = await fetch(`/api/admin/vehicles/${vehicleId}/images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.message || "Failed to upload images");
        return;
      }

      toast.success("Images updated successfully");
      
      // Update vehicle state with new images
      setVehicle((prev) => 
        prev ? {
          ...prev,
          mainPhoto: result.vehicle.mainPhoto,
          subPhotos: result.vehicle.subPhotos || [],
        } : null
      );

      // Reset form
      setMainPhotoFile(null);
      setSubPhotoFiles([]);
      setDeleteMainPhoto(false);
      setDeleteSubPhotoIndices([]);
      
      // Reset file inputs
      const mainInput = document.getElementById("main-photo-input") as HTMLInputElement;
      const subInput = document.getElementById("sub-photos-input") as HTMLInputElement;
      if (mainInput) mainInput.value = "";
      if (subInput) subInput.value = "";
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const getImageUrl = (imagePath: string | null | undefined): string => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `/uploads/${imagePath}`;
  };

  if (loading || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading vehicle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/admin" label="Back to Admin Dashboard" />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1 text-gray-900">Edit Vehicle (Admin)</h1>
            <p className="text-gray-600 text-sm">
              ID: <span className="font-mono text-xs">{vehicle.id}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.vehicleType}
                onChange={(e) => handleChange("vehicleType", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Type</label>
              <select
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.saleType}
                onChange={(e) => handleChange("saleType", e.target.value)}
              >
                <option value="PREAPPROVED">Preapproved</option>
                <option value="AUCTION">Auction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Amount (₹)</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.saleAmount}
                onChange={(e) => handleChange("saleAmount", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (Auction)</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.basePrice ?? ""}
                onChange={(e) =>
                  handleChange("basePrice", e.target.value === "" ? null : Number(e.target.value))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tractor Brand</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.tractorBrand}
                onChange={(e) => handleChange("tractorBrand", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tractor Model</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.tractorModel ?? ""}
                onChange={(e) => handleChange("tractorModel", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engine HP</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.engineHP}
                onChange={(e) => handleChange("engineHP", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year of Mfg</label>
              <input
                type="number"
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.yearOfMfg}
                onChange={(e) => handleChange("yearOfMfg", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.state}
                onChange={(e) => handleChange("state", e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <select
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                value={vehicle.district || ""}
                onChange={(e) => handleChange("district", e.target.value || null)}
                disabled={!vehicle.state}
              >
                <option value="">Select District</option>
                {availableDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
              {!vehicle.state && (
                <p className="mt-1 text-xs text-gray-500">Please select a state first</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.registrationNumber ?? ""}
                onChange={(e) => handleChange("registrationNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Engine Number</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.engineNumber ?? ""}
                onChange={(e) => handleChange("engineNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chassis Number</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.chassisNumber ?? ""}
                onChange={(e) => handleChange("chassisNumber", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hours Run</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.hoursRun ?? ""}
                onChange={(e) => handleChange("hoursRun", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Running Condition</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.runningCondition}
                onChange={(e) => handleChange("runningCondition", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Status</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.insuranceStatus}
                onChange={(e) => handleChange("insuranceStatus", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RC Copy Status</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.rcCopyStatus}
                onChange={(e) => handleChange("rcCopyStatus", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RC Copy Type</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.rcCopyType ?? ""}
                onChange={(e) => handleChange("rcCopyType", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finance NOC Papers</label>
              <select
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.financeNocPapers ?? ""}
                onChange={(e) => handleChange("financeNocPapers", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clutch Type</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.clutchType ?? ""}
                onChange={(e) => handleChange("clutchType", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.drive ?? ""}
                onChange={(e) => handleChange("drive", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Steering</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.steering ?? ""}
                onChange={(e) => handleChange("steering", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tyre Brand</label>
              <input
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                value={vehicle.tyreBrand ?? ""}
                onChange={(e) => handleChange("tyreBrand", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Features</label>
              <textarea
                className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                rows={3}
                value={vehicle.otherFeatures ?? ""}
                onChange={(e) => handleChange("otherFeatures", e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ready For Token (Name Transfer)</label>
                <select
                  className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                  value={vehicle.readyForToken ?? ""}
                  onChange={(e) => handleChange("readyForToken", e.target.value || null)}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="Ready For Token">Ready For Token</option>
                  <option value="Within 15 Days">Within 15 Days</option>
                  <option value="Within 10 Days">Within 10 Days</option>
                  <option value="Within 5 Days">Within 5 Days</option>
                  <option value="Within 2 Days">Within 2 Days</option>
                </select>
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={vehicle.ipto === true}
                  onChange={(e) => handleChange("ipto", e.target.checked)}
                />
                <span className="text-sm text-gray-700">IPTO</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2.5 sm:py-2 border rounded-md text-base"
                  value={vehicle.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="AUCTION">AUCTION</option>
                  <option value="REJECTED">REJECTED</option>
                  {/* SOLD is intentionally omitted from manual editing */}
                </select>
              </div>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="border-t pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Vehicle Images
            </h2>

            {/* Current Main Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Main Photo
              </label>
              {vehicle.mainPhoto && !deleteMainPhoto && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={getImageUrl(vehicle.mainPhoto)}
                    alt="Main photo"
                    className="w-48 h-48 object-cover rounded-lg border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-vehicle.jpg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setDeleteMainPhoto(true)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    title="Delete main photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {deleteMainPhoto && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Main photo will be deleted. Upload a new one to replace it.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteMainPhoto(false)}
                    className="mt-2 text-sm text-yellow-700 hover:underline"
                  >
                    Cancel deletion
                  </button>
                </div>
              )}
              <input
                id="main-photo-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setMainPhotoFile(e.target.files[0]);
                    setDeleteMainPhoto(false);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              {mainPhotoFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {mainPhotoFile.name}
                </p>
              )}
            </div>

            {/* Current Sub Photos */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Photos ({vehicle.subPhotos?.length || 0} current)
              </label>
              {vehicle.subPhotos && vehicle.subPhotos.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {vehicle.subPhotos.map((photo, index) => {
                    if (deleteSubPhotoIndices.includes(index)) return null;
                    return (
                      <div key={index} className="relative">
                        <img
                          src={getImageUrl(photo)}
                          alt={`Sub photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-vehicle.jpg";
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteSubPhotoIndices([...deleteSubPhotoIndices, index]);
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                          title="Delete photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {deleteSubPhotoIndices.length > 0 && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    {deleteSubPhotoIndices.length} photo(s) will be deleted.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteSubPhotoIndices([])}
                    className="mt-2 text-sm text-yellow-700 hover:underline"
                  >
                    Cancel deletion
                  </button>
                </div>
              )}
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add("border-primary-500", "bg-primary-50");
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove("border-primary-500", "bg-primary-50");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove("border-primary-500", "bg-primary-50");
                  const files = Array.from(e.dataTransfer.files).filter((file) =>
                    file.type.startsWith("image/")
                  );
                  if (files.length > 0) {
                    setSubPhotoFiles([...subPhotoFiles, ...files]);
                  }
                }}
                onClick={() => {
                  document.getElementById("sub-photos-input")?.click();
                }}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop multiple images here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports multiple image selection (Ctrl+Click or Cmd+Click)
                </p>
              </div>
              <input
                id="sub-photos-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    setSubPhotoFiles([...subPhotoFiles, ...Array.from(e.target.files)]);
                  }
                }}
                className="hidden"
              />
              {subPhotoFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected {subPhotoFiles.length} photo(s):
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {subPhotoFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-24 object-cover rounded border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setSubPhotoFiles(subPhotoFiles.filter((_, i) => i !== index));
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {subPhotoFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">
                    Selected {subPhotoFiles.length} photo(s):
                  </p>
                  <ul className="text-xs text-gray-500 list-disc list-inside">
                    {subPhotoFiles.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Upload Images Button */}
            {(mainPhotoFile || subPhotoFiles.length > 0 || deleteMainPhoto || deleteSubPhotoIndices.length > 0) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleImageUpload}
                  disabled={uploadingImages}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50 flex items-center"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingImages ? "Uploading..." : "Upload Images"}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-primary-600 text-white rounded-md text-sm hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


