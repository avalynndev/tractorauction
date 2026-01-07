"use client";

import { useEffect } from "react";

export default function FontLoader() {
  useEffect(() => {
    // Check if the font link already exists
    const existingLink = document.querySelector(
      'link[href*="fonts.googleapis.com/css2?family=Noto+Sans"]'
    );
    
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Noto+Sans+Telugu:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&family=Noto+Sans+Kannada:wght@400;500;600;700&family=Noto+Sans+Malayalam:wght@400;500;600;700&family=Noto+Sans+Gurmukhi:wght@400;500;600;700&family=Noto+Sans+Gujarati:wght@400;500;600;700&family=Noto+Sans+Oriya:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  return null;
}























