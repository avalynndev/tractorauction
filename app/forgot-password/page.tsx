"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ArrowLeft, Lock, Phone, Mail } from "lucide-react";
import Link from "next/link";

const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, "Phone number or email is required"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [identifier, setIdentifier] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const watchedIdentifier = watch("identifier");

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: data.identifier }),
      });

      const result = await response.json();

      if (response.ok) {
        setIdentifier(data.identifier);
        setOtpSent(true);
        toast.success("OTP sent to your registered phone number or email");
      } else {
        toast.error(result.message || "Failed to send OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("OTP resent successfully");
      } else {
        toast.error(result.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if identifier looks like email or phone
  const isEmail = watchedIdentifier?.includes("@");
  const isPhone = /^[6-9]\d{9}$/.test(watchedIdentifier?.replace(/\D/g, "") || "");

  if (otpSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                OTP Sent Successfully
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                We&apos;ve sent an OTP to your registered {isEmail ? "email" : "phone number"}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-medium text-center">
                {isEmail ? (
                  <>
                    <Mail className="w-4 h-4 inline mr-2" />
                    Check your email inbox for the OTP
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4 inline mr-2" />
                    Check your phone for the OTP
                  </>
                )}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push(`/reset-password?identifier=${encodeURIComponent(identifier)}`)}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors text-base"
              >
                Continue to Reset Password
              </button>

              <button
                onClick={handleResendOTP}
                disabled={isSubmitting}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isSubmitting ? "Sending..." : "Resend OTP"}
              </button>

              <Link
                href="/login"
                className="block text-center text-primary-600 hover:underline text-sm font-medium"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 sm:py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <Link
            href="/login"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Forgot Password?
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Enter your registered phone number or email to receive an OTP for password reset
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number or Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {isEmail ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type="text"
                  {...register("identifier")}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  placeholder={isEmail ? "your@email.com" : "10-digit mobile number"}
                  autoComplete="email tel"
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Enter your registered phone number or email address
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link href="/login" className="text-primary-600 hover:underline font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






















