"use client";

import { useEffect } from "react";

/**
 * ZoomProvider - Sets default zoom level to 67% for better information density
 * This allows users to see more content on screen while maintaining readability
 * Tables, vehicle details, and other content will appear more compact
 */
export default function ZoomProvider() {
  useEffect(() => {
    // Set zoom level to 67% (0.67) on the html element
    // This provides the best compatibility across browsers
    const setZoom = () => {
      if (document.documentElement) {
        // Use CSS zoom property (supported in Chrome, Edge, Safari, Firefox)
        document.documentElement.style.zoom = "0.67";
      }
    };

    // Set zoom immediately when component mounts
    setZoom();

    // Also set on window load as a fallback
    if (document.readyState === "loading") {
      window.addEventListener("load", setZoom);
      return () => window.removeEventListener("load", setZoom);
    }

    // Handle window resize to maintain zoom
    const handleResize = () => {
      setZoom();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return null;
}

