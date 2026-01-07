"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, ShoppingCart, User, LogOut, Gavel, Edit2, Check, X, Clock, MapPin, IndianRupee, Eye, Calendar, AlertCircle, Mail, Settings, Camera, Lock, Phone, Upload, Trash2, Heart, Bookmark, Shield, CreditCard, FileText, CheckCircle2, XCircle, AlertTriangle, Sparkles, ArrowUp, Crown, AlertTriangle as DisputeIcon, Bell, BarChart3 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatDate, formatDateTime } from "@/lib/date-format";
import PageLoader from "@/components/ui/PageLoader";

// Declare Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Membership {
  id: string;
  membershipType: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: string;
}

interface Vehicle {
  id: string;
  vehicleType: string;
  saleType: string;
  tractorBrand: string;
  tractorModel: string | null;
  engineHP: string;
  yearOfMfg: number;
  status: string;
  saleAmount: number;
  mainPhoto: string | null;
  createdAt: string;
  auction?: {
    id: string;
    status: string;
    currentBid: number;
    startTime: string;
    endTime: string;
    sellerApprovalStatus: string;
    bids: Array<{ bidAmount: number; bidTime: string }>;
  };
  purchases?: Array<{ id: string; purchasePrice: number; status: string }>;
}

interface Bid {
  id: string;
  bidAmount: number;
  bidTime: string;
  isWinningBid: boolean;
  auction: {
    id: string;
    status: string;
    sellerApprovalStatus?: string;
    currentBid: number;
    endTime: string;
    vehicle: {
      id: string;
      tractorBrand: string;
      tractorModel: string | null;
      engineHP: string;
      yearOfMfg: number;
      mainPhoto: string | null;
      vehicleType: string;
      state: string;
    };
  };
}

interface Purchase {
  id: string;
  purchasePrice: number;
  purchaseType: string;
  status: string;
  balanceAmount?: number | null;
  emdApplied?: boolean;
  emdAmount?: number | null;
  transactionFee?: number | null;
  transactionFeePaid?: boolean;
  createdAt: string;
  vehicle: {
    id: string;
    tractorBrand: string;
    tractorModel: string | null;
    engineHP: string;
    yearOfMfg: number;
    mainPhoto: string | null;
    vehicleType: string;
    state: string;
    saleType: string;
  };
}

interface UserData {
  id: string;
  identificationNumber?: string;
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string | null;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  role: string;
  registrationType?: string;
  gstNumber?: string | null;
  registrationFeePaid?: boolean;
  emdPaid?: boolean;
  isEligibleForBid?: boolean;
  eligibleForBidReason?: string | null;
  membership?: Membership;
  memberships?: Membership[];
  panCard?: string | null;
  aadharCard?: string | null;
  cancelledCheque?: string | null;
  gstCopy?: string | null;
  cin?: string | null;
  otherDocuments?: string | null;
  kycStatus?: string;
  kycSubmittedAt?: string | null;
  kycApprovedAt?: string | null;
  kycRejectedAt?: string | null;
  kycRejectionReason?: string | null;
}

