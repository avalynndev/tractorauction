"use client";

import { useState } from "react";
import { X, FileText, CheckCircle, AlertCircle } from "lucide-react";

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  bidAmount: number;
  showOnPageLoad?: boolean; // If true, modal cannot be closed without accepting
}

export default function TermsAndConditionsModal({
  isOpen,
  onAccept,
  onCancel,
  bidAmount,
  showOnPageLoad = false,
}: TermsAndConditionsModalProps) {
  const [accepted, setAccepted] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    if (accepted && scrolledToBottom) {
      // Store acceptance in localStorage with today's date
      // This will be used to check if terms were accepted today (once per day)
      localStorage.setItem("auctionTermsAccepted", "true");
      localStorage.setItem("auctionTermsAcceptedDate", new Date().toISOString());
      onAccept();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Auction Terms & Conditions</h2>
          </div>
          {!showOnPageLoad && (
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Terms Content - Scrollable */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-6"
          onScroll={handleScroll}
        >
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-800 mb-1">
                  Important: Please read all terms carefully before accepting
                </p>
                <p className="text-sm text-yellow-700">
                  By accepting these terms, you agree to be bound by all conditions listed below.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 text-gray-700">
            {/* Bid Amount Display - Only show if not on page load */}
            {!showOnPageLoad && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600 mb-2">Your Bid Amount</p>
                <p className="text-3xl font-bold text-primary-600">
                  ₹{bidAmount.toLocaleString("en-IN")}
                </p>
              </div>
            )}
            
            {/* Welcome Message for Page Load */}
            {showOnPageLoad && (
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200 rounded-lg p-6 text-center">
                <p className="text-lg font-bold text-primary-800 mb-2">
                  Welcome to the Live Auction!
                </p>
                <p className="text-sm text-gray-700">
                  Please read and accept the terms and conditions below to participate in this auction.
                </p>
              </div>
            )}

            {/* Section 1: General Terms */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  1
                </span>
                General Auction Terms
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>All auctions are subject to approval from sellers.</strong> The seller reserves the right to approve or reject any bid at their discretion, even after the auction ends.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Please bid carefully. Bids once placed cannot be canceled.</strong> All bids are final and binding. You cannot withdraw or modify your bid after submission.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>All vehicles are sold on an "As Is, Where Is" basis.</strong> The vehicle is sold in its current condition without any warranties or guarantees.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>The seller has the discretion to approve or cancel the approval of any vehicle at any time.</strong> This decision is final and binding.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 2: Eligibility & KYC */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  2
                </span>
                Eligibility & KYC Requirements
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Only buyers whose Aadhar Card is linked to their PAN Card are eligible to participate in auctions.</strong> You must have completed KYC verification with linked Aadhar and PAN cards.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>If Aadhar is not linked with PAN Card, the buyer has to pay additional tax as applicable per IT guidelines.</strong> All tax liabilities are the responsibility of the buyer.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Third-party payments are not allowed.</strong> If payment is made by a third party, the NOC (No Objection Certificate) will be delayed. Payment must be made from the buyer's own account.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 3: Payment Terms */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  3
                </span>
                Payment Terms & Conditions
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Payment TAT (Turnaround Time): 48 hours.</strong> Payment must be deposited within 2 working days after bid approval.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Bid payment will be through NEFT/RTGS only.</strong> No other payment methods are accepted for bid payments.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Payments for approved cases must be closed on or before month end.</strong> Failure to complete payment within the deadline may result in bid cancellation.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Part payment is not allowed post approval of asset.</strong> Full payment must be made as per the approved bid amount.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 4: Quote Validity */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  4
                </span>
                Quote Validity Period
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Quote Validity:</strong> 30 days or month end, whichever is earlier, for auctions happening between 1st - 25th day of the month.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>For auctions happening after the 25th day of the month:</strong> Quote validity is until the 5th day of the next month.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 5: Vehicle Inspection & Condition */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  5
                </span>
                Vehicle Inspection & Condition
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Please physically inspect the vehicle to be sure of the extent of damage before placing your bid.</strong> No request for amount revision at the time of lifting the vehicle will be entertained once quoted in the auction.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>RTO blacklisting of the vehicle, vehicle condition, etc. should be checked before bidding.</strong> Once approval is received, these cases will not be considered as disputes.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Buyer needs to check all details properly before bidding, including:</strong> Images, Challan status, Tax status, Parking charges, Vehicle condition, RTO status, etc.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>No revision will be accepted post auction.</strong> All bids are final and cannot be modified after submission.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 6: Taxes & Transfer */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  6
                </span>
                Taxes, Transfer & RTO
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>The liability of all taxes, transfer & RTO related discrepancies, if any, will solely be at the bidder's risk & responsibility.</strong> The platform is not responsible for any such issues.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Parking charges will be borne by the buyer, including lockdown period charges.</strong> All parking and storage fees are the buyer's responsibility.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 7: Disputes & Backout */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  7
                </span>
                Disputes & Backout Policy
              </h3>
              <ul className="space-y-3 ml-11">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>No dispute or backout will be acceptable post approval.</strong> Once the seller approves your bid, you are committed to complete the purchase.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Buyer will be blacklisted in case buyer backs out.</strong> Backing out after bid approval will result in permanent blacklisting from the platform.
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Vehicles once sold will not be taken back.</strong> All sales are final with no return or exchange policy.
                  </span>
                </li>
              </ul>
            </section>

            {/* Section 8: Dispute Cases */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
                <span className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">
                  8
                </span>
                Acceptable Dispute Cases
              </h3>
              <div className="ml-11 space-y-4">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">
                    The following cases will be considered as disputes:
                  </p>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Chassis and Engine Number Mismatch</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Blacklisted Vehicle</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>RTO Hold</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Make Model Mismatch</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary-600 mr-2">•</span>
                      <span>Year of Manufacturing (YOM) Mismatch</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <p className="font-semibold text-red-800 mb-2">
                    The following will NOT be considered as disputes:
                  </p>
                  <ul className="space-y-2 ml-4 text-red-700">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Variant Mismatch</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Parts Missing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Pending Challan and Taxes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">•</span>
                      <span>Accidental Vehicles</span>
                    </li>
                  </ul>
                  <p className="text-sm text-red-700 mt-3 font-semibold">
                    ⚠️ Buyers need to check for pending challans and taxes before bidding.
                  </p>
                </div>
              </div>
            </section>

            {/* Final Notice */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mt-6">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-red-800 text-lg mb-2">
                    Final Notice
                  </p>
                  <p className="text-red-700">
                    By accepting these terms and conditions, you acknowledge that you have read, understood, and agree to be bound by all the terms mentioned above. You understand that:
                  </p>
                  <ul className="list-disc list-inside text-red-700 mt-2 space-y-1">
                    <li>Bids cannot be canceled once placed</li>
                    <li>All vehicles are sold "As Is, Where Is"</li>
                    <li>You are responsible for all taxes, RTO, and transfer-related issues</li>
                    <li>Backing out after approval will result in blacklisting</li>
                    <li>No disputes will be entertained for non-listed cases</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          {!scrolledToBottom && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-2 text-center">
              <p className="text-sm text-gray-500 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Please scroll to the bottom to accept terms
              </p>
            </div>
          )}
        </div>

        {/* Footer with Acceptance */}
        <div className="border-t bg-gray-50 p-6 sticky bottom-0">
          <div className="flex items-start space-x-3 mb-4">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              disabled={!scrolledToBottom}
              className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label
              htmlFor="acceptTerms"
              className={`text-sm ${
                scrolledToBottom
                  ? "text-gray-700 cursor-pointer"
                  : "text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="font-semibold">
                I have read, understood, and agree to all the Terms & Conditions mentioned above.
              </span>
              {!scrolledToBottom && (
                <span className="block text-xs text-gray-500 mt-1">
                  (Please scroll to the bottom first)
                </span>
              )}
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!accepted || !scrolledToBottom}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Accept & Continue to Bid</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

