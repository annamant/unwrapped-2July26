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

/**
 * Stripe's minimum PaymentIntent for GBP is £0.30.
 * https://docs.stripe.com/currencies#minimum-and-maximum-charge-amounts
 * The shop types a list price. Shoppers are charged checkoutFromList(list),
 * which is above the list price, so a £0.30 list price always clears this floor.
 * Keep in sync with client/src/lib/fees.ts.
 */
export const STRIPE_GBP_MIN_CHARGE_PENCE = 30;

/** Smallest list price (pence) a shop can publish. */
export const MIN_LIST_PRICE_PENCE = STRIPE_GBP_MIN_CHARGE_PENCE;

export const MIN_LIST_PRICE_MESSAGE = "Enter a price of at least £0.30.";

/** Shopper-facing checkout (pence) from the business list price. */
export function checkoutFromList(listPence: number): number {
  if (listPence <= 0) return 0;
  return Math.round(listPence * (1 + BUYER_FEE_RATE));
}

/** Null when a new drop's list price can be charged. Legacy £0 rows are not passed through here. */
export function paidListPriceError(listPence: number): string | null {
  if (!Number.isInteger(listPence) || listPence < MIN_LIST_PRICE_PENCE) {
    return MIN_LIST_PRICE_MESSAGE;
  }
  if (checkoutFromList(listPence) < STRIPE_GBP_MIN_CHARGE_PENCE) {
    return MIN_LIST_PRICE_MESSAGE;
  }
  return null;
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
