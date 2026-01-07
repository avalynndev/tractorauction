"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface LogoProps {
  variant?: "default" | "compact" | "icon";
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ 
  variant = "default", 
  className = "",
  showText = true,
  size = "md"
}: LogoProps) {
  const router = useRouter();
  
  const iconSizeClasses = {
    sm: "w-8 h-8",
    md: "w-8 h-8 sm:w-10 sm:h-10",
    lg: "w-10 h-10 sm:w-12 sm:h-12",
  };

  const textSizeClasses = {
    sm: "text-base",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const iconTextSizeClasses = {
    sm: "text-lg sm:text-xl",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Check if user is logged in
    const token = typeof window !== "undefined" 
      ? localStorage.getItem("token") || sessionStorage.getItem("token")
      : null;
    
    if (token) {
      router.push("/my-account");
    } else {
      router.push("/");
    }
  };

  return (
    <a 
      href="/" 
      onClick={handleClick}
      className={`flex items-center space-x-3 group ${className} cursor-pointer transition-transform hover:scale-105`}
    >
      {/* Enhanced TA Logo Box with Gradient & Animation */}
      <div className={`${iconSizeClasses[size]} bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:rotate-3 relative overflow-hidden`}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        <span className={`text-white font-extrabold ${iconTextSizeClasses[size]} relative z-10 drop-shadow-lg`}>TA</span>
      </div>
      
      {showText && (
        <div className="flex flex-col items-center sm:items-start">
          <span className={`${textSizeClasses[size]} font-extrabold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 bg-clip-text text-transparent leading-tight hidden sm:inline group-hover:from-primary-600 group-hover:via-primary-500 group-hover:to-primary-600 transition-all duration-300`}>
            Tractor Auction
          </span>
          <span className={`text-base font-extrabold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent sm:hidden`}>
            TA
          </span>
          {variant === "default" && (
            <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 bg-clip-text text-transparent hidden sm:block mt-0.5 text-center">
              Buy & Sell Tractors
            </span>
          )}
        </div>
      )}
    </a>
  );
}

