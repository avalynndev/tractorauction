"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, X, AlertCircle, FileText, ShoppingCart, Gavel, Truck, IndianRupee, Calendar, Save } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/navigation/BackButton";
import { useDraftSave } from "@/hooks/useDraftSave";

const disputeSchema = z.object({
  purchaseId: z.string().optional(),
  auctionId: z.string().optional(),
  vehicleId: z.string().optional(),
  disputeType: z.enum([
    "REFUND_REQUEST",
    "RETURN_REQUEST",
    "QUALITY_ISSUE",
    "MISMATCH_DESCRIPTION",
    "DELIVERY_ISSUE",
    "PAYMENT_ISSUE",
    "SELLER_MISCONDUCT",
    "FRAUD",
    "OTHER",
  ]),
  reason: z.string().min(5, "Reason must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional().default("MEDIUM"),
});

type DisputeForm = z.infer<typeof disputeSchema>;

const disputeTypes = [
  { value: "REFUND_REQUEST", label: "Refund Request", description: "Request a refund for your purchase" },
  { value: "RETURN_REQUEST", label: "Return Request", description: "Request to return the vehicle" },
  { value: "QUALITY_ISSUE", label: "Quality Issue", description: "Vehicle has quality or condition issues" },
  { value: "MISMATCH_DESCRIPTION", label: "Mismatch Description", description: "Vehicle doesn't match the description" },
  { value: "DELIVERY_ISSUE", label: "Delivery Issue", description: "Problems with delivery or shipping" },
  { value: "PAYMENT_ISSUE", label: "Payment Issue", description: "Issues related to payment" },
  { value: "SELLER_MISCONDUCT", label: "Seller Misconduct", description: "Report seller behavior issues" },
  { value: "FRAUD", label: "Fraud", description: "Suspected fraudulent activity" },
  { value: "OTHER", label: "Other", description: "Other issues not listed" },
];

interface Purchase {
  id: string;
  purchasePrice: number;
  purchaseType: string;
  status: string;
  createdAt: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    mainPhoto: string | null;
    vehicleType: string;
    state: string;
  };
}

interface Auction {
  id: string;
  status: string;
  currentBid: number;
  startTime: string;
  endTime: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    mainPhoto: string | null;
  };
}

