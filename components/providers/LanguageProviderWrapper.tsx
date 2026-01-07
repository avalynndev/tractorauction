"use client";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { useEffect } from "react";
import { getLanguage } from "@/lib/i18n/translations";

export default function LanguageProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Set initial language on mount
    const lang = getLanguage();
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, []);

  return <LanguageProvider>{children}</LanguageProvider>;
}
























