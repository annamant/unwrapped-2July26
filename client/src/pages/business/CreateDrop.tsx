import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { DashLayout } from "./Dashboard";
import useIsMobile from "../../hooks/useIsMobile";
import ImageUpload from "../../components/ImageUpload";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

export default function CreateDrop() {
  const isMobile = useIsMobile(768);
  const twoCol = { display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 } as const;
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", imageUrl: "", category: "", format: "limited_item",
    price: "", totalQuantity: "",
    collectionStart: "", collectionEnd: "",
    locationAddress: "", locationCity: "", locationPostcode: "",
    locationLat: "", locationLng: "",
  });

  const utils = trpc.useUtils();
  const create = trpc.drops.create.useMutation({
    onSuccess: () => {
      utils.drops.myDrops.invalidate();
      navigate("/dashboard/drops");
    },
    onError: (e) => setError(e.message),
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));
  }

  function handleSubmit() {
    setError("");
    if (!form.title || !form.category || !form.price || !form.totalQuantity || !form.collectionStart || !form.collectionEnd || !form.locationAddress) {
      setError("Please fill in all required fields.");
      return;
    }
    const priceInPence = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceInPence) || priceInPence < 0) { setError("Invalid price."); return; }
    const qty = parseInt(form.totalQuantity);
    if (isNaN(qty) || qty < 1) { setError("Quantity must be at least 1."); return; }
    if (new Date(form.collectionEnd) <= new Date(form.collectionStart)) {
      setError("The collection window must end after it starts.");
      return;
    }

    create.mutate({
      title: form.title,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      category: form.category,
      format: form.format as "limited_item" | "clearance_discount" | "bundle" | "service_window",
      price: priceInPence,
      totalQuantity: qty,
      collectionStart: new Date(form.collectionStart).toISOString(),
      collectionEnd: new Date(form.collectionEnd).toISOString(),
      location: {
        address: form.locationAddress,
        city: form.locationCity || undefined,
        postcode: form.locationPostcode || undefined,
        latitude: form.locationLat ? parseFloat(form.locationLat) : undefined,
        longitude: form.locationLng ? parseFloat(form.locationLng) : undefined,
      },
    });
  }

  return (
    <DashLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: 700 }}>
        <div style={{ marginBottom: 36 }}>
          <a href="/dashboard/drops" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}>
            ← Drops
          </a>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginTop: 12 }}>
            New drop
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* ── Basics ── */}
          <Section label="BASICS">
            <Field label="Title *">
              <input value={form.title} onChange={set("title")} placeholder="e.g. Sourdough surplus — Wednesday morning" style={inputStyle} />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={set("description")} rows={3}
                placeholder="What is this drop? What makes it worth showing up for?"
                style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
            <Field label="Photo">
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm(prev => ({ ...prev, imageUrl: url }))} />
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
                Or paste an image URL:
              </p>
              <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." style={{ ...inputStyle, marginTop: 6 }} />
            </Field>
          </Section>

          {/* ── Category + format ── */}
          <Section label="CATEGORY">
            <div style={twoCol}>
              <Field label="Category *">
                <select value={form.category} onChange={set("category")} style={inputStyle}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Format">
                <select value={form.format} onChange={set("format")} style={inputStyle}>
                  <option value="limited_item">Limited item</option>
                  <option value="clearance_discount">Clearance / discount</option>
                  <option value="bundle">Bundle</option>
                  <option value="service_window">Service window</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* ── Pricing + stock ── */}
          <Section label="PRICE & STOCK">
            <div style={twoCol}>
              <Field label="Price (£) *">
                <input
                  value={form.price} onChange={set("price")}
                  type="number" min="0" step="0.01" placeholder="0.00"
                  style={inputStyle}
                />
              </Field>
              <Field label="Total quantity *">
                <input
                  value={form.totalQuantity} onChange={set("totalQuantity")}
                  type="number" min="1" placeholder="10"
                  style={inputStyle}
                />
              </Field>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
              Set price to 0 for a free drop. Quantity controls scarcity — keep it honest.
            </p>
          </Section>

          {/* ── Collection window ── */}
          <Section label="COLLECTION WINDOW">
            <div style={twoCol}>
              <Field label="Opens *">
                <input type="datetime-local" value={form.collectionStart} onChange={set("collectionStart")} style={inputStyle} />
              </Field>
              <Field label="Closes *">
                <input type="datetime-local" value={form.collectionEnd} onChange={set("collectionEnd")} style={inputStyle} />
              </Field>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
              Shoppers collect during this window. Reservations are issued the moment you publish.
            </p>
          </Section>

          {/* ── Location ── */}
          <Section label="COLLECTION ADDRESS">
            <Field label="Address *">
              <input value={form.locationAddress} onChange={set("locationAddress")} placeholder="123 Portobello Road" style={inputStyle} />
            </Field>
            <div style={twoCol}>
              <Field label="City">
                <input value={form.locationCity} onChange={set("locationCity")} placeholder="London" style={inputStyle} />
              </Field>
              <Field label="Postcode">
                <input value={form.locationPostcode} onChange={set("locationPostcode")} placeholder="W11 2DY" style={inputStyle} />
              </Field>
            </div>
            <div style={twoCol}>
              <Field label="Latitude (for map)">
                <input value={form.locationLat} onChange={set("locationLat")} type="number" step="any" placeholder="51.5074" style={inputStyle} />
              </Field>
              <Field label="Longitude (for map)">
                <input value={form.locationLng} onChange={set("locationLng")} type="number" step="any" placeholder="-0.1278" style={inputStyle} />
              </Field>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
              Leave latitude/longitude blank and we'll place your drop on the map automatically from the address and postcode.
            </p>
          </Section>

          {error && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: V }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={handleSubmit}
              disabled={create.isPending}
              style={{
                flex: 1, padding: "15px",
                background: FG, color: BG, border: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 11,
                letterSpacing: "0.12em", cursor: create.isPending ? "not-allowed" : "pointer",
                opacity: create.isPending ? 0.6 : 1,
              }}
            >
              {create.isPending ? "PUBLISHING…" : "PUBLISH DROP"}
            </button>
            <a
              href="/dashboard/drops"
              style={{
                padding: "15px 24px", border: `1px solid ${BORDER}`,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", color: MUTED_FG, textDecoration: "none",
                display: "flex", alignItems: "center",
              }}
            >
              CANCEL
            </a>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
            Publishing immediately notifies your followers and all matched shoppers in your area.
          </p>
        </div>
      </div>
    </DashLayout>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, padding: "24px" }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 20 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
  width: "100%", padding: "10px 14px", boxSizing: "border-box",
  border: `1px solid ${BORDER}`, background: BG, color: FG,
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  outline: "none", appearance: "none",
};
