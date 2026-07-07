import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../trpc";
import { format } from "date-fns";
import DropMap, { toDropPin } from "../components/DropMap";

// Design tokens — Unwrapped Design System
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

export default function Landing() {
  const [, navigate] = useLocation();
    // No CSS breakpoints in this file (everything is inline styles) — track viewport width in JS so the hero grid stacks on narrow screens instead of overflowing.
    const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);
    useEffect(() => {
          const onResize = () => setIsMobile(window.innerWidth < 640);
          window.addEventListener("resize", onResize);
          return () => window.removeEventListener("resize", onResize);
    }, []);

  const { data: drops, isLoading: dropsLoading } = trpc.drops.list.useQuery({ limit: 60, timeWindow: undefined });

  const liveDrops = drops?.filter(({ drop }) => {
    const now = new Date();
    return new Date(drop.collectionStart) <= now && new Date(drop.collectionEnd) >= now;
  }) ?? [];

  const endingSoon = liveDrops
    .filter(({ drop }) => drop.availableQuantity > 0)
    .sort((a, b) => new Date(a.drop.collectionEnd).getTime() - new Date(b.drop.collectionEnd).getTime())
    .slice(0, 1)[0];

  const dropCount = liveDrops.length;
  const endingInHour = liveDrops.filter(({ drop }) => {
    const end = new Date(drop.collectionEnd);
    return end.getTime() - Date.now() < 60 * 60 * 1000;
  }).length;

  const today = format(new Date(), "EEE d MMM yyyy").toUpperCase();

  return (
    <div style={{ background: BG, color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Masthead nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 40px", borderBottom: `1px solid ${BORDER}`,
      }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: MUTED_FG, letterSpacing: "0.12em",
        }}>
          LONDON · {today}
        </span>

        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22,
          fontWeight: 700, color: FG, letterSpacing: "-0.5px",
        }}>
          Unwrapped
        </span>

        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <a href="/business-apply" style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: MUTED_FG, textDecoration: "none",
          }}>
            List your business
          </a>
          <a href="/signin" style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: FG, letterSpacing: "0.08em",
            border: `1px solid ${FG}`, padding: "8px 16px",
            textDecoration: "none",
          }}>
            SIGN IN
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: isMobile ? "40px 20px 0" : "56px 40px 0",
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px",
          gap: isMobile ? 32 : 48, alignItems: isMobile ? "stretch" : "end",
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "clamp(72px, 10vw, 108px)",
            fontWeight: 700, color: FG,
            lineHeight: 1, letterSpacing: "-5px", marginBottom: 8,
          }}>
            {dropCount || "—"}
          </div>

          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(20px, 2.5vw, 28px)",
            fontStyle: "italic", color: FG,
            lineHeight: 1.35, marginBottom: 28, maxWidth: 440,
          }}>
            things dropping near you right now.<br />
            <span style={{ fontSize: "0.75em", color: MUTED_FG }}>Limited. Local. Gone when they're gone.</span>
          </div>

          {endingInHour > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 36 }}>
              <span style={{
                width: 6, height: 6, borderRadius: "50%",
                background: V, display: "inline-block",
              }} />
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: V, letterSpacing: "0.1em",
              }}>
                {endingInHour} ending in the next hour
              </span>
            </div>
          )}

          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            marginTop: endingInHour > 0 ? 0 : 36,
          }}>
            <button
              onClick={() => navigate("/signin")}
              style={{
                background: FG, color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "13px 28px",
                border: "none", cursor: "pointer",
              }}
            >
              SEE ALL DROPS
            </button>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
              Free to browse. Sign up for drop alerts.
            </span>
          </div>
        </div>

        {/* Featured card */}
        {endingSoon ? (
          <FeaturedDropCard
            drop={endingSoon.drop}
            business={endingSoon.business}
            location={endingSoon.location}
            onClick={() => navigate(`/drop/${endingSoon.drop.id}`)}
          />
        ) : (
          <PlaceholderFeaturedCard />
        )}
      </section>

      {/* ── Drop grid ── */}
      <section style={{ marginTop: 56 }}>
        <div style={{
          padding: "0 40px 20px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.15em",
          }}>
            TODAY'S DROPS
          </span>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0, background: BORDER,
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {dropsLoading
            ? [0, 1, 2].map(i => <SkeletonCard key={i} />)
            : drops && drops.length > 0
            ? drops.slice(0, 3).map(({ drop, business, location }) => (
                <GridDropCard
                  key={drop.id}
                  drop={drop}
                  business={business}
                  location={location}
                  onClick={() => navigate(`/drop/${drop.id}`)}
                />
              ))
            : (
              <div style={{ gridColumn: "1 / -1", background: BG, padding: "56px 40px", textAlign: "center" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: MUTED_FG, marginBottom: 8 }}>
                  Nothing dropping right now
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>
                  Check back soon — drops appear daily.
                </p>
              </div>
            )
          }
        </div>

        <div style={{ padding: "20px 40px", borderBottom: `1px solid ${BORDER}` }}>
          <button
            onClick={() => navigate("/signin")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG,
              padding: 0, borderBottom: `1px solid ${FG}`, paddingBottom: 1,
            }}
          >
            {drops && drops.length > 3 ? `${drops.length - 3} more drops today →` : "Browse all drops →"}
          </button>
        </div>
      </section>

      {/* ── Map section ── */}
      <MapSection drops={drops ?? []} onDropClick={(id) => navigate(`/drop/${id}`)} />

      {/* ── Business pitch — all warm cream ── */}
      <section style={{
        padding: "72px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 80, alignItems: "center",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 20,
          }}>
            FOR BUSINESSES
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 3.5vw, 40px)",
            fontWeight: 700, color: FG,
            lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 20,
          }}>
            Create a moment.<br />
            <em style={{ fontStyle: "italic" }}>We bring</em>{" "}
            <em style={{ fontStyle: "italic", color: V }}>your neighbourhood to you.</em>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.7,
            marginBottom: 36, maxWidth: 360,
          }}>
            Publish a drop in minutes. Unwrapped notifies the right people — those in your
            area who already love what you do. They reserve. They show up. You build a following
            that comes back.
          </p>

          <a
            href="/business-apply"
            style={{
              border: `1px solid ${FG}`, color: FG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "13px 24px",
              textDecoration: "none", display: "inline-block",
            }}
          >
            APPLY TO LIST YOUR BUSINESS
          </a>
        </div>

        {/* Business value props — editorial, no financials */}
        <div style={{ border: `1px solid ${BORDER}` }}>
          {[
            {
              label: "Notify the right people",
              body: "We match your drop to shoppers in your area who already care about what you offer. They get an alert. You get a queue.",
              shade: BG,
            },
            {
              label: "Build a loyal following",
              body: "Every person who reserves becomes someone who knows your name. Follow your business. Come back next time.",
              shade: MUTED,
            },
            {
              label: "Your drop, your terms",
              body: "You set the window, the quantity, the experience. Unwrapped handles the rest — reservations, QR check-in, payouts.",
              shade: MUTED,
            },
          ].map(({ label, body, shade }, i) => (
            <div
              key={label}
              style={{
                padding: "24px 28px", background: shade,
                borderBottom: i < 2 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 16, fontWeight: 600, color: FG, marginBottom: 8,
              }}>
                {label}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.6 }}>
                {body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: "64px 40px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 40,
        }}>
          HOW IT WORKS
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: 0, background: BORDER,
        }}>
          {[
            {
              n: "01",
              title: "Discover what's dropping",
              body: "Browse time-limited drops from independent shops, cafés, studios, and makers near you. Updated constantly. Each one is unique to that moment.",
            },
            {
              n: "02",
              title: "Reserve before it's gone",
              body: "Tap to claim your spot. Your ticket is issued instantly — only as many as the business decides to release.",
            },
            {
              n: "03",
              title: "Show up. QR. Done.",
              body: "Arrive in the collection window. The business scans your code. The drop is yours.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ background: BG, padding: "36px 32px" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11, color: V, letterSpacing: "0.1em", marginBottom: 16,
              }}>
                {n}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 600, color: FG,
                marginBottom: 12, lineHeight: 1.25,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, color: MUTED_FG, lineHeight: 1.65,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "20px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: FG }}>
          Unwrapped
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          {["Privacy", "Terms", "Contact"].map(l => (
            <a key={l} href="#" style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, color: MUTED_FG, textDecoration: "none",
            }}>
              {l}
            </a>
          ))}
        </div>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em" }}>
          © 2026 UNWRAPPED
        </span>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function FeaturedDropCard({ drop, business, location, onClick }: {
  drop: any; business: any; location: any; onClick: () => void;
}) {
  const end = new Date(drop.collectionEnd);
  const total = drop.totalQuantity || 1;
  const pct = Math.round(((total - drop.availableQuantity) / total) * 100);

  return (
    <div
      onClick={onClick}
      style={{ border: `1px solid ${BORDER}`, background: MUTED, padding: 20, cursor: "pointer" }}
    >
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: V, letterSpacing: "0.15em", marginBottom: 12,
      }}>
        ENDING SOONEST
      </div>

      <div style={{
        height: 140, marginBottom: 14,
        background: drop.imageUrl ? `url(${drop.imageUrl}) center/cover` : BORDER,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {!drop.imageUrl && (
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: MUTED_FG, fontStyle: "italic" }}>
            {business.name}
          </span>
        )}
      </div>

      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: FG, marginBottom: 4, lineHeight: 1.3 }}>
        {drop.title}
      </div>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginBottom: 14 }}>
        {business.name} · until {format(end, "h:mm a")}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: FG }}>
          £{(drop.price / 100).toFixed(2)}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: drop.availableQuantity <= 3 ? V : MUTED_FG }}>
          {drop.availableQuantity <= 3 ? `${drop.availableQuantity} left` : `${drop.availableQuantity} available`}
        </span>
      </div>

      <div style={{ height: 2, background: BORDER }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? V : FG }} />
      </div>
    </div>
  );
}

