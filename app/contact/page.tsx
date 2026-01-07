"use client";

import { useState, useEffect } from "react";
import { Phone, Mail, Globe, MessageCircle, Facebook, Instagram, Youtube, MapPin, UserPlus, Search, Gavel, CheckCircle, Shield, TrendingUp, Users, FileCheck, Headphones, BarChart, HelpCircle, ChevronDown, ChevronUp, ArrowRight, Clock, Calendar, AlertCircle, Save } from "lucide-react";
import XIcon from "@/components/icons/XIcon";
import Link from "next/link";
import { socialMediaLinks } from "@/lib/social-media";
import { useDraftSave } from "@/hooks/useDraftSave";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [subjectRegarding, setSubjectRegarding] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDraftIndicator, setShowDraftIndicator] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Prepare draft data
  const draftData = {
    name,
    phone,
    email,
    subjectRegarding,
    subject,
    message,
  };

  // Draft saving hook
  const { clearDraft, hasDraft } = useDraftSave({
    storageKey: "contact-form-draft",
    data: draftData,
    enabled: true,
    debounceMs: 1500,
    onLoad: (draft: any) => {
      if (draft.name) setName(draft.name);
      if (draft.phone) setPhone(draft.phone);
      if (draft.email) setEmail(draft.email);
      if (draft.subjectRegarding) setSubjectRegarding(draft.subjectRegarding);
      if (draft.subject) setSubject(draft.subject);
      if (draft.message) setMessage(draft.message);
      toast.success("Draft restored!", { duration: 3000 });
    },
  });

  // Check for draft only on client side to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    // Check if draft exists after component mounts (client-side only)
    if (hasDraft()) {
      setShowDraftIndicator(true);
    }
  }, [hasDraft]);

  // Update draft indicator when form data changes
  useEffect(() => {
    if (isMounted) {
      const hasContent = name || phone || email || subject || message || subjectRegarding;
      if (hasContent) {
        // Check after a short delay to allow draft to be saved
        const timer = setTimeout(() => {
          if (hasDraft()) {
            setShowDraftIndicator(true);
          }
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        setShowDraftIndicator(false);
      }
    }
  }, [name, phone, email, subject, message, subjectRegarding, isMounted, hasDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          subjectRegarding,
          subject,
          message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        clearDraft();
        toast.success("Message sent successfully!");
        // Reset form
        setName("");
        setPhone("");
        setEmail("");
        setSubjectRegarding("");
        setSubject("");
        setMessage("");
      } else {
        toast.error(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Contact form error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I register on the platform?",
      answer: "You can register by clicking on the 'Register' button in the header. Fill in your details including name, phone number, WhatsApp number, address, and choose your role (Buyer or Seller). You'll receive an OTP for verification to complete the registration process."
    },
    {
      question: "What membership plans are available?",
      answer: "We offer a 15-day free trial, followed by three paid membership plans: Silver (₹2,000 for 30 days), Gold (₹5,000 for 180 days), and Diamond (₹9,000 for 365 days). Each plan offers different benefits and access levels."
    },
    {
      question: "How does the auction process work?",
      answer: "Sellers list their vehicles, which are verified by our admin team. Once approved, vehicles go live for auction. Buyers can browse and place bids during live auctions. The highest bidder wins, subject to seller approval. Our platform provides real-time updates on all bids."
    },
    {
      question: "What is the difference between Auction and Pre-approved sale?",
      answer: "Auction sales allow multiple buyers to bid on a vehicle, with the highest bid winning. Pre-approved sales have a fixed price, and buyers can purchase directly without bidding. Both options are available for sellers to choose from."
    },
    {
      question: "How do I place a bid?",
      answer: "First, ensure you have an active membership. Browse live auctions, select a vehicle you're interested in, and click 'Bid Now'. Enter your bid amount (must be higher than the current bid and meet minimum increment requirements). Confirm your bid to participate."
    },
    {
      question: "What happens after I win an auction?",
      answer: "After winning an auction, the seller reviews your bid and can approve or reject it. If approved, you'll be notified and can proceed with payment and documentation. Our team assists with the complete transfer process."
    },
    {
      question: "How do I list my vehicle for sale?",
      answer: "Log in to your seller account, go to 'My Account' → 'Sell' tab, and click 'List New Vehicle'. Fill in all vehicle details, upload photos, choose between Auction or Pre-approved sale, set your price, and submit. Our admin team will verify and approve your listing."
    },
    {
      question: "What documents do I need to sell a vehicle?",
      answer: "You'll need the vehicle's RC (Registration Certificate), insurance documents, engine and chassis numbers, and any finance/NOC papers if applicable. Our team will guide you through the complete documentation process."
    },
    {
      question: "Is my personal information secure?",
      answer: "Yes, we use bank-grade encryption and security measures to protect all your personal and financial information. Your data is never shared with third parties without your consent."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept various payment methods including bank transfers, UPI, and other secure payment gateways. Payment details are provided after bid approval or direct purchase confirmation."
    },
    {
      question: "Can I cancel my bid?",
      answer: "Bids are binding once placed. However, if you have a valid reason, you can contact our support team within 24 hours of placing the bid. Cancellation is subject to review and approval."
    },
    {
      question: "How do I contact customer support?",
      answer: "You can reach us via phone at 7801094747, email at contact@tractorauction.in, or through our live chat feature. Our support team is available 24/7 to assist you with any queries or issues."
    }
  ];

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

  const features = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Bank-grade security for all your bidding and payment transactions. Your data and money are protected with industry-leading encryption.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Bidding",
      description: "Live auction updates with instant bid notifications. Never miss an opportunity with real-time updates on your favorite vehicles.",
    },
    {
      icon: BarChart,
      title: "Market Insights",
      description: "Access to market trends and vehicle pricing data. Make informed decisions with comprehensive market analytics.",
    },
    {
      icon: Users,
      title: "Verified Buyers",
      description: "Join a network of trusted and verified partners. All users go through a verification process for your peace of mind.",
    },
    {
      icon: FileCheck,
      title: "Complete Documentation",
      description: "Vehicle history and legal documentation support. We assist with all paperwork and transfer processes.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      description: "Dedicated support team to assist you throughout the process. Get help whenever you need it, day or night.",
    },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Navigation Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <MessageCircle className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                Contact & Information
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Get in touch with us or learn more about our platform
              </p>
            </div>
          </div>
          
          {/* Quick Navigation Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => scrollToSection("contact-us")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Contact Us</span>
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Gavel className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => scrollToSection("why-choose-us")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Why Choose Us</span>
            </button>
            <button
              onClick={() => scrollToSection("faqs")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-5 py-2.5 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>FAQs</span>
            </button>
            <Link
              href="/register"
              className="group flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <ArrowRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Get Started Now</span>
            </Link>
          </div>
        </div>

        {/* Contact Us Section */}
        <div id="contact-us" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Contact Us</h2>
              <p className="text-sm text-gray-600">Get in touch with our team for any queries or support</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Contact Information */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                  <Phone className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Phone</h4>
                    <a
                      href="tel:+917801094747"
                      className="text-primary-600 hover:underline text-lg font-bold cursor-pointer transition-all hover:text-primary-700"
                      title="Click to call 7801094747"
                    >
                      7801094747
                    </a>
                  </div>
                </div>

                <div className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                  <Mail className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Email</h4>
                    <a
                      href="mailto:contact@tractorauction.in"
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      contact@tractorauction.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                  <Globe className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Website</h4>
                    <a
                      href="https://www.tractorauction.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline font-semibold"
                    >
                      www.tractorauction.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start bg-white rounded-lg p-4 border border-gray-200">
                  <MapPin className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Address</h4>
                    <p className="text-gray-700 font-medium">
                      Sreeraama Automotive, Talluru, Kakinada, Andhra Pradesh. Pin Code - 533435
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="font-semibold mb-4">Follow Us</h3>
                <div className="flex flex-wrap gap-4">
                  <a
                    href={socialMediaLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </a>
                  <a
                    href={socialMediaLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                    aria-label="Facebook"
                    title="Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                  </a>
                  <a
                    href={socialMediaLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-pink-600 to-pink-700 text-white rounded-full flex items-center justify-center hover:from-pink-700 hover:to-pink-800 transition-all shadow-md hover:shadow-lg"
                    aria-label="Instagram"
                    title="Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </a>
                  <a
                    href={socialMediaLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full flex items-center justify-center hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
                    aria-label="YouTube"
                    title="YouTube"
                  >
                    <Youtube className="w-6 h-6" />
                  </a>
                  <a
                    href={socialMediaLinks.x}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gradient-to-r from-gray-800 to-black text-white rounded-full flex items-center justify-center hover:from-gray-900 hover:to-black transition-all shadow-md hover:shadow-lg"
                    aria-label="X"
                    title="X (formerly Twitter)"
                  >
                    <XIcon className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Send us a Message</h3>
                {isMounted && showDraftIndicator && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">Draft saved</span>
                  </div>
                )}
              </div>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject Regarding *
                  </label>
                  <select
                    value={subjectRegarding}
                    onChange={(e) => setSubjectRegarding(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-gray-900"
                    required
                  >
                    <option value="">Select Subject Regarding</option>
                    <option value="Help">Help</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Complaint">Complaint</option>
                    <option value="Appreciation">Appreciation</option>
                    <option value="Auction">Auction</option>
                    <option value="Preapproved">Preapproved</option>
                    <option value="My Account">My Account</option>
                    <option value="Membership">Membership</option>
                    <option value="Refunds if any">Refunds if any</option>
                    <option value="Payments">Payments</option>
                    <option value="Documents">Documents</option>
                    <option value="Wrong content in this Website">Wrong content in this Website</option>
                    <option value="Website Performance">Website Performance</option>
                    <option value="Call Back">Call Back</option>
                    <option value="Security Concern">Security Concern</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    placeholder="Enter subject details"
                    required
                  />
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3.5 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

          {/* Business Hours - Enhanced */}
          <div className="bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-xl p-6 sm:p-8 border-2 border-primary-200 shadow-lg relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-200/20 rounded-full blur-2xl -z-0"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/20 rounded-full blur-xl -z-0"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-700 bg-clip-text text-transparent">
                  Business Hours
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Regular Business Hours */}
                <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-primary-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary-100/30 rounded-full blur-xl -z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg">
                        <Calendar className="w-5 h-5 text-primary-700" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Office Hours</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-lg border border-primary-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="font-semibold text-gray-900">Monday - Friday</span>
                        </div>
                        <span className="font-bold text-primary-700 text-sm sm:text-base">9:00 AM - 6:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-transparent rounded-lg border border-primary-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="font-semibold text-gray-900">Saturday</span>
                        </div>
                        <span className="font-bold text-primary-700 text-sm sm:text-base">9:00 AM - 4:00 PM</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="font-semibold text-gray-700">Sunday</span>
                        </div>
                        <span className="font-bold text-gray-500 text-sm sm:text-base">Closed</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support & Emergency */}
                <div className="bg-white rounded-xl p-5 sm:p-6 border-2 border-green-100 shadow-md hover:shadow-lg transition-all duration-300 hover:border-green-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-green-100/30 rounded-full blur-xl -z-0"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                        <Headphones className="w-5 h-5 text-green-700" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Support & Emergency</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="font-bold text-green-800 text-sm">24/7 Support Available</span>
                        </div>
                        <p className="text-sm text-gray-700 ml-6">Via phone and email</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <span className="font-bold text-red-800">Emergency Contact</span>
                        </div>
                        <a
                          href="tel:+917801094747"
                          className="text-lg sm:text-xl font-extrabold text-red-700 hover:text-red-800 hover:underline transition-all ml-6 flex items-center gap-2 group"
                          title="Click to call 7801094747"
                        >
                          <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>7801094747</span>
                        </a>
                        <p className="text-xs text-gray-600 ml-6 mt-1">Available anytime</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-6 pt-6 border-t border-primary-200">
                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-primary-200 shadow-sm">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-gray-700">Quick Response</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-primary-200 shadow-sm">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-semibold text-gray-700">Secure Communication</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-primary-200 shadow-sm">
                    <MessageCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-semibold text-gray-700">Multiple Channels</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div id="how-it-works" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
              <Gavel className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="text-sm text-gray-600">Simple steps to buy or sell tractors through our auction platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200 relative hover:shadow-lg transition-shadow">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary-100">
                    {step.step}
                  </div>
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-md">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Information */}
          <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-xl font-bold mb-6">Auction Process Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">For Sellers:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Register and create your seller account</li>
                  <li>Upload vehicle details and photos</li>
                  <li>Choose between Auction or Pre-approved sale</li>
                  <li>Admin verifies your listing</li>
                  <li>Your vehicle goes live for bidding</li>
                  <li>Approve or reject the highest bid</li>
                  <li>Complete the sale and transfer process</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-5 border border-gray-200">
                <h4 className="font-bold text-lg mb-3 text-gray-900">For Buyers:</h4>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
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

          <div className="text-center mt-8">
            <Link
              href="/register"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
            >
              <ArrowRight className="w-5 h-5" />
              <span>Get Started Now</span>
            </Link>
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div id="why-choose-us" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Us</h2>
              <p className="text-sm text-gray-600">India's most trusted platform for tractor auctions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full flex items-center justify-center shadow-md">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-700">{feature.description}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Benefits */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-bold mb-6">Additional Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-lg">Transparent Process</h4>
                <p className="text-primary-100">
                  Complete transparency in bidding, pricing, and vehicle information. No hidden charges or surprises.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-lg">Wide Selection</h4>
                <p className="text-primary-100">
                  Access to thousands of vehicles across India. From used tractors to harvesters and scrap vehicles.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-lg">Flexible Membership</h4>
                <p className="text-primary-100">
                  Start with a 15-day free trial, then choose from Silver, Gold, or Diamond membership plans.
                </p>
              </div>
              <div className="bg-white/10 rounded-lg p-5 backdrop-blur-sm">
                <h4 className="font-bold mb-2 text-lg">Expert Assistance</h4>
                <p className="text-primary-100">
                  Our team of experts helps you with vehicle inspection, valuation, and legal documentation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs Section */}
        <div id="faqs" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-lg">
              <HelpCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-600">Find answers to common questions about our platform</p>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-white/50 transition-colors"
                >
                  <span className="font-bold text-gray-900 pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Get Started Now Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-8 mb-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of buyers and sellers on India's #1 tractor auction platform. Start your journey today!
          </p>
          <Link
            href="/register"
            className="inline-flex items-center space-x-3 bg-white text-primary-700 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
          >
            <ArrowRight className="w-6 h-6" />
            <span>Get Started Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
