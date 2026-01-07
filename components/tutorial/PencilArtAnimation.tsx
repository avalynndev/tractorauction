"use client";

import { useEffect, useRef, useState } from "react";

interface PencilArtAnimationProps {
  animationType: "register" | "browse" | "bid" | "win";
  isPlaying: boolean;
}

export default function PencilArtAnimation({ animationType, isPlaying }: PencilArtAnimationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawProgress, setDrawProgress] = useState(0);

  useEffect(() => {
    if (!isPlaying) {
      setDrawProgress(0);
      return;
    }

    const duration = 6000; // 6 seconds for drawing animation
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDrawProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isPlaying, animationType]);

  const getAnimationPaths = () => {
    switch (animationType) {
      case "register":
        return {
          paths: [
            // User profile outline
            "M 150 100 L 150 180 M 120 140 L 180 140 M 120 160 L 180 160",
            // Form box
            "M 100 200 L 200 200 L 200 280 L 100 280 Z",
            // Text lines in form
            "M 110 220 L 190 220 M 110 240 L 190 240 M 110 260 L 190 260",
            // Checkmark
            "M 120 300 L 140 320 L 180 280",
          ],
          strokeDasharray: [200, 200, 150, 150, 100],
        };
      case "browse":
        return {
          paths: [
            // Search icon
            "M 120 120 C 120 100, 140 100, 140 120 C 140 140, 120 140, 120 120",
            "M 140 140 L 180 180",
            // List items
            "M 100 200 L 200 200 M 100 230 L 200 230 M 100 260 L 200 260",
            // Arrow
            "M 180 200 L 200 215 L 180 230",
          ],
          strokeDasharray: [100, 100, 80, 120, 60],
        };
      case "bid":
        return {
          paths: [
            // Gavel handle
            "M 100 100 L 100 200",
            // Gavel head
            "M 80 100 L 120 100 L 120 120 L 80 120 Z",
            // Bid amount box
            "M 130 150 L 190 150 L 190 200 L 130 200 Z",
            // Up arrow
            "M 160 170 L 160 150 M 150 160 L 160 150 L 170 160",
          ],
          strokeDasharray: [100, 80, 120, 60],
        };
      case "win":
        return {
          paths: [
            // Handshake - left hand
            "M 100 150 C 100 130, 120 130, 120 150 C 120 170, 100 170, 100 150",
            "M 100 150 L 90 180 L 110 180 Z",
            // Handshake - right hand
            "M 200 150 C 200 130, 180 130, 180 150 C 180 170, 200 170, 200 150",
            "M 200 150 L 210 180 L 190 180 Z",
            // Connecting line
            "M 120 150 L 180 150",
            // Checkmark
            "M 130 200 L 150 220 L 170 200",
          ],
          strokeDasharray: [100, 60, 100, 60, 80, 60],
        };
      default:
        return { paths: [], strokeDasharray: [] };
    }
  };

  const { paths, strokeDasharray } = getAnimationPaths();

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg
        ref={svgRef}
        viewBox="0 0 300 350"
        className="w-full h-full max-w-lg"
        style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }}
      >
        {paths.map((path, index) => {
          const totalLength = strokeDasharray[index] || 100;
          const drawnLength = totalLength * drawProgress;
          const remainingLength = Math.max(0, totalLength - drawnLength);

          return (
            <path
              key={index}
              d={path}
              fill="none"
              stroke="#2d1810"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${drawnLength} ${remainingLength}`}
              style={{
                transition: drawProgress > 0 ? "stroke-dasharray 0.05s linear" : "none",
                opacity: drawProgress > 0 ? 1 : 0,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