function PlaceholderFeaturedCard() {
  return (
    <div style={{ border: `1px solid ${BORDER}`, background: MUTED, padding: 20 }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
        ENDING SOONEST
      </div>
      <div style={{ background: BORDER, height: 140, marginBottom: 14 }} />
      <div style={{ background: BORDER, height: 16, width: "70%", marginBottom: 8 }} />
      <div style={{ background: BORDER, height: 12, width: "45%", marginBottom: 14 }} />
      <div style={{ background: BORDER, height: 2 }} />
    </div>
  );
}

function GridDropCard({ drop, business, location, onClick }: {
  drop: any; business: any; location: any; onClick: () => void;
}) {
  const now = new Date();
  const start = new Date(drop.collectionStart);
  const end = new Date(drop.collectionEnd);
  const isLive = now >= start && now <= end;
  const total = drop.totalQuantity || 1;
  const pct = Math.round(((total - drop.availableQuantity) / total) * 100);

  return (
    <div
      onClick={onClick}
      style={{ background: BG, padding: 20, cursor: "pointer", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = MUTED)}
      onMouseLeave={e => (e.currentTarget.style.background = BG)}
    >
      <div style={{
        height: 160, marginBottom: 14, position: "relative",
        background: drop.imageUrl ? `url(${drop.imageUrl}) center/cover` : MUTED,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        {!drop.imageUrl && (
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: MUTED_FG, fontStyle: "italic" }}>
            {business.name}
          </span>
        )}
        {isLive && (
          <div style={{
            position: "absolute", top: 10, right: 10,
            display: "flex", alignItems: "center", gap: 5,
            background: BG, padding: "3px 7px", border: `1px solid ${BORDER}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: FG, letterSpacing: 1 }}>LIVE</span>
          </div>
        )}
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
        {drop.category} · {location.address.split(",")[0]}
      </div>

      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: FG, marginBottom: 10, lineHeight: 1.3 }}>
        {drop.title}
      </h3>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: FG }}>
          £{(drop.price / 100).toFixed(2)}
        </span>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: pct > 80 ? V : MUTED_FG, marginBottom: 4 }}>
        {drop.availableQuantity === 0
          ? "Sold out"
          : isLive
          ? `Until ${format(end, "h:mm a")} · ${drop.availableQuantity} left`
          : format(start, "EEE d MMM, h:mm a")
        }
      </div>

      <div style={{ height: 2, background: BORDER }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? V : FG }} />
      </div>
    </div>
  );
}

function MapSection({ drops, onDropClick }: { drops: any[]; onDropClick: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 51.509865, lng: -0.118092 });

  const pins = useMemo(() => drops.map(toDropPin), [drops]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ", London, UK")}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await resp.json();
      if (data[0]) {
        setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      }
    } catch {
      // silently ignore network errors
    }
  }

  return (
    <section style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      {/* Header + search */}
      <div style={{
        padding: "24px 40px",
        display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: `1px solid ${BORDER}`,
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.15em",
          }}>
            DROPS ON THE MAP
          </span>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            color: MUTED_FG, marginTop: 4,
          }}>
            {pins.length} drops visible · click a pin to preview
          </p>
        </div>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: 0 }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search an area or postcode…"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              padding: "10px 16px", border: `1px solid ${BORDER}`,
              borderRight: "none", background: BG, color: FG,
              outline: "none", width: 260,
            }}
          />
          <button type="submit" style={{
            background: FG, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            letterSpacing: "0.08em", padding: "10px 20px",
            border: "none", cursor: "pointer",
          }}>
            GO
          </button>
        </form>
      </div>

      <DropMap
        drops={pins}
        onDropClick={onDropClick}
        defaultLat={mapCenter.lat}
        defaultLng={mapCenter.lng}
        zoom={13}
        height="480px"
      />
    </section>
  );
}

function SkeletonCard() {
  return (
    <div style={{ background: BG, padding: 20 }}>
      <div style={{ background: MUTED, height: 160, marginBottom: 14 }} />
      <div style={{ background: MUTED, height: 10, width: "40%", marginBottom: 8 }} />
      <div style={{ background: MUTED, height: 16, width: "75%", marginBottom: 10 }} />
      <div style={{ background: MUTED, height: 12, width: "30%", marginBottom: 8 }} />
      <div style={{ background: MUTED, height: 2 }} />
    </div>
  );
}
