/**
 * Split platform fee (~15% of a notional list price):
 * 7.5% funded by the shopper + 7.5% by the business.
 *
 * Business enters what they want to receive (R).
 * Shoppers pay checkout = round(R × 1.075 / 0.925) — one all-in price, no fee line.
 * Business is paid R. Unwrapped keeps checkout − R.
 *
 * Example: R = £100 → shoppers pay £116.22 → business gets £100 → Unwrapped £16.22
 */

export const BUYER_FEE_RATE = 0.075;
export const SELLER_FEE_RATE = 0.075;

/** Shopper-facing checkout price (pence) from the amount the business wants to receive. */
export function checkoutFromReceive(receivePence: number): number {
  if (receivePence <= 0) return 0;
  return Math.round(receivePence * (1 + BUYER_FEE_RATE) / (1 - SELLER_FEE_RATE));
}

/** Platform take (pence) for one unit. */
export function platformFeePence(checkoutPence: number, receivePence: number): number {
  return Math.max(0, checkoutPence - receivePence);
}

/** Resolve payout amount: stored receive, or legacy full checkout if unset. */
export function effectiveReceive(checkoutPence: number, sellerReceive: number | null | undefined): number {
  if (sellerReceive != null) return sellerReceive;
  return checkoutPence;
}
