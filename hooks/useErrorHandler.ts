import { useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getErrorMessage,
  isNetworkError,
  isAuthenticationError,
  isValidationError,
} from "@/lib/errors";

interface ErrorResponse {
  message?: string;
  code?: string;
  fields?: Record<string, string[]>;
  success?: boolean;
}

/**
 * Custom hook for handling errors consistently across components
 */
export function useErrorHandler() {
  const router = useRouter();

  const handleError = useCallback(
    (error: unknown, options?: {
      showToast?: boolean;
      redirectOnAuthError?: boolean;
      customMessage?: string;
    }) => {
      const {
        showToast = true,
        redirectOnAuthError = true,
        customMessage,
      } = options || {};

      // Get error message
      let errorMessage = customMessage || getErrorMessage(error);

      // Handle network errors
      if (isNetworkError(error)) {
        errorMessage = "Network error. Please check your connection and try again.";
        if (showToast) {
          toast.error(errorMessage, { duration: 5000 });
        }
        return;
      }

      // Handle authentication errors
      if (isAuthenticationError(error)) {
        errorMessage = "Your session has expired. Please log in again.";
        if (showToast) {
          toast.error(errorMessage);
        }
        if (redirectOnAuthError) {
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        }
        return;
      }

      // Handle validation errors
      if (isValidationError(error)) {
        if (showToast) {
          toast.error(errorMessage);
        }
        return;
      }

      // Handle API error responses
      if (error && typeof error === "object" && "message" in error) {
        const apiError = error as ErrorResponse;
        errorMessage = apiError.message || errorMessage;

        // Show field-specific errors for validation
        if (apiError.fields) {
          const fieldErrors = Object.values(apiError.fields).flat();
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors[0];
          }
        }
      }

      // Show toast notification
      if (showToast) {
        toast.error(errorMessage);
      }

      // Log error for debugging
      if (process.env.NODE_ENV === "development") {
        console.error("Error handled:", error);
      }
    },
    [router]
  );

  const handleApiError = useCallback(
    async (response: Response, options?: {
      showToast?: boolean;
      redirectOnAuthError?: boolean;
    }) => {
      const {
        showToast = true,
        redirectOnAuthError = true,
      } = options || {};

      try {
        const data: ErrorResponse = await response.json();

        // Handle 401 Unauthorized
        if (response.status === 401) {
          if (redirectOnAuthError) {
            handleError(
              new Error("Your session has expired. Please log in again."),
              { showToast, redirectOnAuthError }
            );
          } else {
            handleError(data, { showToast, redirectOnAuthError: false });
          }
          return;
        }

        // Handle 403 Forbidden - use the actual error message from API
        if (response.status === 403) {
          const errorMessage = data.message || "You don't have permission to perform this action.";
          handleError(
            new Error(errorMessage),
            { showToast, redirectOnAuthError: false }
          );
          return;
        }

        // Handle 404 Not Found
        if (response.status === 404) {
          handleError(
            new Error("The requested resource was not found."),
            { showToast, redirectOnAuthError: false }
          );
          return;
        }

        // Handle 429 Too Many Requests
        if (response.status === 429) {
          handleError(
            new Error("Too many requests. Please wait a moment and try again."),
            { showToast, redirectOnAuthError: false }
          );
          return;
        }

        // Handle 500+ Server Errors
        if (response.status >= 500) {
          handleError(
            new Error("Server error. Please try again later."),
            { showToast, redirectOnAuthError: false }
          );
          return;
        }

        // Handle other errors
        handleError(data, { showToast, redirectOnAuthError: false });
      } catch (parseError) {
        // If response is not JSON, handle as generic error
        handleError(
          new Error(`Request failed with status ${response.status}`),
          { showToast, redirectOnAuthError: false }
        );
      }
    },
    [handleError]
  );

  return {
    handleError,
    handleApiError,
  };
}









