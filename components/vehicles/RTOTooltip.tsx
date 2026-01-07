"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Building2, Loader2 } from "lucide-react";

interface RTODetails {
  rtoName: string;
  state: string;
  city: string;
  rtoCode: string;
}

interface RTOTooltipProps {
  registrationNumber?: string | null;
  chassisNumber?: string | null;
  engineNumber?: string | null;
  children: React.ReactNode;
  className?: string;
}

export default function RTOTooltip({
  registrationNumber,
  chassisNumber,
  engineNumber,
  children,
  className = "",
}: RTOTooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [rtoDetails, setRtoDetails] = useState<RTODetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('[data-rto-trigger]')
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showTooltip]);

  const fetchRTODetails = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      setError("Please login to view RTO details");
      return;
    }

    setLoading(true);
    setError(null);
    setRequiresUpgrade(false);

    try {
      const params = new URLSearchParams();
      if (registrationNumber) params.append("registrationNumber", registrationNumber);
      if (chassisNumber) params.append("chassisNumber", chassisNumber);
      if (engineNumber) params.append("engineNumber", engineNumber);

      const response = await fetch(`/api/rto/lookup?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRtoDetails(data.rtoDetails);
      } else if (response.status === 403 && data.requiresUpgrade) {
        setRequiresUpgrade(true);
        setError(data.message);
      } else {
        setError(data.message || "Failed to fetch RTO details");
      }
    } catch (err) {
      setError("Failed to fetch RTO details");
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only show tooltip if we have at least one number
    if (!registrationNumber && !chassisNumber && !engineNumber) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setShowTooltip(true);
      if (!rtoDetails && !loading && !error) {
        fetchRTODetails();
      }
    }, 500); // Show after 500ms hover
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Don't hide immediately - let user interact with tooltip
  };

  const handleClick = () => {
    if (!showTooltip) {
      setShowTooltip(true);
      if (!rtoDetails && !loading && !error) {
        fetchRTODetails();
      }
    }
  };

  return (
    <div className="relative inline-block">
      <div
        data-rto-trigger
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`cursor-pointer hover:underline ${className}`}
      >
        {children}
      </div>

      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-64 p-4 bg-white rounded-lg shadow-xl border border-gray-200 bottom-full left-1/2 transform -translate-x-1/2 mb-2"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 text-sm flex items-center">
              <Building2 className="w-4 h-4 mr-2 text-primary-600" />
              RTO Details
            </h4>

            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 py-2">
                {error}
                {requiresUpgrade && (
                  <a
                    href="/my-account"
                    className="block mt-2 text-primary-600 hover:underline"
                  >
                    Upgrade Membership →
                  </a>
                )}
              </div>
            )}

            {rtoDetails && !loading && !error && (
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="text-gray-500 w-24">RTO Name:</span>
                  <span className="font-semibold text-gray-900">{rtoDetails.rtoName}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-24">State:</span>
                  <span className="font-semibold text-gray-900">{rtoDetails.state}</span>
                </div>
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-500 mr-1 mt-0.5" />
                  <span className="text-gray-500 w-20">Location:</span>
                  <span className="font-semibold text-gray-900">{rtoDetails.city}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 w-24">RTO Code:</span>
                  <span className="font-semibold text-gray-900">{rtoDetails.rtoCode}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


























