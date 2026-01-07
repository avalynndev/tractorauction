"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Link from "next/link";
import { Eye, EyeOff, Phone, Lock } from "lucide-react";

const loginSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  password: z.string().optional(),
}).refine((data, ctx) => {
  // Password is required when loginMethod is "password"
  // This will be validated in the component
  return true;
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("password");
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const phoneNumber = watch("phoneNumber");

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("token") || 
                  sessionStorage.getItem("token") ||
                  getCookie("token");
    
    if (token && token !== "undefined" && token !== "null") {
      // Test if token is valid
      fetch("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      })
        .then((res) => {
          if (res.ok) {
            // Token is valid, redirect to my-account
            window.location.href = "/my-account";
          }
        })
        .catch(() => {
          // Token invalid, stay on login page
        });
    }
  }, []);

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  };

  const onSubmit = async (data: LoginForm) => {
    // Validate password if password method is selected
    if (loginMethod === "password") {
      if (!data.password || data.password.trim() === "") {
        toast.error("Password is required");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: data.phoneNumber,
          password: loginMethod === "password" ? data.password : undefined,
          method: loginMethod,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        if (loginMethod === "otp") {
          toast.success("OTP sent to your phone number");
          router.push(`/verify-otp?phone=${data.phoneNumber}`);
        } else {
          // Password login successful
          if (result.token) {
            localStorage.setItem("token", result.token);
            toast.success("Login successful!");
            router.push("/auctions");
          } else {
            toast.error("Login failed. Please try again.");
          }
        }
      } else {
        // Handle specific error cases
        if (result.requiresPasswordReset) {
          toast.error(result.message || "Password not set. Please reset your password first.");
          setTimeout(() => {
            router.push("/forgot-password");
          }, 2000);
        } else {
          toast.error(result.message || "Login failed");
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear password when switching to OTP method
  useEffect(() => {
    if (loginMethod === "otp") {
      setValue("password", "");
    }
  }, [loginMethod, setValue]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Sign In</h1>
          <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            {loginMethod === "password"
              ? "Enter your phone number and password"
              : "Enter your phone number to receive OTP"}
          </p>

          {/* Login Method Toggle */}
          <div className="mb-6">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  loginMethod === "password"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Password Login
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("otp")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  loginMethod === "otp"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Phone className="w-4 h-4 inline mr-2" />
                OTP Login
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  {...register("phoneNumber")}
                  className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  autoComplete="tel"
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  id="phoneNumber"
                  name="phoneNumber"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            {loginMethod === "password" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: loginMethod === "password" ? "Password is required" : false,
                    })}
                    className="w-full pl-10 pr-10 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    id="password"
                    name="password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 text-white py-3 sm:py-2.5 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base touch-manipulation"
            >
              {isSubmitting 
                ? (loginMethod === "otp" ? "Sending OTP..." : "Signing In...")
                : (loginMethod === "otp" ? "Send OTP" : "Sign In")
              }
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-primary-600 hover:underline font-medium"
            >
              Forgot Password?
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-primary-600 hover:underline font-semibold">
              Register Now
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}