export default function NewDisputePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [loadingAuctions, setLoadingAuctions] = useState(false);
  const [selectionType, setSelectionType] = useState<"purchase" | "auction" | "none">("none");

  const purchaseId = searchParams.get("purchaseId");
  const auctionId = searchParams.get("auctionId");
  const vehicleId = searchParams.get("vehicleId");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      purchaseId: purchaseId || undefined,
      auctionId: auctionId || undefined,
      vehicleId: vehicleId || undefined,
      priority: "MEDIUM",
    },
    mode: "onChange", // Validate on change for better UX
  });

  const selectedDisputeType = watch("disputeType");
  const selectedPurchaseId = watch("purchaseId");
  const selectedAuctionId = watch("auctionId");
  const selectedVehicleId = watch("vehicleId");
  const formValues = watch();

  // Prepare draft data
  const draftData = {
    formValues,
    evidenceFileNames: evidenceFiles.map(f => f.name),
  };

  // Draft saving hook
  const { clearDraft, hasDraft } = useDraftSave({
    storageKey: "dispute-form-draft",
    data: draftData,
    enabled: true,
    debounceMs: 1500,
    onLoad: (draft: any) => {
      if (draft.formValues) {
        Object.entries(draft.formValues).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            setValue(key as any, value);
          }
        });
      }
      if (draft.evidenceFileNames && draft.evidenceFileNames.length > 0) {
        toast.success("Draft restored! Please re-upload your evidence files.", { duration: 5000 });
      } else {
        toast.success("Draft restored!", { duration: 3000 });
      }
    },
  });

  useEffect(() => {
    // If purchaseId, auctionId, or vehicleId is provided in URL, set selection type
    if (purchaseId) {
      setSelectionType("purchase");
      setValue("purchaseId", purchaseId);
    } else if (auctionId) {
      setSelectionType("auction");
      setValue("auctionId", auctionId);
    } else if (vehicleId) {
      setValue("vehicleId", vehicleId);
    }
  }, [purchaseId, auctionId, vehicleId, setValue]);

  useEffect(() => {
    // Fetch purchases and auctions when component mounts
    const token = localStorage.getItem("token");
    if (token) {
      fetchPurchases(token);
      fetchAuctions(token);
    }
  }, []);

  const fetchPurchases = async (token: string) => {
    setLoadingPurchases(true);
    try {
      const response = await fetch("/api/my-account/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchAuctions = async (token: string) => {
    setLoadingAuctions(true);
    try {
      const response = await fetch("/api/my-account/auctions/buyer", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAuctions(data || []);
      }
    } catch (error) {
      console.error("Error fetching auctions:", error);
    } finally {
      setLoadingAuctions(false);
    }
  };

  const handleEvidenceUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingEvidence(true);
    try {
      const newFiles = Array.from(files);
      const formData = new FormData();

      newFiles.forEach((file) => {
        formData.append("files", file);
      });

      // TODO: Upload to Cloudinary or storage service
      // For now, we'll just store file names (in production, upload to Cloudinary)
      const uploadedUrls = newFiles.map((file) => {
        // In production, this would be the Cloudinary URL
        return URL.createObjectURL(file);
      });

      setEvidenceFiles((prev) => [...prev, ...newFiles]);
      setEvidenceUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success("Evidence files added");
    } catch (error) {
      console.error("Error uploading evidence:", error);
      toast.error("Failed to upload evidence files");
    } finally {
      setUploadingEvidence(false);
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DisputeForm) => {
    // Validate dispute type is selected
    if (!data.disputeType) {
      toast.error("Please select a dispute type");
      return;
    }

    // Validate that at least one related entity is provided
    const hasPurchase = data.purchaseId && data.purchaseId.trim() !== "";
    const hasAuction = data.auctionId && data.auctionId.trim() !== "";
    const hasVehicle = data.vehicleId && data.vehicleId.trim() !== "";

    if (!hasPurchase && !hasAuction && !hasVehicle) {
      toast.error("Please select a purchase or auction to file a dispute");
      return;
    }

    // Validate required fields
    if (!data.reason || data.reason.trim().length < 5) {
      toast.error("Please provide a reason (at least 5 characters)");
      return;
    }

    if (!data.description || data.description.trim().length < 20) {
      toast.error("Please provide a detailed description (at least 20 characters)");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // In production, upload evidence files to Cloudinary first
      // For now, using placeholder URLs
      const evidence = evidenceUrls;

      // Prepare the request body, ensuring empty strings are converted to undefined
      const requestBody: any = {
        disputeType: data.disputeType,
        reason: data.reason.trim(),
        description: data.description.trim(),
        evidence: evidence || [],
        priority: data.priority || "MEDIUM",
      };

      // Only include IDs if they have values
      if (hasPurchase) {
        requestBody.purchaseId = data.purchaseId;
      } else if (hasAuction) {
        requestBody.auctionId = data.auctionId;
      } else if (hasVehicle) {
        requestBody.vehicleId = data.vehicleId;
      }

      console.log("Submitting dispute with data:", requestBody);

      const response = await fetch("/api/disputes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        // Clear draft on successful submission
        clearDraft();
        toast.success("Dispute filed successfully!");
        router.push("/my-account/disputes");
      } else {
        console.error("Dispute filing error:", result);
        toast.error(result.message || "Failed to file dispute");
        if (result.errors) {
          console.error("Validation errors:", result.errors);
        }
      }
    } catch (error) {
      console.error("Error filing dispute:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <BackButton href="/my-account/disputes" label="Back to My Disputes" />

        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">File a Dispute</h1>
              <p className="text-gray-600 mb-6">
                Please provide detailed information about your dispute. Our team will review it and get back to you.
              </p>
            </div>
            {hasDraft() && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Draft saved</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Select Purchase, Auction, or Vehicle */}
            {!purchaseId && !auctionId && !vehicleId && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border-2 border-gray-200">
                <label className="block text-sm font-bold text-gray-900 mb-4">
                  Select Related Item *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the purchase, auction, or vehicle this dispute is about
                </p>

                {/* Selection Type Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionType("purchase");
                      setValue("purchaseId", "");
                      setValue("auctionId", "");
                      setValue("vehicleId", "");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectionType === "purchase"
                        ? "bg-primary-600 text-white shadow-md"
                        : "bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 inline mr-2" />
                    Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectionType("auction");
                      setValue("purchaseId", "");
                      setValue("auctionId", "");
                      setValue("vehicleId", "");
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectionType === "auction"
                        ? "bg-primary-600 text-white shadow-md"
                        : "bg-white text-gray-700 border-2 border-gray-300 hover:border-primary-400"
                    }`}
                  >
                    <Gavel className="w-4 h-4 inline mr-2" />
                    Auction
                  </button>
                </div>

                {/* Purchase Selection */}
                {selectionType === "purchase" && (
                  <div className="mt-4">
                    {loadingPurchases ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading purchases...</p>
                      </div>
                    ) : purchases.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <ShoppingCart className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-yellow-800 font-semibold">No purchases found</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          You need to have made a purchase to file a purchase-related dispute
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {purchases.map((purchase) => (
                          <label
                            key={purchase.id}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedPurchaseId === purchase.id
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              {...register("purchaseId")}
                              value={purchase.id}
                              className="mt-1"
                              onChange={() => {
                                setValue("purchaseId", purchase.id);
                                setValue("auctionId", "");
                                setValue("vehicleId", "");
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {purchase.vehicle.tractorBrand} {purchase.vehicle.tractorModel || ""} {purchase.vehicle.engineHP} HP
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {purchase.vehicle.vehicleType.replace(/_/g, " ")} • {purchase.vehicle.state}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-primary-600">
                                    ₹{purchase.purchasePrice.toLocaleString("en-IN")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {purchase.purchaseType === "AUCTION" ? "Auction" : "Pre-Approved"}
                                  </div>
                                </div>
                              </div>
                              {purchase.vehicle.mainPhoto && (
                                <img
                                  src={
                                    purchase.vehicle.mainPhoto.startsWith("http")
                                      ? purchase.vehicle.mainPhoto
                                      : `/uploads/${purchase.vehicle.mainPhoto}`
                                  }
                                  alt={purchase.vehicle.tractorBrand}
                                  className="w-full h-32 object-cover rounded-lg mt-2"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Auction Selection */}
                {selectionType === "auction" && (
                  <div className="mt-4">
                    {loadingAuctions ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600">Loading auctions...</p>
                      </div>
                    ) : auctions.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                        <Gavel className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-yellow-800 font-semibold">No auctions found</p>
                        <p className="text-xs text-yellow-700 mt-1">
                          You need to have participated in an auction to file an auction-related dispute
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {auctions.map((auction) => (
                          <label
                            key={auction.id}
                            className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedAuctionId === auction.id
                                ? "border-primary-500 bg-primary-50"
                                : "border-gray-200 hover:border-gray-300 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              {...register("auctionId")}
                              value={auction.id}
                              className="mt-1"
                              onChange={() => {
                                setValue("auctionId", auction.id);
                                setValue("purchaseId", "");
                                setValue("vehicleId", "");
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {auction.vehicle.tractorBrand} {auction.vehicle.tractorModel || ""} {auction.vehicle.engineHP} HP
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                                    <span className="flex items-center gap-1">
                                      <IndianRupee className="w-3 h-3" />
                                      {auction.currentBid.toLocaleString("en-IN")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(auction.endTime).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    auction.status === "LIVE" ? "bg-red-100 text-red-800" :
                                    auction.status === "ENDED" ? "bg-gray-100 text-gray-800" :
                                    "bg-yellow-100 text-yellow-800"
                                  }`}>
                                    {auction.status}
                                  </span>
                                </div>
                              </div>
                              {auction.vehicle.mainPhoto && (
                                <img
                                  src={
                                    auction.vehicle.mainPhoto.startsWith("http")
                                      ? auction.vehicle.mainPhoto
                                      : `/uploads/${auction.vehicle.mainPhoto}`
                                  }
                                  alt={auction.vehicle.tractorBrand}
                                  className="w-full h-32 object-cover rounded-lg mt-2"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {(!selectedPurchaseId && !selectedAuctionId && !selectedVehicleId) && (
                  <p className="text-xs text-red-600 mt-2">
                    Please select a purchase or auction to continue
                  </p>
                )}
              </div>
            )}

            {/* Show selected item info if provided via URL */}
            {(purchaseId || auctionId || vehicleId) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Related:</strong>{" "}
                  {purchaseId && "Purchase"}
                  {auctionId && "Auction"}
                  {vehicleId && "Vehicle"}
                </p>
              </div>
            )}

            {/* Dispute Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dispute Type *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {disputeTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedDisputeType === type.value
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      {...register("disputeType")}
                      value={type.value}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{type.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{type.description}</div>
                    </div>
                    {selectedDisputeType === type.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.disputeType && (
                <p className="mt-1 text-sm text-red-600">{errors.disputeType.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason/Title *
              </label>
              <input
                type="text"
                id="reason"
                {...register("reason")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Brief reason for the dispute"
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                id="description"
                {...register("description")}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Please provide a detailed description of the issue..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Minimum 20 characters required</p>
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                id="priority"
                {...register("priority")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Photos, Documents)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="evidence"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => handleEvidenceUpload(e.target.files)}
                  className="hidden"
                  disabled={uploadingEvidence}
                />
                <label
                  htmlFor="evidence"
                  className={`cursor-pointer ${uploadingEvidence ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadingEvidence ? "Uploading..." : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, PDF up to 10MB each
                  </p>
                </label>
              </div>

              {evidenceFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important Information:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Please provide accurate and detailed information</li>
                    <li>Upload relevant evidence to support your dispute</li>
                    <li>Our team will review your dispute within 24-48 hours</li>
                    <li>You will be notified via email/SMS about the status</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isSubmitting ? "Filing Dispute..." : "File Dispute"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

