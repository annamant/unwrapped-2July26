/**
 * Mirrors server/src/payments/fees.ts — keep rates in sync.
 * Business enters what they want to receive; shoppers see one all-in price.
 */

export const BUYER_FEE_RATE = 0.075;
export const SELLER_FEE_RATE = 0.075;

export function checkoutFromReceive(receivePence: number): number {
  if (receivePence <= 0) return 0;
  return Math.round(receivePence * (1 + BUYER_FEE_RATE) / (1 - SELLER_FEE_RATE));
}

export function formatPounds(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}
