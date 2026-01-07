"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Mail, Settings } from "lucide-react";
import Link from "next/link";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const [unsubscribedType, setUnsubscribedType] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      handleUnsubscribe(token);
    } else {
      setStatus("error");
      setMessage("Invalid unsubscribe link. Missing token.");
    }
  }, [token]);

  const handleUnsubscribe = async (unsubscribeToken: string) => {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${unsubscribeToken}`);
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
        setUnsubscribedType(data.unsubscribedType || null);
      } else {
        setStatus("error");
        setMessage(data.message || "Failed to unsubscribe");
      }
    } catch (error) {
      setStatus("error");
      setMessage("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your request...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed Successfully</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              {unsubscribedType && (
                <p className="text-sm text-gray-500 mb-6">
                  You will no longer receive <strong>{unsubscribedType.replace(/_/g, " ")}</strong> notifications.
                </p>
              )}
              <div className="space-y-3">
                <Link
                  href="/my-account?tab=settings"
                  className="inline-flex items-center justify-center w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Email Preferences
                </Link>
                <Link
                  href="/"
                  className="inline-block text-primary-600 hover:underline text-sm"
                >
                  Return to Homepage
                </Link>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe Failed</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/my-account?tab=settings"
                  className="inline-flex items-center justify-center w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Manage Email Preferences
                </Link>
                <Link
                  href="/"
                  className="inline-block text-primary-600 hover:underline text-sm"
                >
                  Return to Homepage
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Contact us at{" "}
            <a href="mailto:contact@tractorauction.in" className="text-primary-600 hover:underline">
              contact@tractorauction.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}



























