import Link from "next/link";
import { Phone, Mail, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-auto relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-16 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-6">
          {/* Company Info - Matching Header Size */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">TA</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-lg sm:text-xl leading-tight">
                    Tractor Auction
                  </span>
                  <span className="text-yellow-300 text-xs hidden sm:block">
                    Buy & Sell Tractors
                  </span>
                </div>
              </div>
            </div>
            <p className="text-gray-200 text-base sm:text-lg leading-relaxed font-medium">
              India&apos;s premier platform for auctioning used tractors, harvesters, and scrap tractors.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-6 text-yellow-300 border-b border-yellow-300/30 pb-2">Quick Links</h3>
            <ul className="space-y-3 text-base sm:text-lg">
              <li>
                <Link href="/" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/auctions" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Auctions
                </Link>
              </li>
              <li>
                <Link href="/preapproved" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Pre-Approved
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Information */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-6 text-yellow-300 border-b border-yellow-300/30 pb-2">Information</h3>
            <ul className="space-y-3 text-base sm:text-lg">
              <li>
                <Link href="/contact" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/why-choose-us" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Why Choose Us
                </Link>
              </li>
              <li>
                <Link href="/policy" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline flex items-center">
                  <span className="w-2 h-2 bg-yellow-300 rounded-full mr-2"></span>
                  Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg sm:text-xl mb-6 text-yellow-300 border-b border-yellow-300/30 pb-2">Contact Us</h3>
            <ul className="space-y-4 text-base sm:text-lg mb-6">
              <li className="flex items-center group">
                <div className="p-2.5 bg-primary-600/40 rounded-lg mr-3 group-hover:bg-primary-600/60 transition-all flex-shrink-0">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                </div>
                <a href="tel:7801094747" className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline">
                  7801094747
                </a>
              </li>
              <li className="flex items-center group">
                <div className="p-2.5 bg-primary-600/40 rounded-lg mr-3 group-hover:bg-primary-600/60 transition-all flex-shrink-0">
                  <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                </div>
                <a
                  href="mailto:contact@tractorauction.in"
                  className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  contact@tractorauction.in
                </a>
              </li>
              <li className="flex items-center group">
                <div className="p-2.5 bg-primary-600/40 rounded-lg mr-3 group-hover:bg-primary-600/60 transition-all flex-shrink-0">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-300" />
                </div>
                <a
                  href="https://www.tractorauction.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-200 hover:text-yellow-300 transition-colors font-semibold hover:underline"
                >
                  www.tractorauction.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700/50 mt-12 pt-8 text-center">
          <p className="text-gray-300 text-base sm:text-lg font-semibold">
            &copy; {new Date().getFullYear()} Tractor Auction. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


