"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EnhancedMembershipBanner from "@/components/membership/EnhancedMembershipBanner";
import ChatWidget from "@/components/chat/ChatWidget";
import { Toaster } from "react-hot-toast";

function AppContent({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="container mx-auto max-w-6xl px-4 pt-4">
        <EnhancedMembershipBanner />
      </div>
      <main className="min-h-screen">{children}</main>
      <Footer />
      <ChatWidget />
      <Toaster position="top-right" />
    </>
  );
}

export default function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppContent>{children}</AppContent>
    </ThemeProvider>
  );
}