export default function MyAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState<"sell" | "buy" | "settings">("sell");
  const [emailPreferences, setEmailPreferences] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<any>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidFilterStatus, setBidFilterStatus] = useState<string>("all");
  const [bidFilterOutcome, setBidFilterOutcome] = useState<string>("all");
  const [bidSortBy, setBidSortBy] = useState<string>("date-desc");
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showPhoneChange, setShowPhoneChange] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingKYC, setUploadingKYC] = useState<{ pan: boolean; aadhar: boolean; cheque: boolean; gst: boolean; cin: boolean; others: boolean }>({ pan: false, aadhar: false, cheque: false, gst: false, cin: false, others: false });
  const [upgradingMembership, setUpgradingMembership] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null); // "registration" | "emd" | "transaction"
  const [processingBalancePayment, setProcessingBalancePayment] = useState<string | null>(null);
  const [processingTransactionFeePayment, setProcessingTransactionFeePayment] = useState<string | null>(null);
  // Feedback form state
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    businessRating: 5,
    serviceRating: 5,
    webAppRating: 5,
    mobileAppRating: 5,
    detailedFeedback: "",
    tractorIndustrySince: "",
  });
  const [existingFeedback, setExistingFeedback] = useState<any>(null);

  // Load Razorpay script
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      setRazorpayLoaded(true);
    };
    script.onerror = () => {
      console.error("Failed to load Razorpay script");
    };
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

  useEffect(() => {
    // Helper function to get cookie
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    // Try multiple sources for token
    let token = localStorage.getItem("token") || 
                sessionStorage.getItem("token") || 
                getCookie("token");
    
    console.log("My Account - Token check:", {
      localStorage: !!localStorage.getItem("token"),
      sessionStorage: !!sessionStorage.getItem("token"),
      cookie: !!getCookie("token"),
      tokenFound: !!token,
      tokenPreview: token ? token.substring(0, 20) + "..." : "none"
    });
    
    if (!token || token === "undefined" || token === "null") {
      console.log("No valid token found, redirecting to login");
      // Use window.location for hard redirect to prevent loops
      window.location.href = "/login";
      return;
    }

    console.log("Token found, fetching user data...");
    // Small delay to ensure token is fully saved and page is ready
    const fetchTimer = setTimeout(() => {
      fetchUserData(token);
    }, 100);
    
    return () => {
      clearTimeout(fetchTimer);
    };
  }, [router]);

  const fetchUserData = async (token: string, retryCount = 0) => {
    let isCancelled = false;
    const abortController = new AbortController();
    const MAX_RETRIES = 3; // Increased retries
    const RETRY_DELAY = 1000; // 1 second
    
    try {
      if (!token || token === "undefined" || token === "null") {
        console.error("Invalid token:", token);
        clearAllAuth();
        router.push("/login");
        return;
      }

      console.log("Fetching user data with token:", token.substring(0, 20) + "...", "Retry:", retryCount);
      
      // Add timeout to prevent hanging requests
      const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout (reduced)
      
      let response: Response;
      try {
        // Use relative URL to avoid protocol/versioning issues
        const apiUrl = '/api/user/me';
        
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: "include", // Include cookies
          signal: abortController.signal,
          cache: 'no-store',
          mode: 'cors', // Explicitly set CORS mode
        });
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle network errors
        if (abortController.signal.aborted || isCancelled) {
          return;
        }
        
        // Log error details for debugging
        if (process.env.NODE_ENV === 'development') {
          console.error("Fetch error details:", {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack,
            retryCount,
          });
        }
        
        // Network error - retry if we haven't exceeded max retries
        if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
          // Timeout or aborted - retry if possible
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying fetchUserData (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => {
              if (!isCancelled) {
                fetchUserData(token, retryCount + 1);
              }
            }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return;
          }
          // Max retries exceeded
          if (process.env.NODE_ENV === 'development') {
            console.error("Request timeout after retries:", fetchError);
          }
          // Don't show error on first load if it's just a timeout - might be server starting up
          if (retryCount >= MAX_RETRIES) {
            toast.error("Request timeout. Please refresh the page or check your connection.");
          }
          setLoading(false);
          return;
        }
        
        // Other network errors (TypeError: Failed to fetch, etc.) - retry if possible
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying fetchUserData after network error (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          setTimeout(() => {
            if (!isCancelled) {
              fetchUserData(token, retryCount + 1);
            }
          }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        // Max retries exceeded - show error with helpful message
        // Check if it's a network error or server issue
        const isNetworkError = fetchError.message?.includes('Failed to fetch') || 
                               fetchError.message?.includes('NetworkError') ||
                               fetchError.message?.includes('Load failed') ||
                               fetchError.name === 'TypeError';
        
        // Provide more specific error message
        let errorMessage = "Unable to connect to server.";
        if (isNetworkError) {
          errorMessage = "Unable to connect to server. Please check if the server is running and try again.";
        } else {
          errorMessage = `Network error: ${fetchError.message || 'Unknown error'}. Please check your connection and try again.`;
        }
        
        // Only show error if we've exhausted all retries
        if (retryCount >= MAX_RETRIES) {
          console.error("All retries exhausted. Final error:", {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack,
            retryCount,
          });
          toast.error(errorMessage, {
            duration: 5000, // Show for 5 seconds
          });
        }
        setLoading(false);
        return;
      }

      if (isCancelled || abortController.signal.aborted) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log("User data received:", data);
        // Set user and loading state immediately (don't wait for anything)
        setUser(data);
        setLoading(false);
        
        // Fetch memberships separately if not included
        if (!data.membership && !data.memberships?.length) {
          fetch("/api/user/me/memberships", {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((res) => res.json())
            .then((membershipData) => {
              setUser((prev) => ({
                ...prev!,
                membership: membershipData.membership,
                memberships: membershipData.memberships || [],
              }));
            })
            .catch((err) => console.error("Error fetching memberships:", err));
        }
        
        // Fetch additional data in parallel (non-blocking)
        // Use requestIdleCallback or setTimeout to allow UI to render first
        if (typeof window !== "undefined" && "requestIdleCallback" in window) {
          requestIdleCallback(() => {
            if (data.role === "SELLER" || data.role === "DEALER" || data.role === "ADMIN") {
              fetchVehicles(token);
            }
            if (data.role === "BUYER" || data.role === "DEALER" || data.role === "ADMIN") {
              fetchBids(token);
              fetchPurchases(token);
            }
            
            // Fetch email preferences for all users
            fetchEmailPreferences(token);
            fetchNotificationPreferences(token);
            // Fetch existing feedback after user is set
            fetchExistingFeedback(token);
          });
        } else {
          setTimeout(() => {
            if (data.role === "SELLER" || data.role === "DEALER" || data.role === "ADMIN") {
              fetchVehicles(token);
            }
            if (data.role === "BUYER" || data.role === "DEALER" || data.role === "ADMIN") {
              fetchBids(token);
              fetchPurchases(token);
            }
            
            // Fetch email preferences for all users
            fetchEmailPreferences(token);
            fetchNotificationPreferences(token);
            // Fetch existing feedback after user is set
            fetchExistingFeedback(token);
          }, 100);
        }
      } else {
        // Handle non-OK responses
        let errorText = "";
        try {
          errorText = await response.text();
        } catch (textError) {
          errorText = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        console.error("Failed to fetch user data:", response.status, errorText);
        
        // If 401, token is invalid - retry once in case token was just saved
        if (response.status === 401) {
          if (retryCount < 1) {
            // Retry once - token might not be fully saved yet
            console.log("401 error, retrying once...");
            setTimeout(() => {
              if (!isCancelled) {
                fetchUserData(token, retryCount + 1);
              }
            }, 500);
            return;
          }
          // After retry, still 401 - token is invalid
          clearAllAuth();
          toast.error("Session expired. Please login again.");
          // Use window.location for hard redirect to prevent loops
          window.location.href = "/login";
        } else if (response.status >= 500) {
          // Server error - retry if possible
          if (retryCount < MAX_RETRIES) {
            console.log(`Server error ${response.status}, retrying (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
            setTimeout(() => {
              if (!isCancelled) {
                fetchUserData(token, retryCount + 1);
              }
            }, RETRY_DELAY * (retryCount + 1));
            return;
          }
          toast.error("Server error. Please try again in a moment.");
          setLoading(false);
        } else {
          // Other client errors (400, 403, etc.)
          toast.error("Failed to load user data. Please try again.");
          setLoading(false);
        }
      }
    } catch (error: any) {
      // Handle network errors silently
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return; // Silently ignore aborted requests
      }

      // Only log/show error for non-network issues
      if (!error.message?.includes('fetch') && !error.message?.includes('Failed')) {
        console.error("Error fetching user data:", error);
      }
      
      toast.error("Failed to load user data. Please check your connection.");
      setLoading(false);
      // Don't clear auth on network errors
    }
  };

  const fetchVehicles = async (token: string) => {
    setLoadingVehicles(true);
    try {
      const response = await fetch("/api/my-account/vehicles", {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setVehicles(data.vehicles || []);
      }
    } catch (error: any) {
      // Silently handle network errors - vehicles are loaded in background
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching vehicles:", error);
      }
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchBids = async (token: string) => {
    setLoadingBids(true);
    try {
      const response = await fetch("/api/my-account/bids", {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      }
    } catch (error: any) {
      // Silently handle network errors - bids are loaded in background
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching bids:", error);
      }
    } finally {
      setLoadingBids(false);
    }
  };

  // Filter and sort bids
  const filteredBids = useMemo(() => {
    let filtered = [...bids];

    // Filter by status
    if (bidFilterStatus !== "all") {
      filtered = filtered.filter((bid) => bid.auction.status === bidFilterStatus);
    }

    // Filter by outcome
    if (bidFilterOutcome === "winning") {
      filtered = filtered.filter((bid) => bid.isWinningBid);
    } else if (bidFilterOutcome === "outbid") {
      filtered = filtered.filter((bid) => !bid.isWinningBid && bid.auction.status === "ENDED");
    }

    // Sort
    filtered.sort((a, b) => {
      switch (bidSortBy) {
        case "date-asc":
          return new Date(a.bidTime).getTime() - new Date(b.bidTime).getTime();
        case "date-desc":
          return new Date(b.bidTime).getTime() - new Date(a.bidTime).getTime();
        case "amount-asc":
          return a.bidAmount - b.bidAmount;
        case "amount-desc":
          return b.bidAmount - a.bidAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [bids, bidFilterStatus, bidFilterOutcome, bidSortBy]);

  const fetchPurchases = async (token: string) => {
    setLoadingPurchases(true);
    try {
      const response = await fetch("/api/my-account/purchases", {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
      }
    } catch (error: any) {
      // Silently handle network errors - purchases are loaded in background
      if (process.env.NODE_ENV === 'development') {
        console.error("Error fetching purchases:", error);
      }
    } finally {
      setLoadingPurchases(false);
    }
  };

  const fetchEmailPreferences = async (token: string) => {
    try {
      const response = await fetch("/api/user/email-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEmailPreferences(data.preferences);
        setEmailInput(data.preferences.email || "");
      }
    } catch (error) {
      console.error("Error fetching email preferences:", error);
    }
  };

  const fetchNotificationPreferences = async (token: string) => {
    try {
      const response = await fetch("/api/user/notification-preferences", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNotificationPrefs(data.preferences);
      }
    } catch (error) {
      console.error("Error fetching notification preferences:", error);
    }
  };

  const fetchExistingFeedback = async (token: string) => {
    try {
      // Get user's own feedback by checking all feedbacks
      const response = await fetch("/api/feedback?includePending=true", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const feedbacks = await response.json();
        // Find the most recent feedback from current user
        if (user?.id) {
          const userFeedback = feedbacks
            .filter((fb: any) => fb.reviewer?.id === user.id)
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
          if (userFeedback) {
            setExistingFeedback(userFeedback);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching existing feedback:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    if (feedbackData.detailedFeedback.trim().length < 10) {
      toast.error("Detailed feedback must be at least 10 characters");
      return;
    }

    setSubmittingFeedback(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessRating: feedbackData.businessRating,
          serviceRating: feedbackData.serviceRating,
          webAppRating: feedbackData.webAppRating,
          mobileAppRating: feedbackData.mobileAppRating,
          detailedFeedback: feedbackData.detailedFeedback.trim(),
          tractorIndustrySince: feedbackData.tractorIndustrySince ? parseInt(feedbackData.tractorIndustrySince) : null,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Feedback submitted successfully! It will be reviewed by admin.");
        setExistingFeedback(result.feedback);
        setShowFeedbackForm(false);
        setFeedbackData({
          businessRating: 5,
          serviceRating: 5,
          webAppRating: 5,
          mobileAppRating: 5,
          detailedFeedback: "",
          tractorIndustrySince: "",
        });
      } else {
        toast.error(result.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleUpdateNotificationPrefs = async (prefKey: string, value: boolean) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setSavingPrefs(true);
    try {
      const updatedPrefs = { ...notificationPrefs, [prefKey]: value };
      setNotificationPrefs(updatedPrefs);

      const response = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [prefKey]: value }),
      });

      if (response.ok) {
        toast.success("Notification preference updated");
      } else {
        // Revert on error
        setNotificationPrefs(notificationPrefs);
        const error = await response.json();
        toast.error(error.message || "Failed to update preference");
      }
    } catch (error) {
      setNotificationPrefs(notificationPrefs);
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update preference");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleUpdateEmail = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setSavingEmail(true);
    try {
      const response = await fetch("/api/user/email-preferences", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailInput || null }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailPreferences(data.preferences);
        setUser({ ...user!, email: data.preferences.email });
        toast.success(data.preferences.email ? "Email updated successfully" : "Email removed successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update email");
      }
    } catch (error) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email");
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdateDetails = async (updatedData: Partial<UserData>) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch("/api/user/update", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({ ...user!, ...data.user });
        setIsEditingDetails(false);
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/user/profile/photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUser({ ...user!, profilePhoto: data.photoUrl });
        toast.success("Profile photo updated successfully");
      } else {
        toast.error(data.message || "Failed to upload photo");
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    if (!confirm("Are you sure you want to remove your profile photo?")) return;

    setUploadingPhoto(true);
    try {
      const response = await fetch("/api/user/profile/photo", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setUser({ ...user!, profilePhoto: null });
        toast.success("Profile photo removed successfully");
      } else {
        toast.error(data.message || "Failed to remove photo");
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Failed to remove photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleKYCUpload = async (documentType: "PAN" | "AADHAR" | "CANCELLED_CHEQUE" | "GST_COPY" | "CIN" | "OTHERS", file: File) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const keyMap: Record<string, "pan" | "aadhar" | "cheque" | "gst" | "cin" | "others"> = {
      "PAN": "pan",
      "AADHAR": "aadhar",
      "CANCELLED_CHEQUE": "cheque",
      "GST_COPY": "gst",
      "CIN": "cin",
      "OTHERS": "others",
    };
    const key = keyMap[documentType];
    setUploadingKYC({ ...uploadingKYC, [key]: true });
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);

      const response = await fetch("/api/user/kyc/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setUser({ ...user!, ...data.kyc });
        toast.success(`${documentType} card uploaded successfully`);
        // Refresh user data to get updated KYC status
        fetchUserData(token);
      } else {
        toast.error(data.message || `Failed to upload ${documentType} card`);
      }
    } catch (error) {
      console.error(`Error uploading ${documentType} card:`, error);
      toast.error(`Failed to upload ${documentType} card`);
    } finally {
      const keyMap: Record<string, "pan" | "aadhar" | "cheque" | "gst" | "cin" | "others"> = {
        "PAN": "pan",
        "AADHAR": "aadhar",
        "CANCELLED_CHEQUE": "cheque",
        "GST_COPY": "gst",
        "CIN": "cin",
        "OTHERS": "others",
      };
      const key = keyMap[documentType];
      setUploadingKYC({ ...uploadingKYC, [key]: false });
    }
  };

  const clearAllAuth = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    // Clear cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  const handleLogout = () => {
    clearAllAuth();
    
    // Dispatch custom event to notify header component
    window.dispatchEvent(new Event("userLogout"));
    
    toast.success("Logged out successfully");
    // Use hard redirect to ensure clean state
    window.location.href = "/";
  };

  // Show skeleton UI immediately instead of blocking loader
  // This allows buttons and navigation to appear right away
  if (loading && !user) {
    return <PageLoader text="Loading your account..." />;
  }

  // If we have user data, show UI even if still loading other data
  if (!user) {
    return null;
  }

  const getMembershipTypeName = (type: string) => {
    switch (type) {
      case "TRIAL":
        return "Free Trial";
      case "SILVER":
        return "Silver Membership";
      case "GOLD":
        return "Gold Membership";
      case "DIAMOND":
        return "Diamond Membership";
      default:
        return type;
    }
  };

  const isMembershipActive = (endDate: string) => {
    return new Date(endDate) > new Date();
  };

  const getDaysRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getMembershipValidity = (type: string) => {
    switch (type) {
      case "TRIAL":
        return "15 Days";
      case "SILVER":
        return "30 Days";
      case "GOLD":
        return "180 Days";
      case "DIAMOND":
        return "365 Days";
      default:
        return "N/A";
    }
  };

  const getMembershipPrice = (type: string) => {
    switch (type) {
      case "TRIAL":
        return "Free";
      case "SILVER":
        return "₹2,000";
      case "GOLD":
        return "₹5,000";
      case "DIAMOND":
        return "₹9,000";
      default:
        return "N/A";
    }
  };

  const getMembershipTier = (type: string): number => {
    switch (type) {
      case "TRIAL":
        return 0;
      case "SILVER":
        return 1;
      case "GOLD":
        return 2;
      case "DIAMOND":
        return 3;
      default:
        return -1;
    }
  };

  const canUpgradeTo = (targetType: string): boolean => {
    if (!user?.membership) return true; // No membership, can upgrade to any
    const currentTier = getMembershipTier(user.membership.membershipType);
    const targetTier = getMembershipTier(targetType);
    return targetTier > currentTier;
  };

  const handleUpgradeMembership = async (membershipType: "SILVER" | "GOLD" | "DIAMOND") => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    setUpgradingMembership(membershipType);
    toast.loading("Preparing subscription upgrade...", { id: "upgrade-membership" });

    try {
      // Create payment order
      const response = await fetch("/api/membership/purchase", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          membershipType: membershipType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate upgrade", { id: "upgrade-membership" });
        setUpgradingMembership(null);
        return;
      }

      // Check if test mode (no Razorpay configured)
      if (result.testMode) {
        toast.success("Membership upgraded successfully!", { id: "upgrade-membership" });
        window.dispatchEvent(new Event("membershipUpdated"));
        fetchUserData(token); // Refresh user data
        setUpgradingMembership(null);
        return;
      }

      // Wait for Razorpay to be loaded
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: "upgrade-membership" });
        setUpgradingMembership(null);
        return;
      }

      // Dismiss loading toast and show redirect message
      toast.dismiss("upgrade-membership");
      toast.success("Redirecting to Razorpay for subscription payment...", { duration: 2000 });

      // Open Razorpay checkout
      openRazorpayCheckout(result, membershipType, token);
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("An error occurred. Please try again.", { id: "upgrade-membership" });
      setUpgradingMembership(null);
    }
  };

  const handleFeePayment = async (feeType: "registration" | "emd" | "transaction") => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    setProcessingPayment(feeType);
    toast.loading(`Processing ${feeType === "registration" ? "Registration Fee" : feeType === "emd" ? "EMD" : "Transaction Fee"} payment...`, { id: `payment-${feeType}` });

    try {
      let endpoint = "";
      let amount = 0;
      let description = "";

      if (feeType === "registration") {
        endpoint = "/api/payments/registration-fee";
        amount = 0; // Currently free
        description = "Registration Fee";
      } else if (feeType === "emd") {
        endpoint = "/api/payments/emd";
        amount = 10000;
        description = "Earnest Money Deposit (EMD)";
      } else {
        toast.error("Transaction fee is paid after winning an auction", { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      // Validate endpoint
      if (!endpoint) {
        console.error("Payment error: Endpoint is empty for feeType:", feeType);
        toast.error("Invalid payment type. Please try again.", { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      // Log the endpoint being called for debugging
      console.log("Initiating payment request:", { endpoint, feeType, description });

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include", // Include cookies for consistency
          cache: "no-store", // Ensure fresh request
        });
      } catch (fetchError: any) {
        // Handle network errors (Failed to fetch, etc.)
        console.error("Network error during payment:", {
          error: fetchError,
          name: fetchError?.name,
          message: fetchError?.message,
          endpoint,
          feeType,
          stack: fetchError?.stack,
        });
        
        // Provide more specific error message
        let errorMessage = "Network error. Please check your connection and ensure the server is running.";
        if (fetchError?.message?.includes("Failed to fetch")) {
          errorMessage = "Unable to connect to server. Please ensure the development server is running and try again.";
        }
        
        toast.error(errorMessage, { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      // Read response as text first, then parse JSON
      const responseText = await response.text();
      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (jsonError) {
        // Handle JSON parsing errors
        console.error("Failed to parse response:", jsonError);
        console.error("Response text:", responseText);
        toast.error("Invalid response from server. Please try again.", { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate payment", { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      // Check if test mode (no Razorpay configured or free)
      if (result.testMode || amount === 0) {
        toast.success(`${description} processed successfully!`, { id: `payment-${feeType}` });
        fetchUserData(token); // Refresh user data
        setProcessingPayment(null);
        return;
      }

      // Wait for Razorpay to be loaded
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: `payment-${feeType}` });
        setProcessingPayment(null);
        return;
      }

      // Dismiss loading toast
      toast.dismiss(`payment-${feeType}`);
      toast.success(`Redirecting to Razorpay for ${description}...`, { duration: 2000 });

      // Open Razorpay checkout
      openRazorpayCheckoutForFee(result, feeType, token);
    } catch (error: any) {
      console.error("Payment error:", error);
      const errorMessage = error?.message?.includes("Failed to fetch") 
        ? "Network error. Please check your connection and try again."
        : error?.message || "An error occurred. Please try again.";
      toast.error(errorMessage, { id: `payment-${feeType}` });
      setProcessingPayment(null);
    }
  };

  const openRazorpayCheckoutForFee = (result: any, feeType: "registration" | "emd" | "transaction", token: string) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway is loading. Please try again.");
      setProcessingPayment(null);
      return;
    }

    const feeNames: { [key: string]: string } = {
      registration: "Registration Fee",
      emd: "Earnest Money Deposit (EMD)",
      transaction: "Transaction Fee",
    };

    const options = {
      key: result.key,
      amount: result.amount * 100,
      currency: result.currency || "INR",
      name: "Tractor Auction",
      description: feeNames[feeType],
      order_id: result.orderId,
      handler: async function (response: any) {
        try {
          const callbackEndpoint = feeType === "registration" 
            ? "/api/payments/registration-fee/callback"
            : "/api/payments/emd/callback";

          const callbackResponse = await fetch(callbackEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              amount: result.amount,
            }),
          });

          const callbackResult = await callbackResponse.json();

          if (callbackResponse.ok && callbackResult.success) {
            toast.success(`${feeNames[feeType]} paid successfully!`);
            fetchUserData(token); // Refresh user data
          } else {
            toast.error(callbackResult.message || "Payment verification failed");
          }
        } catch (error) {
          console.error("Payment callback error:", error);
          toast.error("An error occurred while verifying payment");
        } finally {
          setProcessingPayment(null);
        }
      },
      prefill: {
        name: result.name || "",
        email: result.email || "",
        contact: result.contact || "",
      },
      theme: {
        color: "#059669",
      },
      modal: {
        ondismiss: function () {
          setProcessingPayment(null);
          toast.error("Payment cancelled");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response: any) {
      console.error("Payment failed:", response);
      toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
      setProcessingPayment(null);
    });

    razorpay.open();
  };

  const openRazorpayCheckout = (result: any, membershipType: string, token: string) => {
    if (!window.Razorpay) {
      toast.error("Payment gateway is loading. Please try again.");
      setUpgradingMembership(null);
      return;
    }

    const membershipNames: { [key: string]: { name: string; validity: number } } = {
      SILVER: { name: "Silver Membership", validity: 30 },
      GOLD: { name: "Gold Membership", validity: 180 },
      DIAMOND: { name: "Diamond Membership", validity: 365 },
    };

    const plan = membershipNames[membershipType];

    const options = {
      key: result.key,
      amount: result.amount * 100,
      currency: result.currency || "INR",
      name: "Tractor Auction",
      description: `Membership Subscription Upgrade: ${plan.name} - ${plan.validity} days`,
      order_id: result.orderId,
      // Enable all payment methods including UPI
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },
      handler: async function (response: any) {
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
            toast.success("Payment successful! Membership upgraded.");
            window.dispatchEvent(new Event("membershipUpdated"));
            // Refresh user data
            fetchUserData(token);
          } else {
            toast.error(callbackResult.message || "Payment verification failed");
          }
        } catch (error) {
          console.error("Payment callback error:", error);
          toast.error("An error occurred while verifying payment");
        } finally {
          setUpgradingMembership(null);
        }
      },
      theme: {
        color: "#059669",
      },
      modal: {
        ondismiss: function () {
          setUpgradingMembership(null);
          toast.error("Payment cancelled");
        },
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", function (response: any) {
      console.error("Payment failed:", response);
      toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
      setUpgradingMembership(null);
    });

    razorpay.open();
  };

  const handleBalancePayment = async (purchaseId: string) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login first");
      router.push("/login");
      return;
    }

    setProcessingBalancePayment(purchaseId);
    toast.loading("Initiating balance payment...", { id: `balance-${purchaseId}` });

    try {
      const response = await fetch(`/api/purchases/${purchaseId}/balance-payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to initiate balance payment", { id: `balance-${purchaseId}` });
        setProcessingBalancePayment(null);
        return;
      }

      // Check if test mode
      if (result.testMode) {
        toast.success("Balance payment completed successfully!", { id: `balance-${purchaseId}` });
        fetchPurchases(token); // Refresh purchases
        setProcessingBalancePayment(null);
        return;
      }

      // Wait for Razorpay to be loaded
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: `balance-${purchaseId}` });
        setProcessingBalancePayment(null);
        return;
      }

      // Dismiss loading toast
      toast.dismiss(`balance-${purchaseId}`);
      toast.success("Redirecting to Razorpay for balance payment...", { duration: 2000 });

      // Open Razorpay checkout
      const options = {
        key: result.key,
        amount: result.amount * 100,
        currency: result.currency || "INR",
        name: "Tractor Auction",
        description: `Balance Payment for Purchase #${purchaseId.substring(0, 8)}`,
        order_id: result.orderId,
        handler: async function (response: any) {
          try {
            const callbackResponse = await fetch(`/api/purchases/${purchaseId}/balance-payment/callback`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: result.amount,
              }),
            });

            const callbackResult = await callbackResponse.json();

            if (callbackResponse.ok && callbackResult.success) {
              toast.success("Balance payment completed successfully!", { id: `balance-${purchaseId}` });
              fetchPurchases(token); // Refresh purchases
            } else {
              toast.error(callbackResult.message || "Payment verification failed", { id: `balance-${purchaseId}` });
            }
          } catch (error) {
            console.error("Balance payment callback error:", error);
            toast.error("An error occurred while verifying payment", { id: `balance-${purchaseId}` });
          } finally {
            setProcessingBalancePayment(null);
          }
        },
        prefill: {
          name: result.name || "",
          email: result.email || "",
          contact: result.contact || "",
        },
        theme: {
          color: "#F97316", // Orange color for balance payment
        },
        modal: {
          ondismiss: function () {
            setProcessingBalancePayment(null);
            toast.error("Balance payment cancelled", { id: `balance-${purchaseId}` });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Balance payment failed:", response);
        toast.error(`Balance payment failed: ${response.error.description || "Unknown error"}`, { id: `balance-${purchaseId}` });
        setProcessingBalancePayment(null);
      });
      razorpay.open();
    } catch (error) {
      console.error("Balance payment error:", error);
      toast.error("An error occurred during balance payment. Please try again.", { id: `balance-${purchaseId}` });
      setProcessingBalancePayment(null);
    }
  };

  const handleTransactionFeePayment = async (purchaseId: string) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      toast.error("Please login to continue");
      router.push("/login");
      return;
    }

    try {
      setProcessingTransactionFeePayment(purchaseId);
      toast.loading("Initiating transaction fee payment...", { id: `tx-fee-${purchaseId}` });

      const response = await fetch(`/api/purchases/${purchaseId}/transaction-fee`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to initiate transaction fee payment");
      }

      // Test mode: Payment is already completed
      if (result.success) {
        toast.success("Transaction fee paid successfully!", { id: `tx-fee-${purchaseId}` });
        fetchPurchases(token); // Refresh purchases
        setProcessingTransactionFeePayment(null);
        return;
      }

      // Razorpay payment flow
      if (!razorpayLoaded || !window.Razorpay) {
        toast.error("Payment gateway is loading. Please wait a moment and try again.", { id: `tx-fee-${purchaseId}` });
        setProcessingTransactionFeePayment(null);
        return;
      }

      toast.dismiss(`tx-fee-${purchaseId}`);

      const options = {
        key: result.key,
        amount: Math.round(result.amount * 100), // Convert to paise
        currency: result.currency,
        name: result.name,
        description: result.description,
        order_id: result.orderId,
        handler: async function (response: any) {
          try {
            const callbackResponse = await fetch(`/api/purchases/${purchaseId}/transaction-fee/callback`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const callbackResult = await callbackResponse.json();

            if (callbackResponse.ok && callbackResult.success) {
              toast.success("Transaction fee payment completed successfully!", { id: `tx-fee-${purchaseId}` });
              fetchPurchases(token); // Refresh purchases
            } else {
              toast.error(callbackResult.message || "Payment verification failed", { id: `tx-fee-${purchaseId}` });
            }
          } catch (error) {
            console.error("Transaction fee payment callback error:", error);
            toast.error("An error occurred while verifying payment", { id: `tx-fee-${purchaseId}` });
          } finally {
            setProcessingTransactionFeePayment(null);
          }
        },
        prefill: {
          name: result.prefill?.name || "",
          email: result.prefill?.email || "",
          contact: result.prefill?.contact || "",
        },
        theme: {
          color: "#8B5CF6", // Purple color for transaction fee
        },
        modal: {
          ondismiss: function () {
            setProcessingTransactionFeePayment(null);
            toast.error("Transaction fee payment cancelled", { id: `tx-fee-${purchaseId}` });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Transaction fee payment failed:", response);
        toast.error(`Transaction fee payment failed: ${response.error.description || "Unknown error"}`, { id: `tx-fee-${purchaseId}` });
        setProcessingTransactionFeePayment(null);
      });
      razorpay.open();
    } catch (error) {
      console.error("Transaction fee payment error:", error);
      toast.error("An error occurred during transaction fee payment. Please try again.", { id: `tx-fee-${purchaseId}` });
      setProcessingTransactionFeePayment(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Enhanced Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                My Account
              </h1>
            </div>
            
            {/* Enhanced Welcome Section - Centered Welcome & Name, Right Aligned Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 sm:gap-4 w-full lg:w-auto">
              {/* Welcome Text with Icon - Centered */}
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg sm:rounded-xl shadow-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 bg-clip-text text-transparent whitespace-nowrap">
                  Welcome Back!
                </h2>
              </div>
              
              {/* Name - Centered */}
              <div className="flex items-center gap-2">
                <span className="text-gray-400 font-medium">,</span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent whitespace-nowrap">
                  {user.fullName}
                </h3>
              </div>
              
              {/* Role Badge - Right Aligned */}
              <div className="relative ml-auto lg:ml-0">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl blur opacity-50"></div>
                <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 px-3 sm:px-4 py-2 rounded-xl shadow-lg border border-primary-400 flex items-center gap-2">
                  <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <p className="text-sm sm:text-base font-bold text-white whitespace-nowrap">
                    {user.role === "DEALER" ? "Dealer" : user.role === "BUYER" ? "Buyer" : user.role === "SELLER" ? "Seller" : user.role === "ADMIN" ? "Administrator" : user.role}
                  </p>
                </div>
              </div>
              
              {/* KYC Verified Badge - Right Aligned */}
              {user.kycStatus === "APPROVED" && (
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-xl blur opacity-50"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-green-600 px-3 sm:px-4 py-2 rounded-xl shadow-lg border border-green-400 flex items-center gap-2">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                    <p className="text-sm sm:text-base font-bold text-white whitespace-nowrap">Verified</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Quick Access Buttons */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Primary Actions */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Link
                  href="/sell/upload"
                  className="group bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <Truck className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>List New Vehicle</span>
                </Link>
                <button
                  onClick={() => {
                    const feeSection = document.getElementById("fee-section");
                    feeSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-3 rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <IndianRupee className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Fee Structure</span>
                </button>
                <button
                  onClick={() => {
                    const membershipSection = document.getElementById("membership-details");
                    membershipSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Membership</span>
                </button>
                <Link
                  href="/my-account/bid-analytics"
                  className="group bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <BarChart3 className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Analytics</span>
                </Link>
              </div>
            </div>

            {/* Account & Support */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Account & Support</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    const personalSection = document.getElementById("personal-details");
                    personalSection?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <User className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Personal Details</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setTimeout(() => {
                      const feedbackSection = document.getElementById("feedback-section");
                      feedbackSection?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 100);
                  }}
                  className="group bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 rounded-xl hover:from-teal-700 hover:to-teal-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <FileText className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Share Feedback</span>
                </button>
                <Link
                  href="/my-account/referral"
                  className="group bg-gradient-to-r from-pink-600 to-pink-700 text-white px-4 py-3 rounded-xl hover:from-pink-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm flex flex-col items-center justify-center space-y-2 transform hover:scale-105"
                >
                  <Sparkles className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span>Referral Program</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Fee Section */}
        <div id="fee-section" className="relative mb-6 overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-3xl"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-green-400/20 to-yellow-400/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
          
          <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-4">
                <div className="p-4 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl shadow-xl transform hover:scale-110 transition-transform duration-300">
                  <IndianRupee className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                Fee Structure
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">Transparent pricing for all services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* 1. Registration Fee */}
              <div className="group relative bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-50 rounded-2xl p-6 sm:p-8 border-2 border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-card-float overflow-hidden">
                {/* Decorative elements - Reduced blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-300/10 to-indigo-300/10 rounded-full blur-md"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-300/10 to-emerald-300/10 rounded-full blur-sm"></div>
                
                {/* Status Badge */}
                {user?.registrationFeePaid && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PAID</span>
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Registration Fee</h3>
                        <p className="text-xs text-gray-500 font-medium">One Time Activation</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50 animate-badge-pulse"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                        FREE
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-price-glow">
                        ₹10,000
                      </span>
                      <span className="text-lg text-gray-400 line-through font-semibold">₹10,000</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">One Time Payment</span>
                    </div>
                  </div>

                  {/* Special Offer Badge */}
                  <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 p-4 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        <p className="text-sm font-black text-white">
                          Special Offer: Free Registration
                        </p>
                      </div>
                      <p className="text-xs text-green-50 font-semibold">
                        ₹10,000* Absolutely Free. *Valid till 31st March 2026
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-xl p-4 mb-6 border border-blue-200">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-black text-gray-900">Registration Fee:</span> In order to register with the Auctioneer, the prospective Bidder must pay to the Auctioneer a non-refundable one time activation fee ("Registration Fee") as published at www.tractorauction.in or such other Registration Fee as may be prescribed by Auctioneer from time to time.
                    </p>
                  </div>

                  {/* Pay Now Button */}
                  <button
                    onClick={() => handleFeePayment("registration")}
                    disabled={processingPayment === "registration"}
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    <CreditCard className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{processingPayment === "registration" ? "Processing..." : "Pay Now"}</span>
                  </button>
                </div>
              </div>

              {/* 2. Membership Fee */}
              <div className="group relative bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-card-float overflow-hidden" style={{ animationDelay: '0.5s' }}>
                {/* Decorative elements - Reduced blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/10 to-pink-300/10 rounded-full blur-md"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-violet-300/10 to-purple-300/10 rounded-full blur-sm"></div>
                
                {/* Status Badge - Single badge only */}
                {user?.membership && isMembershipActive(user.membership.endDate) && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVE</span>
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Membership Fee</h3>
                        <p className="text-xs text-gray-500 font-medium">Subscription Plans</p>
                      </div>
                    </div>
                  </div>

                  {/* Membership Plans Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-md">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Trial</p>
                      <p className="text-lg font-black text-purple-700">Free</p>
                      <p className="text-xs text-gray-600">15 Days</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-md">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Silver</p>
                      <p className="text-lg font-black text-purple-700">₹2,000</p>
                      <p className="text-xs text-gray-600">30 Days</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-md">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Gold</p>
                      <p className="text-lg font-black text-purple-700">₹5,000</p>
                      <p className="text-xs text-gray-600">180 Days</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200 shadow-md">
                      <p className="text-xs text-gray-600 mb-1 font-medium">Diamond</p>
                      <p className="text-lg font-black text-purple-700">₹9,000</p>
                      <p className="text-xs text-gray-600">365 Days</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-xl p-4 mb-6 border border-purple-200">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-black text-gray-900">Membership Plans:</span> Choose from our flexible membership options to unlock premium features and participate in auctions. All plans include full platform access.
                    </p>
                  </div>

                  {/* View Plans Button */}
                  <Link
                    href="/membership"
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    <Package className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">View Membership Plans</span>
                    <ArrowUp className="w-4 h-4 relative z-10 transform group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* 3. EMD (Security Deposit) */}
              <div className="group relative bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-2xl p-6 sm:p-8 border-2 border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-card-float overflow-hidden" style={{ animationDelay: '1s' }}>
                {/* Decorative elements - Reduced blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-300/10 to-amber-300/10 rounded-full blur-md"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-yellow-300/10 to-orange-300/10 rounded-full blur-sm"></div>
                
                {/* Status Badge */}
                {user?.emdPaid && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>PAID</span>
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">EMD</h3>
                        <p className="text-xs text-gray-500 font-medium">Security Deposit</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 rounded-full blur-md opacity-50"></div>
                      <div className="relative bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                        REFUNDABLE
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                        ₹10,000
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="font-medium">100% Refundable</span>
                    </div>
                  </div>

                  {/* Info Badge */}
                  <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 p-4 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-5 h-5 text-white" />
                        <p className="text-sm font-black text-white">
                          Secure Your Bidding
                        </p>
                      </div>
                      <p className="text-xs text-orange-50 font-semibold">
                        Required to participate in auctions. Fully refundable upon completion.
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-xl p-4 mb-6 border border-orange-200">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-black text-gray-900">EMD (Security Deposit):</span> In order to participate in an Auction Sale a Bidder is also required to submit, a non-interest bearing refundable security deposit ("Security Deposit") of a minimum amount of Rs. 10,000/- (Rupees Ten Thousand only). The Security Deposit so deposited by the Bidder will be refunded to the respective Bidder upon expiry or earlier termination of these Bidder Term or on the instructions of the Bidder after adjusting any charge, fee, dues, any outstanding amount, claims or any recovery including but not limited to Membership Fee payable by Bidder to the Auctioneer or Seller in accordance with the terms hereof.
                    </p>
                  </div>

                  {/* Pay Now Button */}
                  <button
                    onClick={() => handleFeePayment("emd")}
                    disabled={processingPayment === "emd"}
                    className="w-full group/btn relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-700 to-amber-700 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
                    <CreditCard className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">{processingPayment === "emd" ? "Processing..." : "Pay Now"}</span>
                  </button>
                </div>
              </div>

              {/* 4. Transaction Fee */}
              <div className="group relative bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 sm:p-8 border-2 border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-card-float overflow-hidden" style={{ animationDelay: '1.5s' }}>
                {/* Decorative elements - Reduced blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300/10 to-emerald-300/10 rounded-full blur-md"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-300/10 to-green-300/10 rounded-full blur-sm"></div>
                
                <div className="relative z-10">
                  {/* Header with icon */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Gavel className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">Transaction Fee</h3>
                        <p className="text-xs text-gray-500 font-medium">Per Winning Bid</p>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-50 animate-badge-pulse"></div>
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg">
                        OFFER
                      </div>
                    </div>
                  </div>

                  {/* Price Display */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        2.5%
                      </span>
                      <span className="text-lg text-gray-400 line-through font-semibold">4%</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">Of Winning Bid Amount</span>
                    </div>
                  </div>

                  {/* Special Offer Badge */}
                  <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 p-4 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        <p className="text-sm font-black text-white">
                          Special Offer: Pay Only 2.5%
                        </p>
                      </div>
                      <p className="text-xs text-green-50 font-semibold">
                        Offer Valid till 31st March 2026
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-white rounded-xl p-4 mb-6 border border-green-200">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      <span className="font-black text-gray-900">Transaction Fee:</span> The Bidder shall pay to the Auctioneer a transaction fee for every Auction Sale ("Transaction Fee"). Such Transaction Fee shall be due and payable only upon successfully winning an auction. Bidder agrees to pay Transaction Fee immediately upon the confirmation by the Seller of the acceptance of Bidder's Winning Bid.
                    </p>
                  </div>

                  {/* Info Notice */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 p-4 shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    <div className="relative z-10 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-900 font-black leading-relaxed">
                        Transaction fee is automatically charged when you win an auction. No upfront payment required.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Details Section */}
        <div id="membership-details" className="bg-gradient-to-br from-white via-gray-50 to-white rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 border border-gray-100 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/20 to-transparent rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full blur-2xl -z-0"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 sm:gap-0">
              <h2 className="text-2xl sm:text-3xl font-extrabold flex items-center bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 bg-clip-text text-transparent">
                <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl mr-3 shadow-lg transform hover:scale-110 transition-transform">
                  <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                Membership Details
              </h2>
              {(!user.membership || !isMembershipActive(user.membership.endDate)) && (
                <Link
                  href="/membership"
                  className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white px-6 py-3 rounded-xl font-bold hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base whitespace-nowrap"
                >
                  Subscribe Now ✨
                </Link>
              )}
            </div>

            {/* Current/Active Membership - Enhanced with type-based styling */}
            {user.membership ? (() => {
              const membershipType = user.membership.membershipType;
              const isActive = isMembershipActive(user.membership.endDate);
              const daysRemaining = getDaysRemaining(user.membership.endDate);
              
              // Define styles based on membership type
              const membershipStyles = {
                TRIAL: {
                  gradient: isActive ? "from-blue-500 via-blue-600 to-indigo-600" : "from-gray-300 to-gray-400",
                  glow: "shadow-blue-500/50",
                  iconBg: "bg-blue-500",
                  badge: "bg-blue-400",
                  accent: "text-blue-100",
                },
                SILVER: {
                  gradient: isActive ? "from-gray-400 via-gray-500 to-gray-600" : "from-gray-300 to-gray-400",
                  glow: "shadow-gray-500/50",
                  iconBg: "bg-gray-500",
                  badge: "bg-gray-400",
                  accent: "text-gray-100",
                  shine: "bg-gradient-to-r from-transparent via-white/20 to-transparent",
                },
                GOLD: {
                  gradient: isActive ? "from-yellow-500 via-amber-500 to-orange-500" : "from-gray-300 to-gray-400",
                  glow: "shadow-yellow-500/50",
                  iconBg: "bg-yellow-500",
                  badge: "bg-yellow-400",
                  accent: "text-yellow-100",
                  shine: "bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent",
                },
                DIAMOND: {
                  gradient: isActive ? "from-cyan-400 via-blue-500 via-purple-500 to-pink-500" : "from-gray-300 to-gray-400",
                  glow: "shadow-purple-500/70",
                  iconBg: "bg-gradient-to-br from-cyan-400 to-purple-600",
                  badge: "bg-gradient-to-r from-cyan-400 to-purple-500",
                  accent: "text-white",
                  shine: "bg-gradient-to-r from-transparent via-white/40 to-transparent",
                  sparkle: "✨",
                },
              };
              
              const style = membershipStyles[membershipType as keyof typeof membershipStyles] || membershipStyles.SILVER;
              
              return (
                <div className={`relative rounded-2xl p-8 mb-6 bg-gradient-to-br ${style.gradient} text-white transform transition-all duration-300 hover:scale-[1.02] ${
                  isActive ? `shadow-2xl ${style.glow}` : "shadow-md"
                } ${membershipType === "DIAMOND" && isActive ? "animate-pulse-slow" : ""}`}>
                  {/* Diamond special effects */}
                  {membershipType === "DIAMOND" && isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-2xl"></div>
                      <div className="absolute top-4 right-4 text-2xl animate-bounce">💎</div>
                      <div className="absolute top-8 left-8 text-xl animate-pulse">✨</div>
                      <div className="absolute bottom-8 right-8 text-lg animate-pulse delay-300">⭐</div>
                    </>
                  )}
                  
                  {/* Shine effect for Gold and Diamond */}
                  {(membershipType === "GOLD" || membershipType === "DIAMOND") && isActive && (
                    <div className={`absolute inset-0 ${style.shine} animate-shimmer rounded-2xl pointer-events-none`}></div>
                  )}
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`p-3 ${style.iconBg} rounded-xl shadow-lg ${membershipType === "DIAMOND" ? "animate-pulse" : ""}`}>
                          <Package className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2">
                            {getMembershipTypeName(user.membership.membershipType)}
                            {membershipType === "DIAMOND" && <span className="text-2xl">💎</span>}
                          </h3>
                          {isActive && (
                            <span className={`${style.badge} text-white px-3 py-1.5 rounded-full text-xs font-bold mt-2 inline-block shadow-lg ${
                              membershipType === "DIAMOND" ? "animate-pulse" : ""
                            }`}>
                              ✓ Active {membershipType === "DIAMOND" ? "Premium" : ""}
                            </span>
                          )}
                          {!isActive && (
                            <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold mt-2 inline-block shadow-lg">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className={`${style.accent} text-xs sm:text-sm mb-2 font-medium`}>
                            Start Date
                          </p>
                          <p className="font-bold text-base sm:text-lg">
                            {formatDate(user.membership.startDate)}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className={`${style.accent} text-xs sm:text-sm mb-2 font-medium`}>
                            End Date
                          </p>
                          <p className="font-bold text-base sm:text-lg">
                            {formatDate(user.membership.endDate)}
                          </p>
                        </div>
                        <div className={`bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 ${
                          daysRemaining <= 7 && isActive ? "ring-2 ring-yellow-300 animate-pulse" : ""
                        }`}>
                          <p className={`${style.accent} text-xs sm:text-sm mb-2 font-medium`}>
                            {isActive ? "Days Remaining" : "Expired"}
                          </p>
                          <p className={`font-extrabold text-xl sm:text-2xl ${
                            daysRemaining <= 7 && isActive ? "text-yellow-200" : ""
                          }`}>
                            {isActive ? `${daysRemaining}` : "0"}
                            {isActive && <span className="text-sm ml-1">days</span>}
                          </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <p className={`${style.accent} text-xs sm:text-sm mb-2 font-medium`}>
                            Amount Paid
                          </p>
                          <p className="font-extrabold text-xl sm:text-2xl flex items-center">
                            <IndianRupee className="w-5 h-5 mr-1" />
                            {user.membership.amount.toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                      
                      {/* Special badge for Diamond members */}
                      {membershipType === "DIAMOND" && isActive && (
                        <div className="mt-6 bg-white/20 backdrop-blur-md rounded-xl p-4 border-2 border-white/30">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">👑</span>
                            <p className="font-bold text-lg">
                              Premium Diamond Member - Enjoy all exclusive benefits!
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {!isActive && (
                        <div className="mt-6 bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-300/50">
                          <p className="text-red-100 font-bold text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Membership expired. Please renew to continue bidding and selling.
                          </p>
                        </div>
                      )}
                    </div>
                    {!isActive && (
                      <Link
                        href="/membership"
                        className="bg-white text-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-white/50 whitespace-nowrap"
                      >
                        Renew Now →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 text-center shadow-xl">
                <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Package className="w-10 h-10 text-yellow-600" />
                </div>
                <p className="text-gray-800 font-bold text-xl mb-2">No Active Membership</p>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Subscribe to a membership plan to unlock unlimited bidding, selling, and exclusive features.
                </p>
                <Link
                  href="/membership"
                  className="inline-block bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white px-8 py-3.5 rounded-xl font-bold hover:from-primary-700 hover:via-primary-800 hover:to-primary-900 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  View Membership Plans 🚀
                </Link>
              </div>
            )}

            {/* Membership Plans Info - Enhanced */}
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <h3 className="text-xl sm:text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary-600" />
                Available Membership Plans
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Free Trial */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 hover:shadow-lg transition-all transform hover:scale-105">
                  <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 text-center">Free Trial</h4>
                  <p className="text-3xl font-extrabold text-blue-600 mb-1 text-center">Free</p>
                  <p className="text-sm text-gray-600 text-center">15 Days</p>
                </div>
                
                {/* Silver */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300 rounded-xl p-5 hover:shadow-lg transition-all transform hover:scale-105">
                  <div className="bg-gradient-to-br from-gray-400 to-gray-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 text-center">Silver</h4>
                  <p className="text-3xl font-extrabold text-gray-700 mb-1 text-center flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />2,000
                  </p>
                  <p className="text-sm text-gray-600 text-center mb-4">30 Days</p>
                  {canUpgradeTo("SILVER") && (
                    <button
                      onClick={() => handleUpgradeMembership("SILVER")}
                      disabled={upgradingMembership === "SILVER" || !razorpayLoaded}
                      className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                    >
                      {upgradingMembership === "SILVER" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-4 h-4" />
                          <span>Upgrade Now</span>
                        </>
                      )}
                    </button>
                  )}
                  {!canUpgradeTo("SILVER") && user?.membership?.membershipType === "SILVER" && (
                    <div className="w-full bg-gray-200 text-gray-600 py-2.5 rounded-lg font-semibold text-center text-sm">
                      Current Plan
                    </div>
                  )}
                </div>
                
                {/* Gold */}
                <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-400 rounded-xl p-5 hover:shadow-xl transition-all transform hover:scale-105 relative overflow-hidden">
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                        Popular
                      </div>
                  <div className="bg-gradient-to-br from-yellow-400 to-amber-600 w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-800 mb-2 text-center">Gold</h4>
                  <p className="text-3xl font-extrabold text-amber-600 mb-1 text-center flex items-center justify-center">
                    <IndianRupee className="w-5 h-5" />5,000
                  </p>
                  <p className="text-sm text-gray-600 text-center mb-4">180 Days</p>
                  {canUpgradeTo("GOLD") && (
                    <button
                      onClick={() => handleUpgradeMembership("GOLD")}
                      disabled={upgradingMembership === "GOLD" || !razorpayLoaded}
                      className="w-full bg-yellow-600 text-white py-2.5 rounded-lg font-semibold hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
                    >
                      {upgradingMembership === "GOLD" ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-4 h-4" />
                          <span>Upgrade Now</span>
                        </>
                      )}
                    </button>
                  )}
                  {!canUpgradeTo("GOLD") && user?.membership?.membershipType === "GOLD" && (
                    <div className="w-full bg-yellow-200 text-yellow-800 py-2.5 rounded-lg font-semibold text-center text-sm">
                      Current Plan
                    </div>
                  )}
                </div>
                
                {/* Diamond - Extra Special */}
                <div className="bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 border-4 border-purple-400 rounded-xl p-6 hover:shadow-2xl transition-all transform hover:scale-110 relative overflow-hidden group">
                  {/* Animated background for Diamond */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                    ⭐ Premium
                  </div>
                  <div className="relative z-10">
                    <div className="bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto shadow-2xl transform group-hover:rotate-12 transition-transform">
                      <Package className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-extrabold text-gray-900 mb-2 text-center text-lg flex items-center justify-center gap-1">
                      Diamond <span className="text-xl">💎</span>
                    </h4>
                    <p className="text-4xl font-black bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-1 text-center flex items-center justify-center">
                      <IndianRupee className="w-6 h-6 text-purple-600" />9,000
                    </p>
                    <p className="text-sm font-semibold text-gray-700 text-center mb-4">365 Days - Best Value!</p>
                    <div className="mb-4 flex items-center justify-center gap-1 text-xs text-purple-600 font-bold">
                      <span>✨</span> <span>Exclusive Benefits</span> <span>✨</span>
                    </div>
                    {canUpgradeTo("DIAMOND") && (
                      <button
                        onClick={() => handleUpgradeMembership("DIAMOND")}
                        disabled={upgradingMembership === "DIAMOND" || !razorpayLoaded}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm shadow-lg"
                      >
                        {upgradingMembership === "DIAMOND" ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <ArrowUp className="w-4 h-4" />
                            <span>Upgrade Now</span>
                          </>
                        )}
                      </button>
                    )}
                    {!canUpgradeTo("DIAMOND") && user?.membership?.membershipType === "DIAMOND" && (
                      <div className="w-full bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 py-2.5 rounded-lg font-semibold text-center text-sm">
                        Current Plan
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Membership History */}
            {user.memberships && user.memberships.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Membership History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Type</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Start Date</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">End Date</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Amount</th>
                      <th className="px-4 py-2 text-left text-gray-700 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.memberships.map((membership) => (
                      <tr key={membership.id} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-gray-900">{getMembershipTypeName(membership.membershipType)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatDate(membership.startDate)}</td>
                        <td className="px-4 py-3 text-gray-900">{formatDate(membership.endDate)}</td>
                        <td className="px-4 py-3 text-gray-900">₹{membership.amount.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              isMembershipActive(membership.endDate) && membership.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isMembershipActive(membership.endDate) && membership.status === "active"
                              ? "Active"
                              : "Expired"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <div className="grid grid-cols-3 gap-1 p-1">
              <button
                onClick={() => setActiveTab("sell")}
                className={`py-4 px-6 text-center font-semibold rounded-lg transition-all transform ${
                  activeTab === "sell"
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
              >
                <Truck className={`w-5 h-5 inline mr-2 ${activeTab === "sell" ? "animate-pulse" : ""}`} />
                <span className="text-sm sm:text-base">Sell</span>
              </button>
              <button
                onClick={() => setActiveTab("buy")}
                className={`py-4 px-6 text-center font-semibold rounded-lg transition-all transform ${
                  activeTab === "buy"
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
              >
                <ShoppingCart className={`w-5 h-5 inline mr-2 ${activeTab === "buy" ? "animate-pulse" : ""}`} />
                <span className="text-sm sm:text-base">Buy</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`py-4 px-6 text-center font-semibold rounded-lg transition-all transform ${
                  activeTab === "settings"
                    ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105"
                    : "text-gray-600 hover:text-gray-800 hover:bg-white"
                }`}
              >
                <Settings className={`w-5 h-5 inline mr-2 ${activeTab === "settings" ? "animate-pulse" : ""}`} />
                <span className="text-sm sm:text-base">Settings</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === "sell" ? (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                  <h2 className="text-xl sm:text-2xl font-bold">My Vehicles</h2>
                  <Link
                    href="/sell/upload"
                    className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 sm:px-6 py-2.5 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg text-sm sm:text-base whitespace-nowrap flex items-center space-x-2"
                  >
                    <Truck className="w-5 h-5" />
                    <span>+ List New Vehicle</span>
                  </Link>
                </div>
                
                {loadingVehicles ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading vehicles...</p>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No vehicles listed yet.</p>
                    <Link
                      href="/sell/upload"
                      className="text-primary-600 hover:underline mt-2 inline-block"
                    >
                      List your first vehicle
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {vehicles.map((vehicle) => (
                      <div key={vehicle.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          {/* Vehicle Image */}
                          <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                            {vehicle.mainPhoto ? (
                              <Image
                                src={
                                  vehicle.mainPhoto.startsWith("http")
                                    ? vehicle.mainPhoto
                                    : `/uploads/${vehicle.mainPhoto}`
                                }
                                alt={vehicle.tractorBrand}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, 128px"
                                unoptimized={!vehicle.mainPhoto.startsWith("http")}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Truck className="w-12 h-12" />
                              </div>
                            )}
                          </div>

                          {/* Vehicle Details */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-semibold">
                                  {vehicle.tractorBrand} {vehicle.tractorModel || ""} {vehicle.engineHP} HP
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {vehicle.vehicleType.replace(/_/g, " ")} • Year: {vehicle.yearOfMfg}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  vehicle.status === "APPROVED" || vehicle.status === "AUCTION"
                                    ? "bg-green-100 text-green-800"
                                    : vehicle.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : vehicle.status === "SOLD"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {vehicle.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm mb-3">
                              <div>
                                <span className="text-gray-500">Sale Type:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {vehicle.saleType === "AUCTION" ? "Auction" : "Pre-Approved"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  ₹{vehicle.saleAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Listed:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatDate(vehicle.createdAt)}
                                </span>
                              </div>
                              {vehicle.auction && (
                                <div>
                                  <span className="text-gray-500">Auction:</span>
                                  <span className="ml-2 font-medium text-gray-900">{vehicle.auction.status}</span>
                                </div>
                              )}
                            </div>

                            {/* Auction Details */}
                            {vehicle.auction && (
                              <div className="bg-gray-50 rounded p-3 mb-3">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-4">
                                    <div>
                                      <span className="text-gray-500">Current Bid:</span>
                                      <span className="ml-2 font-semibold text-primary-600">
                                        ₹{vehicle.auction.currentBid.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Bids:</span>
                                      <span className="ml-2 font-medium text-gray-900">
                                        {vehicle.auction.bids.length}
                                      </span>
                                    </div>
                                    {vehicle.auction.sellerApprovalStatus === "PENDING" && vehicle.auction.status === "ENDED" && (
                                      <div className="flex items-center text-yellow-600">
                                        <AlertCircle className="w-4 h-4 mr-1" />
                                        <span className="text-xs">Action Required</span>
                                      </div>
                                    )}
                                  </div>
                                  <Link
                                    href={`/vehicles/${vehicle.id}`}
                                    className="text-primary-600 hover:underline text-sm font-semibold"
                                  >
                                    View Details →
                                  </Link>
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/vehicles/${vehicle.id}`}
                                className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm font-semibold"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </Link>
                              {vehicle.status === "PENDING" && (
                                <>
                                  <span className="text-gray-400">|</span>
                                  <Link
                                    href={`/admin/vehicles/${vehicle.id}/edit`}
                                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-700 text-sm"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "settings" ? (
              <div>
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold flex items-center">
                    <Settings className="w-6 h-6 mr-2" />
                    Settings
                  </h2>
                  <Link
                    href="/my-account/notification-preferences"
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-semibold"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notification Preferences</span>
                  </Link>
                </div>
                
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Notifications
                </h3>
                
                <div className="space-y-6">
                  {/* Email Address Section */}
                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Email Address
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Add your email address to receive email notifications about your vehicles, auctions, and bids.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your email address"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleUpdateEmail}
                        disabled={savingEmail}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingEmail ? "Saving..." : emailPreferences?.email ? "Update Email" : "Add Email"}
                      </button>
                    </div>
                    
                    {emailPreferences?.email && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>Current email:</strong> {emailPreferences.email}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Email notifications are enabled for this address.
                        </p>
                      </div>
                    )}
                    
                    {!emailPreferences?.email && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          No email address configured. Add an email to receive notifications.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notification Preferences */}
                  {emailPreferences?.email && notificationPrefs && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Choose which email notifications you want to receive:
                      </p>
                      
                      <div className="space-y-4">
                        {[
                          { key: "vehicleApproved", label: "Vehicle Approved", desc: "When your vehicle listing is approved" },
                          { key: "vehicleRejected", label: "Vehicle Rejected", desc: "When your vehicle listing is rejected" },
                          { key: "auctionScheduled", label: "Auction Scheduled", desc: "When your auction is scheduled" },
                          { key: "auctionStarted", label: "Auction Started", desc: "When your auction goes live" },
                          { key: "auctionEnded", label: "Auction Ended", desc: "When your auction ends" },
                          { key: "bidPlaced", label: "Bid Placed", desc: "When you place a bid" },
                          { key: "bidOutbid", label: "Bid Outbid", desc: "When someone outbids you" },
                          { key: "bidApproved", label: "Bid Approved", desc: "When seller approves your bid" },
                          { key: "bidRejected", label: "Bid Rejected", desc: "When seller rejects your bid" },
                          { key: "membershipExpiring", label: "Membership Expiring", desc: "When your membership is about to expire" },
                          { key: "membershipExpired", label: "Membership Expired", desc: "When your membership has expired" },
                        ].map((pref) => (
                          <div key={pref.key} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{pref.label}</p>
                              <p className="text-xs text-gray-500 mt-1">{pref.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer ml-4">
                              <input
                                type="checkbox"
                                checked={notificationPrefs[pref.key] ?? true}
                                onChange={(e) => handleUpdateNotificationPrefs(pref.key, e.target.checked)}
                                disabled={savingPrefs}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                          onClick={async () => {
                            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                            if (!token) return;
                            
                            setSavingPrefs(true);
                            try {
                              const response = await fetch("/api/user/notification-preferences", {
                                method: "PUT",
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ emailUnsubscribed: true }),
                              });
                              
                              if (response.ok) {
                                toast.success("Unsubscribed from all email notifications");
                                await fetchNotificationPreferences(token);
                              } else {
                                toast.error("Failed to unsubscribe");
                              }
                            } catch (error) {
                              toast.error("Failed to unsubscribe");
                            } finally {
                              setSavingPrefs(false);
                            }
                          }}
                          disabled={savingPrefs}
                          className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
                        >
                          Unsubscribe from all emails
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback & Review Section */}
                  <div id="feedback-section" className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border-2 border-purple-200 mt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Share Your Feedback
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Help us improve by sharing your experience with our business, services, and platform. Your feedback will be reviewed and may be displayed on our homepage.
                    </p>
                    
                    {existingFeedback ? (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">Your Feedback Status</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            existingFeedback.status === "APPROVED" 
                              ? "bg-green-100 text-green-700"
                              : existingFeedback.status === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}>
                            {existingFeedback.status}
                          </span>
                        </div>
                        {existingFeedback.status === "PENDING" && (
                          <p className="text-sm text-gray-600 mt-2">
                            Your feedback is pending admin approval. It will be displayed on the homepage once approved.
                          </p>
                        )}
                        {existingFeedback.status === "APPROVED" && (
                          <p className="text-sm text-green-700 mt-2">
                            ✓ Your feedback has been approved and is now visible on the homepage!
                          </p>
                        )}
                        {existingFeedback.status === "REJECTED" && existingFeedback.rejectionReason && (
                          <p className="text-sm text-red-700 mt-2">
                            Reason: {existingFeedback.rejectionReason}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        {!showFeedbackForm ? (
                          <button
                            onClick={() => setShowFeedbackForm(true)}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                          >
                            <FileText className="w-5 h-5" />
                            <span>Submit Feedback</span>
                          </button>
                        ) : (
                          <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 space-y-6">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">Rate Your Experience</h4>
                            
                            {/* Rating Sections */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Business Rating *
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackData({ ...feedbackData, businessRating: star })}
                                      className={`text-3xl transition-all ${
                                        star <= feedbackData.businessRating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:scale-110`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {feedbackData.businessRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Service Rating *
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackData({ ...feedbackData, serviceRating: star })}
                                      className={`text-3xl transition-all ${
                                        star <= feedbackData.serviceRating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:scale-110`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {feedbackData.serviceRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Web Application Rating *
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackData({ ...feedbackData, webAppRating: star })}
                                      className={`text-3xl transition-all ${
                                        star <= feedbackData.webAppRating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:scale-110`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {feedbackData.webAppRating} / 5
                                  </span>
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                  Mobile Application Rating *
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setFeedbackData({ ...feedbackData, mobileAppRating: star })}
                                      className={`text-3xl transition-all ${
                                        star <= feedbackData.mobileAppRating
                                          ? "text-yellow-400"
                                          : "text-gray-300"
                                      } hover:scale-110`}
                                    >
                                      ★
                                    </button>
                                  ))}
                                  <span className="ml-2 text-sm text-gray-600">
                                    {feedbackData.mobileAppRating} / 5
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tractor Industry Since */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                In Tractor Industry Since (Year)
                              </label>
                              <input
                                type="number"
                                min={1950}
                                max={new Date().getFullYear()}
                                value={feedbackData.tractorIndustrySince}
                                onChange={(e) => setFeedbackData({ ...feedbackData, tractorIndustrySince: e.target.value })}
                                placeholder="e.g., 2010"
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Optional: Enter the year you started working in the tractor industry
                              </p>
                            </div>

                            {/* Detailed Feedback */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Detailed Feedback * <span className="text-red-500">(Minimum 10 characters)</span>
                              </label>
                              <textarea
                                value={feedbackData.detailedFeedback}
                                onChange={(e) => setFeedbackData({ ...feedbackData, detailedFeedback: e.target.value })}
                                placeholder="Share how our business model has helped you grow. Describe your experience with our services, platform, and overall satisfaction..."
                                rows={6}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                                required
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {feedbackData.detailedFeedback.length} / 10 characters minimum
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => {
                                  setShowFeedbackForm(false);
                                  setFeedbackData({
                                    businessRating: 5,
                                    serviceRating: 5,
                                    webAppRating: 5,
                                    mobileAppRating: 5,
                                    detailedFeedback: "",
                                    tractorIndustrySince: "",
                                  });
                                }}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmitFeedback}
                                disabled={submittingFeedback || feedbackData.detailedFeedback.trim().length < 10}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">My Purchases & Bids</h2>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/my-account/delivery"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <Truck className="w-5 h-5" />
                      <span>Track Delivery</span>
                    </Link>
                    <Link
                      href="/my-account/disputes"
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      <span>My Disputes</span>
                    </Link>
                    <Link
                      href="/my-account/auctions"
                      className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
                    >
                      <Gavel className="w-5 h-5" />
                      <span>My Auctions</span>
                    </Link>
                  </div>
                </div>

                {/* Bid History */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                    <h3 className="text-xl font-semibold flex items-center">
                      <Gavel className="w-5 h-5 mr-2" />
                      Bid History
                    </h3>
                    {bids.length > 0 && (
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Filter by Status */}
                        <select
                          value={bidFilterStatus}
                          onChange={(e) => setBidFilterStatus(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="all">All Status</option>
                          <option value="LIVE">Live</option>
                          <option value="ENDED">Ended</option>
                          <option value="SCHEDULED">Scheduled</option>
                        </select>
                        {/* Filter by Outcome */}
                        <select
                          value={bidFilterOutcome}
                          onChange={(e) => setBidFilterOutcome(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="all">All Bids</option>
                          <option value="winning">Winning</option>
                          <option value="outbid">Outbid</option>
                        </select>
                        {/* Sort By */}
                        <select
                          value={bidSortBy}
                          onChange={(e) => setBidSortBy(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                          <option value="date-desc">Date: Newest</option>
                          <option value="date-asc">Date: Oldest</option>
                          <option value="amount-desc">Amount: Highest</option>
                          <option value="amount-asc">Amount: Lowest</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {loadingBids ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 text-sm">Loading bids...</p>
                    </div>
                  ) : filteredBids.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Gavel className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-600 mb-2">
                        {bids.length === 0 ? "No bids placed yet." : "No bids match your filters."}
                      </p>
                      {bids.length === 0 ? (
                        <Link
                          href="/auctions"
                          className="text-primary-600 hover:underline text-sm font-semibold"
                        >
                          Browse Auctions →
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            setBidFilterStatus("all");
                            setBidFilterOutcome("all");
                            setBidSortBy("date-desc");
                          }}
                          className="text-primary-600 hover:underline text-sm font-semibold"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBids.map((bid) => (
                        <div key={bid.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {bid.auction.vehicle.mainPhoto ? (
                                <img
                                  src={
                                    bid.auction.vehicle.mainPhoto.startsWith("http")
                                      ? bid.auction.vehicle.mainPhoto
                                      : `/uploads/${bid.auction.vehicle.mainPhoto}`
                                  }
                                  alt={bid.auction.vehicle.tractorBrand}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Truck className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">
                                    {bid.auction.vehicle.tractorBrand} {bid.auction.vehicle.tractorModel || ""} {bid.auction.vehicle.engineHP} HP
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {bid.auction.vehicle.vehicleType.replace(/_/g, " ")} • {bid.auction.vehicle.state}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-primary-600">
                                    ₹{bid.bidAmount.toLocaleString("en-IN")}
                                  </div>
                                  {bid.isWinningBid && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Winning Bid
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Seller Approval Status for Winning Bids */}
                              {bid.isWinningBid && bid.auction.status === "ENDED" && bid.auction.sellerApprovalStatus && (
                                <div className={`mt-2 p-2 rounded text-xs ${
                                  bid.auction.sellerApprovalStatus === "APPROVED"
                                    ? "bg-green-50 border border-green-200 text-green-800"
                                    : bid.auction.sellerApprovalStatus === "REJECTED"
                                    ? "bg-red-50 border border-red-200 text-red-800"
                                    : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                                }`}>
                                  {bid.auction.sellerApprovalStatus === "PENDING" && (
                                    <span>⏳ Awaiting seller approval</span>
                                  )}
                                  {bid.auction.sellerApprovalStatus === "APPROVED" && (
                                    <span>✓ Bid approved! Contact seller to complete purchase.</span>
                                  )}
                                  {bid.auction.sellerApprovalStatus === "REJECTED" && (
                                    <span>✗ Bid rejected by seller</span>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    <span>{formatDateTime(bid.bidTime)}</span>
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      bid.auction.status === "LIVE"
                                        ? "bg-red-100 text-red-800"
                                        : bid.auction.status === "ENDED"
                                        ? "bg-gray-100 text-gray-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {bid.auction.status}
                                  </span>
                                </div>
                                <Link
                                  href={`/vehicles/${bid.auction.vehicle.id}`}
                                  className="text-primary-600 hover:underline text-sm font-semibold"
                                >
                                  View Vehicle →
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Purchase History */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Purchase History
                  </h3>
                  {loadingPurchases ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600 text-sm">Loading purchases...</p>
                    </div>
                  ) : purchases.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-600 mb-2">No purchases yet.</p>
                      <Link
                        href="/preapproved"
                        className="text-primary-600 hover:underline text-sm font-semibold"
                      >
                        Browse Pre-Approved Vehicles →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {purchases.map((purchase) => (
                        <div key={purchase.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="w-full md:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {purchase.vehicle.mainPhoto ? (
                                <img
                                  src={
                                    purchase.vehicle.mainPhoto.startsWith("http")
                                      ? purchase.vehicle.mainPhoto
                                      : `/uploads/${purchase.vehicle.mainPhoto}`
                                  }
                                  alt={purchase.vehicle.tractorBrand}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Truck className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">
                                    {purchase.vehicle.tractorBrand} {purchase.vehicle.tractorModel || ""} {purchase.vehicle.engineHP} HP
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {purchase.vehicle.vehicleType.replace(/_/g, " ")} • {purchase.vehicle.state}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-primary-600">
                                    ₹{purchase.purchasePrice.toLocaleString("en-IN")}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      purchase.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : purchase.status === "pending"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {purchase.status.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    <span>{formatDate(purchase.createdAt)}</span>
                                  </div>
                                  <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                    {purchase.purchaseType === "AUCTION" ? "Auction" : "Pre-Approved"}
                                  </span>
                                </div>
                              </div>
                              {/* EMD Applied Info */}
                              {purchase.purchaseType === "AUCTION" && purchase.emdApplied && purchase.emdAmount && (
                                <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                                  <p className="text-xs text-orange-800">
                                    <span className="font-semibold">EMD Applied:</span> ₹{purchase.emdAmount.toLocaleString("en-IN")} has been applied to this purchase.
                                  </p>
                                </div>
                              )}
                              {/* Transaction Fee Info */}
                              {purchase.purchaseType === "AUCTION" && purchase.transactionFee && purchase.transactionFee > 0 && (
                                <div className={`mt-2 p-3 border rounded-lg ${
                                  purchase.transactionFeePaid 
                                    ? "bg-green-50 border-green-200" 
                                    : "bg-purple-50 border-purple-200"
                                }`}>
                                  <div className="flex items-center justify-between mb-2">
                                    <p className={`text-sm ${purchase.transactionFeePaid ? "text-green-800" : "text-purple-800"}`}>
                                      <span className="font-semibold">Transaction Fee:</span> ₹{purchase.transactionFee.toLocaleString("en-IN")}
                                      {purchase.transactionFeePaid && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ Paid</span>
                                      )}
                                    </p>
                                  </div>
                                  {!purchase.transactionFeePaid && (
                                    <button
                                      onClick={() => handleTransactionFeePayment(purchase.id)}
                                      disabled={processingTransactionFeePayment === purchase.id}
                                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                      {processingTransactionFeePayment === purchase.id ? "Processing..." : "Pay Transaction Fee"}
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Balance Payment Info */}
                              {purchase.purchaseType === "AUCTION" && purchase.balanceAmount && purchase.balanceAmount > 0 && purchase.status === "payment_pending" && (
                                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <p className="text-sm text-yellow-800 mb-2">
                                    <span className="font-semibold">Balance Amount:</span> ₹{purchase.balanceAmount.toLocaleString("en-IN")} remaining to be paid.
                                  </p>
                                  <button
                                    onClick={() => handleBalancePayment(purchase.id)}
                                    disabled={processingBalancePayment === purchase.id}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg hover:from-yellow-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                    {processingBalancePayment === purchase.id ? "Processing..." : "Pay Balance"}
                                  </button>
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Link
                                  href={`/my-account/delivery?purchaseId=${purchase.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                                >
                                  <Truck className="w-4 h-4" />
                                  Track Delivery
                                </Link>
                                <Link
                                  href={`/my-account/disputes/new?purchaseId=${purchase.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  File Dispute
                                </Link>
                                <Link
                                  href={`/vehicles/${purchase.vehicle.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-semibold"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Photo Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Profile Photo
          </h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              {user.profilePhoto ? (
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary-200">
                  <Image
                    src={user.profilePhoto}
                    alt={user.fullName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 128px"
                    unoptimized={!user.profilePhoto.startsWith("http")}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary-100 flex items-center justify-center border-4 border-primary-200">
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary-600" />
                </div>
              )}
              {uploadingPhoto && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                  />
                  <span className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>{user.profilePhoto ? "Change Photo" : "Upload Photo"}</span>
                  </span>
                </label>
                {user.profilePhoto && (
                  <button
                    onClick={handlePhotoDelete}
                    disabled={uploadingPhoto}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* KYC Verification Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
                <p className="text-sm text-gray-500 mt-1">Upload your PAN Card, Aadhar Card, Cancelled Cheque, GST Copy, CIN (Optional), and Other Documents for verification</p>
              </div>
            </div>
            {user.kycStatus === "APPROVED" && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Verified</span>
              </div>
            )}
            {user.kycStatus === "REJECTED" && (
              <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Rejected</span>
              </div>
            )}
            {user.kycStatus === "PENDING" && (user.panCard || user.aadharCard) && (
              <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">Pending Review</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PAN Card Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">PAN Card</h3>
                </div>
                {user.panCard && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.panCard ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.panCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded PAN Card</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("PAN", file);
                        }
                      }}
                      disabled={uploadingKYC.pan}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.pan ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload PAN Card</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Aadhar Card Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Aadhar Card</h3>
                </div>
                {user.aadharCard && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.aadharCard ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.aadharCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded Aadhar Card</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("AADHAR", file);
                        }
                      }}
                      disabled={uploadingKYC.aadhar}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.aadhar ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload Aadhar Card</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Cancelled Cheque Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Cancelled Cheque</h3>
                </div>
                {user.cancelledCheque && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.cancelledCheque ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.cancelledCheque}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded Cancelled Cheque</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("CANCELLED_CHEQUE", file);
                        }
                      }}
                      disabled={uploadingKYC.cheque}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.cheque ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload Cancelled Cheque</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* GST Copy Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">GST Copy</h3>
                </div>
                {user.gstCopy && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.gstCopy ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.gstCopy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded GST Copy</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("GST_COPY", file);
                        }
                      }}
                      disabled={uploadingKYC.gst}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.gst ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload GST Copy</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* CIN Upload (Optional) */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">CIN <span className="text-xs text-gray-500 font-normal">(Optional)</span></h3>
                </div>
                {user.cin && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.cin ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.cin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded CIN</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("CIN", file);
                        }
                      }}
                      disabled={uploadingKYC.cin}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.cin ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload CIN</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Others Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-500 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Others</h3>
                </div>
                {user.otherDocuments && (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                )}
              </div>
              {user.otherDocuments ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <a
                      href={user.otherDocuments}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Uploaded Document</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleKYCUpload("OTHERS", file);
                        }
                      }}
                      disabled={uploadingKYC.others}
                    />
                    <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {uploadingKYC.others ? (
                        <>
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">Click to upload Other Documents</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP or PDF (Max 5MB)</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* KYC Status Messages */}
          {user.kycStatus === "PENDING" && user.panCard && user.aadharCard && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">KYC Verification Pending</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Your documents have been submitted and are under review. You will be notified once the verification is complete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.kycStatus === "REJECTED" && user.kycRejectionReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">KYC Verification Rejected</p>
                  <p className="text-xs text-red-700 mt-1">
                    <strong>Reason:</strong> {user.kycRejectionReason}
                  </p>
                  <p className="text-xs text-red-700 mt-2">
                    Please upload new documents to resubmit your KYC verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.kycStatus === "APPROVED" && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">KYC Verified Successfully</p>
                  <p className="text-xs text-green-700 mt-1">
                    Your KYC has been verified. You are now a verified {user.role === "DEALER" ? "Dealer" : user.role === "BUYER" ? "Buyer" : "Seller"}.
                  </p>
                  {user.kycApprovedAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Verified on: {formatDate(user.kycApprovedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!user.panCard || !user.aadharCard ? (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">KYC Required</p>
                  <p className="text-xs text-blue-700 mt-1">
                    To participate in auctions and place bids, please upload both your PAN Card and Aadhar Card. 
                    Your documents will be reviewed by our admin team.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Personal Details */}
        <div id="personal-details" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-primary-100 to-blue-100 rounded-lg">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Personal Details</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
              </div>
            </div>
            {!isEditingDetails ? (
              <button
                onClick={() => setIsEditingDetails(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-semibold"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsEditingDetails(false)}
                  className="flex items-center space-x-2 px-5 py-2.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

          {!isEditingDetails ? (
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">ID Number</p>
                  <p className="font-bold text-primary-600 text-lg">{user.identificationNumber || "N/A"}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Full Name</p>
                  <p className="font-bold text-gray-900 text-lg">{user.fullName}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Phone Number</p>
                  <p className="font-bold text-gray-900 text-lg">{user.phoneNumber}</p>
                </div>
                {user.whatsappNumber && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">WhatsApp Number</p>
                    <p className="font-bold text-gray-900 text-lg">{user.whatsappNumber}</p>
                  </div>
                )}
                {user.email && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Email</p>
                    <p className="font-bold text-gray-900 text-lg break-all">{user.email}</p>
                  </div>
                )}
                {user.address && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm sm:col-span-2">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Address</p>
                    <p className="font-bold text-gray-900 text-lg">{user.address}</p>
                  </div>
                )}
                {user.city && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">City</p>
                    <p className="font-bold text-gray-900 text-lg">{user.city}</p>
                  </div>
                )}
                {user.district && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">District</p>
                    <p className="font-bold text-gray-900 text-lg">{user.district}</p>
                  </div>
                )}
                {user.state && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">State</p>
                    <p className="font-bold text-gray-900 text-lg">{user.state}</p>
                  </div>
                )}
                {user.pincode && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Pincode</p>
                    <p className="font-bold text-gray-900 text-lg">{user.pincode}</p>
                  </div>
                )}
                {user.registrationType && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Registration Type</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {user.registrationType === "INDIVIDUAL" ? "Individual" : user.registrationType === "FIRM" ? "Firm" : user.registrationType}
                    </p>
                  </div>
                )}
                {user.gstNumber && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">GST Number</p>
                    <p className="font-bold text-gray-900 text-lg">{user.gstNumber}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <PersonalDetailsForm
              user={user}
              onSave={handleUpdateDetails}
              onCancel={() => setIsEditingDetails(false)}
            />
          )}
        </div>

        {/* Security Settings */}
        <div id="security-settings" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Security Settings
          </h2>
          
          {/* Change Password */}
          <div className="mb-6 pb-6 border-b">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Password</h3>
                <p className="text-sm text-gray-600">Change your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-[180px] px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base text-center"
              >
                {showPasswordChange ? "Cancel" : "Change Password"}
              </button>
            </div>
            {showPasswordChange && (
              <PasswordChangeForm onSuccess={() => setShowPasswordChange(false)} />
            )}
          </div>

          {/* Change Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800">Phone Number</h3>
                <p className="text-sm text-gray-600">Current: {user.phoneNumber}</p>
              </div>
              <button
                onClick={() => setShowPhoneChange(!showPhoneChange)}
                className="w-[180px] px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm sm:text-base text-center"
              >
                {showPhoneChange ? "Cancel" : "Change Phone"}
              </button>
            </div>
            {showPhoneChange && (
              <PhoneChangeForm 
                currentPhone={user.phoneNumber}
                onSuccess={() => {
                  setShowPhoneChange(false);
                  // Refresh user data
                  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                  if (token) {
                    fetchUserData(token);
                  }
                }} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// Password Change Form Component
function PasswordChangeForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.currentPassword) {
      setErrors({ currentPassword: "Current password is required" });
      return;
    }
    if (formData.newPassword.length < 6) {
      setErrors({ newPassword: "Password must be at least 6 characters" });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/user/profile/password", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Password changed successfully");
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        onSuccess();
      } else {
        toast.error(data.message || "Failed to change password");
        if (data.errors) {
          setErrors(data.errors);
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Current Password *
        </label>
        <input
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
        {errors.currentPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.currentPassword}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Password *
        </label>
        <input
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          minLength={6}
        />
        {errors.newPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.newPassword}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New Password *
        </label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
          minLength={6}
        />
        {errors.confirmPassword && (
          <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {saving ? "Changing..." : "Change Password"}
        </button>
    </form>
  );
}

// Phone Change Form Component
function PhoneChangeForm({ currentPhone, onSuccess }: { currentPhone: string; onSuccess: () => void }) {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [newPhone, setNewPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testOtp, setTestOtp] = useState("");

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(newPhone)) {
      toast.error("Invalid phone number format");
      return;
    }

    setSending(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/user/profile/phone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "request",
          newPhoneNumber: newPhone,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "OTP sent to new phone number");
        if (data.testOtp) {
          setTestOtp(data.testOtp);
        }
        setStep("verify");
      } else {
        toast.error(data.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Error requesting OTP:", error);
      toast.error("Failed to send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Invalid OTP format");
      return;
    }

    setVerifying(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch("/api/user/profile/phone", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "verify",
          newPhoneNumber: newPhone,
          otp: otp,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Phone number updated successfully");
        onSuccess();
      } else {
        toast.error(data.message || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error("Failed to verify OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {step === "request" ? (
        <form onSubmit={handleRequestOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Phone Number *
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              required
            />
            <p className="text-xs text-gray-500 mt-1">OTP will be sent to this number</p>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter OTP *
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
            {testOtp && (
              <p className="text-xs text-primary-600 mt-1">Test OTP: {testOtp}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setOtp("");
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={verifying}
              className="flex-1 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify & Update"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Personal Details Edit Form Component
function PersonalDetailsForm({
  user,
  onSave,
  onCancel,
}: {
  user: UserData;
  onSave: (data: Partial<UserData>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    fullName: user.fullName || "",
    whatsappNumber: user.whatsappNumber || "",
    email: user.email || "",
    address: user.address || "",
    city: user.city || "",
    district: user.district || "",
    state: user.state || "",
    pincode: user.pincode || "",
  });

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
    "Chandigarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi",
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              WhatsApp Number *
            </label>
            <input
              type="tel"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              required
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              District *
            </label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              State *
            </label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              required
            >
              <option value="">Select State</option>
              {indianStates.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pincode *
            </label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg flex items-center space-x-2"
        >
          <Check className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}



