"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, TrendingUp, Shield, Users, FileCheck, Headphones, BarChart, UserPlus, Search, Gavel, CheckCircle, Phone, Mail, MessageCircle, ShoppingCart, Tractor, Award, Clock, MapPin, Star, Crown, Sparkles, DollarSign, MessageSquare, Lock, Truck, Network, HelpCircle, ChevronDown, ChevronUp, Factory, Eye } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import toast from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [ratingFormData, setRatingFormData] = useState({
    businessRating: 5,
    serviceRating: 5,
    webAppRating: 5,
    mobileAppRating: 5,
    detailedFeedback: "",
    tractorIndustrySince: "",
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  
  const words = ["Premier", "Tractor", "Number 1", "Trusted"];

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    // Fetch approved feedbacks for homepage
    const fetchFeedbacks = async () => {
      if (!isMounted) return;
      
      setLoadingFeedbacks(true);
      try {
        const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout
        
        let response: Response;
        try {
          response = await fetch("/api/feedback", {
            signal: abortController.signal,
            cache: 'no-store',
          });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          
          // Handle network errors silently
          if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
            if (isMounted) {
              setLoadingFeedbacks(false);
            }
            return; // Silently ignore aborted/timeout requests
          }
          
          // Network error - silently fail (feedbacks are not critical)
          if (isMounted) {
            setLoadingFeedbacks(false);
          }
          return;
        }

        if (!isMounted || abortController.signal.aborted) {
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (isMounted) {
            setFeedbacks(data.slice(0, 6)); // Show only latest 6 feedbacks
          }
        }
      } catch (error: any) {
        // Silently handle errors - feedbacks are not critical for page functionality
        if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
          // Only log non-abort errors in development
          if (process.env.NODE_ENV === 'development') {
            console.error("Error fetching feedbacks:", error);
          }
        }
      } finally {
        if (isMounted) {
          setLoadingFeedbacks(false);
        }
      }
    };
    
    fetchFeedbacks();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null") {
      // Check if user is a member
      const checkMemberStatus = async () => {
        try {
          const response = await fetch("/api/user/me", {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (response.ok) {
            const userData = await response.json();
            // Check if user has active membership
            const hasActiveMembership = userData.memberships?.some(
              (m: any) => m.status === "active" && new Date(m.endDate) >= new Date()
            );
            setIsMember(hasActiveMembership || userData.role === "ADMIN");
          }
        } catch (error) {
          console.error("Error checking member status:", error);
        }
      };
      checkMemberStatus();
      
      // Small delay to ensure page is ready before redirect
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true);
        router.push("/auctions");
      }, 100);
      
      return () => {
        clearTimeout(redirectTimer);
      };
    }
  }, [router]);

  // Typing animation effect
  useEffect(() => {
    if (!isClient || shouldRedirect) return;

    const currentWord = words[wordIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing forward
        if (typingText.length < currentWord.length) {
          setTypingText(currentWord.substring(0, typingText.length + 1));
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        // Deleting backward
        if (typingText.length > 0) {
          setTypingText(typingText.substring(0, typingText.length - 1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typingText, isDeleting, wordIndex, isClient, shouldRedirect, words]);

  // Stats Section Component - Modern Progress Bar Style (Globally Popular)
  function StatsSection() {
    const targets = { listings: 1000, sellers: 500, buyers: 2000 };
    
    // Initialize state based on sessionStorage to prevent blinking
    const getInitialValues = () => {
      if (typeof window !== "undefined" && sessionStorage.getItem("homepageStatsAnimated") === "true") {
        return {
          displayValues: targets,
          progressValues: {
            listings: (targets.listings / 2000) * 100,
            sellers: (targets.sellers / 2000) * 100,
            buyers: (targets.buyers / 2000) * 100,
          }
        };
      }
      return {
        displayValues: { listings: 0, sellers: 0, buyers: 0 },
        progressValues: { listings: 0, sellers: 0, buyers: 0 }
      };
    };

    const initialValues = getInitialValues();
    const [displayValues, setDisplayValues] = useState(initialValues.displayValues);
    const [progressValues, setProgressValues] = useState(initialValues.progressValues);
    const sectionRef = useRef<HTMLElement>(null);
    const hasAnimatedRef = useRef(
      typeof window !== "undefined" && sessionStorage.getItem("homepageStatsAnimated") === "true"
    );
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
      // If already animated, don't do anything
      if (hasAnimatedRef.current) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimatedRef.current) {
              hasAnimatedRef.current = true;
              observer.disconnect();
              
              // Mark as animated in sessionStorage
              if (typeof window !== "undefined") {
                sessionStorage.setItem("homepageStatsAnimated", "true");
              }
              
              const duration = 4000; // 4 seconds
              const startTime = performance.now();

              const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Smooth easing - slower progression
                const easeOut = 1 - Math.pow(1 - progress, 4);

                setDisplayValues({
                  listings: Math.floor(targets.listings * easeOut),
                  sellers: Math.floor(targets.sellers * easeOut),
                  buyers: Math.floor(targets.buyers * easeOut),
                });

                setProgressValues({
                  listings: (targets.listings / 2000) * 100 * easeOut,
                  sellers: (targets.sellers / 2000) * 100 * easeOut,
                  buyers: (targets.buyers / 2000) * 100 * easeOut,
                });

                if (progress < 1) {
                  animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                  // Ensure final values are exact
                  setDisplayValues(targets);
                  setProgressValues({
                    listings: (targets.listings / 2000) * 100,
                    sellers: (targets.sellers / 2000) * 100,
                    buyers: (targets.buyers / 2000) * 100,
                  });
                  animationFrameRef.current = null;
                }
              };

              animationFrameRef.current = requestAnimationFrame(animate);
            }
          });
        },
        { threshold: 0.2 }
      );

      const currentSection = sectionRef.current;
      if (currentSection) {
        observer.observe(currentSection);
      }

      return () => {
        observer.disconnect();
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, []);

    const stats = [
      {
        value: displayValues.listings,
        suffix: "+",
        label: "Active Listings",
        sublabel: "Live Vehicles",
        color: "blue",
        bgGradient: "from-blue-500 to-blue-600",
        progressBg: "bg-blue-100",
        progressBar: "bg-blue-600",
        textColor: "text-blue-600",
        iconBg: "bg-blue-50",
        progress: progressValues.listings,
        target: 1000,
      },
      {
        value: displayValues.sellers,
        suffix: "+",
        label: "Verified Sellers",
        sublabel: "Trusted Partners",
        color: "green",
        bgGradient: "from-green-500 to-green-600",
        progressBg: "bg-green-100",
        progressBar: "bg-green-600",
        textColor: "text-green-600",
        iconBg: "bg-green-50",
        progress: progressValues.sellers,
        target: 500,
      },
      {
        value: displayValues.buyers,
        suffix: "+",
        label: "Happy Buyers",
        sublabel: "Satisfied Customers",
        color: "purple",
        bgGradient: "from-purple-500 to-purple-600",
        progressBg: "bg-purple-100",
        progressBar: "bg-purple-600",
        textColor: "text-purple-600",
        iconBg: "bg-purple-50",
        progress: progressValues.buyers,
        target: 2000,
      },
      {
        value: "24/7",
        suffix: "",
        label: "Support",
        sublabel: "Always Available",
        color: "orange",
        bgGradient: "from-orange-500 to-orange-600",
        progressBg: "bg-orange-100",
        progressBar: "bg-orange-600",
        textColor: "text-orange-600",
        iconBg: "bg-orange-50",
        progress: 100,
        isSpecial: true,
        target: 100,
      },
    ];

    const [isVisible, setIsVisible] = useState(
      typeof window !== "undefined" && sessionStorage.getItem("homepageStatsAnimated") === "true"
    );

    useEffect(() => {
      if (hasAnimatedRef.current || isVisible) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsVisible(true);
            }
          });
        },
        { threshold: 0.1 }
      );

      const currentSection = sectionRef.current;
      if (currentSection) {
        observer.observe(currentSection);
      }

      return () => {
        observer.disconnect();
      };
    }, [isVisible]);

    return (
      <section ref={sectionRef} className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-green-200/10 via-blue-200/10 to-purple-200/10 rounded-full blur-3xl animate-pulse animation-delay-4000"></div>
        </div>

        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className={`inline-block mb-4 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block shadow-lg">
                <BarChart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className={`text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-2 transform transition-all duration-1000 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              Our Impact in Numbers
            </h2>
            <p className={`text-gray-600 text-lg sm:text-xl transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              Trusted by thousands of farmers and dealers across India
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 group relative overflow-hidden transform ${
                  isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  transitionDuration: '700ms'
                }}
              >
                {/* Animated Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`}></div>
                
                {/* Glow Effect */}
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${stat.bgGradient} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}></div>

                {/* Icon/Number Section */}
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl ${stat.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 relative`}>
                    {/* Pulse Ring Effect */}
                    <div className={`absolute inset-0 rounded-xl ${stat.iconBg} animate-ping opacity-0 group-hover:opacity-30`}></div>
                    {stat.isSpecial ? (
                      <span className={`text-2xl font-bold ${stat.textColor} relative z-10`}>24/7</span>
                    ) : (
                      <span className={`text-xl sm:text-2xl font-bold ${stat.textColor} relative z-10`}>
                        {typeof stat.value === 'number' ? stat.value.toLocaleString().charAt(0) : '1'}
                      </span>
                    )}
                  </div>
                  <div className="text-right relative z-10">
                    <div className={`text-4xl sm:text-5xl md:text-6xl font-extrabold ${stat.textColor} mb-1 group-hover:scale-110 transition-transform duration-500`}>
                      {stat.isSpecial ? (
                        <span className="inline-block">{stat.value}</span>
                      ) : (
                        <>
                          <span className="tabular-nums inline-block transform group-hover:scale-110 transition-transform duration-300">
                            {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                          </span>
                          <span className="text-2xl sm:text-3xl ml-1 inline-block transform group-hover:scale-110 transition-transform duration-300">{stat.suffix}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Label */}
                <div className="mb-4 relative z-10">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors duration-300">
                    {stat.label}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                    {stat.sublabel}
                  </p>
                </div>

                {/* Animated Progress Bar */}
                <div className="mt-6 relative z-10">
                  <div className={`h-3 rounded-full ${stat.progressBg} overflow-hidden shadow-inner`}>
                    <div
                      className={`h-full ${stat.progressBar} rounded-full transition-all duration-[4000ms] ease-out relative overflow-hidden shadow-lg`}
                      style={{ width: `${stat.progress}%` }}
                    >
                      {/* Animated Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                      {/* Glow effect on progress bar */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${stat.bgGradient} opacity-50 blur-sm`}></div>
                    </div>
                  </div>
                  {!stat.isSpecial && (
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-gray-500 font-medium">Progress</span>
                      <span className={`text-xs sm:text-sm font-bold ${stat.textColor} transform group-hover:scale-110 transition-transform duration-300`}>
                        {Math.round(stat.progress)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Decorative Corner Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-transparent rounded-bl-2xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-gray-50 to-transparent rounded-tr-2xl opacity-50"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show loading state during client-side check to prevent hydration mismatch
  if (!isClient || shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-700 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section - Enhanced */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white py-16 sm:py-20 md:py-24 px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <div className="inline-block mb-6 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <p className="text-sm sm:text-base font-semibold">🎁 15 Days FREE Trial - No Credit Card Required</p>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 sm:mb-8 leading-tight drop-shadow-lg">
              <span className="text-white">India&apos;s </span>
              <span className="inline-block min-w-[180px] sm:min-w-[220px] md:min-w-[260px] lg:min-w-[300px] text-left">
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent font-extrabold drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                  {typingText}
                </span>
                <span className="typing-cursor text-yellow-400 ml-1 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">|</span>
              </span>{" "}
              <span className="text-white">Auction Marketplace</span>
            </h1>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-primary-100">
              for Used Tractors & Agricultural Equipment
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl mb-6 text-primary-100 font-semibold max-w-4xl mx-auto">
              Buy, Sell, and Auction Tractors with Complete Transparency, Security, and Trust
            </p>
            
            {/* Key Value Propositions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm sm:text-base font-semibold">Blockchain Verified</span>
                </div>
                <p className="text-xs sm:text-sm text-primary-100 mt-1">Industry&apos;s first blockchain-based verification</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm sm:text-base font-semibold">Professional Inspection</span>
                </div>
                <p className="text-xs sm:text-sm text-primary-100 mt-1">All vehicles certified by expert valuers</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm sm:text-base font-semibold">Transparent Auctions</span>
                </div>
                <p className="text-xs sm:text-sm text-primary-100 mt-1">Real-time bidding with complete transparency</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-2 text-white">
                  <CheckCircle className="w-5 h-5 text-green-300" />
                  <span className="text-sm sm:text-base font-semibold">Pan-India Network</span>
                </div>
                <p className="text-xs sm:text-sm text-primary-100 mt-1">Thousands of verified buyers and sellers</p>
              </div>
            </div>
            
            {/* Large Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-8 px-2">
              <Link
                href="/register"
                className="group w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-white to-gray-100 text-primary-700 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:from-gray-100 hover:to-white transition-all shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center space-x-3 border-2 border-white/20"
              >
                <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                <span>{t("home.registerNow")}</span>
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href="/auctions"
                className="group w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:from-primary-400 hover:to-primary-500 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 flex items-center justify-center space-x-3 border-2 border-white/30"
              >
                <Gavel className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                <span>{t("home.viewAuctions")}</span>
                <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick Access Buttons */}
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center px-2">
              <Link
                href="/preapproved"
                className="group bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2 text-sm sm:text-base"
              >
                <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{t("home.preApprovedVehicles")}</span>
              </Link>
              
              <Link
                href="/sell/upload"
                className="group bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2 text-sm sm:text-base"
              >
                <Tractor className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{t("home.sellVehicle")}</span>
              </Link>
              
              <Link
                href="/contact"
                className="group bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20 flex items-center space-x-2 text-sm sm:text-base"
              >
                <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{t("home.callUs")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section - Enhanced with Animations */}
      {/* <StatsSection /> */}

      {/* How It Works Preview - Enhanced */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full inline-block">
                <Gavel className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">How It Works</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Get Started in 4 Simple Steps - Easy for Everyone
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-10">
            {[
              {
                icon: UserPlus,
                title: "Register Free",
                description: "Create account in 2 minutes. Choose Buyer or Seller role.",
                step: "01",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                borderColor: "border-blue-300"
              },
              {
                icon: Search,
                title: "Browse Vehicles",
                description: "See all available tractors, harvesters & scrap vehicles.",
                step: "02",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100",
                borderColor: "border-green-300"
              },
              {
                icon: Gavel,
                title: "Place Bid",
                description: "Click Bid Now button. Enter your price. Done!",
                step: "03",
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100",
                borderColor: "border-purple-300"
              },
              {
                icon: CheckCircle,
                title: "Win & Buy",
                description: "If you win, complete payment & take delivery.",
                step: "04",
                color: "from-orange-500 to-orange-600",
                bgColor: "from-orange-50 to-orange-100",
                borderColor: "border-orange-300"
              }
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className={`bg-gradient-to-br ${step.bgColor} rounded-2xl p-6 sm:p-8 border-2 ${step.borderColor} shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative overflow-hidden`}>
                  <div className="absolute top-4 right-4 text-7xl sm:text-8xl font-extrabold text-white/20">
                    {step.step}
                  </div>
                  <div className="mb-6 relative z-10">
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg mx-auto`}>
                      <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-3 text-gray-900 text-center relative z-10">{step.title}</h3>
                  <p className="text-gray-700 font-medium text-center text-sm sm:text-base relative z-10">{step.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="text-center">
            <Link
              href="/how-it-works"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 sm:px-10 py-4 rounded-xl font-bold text-lg sm:text-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span>Learn More About Our Process</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full inline-block">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">Why Choose Us</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Trusted by Thousands of Buyers & Sellers Across India
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Shield,
                title: "Industry's First Blockchain Verification",
                description: "Every vehicle is verified and recorded on blockchain, ensuring authenticity and preventing fraud. Immutable records that build trust.",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100"
              },
              {
                icon: FileCheck,
                title: "Certified Vehicle Inspection",
                description: "All vehicles undergo professional inspection by certified valuers. Get detailed reports with photos and condition assessment.",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100"
              },
              {
                icon: Gavel,
                title: "Live Transparent Bidding",
                description: "Participate in real-time auctions with live bid updates. Fair, transparent, and competitive pricing for all.",
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100"
              },
              {
                icon: BarChart,
                title: "Data-Driven Insights",
                description: "Advanced analytics for sellers, dealers, and OEMs. Track performance, monitor trends, and make informed decisions.",
                color: "from-orange-500 to-orange-600",
                bgColor: "from-orange-50 to-orange-100"
              },
              {
                icon: Lock,
                title: "Safe & Secure Payments",
                description: "Multiple secure payment options with buyer protection. EMD system ensures transaction security.",
                color: "from-red-500 to-red-600",
                bgColor: "from-red-50 to-red-100"
              },
              {
                icon: Truck,
                title: "Thousands of Verified Vehicles",
                description: "Browse thousands of verified tractors, harvesters, and agricultural equipment from trusted sellers across India.",
                color: "from-indigo-500 to-indigo-600",
                bgColor: "from-indigo-50 to-indigo-100"
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className={`bg-gradient-to-br ${feature.bgColor} rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105`}>
                  <div className="mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-700 font-medium text-sm sm:text-base leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-12">
            <Link
              href="/why-choose-us"
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 sm:px-10 py-4 rounded-xl font-bold text-lg sm:text-xl hover:from-primary-700 hover:to-primary-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <span>See All Features</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Vehicle Types Section - Enhanced */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full inline-block">
                <Tractor className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">What We Offer</h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Browse & Buy Different Types of Agricultural Vehicles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                emoji: "🚜",
                title: "Used Tractors",
                description: "Quality pre-owned tractors from verified sellers. All vehicles checked & verified.",
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100",
                borderColor: "border-blue-300"
              },
              {
                icon: (
                  <svg
                    viewBox="0 0 140 90"
                    className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] mx-auto"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Combine Harvester - Front Header/Reaper */}
                    <rect x="5" y="40" width="25" height="30" rx="2" fill="#1F2937" stroke="#111827" strokeWidth="1.5" />
                    {/* Rotating header blades - curved design */}
                    <ellipse cx="17.5" cy="50" rx="8" ry="12" fill="#10B981" opacity="0.7" />
                    <ellipse cx="17.5" cy="50" rx="6" ry="10" fill="#059669" opacity="0.5" />
                    {/* Blade lines */}
                    <line x1="12" y1="45" x2="23" y2="55" stroke="#10B981" strokeWidth="1" />
                    <line x1="12" y1="55" x2="23" y2="45" stroke="#10B981" strokeWidth="1" />
                    <line x1="17.5" y1="42" x2="17.5" y2="58" stroke="#10B981" strokeWidth="1" />
                    
                    {/* Main Body/Cab - Yellow */}
                    <rect x="30" y="35" width="50" height="35" rx="3" fill="#FFD700" stroke="#FFA500" strokeWidth="1.5" />
                    
                    {/* Driver's Cab - Red */}
                    <rect x="35" y="25" width="18" height="18" rx="2" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
                    <polygon points="35,25 44,18 53,25" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
                    
                    {/* Windows */}
                    <rect x="37" y="27" width="5" height="8" rx="1" fill="#60A5FA" />
                    <rect x="44" y="27" width="5" height="8" rx="1" fill="#60A5FA" />
                    <rect x="51" y="27" width="5" height="8" rx="1" fill="#60A5FA" />
                    
                    {/* Grain Tank on Top - Large rounded container */}
                    <ellipse cx="55" cy="30" rx="20" ry="8" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                    <rect x="35" y="22" width="40" height="16" rx="8" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                    {/* Grain tank details */}
                    <line x1="40" y1="28" x2="70" y2="28" stroke="#D97706" strokeWidth="1" />
                    <line x1="40" y1="32" x2="70" y2="32" stroke="#D97706" strokeWidth="1" />
                    
                    {/* Unloading Auger/Pipe - Extends to the side */}
                    <rect x="80" y="42" width="18" height="6" rx="3" fill="#6B7280" stroke="#4B5563" strokeWidth="1" />
                    <rect x="98" y="40" width="12" height="10" rx="2" fill="#6B7280" stroke="#4B5563" strokeWidth="1" />
                    {/* Auger spiral lines */}
                    <path d="M 82 45 Q 85 42, 88 45 Q 91 48, 94 45" stroke="#9CA3AF" strokeWidth="1" fill="none" />
                    <path d="M 100 42 Q 103 45, 106 42 Q 109 45, 110 42" stroke="#9CA3AF" strokeWidth="1" fill="none" />
                    
                    {/* Chassis/Undercarriage */}
                    <rect x="30" y="65" width="50" height="8" rx="1" fill="#374151" stroke="#1F2937" strokeWidth="1" />
                    
                    {/* Front Wheel - Large */}
                    <circle cx="42" cy="72" r="7" fill="#6B7280" stroke="#4B5563" strokeWidth="1.5" />
                    <circle cx="42" cy="72" r="5" fill="#F9FAFB" />
                    <circle cx="42" cy="72" r="3" fill="#6B7280" />
                    {/* Wheel spokes */}
                    <line x1="42" y1="67" x2="42" y2="77" stroke="#9CA3AF" strokeWidth="0.5" />
                    <line x1="37" y1="72" x2="47" y2="72" stroke="#9CA3AF" strokeWidth="0.5" />
                    
                    {/* Rear Wheel - Large */}
                    <circle cx="68" cy="72" r="7" fill="#6B7280" stroke="#4B5563" strokeWidth="1.5" />
                    <circle cx="68" cy="72" r="5" fill="#F9FAFB" />
                    <circle cx="68" cy="72" r="3" fill="#6B7280" />
                    {/* Wheel spokes */}
                    <line x1="68" y1="67" x2="68" y2="77" stroke="#9CA3AF" strokeWidth="0.5" />
                    <line x1="63" y1="72" x2="73" y2="72" stroke="#9CA3AF" strokeWidth="0.5" />
                    
                    {/* Exhaust Stack */}
                    <rect x="75" y="20" width="4" height="15" fill="#1F2937" />
                    <ellipse cx="77" cy="20" rx="3" ry="2" fill="#1F2937" />
                    
                    {/* Side details - vents/grilles */}
                    <rect x="55" y="40" width="20" height="15" rx="1" fill="none" stroke="#FFA500" strokeWidth="1" />
                    <line x1="57" y1="43" x2="73" y2="43" stroke="#FFA500" strokeWidth="0.5" />
                    <line x1="57" y1="48" x2="73" y2="48" stroke="#FFA500" strokeWidth="0.5" />
                    <line x1="57" y1="53" x2="73" y2="53" stroke="#FFA500" strokeWidth="0.5" />
                  </svg>
                ),
                title: "Used Harvesters",
                description: "Find reliable harvesters for your farming needs. Multiple sellers available.",
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100",
                borderColor: "border-green-300"
              },
              {
                emoji: "♻️",
                title: "Scrap Tractors",
                description: "Buy scrap tractors for parts or repair. Great prices available for various profitable models",
                color: "from-orange-500 to-orange-600",
                bgColor: "from-orange-50 to-orange-100",
                borderColor: "border-orange-300"
              }
            ].map((type, index) => (
              <div key={index} className={`bg-gradient-to-br ${type.bgColor} rounded-2xl p-8 sm:p-10 text-center border-2 ${type.borderColor} shadow-xl hover:shadow-2xl transition-all hover:scale-105`}>
                <div className="mb-6 flex items-center justify-center">
                  {type.icon ? (
                    <div className="text-green-600">
                      {type.icon}
                    </div>
                  ) : (
                    <div className="text-6xl sm:text-7xl">{type.emoji}</div>
                  )}
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">{type.title}</h3>
                <p className="text-gray-700 font-medium text-base sm:text-lg leading-relaxed">
                  {type.description}
                </p>
                <Link
                  href="/auctions"
                  className={`inline-flex items-center space-x-2 mt-6 bg-gradient-to-r ${type.color} text-white px-6 py-3 rounded-lg font-bold hover:shadow-lg transition-all hover:scale-105`}
                >
                  <span>Browse Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-lg sm:text-xl text-primary-100 max-w-2xl mx-auto">
              Trusted by thousands of farmers and dealers across India
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
            {[
              { value: "10,000+", label: "Verified Vehicles Listed", icon: Truck },
              { value: "50,000+", label: "Registered Users", icon: Users },
              { value: "₹500+", label: "Crores Transaction Value", icon: DollarSign },
              { value: "95%", label: "Customer Satisfaction", icon: Star },
              { value: "28", label: "States Coverage", icon: MapPin },
              { value: "100+", label: "Certified Valuers", icon: Award },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold mb-2">{stat.value}</div>
                  <div className="text-sm sm:text-base text-primary-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits by User Type Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block">
                <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Benefits for Everyone
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Tailored benefits for every user type
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                title: "For Sellers",
                icon: Tractor,
                benefits: [
                  "🎯 Reach thousands of verified buyers",
                  "💰 Get fair market prices through auctions",
                  "⚡ Quick and easy listing process",
                  "✅ Professional verification increases trust",
                  "📊 Track performance with analytics"
                ],
                color: "from-green-500 to-green-600",
                bgColor: "from-green-50 to-green-100"
              },
              {
                title: "For Buyers",
                icon: ShoppingCart,
                benefits: [
                  "🔍 Browse thousands of verified vehicles",
                  "💎 Certified quality with inspection reports",
                  "💵 Competitive prices through auctions",
                  "🔒 Secure transactions with buyer protection",
                  "📱 Easy mobile access"
                ],
                color: "from-blue-500 to-blue-600",
                bgColor: "from-blue-50 to-blue-100"
              },
              {
                title: "For Dealers",
                icon: BarChart,
                benefits: [
                  "📦 Manage inventory efficiently",
                  "📈 Access comprehensive analytics",
                  "🚀 Bulk upload capabilities",
                  "📊 Track performance metrics",
                  "🌐 Nationwide customer reach"
                ],
                color: "from-purple-500 to-purple-600",
                bgColor: "from-purple-50 to-purple-100"
              },
              {
                title: "For OEMs",
                icon: Factory,
                benefits: [
                  "📊 Monitor dealer stock performance",
                  "📈 Real-time analytics and insights",
                  "🎯 Data-driven decision making",
                  "📍 Geographic performance tracking",
                  "💼 Strategic business intelligence"
                ],
                color: "from-orange-500 to-orange-600",
                bgColor: "from-orange-50 to-orange-100"
              }
            ].map((userType, index) => {
              const Icon = userType.icon;
              return (
                <div key={index} className={`bg-gradient-to-br ${userType.bgColor} rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105`}>
                  <div className="mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${userType.color} rounded-xl flex items-center justify-center shadow-lg mx-auto`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-4 text-gray-900 text-center">{userType.title}</h3>
                  <ul className="space-y-3">
                    {userType.benefits.map((benefit, idx) => (
                      <li key={idx} className="text-gray-700 text-sm sm:text-base font-medium">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Competitive Advantages */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block">
                <Award className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Why Choose Us
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Competitive advantages that set us apart
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                title: "Blockchain Technology",
                description: "Industry's first blockchain verification. Immutable vehicle records prevent fraud and disputes.",
                icon: Shield,
                color: "from-blue-500 to-blue-600"
              },
              {
                title: "Professional Network",
                description: "Certified valuers across India. Verified sellers only. Quality assurance guaranteed.",
                icon: Users,
                color: "from-green-500 to-green-600"
              },
              {
                title: "Comprehensive Platform",
                description: "All stakeholders in one place. Integrated workflows. Seamless user experience.",
                icon: Network,
                color: "from-purple-500 to-purple-600"
              },
              {
                title: "Advanced Analytics",
                description: "Real-time performance tracking. Multi-dimensional insights. Data-driven decisions.",
                icon: BarChart,
                color: "from-orange-500 to-orange-600"
              },
              {
                title: "Security & Trust",
                description: "Multi-layer verification. Secure payment processing. Buyer and seller protection.",
                icon: Lock,
                color: "from-red-500 to-red-600"
              },
              {
                title: "Innovation",
                description: "Cutting-edge technology. Regular feature updates. Future-ready platform.",
                icon: TrendingUp,
                color: "from-indigo-500 to-indigo-600"
              }
            ].map((advantage, index) => {
              const Icon = advantage.icon;
              return (
                <div key={index} className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                  <div className="mb-6">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r ${advantage.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-3 text-gray-900">{advantage.title}</h3>
                  <p className="text-gray-700 font-medium text-sm sm:text-base leading-relaxed">{advantage.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block">
                <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Everything you need to know
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                question: "How does the auction process work?",
                answer: "Sellers list vehicles, buyers browse and bid. Highest bid wins. All transactions are secure and verified."
              },
              {
                question: "Are vehicles verified before listing?",
                answer: "Yes, all vehicles undergo professional inspection by certified valuers and blockchain verification."
              },
              {
                question: "What payment methods are accepted?",
                answer: "We support multiple secure payment options including UPI, cards, net banking, and EMI options."
              },
              {
                question: "Is there buyer protection?",
                answer: "Yes, we have comprehensive buyer protection including dispute resolution and refund policies."
              },
              {
                question: "Can I sell multiple vehicles?",
                answer: "Yes, we offer bulk upload features and membership plans for dealers with multiple vehicles."
              },
              {
                question: "How long does verification take?",
                answer: "Verification typically takes 24-48 hours after vehicle inspection."
              },
              {
                question: "Can I inspect the vehicle before buying?",
                answer: "Yes, all vehicles have detailed inspection reports. You can also arrange physical inspection."
              },
              {
                question: "Is financing available?",
                answer: "Yes, we offer financing options for eligible vehicles through partner institutions."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-xl border-2 border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <span className="font-bold text-gray-900 text-base sm:text-lg">{faq.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Membership Section */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-block mb-4">
              <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block">
                <DollarSign className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
              Membership Plans
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Choose the perfect plan for your needs. Start with a free trial!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Trial Plan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative">
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold mb-4">
                  FREE
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Trial Plan</h3>
                <div className="text-4xl sm:text-5xl font-extrabold text-primary-600 mb-2">₹0</div>
                <p className="text-gray-600 font-medium">Valid for 15 Days</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Basic features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Perfect for trying the platform</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Access to all listings</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                Start Free Trial
              </Link>
            </div>

            {/* Silver Plan */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-blue-300 shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative">
              <div className="absolute top-4 right-4">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-bold mb-4">
                  POPULAR
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Silver Plan</h3>
                <div className="text-4xl sm:text-5xl font-extrabold text-primary-600 mb-2">₹2,000</div>
                <p className="text-gray-600 font-medium">Valid for 30 Days</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Advanced analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Priority support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">All basic features</span>
                </li>
              </ul>
              <Link
                href="/membership"
                className="block w-full text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Choose Silver
              </Link>
            </div>

            {/* Gold Plan */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 sm:p-8 border-2 border-yellow-400 shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative">
              <div className="absolute top-4 right-4">
                <Crown className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold mb-4">
                  BEST VALUE
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Gold Plan</h3>
                <div className="text-4xl sm:text-5xl font-extrabold text-primary-600 mb-2">₹5,000</div>
                <p className="text-gray-600 font-medium">Valid for 180 Days</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Premium analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">All Silver features</span>
                </li>
              </ul>
              <Link
                href="/membership"
                className="block w-full text-center bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-6 py-3 rounded-lg font-bold hover:from-yellow-600 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
              >
                Choose Gold
              </Link>
            </div>

            {/* Diamond Plan */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 sm:p-8 border-2 border-purple-400 shadow-xl hover:shadow-2xl transition-all hover:scale-105 relative">
              <div className="absolute top-4 right-4">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-center mb-6">
                <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
                  PREMIUM
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">Diamond Plan</h3>
                <div className="text-4xl sm:text-5xl font-extrabold text-primary-600 mb-2">₹9,000</div>
                <p className="text-gray-600 font-medium">Valid for 365 Days</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Enterprise analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">VIP support</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">Custom features</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700 text-sm sm:text-base">All Gold features</span>
                </li>
              </ul>
              <Link
                href="/membership"
                className="block w-full text-center bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Choose Diamond
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Member-Only Rating Section */}
      {isMember && (
        <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-primary-50 to-white">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <div className="p-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full inline-block">
                  <MessageSquare className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-gray-900">
                Rate & Review Our Platform
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 font-medium max-w-2xl mx-auto">
                As a valued member, your feedback helps us improve. Share your experience with us!
              </p>
            </div>

            {!showRatingForm ? (
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-primary-200 text-center">
                <Lock className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                <p className="text-gray-700 text-lg mb-6">
                  Only active members can submit ratings and feedback. Your feedback will be reviewed and may be displayed on our homepage.
                </p>
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Star className="w-6 h-6" />
                  <span>Submit Your Rating</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-primary-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Feedback</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmittingRating(true);
                    try {
                      const token = localStorage.getItem("token");
                      const response = await fetch("/api/feedback", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(ratingFormData),
                      });

                      if (response.ok) {
                        const data = await response.json();
                        toast.success("Thank you! Your feedback has been submitted and will be reviewed.");
                        setShowRatingForm(false);
                        setRatingFormData({
                          businessRating: 5,
                          serviceRating: 5,
                          webAppRating: 5,
                          mobileAppRating: 5,
                          detailedFeedback: "",
                          tractorIndustrySince: "",
                        });
                        // Refresh feedbacks
                        const feedbackResponse = await fetch("/api/feedback", {
                          cache: "no-store",
                        });
                        if (feedbackResponse.ok) {
                          const feedbackData = await feedbackResponse.json();
                          setFeedbacks(feedbackData.slice(0, 6));
                        }
                      } else {
                        const errorData = await response.json();
                        toast.error(errorData.message || "Failed to submit feedback. Please try again.");
                      }
                    } catch (error) {
                      console.error("Error submitting feedback:", error);
                      toast.error("An error occurred. Please try again.");
                    } finally {
                      setSubmittingRating(false);
                    }
                  }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Business Rating <span className="text-gray-500">(1-5)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingFormData({ ...ratingFormData, businessRating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingFormData.businessRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 font-semibold">
                        {ratingFormData.businessRating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Rating <span className="text-gray-500">(1-5)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingFormData({ ...ratingFormData, serviceRating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingFormData.serviceRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 font-semibold">
                        {ratingFormData.serviceRating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Web App Rating <span className="text-gray-500">(1-5)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingFormData({ ...ratingFormData, webAppRating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingFormData.webAppRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 font-semibold">
                        {ratingFormData.webAppRating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile App Rating <span className="text-gray-500">(1-5)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingFormData({ ...ratingFormData, mobileAppRating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= ratingFormData.mobileAppRating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-gray-600 font-semibold">
                        {ratingFormData.mobileAppRating}/5
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detailed Feedback
                    </label>
                    <textarea
                      value={ratingFormData.detailedFeedback}
                      onChange={(e) =>
                        setRatingFormData({ ...ratingFormData, detailedFeedback: e.target.value })
                      }
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      placeholder="Share your experience with our platform..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Years in Tractor Industry <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={ratingFormData.tractorIndustrySince}
                      onChange={(e) =>
                        setRatingFormData({ ...ratingFormData, tractorIndustrySince: e.target.value })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                      placeholder="e.g., 10 years"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submittingRating}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingRating ? "Submitting..." : "Submit Feedback"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRatingForm(false);
                        setRatingFormData({
                          businessRating: 5,
                          serviceRating: 5,
                          webAppRating: 5,
                          mobileAppRating: 5,
                          detailedFeedback: "",
                          tractorIndustrySince: "",
                        });
                      }}
                      className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section - Enhanced */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-block mb-6 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <p className="text-base sm:text-lg font-bold">🎁 Start with 15 Days FREE Trial</p>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">
            Ready to Transform Your Tractor Buying/Selling Experience?
          </h2>
          
          <p className="text-xl sm:text-2xl md:text-3xl mb-6 text-primary-100 font-semibold">
            Join thousands of satisfied users across India
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <Tractor className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-white font-semibold">Start Selling</p>
              <p className="text-primary-100 text-sm">List your vehicle in minutes</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <Gavel className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-white font-semibold">Browse Auctions</p>
              <p className="text-primary-100 text-sm">Find your perfect tractor</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <BarChart className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-white font-semibold">Become a Dealer</p>
              <p className="text-primary-100 text-sm">Grow your business</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 text-center">
              <Factory className="w-8 h-8 mx-auto mb-2 text-white" />
              <p className="text-white font-semibold">OEM Partnership</p>
              <p className="text-primary-100 text-sm">Monitor your network</p>
            </div>
          </div>
          
          <p className="text-lg sm:text-xl mb-10 text-primary-200 font-bold">
            Get Started Today - It&apos;s Free to Sign Up!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-white to-gray-100 text-primary-700 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-extrabold text-lg sm:text-xl hover:from-gray-100 hover:to-white transition-all shadow-2xl hover:shadow-3xl hover:scale-105 border-2 border-white/20 min-w-[280px]"
            >
              <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
              <span>Create Free Account</span>
              <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/preapproved"
              className="group inline-flex items-center justify-center space-x-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-extrabold text-lg sm:text-xl hover:from-primary-400 hover:to-primary-500 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 border-2 border-white/30 min-w-[280px]"
            >
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
              <span>View Vehicles</span>
              <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="pt-8 border-t border-primary-500/50">
            <p className="text-primary-200 text-base sm:text-lg mb-4 font-medium">Already have an account?</p>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 text-white hover:text-primary-100 font-bold text-lg sm:text-xl underline decoration-2 underline-offset-4"
            >
              <span>Sign In Here</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-10 pt-8 border-t border-primary-500/50">
            <p className="text-primary-200 text-base sm:text-lg mb-4 font-semibold">Need Help? Contact Us:</p>
            <div className="flex flex-wrap gap-4 sm:gap-6 justify-center">
              <a
                href="tel:+917801094747"
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20"
              >
                <Phone className="w-5 h-5" />
                <span className="text-base sm:text-lg">7801094747</span>
              </a>
              
              <a
                href="mailto:contact@tractorauction.in"
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20"
              >
                <Mail className="w-5 h-5" />
                <span className="text-base sm:text-lg">Email Us</span>
              </a>
              
              <Link
                href="/contact"
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold hover:bg-white/20 transition-all border border-white/20"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-base sm:text-lg">Contact Page</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Member Feedback Section */}
      {feedbacks.length > 0 && (
        <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
                <Star className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
                What Our Members Say
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Real feedback from our members about their experience with our platform
              </p>
            </div>

            {loadingFeedbacks ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading feedbacks...</p>
              </div>
            ) : (
              <div className="relative overflow-hidden">
                {/* Gradient overlays for smooth fade effect */}
                <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none"></div>
                
                {/* Scrolling container */}
                <div className="flex gap-6 animate-scroll">
                  {/* Duplicate items for seamless loop */}
                  {[...feedbacks, ...feedbacks].map((feedback, index) => {
                    const avgRating = Math.round(
                      (feedback.businessRating + feedback.serviceRating + feedback.webAppRating + feedback.mobileAppRating) / 4
                    );
                    return (
                      <div
                        key={`${feedback.id}-${index}`}
                        className="flex-shrink-0 w-[320px] sm:w-[380px] md:w-[400px] bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-200"
                      >
                        <div className="flex items-start space-x-4 mb-4">
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 relative">
                            {feedback.reviewer.profilePhoto ? (
                              <Image
                                src={
                                  feedback.reviewer.profilePhoto.startsWith("http")
                                    ? feedback.reviewer.profilePhoto
                                    : `/uploads/${feedback.reviewer.profilePhoto}`
                                }
                                alt={feedback.reviewer.fullName}
                                fill
                                className="object-cover"
                                sizes="64px"
                                unoptimized={!feedback.reviewer.profilePhoto.startsWith("http")}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Users className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{feedback.reviewer.fullName}</h3>
                            <div className="flex items-center gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= avgRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                              <span className="ml-2 text-sm font-semibold text-gray-700">{avgRating}.0</span>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                                <span className="flex items-center gap-1 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-primary-600" />
                                  {feedback.reviewer.state}
                                </span>
                                {feedback.reviewer.district && (
                                  <span className="font-medium">• {feedback.reviewer.district}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-xs font-semibold">
                                  {feedback.reviewer.role}
                                </span>
                              </div>
                            </div>
                            {feedback.tractorIndustrySince && (
                              <p className="text-xs text-gray-500 mt-1 font-medium">
                                In Tractor Industry Since {feedback.tractorIndustrySince}
                              </p>
                            )}
                            {feedback.reviewer.memberships?.[0] && (
                              <p className="text-xs text-gray-500 font-medium">
                                Member Since {new Date(feedback.reviewer.memberships[0].startDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 mt-4">
                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                            {feedback.detailedFeedback}
                          </p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex gap-4">
                            <span>Business: {feedback.businessRating}/5</span>
                            <span>Service: {feedback.serviceRating}/5</span>
                          </div>
                          <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
