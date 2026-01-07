"use client";

import { UserPlus, Search, Gavel, CheckCircle, PlayCircle } from "lucide-react";
import Link from "next/link";
import AnimatedTutorial from "@/components/tutorial/AnimatedTutorial";

export default function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "Register as Buyer or Seller",
      description: "Create an account with quick verification process. Choose your role and complete your profile with all necessary details.",
      step: "01",
    },
    {
      icon: Search,
      title: "Browse Auctions",
      description: "Explore live and upcoming auctions across multiple locations. View detailed vehicle information, photos, and specifications.",
      step: "02",
    },
    {
      icon: Gavel,
      title: "Place Your Bids",
      description: "Bid on vehicles through our secure and dedicated tractor auction online platform. Real-time updates keep you informed.",
      step: "03",
    },
    {
      icon: CheckCircle,
      title: "Win and Close the Deal",
      description: "Complete documentation and take delivery of your vehicle. Our team assists with all legal and transfer processes.",
      step: "04",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">How It Works</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Get started with our simple 4-step process to buy or sell tractors through our auction platform.
          </p>
        </div>

        {/* Animated Tutorial Video */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full mb-4">
              <PlayCircle className="w-5 h-5" />
              <span className="font-semibold">Interactive Tutorial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Watch How It Works
            </h2>
            <p className="text-gray-600">
              Click play to see an animated walkthrough of our platform
            </p>
          </div>
          <AnimatedTutorial />
        </div>

        {/* Step-by-Step Guide (Static) */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">Step-by-Step Guide</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 relative hover:shadow-xl transition-shadow">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary-100">
                    {step.step}
                  </div>
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Auction Process Details</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">For Sellers:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Register and create your seller account</li>
                <li>Upload vehicle details and photos</li>
                <li>Choose between Auction or Pre-approved sale</li>
                <li>Admin verifies your listing</li>
                <li>Your vehicle goes live for bidding</li>
                <li>Approve or reject the highest bid</li>
                <li>Complete the sale and transfer process</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">For Buyers:</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Register and activate your buyer account</li>
                <li>Choose a membership plan (15-day free trial available)</li>
                <li>Browse available vehicles in auctions or pre-approved listings</li>
                <li>Review vehicle details, photos, and inspection reports</li>
                <li>Place bids during live auctions</li>
                <li>Win the auction and wait for seller approval</li>
                <li>Complete payment and take delivery</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/register"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  );
}
