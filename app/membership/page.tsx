"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Package, Check, Clock, IndianRupee } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/date-format";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface MembershipPlan {
  type: "TRIAL" | "SILVER" | "GOLD" | "DIAMOND";
  name: string;
  price: number;
  validity: number; // in days
  features: string[];
  popular?: boolean;
}

const membershipPlans: MembershipPlan[] = [
  {
    type: "TRIAL",
    name: "Free Trial",
    price: 0,
    validity: 15,
    features: [
      "15 days free access",
      "Browse all auctions",
      "Place bids",
      "List vehicles",
      "View vehicle details",
    ],
  },
  {
    type: "SILVER",
    name: "Silver Membership",
    price: 2000,
    validity: 30,
    features: [
      "30 days access",
      "Unlimited bidding",
      "List unlimited vehicles",
      "Priority support",
      "Email notifications",
    ],
  },
  {
    type: "GOLD",
    name: "Gold Membership",
    price: 5000,
    validity: 180,
    popular: true,
    features: [
      "180 days access",
      "Unlimited bidding",
      "List unlimited vehicles",
      "Priority support",
      "Email & SMS notifications",
      "Early access to new auctions",
      "Bulk vehicle upload",
    ],
  },
  {
    type: "DIAMOND",
    name: "Diamond Membership",
    price: 9000,
    validity: 365,
    features: [
      "365 days access (Best Value)",
      "Unlimited bidding",
      "List unlimited vehicles",
      "24/7 Priority support",
      "Email & SMS notifications",
      "Early access to new auctions",
      "Bulk vehicle upload",
      "Featured vehicle listings",
      "Analytics dashboard",
    ],
  },
];

