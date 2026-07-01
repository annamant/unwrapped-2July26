import { useState } from "react";
import { trpc } from "../trpc";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

export default function BusinessApply() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", contactEmail: "", city: "", address: "", postcode: "",
    instagramHandle: "", website: "", category: "", description: "",
  });
  const [error, setError] = useState("");

  const apply = trpc.businesses.apply.useMutation({
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
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: FG, textDecoration: "none" }}>
          Unwrapped
        </a>
        <a href="/business/signin" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}>
          Already approved? Sign in →
        </a>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            FOR BUSINESSES
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: FG, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}>
            Apply to list<br />your business.
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7 }}>
            We review every application to keep Unwrapped curated. Tell us about your business and we'll be in touch within 2–3 working days.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row label="Business name *">
            <input value={form.name} onChange={set("name")} placeholder="e.g. Maison Blanc Pâtisserie" style={inputStyle} />
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
            <input value={form.city} onChange={set("city")} placeholder="London" style={inputStyle} />
          </Row>
          <Row label="Address">
            <input value={form.address} onChange={set("address")} placeholder="123 Portobello Road" style={inputStyle} />
          </Row>
          <Row label="Postcode">
            <input value={form.postcode} onChange={set("postcode")} placeholder="W11 2DY" style={inputStyle} />
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
            {apply.isPending ? "SENDING…" : "SUBMIT APPLICATION"}
          </button>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textAlign: "center", lineHeight: 1.6 }}>
            By applying you agree to our business terms. We'll never share your information.
          </p>
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
