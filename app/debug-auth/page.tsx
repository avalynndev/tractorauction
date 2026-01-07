"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DebugAuthPage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    setLoading(true);
    
    // Check all token sources
    const localStorageToken = localStorage.getItem("token");
    const sessionStorageToken = sessionStorage.getItem("token");
    const cookieToken = getCookie("token");

    // Try to verify session with all token sources
    let sessionData = null;
    let sessionError = null;
    
    if (localStorageToken || sessionStorageToken || cookieToken) {
      try {
        const token = localStorageToken || sessionStorageToken || cookieToken;
        console.log("Testing token:", token.substring(0, 20) + "...");
        
        // Test with /api/user/me first (the actual endpoint used)
        const userMeResponse = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        
        if (userMeResponse.ok) {
          sessionData = {
            source: "user/me",
            data: await userMeResponse.json(),
            status: "success"
          };
        } else {
          const errorText = await userMeResponse.text();
          sessionError = {
            endpoint: "user/me",
            status: userMeResponse.status,
            message: errorText
          };
        }
        
        // Also test session endpoint
        const sessionResponse = await fetch("/api/auth/session", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        
        const sessionResult = await sessionResponse.json();
        if (sessionResponse.ok) {
          sessionData = {
            ...sessionData,
            sessionEndpoint: sessionResult
          };
        } else {
          sessionError = {
            ...sessionError,
            sessionEndpoint: sessionResult
          };
        }
      } catch (error: any) {
        console.error("Session check error:", error);
        sessionError = {
          error: error.message || "Network error"
        };
      }
    }

    setAuthStatus({
      localStorage: localStorageToken ? `✓ Found (${localStorageToken.substring(0, 20)}...)` : "✗ Not found",
      sessionStorage: sessionStorageToken ? `✓ Found (${sessionStorageToken.substring(0, 20)}...)` : "✗ Not found",
      cookie: cookieToken ? `✓ Found (${cookieToken.substring(0, 20)}...)` : "✗ Not found",
      session: sessionData,
      error: sessionError,
      timestamp: new Date().toISOString(),
    });
    
    setLoading(false);
  };

  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  };

  const clearAll = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    alert("All tokens cleared!");
    checkAuthStatus();
  };

  const testLogin = async () => {
    const phone = prompt("Enter phone number:");
    if (!phone) return;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (response.ok) {
        alert("OTP sent! Use 999999 as OTP");
        router.push(`/verify-otp?phone=${phone}`);
      } else {
        const data = await response.json();
        alert("Error: " + data.message);
      }
    } catch (error) {
      alert("Error: " + error);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Token Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>localStorage:</span>
              <span className={authStatus.localStorage.includes("✓") ? "text-green-600" : "text-red-600"}>
                {authStatus.localStorage}
              </span>
            </div>
            <div className="flex justify-between">
              <span>sessionStorage:</span>
              <span className={authStatus.sessionStorage.includes("✓") ? "text-green-600" : "text-red-600"}>
                {authStatus.sessionStorage}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cookie:</span>
              <span className={authStatus.cookie.includes("✓") ? "text-green-600" : "text-red-600"}>
                {authStatus.cookie}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Status</h2>
          {authStatus.session && (
            <div className="mb-4">
              <div className="bg-green-50 border border-green-200 rounded p-4 mb-2">
                <p className="text-green-800 font-semibold">✓ Authentication Successful</p>
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(authStatus.session, null, 2)}
              </pre>
            </div>
          )}
          {authStatus.error && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded p-4 mb-2">
                <p className="text-red-800 font-semibold">✗ Authentication Failed</p>
              </div>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(authStatus.error, null, 2)}
              </pre>
            </div>
          )}
          {!authStatus.session && !authStatus.error && (
            <p className="text-gray-500">No session data available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={checkAuthStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Status
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear All Tokens
            </button>
            <button
              onClick={testLogin}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Login
            </button>
            <button
              onClick={() => {
                // Force navigation with token check
                const token = localStorage.getItem("token");
                if (token) {
                  console.log("Navigating with token:", token.substring(0, 20) + "...");
                  window.location.href = "/my-account";
                } else {
                  alert("No token found! Please login first.");
                }
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Go to My Account (Force)
            </button>
            <button
              onClick={async () => {
                const token = localStorage.getItem("token");
                if (!token) {
                  alert("No token found!");
                  return;
                }
                
                try {
                  const response = await fetch("/api/user/me", {
                    headers: { Authorization: `Bearer ${token}` },
                    credentials: "include",
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    alert("Token is valid!\n\nUser: " + data.fullName + "\nRole: " + data.role);
                  } else {
                    const error = await response.text();
                    alert("Token validation failed:\n" + error);
                  }
                } catch (error: any) {
                  alert("Error: " + error.message);
                }
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Test Token
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This page helps diagnose authentication issues. 
            Check the browser console (F12) for detailed logs.
          </p>
        </div>
      </div>
    </div>
  );
}

