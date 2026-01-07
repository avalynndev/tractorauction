"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Upload, X, Truck, FileSpreadsheet, CheckCircle, ArrowLeft, Sparkles, Crown, Save } from "lucide-react";
import { getDistrictsForState } from "@/lib/indian-districts";
import BackButton from "@/components/navigation/BackButton";
import { useDraftSave } from "@/hooks/useDraftSave";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const vehicleSchema = z.object({
  vehicleType: z.enum(["USED_TRACTOR", "USED_HARVESTER", "SCRAP_TRACTOR"], {
    errorMap: () => ({ message: "Please select a vehicle type" }),
  }),
  saleType: z.enum(["AUCTION", "PREAPPROVED"], {
    errorMap: () => ({ message: "Please select a sale type" }),
  }),
  saleAmount: z.coerce.number({
    required_error: "Sale amount is required",
    invalid_type_error: "Sale amount must be a number",
  }).min(0, "Sale amount must be greater than 0"),
  tractorBrand: z.string().min(1, "Please select a tractor brand"),
  tractorModel: z.string().optional(),
  engineHP: z.string().min(1, "Engine HP is required"),
  yearOfMfg: z.coerce.number({
    required_error: "Year of manufacture is required",
    invalid_type_error: "Year must be a number",
  }).min(2000, "Year must be 2000 or later").max(2026, "Year cannot be later than 2026"),
  registrationNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  chassisNumber: z.string().optional(),
  hoursRun: z.string().optional(),
  state: z.string()
    .min(1, "Please select a state")
    .refine((val) => val !== "" && val !== null && val !== undefined && val !== "Select State", {
      message: "Please select a state",
    }),
  district: z.string().optional(),
  runningCondition: z.enum(["Self Start", "Push Start", "Towing"], {
    errorMap: () => ({ message: "Please select running condition" }),
  }),
  insuranceStatus: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Please select insurance status" }),
  }),
  rcCopyStatus: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Please select RC copy status" }),
  }),
  rcCopyType: z.enum(["Commercial", "Private"]).optional(),
  financeNocPapers: z.enum(["Available", "Not Available"]).optional(),
  readyForToken: z.enum(["Yes", "Ready For Token", "Within 15 Days", "Within 10 Days", "Within 5 Days", "Within 2 Days"]).optional(),
  clutchType: z.enum(["Single", "Dual"]).optional(),
  ipto: z.coerce.boolean().optional(),
  drive: z.enum(["2 WD", "4 WD"]).optional(),
  steering: z.enum(["Mechanical", "Power"]).optional(),
  tyreBrand: z.string().optional(),
  otherFeatures: z.string().optional(),
  confirmationMessage: z.boolean().refine((val) => val === true, {
    message: "You must confirm the information is true",
  }),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

const tractorBrands = [
  "MAHINDRA", "SWARAJ", "SONALIKA", "TAFE", "POWERTRAC", "FARMTRAC",
  "JOHN DEERE", "NEW HOLLAND", "EICHER", "KUBOTA", "ACE", "INDOFARM",
  "CAPTAIN", "SOLIS", "YANMAR", "OTHER"
];

const tyreBrands = [
  "MRF", "GOOD YEAR", "APOLLO", "BKT", "JK", "CEAT", "REBUTTON", "OTHERS"
];

const otherFeaturesOptions = [
  "Working Battery", "Bumper", "Draw Bar", "Itch", "Top"
];

const years = Array.from({ length: 27 }, (_, i) => 2000 + i);

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

