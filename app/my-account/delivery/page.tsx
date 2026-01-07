"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Truck, MapPin, Calendar, Phone, Package, CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";

interface Delivery {
  id: string;
  status: string;
  method: string;
  pickupAddress?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupPincode?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPincode?: string;
  deliveryContactName?: string;
  deliveryContactPhone?: string;
  scheduledDate?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  transporterName?: string;
  transporterPhone?: string;
  trackingNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  deliveryNotes?: string;
  failureReason?: string;
  purchase: {
    id: string;
    purchasePrice: number;
    vehicle: {
      id: string;
      tractorBrand: string;
      engineHP: string;
      yearOfMfg: number;
      mainPhoto?: string;
    };
  };
}

export default function DeliveryTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const purchaseIdParam = searchParams.get("purchaseId");
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingResult, setTrackingResult] = useState<Delivery | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(purchaseIdParam);

  useEffect(() => {
    if (purchaseIdParam) {
      fetchDeliveryForPurchase(purchaseIdParam);
    } else {
      fetchDeliveries();
    }
  }, [purchaseIdParam]);

  const fetchDeliveryForPurchase = async (purchaseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`/api/delivery/${purchaseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const delivery = await response.json();
        if (delivery) {
          setDeliveries([delivery]);
        } else {
          setDeliveries([]);
        }
      }
    } catch (error) {
      console.error("Error fetching delivery:", error);
      toast.error("Failed to load delivery");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveries = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      // Fetch user's purchases with delivery info
      const response = await fetch("/api/my-account/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const purchases = Array.isArray(data.purchases) ? data.purchases : (Array.isArray(data) ? data : []);
        const deliveriesData: Delivery[] = [];

        // Fetch delivery for each purchase
        for (const purchase of purchases) {
          if (purchase.id) {
            const deliveryResponse = await fetch(`/api/delivery/${purchase.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (deliveryResponse.ok) {
              const delivery = await deliveryResponse.json();
              if (delivery) {
                deliveriesData.push(delivery);
              }
            }
          }
        }

        setDeliveries(deliveriesData);
      }
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast.error("Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleTrackByNumber = async () => {
    if (!trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    setTrackingLoading(true);
    try {
      const response = await fetch(`/api/delivery/track/${trackingNumber}`);
      if (response.ok) {
        const result = await response.json();
        setTrackingResult(result);
      } else {
        const error = await response.json();
        toast.error(error.message || "Delivery not found");
        setTrackingResult(null);
      }
    } catch (error) {
      console.error("Error tracking delivery:", error);
      toast.error("Failed to track delivery");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-300";
      case "OUT_FOR_DELIVERY":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "IN_TRANSIT":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "SCHEDULED":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-300";
      case "RETURNED":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-5 h-5" />;
      case "OUT_FOR_DELIVERY":
      case "IN_TRANSIT":
        return <Truck className="w-5 h-5" />;
      case "SCHEDULED":
        return <Calendar className="w-5 h-5" />;
      case "FAILED":
      case "RETURNED":
      case "CANCELLED":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        <BackButton href="/my-account" label="Back to My Account" />

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
              <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Delivery Tracking</h1>
              <p className="text-gray-600 text-sm sm:text-base mt-1">Track your vehicle deliveries</p>
            </div>
          </div>
        </div>

        {/* Track by Number Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Track by Tracking Number
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <button
              onClick={handleTrackByNumber}
              disabled={trackingLoading}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {trackingLoading ? "Tracking..." : "Track"}
            </button>
          </div>

          {trackingResult && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <h3 className="font-bold text-lg mb-2">Tracking Result</h3>
              <div className="space-y-2">
                <p><strong>Status:</strong> {trackingResult.status}</p>
                {trackingResult.estimatedDeliveryDate && (
                  <p><strong>Estimated Delivery:</strong> {formatDate(trackingResult.estimatedDeliveryDate)}</p>
                )}
                {trackingResult.transporterName && (
                  <p><strong>Transporter:</strong> {trackingResult.transporterName}</p>
                )}
                {trackingResult.driverPhone && (
                  <p><strong>Driver Contact:</strong> {trackingResult.driverPhone}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* My Deliveries */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            My Deliveries
          </h2>

          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-600">No deliveries found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="border-2 border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-900">
                          {delivery.purchase.vehicle.tractorBrand} {delivery.purchase.vehicle.engineHP} HP
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold border-2 flex items-center gap-1 ${getStatusColor(delivery.status)}`}>
                          {getStatusIcon(delivery.status)}
                          {delivery.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-gray-600">Year: {delivery.purchase.vehicle.yearOfMfg}</p>
                      <p className="text-gray-600">Purchase Price: ₹{delivery.purchase.purchasePrice.toLocaleString("en-IN")}</p>
                    </div>
                    {delivery.trackingNumber && (
                      <div className="bg-gray-50 px-4 py-2 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Tracking Number</p>
                        <p className="font-mono font-bold text-lg">{delivery.trackingNumber}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Pickup Address */}
                    {delivery.pickupAddress && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Pickup Address
                        </h4>
                        <p className="text-sm text-gray-700">
                          {delivery.pickupAddress}<br />
                          {delivery.pickupCity}, {delivery.pickupState} {delivery.pickupPincode}
                        </p>
                        {delivery.pickupContactPhone && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {delivery.pickupContactPhone}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Delivery Address */}
                    {delivery.deliveryAddress && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-gray-700">
                          {delivery.deliveryAddress}<br />
                          {delivery.deliveryCity}, {delivery.deliveryState} {delivery.deliveryPincode}
                        </p>
                        {delivery.deliveryContactPhone && (
                          <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {delivery.deliveryContactPhone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Timeline
                    </h4>
                    <div className="space-y-2 text-sm">
                      {delivery.scheduledDate && (
                        <p className="text-gray-600">
                          <strong>Scheduled:</strong> {formatDate(delivery.scheduledDate)}
                        </p>
                      )}
                      {delivery.dispatchedAt && (
                        <p className="text-gray-600">
                          <strong>Dispatched:</strong> {formatDate(delivery.dispatchedAt)}
                        </p>
                      )}
                      {delivery.inTransitAt && (
                        <p className="text-gray-600">
                          <strong>In Transit:</strong> {formatDate(delivery.inTransitAt)}
                        </p>
                      )}
                      {delivery.outForDeliveryAt && (
                        <p className="text-gray-600">
                          <strong>Out for Delivery:</strong> {formatDate(delivery.outForDeliveryAt)}
                        </p>
                      )}
                      {delivery.deliveredAt && (
                        <p className="text-green-600 font-semibold">
                          <strong>Delivered:</strong> {formatDate(delivery.deliveredAt)}
                        </p>
                      )}
                      {delivery.estimatedDeliveryDate && (
                        <p className="text-blue-600">
                          <strong>Estimated Delivery:</strong> {formatDate(delivery.estimatedDeliveryDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Logistics Info */}
                  {(delivery.transporterName || delivery.driverName || delivery.vehicleNumber) && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Logistics Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        {delivery.transporterName && (
                          <div>
                            <p className="text-gray-500">Transporter</p>
                            <p className="font-semibold">{delivery.transporterName}</p>
                            {delivery.transporterPhone && (
                              <p className="text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {delivery.transporterPhone}
                              </p>
                            )}
                          </div>
                        )}
                        {delivery.driverName && (
                          <div>
                            <p className="text-gray-500">Driver</p>
                            <p className="font-semibold">{delivery.driverName}</p>
                            {delivery.driverPhone && (
                              <p className="text-gray-600 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {delivery.driverPhone}
                              </p>
                            )}
                          </div>
                        )}
                        {delivery.vehicleNumber && (
                          <div>
                            <p className="text-gray-500">Vehicle Number</p>
                            <p className="font-semibold font-mono">{delivery.vehicleNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {delivery.deliveryNotes && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Delivery Notes
                      </h4>
                      <p className="text-sm text-gray-700">{delivery.deliveryNotes}</p>
                    </div>
                  )}

                  {/* Failure/Return Reason */}
                  {(delivery.failureReason || delivery.returnReason) && (
                    <div className="border-t pt-4 mt-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>Reason:</strong> {delivery.failureReason || delivery.returnReason}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

