"use client";

import { useState } from "react";
import { Share2, Copy, Check, Facebook, Twitter, MessageCircle, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  className?: string;
  variant?: "default" | "icon" | "text";
}

export default function ShareButton({
  url,
  title,
  description = "",
  className = "",
  variant = "default",
}: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== "undefined" 
    ? `${window.location.origin}${url}` 
    : url;

  const shareText = description 
    ? `${title}\n\n${description}\n\n${fullUrl}`
    : `${title}\n\n${fullUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
      setShowShareMenu(false);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description || title,
          url: fullUrl,
        });
        setShowShareMenu(false);
      } catch (error: any) {
        // User cancelled or error occurred
        if (error.name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      // Fallback to copy
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: string) => {
    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowShareMenu(false);
  };

  if (variant === "icon") {
    return (
      <div className="relative z-50" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowShareMenu(!showShareMenu);
          }}
          className={`p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer ${className}`}
          aria-label="Share"
          style={{ pointerEvents: 'auto' }}
        >
          <Share2 className="w-5 h-5 text-gray-700" />
        </button>
        {showShareMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowShareMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[100]">
              <div className="p-2">
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                  >
                    <Share2 className="w-4 h-4 text-gray-700" />
                    Share...
                  </button>
                )}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-700" />
                      Copy Link
                    </>
                  )}
                </button>
                <div className="border-t my-1" />
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                  <Facebook className="w-4 h-4 text-blue-600" />
                  Facebook
                </button>
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                  <Twitter className="w-4 h-4 text-blue-400" />
                  Twitter
                </button>
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
                >
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  WhatsApp
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowShareMenu(!showShareMenu);
        }}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors ${className}`}
      >
        <Share2 className="w-4 h-4 text-white" />
        Share
      </button>
      {showShareMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowShareMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Share</h3>
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left mb-1"
                >
                  <Share2 className="w-4 h-4 text-gray-700" />
                  Share via...
                </button>
              )}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-left"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              <div className="border-t my-2" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                  aria-label="Share on Facebook"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                  aria-label="Share on Twitter"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                </button>
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                  aria-label="Share on WhatsApp"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

