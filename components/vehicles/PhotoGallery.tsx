"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoGalleryProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function PhotoGallery({
  photos,
  isOpen,
  onClose,
  initialIndex = 0,
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || photos.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const getImageUrl = (photo: string) => {
    if (photo.startsWith("http")) {
      return photo;
    }
    return `/uploads/${photo}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 transition-colors p-2"
        aria-label="Close gallery"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous Button */}
      {photos.length > 1 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 z-50 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full hover:bg-black/70"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Main Image */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <img
          src={getImageUrl(photos[currentIndex])}
          alt={`Photo ${currentIndex + 1} of ${photos.length}`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='20' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
          }}
        />
      </div>

      {/* Next Button */}
      {photos.length > 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-50 text-white hover:text-gray-300 transition-colors p-2 bg-black/50 rounded-full hover:bg-black/70"
          aria-label="Next photo"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Thumbnail Strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-white scale-110"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={getImageUrl(photo)}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%23ddd' width='80' height='80'/%3E%3C/svg%3E";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Photo Counter */}
      {photos.length > 1 && (
        <div className="absolute top-4 left-4 z-50 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
      )}
    </div>
  );
}

