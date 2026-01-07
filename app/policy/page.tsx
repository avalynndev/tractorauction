"use client";

import { useState } from "react";
import { FileText, Scale, Shield, Truck, Gavel, ChevronDown, ChevronUp } from "lucide-react";

export default function PolicyPage() {
  const [openSection, setOpenSection] = useState<string | null>("terms");

  const scrollToSection = (id: string) => {
    setOpenSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const companyDetails = {
    name: "Sreeraama Automotive",
    domain: "www.tractorauction.com",
    email: "contact@tractorauction.in",
    phone: "+91-7801094747",
    address: "Sreeraama Automotive, Talluru, Kakinada, Andhra Pradesh. Pin Code - 533435",
    gst: "37AGLPH3759Q2ZG",
    jurisdiction: "Governed by the laws of India, disputes arising under exclusive jurisdiction of the courts in Kakinada, Andhra Pradesh"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header with Navigation Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                Policies & Legal Information
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Important policies and terms for using our platform
              </p>
            </div>
          </div>
          
          {/* Quick Navigation Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => scrollToSection("terms")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Scale className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Terms & Conditions</span>
            </button>
            <button
              onClick={() => scrollToSection("privacy")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Privacy Policy</span>
            </button>
            <button
              onClick={() => scrollToSection("cancellation")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white px-5 py-2.5 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Cancellation & Refund</span>
            </button>
            <button
              onClick={() => scrollToSection("shipping")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Truck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Shipping Policy</span>
            </button>
            <button
              onClick={() => scrollToSection("bidder-terms")}
              className="group flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-5 py-2.5 rounded-lg hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
            >
              <Gavel className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Bidder Terms</span>
            </button>
          </div>
        </div>

        {/* Terms & Conditions Section */}
        <div id="terms" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Terms & Conditions</h2>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">1. Acceptance of Terms</h3>
              <p className="leading-relaxed">
                By accessing and using {companyDetails.domain} (the "Website"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">2. Company Information</h3>
              <ul className="space-y-2 leading-relaxed">
                <li><strong>Company Name:</strong> {companyDetails.name}</li>
                <li><strong>Website:</strong> {companyDetails.domain}</li>
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone} (24/7 Support)</li>
                <li><strong>Address:</strong> {companyDetails.address}</li>
                <li><strong>GST Number:</strong> {companyDetails.gst}</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">3. User Accounts</h3>
              <p className="leading-relaxed mb-3">
                To participate in auctions or list vehicles, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">4. Auction Process</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>All bids are binding and cannot be withdrawn once placed</li>
                <li>The highest bidder wins, subject to seller approval</li>
                <li>We reserve the right to cancel or modify auctions at any time</li>
                <li>Vehicle descriptions are provided by sellers; we verify but do not guarantee accuracy</li>
                <li>Inspection of vehicles is recommended before final purchase</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">5. Payment Terms</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Payment must be completed within the specified timeframe after bid acceptance</li>
                <li>We accept various payment methods including bank transfers, UPI, and other secure payment gateways</li>
                <li>All prices are in Indian Rupees (INR)</li>
                <li>Additional charges may apply for documentation, transfer, and delivery</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">6. Vehicle Information</h3>
              <p className="leading-relaxed mb-3">
                Sellers are responsible for providing accurate vehicle information. While we verify listings, buyers should:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Conduct their own inspection before purchase</li>
                <li>Verify all documents and vehicle history</li>
                <li>Confirm vehicle condition matches the description</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">7. Prohibited Activities</h3>
              <p className="leading-relaxed mb-3">Users are prohibited from:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manipulating auction prices or engaging in fraudulent bidding</li>
                <li>Posting false or misleading information</li>
                <li>Using automated systems to place bids</li>
                <li>Violating any applicable laws or regulations</li>
                <li>Harassing or threatening other users</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">8. Limitation of Liability</h3>
              <p className="leading-relaxed">
                {companyDetails.name} acts as an intermediary platform. We are not responsible for the quality, condition, or legality of vehicles listed. We do not guarantee the accuracy of vehicle descriptions or the performance of any transaction. Our liability is limited to the membership fees paid by users.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">9. Intellectual Property</h3>
              <p className="leading-relaxed">
                All content on this website, including logos, text, graphics, and software, is the property of {companyDetails.name} and is protected by Indian copyright and trademark laws.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">10. Modifications to Terms</h3>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the new terms.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">11. Governing Law & Jurisdiction</h3>
              <p className="leading-relaxed font-semibold text-gray-900">
                {companyDetails.jurisdiction}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Section */}
        <div id="privacy" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Privacy Policy</h2>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">1. Information We Collect</h3>
              <p className="leading-relaxed mb-3">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Personal Information:</strong> Name, phone number, email, address, city, district, state, pincode</li>
                <li><strong>Account Information:</strong> Login credentials, membership details, payment information</li>
                <li><strong>Transaction Information:</strong> Bidding history, purchase records, vehicle listings</li>
                <li><strong>Technical Information:</strong> IP address, browser type, device information, usage patterns</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">2. How We Use Your Information</h3>
              <p className="leading-relaxed mb-3">We use collected information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and manage your account and transactions</li>
                <li>Facilitate auctions and vehicle listings</li>
                <li>Send important notifications about auctions, bids, and account activity</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and ensure platform security</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">3. Information Sharing</h3>
              <p className="leading-relaxed mb-3">We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Sellers/Buyers:</strong> Basic contact information for transaction purposes</li>
                <li><strong>Service Providers:</strong> Payment processors, hosting services, analytics providers</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">4. Data Security</h3>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your information, including encryption, secure servers, and access controls. However, no method of transmission over the internet is 100% secure.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">5. Cookies and Tracking</h3>
              <p className="leading-relaxed mb-3">We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Remember your preferences and settings</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized content and advertisements</li>
                <li>Ensure website functionality</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">6. Your Rights</h3>
              <p className="leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and review your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your account and data</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">7. Data Retention</h3>
              <p className="leading-relaxed">
                We retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Account information is retained until account deletion is requested.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">8. Children's Privacy</h3>
              <p className="leading-relaxed">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect information from children.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">9. Contact Us</h3>
              <p className="leading-relaxed mb-3">For privacy-related inquiries, contact us at:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone}</li>
                <li><strong>Address:</strong> {companyDetails.address}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cancellation & Refund Policy Section */}
        <div id="cancellation" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Cancellation & Refund Policy</h2>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">1. Auction Bid Cancellation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Bids placed during live auctions are generally binding and cannot be cancelled</li>
                <li>Cancellation requests must be submitted within 24 hours of bid placement and are subject to review</li>
                <li>Valid reasons for cancellation include technical errors, duplicate bids, or seller misrepresentation</li>
                <li>We reserve the right to approve or deny cancellation requests on a case-by-case basis</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">2. Vehicle Listing Cancellation</h3>
              <p className="leading-relaxed mb-3">Sellers may cancel vehicle listings:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Before the auction starts - No charges apply</li>
                <li>During live auction - Subject to review and may incur penalties</li>
                <li>After auction ends - Only if no bids were placed</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">3. Membership Cancellation</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Membership subscriptions can be cancelled at any time</li>
                <li>No refunds for the current billing period after cancellation</li>
                <li>Access continues until the end of the paid period</li>
                <li>Free trial memberships can be cancelled without charges</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">4. Refund Policy</h3>
              <p className="leading-relaxed mb-3"><strong>Membership Refunds:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Refunds are processed within 7-14 business days</li>
                <li>Refund eligibility depends on usage and time remaining in subscription</li>
                <li>Processing fees may be deducted from refunds</li>
              </ul>
              <p className="leading-relaxed mb-3"><strong>Transaction Refunds:</strong></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vehicle purchase refunds are subject to seller approval and terms</li>
                <li>Refunds may be issued if vehicle condition significantly differs from description</li>
                <li>All refund requests must be submitted within 7 days of delivery</li>
                <li>Refund processing time: 10-15 business days after approval</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">5. Non-Refundable Items</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Membership fees after 50% of subscription period has elapsed</li>
                <li>Processing fees and transaction charges</li>
                <li>Services already rendered or completed</li>
                <li>Vehicles with no significant defects or misrepresentation</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">6. Refund Process</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4 leading-relaxed">
                <li>Submit refund request through your account or contact support</li>
                <li>Provide reason and supporting documentation if required</li>
                <li>Our team reviews the request within 3-5 business days</li>
                <li>Approved refunds are processed to the original payment method</li>
                <li>You will receive confirmation via email once processed</li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">7. Contact for Refunds</h3>
              <p className="leading-relaxed mb-3">For cancellation and refund inquiries:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone} (24/7 Support)</li>
                <li><strong>Address:</strong> {companyDetails.address}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Shipping Policy Section */}
        <div id="shipping" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Shipping Policy</h2>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">1. Delivery Methods</h3>
              <p className="leading-relaxed mb-3">We offer the following delivery options:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Self-Pickup:</strong> Buyers can collect vehicles directly from seller location</li>
                <li><strong>Transport Service:</strong> Arranged through third-party logistics partners</li>
                <li><strong>Direct Delivery:</strong> Seller delivers directly to buyer (if agreed)</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">2. Delivery Timeline</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Delivery arrangements are made after payment confirmation</li>
                <li>Self-pickup: Within 3-5 business days of payment</li>
                <li>Transport service: 7-14 business days depending on distance</li>
                <li>Delivery dates are estimates and may vary based on location and logistics</li>
                <li>Buyers will be notified of any delays</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">3. Shipping Charges</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Shipping charges are calculated based on distance, vehicle size, and weight</li>
                <li>Charges are communicated before final payment</li>
                <li>Buyers are responsible for shipping costs unless otherwise specified</li>
                <li>Additional charges may apply for special handling or insurance</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">4. Vehicle Inspection on Delivery</h3>
              <p className="leading-relaxed mb-3">Upon delivery, buyers should:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Inspect the vehicle thoroughly before accepting delivery</li>
                <li>Verify vehicle condition matches the description</li>
                <li>Check all documents are provided</li>
                <li>Report any discrepancies immediately</li>
                <li>Sign delivery receipt only after satisfactory inspection</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">5. Risk and Ownership Transfer</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Ownership transfers to buyer upon payment completion</li>
                <li>Risk of loss or damage transfers upon delivery acceptance</li>
                <li>Buyers are advised to arrange insurance during transit</li>
                <li>We recommend using insured transport services</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">6. Delivery Locations</h3>
              <p className="leading-relaxed mb-3">We deliver across India. Delivery to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Metro cities: Standard delivery timeline applies</li>
                <li>Tier 2/3 cities: May require additional time</li>
                <li>Remote locations: Subject to logistics partner availability</li>
                <li>International shipping: Not currently available</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">7. Delivery Issues</h3>
              <p className="leading-relaxed mb-3">If you experience delivery problems:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Contact our support team immediately at {companyDetails.phone}</li>
                <li>Provide order number and delivery details</li>
                <li>Document any damage or issues with photos</li>
                <li>We will work with logistics partners to resolve issues</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">8. Documentation</h3>
              <p className="leading-relaxed mb-3">The following documents are provided with delivery:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Vehicle Registration Certificate (RC)</li>
                <li>Insurance documents (if applicable)</li>
                <li>Sale invoice and payment receipt</li>
                <li>Transfer forms and NOC (if applicable)</li>
                <li>Vehicle inspection report</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">9. Contact for Shipping</h3>
              <p className="leading-relaxed mb-3">For shipping-related inquiries:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone} (24/7 Support)</li>
                <li><strong>Address:</strong> {companyDetails.address}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bidder Terms & Conditions Section */}
        <div id="bidder-terms" className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-lg">
              <Gavel className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Bidder Terms & Conditions</h2>
              <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Introduction</h3>
              <p className="leading-relaxed mb-3">
                The Bidder Terms & Conditions ("Bidder Terms" or "Agreement") are an electronic record under the Information Technology Act, 2000 and rules made thereunder. These electronic Bidder Terms does not require any physical or digital signature.
              </p>
              <p className="leading-relaxed mb-3">
                These bidder terms is a legally binding electronic agreement between <strong>{companyDetails.name}</strong> a company incorporated under the provisions of the Companies Act, 1956, having GST # {companyDetails.gst} and its registered office at {companyDetails.address} ("Auctioneer") and the you/auction bidder, ("Bidder").
              </p>
              <p className="leading-relaxed mb-3">
                Auctioneer is an intermediary in the form of a marketplace under the name and style "{companyDetails.domain}", "tractorauction.in" and/or any other software application developed by Auctioneer for use on wireless computing devices such as smartphones and tablets and also for use on desktop or laptop computers or any other mode (Platform) which provides information technology platform for the sale-purchase of pre-owned vehicles (Services).
              </p>
              <p className="leading-relaxed mb-3">
                These Bidder Terms are published in accordance with the provisions of Rule 3 (1) of the Information Technology (Intermediaries Guidelines) Rules, 2011 that require publishing the rules and regulations, privacy policy and user terms and conditions for access or usage of the Platform.
              </p>
              <p className="leading-relaxed">
                These Bidder Terms shall apply to all the biddings at auction sales conducted by or in conjunction with Auctioneer ("Bidding"). By registering as a member on the Platform to participate in auction sales conducted through the Platform ("Auction Sale") and accepting Bidder Terms tab, you expressly agree to these Bidder Terms. Upon your acceptance, these Bidder Terms shall become binding on you. Hence, acceptance of these Bidder Terms by you is an absolute pre-condition for you to transact on the Platform and use the functionality or Services associated with the Platform. If you are not agreeable to these Bidder Terms, please do not accept these Bidder Terms and do not use the Platform for the purpose of Bidding.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">1. Definitions</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li><strong>"Agreement"</strong> shall mean these Bidder Terms, all schedules, appendices, annexures and exhibits attached to it or incorporated in it by reference and Bid Conditions to the extent applicable and shall include any amendment thereto, from time to time;</li>
                <li><strong>"Backout Fee"</strong> shall mean the amount payable by the Bidder in case of the Bidder failing to pay the Winning Bid to the Seller as per the terms of the Auction Sale plus applicable taxes thereon. Such fees shall be mentioned in the additional terms to Auction Sale;</li>
                <li><strong>"Bidder"</strong> shall mean and include any natural or legal person or entity who is a registered member of the Platform;</li>
                <li><strong>"Bidder Limit" or "Buyer Limit"</strong> shall mean the maximum outstanding permissible as a sum of: (i) The aggregate amount of all the bids outstanding in live auctions where the Bidder's bid is highest; (ii) The amount of Winning Bid(s) of the Bidder for a Vehicle(s) where the Seller is yet to approve the Winning Bid; and (iii) The amount of Winning Bid of the Bidder for Vehicles in an Auction Sale, where the Winning Bid is approved by the Seller and such amount is due and payable by the Bidder to the Seller;</li>
                <li><strong>"Registration Fee"</strong> shall mean non-refundable one-time activation fees taken at the time of registration or re-registration, as the case may be;</li>
                <li><strong>"Seller"</strong> shall mean any person/entity who transacts in the Vehicle through the Platform, being owner thereof bank, financial institution, non-banking financial company, new vehicle dealer acting as a legal owner of the Vehicle or having legal authority to sell the Vehicle by virtue of any agreement;</li>
                <li><strong>"Total Price"</strong> shall mean an amount equivalent to the Winning Bid plus applicable taxes;</li>
                <li><strong>"Vehicle(s)"</strong> shall mean the motor vehicle listed in an Auction Sale conducted through the Platform which may include cars, passenger vehicles, commercial vehicles, construction equipment vehicles, farm vehicles, two wheelers, trailers, miscellaneous salvage vehicles including without limitation used, recovered, accident-damaged and/or insurance write-off vehicles that are posted for Auction Sale on Platform;</li>
                <li><strong>"Winning Bid"</strong> shall mean the highest bid in an Auction Sale conducted through the Platform, and which is binding on the Bidder;</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">2. General</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>The Auctioneer is a marketplace which has developed a Platform enabling the registered Bidders to place their respective bids for Auction Sale of Vehicle(s) conducted through the Platform on a real time basis.</li>
                <li>Through Platform the Auctioneer inter alia facilitates and enables a Seller who wish to transact in the Vehicles on the Platform, to find prospective Bidder, who wish to buy the Vehicles transacted on the Platform through an Auction Sale.</li>
                <li>The Bidder is desirous of participating in Bidding through the Platform owned and developed by Auctioneer.</li>
                <li>Bidder acknowledges that Auctioneer owns and operates a Platform, which is essentially a marketplace to facilitate sale of Vehicle. Bidder further acknowledges that the Platform provides for bidding and auction of Vehicles, to be directly sold by the Sellers to the interested Bidders. Bidder acknowledges that Auctioneer does not and will not engage in buying and selling of Vehicles for itself and/or in its own right. Accordingly, any contract for the sale / purchase of Vehicle through this Platform is a bipartite contract between you and the Seller. Auctioneer is not a third party beneficiary under such bipartite contract.</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">3. Membership and Registration</h3>
              <p className="leading-relaxed mb-3">
                Membership (as a registered Bidder) with Auctioneer is open to all persons (a) having capacity to enter into a lawful contract under applicable laws and more specifically the Indian Contract Act, 1872; (b) in case of an individual such a person is resident of the Republic of India; and in case of an entity, the same is legally registered under the applicable laws in India; (c) who completes the registration formalities and accept the Bidder Terms; (d) is not already a registered Bidder with the Auctioneer; and (e) who has paid the requisite Registration Fee.
              </p>
              <p className="leading-relaxed mb-3">
                If you wish to become a registered Bidder and participate in Auction Sale conducted through the Platform you must (a) complete the registration formalities by providing scan copy of your PAN Card, valid existing address proof, cancelled cheque or such other document required by Auctioneer; (b) pay applicable Registration Fee of which you will be notified prior to you completing your membership application; and (c) deposit with the Auctioneer a non-interest bearing, refundable security deposit the details of which you will be advised prior to you completing your registration ("Security Deposit").
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Registration Fee:</strong> In order to register with the Auctioneer, the prospective Bidder must pay to the Auctioneer a non-refundable one time activation fee ("Registration Fee") as published at {companyDetails.domain} or such other Registration Fee as may be prescribed by Auctioneer from time to time.
              </p>
              <p className="leading-relaxed mb-3">
                Bidder shall also be liable to pay membership fee to use the facility provided through the Platform, including participation in an auction through the Platform for a period of one (1) calendar year. Bidders are advised to annually renew their membership with the Auctioneer for continuous use of the Platform and its Services by paying annual membership fee ("Membership Fee").
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Security Deposit:</strong> In order to participate in an Auction Sale a Bidder is also required to submit, a non-interest bearing refundable security deposit ("Security Deposit") of a minimum amount of Rs. 10,000/- (Rupees Ten Thousand only). The Security Deposit so deposited by the Bidder will be refunded to the respective Bidder upon expiry or earlier termination of these Bidder Term or on the instructions of the Bidder after adjusting any charge, fee, dues, any outstanding amount, claims or any recovery including but not limited to Membership Fee payable by Bidder to the Auctioneer or Seller in accordance with the terms hereof.
              </p>
              <p className="leading-relaxed">
                Upon successful completion of the registration process and payment of requisite Registration Fee, Membership Fee and Security Deposit to the Auctioneer and completion of KYC documentation, the Auctioneer will provide a distinct user id and password to the Bidder for accessing the Bidder's account ("Bidder Account") on the Platform.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">4. Auction Conditions</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Bidder shall refer to specific bidding conditions as prescribed along with respective Auction Sale before submitting any bid.</li>
                <li>Bidder acknowledges that the Seller in its sole and absolute discretion reserves the right to reject, cancel, modify or void bids for any reason whatsoever, without assigning any reason. Seller also reserves the right to reject any and all the bids or to accept a bid which is not the highest bid amount in any Auction Sale conducted through the Platform.</li>
                <li>Seller or Auctioneer may, in its sole and absolute discretion and with or without notice, postpone or cancel an Auction Sale or withdraw a Vehicle from Auction Sale, at any time and stage of the Auction Sale.</li>
                <li>Unless permitted to modify or cancel within the bid time, once submitted, your bid shall be final, irrevocable and binding on you. Subject to other terms herein, upon acceptance by the Seller, the Winning Bid shall become a legally binding contract between you and the Seller.</li>
                <li>In the event that an Auction Sale is cancelled after the Bidder has remitted the Total Price, the sole and exclusive remedy available to the Bidder shall be to claim the refund of Total Price remitted to the Seller's account.</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">5. Payment of Winning Bid</h3>
              <p className="leading-relaxed mb-3">
                Upon the Seller's communication of its acceptance of the Bidder's Winning Bid for an Auction Sale, the Bidder shall pay to the Seller the Total Price within the time period stipulated in the terms of Auction Sale. In the absence of any specific period mentioned in the Auction Sale, the Bidder shall pay the Total Price to the Seller within three (3) working days from receipt of confirmation/Winning Bid acceptance from the Seller.
              </p>
              <p className="leading-relaxed mb-3">
                For avoidance of doubt, it is clarified that upon acceptance of the Winning Bid by the Seller, the respective Bidder of the Winning Bid shall pay an amount equivalent to the Total Price in the manner as mentioned above and such Bidder will not be allowed to rescind the Winning Bid for any reason whatsoever. In the event of a Bidder's failure to make the payment of Total Price to the Seller as per the terms of the Auction Sale or these Bidder Terms, the same shall be treated as material breach of this Bidder Terms and respective terms and conditions of the Auction Sale and Auctioneer and/or Seller shall have right to initiate appropriate legal proceedings against the Bidder.
              </p>
              <p className="leading-relaxed">
                In the event of a Bidder's failure to make payment for Total Price to the Seller within the stipulated time, Bidder agrees that the Auctioneer or Seller may in their sole and absolute discretion without any liability to do so, cancel the Winning Bid and offer the relevant Vehicle for re-sale without any notice to the Bidder. In such case, Bidder shall, without prejudice to Auctioneer or Seller other rights and remedies, be liable for payment of the applicable listing fee or cost incurred by Seller or Auctioneer for re-sale of the Vehicle.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">6. Transaction Fee</h3>
              <p className="leading-relaxed">
                The Bidder shall pay to the Auctioneer a transaction fee for every Auction Sale ("Transaction Fee"). Such Transaction Fee shall be due and payable only upon successfully winning an auction. Bidder agrees to pay Transaction Fee immediately upon the confirmation by the Seller of the acceptance of Bidder's Winning Bid. The Transaction Fee for each Auction Sale and Vehicle may differ and the same shall be notified on the Platform or as part of additional terms of respective Auction Sale. In the absence of any specific Transaction Fee mentioned for a particular Auction Sale, a standard Transaction Fee equivalent to 4.00% of the Winning Bid shall be payable by the Bidder to the Auctioneer. Transaction Fee shall be exclusive of applicable taxes.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">7. Disclaimers</h3>
              <p className="leading-relaxed mb-3">
                Except as otherwise expressly provided by applicable law, all Vehicles sold via Auction Sale through Platform are sold "AS-IS WHERE-IS" BASIS WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTY OF FITNESS FOR A PARTICULAR PURPOSE OR MERCHANTABILITY.
              </p>
              <p className="leading-relaxed mb-3">
                Bidder acknowledges that all Service provided by Auctioneer hereunder are provided "AS IS" and "WHERE IS" and without any, warranty whatsoever and that Bidder's use of the Platform and services associated therewith are at Bidder's own risk. Neither Auctioneer nor any of Auctioneer's affiliates, licensors or suppliers makes and Bidder is not receiving any warranties, express, implied or otherwise with respect to the Platform or services provided hereunder.
              </p>
              <p className="leading-relaxed mb-3">
                The Auctioneer expressly disclaims the accuracy or completeness of any and all information provided to Bidders regarding Vehicles, whether provided in written, verbal, or digital image form through Catalogue available on the Platform. Vehicle Information provided by Seller through the Platform is for convenience only. Bidder shall not rely on Vehicle Information in deciding whether or how much to bid on a Vehicle offered for sale through Platform and Bidder is advised to exercise its discretion thereto.
              </p>
              <p className="leading-relaxed">
                It is the sole responsibility of the Bidder to ascertain, confirm, research, inspect, and/or investigate Vehicles and any and all Vehicle Information prior to bidding on vehicles. All Bidders acknowledge and agree that Vehicles are sold through the Platform on AS IS basis and are not represented as being in a road worthy condition, mechanically sound, or maintained at any guaranteed level of quality.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">8. Proprietary Rights: Scope of Use</h3>
              <p className="leading-relaxed">
                Bidder acknowledges and agree that Auctioneer owns, solely and exclusively, all right, title interest in and to the Platform, including without limitation all content, code data, information, graphics, and other intellectual property used in or on the Platform, the look and feel, design and organization of the Platform, and all copyright, trademark, trade name, service mark, patent, trade secret, moral, database and other intellectual property and proprietary rights inherent therein or appurtenant thereto. Subject to the provisions of this Agreement, including, without limitation, Bidder's payments of all Registration Fee, Membership Fee and Security Deposit and other charges, Auctioneer hereby grants to Bidder a limited, non-exclusive, non-assignable, non-transferable license during the Term of this Agreement to access and view materials and information from the Auctioneer's Platform remotely over the internet, solely to enable Bidder to participate in an auction conducted through the Platform and solely using the Bidders' Account username and password provided to Bidder by Auctioneer.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">9. Miscellaneous</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>Bidder agrees to comply, and to cause its agents and representatives to comply, with all applicable laws and regulations when removing a Vehicle from a Seller's facility, including properly loading and securing all Vehicles for safe travel.</li>
                <li>Once a Vehicle is removed from Seller's premises it is accepted AS-IS, and under no circumstances will Auctioneer or Seller be liable for subsequent claims of damage or loss of any kind or nature whatsoever.</li>
                <li>Auctioneer reserves the right to suspend or revoke a Bidder's bidding privileges for any reason, in its sole and absolute discretion.</li>
                <li>Bidder understands, confirms and agrees that the Auctioneer provides a marketplace i.e. the Platform for Sellers to list their Vehicles and for Bidders to locate Vehicles for sale and purchase transaction and all the Vehicles available on auction platform of the Auctioneer are offered by Sellers directly.</li>
                <li>Any rights, title and interest to the Vehicle purchased through the Auction Sale will be transferred in the name of the Bidder or his authorised representative only after receipt of the Total Price by the Seller and payment of Transaction Fee to the Auctioneer, subject always to the Seller's right to cancel any Winning Bid in accordance with this Agreement.</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">10. Term</h3>
              <p className="leading-relaxed">
                The bidding Services under this Agreement shall be valid and effective from the date of payment of Membership Fees by the Bidder and will be valid for a period of one (1) year therefrom. The Term shall be further extended for a period of one (1) year upon payment of each year Membership Fee.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">11. Representation and Warranties</h3>
              <p className="leading-relaxed mb-3">The Bidder hereby represents and warrants that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 leading-relaxed">
                <li>It has full power and authority to carry on its business;</li>
                <li>The execution and delivery of this Bidder Terms and all other agreements contemplated hereby will not result in breach of any terms and conditions, or constitute default under applicable laws or other obligations to which it is bound or violate any rule, regulation or law of any Government or any order, judgment or decree of any court or government body;</li>
                <li>The execution and delivery of this Agreement and the other acts/covenants contemplated hereby have been duly authorized by all necessary board resolution and shareholder's actions, required, if any.</li>
                <li>It is not in violate or contravention of applicable laws, rules and regulation governing this Bidder Terms.</li>
                <li>It has not and shall not attempt to create more than one registration in its name.</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">12. Confidentiality</h3>
              <p className="leading-relaxed mb-3">
                Confidential Information shall mean any proprietary information of Auctioneer, including but not limited to Auction Sale, Auction Sale process flow, look and feel of the Platform, Platform, technical and artistic information relating to Auctioneer's Platform or business, details pertaining to Sellers, other registered bidders on the Platform, customers, clients, vendors, developments, inventions, technology, etc.
              </p>
              <p className="leading-relaxed">
                The Bidder agrees that it shall use the Confidential Information of the Auctioneer only as follows: (i) to use such Confidential Information only in relation to the Agreement; (ii) not to disclose any such Confidential Information or any part thereof to a person outside the Client's business organization for any purposes unless expressly authorized by the Auctioneer; (iii) to limit dissemination of such Confidential Information to persons within the receiving Party's business organization who are directly involved in the performance of this Agreement and have a need to use such Confidential Information; (iv) to safeguard the Confidential Information to the same extent that it safeguards its own confidential materials or data.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">13. Indemnification</h3>
              <p className="leading-relaxed">
                In addition to any other indemnification obligation of the Bidder in this Agreement, Bidder hereby agrees to defend, indemnify and hold harmless Auctioneer and its shareholders, directors, officers, employees, agents, affiliates, licensors and suppliers harmless from any and all claims, demands, causes of action, debts, liabilities, costs and expenses, arising in any way from (a) Bidder's misuse of Platform or the services provided hereunder, (b) Bidder's placement or transmission of any message, content, information, software or other materials through Platform or using the services associated thereto (c) Bidder's breach or violation of the law, this Agreement, the terms and conditions or the privacy policy or (d) Bidder's performance, failure to perform or improper performance under this Agreement.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">14. Suspension and Termination</h3>
              <p className="leading-relaxed mb-3">
                Either Party may terminate this Agreement without cause at any time by providing the other party a written notice of 30 (Thirty) days. No refund of any fees already paid by the Bidder will be allowed in any case.
              </p>
              <p className="leading-relaxed mb-3">
                In the event of termination, the Auctioneer has the right to adjust the outstanding Membership Fee, Transaction Fee, Backout Fee and/or any other charges due to it or the Seller from the Security Deposit maintained with the Auctioneer. In the event that Bidder's Security Deposit available with Auctioneer is not sufficient for adjustment, the Bidder hereby agrees without any demur or protest to immediately pay all such outstanding dues including without limitation dues pertaining to the Membership Fee and Transaction Fee payable by Bidder.
              </p>
              <p className="leading-relaxed">
                Notwithstanding the termination right as mentioned above, in the event of any violation by the Bidder of this Agreement including but not limited to delay or failure in any payment obligation as stipulated in this Agreement or violation of any of the terms, Bidder Terms, Bid Conditions and policies of the Platform, the Auctioneer may at its sole discretion suspend or deactivate the Bidder's access to the Auction Platform with immediate affect which may be reinstated by the Auctioneer at its sole discretion after the Bidder fulfil its obligations and completes the required formalities as stated by the Auctioneer.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">15. Limitation of Liability</h3>
              <p className="leading-relaxed">
                In no event shall Auctioneer, its shareholders, directors, officers, employees, agents, affiliates, licensors or suppliers be liable hereunder for any consequential, exemplary, special, indirect, incidental or punitive damages or lost revenue, lost profits or anticipates business (even if they have been advised of possibility of such damages) arising from or relating to this Agreement, the subject matter hereof, the Platform and services provided hereunder, the sale, distribution, use of, or inability to use any Vehicle, including but not limited to damages arising from information provided by, to or through the Platform, or any other damages, however caused, under any theory of liability, including without limitation tort (including negligence), contract or otherwise.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">16. General Terms</h3>
              <p className="leading-relaxed mb-3">
                <strong>Independent Contractors:</strong> The Parties are entering this Agreement as independent contractors, and this Agreement will not be construed to create a partnership, joint venture, or employment relationship between them.
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Governing Law and Jurisdiction:</strong> This Agreement shall be governed by the laws of India and the courts of Jaipur, Rajasthan shall have exclusive jurisdiction for matters pertaining to this Agreement.
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Waiver:</strong> To be effective, any waiver by Auctioneer of any of its rights or Bidder's obligations under this Agreement must be made in a writing signed by Auctioneer. Waiver of any breach of any term or condition of this Agreement by Auctioneer will not be deemed a waiver of any prior or subsequent breach.
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Severability:</strong> If any provision of this Agreement is prohibited, invalid or unenforceable in any jurisdiction, the other provisions herein will remain in full force and effect in such jurisdiction and will be liberally construed in order to effectuate the purpose and intent of this Agreement.
              </p>
              <p className="leading-relaxed">
                <strong>Entire Agreement:</strong> This Agreement (including all attachments hereto, and all documents incorporated herein by reference) represents the entire agreement between the Parties with respect to the subject matter hereof and supersedes any proposals, representations previous or contemporaneous oral or written agreements and any other communications between the Parties regarding such subject matter; and may be amended or modified by Auctioneer at any time by intimating you through any mode of electronic communication.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <h3 className="font-bold text-lg mb-3 text-gray-900">Contact Information</h3>
              <p className="leading-relaxed mb-3">For inquiries regarding Bidder Terms:</p>
              <ul className="space-y-1">
                <li><strong>Email:</strong> {companyDetails.email}</li>
                <li><strong>Phone:</strong> {companyDetails.phone} (24/7 Support)</li>
                <li><strong>Address:</strong> {companyDetails.address}</li>
                <li><strong>GST Number:</strong> {companyDetails.gst}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Company Information Footer */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl shadow-lg p-6">
          <h3 className="font-bold text-xl mb-4">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Company:</strong> {companyDetails.name}</p>
              <p><strong>Website:</strong> {companyDetails.domain}</p>
              <p><strong>Email:</strong> {companyDetails.email}</p>
            </div>
            <div>
              <p><strong>Phone:</strong> {companyDetails.phone}</p>
              <p><strong>GST:</strong> {companyDetails.gst}</p>
              <p><strong>Address:</strong> {companyDetails.address}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm"><strong>Legal Jurisdiction:</strong> {companyDetails.jurisdiction}</p>
          </div>
        </div>
      </div>
    </div>
  );
}











