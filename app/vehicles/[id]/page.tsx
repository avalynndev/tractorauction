"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IndianRupee, MapPin, Calendar, Truck, ArrowLeft, Phone, MessageCircle, Gavel, FileCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import ReviewsSection from "@/components/vehicles/ReviewsSection";
import RTOTooltip from "@/components/vehicles/RTOTooltip";
import BackButton from "@/components/navigation/BackButton";
import VideoPlayer from "@/components/video/VideoPlayer";
import VerificationBadge from "@/components/blockchain/VerificationBadge";
import VerificationDetails from "@/components/blockchain/VerificationDetails";
import PhotoGallery from "@/components/vehicles/PhotoGallery";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Vehicle {
  id: string;
  vehicleType: string;
  saleType: string;
  status: string;
  saleAmount: number;
  basePrice: number | null;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  registrationNumber: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  hoursRun: string | null;
  state: string;
  district?: string | null;
  runningCondition: string;
  insuranceStatus: string;
  rcCopyStatus: string;
  rcCopyType: string | null;
  financeNocPapers?: string | null;
  readyForToken?: string | null;
  clutchType: string | null;
  ipto: boolean | null;
  drive: string | null;
  steering: string | null;
  tyreBrand: string | null;
  otherFeatures: string | null;
  isCertified?: boolean;
  isFinanceAvailable?: boolean;
  mainPhoto: string | null;
  subPhotos: string[];
  seller: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
  auction?: {
    id: string;
    currentBid: number;
    reservePrice?: number;
    minimumIncrement?: number;
  };
  inspectionReports?: Array<{
    id: string;
    inspectionDate: string;
    inspectionType: string;
    status: string;
    overallCondition?: string;
    issuesCount: number;
    criticalIssues: number;
    verifiedAt?: string;
  }>;
}

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vehicleId = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoGallery, setPhotoGallery] = useState<{ photos: string[]; initialIndex: number } | null>(null);

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
    }
  }, [vehicleId]);

  const fetchVehicleDetails = async () => {
    try {
      const response = await fetch(`/api/vehicles/${vehicleId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setVehicle(data);
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to load vehicle" }));
        console.error("Error fetching vehicle:", errorData);
        toast.error(errorData.message || "Vehicle not found");
        // Try to determine redirect from URL or default to auctions
        const referrer = document.referrer;
        if (referrer.includes("/auctions")) {
          router.push("/auctions");
        } else {
          router.push("/preapproved");
        }
      }
    } catch (error: any) {
      console.error("Error fetching vehicle details:", error);
      toast.error("Failed to load vehicle details");
      const referrer = document.referrer;
      if (referrer.includes("/auctions")) {
        router.push("/auctions");
      } else {
        router.push("/preapproved");
      }
    } finally {
      setLoading(false);
    }
  };

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handlePurchase = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to purchase");
      router.push("/login");
      return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to purchase");
      router.push("/login");
      return;
    }

    if (isProcessingPayment) {
      return; // Prevent multiple clicks
    }

    setIsProcessingPayment(true);
    setPurchasing(true);

    try {
      // Create payment order
      const response = await fetch("/api/purchases/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: vehicle.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate purchase");
        setIsProcessingPayment(false);
        setPurchasing(false);
        return;
      }

      // Check if test mode (no Razorpay configured)
      if (result.testMode) {
        toast.success("Purchase completed successfully!");
        setShowPurchaseModal(false);
        // Refresh vehicle data to show updated status
        fetchVehicleDetails();
        // Redirect to my account after a short delay
        setTimeout(() => {
          router.push("/my-account");
        }, 2000);
        setIsProcessingPayment(false);
        setPurchasing(false);
        return;
      }

      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        toast.error("Payment gateway is loading. Please try again in a moment.");
        setIsProcessingPayment(false);
        setPurchasing(false);
        return;
      }

      // Calculate escrow fee for display
      const escrowFeePercentage = 0.02;
      const escrowFee = Math.min(
        Math.max(result.purchasePrice * escrowFeePercentage, 500),
        5000
      );

      // Initialize Razorpay checkout
      const options = {
        key: result.key, // Razorpay Key ID
        amount: result.amount * 100, // Amount in paise
        currency: result.currency || "INR",
        name: "Tractor Auction",
        description: `Purchase: ${vehicle.tractorBrand} ${vehicle.tractorModel || ""} ${vehicle.engineHP} HP`,
        order_id: result.orderId,
        // Enable all payment methods including UPI
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async function (response: any) {
          // Payment successful - verify with backend
          try {
            const callbackResponse = await fetch("/api/purchases/payment-callback", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                purchaseId: result.purchaseId,
                amount: result.amount,
              }),
            });

            const callbackResult = await callbackResponse.json();

            if (callbackResponse.ok && callbackResult.success) {
              toast.success("Payment successful! Purchase confirmed.");
              setShowPurchaseModal(false);
              // Refresh vehicle data to show updated status
              fetchVehicleDetails();
              // Redirect to my account after a short delay
              setTimeout(() => {
                router.push("/my-account");
              }, 2000);
            } else {
              toast.error(callbackResult.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment callback error:", error);
            toast.error("An error occurred while verifying payment");
          } finally {
            setIsProcessingPayment(false);
            setPurchasing(false);
          }
        },
        prefill: {
          name: result.name || "",
          email: result.email || "",
          contact: result.contact || "",
        },
        theme: {
          color: "#059669", // Primary color
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            setPurchasing(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
        setIsProcessingPayment(false);
        setPurchasing(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An error occurred. Please try again.");
      setIsProcessingPayment(false);
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Vehicle not found</p>
          <Link href="/preapproved" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Pre-Approved Vehicles
          </Link>
        </div>
      </div>
    );
  }

  const allImages = vehicle.mainPhoto
    ? [
        vehicle.mainPhoto,
        ...(vehicle.subPhotos || [])
      ].filter((img) => img && img.trim() !== "") // Filter out empty/null values, keep all valid images
    : [];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <BackButton 
            href={vehicle.saleType === "AUCTION" ? "/auctions" : "/preapproved"}
            label={`Back to ${vehicle.saleType === "AUCTION" ? "Auctions" : "Pre-Approved Vehicles"}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Video/Image Gallery */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
              {vehicle.videoUrl ? (
                <div className="mb-4">
                  <VideoPlayer
                    src={vehicle.videoUrl}
                    thumbnail={vehicle.videoThumbnail || undefined}
                    className="w-full aspect-video rounded-lg"
                    controls={true}
                  />
                </div>
              ) : null}
              {allImages.length > 0 ? (
                <>
                  <div 
                    className="relative h-64 sm:h-80 md:h-96 bg-gray-200 rounded-lg overflow-hidden mb-3 sm:mb-4 cursor-pointer group"
                    onClick={() => {
                      if (allImages.length > 0) {
                        setPhotoGallery({ photos: allImages, initialIndex: currentImageIndex });
                      }
                    }}
                  >
                    <img
                      src={
                        allImages[currentImageIndex].startsWith("http")
                          ? allImages[currentImageIndex]
                          : `/uploads/${allImages[currentImageIndex]}`
                      }
                      alt={vehicle.tractorBrand}
                      className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                      onError={(e) => {
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    {allImages.length > 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                        {allImages.length} photos - Click to view all
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 text-white font-semibold text-lg transition-opacity">
                        {allImages.length > 1 ? `View all ${allImages.length} photos` : "Click to view photo"}
                      </span>
                    </div>
                  </div>
                  {allImages.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-2">
                      {allImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`relative h-16 sm:h-20 bg-gray-200 rounded overflow-hidden touch-manipulation ${
                            currentImageIndex === index ? "ring-2 ring-primary-600" : ""
                          }`}
                        >
                          <img
                            src={img.startsWith("http") ? img : `/uploads/${img}`}
                            alt={`${vehicle.tractorBrand} ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Truck className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                {vehicle.tractorBrand} {vehicle.tractorModel ? vehicle.tractorModel : ""} {vehicle.engineHP} HP
              </h1>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{vehicle.yearOfMfg}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{vehicle.state}</span>
                </div>
              </div>

              <div className="border-t border-b py-6 my-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-primary-600 flex items-center">
                    <IndianRupee className="w-6 h-6" />
                    <span>
                      {vehicle.saleType === "AUCTION" && vehicle.auction
                        ? vehicle.auction.currentBid.toLocaleString("en-IN")
                        : vehicle.saleAmount.toLocaleString("en-IN")}
                    </span>
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      vehicle.saleType === "AUCTION"
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {vehicle.saleType === "AUCTION" ? "Auction" : "Pre-Approved"}
                  </span>
                </div>
                {/* Badges */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {vehicle.isCertified && (
                    <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      <span>✓</span>
                      <span>Certified Vehicle</span>
                    </div>
                  )}
                  {vehicle.isFinanceAvailable && (
                    <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      <span>₹</span>
                      <span>Finance Available</span>
                    </div>
                  )}
                  <VerificationBadge
                    recordType="VEHICLE"
                    recordId={vehicle.id}
                    className="ml-auto"
                  />
                </div>
                {vehicle.saleType === "AUCTION" && vehicle.auction && (
                  <div className="mt-4 text-sm text-gray-600">
                    {vehicle.auction.reservePrice && (
                      <p>Reserve Price: ₹{vehicle.auction.reservePrice.toLocaleString("en-IN")}</p>
                    )}
                    {vehicle.auction.minimumIncrement && (
                      <p>Minimum Increment: ₹{vehicle.auction.minimumIncrement.toLocaleString("en-IN")}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Key Specifications */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 text-sm sm:text-base">
                <div>
                  <p className="text-sm text-gray-500">Vehicle Type</p>
                  <p className="font-semibold">{vehicle.vehicleType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tractor Model</p>
                  <p className="font-semibold">{vehicle.tractorModel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Engine HP</p>
                  <p className="font-semibold">{vehicle.engineHP}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Running Condition</p>
                  <p className="font-semibold">{vehicle.runningCondition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Insurance Status</p>
                  <p className="font-semibold">{vehicle.insuranceStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">RC Copy Status</p>
                  <p className="font-semibold">{vehicle.rcCopyStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Finance NOC Papers</p>
                  <p className="font-semibold">{vehicle.financeNocPapers || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ready For Token (Name Transfer)</p>
                  <p className="font-semibold">{vehicle.readyForToken || "N/A"}</p>
                </div>
              </div>

              {/* Purchase/Bid Button */}
              {vehicle.saleType === "AUCTION" ? (
                <Link
                  href={`/auctions/${vehicle.auction?.id}/live`}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mb-4 flex items-center justify-center space-x-2 touch-manipulation text-base"
                >
                  <Gavel className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Go to Live Auction</span>
                </Link>
              ) : vehicle.status === "SOLD" ? (
                <button
                  disabled
                  className="w-full bg-gray-400 text-white py-3 rounded-lg font-semibold cursor-not-allowed mb-4 touch-manipulation text-base"
                >
                  Already Sold
                </button>
              ) : (
                <button
                  onClick={handlePurchase}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4 touch-manipulation text-base"
                >
                  Purchase Now
                </button>
              )}

              {/* Contact Seller */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Contact Seller:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a
                    href={`tel:${vehicle.seller.phoneNumber}`}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-green-700 transition-colors touch-manipulation text-base"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call</span>
                  </a>
                  <a
                    href={`https://wa.me/91${vehicle.seller.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Specifications */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold mb-6">Detailed Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Registration Number</p>
              {vehicle.registrationNumber ? (
                <RTOTooltip
                  registrationNumber={vehicle.registrationNumber}
                  chassisNumber={vehicle.chassisNumber}
                  engineNumber={vehicle.engineNumber}
                >
                  <p className="font-semibold text-primary-600 hover:text-primary-700">
                    {vehicle.registrationNumber}
                  </p>
                </RTOTooltip>
              ) : (
                <p className="font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Engine Number</p>
              {vehicle.engineNumber ? (
                <RTOTooltip
                  registrationNumber={vehicle.registrationNumber}
                  chassisNumber={vehicle.chassisNumber}
                  engineNumber={vehicle.engineNumber}
                >
                  <p className="font-semibold text-primary-600 hover:text-primary-700">
                    {vehicle.engineNumber}
                  </p>
                </RTOTooltip>
              ) : (
                <p className="font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Chassis Number</p>
              {vehicle.chassisNumber ? (
                <RTOTooltip
                  registrationNumber={vehicle.registrationNumber}
                  chassisNumber={vehicle.chassisNumber}
                  engineNumber={vehicle.engineNumber}
                >
                  <p className="font-semibold text-primary-600 hover:text-primary-700">
                    {vehicle.chassisNumber}
                  </p>
                </RTOTooltip>
              ) : (
                <p className="font-semibold">N/A</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Hours Run</p>
              <p className="font-semibold">{vehicle.hoursRun || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">RC Copy Type</p>
              <p className="font-semibold">{vehicle.rcCopyType || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Clutch Type</p>
              <p className="font-semibold">{vehicle.clutchType || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IPTO</p>
              <p className="font-semibold">
                {vehicle.ipto !== null ? (vehicle.ipto ? "Yes" : "No") : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Drive</p>
              <p className="font-semibold">{vehicle.drive || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Steering</p>
              <p className="font-semibold">{vehicle.steering || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tyre Brand</p>
              <p className="font-semibold">{vehicle.tyreBrand || "N/A"}</p>
            </div>
            {vehicle.otherFeatures && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Other Features</p>
                <p className="font-semibold">{vehicle.otherFeatures}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inspection Reports Section */}
      {vehicle.inspectionReports && vehicle.inspectionReports.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileCheck className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Inspection Reports</h2>
          </div>
          <div className="space-y-4">
            {vehicle.inspectionReports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {report.inspectionType}
                      </span>
                      {report.status === "APPROVED" && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-semibold">Verified</span>
                        </div>
                      )}
                      {report.criticalIssues > 0 && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            {report.criticalIssues} Critical Issue{report.criticalIssues > 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Inspection Date</p>
                        <p className="text-sm font-semibold">
                          {new Date(report.inspectionDate).toLocaleDateString()}
                        </p>
                      </div>
                      {report.overallCondition && (
                        <div>
                          <p className="text-xs text-gray-500">Overall Condition</p>
                          <p className="text-sm font-semibold text-blue-600">
                            {report.overallCondition}
                          </p>
                        </div>
                      )}
                      {report.issuesCount > 0 && (
                        <div>
                          <p className="text-xs text-gray-500">Issues Found</p>
                          <p className="text-sm font-semibold">
                            {report.issuesCount} issue{report.issuesCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      )}
                      {report.verifiedAt && (
                        <div>
                          <p className="text-xs text-gray-500">Verified On</p>
                          <p className="text-sm font-semibold">
                            {new Date(report.verifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/inspections/${report.id}`}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold inline-block"
                  >
                    View Full Report
                  </Link>
                </div>
              </div>
            ))}
          </div>
          {vehicle.inspectionReports.length >= 5 && (
            <p className="text-sm text-gray-500 mt-4 text-center">
              Showing latest 5 inspection reports
            </p>
          )}
        </div>
      )}

      {/* Blockchain Verification */}
      <div className="mt-8">
        <VerificationDetails
          recordType="VEHICLE"
          recordId={vehicle.id}
        />
      </div>

      {/* Reviews Section */}
      <div className="mt-8">
        <ReviewsSection
          vehicleId={vehicleId}
          isAuthenticated={!!(typeof window !== "undefined" && (localStorage.getItem("token") || sessionStorage.getItem("token")))}
        />
      </div>

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && vehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Confirm Purchase</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Complete your purchase by making a secure payment. Your payment will be held in escrow until the seller approves the transaction.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="font-semibold mb-2">{vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP</p>
                <p className="text-sm text-gray-600 mb-2">Year: {vehicle.yearOfMfg}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Vehicle Price:</span>
                    <span className="font-semibold text-lg flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      <span>{vehicle.saleAmount.toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Escrow Fee (2%):</span>
                    <span className="text-gray-700 flex items-center">
                      <IndianRupee className="w-3 h-3" />
                      <span>{Math.min(Math.max(vehicle.saleAmount * 0.02, 500), 5000).toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600 flex items-center">
                      <IndianRupee className="w-6 h-6" />
                      <span>{(vehicle.saleAmount + Math.min(Math.max(vehicle.saleAmount * 0.02, 500), 5000)).toLocaleString("en-IN")}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Secure Payment:</strong> Your payment will be securely held in escrow. The seller will receive the funds only after approving the purchase.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPurchaseModal(false)}
                disabled={purchasing}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmPurchase}
                disabled={purchasing || isProcessingPayment}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing || isProcessingPayment ? "Processing Payment..." : "Proceed to Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {photoGallery && (
        <PhotoGallery
          photos={photoGallery.photos}
          isOpen={!!photoGallery}
          onClose={() => setPhotoGallery(null)}
          initialIndex={photoGallery.initialIndex}
        />
      )}
    </div>
  );
}

