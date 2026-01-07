"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck, Phone, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function ValuerLoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate phone number
      if (!phoneNumber || !/^[6-9]\d{9}$/.test(phoneNumber)) {
        toast.error("Please enter a valid 10-digit phone number");
        setLoading(false);
        return;
      }

      // Call dedicated valuer login API
      const response = await fetch("/api/valuer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok && data.valuer) {
        const valuer = data.valuer;
        
        // Store valuer info in localStorage
        localStorage.setItem("valuerPhone", valuer.phoneNumber);
        localStorage.setItem("valuerId", valuer.id);
        localStorage.setItem("valuerName", valuer.valuerName);
        
        toast.success(`Welcome, ${valuer.valuerName}!`);
        router.push("/valuer/inspections");
      } else {
        toast.error(data.message || "Valuer not found. Please contact admin.");
      }
    } catch (error: any) {
      console.error("Valuer login error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <FileCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Valuer Login</h1>
          <p className="text-gray-600">Access your assigned inspections</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter your 10-digit phone number"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  maxLength={10}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Enter the phone number registered with your valuer account
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If you're unable to login, please contact the admin. 
              Your phone number must be registered in the valuer management system.
            </p>
          </div>

          {/* Admin Login Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Admin Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


