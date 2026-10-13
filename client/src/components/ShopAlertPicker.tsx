import { useEffect, useMemo, useRef, useState } from "react";
import { BG, FG, BORDER, MUTED_FG, V } from "../theme";
import { SIGNUP_INTERESTS, type SignupInterestId } from "../lib/signupInterests";

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
  interests,
  requestedShopsText,
  onToggle,
  onToggleInterest,
  onRequestedShopsChange,
  onSkip,
  onContinue,
  pending,
}: {
  shops: ShopChoice[];
  selected: string[];
  interests: SignupInterestId[];
  requestedShopsText: string;
  onToggle: (key: string) => void;
  onToggleInterest: (id: SignupInterestId) => void;
  onRequestedShopsChange: (value: string) => void;
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
    if (!root || selected.length === 0) return;
    const selectedEl = root.querySelector('[aria-selected="true"]');
    if (!(selectedEl instanceof HTMLElement)) return;
    const rootRect = root.getBoundingClientRect();
    const elRect = selectedEl.getBoundingClientRect();
    if (elRect.top < rootRect.top || elRect.bottom > rootRect.bottom) {
      selectedEl.scrollIntoView({ block: "nearest" });
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

      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          color: FG,
          marginBottom: 10,
        }}>
          Your interests <span style={{ fontWeight: 500, color: MUTED_FG }}>(optional)</span>
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }} role="group" aria-label="Interests">
          {SIGNUP_INTERESTS.map((interest) => {
            const on = interests.includes(interest.id);
            return (
              <button
                key={interest.id}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleInterest(interest.id)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  padding: "8px 12px",
                  cursor: "pointer",
                  border: on ? `1.5px solid ${FG}` : `1px solid ${BORDER}`,
                  background: on ? "#FFCEDA" : BG,
                  color: FG,
                }}
              >
                {interest.label}
              </button>
            );
          })}
        </div>
      </div>

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
      <div style={{ marginBottom: 16 }}>
        <label
          htmlFor="signup-requested-shops"
          style={{
            display: "block",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            fontWeight: 700,
            color: FG,
            marginBottom: 8,
          }}
        >
          Shops you'd follow that aren't listed{" "}
          <span style={{ fontWeight: 500, color: MUTED_FG }}>(optional)</span>
        </label>
        <textarea
          id="signup-requested-shops"
          value={requestedShopsText}
          onChange={(e) => onRequestedShopsChange(e.target.value)}
          rows={3}
          placeholder="One per line, or separated by commas"
          style={{
            width: "100%",
            padding: "12px 14px",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            border: `1px solid ${BORDER}`,
            background: BG,
            color: FG,
            outline: "none",
            boxSizing: "border-box",
            resize: "vertical",
            lineHeight: 1.45,
          }}
        />
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12 }}>
        {selected.length === 0 ? "No shops selected" : `${selected.length} shop${selected.length === 1 ? "" : "s"} selected`}
        {interests.length > 0 ? ` · ${interests.length} interest${interests.length === 1 ? "" : "s"}` : ""}
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
