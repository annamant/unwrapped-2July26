import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import { format } from "date-fns";

const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

export default function DropDetail() {
  const [, params] = useRoute("/drop/:id");
  const [, navigate] = useLocation();
  const id = params?.id ?? "";

  const { data, isLoading, error } = trpc.drops.getById.useQuery({ id }, { enabled: !!id });
  const { data: user } = trpc.auth.me.useQuery();
  const { data: waitlistStatus } = trpc.waitlist.status.useQuery(
    { dropId: id }, { enabled: !!id && !!user }
  );
  const { data: followStatus } = trpc.businesses.followStatus.useQuery(
    { businessId: data?.business.id ?? "" }, { enabled: !!data && !!user }
  );

  const utils = trpc.useUtils();

  const joinWaitlist = trpc.waitlist.join.useMutation({
    onSuccess: () => utils.waitlist.status.invalidate({ dropId: id }),
  });
  const leaveWaitlist = trpc.waitlist.leave.useMutation({
    onSuccess: () => utils.waitlist.status.invalidate({ dropId: id }),
  });
  const follow = trpc.businesses.follow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate({ businessId: data?.business.id ?? "" }),
  });
  const unfollow = trpc.businesses.unfollow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate({ businessId: data?.business.id ?? "" }),
  });

  const [reserveError, setReserveError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const createPI = trpc.reservations.createPaymentIntent.useMutation({
    onSuccess: (d) => {
      setClientSecret(d.clientSecret);
      setPaymentIntentId(d.paymentIntentId);
    },
    onError: (e) => setReserveError(e.message),
  });

  const reserve = trpc.reservations.create.useMutation({
    onSuccess: (r) => {
      utils.drops.getById.invalidate({ id });
      navigate(`/ticket/${r.id}`);
    },
    onError: (e) => setReserveError(e.message),
  });

  if (isLoading) return <PageShell><Spinner /></PageShell>;
  if (error || !data) return <PageShell><NotFound /></PageShell>;

  const { drop, business, location } = data;
  const now = new Date();
  const start = new Date(drop.collectionStart);
  const end = new Date(drop.collectionEnd);
  const isLive = now >= start && now <= end;
  const isUpcoming = now < start;
  const isExpired = now > end;
  const soldOut = drop.availableQuantity === 0 || drop.status === "sold_out";
  const total = drop.totalQuantity || 1;
  const pct = Math.round(((total - drop.availableQuantity) / total) * 100);
  const scarce = !soldOut && drop.availableQuantity <= 3;

  const reserving = createPI.isPending || reserve.isPending;

  function handleReserve() {
    if (!user) { navigate("/signin"); return; }
    setReserveError("");
    if (drop.price === 0) {
      // Free drop — no payment needed
      reserve.mutate({ dropId: id });
      return;
    }
    if (!stripePromise) {
      setReserveError("Payments aren't available right now. Please try again later.");
      return;
    }
    createPI.mutate({ dropId: id });
  }

  return (
    <PageShell>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 56, alignItems: "start" }}>

          {/* ── Left: image + description ── */}
          <div>
            {/* Image */}
            <div style={{
              background: drop.imageUrl ? `url(${drop.imageUrl}) center/cover` : MUTED,
              aspectRatio: "4/3", marginBottom: 32, position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!drop.imageUrl && (
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: MUTED_FG, fontStyle: "italic" }}>
                  {business.name}
                </span>
              )}
              {isLive && (
                <div style={{
                  position: "absolute", top: 16, left: 16,
                  display: "flex", alignItems: "center", gap: 6,
                  background: BG, padding: "5px 10px", border: `1px solid ${BORDER}`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: FG, letterSpacing: 1 }}>LIVE NOW</span>
                </div>
              )}
            </div>

            {/* Business link + follow */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <a
                href={`/business/${business.slug}`}
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}
              >
                {business.name}
              </a>
              {user && (
                <button
                  onClick={() => followStatus?.following ? unfollow.mutate({ businessId: business.id }) : follow.mutate({ businessId: business.id })}
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 9,
                    letterSpacing: "0.1em", padding: "6px 14px",
                    border: `1px solid ${BORDER}`, background: followStatus?.following ? FG : BG,
                    color: followStatus?.following ? BG : FG, cursor: "pointer",
                  }}
                >
                  {followStatus?.following ? "FOLLOWING" : "+ FOLLOW"}
                </button>
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700, color: FG, lineHeight: 1.1,
              letterSpacing: "-1px", marginBottom: 16,
            }}>
              {drop.title}
            </h1>

            {/* Category */}
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: MUTED_FG, letterSpacing: "0.15em",
              textTransform: "uppercase", marginBottom: 24,
            }}>
              {drop.category}
            </div>

            {/* Description */}
            {drop.description && (
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                color: FG, lineHeight: 1.7, marginBottom: 32,
              }}>
                {drop.description}
              </p>
            )}

            {/* Collection info */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "20px 24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
                COLLECTION DETAILS
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginBottom: 4 }}>Date</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: FG }}>
                    {format(start, "EEE d MMM")}
                  </div>
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginBottom: 4 }}>Window</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: FG }}>
                    {format(start, "h:mm a")} – {format(end, "h:mm a")}
                  </div>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginBottom: 4 }}>Address</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>{location.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: price + reserve ── */}
          <div style={{ position: "sticky", top: 88 }}>
            {/* Price */}
            <div style={{ borderBottom: `1px solid ${BORDER}`, paddingBottom: 20, marginBottom: 20 }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 36, fontWeight: 700, color: FG, marginBottom: 4,
              }}>
                £{(drop.price / 100).toFixed(2)}
              </div>
              {scarce && (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: V, letterSpacing: "0.05em" }}>
                  Only {drop.availableQuantity} left
                </div>
              )}
            </div>

            {/* Scarcity bar */}
            {!soldOut && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ height: 3, background: BORDER, marginBottom: 6 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? V : FG, transition: "width 0.3s" }} />
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {drop.availableQuantity} of {total} remaining
                </div>
              </div>
            )}

            {/* CTA */}
            {isExpired ? (
              <div style={{ padding: "16px", background: MUTED, textAlign: "center" }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.1em" }}>
                  THIS DROP HAS ENDED
                </span>
              </div>
            ) : soldOut ? (
              <div>
                <div style={{ padding: "16px", background: MUTED, textAlign: "center", marginBottom: 12 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.1em" }}>
                    SOLD OUT
                  </span>
                </div>
                {user && (
                  <button
                    onClick={() => waitlistStatus?.onWaitlist
                      ? leaveWaitlist.mutate({ dropId: id })
                      : joinWaitlist.mutate({ dropId: id })}
                    style={{
                      width: "100%", padding: "13px",
                      border: `1px solid ${BORDER}`, background: BG, color: FG,
                      fontFamily: "'Space Mono', monospace", fontSize: 10,
                      letterSpacing: "0.1em", cursor: "pointer",
                    }}
                  >
                    {waitlistStatus?.onWaitlist ? "ON WAITLIST — REMOVE" : "JOIN WAITLIST"}
                  </button>
                )}
              </div>
            ) : clientSecret && stripePromise ? (
              <div>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    amountLabel={`£${(drop.price / 100).toFixed(2)}`}
                    onPaid={(piId) => reserve.mutate({ dropId: id, stripePaymentIntentId: piId })}
                    onCancel={() => { setClientSecret(null); setPaymentIntentId(null); setReserveError(""); }}
                    finalizing={reserve.isPending}
                    fallbackPaymentIntentId={paymentIntentId}
                  />
                </Elements>
                {reserveError && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, lineHeight: 1.5, marginTop: 12 }}>
                    {reserveError}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <button
                  onClick={handleReserve}
                  disabled={reserving}
                  style={{
                    width: "100%", padding: "16px",
                    background: FG, color: BG, border: "none",
                    fontFamily: "'Space Mono', monospace", fontSize: 11,
                    letterSpacing: "0.12em", cursor: reserving ? "not-allowed" : "pointer",
                    opacity: reserving ? 0.6 : 1, marginBottom: 12,
                  }}
                >
                  {reserving
                    ? "PROCESSING…"
                    : drop.price === 0
                    ? "RESERVE — FREE"
                    : `RESERVE — £${(drop.price / 100).toFixed(2)}`}
                </button>
                {reserveError && (
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, lineHeight: 1.5 }}>
                    {reserveError}
                  </p>
                )}
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, lineHeight: 1.5 }}>
                  {isUpcoming
                    ? `Drop opens ${format(start, "EEE d MMM 'at' h:mm a")}.`
                    : `Collect by ${format(end, "h:mm a")} today.`
                  } Your QR code is issued instantly.
                </p>
              </div>
            )}

            {/* Window status */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 8 }}>
                STATUS
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: isLive ? "#22C55E" : isUpcoming ? FG : MUTED_FG,
              }}>
                {isLive ? "Collection open now" : isUpcoming ? `Opens ${format(start, "h:mm a")}` : "Collection closed"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function CheckoutForm({ amountLabel, onPaid, onCancel, finalizing, fallbackPaymentIntentId }: {
  amountLabel: string;
  onPaid: (paymentIntentId: string) => void;
  onCancel: () => void;
  finalizing: boolean;
  fallbackPaymentIntentId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setPayError("");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: window.location.href },
    });

    if (error) {
      setPayError(error.message ?? "Payment failed. Try another card.");
      setPaying(false);
      return;
    }

    const piId = paymentIntent?.id ?? fallbackPaymentIntentId;
    if (paymentIntent?.status === "succeeded" && piId) {
      onPaid(piId);
    } else {
      setPayError("Payment didn't complete. You haven't been charged — try again.");
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handlePay}>
      <div style={{ border: `1px solid ${BORDER}`, padding: 16, background: "#FFFFFF", marginBottom: 12 }}>
        <PaymentElement />
      </div>
      {payError && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, lineHeight: 1.5, marginBottom: 12 }}>
          {payError}
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || paying || finalizing}
        style={{
          width: "100%", padding: "16px",
          background: FG, color: BG, border: "none",
          fontFamily: "'Space Mono', monospace", fontSize: 11,
          letterSpacing: "0.12em",
          cursor: paying || finalizing ? "not-allowed" : "pointer",
          opacity: paying || finalizing ? 0.6 : 1, marginBottom: 8,
        }}
      >
        {finalizing ? "ISSUING TICKET…" : paying ? "PROCESSING…" : `PAY ${amountLabel}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={paying || finalizing}
        style={{
          width: "100%", padding: "12px",
          background: BG, color: MUTED_FG, border: `1px solid ${BORDER}`,
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          letterSpacing: "0.1em", cursor: "pointer",
        }}
      >
        CANCEL
      </button>
    </form>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ padding: "80px 24px", textAlign: "center" }}>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: MUTED_FG, letterSpacing: "0.15em" }}>
        LOADING
      </span>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ padding: "80px 24px", textAlign: "center" }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: MUTED_FG, marginBottom: 12 }}>
        Drop not found
      </p>
      <a href="/" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>← Back</a>
    </div>
  );
}
