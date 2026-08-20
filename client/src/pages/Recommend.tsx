import { useEffect, useState } from "react";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import { BG, FG, BORDER, MUTED_FG, V } from "../theme";


const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

const emptyForm = {
  businessName: "",
  neighbourhood: "",
  category: "",
  businessInstagram: "",
  businessWebsite: "",
  businessAddress: "",
  note: "",
  recommenderName: "",
  recommenderEmail: "",
};

export default function Recommend() {
  const { data: user } = trpc.auth.me.useQuery();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      recommenderName: prev.recommenderName || user.name || "",
      recommenderEmail: prev.recommenderEmail || user.email || "",
    }));
  }, [user]);

  const submit = trpc.recommendations.submit.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));
  }

  const shopsHref = user ? "/home?tab=shops" : "/";

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <Nav />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "#22C55E", letterSpacing: "0.2em", marginBottom: 20 }}>
              RECOMMENDATION RECEIVED
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 700, color: FG, lineHeight: 1.1, marginBottom: 16 }}>
              We'll reach out.
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, marginBottom: 12 }}>
              Thanks for nominating <strong style={{ color: FG }}>{form.businessName}</strong>. We'll contact them and let them know someone in the neighbourhood picked them for Unwrapped.
            </p>
            {form.recommenderEmail ? (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.7, marginBottom: 32 }}>
                If they come on board, we can let you know at <strong style={{ color: FG }}>{form.recommenderEmail}</strong>.
              </p>
            ) : (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.7, marginBottom: 32 }}>
                Want another tip? Recommend as many as you love — that's how the map fills.
              </p>
            )}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    ...emptyForm,
                    recommenderName: user?.name || form.recommenderName,
                    recommenderEmail: user?.email || form.recommenderEmail,
                  });
                }}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, color: BG, background: FG,
                  border: `1px solid ${FG}`, padding: "12px 24px", letterSpacing: "0.1em", cursor: "pointer",
                }}
              >
                RECOMMEND ANOTHER
              </button>
              <a href={shopsHref} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: FG, border: `1px solid ${FG}`, padding: "12px 24px", textDecoration: "none", letterSpacing: "0.1em" }}>
                {user ? "BACK TO SHOPS" : "BACK TO UNWRAPPED"}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "56px 24px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.15em", marginBottom: 16 }}>
            NOMINATE · LONDON
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 700, color: FG, lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 16 }}>
            Recommend a shop<br />you'd love on Unwrapped.
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7 }}>
            Know a café, salon, florist, restaurant, studio, or neighbourhood spot that should be here?
            Tell us — we'll reach out and let them know someone selected them.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Row label="Business name *">
            <input value={form.businessName} onChange={set("businessName")} placeholder="e.g. Corner Bakery" style={inputStyle} />
          </Row>
          <Row label="Neighbourhood / area *">
            <input value={form.neighbourhood} onChange={set("neighbourhood")} placeholder="e.g. Hackney, Peckham, Notting Hill" style={inputStyle} />
          </Row>
          <Row label="Category">
            <select value={form.category} onChange={set("category")} style={inputStyle}>
              <option value="">Optional…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Row>
          <Row label="Their Instagram">
            <input value={form.businessInstagram} onChange={set("businessInstagram")} placeholder="@theirshop" style={inputStyle} />
          </Row>
          <Row label="Website or Google Maps link">
            <input value={form.businessWebsite} onChange={set("businessWebsite")} placeholder="https://…" style={inputStyle} />
          </Row>
          <Row label="Address (if you know it)">
            <input value={form.businessAddress} onChange={set("businessAddress")} placeholder="Street or postcode" style={inputStyle} />
          </Row>
          <Row label="Why do you love them?">
            <textarea
              value={form.note}
              onChange={set("note")}
              placeholder="What should we tell them — and why would they be great on Unwrapped?"
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Row>

          {user ? (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.6 }}>
              Nominating as <strong style={{ color: FG }}>{user.name || user.email}</strong>
              {user.email ? ` · ${user.email}` : ""}. We'll use this if we tell the shop a neighbour sent us.
            </p>
          ) : (
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, marginTop: 4 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 16 }}>
                ABOUT YOU · OPTIONAL
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.6, marginBottom: 16 }}>
                Leave your details if you'd like us to tell you when they're on Unwrapped — and so we can say a neighbour nominated them.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Row label="Your name">
                  <input value={form.recommenderName} onChange={set("recommenderName")} placeholder="Optional" style={inputStyle} />
                </Row>
                <Row label="Your email">
                  <input type="email" value={form.recommenderEmail} onChange={set("recommenderEmail")} placeholder="you@email.com" style={inputStyle} />
                </Row>
              </div>
            </div>
          )}

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: V }}>{error}</p>
          )}

          <button
            onClick={() => {
              setError("");
              if (!form.businessName.trim() || !form.neighbourhood.trim()) {
                setError("Please add the business name and neighbourhood.");
                return;
              }
              submit.mutate({
                businessName: form.businessName.trim(),
                neighbourhood: form.neighbourhood.trim(),
                category: form.category.trim() || undefined,
                businessInstagram: form.businessInstagram.trim() || undefined,
                businessWebsite: form.businessWebsite.trim() || undefined,
                businessAddress: form.businessAddress.trim() || undefined,
                note: form.note.trim() || undefined,
                recommenderName: form.recommenderName.trim() || user?.name || undefined,
                recommenderEmail: form.recommenderEmail.trim() || user?.email || undefined,
              });
            }}
            disabled={submit.isPending}
            style={{
              background: FG, color: BG, border: "none",
              fontFamily: "'Space Mono', monospace", fontSize: 11,
              letterSpacing: "0.12em", padding: "16px",
              cursor: submit.isPending ? "not-allowed" : "pointer",
              opacity: submit.isPending ? 0.6 : 1,
            }}
          >
            {submit.isPending ? "SENDING…" : "SEND RECOMMENDATION"}
          </button>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textAlign: "center", lineHeight: 1.6 }}>
            Own this business?{" "}
            <a href="/business-apply" style={{ color: FG }}>Apply to list it yourself →</a>
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
