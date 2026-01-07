"use client";

import { useState, useEffect } from "react";
import { X, Gem, Sparkles, ArrowUp, Crown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface DiamondUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function DiamondUpgradeModal({
  isOpen,
  onClose,
  onUpgrade,
}: DiamondUpgradeModalProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const handleUpgrade = () => {
    handleClose();
    onUpgrade();
  };

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div
        className={`bg-gradient-to-br from-cyan-50 via-purple-50 to-pink-50 border-4 border-purple-400 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden group transform transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        {/* Animated Diamond Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-purple-400/20 to-pink-400/20 animate-shimmer opacity-100 rounded-2xl"></div>
        <div className="absolute top-4 right-4 text-2xl animate-bounce z-0">💎</div>
        <div className="absolute top-8 left-8 text-xl animate-pulse z-0">✨</div>
        <div className="absolute bottom-8 right-8 text-lg animate-pulse z-0" style={{ animationDelay: '300ms' }}>⭐</div>
        <div className="absolute top-1/2 left-4 text-xl animate-pulse z-0" style={{ animationDelay: '150ms' }}>👑</div>

        {/* Premium Badge - Enhanced and Prominent */}
        <div className="relative z-20 pt-6 pb-2 px-4">
          <div className="bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-500 text-white text-center py-4 px-6 rounded-2xl shadow-2xl border-4 border-white/50 relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer"></div>
            
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 via-purple-500/50 to-pink-400/50 blur-xl -z-10"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="w-6 h-6 text-yellow-300 animate-pulse" fill="currentColor" />
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-wide">
                  Premium Diamond Membership
                </h3>
                <Star className="w-6 h-6 text-yellow-300 animate-pulse" fill="currentColor" />
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 text-gray-600 hover:text-gray-800 hover:bg-white/50 p-2 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 pt-4">
          {/* Icon */}
          <div className="bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl transform group-hover:rotate-12 transition-transform animate-pulse">
            <Gem className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-extrabold text-center mb-3 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upgrade to Diamond! 💎
          </h2>

          {/* Subtitle */}
          <p className="text-center text-gray-700 mb-6 font-semibold">
            Unlock Premium Benefits & Exclusive Features
          </p>

          {/* Benefits List */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 mb-6 border-2 border-purple-200">
            <ul className="space-y-3">
              {[
                "365 days access (Best Value!)",
                "Unlimited bidding & selling",
                "24/7 Priority support",
                "Email & SMS notifications",
                "Early access to new auctions",
                "Bulk vehicle upload",
                "Featured vehicle listings",
                "Analytics dashboard",
              ].map((benefit, index) => (
                <li key={index} className="flex items-center text-sm text-gray-800">
                  <Sparkles className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 mb-1">Special Price</p>
            <p className="text-5xl font-black bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-1">
              <span className="text-purple-600">₹</span>
              <span>9,000</span>
            </p>
            <p className="text-sm font-semibold text-gray-700 mt-1">365 Days - Best Value!</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Crown className="w-5 h-5" />
              <span>Upgrade to Diamond</span>
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-gray-500 mt-4">
            Limited time offer - Get all premium features!
          </p>
        </div>
      </div>
    </div>
  );
}

