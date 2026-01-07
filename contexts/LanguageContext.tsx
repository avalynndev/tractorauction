"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { Language, getLanguage, setLanguage as saveLanguage, t } from "@/lib/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLanguage = getLanguage();
    setLanguageState(savedLanguage);
    saveLanguage(savedLanguage);
    // Update HTML lang attribute on mount
    if (typeof document !== "undefined") {
      document.documentElement.lang = savedLanguage;
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    saveLanguage(lang);
    // Update HTML lang attribute immediately
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
    }
  }, []);

  const translate = useCallback((key: string) => {
    return t(key, language);
  }, [language]);

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t: translate,
    }),
    [language, setLanguage, translate]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

