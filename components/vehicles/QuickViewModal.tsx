"use client";

import { useState, useEffect } from "react";
import { X, IndianRupee, MapPin, Calendar, Truck, Heart, Bookmark, Eye, Share2, ArrowLeft, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import VehicleActions from "./VehicleActions";

interface Vehicle {
  id: string;
  vehicleType: string;
  saleType: string;
  saleAmount: number;
  basePrice?: number | null;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  state: string;
  district?: string | null;
  runningCondition: string;
  mainPhoto: string | null;
  subPhotos: string[];
  status: string;
  seller: {
    fullName: string;
    city: string;
    state: string;
  };
  auction?: {
    id: string;
    status: string;
    currentBid: number;
    endTime: string;
  };
}

interface QuickViewModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFull?: () => void;
}

export default function QuickViewModal({
  vehicle,
  isOpen,
  onClose,
  onViewFull,
}: QuickViewModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);

  useEffect(() => {
    if (vehicle && isOpen) {
      setCurrentImageIndex(0);
      checkWatchlistStatus();
      if (vehicle.saleType === "AUCTION") {
        checkShortlistStatus();
      }
    }
  }, [vehicle, isOpen]);

  const checkWatchlistStatus = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !vehicle) return;

    try {
      const response = await fetch("/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsInWatchlist(
          data.watchlist?.some((item: any) => item.vehicleId === vehicle.id) || false
        );
      }
    } catch (error) {
      // Silent fail
    }
  };

  const checkShortlistStatus = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !vehicle) return;

    try {
      const response = await fetch("/api/shortlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsShortlisted(
          data.shortlist?.some((item: any) => item.vehicleId === vehicle.id) || false
        );
      }
    } catch (error) {
      // Silent fail
    }
  };

  const handleViewFull = () => {
    if (onViewFull) {
      onViewFull();
    }
    onClose();
  };

  const handleShare = async () => {
    if (!vehicle) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.tractorBrand} ${vehicle.engineHP} HP`,
          text: "Check out this vehicle on Tractor Auction",
          url: `${window.location.origin}/vehicles/${vehicle.id}`,
        });
      } catch (error) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    if (!vehicle) return;
    const url = `${window.location.origin}/vehicles/${vehicle.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const allImages = vehicle
    ? [
        vehicle.mainPhoto,
        ...(vehicle.subPhotos || []),
      ].filter(Boolean)
    : [];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  if (!isOpen || !vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Quick View</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image Gallery */}
            <div className="relative">
              <div className="relative h-64 md:h-80 bg-gray-100 rounded-lg overflow-hidden">
                {allImages.length > 0 ? (
                  <>
                    <img
                      src={
                        allImages[currentImageIndex]?.startsWith("http")
                          ? allImages[currentImageIndex]!
                          : `/uploads/${allImages[currentImageIndex]}`
                      }
                      alt={vehicle.tractorBrand}
                      className="w-full h-full object-cover"
                    />
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                          aria-label="Previous image"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-opacity"
                          aria-label="Next image"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                          {allImages.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`w-2 h-2 rounded-full ${
                                index === currentImageIndex
                                  ? "bg-white"
                                  : "bg-white bg-opacity-50"
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Truck className="w-16 h-16" />
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                        index === currentImageIndex
                          ? "border-primary-600"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={
                          image?.startsWith("http") ? image : `/uploads/${image}`
                        }
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Vehicle Details */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP
                  </h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Year: {vehicle.yearOfMfg}</span>
                    <span className="mx-2">•</span>
                    <MapPin className="w-4 h-4" />
                    <span>
                      {vehicle.district ? `${vehicle.district}, ` : ""}
                      {vehicle.state}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VehicleActions
                    vehicleId={vehicle.id}
                    saleType={vehicle.saleType as "AUCTION" | "PREAPPROVED"}
                    onWatchlistChange={setIsInWatchlist}
                    onShortlistChange={setIsShortlisted}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="mb-4 p-4 bg-primary-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {vehicle.saleType === "AUCTION" && vehicle.auction
                        ? "Current Bid"
                        : "Price"}
                    </p>
                    <div className="flex items-center text-2xl font-bold text-primary-600">
                      <IndianRupee className="w-6 h-6" />
                      <span>
                        {vehicle.saleType === "AUCTION" && vehicle.auction
                          ? vehicle.auction.currentBid.toLocaleString("en-IN")
                          : vehicle.saleAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                  {vehicle.saleType === "AUCTION" && vehicle.auction && (
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          vehicle.auction.status === "LIVE"
                            ? "bg-red-100 text-red-800"
                            : vehicle.auction.status === "ENDED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {vehicle.auction.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Specifications */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Vehicle Type</span>
                  <span className="font-semibold">
                    {vehicle.vehicleType.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Running Condition</span>
                  <span className="font-semibold">{vehicle.runningCondition}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-600">Seller</span>
                  <span className="font-semibold">{vehicle.seller.fullName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Location</span>
                  <span className="font-semibold">
                    {vehicle.seller.city}, {vehicle.seller.state}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Link
                  href={`/vehicles/${vehicle.id}`}
                  onClick={handleViewFull}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors text-center font-semibold flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  View Full Details
                </Link>
                {vehicle.saleType === "AUCTION" && vehicle.auction && (
                  <Link
                    href={`/auctions/${vehicle.auction.id}`}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
                  >
                    {vehicle.auction.status === "LIVE" ? "Bid Now" : "View Auction"}
                  </Link>
                )}
                {vehicle.saleType === "PREAPPROVED" && (
                  <Link
                    href={`/vehicles/${vehicle.id}`}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
                  >
                    Purchase Now
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


