export default function UploadVehiclePage() {
  const router = useRouter();
  const { handleError, handleApiError } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [subPhotos, setSubPhotos] = useState<File[]>([]);
  const [tractorFrontPhoto, setTractorFrontPhoto] = useState<File | null>(null);
  const [tractorLeftPhoto, setTractorLeftPhoto] = useState<File | null>(null);
  const [tractorRightPhoto, setTractorRightPhoto] = useState<File | null>(null);
  const [tractorBackPhoto, setTractorBackPhoto] = useState<File | null>(null);
  const [registrationCopy, setRegistrationCopy] = useState<File | null>(null);
  const [nocCopy, setNocCopy] = useState<File | null>(null);
  const [fitnessCertificate, setFitnessCertificate] = useState<File | null>(null);
  const [pollutionCertificate, setPollutionCertificate] = useState<File | null>(null);
  const [batteryPhoto, setBatteryPhoto] = useState<File | null>(null);
  const [valuationCertificate, setValuationCertificate] = useState<File | null>(null);
  const [engineNumberPhoto, setEngineNumberPhoto] = useState<File | null>(null);
  const [chassisNumberPhoto, setChassisNumberPhoto] = useState<File | null>(null);
  const [otherBrand, setOtherBrand] = useState("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: boolean;
    message: string;
    totalRows?: number;
    successful?: number;
    failed?: number;
    errors?: Array<{ row: number; field: string; message: string }>;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradingMembership, setUpgradingMembership] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      confirmationMessage: false,
      state: "", // Explicitly set empty string as default
    },
    mode: "onChange", // Validate on change for better UX
  });

  const saleType = watch("saleType");
  const tractorBrand = watch("tractorBrand");
  const watchedState = watch("state");
  const formValues = watch();

  // Memoize onLoad callback to prevent infinite loops
  const handleDraftLoad = useCallback((draft: any) => {
    // Restore form values
    if (draft.formValues) {
      Object.entries(draft.formValues).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value);
        }
      });
    }
    // Restore other state
    if (draft.otherBrand) setOtherBrand(draft.otherBrand);
    if (draft.selectedFeatures) setSelectedFeatures(draft.selectedFeatures);
    
    // Show notification about files
    if (draft.fileNames && Object.values(draft.fileNames).some(name => name)) {
      toast.success("Draft restored! Please re-upload your photos.", { duration: 5000 });
    } else {
      toast.success("Draft restored!", { duration: 3000 });
    }
  }, [setValue]);

  // Prepare draft data (excluding files, but including file names)
  // Memoize to prevent infinite loops - only recreate when actual values change
  const draftData = useMemo(() => ({
    formValues,
    otherBrand,
    selectedFeatures,
    fileNames: {
      mainPhoto: mainPhoto?.name || null,
      tractorFrontPhoto: tractorFrontPhoto?.name || null,
      tractorLeftPhoto: tractorLeftPhoto?.name || null,
      tractorRightPhoto: tractorRightPhoto?.name || null,
      tractorBackPhoto: tractorBackPhoto?.name || null,
      registrationCopy: registrationCopy?.name || null,
      engineNumberPhoto: engineNumberPhoto?.name || null,
      chassisNumberPhoto: chassisNumberPhoto?.name || null,
      nocCopy: nocCopy?.name || null,
      fitnessCertificate: fitnessCertificate?.name || null,
      pollutionCertificate: pollutionCertificate?.name || null,
      batteryPhoto: batteryPhoto?.name || null,
      valuationCertificate: valuationCertificate?.name || null,
    },
  }), [formValues, otherBrand, selectedFeatures, mainPhoto, tractorFrontPhoto, tractorLeftPhoto, tractorRightPhoto, tractorBackPhoto, registrationCopy, engineNumberPhoto, chassisNumberPhoto, nocCopy, fitnessCertificate, pollutionCertificate, batteryPhoto, valuationCertificate]);

  // Draft saving hook
  const { clearDraft, hasDraft } = useDraftSave({
    storageKey: "vehicle-upload-draft",
    data: draftData,
    enabled: true,
    debounceMs: 2000, // Save after 2 seconds of inactivity
    onLoad: handleDraftLoad,
  });

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch user data to check membership
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoadingUser(false);
        return;
      }

      try {
        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, []);

  // Check if user has Diamond membership
  const isDiamondMember = user?.membership?.membershipType === "DIAMOND" && 
    user?.membership?.status === "active" && 
    new Date(user?.membership?.endDate) > new Date();

  // Update districts when state changes
  useEffect(() => {
    if (watchedState && watchedState !== selectedState) {
      const districts = getDistrictsForState(watchedState);
      setAvailableDistricts(districts);
      setSelectedState(watchedState);
    } else if (!watchedState) {
      setAvailableDistricts([]);
      setSelectedState("");
    }
  }, [watchedState, selectedState]);

  const handleMainPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainPhoto(e.target.files[0]);
    }
  };

  const handleSubPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubPhotos(Array.from(e.target.files));
    }
  };

  const removeSubPhoto = (index: number) => {
    setSubPhotos(subPhotos.filter((_, i) => i !== index));
  };

  const handlePhotoChange = (setter: (file: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const removePhoto = (setter: (file: File | null) => void) => () => {
    setter(null);
  };

  const handleBulkUploadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Check if user has Diamond membership
    if (!isDiamondMember) {
      e.target.value = ""; // Clear the file input
      setShowUpgradeModal(true);
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();
      
      // Validate file type
      if (!fileName.endsWith(".csv") && !fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
        toast.error("Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size too large. Maximum size is 10MB.");
        return;
      }

      setBulkUploadFile(file);
      setBulkUploadResult(null); // Clear previous results
    }
  };

  const handleBulkUpload = async () => {
    // Check if user has Diamond membership
    if (!isDiamondMember) {
      setShowUpgradeModal(true);
      return;
    }

    if (!bulkUploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsBulkUploading(true);
    setBulkUploadResult(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", bulkUploadFile);

      const response = await fetch("/api/vehicles/bulk-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Check if response is ok and parse JSON
      let result: any;
      try {
        const text = await response.text();
        if (!text) {
          throw new Error("Empty response from server");
        }
        result = JSON.parse(text);
      } catch (parseError: any) {
        console.error("Failed to parse response:", parseError);
        const errorMsg = `Server error: ${parseError.message || "Invalid response"}. Please check the server console for details.`;
        toast.error(errorMsg);
        setBulkUploadResult({
          success: false,
          message: errorMsg,
        });
        return;
      }

      if (response.ok && result.success) {
        setBulkUploadResult({
          success: true,
          message: result.message || `Successfully uploaded ${result.successful} vehicle(s)`,
          totalRows: result.totalRows,
          successful: result.successful,
          failed: result.failed,
        });
        toast.success(result.message || `Successfully uploaded ${result.successful} vehicle(s)`);
        setBulkUploadFile(null);
        // Reset file input
        const fileInput = document.getElementById("bulk-upload-file") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        // Redirect to my account after a short delay
        setTimeout(() => {
          router.push("/my-account");
        }, 2000);
      } else {
        // Handle both validation errors and other errors
        const errorMessage = result.message || result.error || "Failed to upload vehicles. Please check the errors below.";
        setBulkUploadResult({
          success: false,
          message: errorMessage,
          totalRows: result.totalRows,
          successful: result.successful || 0,
          failed: result.failed || result.totalRows || 0,
          errors: result.errors || [],
        });
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      const errorMessage = error.message || "An error occurred while uploading. Please try again.";
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      toast.error(errorMessage);
      setBulkUploadResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsBulkUploading(false);
    }
  };

  const onSubmit = async (data: VehicleForm) => {
    // Additional validation: Check if state is selected
    if (!data.state || data.state.trim() === "" || data.state === "Select State") {
      toast.error("Please select a state");
      setValue("state", "", { shouldValidate: true });
      trigger("state"); // Trigger validation
      // Scroll to state field
      setTimeout(() => {
        const stateField = document.querySelector('[name="state"]');
        if (stateField) {
          stateField.scrollIntoView({ behavior: "smooth", block: "center" });
          (stateField as HTMLElement).focus();
        }
      }, 100);
      return;
    }

    if (!mainPhoto) {
      toast.error("Please upload a main photo");
      return;
    }

    // Validate required additional photos
    if (!tractorFrontPhoto) {
      toast.error("Please upload Tractor Front Photo");
      return;
    }
    if (!tractorLeftPhoto) {
      toast.error("Please upload Tractor Left Photo");
      return;
    }
    if (!tractorRightPhoto) {
      toast.error("Please upload Tractor Right Photo");
      return;
    }
    if (!tractorBackPhoto) {
      toast.error("Please upload Tractor Back Photo");
      return;
    }
      if (!registrationCopy) {
      toast.error("Please upload Registration Copy");
      return;
    }
    if (!engineNumberPhoto) {
      toast.error("Please upload Engine Number Photo");
      return;
    }
    if (!chassisNumberPhoto) {
      toast.error("Please upload Chassis Number Photo");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      
      // Handle form data properly
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle arrays (like otherFeatures)
          if (Array.isArray(value)) {
            if (value.length > 0) {
              formData.append(key, value.join(", "));
            }
          }
          // Handle booleans
          else if (typeof value === "boolean") {
            formData.append(key, value.toString());
          }
          // Handle other values
          else {
            formData.append(key, value.toString());
          }
        }
      });
      
      // Override tractorBrand if OTHER is selected
      if (tractorBrand === "OTHER" && otherBrand) {
        formData.set("tractorBrand", otherBrand);
      }
      
      // Handle otherFeatures from state
      if (selectedFeatures.length > 0) {
        formData.set("otherFeatures", selectedFeatures.join(", "));
      }
      
      // Append files
      formData.append("mainPhoto", mainPhoto);
      
      // Append categorized photos
      if (tractorFrontPhoto) formData.append("tractorFrontPhoto", tractorFrontPhoto);
      if (tractorLeftPhoto) formData.append("tractorLeftPhoto", tractorLeftPhoto);
      if (tractorRightPhoto) formData.append("tractorRightPhoto", tractorRightPhoto);
      if (tractorBackPhoto) formData.append("tractorBackPhoto", tractorBackPhoto);
      if (registrationCopy) formData.append("registrationCopy", registrationCopy);
      if (nocCopy) formData.append("nocCopy", nocCopy);
      if (fitnessCertificate) formData.append("fitnessCertificate", fitnessCertificate);
      if (pollutionCertificate) formData.append("pollutionCertificate", pollutionCertificate);
      if (batteryPhoto) formData.append("batteryPhoto", batteryPhoto);
      if (valuationCertificate) formData.append("valuationCertificate", valuationCertificate);
      if (engineNumberPhoto) formData.append("engineNumberPhoto", engineNumberPhoto);
      if (chassisNumberPhoto) formData.append("chassisNumberPhoto", chassisNumberPhoto);
      
      // Keep subPhotos for backward compatibility
      subPhotos.forEach((photo) => {
        formData.append("subPhotos", photo);
      });

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/vehicles/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Clear draft on successful submission
        clearDraft();
        toast.success("Vehicle listed successfully! Waiting for admin approval.");
        router.push("/my-account");
      } else {
        await handleApiError(response, { showToast: true, redirectOnAuthError: true });
      }
    } catch (error) {
      handleError(error, { showToast: true, redirectOnAuthError: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/my-account" label="Back to My Account" />
        </div>

        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900">List Your Vehicle</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">
                Fill in the details below to list your vehicle for sale
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Bulk Upload Helper */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                <FileSpreadsheet className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bulk Upload (Multiple Vehicles)</h2>
                {isDiamondMember && (
                  <div className="flex items-center gap-2 mt-1">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-green-600 font-semibold">Diamond Member Feature</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 1: Download Sample Files */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Download Sample Files
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Download the sample CSV or Excel file to understand the required format for bulk upload.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="/samples/vehicle-bulk-upload-sample.csv"
                className="group inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                download
              >
                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Download Sample CSV</span>
              </a>
              <a
                href="/samples/vehicle-bulk-upload-sample.xlsx"
                className="group inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                download
              >
                <FileSpreadsheet className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Download Sample Excel</span>
              </a>
            </div>
          </div>

          {/* Step 2: Fill and Upload */}
          <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-lg p-5 mb-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Fill Your Data & Upload File
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Fill in your vehicle details in the downloaded file and upload it here.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="bulk-upload-file" className="block font-semibold mb-2 text-sm text-gray-700">
                  Select Your Filled File
                </label>
                {!isDiamondMember ? (
                  <button
                    type="button"
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white rounded-lg hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600 transition-all shadow-lg hover:shadow-xl font-bold text-base flex items-center justify-center gap-3 animate-pulse"
                  >
                    <Crown className="w-6 h-6 animate-bounce" />
                    <span>💎 Diamond Membership Required - Click to Upgrade</span>
                    <Crown className="w-6 h-6 animate-bounce" />
                  </button>
                ) : (
                  <>
                    <input
                      id="bulk-upload-file"
                      type="file"
                      accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleBulkUploadFileChange}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer transition-colors text-gray-900 text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    {bulkUploadFile && (
                      <div className="mt-3 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-gray-700 font-semibold">Selected: {bulkUploadFile.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setBulkUploadFile(null);
                              const fileInput = document.getElementById("bulk-upload-file") as HTMLInputElement;
                              if (fileInput) fileInput.value = "";
                            }}
                            className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {isDiamondMember && bulkUploadFile && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={isBulkUploading}
                    className="px-8 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-bold text-base flex items-center gap-2"
                  >
                    {isBulkUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload File</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Upload Results */}
          {bulkUploadResult && (
            <div className={`bg-gradient-to-br rounded-lg p-5 border-2 ${
              bulkUploadResult.success 
                ? "from-green-50 to-green-100 border-green-300" 
                : "from-red-50 to-red-100 border-red-300"
            }`}>
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className={`w-8 h-8 ${bulkUploadResult.success ? "bg-green-600" : "bg-red-600"} text-white rounded-full flex items-center justify-center text-sm font-bold`}>
                  {bulkUploadResult.success ? "✓" : "✗"}
                </span>
                Upload Result
              </h3>
              <div className="flex items-center space-x-2 mb-3">
                {bulkUploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <X className="w-5 h-5 text-red-600" />
                )}
                <p className={`font-bold text-base ${
                  bulkUploadResult.success ? "text-green-800" : "text-red-800"
                }`}>
                  {bulkUploadResult.message}
                </p>
              </div>
              {bulkUploadResult.totalRows !== undefined && (
                <div className="text-sm space-y-2">
                  <div className={`p-3 rounded-lg ${
                    bulkUploadResult.success ? "bg-green-200/50" : "bg-red-200/50"
                  }`}>
                    <p className={`font-semibold ${
                      bulkUploadResult.success ? "text-green-900" : "text-red-900"
                    }`}>
                      Total Rows: {bulkUploadResult.totalRows} | 
                      Successful: {bulkUploadResult.successful} | 
                      Failed: {bulkUploadResult.failed}
                    </p>
                  </div>
                  {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                    <div className="mt-3 bg-white rounded-lg p-4 border border-red-200">
                      <p className="font-bold text-red-800 mb-2">Errors:</p>
                      <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                        {bulkUploadResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index} className="text-xs text-red-700">
                            Row {error.row}, {error.field}: {error.message}
                          </li>
                        ))}
                        {bulkUploadResult.errors.length > 10 && (
                          <li className="text-xs text-red-700 font-semibold">
                            ... and {bulkUploadResult.errors.length - 10} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.error("Form validation errors:", errors);
          // Show detailed error messages
          const errorMessages = Object.entries(errors).map(([field, error]: [string, any]) => {
            return `${field}: ${error?.message || "Invalid value"}`;
          });
          if (errorMessages.length > 0) {
            toast.error(`Please fix the following errors:\n${errorMessages.join("\n")}`, { duration: 5000 });
          } else {
            toast.error("Please fill all required fields correctly");
          }
          // Scroll to first error field
          const firstErrorField = Object.keys(errors)[0];
          if (firstErrorField) {
            const element = document.querySelector(`[name="${firstErrorField}"]`);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              (element as HTMLElement).focus();
            }
          }
        })} className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6 border border-gray-200">
          {/* Vehicle Type */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Vehicle Type *
            </label>
            <select
              {...register("vehicleType")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Vehicle Type</option>
              <option value="USED_TRACTOR">Used Tractor</option>
              <option value="USED_HARVESTER">Used Harvester</option>
              <option value="SCRAP_TRACTOR">Scrap Tractor</option>
            </select>
            {errors.vehicleType && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.vehicleType.message}</p>
            )}
          </div>

          {/* Sale Type */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Type of Sale *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all shadow-md hover:shadow-lg">
                <input
                  type="radio"
                  value="AUCTION"
                  {...register("saleType")}
                  className="mr-3 w-5 h-5 text-primary-600"
                />
                <span className="font-semibold text-gray-900">Auction</span>
              </label>
              <label className="flex items-center p-4 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all shadow-md hover:shadow-lg">
                <input
                  type="radio"
                  value="PREAPPROVED"
                  {...register("saleType")}
                  className="mr-3 w-5 h-5 text-primary-600"
                />
                <span className="font-semibold text-gray-900">Pre-approved</span>
              </label>
            </div>
            {errors.saleType && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.saleType.message}</p>
            )}
          </div>

          {/* Sale Amount */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              {saleType === "AUCTION" ? "Base Price (Hidden)" : "Sale Amount (Visible)"} *
            </label>
            <input
              type="number"
              {...register("saleAmount", { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              placeholder="Enter amount in ₹"
            />
            {errors.saleAmount && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.saleAmount.message}</p>
            )}
          </div>

          {/* Tractor Brand */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Tractor Brand *
            </label>
            <select
              {...register("tractorBrand")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Brand</option>
              {tractorBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
            {tractorBrand === "OTHER" && (
              <input
                type="text"
                value={otherBrand}
                onChange={(e) => setOtherBrand(e.target.value)}
                placeholder="Enter brand name"
                className="w-full mt-3 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              />
            )}
            {errors.tractorBrand && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.tractorBrand.message}</p>
            )}
          </div>

          {/* Tractor Model */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Tractor Model
            </label>
            <input
              type="text"
              {...register("tractorModel")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              placeholder="Enter tractor model (e.g., 575 DI)"
            />
          </div>

          {/* Engine HP */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Engine HP *
            </label>
            <input
              type="text"
              {...register("engineHP")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            />
            {errors.engineHP && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.engineHP.message}</p>
            )}
          </div>

          {/* Year of Manufacturing */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Year of Manufacturing *
            </label>
            <select
              {...register("yearOfMfg", { valueAsNumber: true })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            {errors.yearOfMfg && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.yearOfMfg.message}</p>
            )}
          </div>

          {/* Registration Number */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Registration Number
            </label>
            <input
              type="text"
              {...register("registrationNumber")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            />
          </div>

          {/* Engine Number & Chassis Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Engine Number
              </label>
              <input
                type="text"
                {...register("engineNumber")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              />
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Chassis Number
              </label>
              <input
                type="text"
                {...register("chassisNumber")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              />
            </div>
          </div>

          {/* Hours Run */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Hours Run (or &quot;Meter not working&quot;)
            </label>
            <input
              type="text"
              {...register("hoursRun")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              placeholder="Enter hours or 'Meter not working'"
            />
          </div>

          {/* State */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              State *
            </label>
            <select
              {...register("state", {
                required: "Please select a state",
                validate: (value) => {
                  if (!value || value === "" || value === "Select State") {
                    return "Please select a state";
                  }
                  return true;
                },
              })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select State</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.state.message}</p>
            )}
          </div>

          {/* District */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              District
            </label>
            <select
              {...register("district")}
              disabled={!watchedState}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-200 disabled:cursor-not-allowed bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select District</option>
              {availableDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
            {!watchedState && (
              <p className="mt-2 text-xs text-gray-600 font-medium">Please select a state first</p>
            )}
            {errors.district && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.district.message}</p>
            )}
          </div>

          {/* Running Condition */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Running Condition *
            </label>
            <select
              {...register("runningCondition")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Condition</option>
              <option value="Self Start">Self Start</option>
              <option value="Push Start">Push Start</option>
              <option value="Towing">Towing</option>
            </select>
            {errors.runningCondition && (
              <p className="mt-2 text-sm text-red-600 font-semibold">{errors.runningCondition.message}</p>
            )}
          </div>

          {/* Insurance & RC Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Insurance Status *
              </label>
              <select
                {...register("insuranceStatus")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.insuranceStatus && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.insuranceStatus.message}</p>
              )}
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                RC Copy Status *
              </label>
              <select
                {...register("rcCopyStatus")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.rcCopyStatus && (
                <p className="mt-2 text-sm text-red-600 font-semibold">{errors.rcCopyStatus.message}</p>
              )}
            </div>
          </div>

          {/* RC Copy Type */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              RC Copy Type
            </label>
            <select
              {...register("rcCopyType")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Type</option>
              <option value="Commercial">Commercial</option>
              <option value="Private">Private</option>
            </select>
          </div>

          {/* Finance NOC Papers */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Finance NOC Papers
            </label>
            <select
              {...register("financeNocPapers")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select</option>
              <option value="Available">Available</option>
              <option value="Not Available">Not Available</option>
            </select>
          </div>

          {/* Ready For Token (Name Transfer) */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Ready For Token (Name Transfer)
            </label>
            <select
              {...register("readyForToken")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
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

          {/* Clutch Type, IPTO, Drive, Steering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Clutch Type
              </label>
              <select
                {...register("clutchType")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select Type</option>
                <option value="Single">Single</option>
                <option value="Dual">Dual</option>
              </select>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                IPTO
              </label>
              <select
                {...register("ipto", { 
                  setValueAs: (v) => {
                    if (v === "true") return true;
                    if (v === "false") return false;
                    return undefined;
                  }
                })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Drive
              </label>
              <select
                {...register("drive")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select</option>
                <option value="2 WD">2 WD</option>
                <option value="4 WD">4 WD</option>
              </select>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Steering
              </label>
              <select
                {...register("steering")}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
              >
                <option value="">Select</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Power">Power</option>
              </select>
            </div>
          </div>

          {/* Tyre Brand */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Tyre Brand
            </label>
            <select
              {...register("tyreBrand")}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            >
              <option value="">Select Brand</option>
              {tyreBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Other Features */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Other Features
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherFeaturesOptions.map((feature) => (
                <label key={feature} className="flex items-center p-3 bg-white border-2 border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all shadow-md hover:shadow-lg touch-manipulation">
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(feature)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFeatures([...selectedFeatures, feature]);
                      } else {
                        setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
                      }
                    }}
                    className="mr-3 w-5 h-5 text-primary-600"
                  />
                  <span className="text-sm font-semibold text-gray-900">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-sm font-bold text-gray-900 mb-3">
              Main Photo *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainPhotoChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900 text-base font-medium"
            />
            {mainPhoto && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-semibold">Selected: {mainPhoto.name}</p>
              </div>
            )}
          </div>

          {/* Categorized Additional Photos */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200">
            <label className="block text-lg font-bold text-gray-900 mb-4">
              Additional Photos & Documents
            </label>
            
            {/* Photo Upload Component - Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                { label: "Tractor Front Photo", state: tractorFrontPhoto, setter: setTractorFrontPhoto, required: true, accept: "image/*", icon: "🚜" },
                { label: "Tractor Left Photo", state: tractorLeftPhoto, setter: setTractorLeftPhoto, required: true, accept: "image/*", icon: "⬅️" },
                { label: "Tractor Right Photo", state: tractorRightPhoto, setter: setTractorRightPhoto, required: true, accept: "image/*", icon: "➡️" },
                { label: "Tractor Back Photo", state: tractorBackPhoto, setter: setTractorBackPhoto, required: true, accept: "image/*", icon: "🔙" },
                { label: "Registration Copy", state: registrationCopy, setter: setRegistrationCopy, required: true, accept: "image/*,.pdf", icon: "📄" },
                { label: "Engine Number", state: engineNumberPhoto, setter: setEngineNumberPhoto, required: true, accept: "image/*", icon: "🔧" },
                { label: "Chassis Number", state: chassisNumberPhoto, setter: setChassisNumberPhoto, required: true, accept: "image/*", icon: "🔩" },
                { label: "NOC Copy", state: nocCopy, setter: setNocCopy, required: false, accept: "image/*,.pdf", icon: "📋" },
                { label: "Fitness Certificate", state: fitnessCertificate, setter: setFitnessCertificate, required: false, accept: "image/*,.pdf", icon: "✅" },
                { label: "Pollution Certificate", state: pollutionCertificate, setter: setPollutionCertificate, required: false, accept: "image/*,.pdf", icon: "🌿" },
                { label: "Battery Photo", state: batteryPhoto, setter: setBatteryPhoto, required: false, accept: "image/*", icon: "🔋" },
                { label: "Valuation Certificate", state: valuationCertificate, setter: setValuationCertificate, required: false, accept: "image/*,.pdf", icon: "💰" },
              ] as const).map(({ label, state, setter, required, accept, icon }) => (
                <div key={label} className="relative">
                  <input
                    type="file"
                    accept={accept}
                    onChange={handlePhotoChange(setter)}
                    id={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    className="hidden"
                  />
                  {!state ? (
                    <label
                      htmlFor={`upload-${label.replace(/\s+/g, '-').toLowerCase()}`}
                      className="flex flex-col items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg cursor-pointer hover:from-primary-600 hover:to-primary-700 transition-all shadow-md hover:shadow-lg transform hover:scale-[1.02] font-semibold text-xs sm:text-sm text-center min-h-[100px]"
                    >
                      <span className="text-2xl">{icon}</span>
                      <Upload className="w-4 h-4" />
                      <span className="leading-tight">{label}</span>
                      {required && <span className="text-red-200 text-xs">* Required</span>}
                      {!required && <span className="text-primary-200 text-xs">Optional</span>}
                    </label>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-3 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg shadow-md min-h-[100px] relative">
                      <button
                        type="button"
                        onClick={removePhoto(setter)}
                        className="absolute top-1 right-1 p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-lg">
                        {icon}
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="text-center w-full">
                        <p className="text-xs font-semibold text-gray-900 truncate px-1">{state.name}</p>
                        <p className="text-xs text-gray-600">{(state.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation */}
          <div className="flex items-start p-5 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
            <input
              type="checkbox"
              {...register("confirmationMessage")}
              className="mt-1 mr-3 w-5 h-5 flex-shrink-0 text-primary-600 focus:ring-2 focus:ring-primary-500"
            />
            <label className="text-sm sm:text-base font-semibold text-gray-900">
              I confirm that said information is true and held responsible for any wrong information *
            </label>
          </div>
          {errors.confirmationMessage && (
            <p className="text-sm text-red-600 font-semibold">{errors.confirmationMessage.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-lg font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>Submit Vehicle Listing</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Upgrade to Diamond Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-full mb-4 shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Diamond Membership Required</h3>
              <p className="text-gray-600">
                This feature is available for Diamond Members only
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 rounded-lg p-4 mb-6 border-2 border-purple-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="font-bold text-purple-900">⭐ Premium Diamond Membership ⭐</span>
              </div>
              <ul className="text-sm text-gray-700 space-y-1 text-left">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Bulk Upload Multiple Vehicles</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>365 Days Validity</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Priority Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>All Premium Features</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowUpgradeModal(false);
                  setUpgradingMembership(true);
                  const token = localStorage.getItem("token");
                  if (!token) {
                    toast.error("Please login first");
                    router.push("/login");
                    return;
                  }

                  toast.loading("Preparing Diamond membership upgrade...", { id: "upgrade-diamond" });

                  try {
                    const response = await fetch("/api/membership/purchase", {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        membershipType: "DIAMOND",
                      }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      toast.error(result.message || "Failed to initiate upgrade", { id: "upgrade-diamond" });
                      setUpgradingMembership(false);
                      return;
                    }

                    // Check if test mode
                    if (result.testMode) {
                      toast.success("Membership upgraded successfully!", { id: "upgrade-diamond" });
                      window.location.reload();
                      setUpgradingMembership(false);
                      return;
                    }

                    // Wait for Razorpay
                    if (!razorpayLoaded || !window.Razorpay) {
                      toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: "upgrade-diamond" });
                      setUpgradingMembership(false);
                      return;
                    }

                    toast.dismiss("upgrade-diamond");
                    toast.success("Redirecting to payment gateway...", { duration: 2000 });

                    // Open Razorpay checkout
                    const options = {
                      key: result.key,
                      amount: result.amount * 100,
                      currency: result.currency || "INR",
                      name: "Tractor Auction",
                      description: "Diamond Membership - 365 days",
                      order_id: result.orderId,
                      handler: async function (response: any) {
                        try {
                          const callbackResponse = await fetch("/api/membership/payment-callback", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              orderId: response.razorpay_order_id,
                              paymentId: response.razorpay_payment_id,
                              signature: response.razorpay_signature,
                              userId: result.userId,
                              membershipType: "DIAMOND",
                              amount: result.amount,
                            }),
                          });

                          const callbackResult = await callbackResponse.json();

                          if (callbackResponse.ok && callbackResult.success) {
                            toast.success("Payment successful! Diamond membership activated.");
                            window.location.reload();
                          } else {
                            toast.error(callbackResult.message || "Payment verification failed");
                          }
                        } catch (error) {
                          console.error("Payment callback error:", error);
                          toast.error("An error occurred while verifying payment");
                        } finally {
                          setUpgradingMembership(false);
                        }
                      },
                      theme: {
                        color: "#059669",
                      },
                      modal: {
                        ondismiss: function () {
                          setUpgradingMembership(false);
                          toast.error("Payment cancelled");
                        },
                      },
                    };

                    const razorpay = new window.Razorpay(options);
                    razorpay.on("payment.failed", function (response: any) {
                      console.error("Payment failed:", response);
                      toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
                      setUpgradingMembership(false);
                    });

                    razorpay.open();
                  } catch (error) {
                    console.error("Upgrade error:", error);
                    toast.error("An error occurred. Please try again.", { id: "upgrade-diamond" });
                    setUpgradingMembership(false);
                  }
                }}
                disabled={upgradingMembership}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-lg hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {upgradingMembership ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>Upgrade Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}


