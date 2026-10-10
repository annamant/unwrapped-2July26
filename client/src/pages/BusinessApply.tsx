import { useState } from "react";
import { trpc } from "../trpc";
import { MERCHANT_FAQS } from "../lib/seo";
import useIsMobile from "../hooks/useIsMobile";
import { SHOP_VALUE_HEAD, SHOP_VALUE_POINTS } from "../lib/pilotCorridor";
import { BG, FG, BORDER, MUTED_FG, V } from "../theme";


const CATEGORIES = [
  "Fashion & Apparel",
  "Food & Drink",
  "Beauty & Wellness",
  "Home & Living",
  "Art & Culture",
  "Books & Music",
  "Sports & Outdoor",
  "Tech & Gadgets",
  "Kids & Family",
  "Services & Experiences",
];

export default function BusinessApply() {
  const isMobile = useIsMobile();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", contactEmail: "", city: "", address: "", postcode: "",
    instagramHandle: "", website: "", category: "", description: "",
  });
  const [error, setError] = useState("");

  const apply = trpc.businesses.submitApplication.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#22C55E", letterSpacing: "0.2em", marginBottom: 20 }}>
            APPLICATION RECEIVED
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 16 }}>
            We'll be in touch.
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, marginBottom: 32 }}>
            Our team reviews every application. You'll hear from us at <strong>{form.contactEmail}</strong> within 2–3 working days.
          </p>
          <a href="/" style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: FG, border: `1px solid ${FG}`, padding: "12px 24px", textDecoration: "none", letterSpacing: "0.1em" }}>
            BACK TO UNWRAPPED
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      {/* Header */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: isMobile ? "16px 16px" : "18px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: FG, textDecoration: "none" }}>
          Unwrapped
        </a>
        <a href="/business/signin" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}>
          Already approved? Sign in →
        </a>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: isMobile ? "32px 16px 48px" : "56px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            FOR SHOPS
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 28 : 40,
            fontWeight: 700,
            color: FG,
            lineHeight: 1.15,
            letterSpacing: isMobile ? "-0.6px" : "-1px",
            marginBottom: 20,
          }}>
            {SHOP_VALUE_HEAD}
          </h1>
          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {SHOP_VALUE_POINTS.map((point) => (
              <li key={point} style={{
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                border: `1px solid ${BORDER}`,
                padding: "12px 14px",
              }}>
                <span aria-hidden style={{ width: 6, height: 6, borderRadius: "50%", background: V, marginTop: 8, flexShrink: 0 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, lineHeight: 1.5 }}>
                  {point}
                </span>
              </li>
            ))}
          </ul>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, margin: 0 }}>
            We review every application to keep Unwrapped curated. Tell us about your shop and we'll be in touch within 2–3 working days.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row label="Business name *">
            <input value={form.name} onChange={set("name")} placeholder="e.g. the bookshop on your street" style={inputStyle} />
          </Row>
          <Row label="Contact email *">
            <input type="email" value={form.contactEmail} onChange={set("contactEmail")} placeholder="hello@yourbusiness.com" style={inputStyle} />
          </Row>
          <Row label="Category *">
            <select value={form.category} onChange={set("category")} style={inputStyle}>
              <option value="">Select a category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
          <Row label="City *">
            <input value={form.city} onChange={set("city")} placeholder="City" style={inputStyle} />
          </Row>
          <Row label="Address">
            <input value={form.address} onChange={set("address")} placeholder="Street address" style={inputStyle} />
          </Row>
          <Row label="Postcode">
            <input value={form.postcode} onChange={set("postcode")} placeholder="Postcode" style={inputStyle} />
          </Row>
          <Row label="Instagram handle">
            <input value={form.instagramHandle} onChange={set("instagramHandle")} placeholder="@yourbusiness" style={inputStyle} />
          </Row>
          <Row label="Website">
            <input value={form.website} onChange={set("website")} placeholder="https://yourbusiness.com" style={inputStyle} />
          </Row>
          <Row label="Tell us about your business">
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="What do you sell, what makes you special, what kind of drops would you create?"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Row>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: V }}>{error}</p>
          )}

          <button
            onClick={() => {
              setError("");
              if (!form.name || !form.contactEmail || !form.city || !form.category) {
                setError("Please fill in all required fields.");
                return;
              }
              apply.mutate({
                name: form.name,
                contactEmail: form.contactEmail,
                city: form.city,
                address: form.address || undefined,
                postcode: form.postcode || undefined,
                instagramHandle: form.instagramHandle || undefined,
                website: form.website || undefined,
                category: form.category,
                description: form.description || undefined,
              });
            }}
            disabled={apply.isPending}
            style={{
              background: FG, color: BG, border: "none",
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              letterSpacing: "0.12em", padding: "16px",
              cursor: apply.isPending ? "not-allowed" : "pointer",
              opacity: apply.isPending ? 0.6 : 1,
            }}
          >
            {apply.isPending ? "SENDING…" : "APPLY TO PARTNER YOUR SHOP"}
          </button>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textAlign: "center", lineHeight: 1.6 }}>
            By applying you agree to our business terms. We'll never share your information.
          </p>
        </div>

        <div style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
            QUICK ANSWERS
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: FG, marginBottom: 24, lineHeight: 1.15 }}>
            Before you apply.
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {MERCHANT_FAQS.map(({ q, a }) => (
              <div key={q}>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: FG, marginBottom: 6, lineHeight: 1.3 }}>
                  {q}
                </h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.65, margin: 0, fontWeight: 300 }}>
                  {a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  border: `1px solid ${BORDER}`, background: BG, color: FG,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  outline: "none", appearance: "none",
};
