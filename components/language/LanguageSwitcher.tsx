"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { languages, Language } from "@/lib/i18n/translations";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentLanguage = languages.find((l) => l.code === language) || languages[0];
  
  // Get first character of native name for the button
  const getLanguageLetter = (lang: typeof currentLanguage) => {
    if (!lang) return "E";
    // For languages with native scripts, use the first character
    // For English, use "E"
    if (lang.code === "en") return "E";
    return lang.nativeName.charAt(0);
  };

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-primary-100 hover:to-primary-200 border border-gray-300 hover:border-primary-400 transition-all duration-300 text-sm font-bold text-gray-700 hover:text-primary-700 shadow-sm hover:shadow-md group"
        aria-label={`Current language: ${currentLanguage.name}. Click to change language`}
        title={`${currentLanguage.name} - Click to change`}
      >
        <span className="text-base">{getLanguageLetter(currentLanguage)}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Compact Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-200 z-20 max-h-96 overflow-y-auto animate-fade-in">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Language
              </div>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left rounded-lg transition-all duration-200 ${
                    language === lang.code
                      ? "bg-gradient-to-r from-primary-50 to-primary-100 text-primary-700 font-bold"
                      : "text-gray-700 hover:bg-gray-50 font-medium"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
                      {lang.code === "en" ? "E" : lang.nativeName.charAt(0)}
                    </span>
                    <span className="text-sm">{lang.nativeName}</span>
                  </div>
                  {language === lang.code && (
                    <Check className="w-4 h-4 text-primary-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}


