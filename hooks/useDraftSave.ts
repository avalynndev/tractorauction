import { useEffect, useCallback, useRef } from "react";

interface UseDraftSaveOptions {
  storageKey: string;
  data: any;
  enabled?: boolean;
  debounceMs?: number;
  onLoad?: (draft: any) => void;
  onSave?: (draft: any) => void;
}

/**
 * Custom hook for automatically saving form drafts to localStorage
 * and restoring them when the component mounts
 */
export function useDraftSave({
  storageKey,
  data,
  enabled = true,
  debounceMs = 1000,
  onLoad,
  onSave,
}: UseDraftSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const hasLoadedDraft = useRef(false);
  const onLoadRef = useRef(onLoad);

  // Keep onLoad ref up to date
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Load draft on mount (only once)
  useEffect(() => {
    if (!enabled || hasLoadedDraft.current) return;

    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && Object.keys(parsed).length > 0) {
          if (onLoadRef.current) {
            onLoadRef.current(parsed);
          }
        }
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }

    hasLoadedDraft.current = true;
    isInitialMount.current = false;
  }, [storageKey, enabled]);

  // Save draft when data changes (debounced)
  useEffect(() => {
    if (!enabled || isInitialMount.current) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout to save after debounce period
    timeoutRef.current = setTimeout(() => {
      try {
        // Only save if data has meaningful content
        const hasContent = data && (
          (typeof data === "object" && Object.keys(data).length > 0) ||
          (typeof data === "string" && data.trim().length > 0) ||
          (Array.isArray(data) && data.length > 0)
        );

        if (hasContent) {
          localStorage.setItem(storageKey, JSON.stringify(data));
          if (onSave) {
            onSave(data);
          }
        } else {
          // Clear draft if data is empty
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Error saving draft:", error);
      }
    }, debounceMs);

    // Cleanup timeout on unmount or data change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, storageKey, enabled, debounceMs, onSave]);

  // Clear draft function
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  }, [storageKey]);

  // Check if draft exists
  const hasDraft = useCallback(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      return savedDraft !== null && savedDraft !== "null" && savedDraft !== "{}";
    } catch {
      return false;
    }
  }, [storageKey]);

  return { clearDraft, hasDraft };
}


