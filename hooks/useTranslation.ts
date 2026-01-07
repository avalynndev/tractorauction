"use client";

import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Hook to get translation function
 * Usage: const { t } = useTranslation();
 * Then: t("nav.home") returns translated text
 */
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
























