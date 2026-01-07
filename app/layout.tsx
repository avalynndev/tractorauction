import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EnhancedMembershipBanner from "@/components/membership/EnhancedMembershipBanner";
import ChatWidget from "@/components/chat/ChatWidget";
import DiamondUpgradeProvider from "@/components/membership/DiamondUpgradeProvider";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "@/components/navigation/ScrollToTop";
import LanguageProviderWrapper from "@/components/providers/LanguageProviderWrapper";
import FontLoader from "@/components/providers/FontLoader";
import ZoomProvider from "@/components/providers/ZoomProvider";
import ErrorBoundary from "@/components/errors/ErrorBoundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tractor Auction - Buy & Sell Used Tractors",
  description: "India's premier platform for auctioning used tractors, harvesters, and scrap tractors. Join thousands of buyers and sellers in India's most trusted tractor marketplace.",
  keywords: ["tractor auction", "used tractors", "tractor marketplace", "farm equipment", "tractor sales", "harvester auction", "India tractors"],
  authors: [{ name: "Tractor Auction" }],
  creator: "Tractor Auction",
  publisher: "Tractor Auction",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.tractorauction.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Tractor Auction - Buy & Sell Used Tractors",
    description: "India's premier platform for auctioning used tractors, harvesters, and scrap tractors",
    url: "https://www.tractorauction.in",
    siteName: "Tractor Auction",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tractor Auction - Buy & Sell Used Tractors",
    description: "India's premier platform for auctioning used tractors, harvesters, and scrap tractors",
    creator: "@TractorAuction",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ZoomProvider />
          <FontLoader />
          <LanguageProviderWrapper>
            <Header />
            <div className="container mx-auto max-w-6xl px-4 pt-4">
              <EnhancedMembershipBanner />
            </div>
            <main className="min-h-screen">{children}</main>
            <Footer />
            <ChatWidget />
            <ScrollToTop />
            <DiamondUpgradeProvider />
            <Toaster position="top-right" />
          </LanguageProviderWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}


