/**
 * Calculate transaction fee for auction purchases
 * 
 * Offer: 2.5% (valid till 31st March 2026)
 * Standard: 4%
 * 
 * @param winningBid - The winning bid amount
 * @param useOfferRate - Whether to use the offer rate (2.5%) or standard rate (4%)
 * @returns The transaction fee amount
 */
export function calculateTransactionFee(
  winningBid: number,
  useOfferRate: boolean = true
): number {
  // Check if offer is still valid (till 31st March 2026)
  const offerEndDate = new Date("2026-03-31T23:59:59");
  const now = new Date();
  const isOfferValid = now <= offerEndDate;

  // Use offer rate if valid and requested, otherwise use standard rate
  const rate = useOfferRate && isOfferValid ? 0.025 : 0.04;

  // Calculate fee
  const fee = winningBid * rate;

  // Round to 2 decimal places
  return Math.round(fee * 100) / 100;
}

/**
 * Get transaction fee details including rate and amount
 */
export function getTransactionFeeDetails(winningBid: number) {
  const offerEndDate = new Date("2026-03-31T23:59:59");
  const now = new Date();
  const isOfferValid = now <= offerEndDate;

  const offerFee = calculateTransactionFee(winningBid, true);
  const standardFee = calculateTransactionFee(winningBid, false);

  return {
    offerFee,
    standardFee,
    isOfferValid,
    offerRate: 0.025,
    standardRate: 0.04,
    offerEndDate: offerEndDate.toISOString(),
  };
}



