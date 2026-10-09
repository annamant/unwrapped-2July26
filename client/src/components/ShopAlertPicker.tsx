import { useEffect, useMemo, useRef, useState } from "react";
import { BG, FG, BORDER, MUTED_FG, V } from "../theme";

export type ShopChoice = {
  key: string;
  name: string;
  detail: string;
  directoryPinId?: string;
  businessId?: string;
};

export default function ShopAlertPicker({
  shops,
  selected,
  onToggle,
  onSkip,
  onContinue,
  pending,
}: {
  shops: ShopChoice[];
  selected: string[];
  onToggle: (key: string) => void;
  onSkip: () => void;
  onContinue: () => void;
  pending: boolean;
}) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return shops;
    return shops.filter((shop) => `${shop.name} ${shop.detail}`.toLowerCase().includes(q));
  }, [shops, query]);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const selectedEl = root.querySelector('[aria-selected="true"]');
    if (!(selectedEl instanceof HTMLElement)) return;
    const top = selectedEl.offsetTop;
    const bottom = top + selectedEl.offsetHeight;
    if (top < root.scrollTop || bottom > root.scrollTop + root.clientHeight) {
      root.scrollTop = Math.max(0, top - 8);
    }
  }, [filtered, selected]);

  return (
    <div>
      <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: MUTED_FG, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
        Optional
      </p>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8, lineHeight: 1.15 }}>
        Which shops do you want alerts from?
      </h2>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.5, marginBottom: 20 }}>
        Follow the shops you like and we'll email you when they post something. You can skip this.
      </p>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search shops"
        aria-label="Search shops"
        style={{
          width: "100%",
          padding: "14px 16px",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 15,
          border: `1px solid ${BORDER}`,
          background: BG,
          color: FG,
          outline: "none",
          boxSizing: "border-box",
          marginBottom: 12,
        }}
      />
      <div ref={listRef} style={{ border: `1px solid ${BORDER}`, maxHeight: 320, overflowY: "auto", marginBottom: 16 }} role="listbox" aria-label="Shops" aria-multiselectable="true">
        {filtered.length === 0 ? (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, padding: 16 }}>No matches.</p>
        ) : filtered.map((shop) => {
          const on = selected.includes(shop.key);
          return (
            <button
              key={shop.key}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onToggle(shop.key)}
              style={{
                display: "flex",
                width: "100%",
                textAlign: "left",
                gap: 12,
                alignItems: "center",
                padding: "12px 14px",
                background: on ? "#FFCEDA" : BG,
                border: "none",
                borderBottom: `1px solid ${BORDER}`,
                cursor: "pointer",
                color: FG,
              }}
            >
              <span style={{
                width: 16,
                height: 16,
                flexShrink: 0,
                border: `1px solid ${FG}`,
                background: on ? FG : "transparent",
              }} />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{shop.name}</span>
                <span style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>{shop.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12 }}>
        {selected.length === 0 ? "None selected" : `${selected.length} selected`}
      </p>
      <button
        type="button"
        onClick={onContinue}
        disabled={pending}
        style={{
          display: "block",
          width: "100%",
          background: pending ? "#888" : V,
          color: "#FFF0F4",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 16,
          fontWeight: 500,
          padding: "16px 0",
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        {pending ? "Please wait…" : "Create account"}
      </button>
      <button
        type="button"
        onClick={onSkip}
        disabled={pending}
        style={{
          display: "block",
          width: "100%",
          marginTop: 10,
          background: "transparent",
          color: MUTED_FG,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          padding: "12px 0",
          border: "none",
          cursor: pending ? "not-allowed" : "pointer",
        }}
      >
        Skip for now
      </button>
    </div>
  );
}
