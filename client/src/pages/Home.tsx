import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import DropMap, { toDropPin } from "../components/DropMap";
import { format } from "date-fns";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

const CATEGORIES = [
  "All", "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
];

type TimeWindow = "now" | "today" | "tomorrow";

export default function Home() {
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | undefined>(undefined);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: drops, isLoading } = trpc.drops.list.useQuery({
    category: category || undefined,
    timeWindow,
    limit: 60,
  });

  const pins = (drops ?? []).map(toDropPin);

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />

      {/* ── Category filter bar ── */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        position: "sticky", top: 56,
        background: BG, zIndex: 90,
      }}>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const active = cat === "All" ? !category : category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat === "All" ? undefined : cat)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  padding: "14px 16px",
                  background: "none", border: "none",
                  borderBottom: active ? `2px solid ${V}` : "2px solid transparent",
                  color: active ? V : MUTED_FG,
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.1s", marginBottom: -1,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Time window + view toggle ── */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 28,
          flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: undefined as TimeWindow | undefined, label: "All drops" },
              { key: "now" as TimeWindow, label: "Live now" },
              { key: "today" as TimeWindow, label: "Today" },
              { key: "tomorrow" as TimeWindow, label: "Tomorrow" },
            ].map(({ key, label }) => (
              <button
                key={label}
                onClick={() => setTimeWindow(key)}
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10, letterSpacing: "0.08em",
                  padding: "8px 16px", cursor: "pointer",
                  border: timeWindow === key ? `1px solid ${FG}` : `1px solid ${BORDER}`,
                  background: timeWindow === key ? FG : BG,
                  color: timeWindow === key ? BG : MUTED_FG,
                  transition: "all 0.1s",
                }}
              >
                {label.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: 1 }}>
              {isLoading ? "..." : `${drops?.length ?? 0} DROPS`}
            </span>

            {/* List / Map toggle */}
            <div style={{ display: "flex", border: `1px solid ${BORDER}` }}>
              {(["list", "map"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10, letterSpacing: "0.08em",
                    padding: "8px 16px", cursor: "pointer", border: "none",
                    background: viewMode === mode ? FG : BG,
                    color: viewMode === mode ? BG : MUTED_FG,
                    transition: "all 0.1s",
                  }}
                >
                  {mode === "list" ? "≡ LIST" : "⊙ MAP"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Map view ── */}
        {viewMode === "map" && (
          <div style={{ border: `1px solid ${BORDER}` }}>
            <DropMap
              drops={pins}
              onDropClick={(id) => navigate(`/drop/${id}`)}
              height="600px"
              zoom={13}
            />
          </div>
        )}

        {/* ── List view ── */}
        {viewMode === "list" && (
          isLoading ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 1, background: BORDER,
            }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: BG, height: 340 }} />
              ))}
            </div>
          ) : drops?.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: MUTED_FG, marginBottom: 12 }}>
                Nothing dropping right now
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG }}>
                Check back soon — drops appear daily.
              </p>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 1, background: BORDER,
            }}>
              {drops?.map(({ drop, business, location }) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  business={business}
                  location={location}
                  onClick={() => navigate(`/drop/${drop.id}`)}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function DropCard({ drop, business, location, onClick }: {
  drop: any; business: any; location: any; onClick: () => void;
}) {
  const now = new Date();
  const start = new Date(drop.collectionStart);
  const end = new Date(drop.collectionEnd);
  const isLive = now >= start && now <= end;
  const total = drop.totalQuantity || 1;
  const pct = Math.round(((total - drop.availableQuantity) / total) * 100);
  const scarce = drop.availableQuantity > 0 && drop.availableQuantity <= 3;

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", background: BG, overflow: "hidden", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = MUTED)}
      onMouseLeave={e => (e.currentTarget.style.background = BG)}
    >
      {/* Image */}
      <div style={{
        height: 200, position: "relative",
        background: drop.imageUrl ? `url(${drop.imageUrl}) center/cover` : MUTED,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {!drop.imageUrl && (
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: MUTED_FG, fontStyle: "italic" }}>
            {business.name}
          </span>
        )}
        {drop.featured && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: FG, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.15em", padding: "4px 8px",
          }}>
            FEATURED
          </div>
        )}
        {isLive && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            display: "flex", alignItems: "center", gap: 5,
            background: BG, padding: "4px 8px", border: `1px solid ${BORDER}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: FG, letterSpacing: 1 }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 20px" }}>
        <p style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase",
        }}>
          {business.name} · {location.address.split(",")[0]}
        </p>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 600, color: FG, lineHeight: 1.25, marginBottom: 12,
        }}>
          {drop.title}
        </h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 16, fontWeight: 700, color: FG }}>
            £{(drop.price / 100).toFixed(2)}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: scarce ? V : MUTED_FG }}>
            {drop.availableQuantity === 0
              ? "Sold out"
              : scarce
              ? `${drop.availableQuantity} left`
              : `${drop.availableQuantity} available`}
          </span>
        </div>

        <div style={{ height: 2, background: BORDER, marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? V : FG }} />
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
          {isLive ? `Until ${format(end, "h:mm a")}` : format(start, "EEE d MMM, h:mm a")}
        </p>
      </div>
    </div>
  );
}
