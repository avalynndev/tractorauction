"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { 
  User, Phone, MessageCircle, Mail, MapPin, Building2, 
  Briefcase, ShoppingCart, Truck, ArrowRight, CheckCircle2,
  Sparkles, Shield, FileText, IndianRupee
} from "lucide-react";

const registrationSchema = z.object({
  registrationType: z.enum(["INDIVIDUAL", "FIRM"]),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number"),
  whatsappNumber: z.string().regex(/^[6-9]\d{9}$/, "Invalid WhatsApp number"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  district: z.string().min(2, "District is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode"),
  role: z.enum(["BUYER", "SELLER", "DEALER"]),
  gstNumber: z.string().optional(),
  referralCode: z.string().optional(), // Optional referral code
}).refine((data) => {
  if (data.registrationType === "FIRM" && data.gstNumber) {
    return /^[0-9A-Z]{15}$/.test(data.gstNumber);
  }
  return true;
}, {
  message: "GST Number must be 15 characters alphanumeric",
  path: ["gstNumber"],
});

type RegistrationForm = z.infer<typeof registrationSchema>;

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationType, setRegistrationType] = useState<"INDIVIDUAL" | "FIRM">("INDIVIDUAL");
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      registrationType: "INDIVIDUAL",
      role: "BUYER",
      referralCode: searchParams?.get("ref") || "",
    },
  });

  // Set referral code from URL parameter
  useEffect(() => {
    const refCode = searchParams?.get("ref");
    if (refCode) {
      setValue("referralCode", refCode);
    }
  }, [searchParams, setValue]);

  const watchedRegistrationType = watch("registrationType");
  const watchedRole = watch("role");

  const onSubmit = async (data: RegistrationForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Registration successful! Please verify OTP sent to your phone.");
        router.push(`/verify-otp?phone=${data.phoneNumber}`);
      } else {
        toast.error(result.message || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl mb-6 shadow-xl transform hover:scale-105 transition-transform">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Join India's premier tractor auction platform. Start your journey in just a few steps!
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-500" />
              <span>Secure & Verified</span>
              <span className="mx-2">•</span>
              <Sparkles className="w-4 h-4 text-yellow-500" />
              <span>15 Days Free Trial</span>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 md:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Registration Type Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Registration Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`group relative flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    watchedRegistrationType === "INDIVIDUAL" 
                      ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg" 
                      : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md"
                  }`}>
                    <input
                      type="radio"
                      value="INDIVIDUAL"
                      {...register("registrationType")}
                      className="sr-only"
                      onChange={(e) => {
                        setRegistrationType(e.target.value as "INDIVIDUAL" | "FIRM");
                        register("registrationType").onChange(e);
                      }}
                    />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                      watchedRegistrationType === "INDIVIDUAL"
                        ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600"
                    }`}>
                      <User className="w-8 h-8" />
                    </div>
                    <span className={`text-base font-bold ${
                      watchedRegistrationType === "INDIVIDUAL" ? "text-primary-700" : "text-gray-700"
                    }`}>
                      Individual Registration
                    </span>
                    {watchedRegistrationType === "INDIVIDUAL" && (
                      <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-primary-600" />
                    )}
                  </label>
                  <label className={`group relative flex flex-col items-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    watchedRegistrationType === "FIRM" 
                      ? "border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg" 
                      : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md"
                  }`}>
                    <input
                      type="radio"
                      value="FIRM"
                      {...register("registrationType")}
                      className="sr-only"
                      onChange={(e) => {
                        setRegistrationType(e.target.value as "INDIVIDUAL" | "FIRM");
                        register("registrationType").onChange(e);
                      }}
                    />
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all ${
                      watchedRegistrationType === "FIRM"
                        ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600"
                    }`}>
                      <Building2 className="w-8 h-8" />
                    </div>
                    <span className={`text-base font-bold ${
                      watchedRegistrationType === "FIRM" ? "text-primary-700" : "text-gray-700"
                    }`}>
                      Firm Registration
                    </span>
                    {watchedRegistrationType === "FIRM" && (
                      <CheckCircle2 className="absolute top-3 right-3 w-6 h-6 text-primary-600" />
                    )}
                  </label>
                </div>
                {errors.registrationType && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">⚠</span> {errors.registrationType.message}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-4">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                  I want to *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { value: "BUYER", label: "Buy Tractors", icon: ShoppingCart, color: "from-blue-500 to-blue-600" },
                    { value: "SELLER", label: "Sell Tractors", icon: Truck, color: "from-green-500 to-green-600" },
                    { value: "DEALER", label: "Buy & Sell", icon: Briefcase, color: "from-purple-500 to-purple-600" },
                  ].map((role) => {
                    const Icon = role.icon;
                    const isSelected = watchedRole === role.value;
                    return (
                      <label
                        key={role.value}
                        className={`group relative flex flex-col items-center p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          isSelected
                            ? `border-primary-500 bg-gradient-to-br ${role.color} text-white shadow-lg`
                            : "border-gray-200 bg-white hover:border-primary-300 hover:shadow-md"
                        }`}
                      >
                        <input
                          type="radio"
                          value={role.value}
                          {...register("role")}
                          className="sr-only"
                        />
                        <Icon className={`w-8 h-8 mb-2 ${isSelected ? "text-white" : "text-gray-400 group-hover:text-primary-600"}`} />
                        <span className={`text-sm font-semibold text-center ${isSelected ? "text-white" : "text-gray-700"}`}>
                          {role.label}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="absolute top-2 right-2 w-5 h-5 text-white" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-6 h-6 text-primary-600" />
                  Personal Information
                </h3>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <User className="w-4 h-4 text-primary-600" />
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register("fullName")}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="Enter your full name"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.fullName.message}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Phone className="w-4 h-4 text-primary-600" />
                    Phone Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register("phoneNumber")}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="10-digit mobile number"
                      maxLength={10}
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MessageCircle className="w-4 h-4 text-primary-600" />
                    WhatsApp Number *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      {...register("whatsappNumber")}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="10-digit WhatsApp number"
                      maxLength={10}
                    />
                    <MessageCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.whatsappNumber && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.whatsappNumber.message}
                    </p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Mail className="w-4 h-4 text-primary-600" />
                    Email Address <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      {...register("email")}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="your.email@example.com"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.email.message}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Get notifications about vehicles, auctions, and bids
                  </p>
                </div>

                {/* GST Number (Conditional - Only for Firm Registration) */}
                {watchedRegistrationType === "FIRM" && (
                  <div className="space-y-2 animate-in slide-in-from-top duration-300">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <FileText className="w-4 h-4 text-primary-600" />
                      GST Number <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        {...register("gstNumber")}
                        className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base uppercase"
                        placeholder="15-digit GST Number"
                        maxLength={15}
                        style={{ textTransform: "uppercase" }}
                      />
                      <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors.gstNumber && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.gstNumber.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Enter your 15-digit GST Number if available
                    </p>
                  </div>
                )}
              </div>

              {/* Address Information Section */}
              <div className="space-y-6 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-6 h-6 text-primary-600" />
                  Address Information
                </h3>

                {/* Address */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <MapPin className="w-4 h-4 text-primary-600" />
                    Complete Address *
                  </label>
                  <textarea
                    {...register("address")}
                    rows={3}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base resize-none"
                    placeholder="Enter your complete address"
                  />
                  {errors.address && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <span>⚠</span> {errors.address.message}
                    </p>
                  )}
                </div>

                {/* City, District */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      City *
                    </label>
                    <input
                      type="text"
                      {...register("city")}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="Enter city"
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.city.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      District *
                    </label>
                    <input
                      type="text"
                      {...register("district")}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="Enter district"
                    />
                    {errors.district && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.district.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      State *
                    </label>
                    <select
                      {...register("state")}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                    >
                      <option value="">Select State</option>
                      {indianStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.state.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-4 h-4 text-primary-600" />
                      Pincode *
                    </label>
                    <input
                      type="text"
                      {...register("pincode")}
                      className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base"
                      placeholder="6-digit pincode"
                      maxLength={6}
                    />
                    {errors.pincode && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <span>⚠</span> {errors.pincode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full group relative bg-gradient-to-r from-primary-600 via-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Registering...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-700 via-purple-700 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                <p className="mt-4 text-center text-sm text-gray-600">
                  By registering, you agree to our Terms & Conditions
                </p>
              </div>
            </form>

            {/* Login Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors">
                  Sign In
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
