"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import MembershipSelectionModal from "@/components/membership/MembershipSelectionModal";

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [timer, setTimer] = useState(60);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  // Redirect to login if phone number is missing
  useEffect(() => {
    if (!phone) {
      toast.error("Phone number is missing. Redirecting to login...");
      router.push("/login");
    }
  }, [phone, router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    if (!phone) {
      toast.error("Phone number is missing. Please go back and try again.");
      router.push("/login");
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, otp: otpString }),
      });

      const result = await response.json();

      if (response.ok && result.token) {
        toast.success("OTP verified successfully!");
        
        // Store token in multiple places for reliability
        try {
          localStorage.setItem("token", result.token);
          sessionStorage.setItem("token", result.token);
          
          // Set cookie for middleware (if possible)
          document.cookie = `token=${result.token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          
          // Verify token was saved
          const savedToken = localStorage.getItem("token");
          if (!savedToken || savedToken !== result.token) {
            console.error("Token not saved properly in localStorage");
            toast.error("Failed to save authentication. Please try again.");
            return;
          }
          
          console.log("Token saved successfully:", savedToken.substring(0, 20) + "...");
        } catch (error) {
          console.error("Error saving token:", error);
          toast.error("Failed to save authentication. Please check browser settings.");
          return;
        }
        
        // Check if this is a new user (just registered)
        // If result.isNewUser is true, show membership modal
        if (result.isNewUser) {
          setIsNewUser(true);
          setShowMembershipModal(true);
        } else {
          // Existing user - redirect to auctions page
          setTimeout(() => {
            const verifyToken = localStorage.getItem("token");
            if (verifyToken) {
              window.location.href = "/auctions";
            } else {
              toast.error("Authentication token lost. Please try again.");
            }
          }, 300);
        }
      } else {
        const errorMessage = result.message || "Invalid OTP";
        toast.error(errorMessage);
        console.error("OTP verification failed:", result);
        // If token is missing, show error
        if (response.ok && !result.token) {
          toast.error("Authentication failed. Token not received. Please try again.");
          console.error("No token in response:", result);
        }
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      if (response.ok) {
        toast.success("OTP resent successfully!");
        setTimer(60);
        setOtp(["", "", "", "", "", ""]);
      } else {
        toast.error("Failed to resend OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleMembershipSelected = (planType: string) => {
    setShowMembershipModal(false);
    
    // Small delay to ensure any payment processing is complete
    setTimeout(() => {
      const verifyToken = localStorage.getItem("token");
      if (verifyToken) {
        if (planType === "TRIAL") {
          toast.success("Free trial activated! Welcome to Tractor Auction!");
        }
        window.location.href = "/auctions";
      } else {
        toast.error("Authentication token lost. Please try again.");
      }
    }, 500);
  };

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Phone number is missing. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Verify OTP</h1>
          <p className="text-center text-gray-600 mb-2 text-sm sm:text-base">
            Enter the 6-digit OTP sent to
          </p>
          <p className="text-center text-primary-600 font-semibold mb-4 text-sm sm:text-base break-all">
            +91 {phone}
          </p>

          {/* Test Mode Hint */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800 text-center">
              <strong>Test Mode:</strong> Use <code className="bg-yellow-100 px-2 py-1 rounded font-mono">999999</code> as OTP for testing
            </p>
          </div>

          <div className="flex justify-center gap-2 sm:gap-3 mb-6 px-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 touch-manipulation"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.join("").length !== 6}
            className="w-full bg-primary-600 text-white py-3 sm:py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 text-base touch-manipulation"
          >
            {isVerifying ? "Verifying..." : "Verify OTP"}
          </button>

          <div className="text-center">
            {timer > 0 ? (
              <p className="text-sm text-gray-600">
                Resend OTP in {timer} seconds
              </p>
            ) : (
              <button
                onClick={handleResendOTP}
                className="text-sm text-primary-600 hover:underline font-semibold"
              >
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Membership Selection Modal */}
      {showMembershipModal && (
        <MembershipSelectionModal
          isOpen={showMembershipModal}
          onClose={() => {
            // If user closes modal, proceed with free trial
            handleMembershipSelected("TRIAL");
          }}
          onSelect={handleMembershipSelected}
        />
      )}
    </div>
  );
}


