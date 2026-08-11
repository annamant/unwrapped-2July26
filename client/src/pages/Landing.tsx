import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "../trpc";
import DropMap, { toDropPin } from "../components/DropMap";
import DropPrice from "../components/DropPrice";
import useIsMobile from "../hooks/useIsMobile";
import { checkoutFromList, discountPercent } from "../lib/fees";

// Design tokens — Unwrapped Design System
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

/** Flip to false when real drops go live and the landing should show the live feed again. */
const PRE_LAUNCH = true;

type SampleDrop = {
  category: string;
  neighbourhood: string;
  title: string;
  business: string;
  /** Checkout price in pence (what shoppers pay). */
  pricePence: number;
  /** Original list price in pence, for bundle / discount examples. */
  originalPricePence?: number;
  window: string;
  left: string;
  imageUrl: string;
};

const SAMPLE_DROPS: SampleDrop[] = [
  {
    category: "Food & Drink",
    neighbourhood: "Hackney",
    title: "Morning bake — country loaf",
    business: "River Oven Bakery",
    pricePence: 450,
    window: "Example window · Sat morning",
    left: "e.g. 6 available",
    imageUrl: "/samples/sourdough.jpg",
  },
  {
    category: "Fashion & Retail",
    neighbourhood: "Shoreditch",
    title: "Weekend edit — 3-piece clothing bundle",
    business: "North Lane Boutique",
    pricePence: checkoutFromList(10800),
    originalPricePence: 12000,
    window: "Example window · Sat–Sun",
    left: "e.g. 8 bundles",
    imageUrl: "/samples/clothing.jpg",
  },
  {
    category: "Food & Drink",
    neighbourhood: "Bermondsey",
    title: "Early supper — two courses + drink",
    business: "Fig & Thyme Kitchen",
    pricePence: checkoutFromList(6800),
    originalPricePence: 8000,
    window: "Example window · Tue–Thu 5–7pm",
    left: "e.g. 12 covers",
    imageUrl: "/samples/restaurant.jpg",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Clapham",
    title: "Express blow-dry — afternoon slots",
    business: "Marlow Hair Studio",
    pricePence: 2800,
    window: "Example window · same day",
    left: "e.g. 4 spots",
    imageUrl: "/samples/blowdry.jpg",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Islington",
    title: "45-min personal training",
    business: "Jordan Ellis PT",
    pricePence: 3500,
    window: "Example window · weekday evening",
    left: "e.g. 3 spots",
    imageUrl: "/samples/pt.jpg",
  },
];

const BUSINESS_TYPES = [
  "Charity shops",
  "Restaurants",
  "Salons",
  "Cafés",
  "Bakeries",
  "Freelancers",
  "Accountants",
  "Trainers",
  "Boutiques",
  "Studios",
  "Florists",
];

const LANDING_CSS = `
@keyframes uw-fade-up {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes uw-pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.35); opacity: 0.55; }
}
@keyframes uw-map-drift {
  0% { transform: scale(1.08) translate(0, 0); }
  50% { transform: scale(1.12) translate(-1.2%, -0.6%); }
  100% { transform: scale(1.08) translate(0, 0); }
}
@keyframes uw-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.uw-fade-1 { animation: uw-fade-up 0.7s ease both; }
.uw-fade-2 { animation: uw-fade-up 0.7s ease 0.12s both; }
.uw-fade-3 { animation: uw-fade-up 0.7s ease 0.24s both; }
.uw-fade-4 { animation: uw-fade-up 0.7s ease 0.36s both; }
.uw-hero-map { animation: uw-map-drift 28s ease-in-out infinite; }
.uw-pulse-dot { animation: uw-pulse-dot 2.2s ease-in-out infinite; }
.uw-marquee-track {
  display: flex;
  width: max-content;
  animation: uw-marquee 28s linear infinite;
}
.uw-marquee-track:hover { animation-play-state: paused; }
.uw-btn-primary {
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.uw-btn-primary:hover {
  background: ${V} !important;
  color: ${BG} !important;
  transform: translateY(-1px);
}
.uw-btn-ghost {
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, color 0.2s ease;
}
.uw-btn-ghost:hover {
  border-color: ${FG} !important;
  background: ${MUTED} !important;
  transform: translateY(-1px);
}
.uw-btn-ghost-dark:hover {
  border-color: ${BG} !important;
  background: rgba(250,250,248,0.1) !important;
  color: ${BG} !important;
  transform: translateY(-1px);
}
.uw-link {
  transition: color 0.15s ease;
}
.uw-link:hover { color: ${FG} !important; }
.uw-sample-card {
  transition: background 0.25s ease;
}
.uw-sample-card:hover { background: ${MUTED} !important; }
.uw-sample-img {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.uw-sample-card:hover .uw-sample-img {
  transform: scale(1.04);
}
.uw-step {
  transition: background 0.25s ease;
}
.uw-step:hover { background: ${MUTED} !important; }
@media (prefers-reduced-motion: reduce) {
  .uw-fade-1, .uw-fade-2, .uw-fade-3, .uw-fade-4,
  .uw-hero-map, .uw-pulse-dot, .uw-marquee-track { animation: none !important; }
  .uw-sample-img, .uw-btn-primary, .uw-btn-ghost { transition: none !important; }
}
`;

