"use client";

import { X, CheckCircle2, XCircle, FileText, CreditCard, ShieldCheck, MapPin, Calendar, Truck, Wrench, Settings } from "lucide-react";
import RTOTooltip from "./RTOTooltip";

interface Vehicle {
  id: string;
  vehicleType: string;
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
  readyForToken?: string | null;
  financeNocPapers?: string | null;
  clutchType?: string | null;
  ipto?: boolean | null;
  drive?: string | null;
  steering?: string | null;
  tyreBrand?: string | null;
  otherFeatures?: string | null;
  isCertified?: boolean;
  isFinanceAvailable?: boolean;
  saleAmount: number;
  basePrice?: number | null;
  mainPhoto?: string | null;
  subPhotos?: string[];
  referenceNumber?: string | null; // Vehicle reference number
  seller?: {
    fullName: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
}

interface CompleteVehicleDetailsProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  isAuctionVehicle?: boolean; // Flag to indicate if this is an auction vehicle
  reservePrice?: number; // Reserve price for auction vehicles
  auctionReferenceNumber?: string | null; // Auction reference number
  auctionId?: string; // Auction ID
}

export default function CompleteVehicleDetails({ vehicle, isOpen, onClose, isAuctionVehicle = false, reservePrice, auctionReferenceNumber, auctionId }: CompleteVehicleDetailsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900">Complete Vehicle Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Vehicle Image */}
            {vehicle.mainPhoto && (
              <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={
                    vehicle.mainPhoto.startsWith("http")
                      ? vehicle.mainPhoto
                      : `/uploads/${vehicle.mainPhoto}`
                  }
                  alt={vehicle.tractorBrand}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            )}

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-2">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{vehicle.yearOfMfg}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{vehicle.state}{vehicle.district ? `, ${vehicle.district}` : ""}</span>
                </div>
              </div>
              {/* Reference Numbers */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {vehicle.referenceNumber && (
                  <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                    <span className="text-gray-600 font-medium mr-1">Vehicle Ref:</span>
                    <span className="font-semibold text-blue-700">{vehicle.referenceNumber}</span>
                  </div>
                )}
                {isAuctionVehicle && (auctionReferenceNumber || auctionId) && (
                  <div className="flex items-center bg-green-50 px-3 py-1 rounded-full">
                    <span className="text-gray-600 font-medium mr-1">Auction Ref:</span>
                    <span className="font-semibold text-green-700">
                      {auctionReferenceNumber || auctionId?.substring(0, 8) || "N/A"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-3">
              {vehicle.isCertified && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  Certified Vehicle
                </div>
              )}
              {vehicle.isFinanceAvailable && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  <CreditCard className="w-4 h-4" />
                  Finance Available
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Vehicle Type</p>
                  <p className="font-semibold text-gray-900">{vehicle.vehicleType.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tractor Brand</p>
                  <p className="font-semibold text-gray-900">{vehicle.tractorBrand}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tractor Model</p>
                  <p className="font-semibold text-gray-900">{vehicle.tractorModel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Engine HP</p>
                  <p className="font-semibold text-gray-900">{vehicle.engineHP}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Year of Manufacturing</p>
                  <p className="font-semibold text-gray-900">{vehicle.yearOfMfg}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hours Run</p>
                  <p className="font-semibold text-gray-900">{vehicle.hoursRun || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Running Condition</p>
                  <p className="font-semibold text-gray-900">{vehicle.runningCondition}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">State</p>
                  <p className="font-semibold text-gray-900">{vehicle.state}</p>
                </div>
                {vehicle.district && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">District</p>
                    <p className="font-semibold text-gray-900">{vehicle.district}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Registration & Documents */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Registration & Documents
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Registration Number</p>
                  {vehicle.registrationNumber ? (
                    <RTOTooltip
                      registrationNumber={vehicle.registrationNumber}
                      chassisNumber={vehicle.chassisNumber}
                      engineNumber={vehicle.engineNumber}
                    >
                      <p className="font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">
                        {vehicle.registrationNumber}
                      </p>
                    </RTOTooltip>
                  ) : (
                    <p className="font-semibold text-gray-900">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Engine Number</p>
                  {vehicle.engineNumber ? (
                    <RTOTooltip
                      registrationNumber={vehicle.registrationNumber}
                      chassisNumber={vehicle.chassisNumber}
                      engineNumber={vehicle.engineNumber}
                    >
                      <p className="font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">
                        {vehicle.engineNumber}
                      </p>
                    </RTOTooltip>
                  ) : (
                    <p className="font-semibold text-gray-900">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Chassis Number</p>
                  {vehicle.chassisNumber ? (
                    <RTOTooltip
                      registrationNumber={vehicle.registrationNumber}
                      chassisNumber={vehicle.chassisNumber}
                      engineNumber={vehicle.engineNumber}
                    >
                      <p className="font-semibold text-primary-600 hover:text-primary-700 cursor-pointer">
                        {vehicle.chassisNumber}
                      </p>
                    </RTOTooltip>
                  ) : (
                    <p className="font-semibold text-gray-900">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">RC Copy Status</p>
                  <div className="flex items-center gap-2">
                    {vehicle.rcCopyStatus === "Active" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <p className="font-semibold text-gray-900">{vehicle.rcCopyStatus}</p>
                  </div>
                </div>
                {vehicle.rcCopyType && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">RC Copy Type</p>
                    <p className="font-semibold text-gray-900">{vehicle.rcCopyType}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Insurance Status</p>
                  <p className="font-semibold text-gray-900">{vehicle.insuranceStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Finance NOC Papers</p>
                  <p className="font-semibold text-gray-900">{vehicle.financeNocPapers || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ready For Token (Name Transfer)</p>
                  <p className="font-semibold text-gray-900">{vehicle.readyForToken || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Technical Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicle.clutchType && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Clutch Type</p>
                    <p className="font-semibold text-gray-900">{vehicle.clutchType}</p>
                  </div>
                )}
                {vehicle.ipto !== null && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">IPTO (Independent PTO)</p>
                    <div className="flex items-center gap-2">
                      {vehicle.ipto ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <p className="font-semibold text-gray-900">{vehicle.ipto ? "Yes" : "No"}</p>
                    </div>
                  </div>
                )}
                {vehicle.drive && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Drive</p>
                    <p className="font-semibold text-gray-900">{vehicle.drive}</p>
                  </div>
                )}
                {vehicle.steering && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Steering</p>
                    <p className="font-semibold text-gray-900">{vehicle.steering}</p>
                  </div>
                )}
                {vehicle.tyreBrand && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tyre Brand</p>
                    <p className="font-semibold text-gray-900">{vehicle.tyreBrand}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Other Features */}
            {vehicle.otherFeatures && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <Wrench className="w-5 h-5 mr-2" />
                  Other Features
                </h3>
                <p className="text-gray-900 whitespace-pre-wrap">{vehicle.otherFeatures}</p>
              </div>
            )}

            {/* Pricing / Reserve Price */}
            <div className="bg-primary-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {isAuctionVehicle ? "Reserve Price" : "Pricing"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isAuctionVehicle && reservePrice ? (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Reserve Price</p>
                    <p className="text-2xl font-bold text-primary-600">
                      ₹{reservePrice.toLocaleString("en-IN")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Sale Amount</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ₹{vehicle.saleAmount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    {vehicle.basePrice && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Base Price</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{vehicle.basePrice.toLocaleString("en-IN")}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Seller Information */}
            {vehicle.seller && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Seller Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="font-semibold text-gray-900">{vehicle.seller.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                    <p className="font-semibold text-gray-900">{vehicle.seller.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">WhatsApp Number</p>
                    <p className="font-semibold text-gray-900">{vehicle.seller.whatsappNumber}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

