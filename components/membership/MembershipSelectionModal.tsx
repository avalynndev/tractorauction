"use client";

import { useState, useEffect } from "react";
import { X, Package, Check, IndianRupee, Sparkles, Crown, Gem } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface MembershipPlan {
  type: "TRIAL" | "SILVER" | "GOLD" | "DIAMOND";
  name: string;
  price: number;
  validity: number;
  features: string[];
  popular?: boolean;
  icon: any;
}

interface MembershipSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (planType: string) => void;
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
    icon: Package,
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
    icon: Package,
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
    icon: Crown,
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
    icon: Gem,
  },
];

export default function MembershipSelectionModal({
  isOpen,
  onClose,
  onSelect,
}: MembershipSelectionModalProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script when modal opens
  useEffect(() => {
    if (isOpen && !razorpayLoaded) {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        setRazorpayLoaded(true);
        return;
      }

      // Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Payment gateway failed to load. Please refresh the page.");
      };
      document.body.appendChild(script);

      return () => {
        // Cleanup on unmount
        const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existingScript && existingScript.parentNode) {
          existingScript.parentNode.removeChild(existingScript);
        }
      };
    }
  }, [isOpen, razorpayLoaded]);

  if (!isOpen) return null;

  const handleSelectPlan = async (plan: MembershipPlan) => {
    if (plan.type === "TRIAL") {
      // Free trial - just proceed
      onSelect("TRIAL");
      return;
    }

    setSelectedPlan(plan.type);
    setIsProcessing(true);

    // Show loading message
    toast.loading("Preparing subscription payment...", { id: "membership-payment" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login first", { id: "membership-payment" });
        setIsProcessing(false);
        setSelectedPlan(null);
        return;
      }

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
        toast.error(result.message || "Failed to initiate purchase", { id: "membership-payment" });
        setIsProcessing(false);
        setSelectedPlan(null);
        return;
      }

      // Check if test mode (no Razorpay configured)
      if (result.testMode) {
        toast.success("Membership subscription activated successfully!", { id: "membership-payment" });
        onSelect(plan.type);
        setIsProcessing(false);
        return;
      }

      // Wait for Razorpay to be loaded
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: "membership-payment" });
        setIsProcessing(false);
        setSelectedPlan(null);
        return;
      }

      // Dismiss loading toast and show redirect message
      toast.dismiss("membership-payment");
      toast.success("Redirecting to Razorpay for subscription payment...", { duration: 2000 });

      // Open Razorpay checkout
      openRazorpayCheckout(result, plan);
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("An error occurred. Please try again.", { id: "membership-payment" });
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  const openRazorpayCheckout = (result: any, plan: MembershipPlan) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway is loading. Please try again.");
      setIsProcessing(false);
      setSelectedPlan(null);
      return;
    }

    const options = {
      key: result.key,
      amount: result.amount * 100,
      currency: result.currency || "INR",
      name: "Tractor Auction",
      description: `Membership Subscription: ${plan.name} - ${plan.validity} days`,
      order_id: result.orderId,
      subscription_id: undefined, // For one-time payments, leave undefined
      handler: async function (response: any) {
        try {
          const token = localStorage.getItem("token");
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
            onSelect(plan.type);
          } else {
            toast.error(callbackResult.message || "Payment verification failed");
          }
        } catch (error) {
          console.error("Payment callback error:", error);
          toast.error("An error occurred while verifying payment");
        } finally {
          setIsProcessing(false);
          setSelectedPlan(null);
        }
      },
      theme: {
        color: "#059669",
      },
      modal: {
        ondismiss: function () {
          setIsProcessing(false);
          setSelectedPlan(null);
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response: any) {
      console.error("Payment failed:", response);
      toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
      setIsProcessing(false);
      setSelectedPlan(null);
    });

    razorpay.open();
  };

  const handleSkip = () => {
    // User chooses to skip and use free trial
    onSelect("TRIAL");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Choose Your Membership Plan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="text-center mb-6">
            <p className="text-lg text-gray-700 mb-2">
              🎉 <strong>Welcome! Registration Successful!</strong>
            </p>
            <p className="text-gray-600 mb-2">
              Choose a membership subscription plan to unlock all features, or start with our free 15-day trial.
            </p>
            {!razorpayLoaded && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-2">
                <p className="text-xs text-yellow-800">
                  ⏳ Loading payment gateway...
                </p>
              </div>
            )}
          </div>

          {/* Membership Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {membershipPlans.map((plan) => {
              const Icon = plan.icon;
              const isSelected = selectedPlan === plan.type;
              const isProcessingPlan = isProcessing && isSelected;

              return (
                <div
                  key={plan.type}
                  className={`bg-white rounded-lg border-2 p-5 relative transition-all cursor-pointer hover:shadow-lg ${
                    plan.popular
                      ? "border-primary-600 transform scale-105"
                      : isSelected
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200 hover:border-primary-300"
                  }`}
                  onClick={() => !isProcessing && handleSelectPlan(plan)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <Icon
                      className={`w-10 h-10 mx-auto mb-2 ${
                        plan.popular ? "text-primary-600" : "text-gray-400"
                      }`}
                    />
                    <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center">
                      {plan.price === 0 ? (
                        <span className="text-2xl font-bold text-gray-800">Free</span>
                      ) : (
                        <>
                          <IndianRupee className="w-5 h-5" />
                          <span className="text-2xl font-bold">{plan.price.toLocaleString("en-IN")}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.validity} {plan.validity === 1 ? "day" : "days"}
                    </p>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <li key={index} className="flex items-start text-xs">
                        <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 4 && (
                      <li className="text-xs text-primary-600 font-semibold">
                        +{plan.features.length - 4} more features
                      </li>
                    )}
                  </ul>

                  <button
                    disabled={isProcessingPlan || (plan.type !== "TRIAL" && !razorpayLoaded)}
                    className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      isProcessingPlan || (plan.type !== "TRIAL" && !razorpayLoaded)
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : plan.popular
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : plan.type === "TRIAL"
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-gray-800 text-white hover:bg-gray-900"
                    }`}
                  >
                    {isProcessingPlan
                      ? "Processing..."
                      : plan.type !== "TRIAL" && !razorpayLoaded
                      ? "Loading Payment..."
                      : plan.type === "TRIAL"
                      ? "Start Free Trial"
                      : "Subscribe Now"}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Skip Option */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">
              Not ready to choose? You'll automatically get a 15-day free trial.
            </p>
            <button
              onClick={handleSkip}
              disabled={isProcessing}
              className="text-primary-600 hover:text-primary-700 font-semibold text-sm underline disabled:opacity-50"
            >
              Skip for Now (Use Free Trial)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

