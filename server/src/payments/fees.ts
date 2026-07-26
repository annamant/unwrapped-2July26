/**
 * Split £15 platform fee on a £100 list price (7.5% each side):
 *
 * Business enters list price P (what they're "selling at").
 * Shoppers pay checkout = round(P × 1.075) — one all-in price, no fee line.
 * Business receives sellerReceive = round(P × 0.925) — shown up front before publish.
 * Unwrapped keeps checkout − sellerReceive (= £15 when P = £100).
 *
 * Example: P = £100 → shoppers pay £107.50 → business gets £92.50 → Unwrapped £15
 */

export const BUYER_FEE_RATE = 0.075;
export const SELLER_FEE_RATE = 0.075;

/** Shopper-facing checkout (pence) from the business list price. */
export function checkoutFromList(listPence: number): number {
  if (listPence <= 0) return 0;
  return Math.round(listPence * (1 + BUYER_FEE_RATE));
}

/** What the business is paid (pence) from the business list price. */
export function receiveFromList(listPence: number): number {
  if (listPence <= 0) return 0;
  return Math.round(listPence * (1 - SELLER_FEE_RATE));
}

/** Platform take (pence) for one unit. */
export function platformFeePence(checkoutPence: number, receivePence: number): number {
  return Math.max(0, checkoutPence - receivePence);
}

/**
 * Resolve payout amount.
 * New drops store sellerReceive. Legacy drops (null) keep the full checkout.
 */
export function effectiveReceive(checkoutPence: number, sellerReceive: number | null | undefined): number {
  if (sellerReceive != null) return sellerReceive;
  return checkoutPence;
}
