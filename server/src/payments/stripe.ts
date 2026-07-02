/**
 * Minimal Stripe REST client (no SDK dependency).
 *
 * Required env: STRIPE_SECRET_KEY (sk_live_... or sk_test_...)
 * Payments are disabled (paid drops can't be reserved) when the key is absent.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export function stripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export interface PaymentIntent {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_secret: string;
  metadata: Record<string, string>;
}

export async function createPaymentIntent(params: {
  amountPence: number;
  dropId: string;
  userId: string;
}): Promise<PaymentIntent> {
  const body = new URLSearchParams({
    amount: String(params.amountPence),
    currency: "gbp",
    "automatic_payment_methods[enabled]": "true",
    "metadata[dropId]": params.dropId,
    "metadata[userId]": params.userId,
  });

  const resp = await fetch(`${STRIPE_API}/payment_intents`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(`Stripe createPaymentIntent failed: ${(err as any)?.error?.message ?? resp.status}`);
  }
  return (await resp.json()) as PaymentIntent;
}

export async function retrievePaymentIntent(id: string): Promise<PaymentIntent | null> {
  const resp = await fetch(`${STRIPE_API}/payment_intents/${encodeURIComponent(id)}`, {
    headers: authHeaders(),
  });
  if (!resp.ok) return null;
  return (await resp.json()) as PaymentIntent;
}

/** Best-effort refund (used when inventory ran out after payment succeeded). */
export async function refundPaymentIntent(id: string): Promise<void> {
  try {
    await fetch(`${STRIPE_API}/refunds`, {
      method: "POST",
      headers: authHeaders(),
      body: new URLSearchParams({ payment_intent: id }),
    });
  } catch (err) {
    console.error(`[stripe] refund failed for ${id} — refund manually in the Stripe dashboard:`, err);
  }
}
