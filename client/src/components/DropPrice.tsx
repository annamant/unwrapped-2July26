import { checkoutFromList, discountPercent, formatPounds } from "../lib/fees";

const V = "#E8341C";
const FG = "#141210";
const MUTED_FG = "#7A7A7A";

type DropPriceProps = {
  /** Checkout price in pence (what shoppers pay). */
  price: number;
  /** Original list price in pence, for clearance/discount drops. */
  originalPrice?: number | null;
  size?: "sm" | "md" | "lg";
  showBadge?: boolean;
  layout?: "inline" | "stacked";
};

const sizes = {
  sm: { current: 13, was: 11, badge: 8 },
  md: { current: 16, was: 12, badge: 9 },
  lg: { current: 36, was: 16, badge: 10 },
};

export default function DropPrice({
  price,
  originalPrice,
  size = "md",
  showBadge = true,
  layout = "inline",
}: DropPriceProps) {
  const s = sizes[size];
  const isFree = price === 0;
  const hasDiscount =
    originalPrice != null &&
    originalPrice > 0 &&
    checkoutFromList(originalPrice) > price;

  const pct = hasDiscount ? discountPercent(originalPrice!, price) : null;
  const wasCheckout = hasDiscount ? checkoutFromList(originalPrice!) : null;

  if (isFree) {
    return (
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: s.current, fontWeight: 700, color: FG }}>
        Free
      </span>
    );
  }

  if (!hasDiscount) {
    return (
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: s.current, fontWeight: 700, color: FG }}>
        {formatPounds(price)}
      </span>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: layout === "stacked" ? "column" : "row",
      alignItems: layout === "stacked" ? "flex-start" : "baseline",
      gap: layout === "stacked" ? 6 : 10,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: s.current, fontWeight: 700, color: FG }}>
          {formatPounds(price)}
        </span>
        {wasCheckout != null && (
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: s.was,
            color: MUTED_FG,
            textDecoration: "line-through",
          }}>
            {formatPounds(wasCheckout)}
          </span>
        )}
      </div>
      {showBadge && pct != null && pct > 0 && (
        <span style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: s.badge,
          letterSpacing: "0.08em",
          color: V,
          background: "#FEF2F0",
          padding: layout === "stacked" ? "4px 8px" : "2px 6px",
        }}>
          {pct}% OFF
        </span>
      )}
    </div>
  );
}

export function formatDropPriceLabel(price: number, originalPrice?: number | null): string {
  if (price === 0) return "FREE";
  const pct = originalPrice ? discountPercent(originalPrice, price) : null;
  const base = formatPounds(price);
  return pct != null && pct > 0 ? `${base} (${pct}% off)` : base;
}
