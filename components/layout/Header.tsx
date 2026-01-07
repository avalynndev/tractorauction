"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, X as CloseIcon, Phone, User, LogOut, MessageCircle, Facebook, Instagram, Youtube, Bell } from "lucide-react";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import XIcon from "@/components/icons/XIcon";
import toast from "react-hot-toast";
import { socialMediaLinks } from "@/lib/social-media";
import Logo from "@/components/branding/Logo";
import LanguageSwitcher from "@/components/language/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

export default function Header() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isValuerLoggedIn, setIsValuerLoggedIn] = useState(false);
  const [valuerName, setValuerName] = useState<string | null>(null);
  const [isOEMLoggedIn, setIsOEMLoggedIn] = useState(false);
  const [oemName, setOemName] = useState<string | null>(null);
  const [contactDropdownOpen, setContactDropdownOpen] = useState(false);

  useEffect(() => {
    // Helper to get cookie
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(";").shift() || null;
      }
      return null;
    };

    // Flag to prevent multiple simultaneous requests
    let isChecking = false;
    let lastCheckTime = 0;
    const MIN_CHECK_INTERVAL = 2000; // Minimum 2 seconds between checks

    // Check if user is logged in and get role
    const checkUserRole = async () => {
      // Check if we're in browser environment
      if (typeof window === "undefined") {
        return;
      }

      // Prevent multiple simultaneous requests
      const now = Date.now();
      if (isChecking || (now - lastCheckTime) < MIN_CHECK_INTERVAL) {
        return;
      }

      isChecking = true;
      lastCheckTime = now;

      // Check for valuer login first
      const valuerPhone = localStorage.getItem("valuerPhone");
      const valuerId = localStorage.getItem("valuerId");
      const storedValuerName = localStorage.getItem("valuerName");
      
      if (valuerPhone && valuerId) {
        setIsValuerLoggedIn(true);
        setValuerName(storedValuerName);
      } else {
        setIsValuerLoggedIn(false);
        setValuerName(null);
      }

      // Check for OEM login
      const oemId = localStorage.getItem("oemId");
      const storedOemName = localStorage.getItem("oemName");
      
      if (oemId) {
        setIsOEMLoggedIn(true);
        setOemName(storedOemName);
      } else {
        setIsOEMLoggedIn(false);
        setOemName(null);
      }

      try {
        // Try multiple token sources
        const token = localStorage.getItem("token") || 
                      sessionStorage.getItem("token") ||
                      getCookie("token");
        
        // Only set logged in if token exists and is not empty/null/undefined
        const hasValidToken = token && token !== "undefined" && token !== "null" && token.trim() !== "";
        
        if (!hasValidToken) {
          setIsLoggedIn(false);
          setUserRole(null);
          isChecking = false;
          return;
        }
        
        setIsLoggedIn(true);
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (data.role) {
            setUserRole(data.role);
          } else {
            setUserRole(null);
          }
        } else {
          // Token is invalid, clear all sources
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            setIsLoggedIn(false);
            setUserRole(null);
          }
        }
      } catch (error: any) {
        // Handle different types of errors silently
        if (error.name === "AbortError") {
          // Request timeout - don't log, just skip
          isChecking = false;
          return;
        }
        
        // Network errors - don't spam console, only log in development
        if (process.env.NODE_ENV === "development") {
          console.warn("Error fetching user role:", error.message || error);
        }
        
        // On network error, don't change state - might be temporary network issue
        // Only clear if it's a clear authentication error
        if (error.message?.includes("401") || error.message?.includes("403")) {
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } finally {
        isChecking = false;
      }
    };

    // Check on mount
    checkUserRole();

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      checkUserRole();
    };
    window.addEventListener("storage", handleStorageChange);

    // Listen for custom logout event (same window)
    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      setUserRole(null);
      setIsValuerLoggedIn(false);
      setValuerName(null);
    };
    window.addEventListener("userLogout", handleLogoutEvent);
    
    // Listen for storage changes to check valuer login
    const handleValuerStorageChange = () => {
      const valuerPhone = localStorage.getItem("valuerPhone");
      const valuerId = localStorage.getItem("valuerId");
      const storedValuerName = localStorage.getItem("valuerName");
      
      if (valuerPhone && valuerId) {
        setIsValuerLoggedIn(true);
        setValuerName(storedValuerName);
      } else {
        setIsValuerLoggedIn(false);
        setValuerName(null);
      }
      
      // Check OEM login
      const oemId = localStorage.getItem("oemId");
      const storedOemName = localStorage.getItem("oemName");
      
      if (oemId) {
        setIsOEMLoggedIn(true);
        setOemName(storedOemName);
      } else {
        setIsOEMLoggedIn(false);
        setOemName(null);
      }
    };
    window.addEventListener("storage", handleValuerStorageChange);

    // Also check periodically (in case role changes)
    // Increased interval to reduce load
    const interval = setInterval(checkUserRole, 30000); // Check every 30 seconds instead of 5

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storage", handleValuerStorageChange);
      window.removeEventListener("userLogout", handleLogoutEvent);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    // Check if valuer is logged in before clearing
    const wasValuerLoggedIn = isValuerLoggedIn;
    
    // Clear all token sources
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    // Clear cookie
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Clear valuer login data
    localStorage.removeItem("valuerPhone");
    localStorage.removeItem("valuerId");
    localStorage.removeItem("valuerName");
    
    // Clear OEM login data
    const wasOEMLoggedIn = isOEMLoggedIn;
    localStorage.removeItem("oemId");
    localStorage.removeItem("oemName");
    localStorage.removeItem("oemPhone");
    localStorage.removeItem("oemCompanyName");
    
    // Immediately update state
    setIsLoggedIn(false);
    setUserRole(null);
    setIsValuerLoggedIn(false);
    setValuerName(null);
    setIsOEMLoggedIn(false);
    setOemName(null);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event("userLogout"));
    
    toast.success("Logged out successfully");
    
    // Use hard redirect to ensure clean state
    // If valuer was logged in, redirect to valuer login page
    if (wasValuerLoggedIn) {
      window.location.href = "/valuer/login";
    } else if (wasOEMLoggedIn) {
      window.location.href = "/oem/login";
    } else {
      window.location.href = "/";
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Enhanced Top Bar with Contact */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 text-white py-3 sm:py-4 px-4 shadow-lg relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
            {/* Phone Number - Enhanced with Consistent Styling & Size */}
            <div className="flex items-center group">
              <div className="p-2.5 bg-gradient-to-br from-yellow-400/30 to-yellow-500/30 backdrop-blur-sm rounded-full mr-3 group-hover:from-yellow-400/40 group-hover:to-yellow-500/40 transition-all shadow-md">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 text-yellow-200" />
              </div>
              <a 
                href="tel:+917801094747" 
                className="text-base sm:text-lg font-bold hover:underline cursor-pointer transition-all whitespace-nowrap group"
                title="Click to call 7801094747"
              >
                <span className="text-yellow-200">Call Us:</span> <span className="text-yellow-300 font-extrabold group-hover:text-yellow-200 transition-colors">7801094747</span>
              </a>
            </div>
            
            {/* Divider - Enhanced */}
            <div className="hidden sm:block w-px h-8 bg-gradient-to-b from-transparent via-yellow-300/50 to-transparent"></div>
            
            {/* Social Media Icons - Enhanced with Consistent Styling & Size */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <span className="text-base sm:text-lg font-bold mr-1 hidden sm:inline text-yellow-200">Follow Us:</span>
              <a
                href={socialMediaLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
                aria-label="WhatsApp"
                title="WhatsApp"
              >
                <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={socialMediaLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
                aria-label="Facebook"
                title="Facebook"
              >
                <Facebook className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={socialMediaLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 rounded-full flex items-center justify-center hover:from-pink-600 hover:via-pink-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
                aria-label="Instagram"
                title="Instagram"
              >
                <Instagram className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={socialMediaLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
                aria-label="YouTube"
                title="YouTube"
              >
                <Youtube className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </a>
              <a
                href={socialMediaLinks.x}
                target="_blank"
                rel="noopener noreferrer"
                className="group w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center hover:from-gray-900 hover:to-black transition-all shadow-lg hover:shadow-xl hover:scale-110 transform"
                aria-label="X"
                title="X (formerly Twitter)"
              >
                <XIcon className="w-6 h-6 sm:w-7 sm:h-7 text-white group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Logo variant="default" size="md" />
          </div>

          {/* Desktop Menu - Enhanced with WOW Effects */}
          <div className="hidden md:flex items-center space-x-2">
            <Link 
              href="/" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-700 font-semibold rounded-xl transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10">{t("nav.home")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Link>
            <Link 
              href="/auctions" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-700 font-semibold rounded-xl transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10">{t("nav.auctions")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Link>
            <Link 
              href="/preapproved" 
              className="relative px-4 py-2 text-gray-700 hover:text-primary-700 font-semibold rounded-xl transition-all duration-300 group overflow-hidden"
            >
              <span className="relative z-10">{t("nav.preApproved")}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
            </Link>
            {/* Contact Dropdown - Enhanced */}
            <div 
              className="relative"
              onMouseEnter={() => setContactDropdownOpen(true)}
              onMouseLeave={() => setContactDropdownOpen(false)}
            >
              <Link 
                href="/contact" 
                className="relative px-4 py-2 text-gray-700 hover:text-primary-700 font-semibold rounded-xl transition-all duration-300 group overflow-hidden flex items-center"
              >
                <span className="relative z-10">{t("nav.contact")}</span>
                <svg className="w-4 h-4 ml-1 relative z-10 transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </Link>
              {contactDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 animate-fade-in overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent"></div>
                  <Link
                    href="/contact"
                    className="relative block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all duration-200 font-medium"
                  >
                    {t("nav.contact")}
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="relative block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all duration-200 font-medium"
                  >
                    How It Works
                  </Link>
                  <Link
                    href="/why-choose-us"
                    className="relative block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 transition-all duration-200 font-medium"
                  >
                    Why Choose Us
                  </Link>
                </div>
              )}
            </div>
            {(isLoggedIn || isValuerLoggedIn || isOEMLoggedIn) ? (
              <>
                {isValuerLoggedIn ? (
                  <Link
                    href="/valuer/inspections"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{valuerName || "Valuer Dashboard"}</span>
                  </Link>
                ) : isOEMLoggedIn ? (
                  <Link
                    href="/oem/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{oemName || "OEM Dashboard"}</span>
                  </Link>
                ) : (
                  <Link
                    href="/my-account"
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
                  >
                    <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{t("nav.myAccount")}</span>
                  </Link>
                )}
                {(userRole === "ADMIN" || userRole === "admin") && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 text-white px-4 py-2 rounded-xl hover:from-purple-700 hover:via-purple-800 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-bold text-sm relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">Admin</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold group"
                >
                  <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  <span>{t("nav.signOut")}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-5 py-2.5 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 font-semibold min-w-[120px] text-center"
                >
                  {t("btn.login")}
                </Link>
                <Link
                  href="/register"
                  className="border-2 border-primary-600 text-primary-700 px-5 py-2.5 rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-300 font-semibold hover:border-primary-700 hover:scale-105 min-w-[120px] text-center"
                >
                  {t("btn.register")}
                </Link>
              </>
            )}
            {/* Language Switcher - Single Letter Button at End */}
            <div className="ml-2">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Menu Button - Enhanced */}
          <button
            className="md:hidden p-2 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 text-gray-700 hover:text-primary-700 transition-all duration-300 shadow-sm hover:shadow-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <CloseIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu - Enhanced */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 border-t border-gray-200 pt-4 animate-fade-in">
            <Link
              href="/"
              className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-xl transition-all duration-300 font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/auctions"
              className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-xl transition-all duration-300 font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.auctions")}
            </Link>
            <Link
              href="/preapproved"
              className="block px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-xl transition-all duration-300 font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("nav.preApproved")}
            </Link>
            {/* Language Switcher - Mobile */}
            <div className="py-2 border-t border-gray-200 mt-2 pt-4">
              <LanguageSwitcher />
            </div>
            <div className="py-2 px-4">
              <div className="text-gray-700 font-bold mb-2 text-sm uppercase tracking-wide">{t("nav.contact")}</div>
              <div className="pl-2 space-y-1">
                <Link
                  href="/contact"
                  className="block px-3 py-2 text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.contact")}
                </Link>
                <Link
                  href="/how-it-works"
                  className="block px-3 py-2 text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="/why-choose-us"
                  className="block px-3 py-2 text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 rounded-lg text-sm font-medium transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Why Choose Us
                </Link>
              </div>
            </div>
            <div className="pt-4 space-y-2 border-t border-gray-200 px-4">
              {(isLoggedIn || isValuerLoggedIn) ? (
                <>
                  {isLoggedIn && !isValuerLoggedIn && (
                    <Link
                      href="/my-account/notifications"
                      className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Bell className="w-5 h-5" />
                      <span>Notifications</span>
                    </Link>
                  )}
                  {isValuerLoggedIn ? (
                    <Link
                      href="/valuer/inspections"
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>{valuerName || "Valuer Dashboard"}</span>
                    </Link>
                  ) : (
                    <Link
                      href="/my-account"
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="w-5 h-5" />
                      <span>{t("nav.myAccount")}</span>
                    </Link>
                  )}
                  {(userRole === "ADMIN" || userRole === "admin") && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-center space-x-1 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>Admin</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>{t("nav.signOut")}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 rounded-xl text-center font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("btn.login")}
                  </Link>
                  <Link
                    href="/register"
                    className="block border-2 border-primary-600 text-primary-700 px-4 py-3 rounded-xl text-center font-semibold hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 transition-all duration-300"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t("btn.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}


