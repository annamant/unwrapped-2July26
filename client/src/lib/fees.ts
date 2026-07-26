/**
 * Mirrors server/src/payments/fees.ts — keep rates in sync.
 * Business enters list price P → shoppers pay P×1.075, business gets P×0.925.
 */

export const BUYER_FEE_RATE = 0.075;
export const SELLER_FEE_RATE = 0.075;

export function checkoutFromList(listPence: number): number {
  if (listPence <= 0) return 0;
  return Math.round(listPence * (1 + BUYER_FEE_RATE));
}

export function receiveFromList(listPence: number): number {
  if (listPence <= 0) return 0;
  return Math.round(listPence * (1 - SELLER_FEE_RATE));
}

export function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
