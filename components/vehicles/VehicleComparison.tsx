"use client";

import { useState, useEffect } from "react";
import { X, IndianRupee, MapPin, Calendar, Truck, Trash2, Plus, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Star } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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
  status: string;
  seller: {
    fullName: string;
    city: string;
    state: string;
  };
  auction?: {
    currentBid: number;
    status: string;
  };
  isCertified?: boolean;
  isFinanceAvailable?: boolean;
  hoursRun?: string | null;
  insuranceStatus?: string;
  rcCopyStatus?: string;
}

interface VehicleComparisonProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VehicleComparison({ isOpen, onClose }: VehicleComparisonProps) {
  const [comparisonVehicles, setComparisonVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      loadComparisonVehicles();
    }
  }, [isOpen]);

  const loadComparisonVehicles = () => {
    const stored = localStorage.getItem("comparisonVehicles");
    if (stored) {
      try {
        const vehicleIds = JSON.parse(stored);
        fetchVehicles(vehicleIds);
      } catch (error) {
        console.error("Error loading comparison vehicles:", error);
      }
    }
  };

  const fetchVehicles = async (vehicleIds: string[]) => {
    setLoading(true);
    try {
      const vehicles = await Promise.all(
        vehicleIds.map(async (id) => {
          const response = await fetch(`/api/vehicles/${id}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        })
      );
      setComparisonVehicles(vehicles.filter(Boolean));
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const removeVehicle = (vehicleId: string) => {
    const updated = comparisonVehicles.filter((v) => v.id !== vehicleId);
    setComparisonVehicles(updated);
    const stored = localStorage.getItem("comparisonVehicles");
    if (stored) {
      try {
        const vehicleIds = JSON.parse(stored);
        const updatedIds = vehicleIds.filter((id: string) => id !== vehicleId);
        localStorage.setItem("comparisonVehicles", JSON.stringify(updatedIds));
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
    }
    if (updated.length === 0) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const specifications = [
    { label: "Brand", key: "tractorBrand", type: "text" },
    { label: "Model", key: "tractorModel", type: "text" },
    { label: "Engine HP", key: "engineHP", type: "text" },
    { label: "Year", key: "yearOfMfg", type: "number", higher: true },
    { label: "Vehicle Type", key: "vehicleType", type: "text" },
    { label: "Running Condition", key: "runningCondition", type: "text" },
    { label: "Hours Run", key: "hoursRun", type: "text" },
    { label: "Insurance Status", key: "insuranceStatus", type: "text" },
    { label: "RC Copy Status", key: "rcCopyStatus", type: "text" },
    { label: "State", key: "state", type: "text" },
    { label: "District", key: "district", type: "text" },
    { label: "Seller", key: "seller.fullName", type: "text" },
    { label: "Location", key: "seller.city", type: "text" },
  ];

  const getValue = (vehicle: Vehicle, key: string) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      return (vehicle as any)[parent]?.[child] || "N/A";
    }
    return (vehicle as any)[key] || "N/A";
  };

  const getPrice = (vehicle: Vehicle) => {
    if (vehicle.saleType === "AUCTION" && vehicle.auction) {
      return vehicle.auction.currentBid;
    }
    return vehicle.saleAmount;
  };

  // Find best value for numeric comparisons
  const getBestValue = (key: string, type: string, higher: boolean) => {
    if (type !== "number" || !higher) return null;
    const values = comparisonVehicles
      .map((v) => {
        const val = getValue(v, key);
        return typeof val === "number" ? val : null;
      })
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.max(...values) : null;
  };

  const getWorstValue = (key: string, type: string, higher: boolean) => {
    if (type !== "number" || !higher) return null;
    const values = comparisonVehicles
      .map((v) => {
        const val = getValue(v, key);
        return typeof val === "number" ? val : null;
      })
      .filter((v): v is number => v !== null);
    return values.length > 0 ? Math.min(...values) : null;
  };

  // For price, lower is better
  const getBestPrice = () => {
    const prices = comparisonVehicles.map((v) => getPrice(v));
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getWorstPrice = () => {
    const prices = comparisonVehicles.map((v) => getPrice(v));
    return prices.length > 0 ? Math.max(...prices) : null;
  };

  const bestPrice = getBestPrice();
  const worstPrice = getWorstPrice();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center space-x-3">
            <Truck className="w-6 h-6" />
            <h2 className="text-xl font-bold">Compare Vehicles</h2>
            <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
              {comparisonVehicles.length} vehicle{comparisonVehicles.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading vehicles...</p>
            </div>
          ) : comparisonVehicles.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2">No vehicles to compare</h3>
              <p className="text-gray-600 mb-6">
                Add vehicles to comparison by clicking the "Compare" button on vehicle cards
              </p>
              <button
                onClick={onClose}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4">
                {comparisonVehicles.map((vehicle, index) => (
                  <div key={vehicle.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">
                          {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP
                        </h3>
                        <div className="flex items-center text-primary-600 font-bold text-lg mb-2">
                          <IndianRupee className="w-5 h-5" />
                          <span>{getPrice(vehicle).toLocaleString("en-IN")}</span>
                          {bestPrice === getPrice(vehicle) && (
                            <span className="ml-2 text-green-600 text-xs flex items-center">
                              <Star className="w-4 h-4 fill-current" />
                              Best Price
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeVehicle(vehicle.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    {vehicle.mainPhoto && (
                      <img
                        src={
                          vehicle.mainPhoto.startsWith("http")
                            ? vehicle.mainPhoto
                            : `/uploads/${vehicle.mainPhoto}`
                        }
                        alt={vehicle.tractorBrand}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="space-y-2 text-sm">
                      {specifications.map((spec) => (
                        <div key={spec.key} className="flex justify-between py-2 border-b border-gray-100">
                          <span className="font-semibold text-gray-600">{spec.label}:</span>
                          <span className="text-gray-900">
                            {spec.key === "vehicleType"
                              ? getValue(vehicle, spec.key).replace("_", " ")
                              : getValue(vehicle, spec.key)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="mt-4 block w-full bg-primary-600 text-white text-center py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="sticky left-0 z-20 bg-gray-50 border border-gray-200 p-4 text-left font-semibold text-gray-700 min-w-[200px]">
                          Specification
                        </th>
                        {comparisonVehicles.map((vehicle) => (
                          <th
                            key={vehicle.id}
                            className="border border-gray-200 p-4 text-center bg-white min-w-[280px] relative"
                          >
                            <div className="relative">
                              <button
                                onClick={() => removeVehicle(vehicle.id)}
                                className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                                aria-label="Remove"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <div className="mt-2">
                                {vehicle.mainPhoto ? (
                                  <img
                                    src={
                                      vehicle.mainPhoto.startsWith("http")
                                        ? vehicle.mainPhoto
                                        : `/uploads/${vehicle.mainPhoto}`
                                    }
                                    alt={vehicle.tractorBrand}
                                    className="w-full h-40 object-cover rounded-lg mb-3 shadow-md"
                                  />
                                ) : (
                                  <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                                    <Truck className="w-12 h-12 text-gray-400" />
                                  </div>
                                )}
                                <h3 className="font-bold text-base mb-2 px-2">
                                  {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP
                                </h3>
                                <div className="flex items-center justify-center text-primary-600 font-bold text-lg mb-2">
                                  <IndianRupee className="w-5 h-5" />
                                  <span>{getPrice(vehicle).toLocaleString("en-IN")}</span>
                                  {bestPrice === getPrice(vehicle) && (
                                    <span className="ml-2 text-green-600 text-xs flex items-center">
                                      <Star className="w-4 h-4 fill-current" />
                                    </span>
                                  )}
                                </div>
                                {vehicle.isCertified && (
                                  <div className="flex items-center justify-center text-xs text-green-600 mb-1">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Certified
                                  </div>
                                )}
                                {vehicle.isFinanceAvailable && (
                                  <div className="flex items-center justify-center text-xs text-blue-600 mb-2">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Finance Available
                                  </div>
                                )}
                                <Link
                                  href={`/vehicles/${vehicle.id}`}
                                  className="text-primary-600 hover:text-primary-700 text-sm font-semibold underline"
                                >
                                  View Details →
                                </Link>
                              </div>
                            </div>
                          </th>
                        ))}
                        {comparisonVehicles.length < 3 && (
                          <th className="border border-gray-200 p-4 text-center bg-gray-50 min-w-[280px]">
                            <button
                              onClick={() => {
                                toast("Close this window and click 'Compare' on vehicles to add them", {
                                  icon: "ℹ️",
                                  duration: 3000,
                                });
                                onClose();
                              }}
                              className="w-full flex flex-col items-center justify-center h-full min-h-[300px] text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all cursor-pointer"
                            >
                              <Plus className="w-12 h-12 mb-3" />
                              <p className="text-base font-semibold">Add Vehicle</p>
                              <p className="text-xs mt-2 text-gray-500 text-center px-4">
                                {3 - comparisonVehicles.length} slot{3 - comparisonVehicles.length !== 1 ? 's' : ''} available
                              </p>
                              <p className="text-xs mt-2 text-primary-600 font-medium">Click to go back</p>
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price Row */}
                      <tr className="bg-primary-50">
                        <td className="sticky left-0 z-10 bg-primary-50 border border-gray-200 p-4 font-bold text-primary-700">
                          Price
                        </td>
                        {comparisonVehicles.map((vehicle) => {
                          const price = getPrice(vehicle);
                          const isBest = bestPrice === price;
                          const isWorst = worstPrice === price && bestPrice !== worstPrice;
                          return (
                            <td
                              key={vehicle.id}
                              className={`border border-gray-200 p-4 text-center ${
                                isBest ? "bg-green-50" : isWorst ? "bg-red-50" : ""
                              }`}
                            >
                              <div className="flex items-center justify-center text-primary-600 font-bold text-lg">
                                <IndianRupee className="w-5 h-5" />
                                <span>{price.toLocaleString("en-IN")}</span>
                                {isBest && (
                                  <span className="ml-2 text-green-600 text-xs flex items-center">
                                    <Star className="w-4 h-4 fill-current" />
                                  </span>
                                )}
                              </div>
                              {vehicle.saleType === "AUCTION" && vehicle.auction && (
                                <span className="text-xs text-gray-500 block mt-1">
                                  {vehicle.auction.status}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        {comparisonVehicles.length < 3 && (
                          <td className="border border-gray-200 bg-gray-50">
                            <button
                              onClick={() => {
                                toast("Close this window and click 'Compare' on vehicles to add them", {
                                  icon: "ℹ️",
                                  duration: 3000,
                                });
                                onClose();
                              }}
                              className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all cursor-pointer"
                            >
                              <Plus className="w-6 h-6 mr-2" />
                              <span className="text-sm font-medium">Add Vehicle</span>
                            </button>
                          </td>
                        )}
                      </tr>

                      {/* Specifications */}
                      {specifications.map((spec) => {
                        const bestValue = getBestValue(spec.key, spec.type, spec.higher || false);
                        const worstValue = getWorstValue(spec.key, spec.type, spec.higher || false);
                        return (
                          <tr key={spec.key} className="hover:bg-gray-50 transition-colors">
                            <td className="sticky left-0 z-10 bg-white border border-gray-200 p-4 font-semibold text-gray-700">
                              {spec.label}
                            </td>
                            {comparisonVehicles.map((vehicle) => {
                              const value = getValue(vehicle, spec.key);
                              const numValue = typeof value === "number" ? value : null;
                              const isBest = spec.higher && numValue !== null && bestValue === numValue;
                              const isWorst = spec.higher && numValue !== null && worstValue === numValue && bestValue !== worstValue;
                              return (
                                <td
                                  key={vehicle.id}
                                  className={`border border-gray-200 p-4 text-center ${
                                    isBest ? "bg-green-50" : isWorst ? "bg-red-50" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    {spec.key === "vehicleType"
                                      ? value.toString().replace("_", " ")
                                      : value}
                                    {isBest && (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 ml-2" />
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                            {comparisonVehicles.length < 3 && (
                              <td className="border border-gray-200 bg-gray-50">
                                <button
                                  onClick={() => {
                                    toast("Close this window and click 'Compare' on vehicles to add them", {
                                      icon: "ℹ️",
                                      duration: 3000,
                                    });
                                    onClose();
                                  }}
                                  className="w-full h-full min-h-[60px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all cursor-pointer"
                                >
                                  <Plus className="w-6 h-6 mr-2" />
                                  <span className="text-sm font-medium">Add Vehicle</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {comparisonVehicles.length > 0 && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{comparisonVehicles.length}</span> vehicle{comparisonVehicles.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  localStorage.removeItem("comparisonVehicles");
                  setComparisonVehicles([]);
                  onClose();
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Export function to add vehicle to comparison
export const addToComparison = (vehicleId: string) => {
  const stored = localStorage.getItem("comparisonVehicles");
  const vehicleIds = stored ? JSON.parse(stored) : [];

  if (vehicleIds.includes(vehicleId)) {
    toast.error("Vehicle already in comparison");
    return false;
  }

  if (vehicleIds.length >= 3) {
    toast.error("Maximum 3 vehicles can be compared at once. Please remove one vehicle from comparison first.", {
      duration: 4000,
    });
    return false;
  }

  vehicleIds.push(vehicleId);
  localStorage.setItem("comparisonVehicles", JSON.stringify(vehicleIds));
  toast.success("Vehicle added to comparison");
  return true;
};