export default function MembershipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentMembership, setCurrentMembership] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchCurrentMembership(token);
    } else {
      setLoading(false);
    }

    // Load Razorpay script
    const loadRazorpayScript = () => {
      // Check if script is already loaded
      if (window.Razorpay) {
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      
      script.onerror = () => {
        console.error("Failed to load Razorpay script. Please check your internet connection and try again.");
        toast.error("Payment gateway failed to load. Please refresh the page and try again.");
      };

      script.onload = () => {
        console.log("Razorpay script loaded successfully");
      };

      document.body.appendChild(script);
    };

    loadRazorpayScript();

    return () => {
      // Cleanup: remove script on unmount (optional, usually not needed)
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  const fetchCurrentMembership = async (token: string) => {
    try {
      const response = await fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentMembership(data.membership);
      }
    } catch (error) {
      console.error("Error fetching membership:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (plan: MembershipPlan) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to purchase membership");
      router.push("/login");
      return;
    }

    if (plan.type === "TRIAL") {
      toast.error("Free trial is automatically assigned on registration");
      return;
    }

    if (isProcessingPayment) {
      return; // Prevent multiple clicks
    }

    setIsProcessingPayment(true);

    try {
      // Create payment order
      const response = await fetch("/api/membership/purchase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipType: plan.type,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate purchase");
        setIsProcessingPayment(false);
        return;
      }

      // Check if test mode (no Razorpay configured)
      if (result.testMode) {
        toast.success("Membership activated successfully!");
        // Dispatch event to update membership banner
        window.dispatchEvent(new Event("membershipUpdated"));
        const redirectUrl = returnUrl || sessionStorage.getItem("membershipReturnUrl") || "/my-account";
        sessionStorage.removeItem("membershipReturnUrl");
        router.push(redirectUrl);
        setIsProcessingPayment(false);
        return;
      }

      // Check if Razorpay is loaded - wait a bit if not loaded yet
      if (!window.Razorpay) {
        // Try to wait for Razorpay to load (max 3 seconds)
        let attempts = 0;
        const maxAttempts = 30; // 3 seconds (100ms * 30)
        
        while (!window.Razorpay && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.Razorpay) {
          toast.error("Payment gateway failed to load. Please refresh the page and try again.");
          setIsProcessingPayment(false);
          return;
        }
      }

      // Initialize Razorpay checkout
      const options = {
        key: result.key, // Razorpay Key ID
        amount: result.amount * 100, // Amount in paise
        currency: result.currency || "INR",
        name: "Tractor Auction",
        description: `${plan.name} - ${plan.validity} days`,
        order_id: result.orderId,
        // Enable all payment methods including UPI
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        handler: async function (response: any) {
          // Payment successful - verify with backend
          try {
            const callbackResponse = await fetch("/api/membership/payment-callback", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                userId: result.userId,
                membershipType: result.membershipType,
                amount: result.amount,
              }),
            });

            const callbackResult = await callbackResponse.json();

            if (callbackResponse.ok && callbackResult.success) {
              toast.success("Payment successful! Membership activated.");
              // Refresh membership status
              fetchCurrentMembership(token);
              // Dispatch event to update membership banner
              window.dispatchEvent(new Event("membershipUpdated"));
              // Redirect back to return URL if provided
              const redirectUrl = returnUrl || sessionStorage.getItem("membershipReturnUrl") || "/my-account";
              sessionStorage.removeItem("membershipReturnUrl");
              router.push(redirectUrl);
            } else {
              toast.error(callbackResult.message || "Payment verification failed");
            }
          } catch (error) {
            console.error("Payment callback error:", error);
            toast.error("An error occurred while verifying payment");
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: result.name || "",
          email: result.email || "",
          contact: result.contact || "",
        },
        theme: {
          color: "#059669", // Primary color
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response);
        toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
        setIsProcessingPayment(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An error occurred. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  const isMembershipActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Membership Plan</h1>
          <p className="text-gray-600 text-lg">
            Select the perfect plan to unlock all features and start bidding on tractors
          </p>
        </div>

        {currentMembership && isMembershipActive(currentMembership.endDate) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-blue-800">
              <strong>Current Membership:</strong> {currentMembership.membershipType} - Valid until{" "}
              {formatDate(currentMembership.endDate)}
            </p>
          </div>
        )}

        {!isLoggedIn && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-center">
            <p className="text-yellow-800 mb-2">
              <strong>New User?</strong> Register now and get 15 days free trial!
            </p>
            <Link
              href="/register"
              className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Register Now
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {membershipPlans.map((plan) => {
            const isCurrentPlan =
              currentMembership &&
              currentMembership.membershipType === plan.type &&
              isMembershipActive(currentMembership.endDate);

            return (
              <div
                key={plan.type}
                className={`bg-white rounded-lg shadow-lg p-6 relative ${
                  plan.popular ? "border-2 border-primary-600 transform scale-105" : "border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <Package
                    className={`w-12 h-12 mx-auto mb-3 ${
                      plan.popular ? "text-primary-600" : "text-gray-400"
                    }`}
                  />
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-gray-800">Free</span>
                    ) : (
                      <>
                        <IndianRupee className="w-6 h-6" />
                        <span className="text-3xl font-bold">{plan.price.toLocaleString("en-IN")}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Valid for {plan.validity} {plan.validity === 1 ? "day" : "days"}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isLoggedIn ? (
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={isCurrentPlan || plan.type === "TRIAL" || isProcessingPayment}
                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan || isProcessingPayment
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : plan.popular
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {isProcessingPayment
                      ? "Processing..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : plan.type === "TRIAL"
                      ? "Auto-assigned"
                      : `Subscribe Now`}
                  </button>
                ) : (
                  <Link
                    href="/register"
                    className="block w-full py-3 rounded-lg font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors text-center"
                  >
                    Register to Get Started
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Why Choose Our Membership?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold mb-2">24/7 Access</h3>
              <p className="text-sm text-gray-600">
                Access auctions and listings anytime, anywhere
              </p>
            </div>
            <div className="text-center">
              <Package className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold mb-2">Unlimited Bidding</h3>
              <p className="text-sm text-gray-600">
                Place unlimited bids on all available vehicles
              </p>
            </div>
            <div className="text-center">
              <Check className="w-12 h-12 mx-auto mb-3 text-primary-600" />
              <h3 className="font-semibold mb-2">Secure Platform</h3>
              <p className="text-sm text-gray-600">
                Bank-grade security for all transactions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

