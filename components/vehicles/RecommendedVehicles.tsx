"use client";

import { useState, useEffect } from "react";
import { IndianRupee, MapPin, Calendar, Truck } from "lucide-react";
import Link from "next/link";
import VehicleActions from "./VehicleActions";
import QuickViewModal from "./QuickViewModal";

interface Vehicle {
  id: string;
  vehicleType: string;
  saleType: string;
  saleAmount: number;
  tractorBrand: string;
  tractorModel?: string | null;
  engineHP: string;
  yearOfMfg: number;
  state: string;
  district?: string | null;
  mainPhoto: string | null;
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

interface RecommendedVehiclesProps {
  limit?: number;
  title?: string;
  showQuickView?: boolean;
}

export default function RecommendedVehicles({
  limit = 6,
  title = "Recommended for You",
  showQuickView = true,
}: RecommendedVehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const loadVehicles = async () => {
      if (isMounted) {
        await fetchRecommendedVehicles(abortController);
      }
    };

    loadVehicles();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [limit]);

  const fetchRecommendedVehicles = async (abortController?: AbortController) => {
    const controller = abortController || new AbortController();
    setLoading(true);
    
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      let response: Response;
      try {
        response = await fetch(`/api/vehicles/recommended?limit=${limit}`, {
          headers,
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle network errors silently
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          setLoading(false);
          return; // Silently ignore aborted/timeout requests
        }
        
        // Network error - silently fail (recommended vehicles are not critical)
        setLoading(false);
        return;
      }

      if (controller.signal.aborted) {
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error: any) {
      // Silently handle errors - recommended vehicles are not critical
      if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error fetching recommended vehicles:", error);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickView = (vehicle: Vehicle) => {
    setQuickViewVehicle(vehicle);
    setIsQuickViewOpen(true);
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <>
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48 bg-gray-200">
                {vehicle.mainPhoto ? (
                  <img
                    src={
                      vehicle.mainPhoto.startsWith("http")
                        ? vehicle.mainPhoto
                        : `/uploads/${vehicle.mainPhoto}`
                    }
                    alt={vehicle.tractorBrand}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => showQuickView && handleQuickView(vehicle)}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Truck className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-2 right-2 z-10">
                  <VehicleActions
                    vehicleId={vehicle.id}
                    saleType={vehicle.saleType as "AUCTION" | "PREAPPROVED"}
                  />
                </div>
                {vehicle.saleType === "AUCTION" && vehicle.auction && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                    Auction
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">
                  {vehicle.tractorBrand} {vehicle.engineHP} HP
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Year: {vehicle.yearOfMfg}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>
                      {vehicle.district ? `${vehicle.district}, ` : ""}
                      {vehicle.state}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center text-primary-600 font-bold text-xl">
                    <IndianRupee className="w-5 h-5" />
                    <span>
                      {vehicle.saleType === "AUCTION" && vehicle.auction
                        ? vehicle.auction.currentBid.toLocaleString("en-IN")
                        : vehicle.saleAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  {showQuickView ? (
                    <button
                      onClick={() => handleQuickView(vehicle)}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Quick View
                    </button>
                  ) : (
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      View Details →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal
          vehicle={quickViewVehicle}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </>
  );
}












