"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, IndianRupee, MapPin, Calendar, Truck, ArrowLeft, Trash2, Eye } from "lucide-react";
import toast from "react-hot-toast";
import VehicleActions from "@/components/vehicles/VehicleActions";
import BackButton from "@/components/navigation/BackButton";

interface WatchlistItem {
  id: string;
  vehicleId: string;
  createdAt: string;
  vehicle: {
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
    status: string;
    seller: {
      id: string;
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
  };
}

export default function WatchlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchWatchlist(token);
  }, [router]);

  const fetchWatchlist = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/watchlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setWatchlist(data.watchlist || []);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (vehicleId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setRemoving(vehicleId);
    try {
      const response = await fetch(`/api/watchlist?vehicleId=${vehicleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setWatchlist((prev) => prev.filter((item) => item.vehicleId !== vehicleId));
        toast.success("Removed from watchlist");
      } else {
        toast.error("Failed to remove from watchlist");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("An error occurred");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading watchlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton href="/my-account" label="Back to My Account" />
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Watchlist</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {watchlist.length} {watchlist.length === 1 ? "vehicle" : "vehicles"} saved
              </p>
            </div>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Your watchlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Start saving vehicles you're interested in by clicking the heart icon
            </p>
            <Link
              href="/preapproved"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {watchlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  {item.vehicle.mainPhoto ? (
                    <img
                      src={
                        item.vehicle.mainPhoto.startsWith("http")
                          ? item.vehicle.mainPhoto
                          : `/uploads/${item.vehicle.mainPhoto}`
                      }
                      alt={item.vehicle.tractorBrand}
                      className="w-full h-full object-cover"
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
                      vehicleId={item.vehicle.id}
                      saleType={item.vehicle.saleType as "AUCTION" | "PREAPPROVED"}
                      onWatchlistChange={(isInWatchlist) => {
                        if (!isInWatchlist) {
                          setWatchlist((prev) => prev.filter((w) => w.vehicleId !== item.vehicle.id));
                        }
                      }}
                    />
                  </div>
                  {item.vehicle.saleType === "AUCTION" && item.vehicle.auction && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Auction
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold mb-2">
                    {item.vehicle.tractorBrand} {item.vehicle.engineHP} HP
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Year: {item.vehicle.yearOfMfg}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>
                        {item.vehicle.district ? `${item.vehicle.district}, ` : ""}
                        {item.vehicle.state}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {item.vehicle.vehicleType.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center text-primary-600 font-bold text-xl">
                      <IndianRupee className="w-5 h-5" />
                      <span>
                        {item.vehicle.saleType === "AUCTION" && item.vehicle.auction
                          ? item.vehicle.auction.currentBid.toLocaleString("en-IN")
                          : item.vehicle.saleAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/vehicles/${item.vehicle.id}`}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleRemove(item.vehicleId)}
                        disabled={removing === item.vehicleId}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



