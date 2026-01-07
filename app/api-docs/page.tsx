"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Suppress console warnings from swagger-ui-react about deprecated lifecycle methods
// This is a known issue with swagger-ui-react library using deprecated React methods
if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    // Convert all arguments to strings and check for the warning
    const allArgsAsString = args.map((arg) => {
      if (typeof arg === "string") return arg;
      if (typeof arg === "object" && arg !== null) {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(" ");

    // Check if this is the UNSAFE lifecycle warning from swagger-ui-react
    const hasUnsafeWarning = 
      allArgsAsString.includes("UNSAFE_componentWillReceiveProps") ||
      allArgsAsString.includes("UNSAFE_componentWillMount") ||
      allArgsAsString.includes("UNSAFE_componentWillUpdate");
    
    const hasModelCollapse = allArgsAsString.includes("ModelCollapse");
    
    // Suppress if it's an UNSAFE warning and mentions ModelCollapse (from swagger-ui-react)
    if (hasUnsafeWarning && hasModelCollapse) {
      return;
    }
    
    // Also suppress if it's just the UNSAFE warning (likely from swagger-ui-react)
    if (hasUnsafeWarning && allArgsAsString.includes("strict mode")) {
      return;
    }
    
    originalError.apply(console, args);
  };
}

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  ),
});

import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the generated Swagger spec
    fetch("/api/swagger.json")
      .then((res) => res.json())
      .then((data) => {
        setSpec(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading Swagger spec:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load API documentation</p>
          <p className="text-gray-600">Please ensure the Swagger spec is generated correctly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
          <p className="text-gray-600 mt-1">
            Interactive API documentation for Tractor Auction platform
          </p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <SwaggerUI spec={spec} />
      </div>
    </div>
  );
}

