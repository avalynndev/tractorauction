"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bookmark, IndianRupee, MapPin, Calendar, Truck, ArrowLeft, Trash2, Eye, Gavel, Clock } from "lucide-react";
import toast from "react-hot-toast";
import VehicleActions from "@/components/vehicles/VehicleActions";
import BackButton from "@/components/navigation/BackButton";

interface ShortlistItem {
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
    auction: {
      id: string;
      status: string;
      currentBid: number;
      endTime: string;
      startTime: string;
    };
  };
}

export default function ShortlistPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchShortlist(token);
  }, [router]);

  const fetchShortlist = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/shortlist", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setShortlist(data.shortlist || []);
      } else if (response.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching shortlist:", error);
      toast.error("Failed to load shortlist");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (vehicleId: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    setRemoving(vehicleId);
    try {
      const response = await fetch(`/api/shortlist?vehicleId=${vehicleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setShortlist((prev) => prev.filter((item) => item.vehicleId !== vehicleId));
        toast.success("Removed from shortlist");
      } else {
        toast.error("Failed to remove from shortlist");
      }
    } catch (error) {
      console.error("Error removing from shortlist:", error);
      toast.error("An error occurred");
    } finally {
      setRemoving(null);
    }
  };

  const getAuctionStatus = (auction: ShortlistItem["vehicle"]["auction"]) => {
    const now = new Date();
    const endTime = new Date(auction.endTime);
    const startTime = new Date(auction.startTime);

    if (now < startTime) {
      return { status: "scheduled", label: "Scheduled", color: "bg-blue-500" };
    } else if (now >= startTime && now < endTime) {
      return { status: "live", label: "Live", color: "bg-green-500" };
    } else {
      return { status: "ended", label: "Ended", color: "bg-gray-500" };
    }
  };

  const getTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shortlist...</p>
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shortlisted for Bidding</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {shortlist.length} {shortlist.length === 1 ? "auction" : "auctions"} shortlisted
              </p>
            </div>
          </div>
        </div>

        {shortlist.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Your shortlist is empty</h2>
            <p className="text-gray-600 mb-6">
              Shortlist auction vehicles you want to bid on by clicking the bookmark icon
            </p>
            <Link
              href="/auctions"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Auctions
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {shortlist.map((item) => {
              const auctionStatus = getAuctionStatus(item.vehicle.auction);
              return (
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
                        saleType="AUCTION"
                        onShortlistChange={(isShortlisted) => {
                          if (!isShortlisted) {
                            setShortlist((prev) => prev.filter((s) => s.vehicleId !== item.vehicle.id));
                          }
                        }}
                      />
                    </div>
                    <div className={`absolute top-2 left-2 ${auctionStatus.color} text-white px-2 py-1 rounded text-xs font-semibold`}>
                      {auctionStatus.label}
                    </div>
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
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center text-primary-600">
                          <Gavel className="w-4 h-4 mr-1" />
                          <span className="font-semibold">Current Bid:</span>
                        </div>
                        <div className="flex items-center text-primary-600 font-bold">
                          <IndianRupee className="w-4 h-4" />
                          <span>{item.vehicle.auction.currentBid.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      {auctionStatus.status !== "ended" && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{getTimeRemaining(item.vehicle.auction.endTime)} remaining</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Link
                        href={`/auctions/${item.vehicle.auction.id}`}
                        className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-semibold"
                      >
                        {auctionStatus.status === "live" ? "Bid Now" : "View Auction"}
                      </Link>
                      <div className="flex items-center gap-2 ml-2">
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
                          title="Remove from shortlist"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