export default function Landing() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const today = format(new Date(), "EEE d MMM yyyy").toUpperCase();
  const [scrolled, setScrolled] = useState(false);

  const { data: drops } = trpc.drops.list.useQuery({ limit: 60, timeWindow: undefined });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ background: BG, color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{LANDING_CSS}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "12px 20px" : "16px 40px",
        borderBottom: `1px solid ${scrolled ? BORDER : "transparent"}`,
        background: scrolled ? "rgba(250,250,248,0.92)" : BG,
        backdropFilter: scrolled ? "blur(10px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(10px)" : "none",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}>
        {!isMobile && (
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: MUTED_FG, letterSpacing: "0.12em", minWidth: 180,
          }}>
            LONDON · {today}
          </span>
        )}

        <a href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none", color: FG,
          position: isMobile ? "static" : "absolute",
          left: isMobile ? undefined : "50%",
          transform: isMobile ? undefined : "translateX(-50%)",
        }}>
          <img src="/logo-mark.svg" alt="" width={28} height={28} style={{ display: "block", flexShrink: 0 }} />
          <span style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22,
            fontWeight: 700, letterSpacing: "-0.5px",
          }}>
            Unwrapped
          </span>
        </a>

        <div style={{ display: "flex", gap: isMobile ? 14 : 24, alignItems: "center", marginLeft: "auto" }}>
          <a
            href="https://www.instagram.com/shopunwrapped/"
            target="_blank"
            rel="noopener noreferrer"
            className="uw-link"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}
          >
            Instagram
          </a>
          <a
            href="/business-apply"
            className="uw-link"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}
          >
            {isMobile ? "Business" : "List your business"}
          </a>
          <a
            href="/recommend"
            className="uw-link"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, textDecoration: "none" }}
          >
            {isMobile ? "Recommend" : "Recommend a shop"}
          </a>
          <a
            href="/signin"
            className="uw-btn-ghost"
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              color: FG, letterSpacing: "0.08em",
              border: `1px solid ${FG}`, padding: "8px 16px",
              textDecoration: "none", background: "transparent",
            }}
          >
            SIGN IN
          </a>
        </div>
      </nav>

      {/* ── 1. HERO — understand + act ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div
            className="uw-hero-map"
            style={{
              position: "absolute", inset: "-6%",
              backgroundImage: "url(/email-london-map.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 42%",
              opacity: 0.2,
              filter: "grayscale(0.4) contrast(0.95) brightness(1.08)",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: `
              linear-gradient(180deg, ${BG} 0%, rgba(250,250,248,0.78) 30%, rgba(250,250,248,0.94) 72%, ${BG} 100%),
              radial-gradient(ellipse 50% 45% at 90% 40%, rgba(232,52,28,0.05), transparent 55%)
            `,
          }} />
        </div>

        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(300px, 0.7fr)",
          gap: isMobile ? 24 : 16,
          alignItems: "end",
          padding: isMobile ? "44px 20px 36px" : "56px 40px 52px",
        }}>
          <div>
            <div
              className="uw-fade-1"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: V, letterSpacing: "0.14em", marginBottom: 20,
              }}
            >
              <span
                className="uw-pulse-dot"
                style={{ width: 7, height: 7, borderRadius: "50%", background: V, display: "inline-block", flexShrink: 0 }}
              />
              LONDON · PRE-LAUNCH · BUSINESSES BOARDING NOW
            </div>

            <h1
              className="uw-fade-2"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(40px, 6.5vw, 78px)",
                fontWeight: 700, color: FG,
                lineHeight: 1.02, letterSpacing: "-2px",
                marginBottom: 20,
              }}
            >
              Limited local drops.
              <br />
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>Reserved in seconds.</em>
            </h1>

            <p
              className="uw-fade-3"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 16 : 17,
                color: FG, lineHeight: 1.55, marginBottom: 28, fontWeight: 400,
                maxWidth: 520,
              }}
            >
              Unwrapped is where shops, restaurants, cafés,
              salons, freelancers, services, and{" "}
              <em style={{ fontStyle: "italic" }}>charities</em>
              {" "}(we love them) release time-limited drops. You reserve, then collect with a QR code.
            </p>

            <div
              className="uw-fade-4"
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 12,
                maxWidth: isMobile ? "100%" : 560,
              }}
            >
              <div style={{
                flex: 1,
                border: `1px solid ${FG}`,
                background: FG,
                color: BG,
                padding: "18px 18px 20px",
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  letterSpacing: "0.12em", color: "rgba(250,250,248,0.5)", marginBottom: 8,
                }}>
                  FOR SHOPPERS
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600,
                  marginBottom: 14, lineHeight: 1.25,
                }}>
                  Be ready when drops start
                </div>
                <button
                  onClick={() => navigate("/signin")}
                  className="uw-btn-primary"
                  style={{
                    background: V, color: BG,
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "12px 18px",
                    border: "none", cursor: "pointer", width: "100%",
                  }}
                >
                  SIGN UP — BE READY
                </button>
              </div>

              <div style={{
                flex: 1,
                border: `1px solid ${BORDER}`,
                background: BG,
                padding: "18px 18px 20px",
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  letterSpacing: "0.12em", color: V, marginBottom: 8,
                }}>
                  FOR BUSINESSES
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600,
                  color: FG, marginBottom: 14, lineHeight: 1.25,
                }}>
                  Get on the map
                </div>
                <a
                  href="/business-apply"
                  className="uw-btn-ghost"
                  style={{
                    border: `1px solid ${FG}`, color: FG,
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "11px 18px",
                    textDecoration: "none", display: "block", textAlign: "center",
                    background: "transparent",
                  }}
                >
                  LIST YOUR BUSINESS
                </a>
              </div>
            </div>
          </div>

          {/* Tiny mock London map — fades into space */}
          <div
            className="uw-fade-3"
            aria-hidden
            style={{
              position: "relative",
              overflow: "hidden",
              height: isMobile ? 220 : 340,
              marginRight: isMobile ? 0 : -12,
              maskImage: "radial-gradient(ellipse 95% 88% at 42% 50%, black 42%, transparent 82%)",
              WebkitMaskImage: "radial-gradient(ellipse 95% 88% at 42% 50%, black 42%, transparent 82%)",
            }}
          >
            <img
              src="/email-london-map.jpg"
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "35% 45%",
                opacity: 0.95,
                filter: "grayscale(0.05) contrast(1.02) brightness(1.02)",
                transform: "scale(1.08)",
              }}
            />
            {[
              { top: "26%", left: "32%" },
              { top: "40%", left: "46%" },
              { top: "54%", left: "56%" },
              { top: "34%", left: "62%" },
            ].map((pos, i) => (
              <span
                key={i}
                className="uw-pulse-dot"
                style={{
                  position: "absolute",
                  top: pos.top,
                  left: pos.left,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: V,
                  border: `2px solid ${BG}`,
                  boxShadow: "0 2px 6px rgba(20,18,16,0.2)",
                  animationDelay: `${i * 0.35}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div
          className="uw-fade-4"
          style={{
            position: "relative",
            borderTop: `1px solid ${BORDER}`,
            background: "rgba(250,250,248,0.94)",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: `linear-gradient(90deg, ${BG}, transparent)`, pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 40, zIndex: 1,
            background: `linear-gradient(270deg, ${BG}, transparent)`, pointerEvents: "none",
          }} />
          <div className="uw-marquee-track" aria-hidden>
            {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((type, i) => (
              <div
                key={`${type}-${i}`}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "14px 24px", whiteSpace: "nowrap",
                  borderRight: `1px solid ${BORDER}`,
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: type === "Charity shops" ? V : FG,
                  display: "inline-block", flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: type === "Charity shops" ? "'Playfair Display', serif" : "'Space Mono', monospace",
                  fontSize: type === "Charity shops" ? 14 : 11,
                  fontStyle: type === "Charity shops" ? "italic" : "normal",
                  fontWeight: type === "Charity shops" ? 600 : 400,
                  color: type === "Charity shops" ? V : FG,
                  letterSpacing: type === "Charity shops" ? "0" : "0.08em",
                }}>
                  {type === "Charity shops" ? "Charity shops — we love them" : type.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. WHY YOU MATTER — belonging + convert ── */}
      {PRE_LAUNCH && (
        <section style={{
          padding: isMobile ? "44px 20px" : "64px 40px",
          borderBottom: `1px solid ${BORDER}`,
          background: `linear-gradient(135deg, ${MUTED} 0%, ${BG} 55%, rgba(232,52,28,0.03) 100%)`,
        }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: V, letterSpacing: "0.14em", marginBottom: 14,
            }}>
              WHY WE NEED YOU
            </div>
            <div style={{ width: 40, height: 3, background: V, marginBottom: 24 }} />

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 28 : 40,
              fontWeight: 700, color: FG, lineHeight: 1.15,
              letterSpacing: "-0.8px", marginBottom: 20, maxWidth: 640,
            }}>
              We're not live yet — and that's exactly why{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>you</em> matter.
            </h2>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17,
              color: FG, lineHeight: 1.7, marginBottom: 16, maxWidth: 580, fontWeight: 300,
            }}>
              Unwrapped only works if shoppers and neighbourhood businesses build it together.
              Shoppers who sign up now aren't waiting on the sidelines — you're the first we'll tell
              when drops go live. Businesses boarding now aren't buying a finished product —
              you're making the drops happen.
            </p>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 15,
              color: MUTED_FG, lineHeight: 1.65, marginBottom: 28, maxWidth: 540,
            }}>
              We need you. This only becomes real if you're in it with us.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/signin")}
                className="uw-btn-primary"
                style={{
                  background: FG, color: BG,
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  letterSpacing: "0.1em", padding: "13px 24px",
                  border: "none", cursor: "pointer",
                }}
              >
                JOIN AS A SHOPPER
              </button>
              <a
                href="/business-apply"
                className="uw-btn-ghost"
                style={{
                  border: `1px solid ${FG}`, color: FG,
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  letterSpacing: "0.1em", padding: "12px 22px",
                  textDecoration: "none", display: "inline-block", background: "transparent",
                }}
              >
                JOIN AS A BUSINESS
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. SAMPLES — desire ── */}
      <section>
        <div style={{ padding: isMobile ? "40px 20px 24px" : "56px 40px 28px" }}>
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, marginBottom: 14,
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9,
                color: V, letterSpacing: "0.15em", marginBottom: 12,
              }}>
                EXAMPLE DROPS · ILLUSTRATIVE
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? 28 : 36,
                fontWeight: 700, color: FG, letterSpacing: "-0.8px",
                lineHeight: 1.15, maxWidth: 520,
              }}>
                This is what a drop will look like.
              </h2>
            </div>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: MUTED_FG, letterSpacing: "0.12em",
              border: `1px solid ${BORDER}`, padding: "8px 12px",
            }}>
              NOT LIVE YET
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.65, maxWidth: 620,
          }}>
            Mock listings only — fictional shops, so you can see the product.
            Services, bundles, and discounted drops all work the same way.
            Nothing here can be reserved yet.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 1, background: BORDER,
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {SAMPLE_DROPS.map((sample) => (
            <SampleDropCard key={sample.title} sample={sample} compact={!isMobile} />
          ))}
        </div>
      </section>

      {/* ── 4. HOW IT WORKS — reassure ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "72px 40px",
        borderBottom: `1px solid ${BORDER}`,
        background: MUTED,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12,
        }}>
          HOW IT WORKS
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 28 : 36,
          fontWeight: 700, color: FG, letterSpacing: "-0.8px",
          lineHeight: 1.15, marginBottom: 36,
        }}>
          Three steps. That's it.
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 16 : 0,
        }}>
          {[
            {
              n: "01",
              title: "Discover what's dropping",
              body: "Browse time-limited drops from local businesses near you.",
            },
            {
              n: "02",
              title: "Reserve before it's gone",
              body: "Tap to reserve. Your ticket is issued instantly — limited quantity.",
            },
            {
              n: "03",
              title: "Show up. QR. Done.",
              body: "Arrive in the window. They scan your code. The drop is yours.",
            },
          ].map(({ n, title, body }, i) => (
            <div
              key={n}
              className="uw-step"
              style={{
                background: BG,
                padding: isMobile ? "24px 22px" : "36px 32px",
                border: isMobile ? `1px solid ${BORDER}` : undefined,
                borderTop: !isMobile ? `1px solid ${BORDER}` : undefined,
                borderBottom: !isMobile ? `1px solid ${BORDER}` : undefined,
                borderLeft: !isMobile && i === 0 ? `1px solid ${BORDER}` : undefined,
                borderRight: !isMobile ? `1px solid ${BORDER}` : undefined,
              }}
            >
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 42, fontWeight: 700, color: V,
                opacity: 0.2, lineHeight: 1, marginBottom: 16, letterSpacing: "-2px",
              }}>
                {n}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 20, fontWeight: 600, color: FG,
                marginBottom: 10, lineHeight: 1.25,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, color: MUTED_FG, lineHeight: 1.65, fontWeight: 300,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. FOR BUSINESSES — dedicated convert ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "72px 40px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
        gap: isMobile ? 36 : 64,
        alignItems: "center",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 16,
          }}>
            FOR BUSINESSES · BOARDING NOW
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(28px, 3.6vw, 42px)",
            fontWeight: 700, color: FG,
            lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 18,
          }}>
            We come to your shop.
            <br />
            <em style={{ fontStyle: "italic", color: V }}>We do the curation for you.</em>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.7, marginBottom: 14, maxWidth: 440, fontWeight: 300,
          }}>
            A curator and photographer visit you, choose one carefully selected item,
            photograph it, and write its story. We put it in front of our weekly drop list.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.7, marginBottom: 28, maxWidth: 420, fontWeight: 300,
          }}>
            You do nothing. First drop free.
          </p>

          <a
            href="/business-apply"
            className="uw-btn-primary"
            style={{
              background: FG, color: BG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "15px 28px",
              textDecoration: "none", display: "inline-block", border: "none",
            }}
          >
            APPLY TO LIST YOUR BUSINESS
          </a>
        </div>

        <div style={{ border: `1px solid ${BORDER}`, boxShadow: `8px 8px 0 ${MUTED}` }}>
          {[
            {
              label: "We photograph it",
              body: "A photographer comes to your shop and shoots one item — properly, on-site.",
            },
            {
              label: "We write it",
              body: "A curator writes the story behind the item — why it's worth a drop.",
            },
            {
              label: "We put it in front of our audience",
              body: "Your drop goes to our weekly drop list. You do nothing. First drop free.",
            },
          ].map(({ label, body }, i) => (
            <div
              key={label}
              style={{
                padding: isMobile ? "22px 20px" : "26px 28px",
                background: i === 1 ? MUTED : BG,
                borderBottom: i < 2 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: V, letterSpacing: "0.1em", marginBottom: 8,
              }}>
                0{i + 1}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 20,
                fontWeight: 700, color: FG, marginBottom: 8, letterSpacing: "-0.3px",
              }}>
                {label}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: MUTED_FG, lineHeight: 1.65, fontWeight: 300, margin: 0,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5b. RECOMMEND A SHOP — neighbourhood nominations ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "64px 40px",
        borderBottom: `1px solid ${BORDER}`,
        background: MUTED,
      }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 16,
          }}>
            FOR NEIGHBOURS · NOMINATE
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(26px, 3.4vw, 38px)",
            fontWeight: 700, color: FG,
            lineHeight: 1.15, letterSpacing: "-0.8px", marginBottom: 16,
          }}>
            Know a shop you'd really love on Unwrapped?
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.7, marginBottom: 28, maxWidth: 520, fontWeight: 300,
          }}>
            Recommend a café, salon, florist, restaurant, or neighbourhood spot.
            We'll reach out and let them know someone selected them — you don't need to own the business to nominate it.
          </p>
          <a
            href="/recommend"
            className="uw-btn-primary"
            style={{
              background: FG, color: BG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "15px 28px",
              textDecoration: "none", display: "inline-block", border: "none",
            }}
          >
            RECOMMEND A SHOP
          </a>
        </div>
      </section>

      {/* ── 6. MAP — London is real ── */}
      <MapSection
        drops={drops ?? []}
        onDropClick={(id) => navigate(`/drop/${id}`)}
      />

      {/* ── 7. CLOSE — final convert ── */}
      <section style={{
        padding: isMobile ? "56px 20px" : "80px 40px",
        background: FG,
        color: BG,
        position: "relative",
        overflow: "hidden",
      }}>
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0,
            background: `
              radial-gradient(ellipse 50% 80% at 100% 0%, rgba(232,52,28,0.22), transparent 55%),
              radial-gradient(ellipse 40% 60% at 0% 100%, rgba(232,52,28,0.1), transparent 50%)
            `,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 640 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 16,
          }}>
            TWO WAYS IN
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(30px, 4.2vw, 48px)",
            fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.2px",
            marginBottom: 16,
          }}>
            Be here when London{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>unwraps.</em>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: "rgba(250,250,248,0.62)", lineHeight: 1.65,
            marginBottom: 32, maxWidth: 440, fontWeight: 300,
          }}>
            Shoppers: get on the list. Businesses: get on the map.
            Either way — don't wait for launch to join.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/signin")}
              className="uw-btn-primary"
              style={{
                background: V, color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "15px 28px",
                border: "none", cursor: "pointer",
              }}
            >
              SIGN UP AS A SHOPPER
            </button>
            <a
              href="/business-apply"
              className="uw-btn-ghost uw-btn-ghost-dark"
              style={{
                border: "1px solid rgba(250,250,248,0.35)", color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "14px 24px",
                textDecoration: "none", display: "inline-block", background: "transparent",
              }}
            >
              LIST YOUR BUSINESS
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: isMobile ? "32px 20px 28px" : "44px 40px 32px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr",
        gap: isMobile ? 28 : 40,
        background: BG,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src="/logo-mark.svg" alt="" width={24} height={24} style={{ display: "block", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: FG }}>
              Unwrapped
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.65, maxWidth: 280, fontWeight: 300,
          }}>
            Limited local drops, reserved in seconds. Collect with QR.
          </p>
        </div>

        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 14,
          }}>
            EXPLORE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Sign in", href: "/signin" },
              { label: "List your business", href: "/business-apply" },
              { label: "Recommend a shop", href: "/recommend" },
              { label: "Resources", href: "/resources" },
              { label: "Instagram", href: "https://www.instagram.com/shopunwrapped/", external: true },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="uw-link"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 14,
          }}>
            LEGAL
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "mailto:anna@shopunwrapped.com" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="uw-link"
                style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, textDecoration: "none" }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          gridColumn: isMobile ? "auto" : "1 / -1",
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 18,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em" }}>
            © 2026 UNWRAPPED · LONDON
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em" }}>
            SHOPUNWRAPPED.COM
          </span>
        </div>
      </footer>
    </div>
  );
}

function MapSection({ drops, onDropClick }: { drops: any[]; onDropClick: (id: string) => void }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 51.509865, lng: -0.118092 });
  const [focused, setFocused] = useState(false);

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
    <section style={{ borderBottom: `1px solid ${BORDER}` }}>
      <div style={{
        padding: isMobile ? "28px 20px" : "40px 40px 28px",
        display: "flex", justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "flex-end",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12,
          }}>
            LONDON · GETTING READY
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 26 : 32,
            fontWeight: 700, color: FG, letterSpacing: "-0.6px",
            lineHeight: 1.15, marginBottom: 8,
          }}>
            Pin by pin.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.6, maxWidth: 420, fontWeight: 300,
          }}>
            {pins.length === 0
              ? "No live drops yet. When businesses launch, their pins show up here."
              : `${pins.length} drops visible · click a pin to preview`}
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          style={{
            display: "flex", gap: 0,
            width: isMobile ? "100%" : "auto",
            boxShadow: focused ? `0 0 0 1px ${FG}` : "none",
            transition: "box-shadow 0.15s ease",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search an area or postcode…"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              padding: "12px 16px", border: `1px solid ${BORDER}`,
              borderRight: "none", background: BG, color: FG,
              outline: "none", width: isMobile ? "100%" : 280, minWidth: 0, flex: isMobile ? 1 : "none",
            }}
          />
          <button type="submit" className="uw-btn-primary" style={{
            background: FG, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            letterSpacing: "0.08em", padding: "12px 22px",
            border: "none", cursor: "pointer",
          }}>
            GO
          </button>
        </form>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}` }}>
        <DropMap
          drops={pins}
          onDropClick={onDropClick}
          defaultLat={mapCenter.lat}
          defaultLng={mapCenter.lng}
          zoom={13}
          height={isMobile ? "360px" : "520px"}
        />
      </div>
    </section>
  );
}

function SampleDropCard({ sample, compact = false }: { sample: SampleDrop; compact?: boolean }) {
  const hasDiscount =
    sample.originalPricePence != null &&
    checkoutFromList(sample.originalPricePence) > sample.pricePence;
  const discountPct = hasDiscount
    ? discountPercent(sample.originalPricePence!, sample.pricePence)
    : null;

  return (
    <div
      className="uw-sample-card"
      style={{ background: BG, padding: 0, position: "relative" }}
      aria-label={`Sample drop: ${sample.title}. Not live.`}
    >
      <div style={{
        height: compact ? 148 : 180,
        position: "relative", overflow: "hidden", background: MUTED,
      }}>
        <div
          className="uw-sample-img"
          style={{
            position: "absolute", inset: 0,
            background: `url(${sample.imageUrl}) center/cover no-repeat`,
          }}
        />
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: BG, padding: "4px 8px", border: `1px solid ${BORDER}`,
        }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8,
            color: MUTED_FG, letterSpacing: "0.1em",
          }}>
            EXAMPLE
          </span>
        </div>
        {hasDiscount && discountPct != null && discountPct > 0 && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: V, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 8,
            letterSpacing: "0.12em", padding: "4px 7px",
          }}>
            {discountPct}% OFF
          </div>
        )}
      </div>

      <div style={{ padding: compact ? "14px 14px 18px" : "18px 18px 22px" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 8,
          color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase",
        }}>
          {sample.category} · {sample.neighbourhood}
        </div>

        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: compact ? 15 : 17,
          fontWeight: 600, color: FG, marginBottom: 4, lineHeight: 1.3,
        }}>
          {sample.title}
        </h3>

        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12,
          color: MUTED_FG, marginBottom: 12, fontWeight: 300,
        }}>
          {sample.business}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          gap: 8, marginBottom: 6, paddingTop: 10, borderTop: `1px solid ${BORDER}`,
        }}>
          <DropPrice
            price={sample.pricePence}
            originalPrice={sample.originalPricePence}
            size="sm"
            layout={hasDiscount ? "stacked" : "inline"}
          />
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG,
            textAlign: "right", flexShrink: 0,
          }}>
            {sample.left}
          </span>
        </div>

        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, marginBottom: 8,
        }}>
          {sample.window}
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          color: MUTED_FG, fontStyle: "italic", lineHeight: 1.4,
        }}>
          Illustrative only — cannot be reserved
        </div>
      </div>
    </div>
  );
}
