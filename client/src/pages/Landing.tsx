import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "../trpc";
import DropMap, { toDropPin } from "../components/DropMap";
import DirectoryMap from "../components/DirectoryMap";
import DropPrice from "../components/DropPrice";
import useIsMobile from "../hooks/useIsMobile";
import { checkoutFromList, discountPercent } from "../lib/fees";
import { PRELAUNCH_WAVE1_DIRECTORY_PINS, type PrelaunchDirectoryPin } from "../lib/prelaunch_wave1_directory_pins";

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
.uw-sample-carousel {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: inherit;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}
.uw-sample-carousel::-webkit-scrollbar { display: none; }
.uw-sample-slide {
  flex: 0 0 auto;
  scroll-snap-align: start;
}
.uw-step {
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}
.uw-step:hover {
  background: ${MUTED} !important;
  border-color: ${FG} !important;
  transform: translateY(-2px);
}
.uw-step-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${V};
  font-family: 'Space Mono', monospace;
  font-size: 18px;
  padding: 0 4px;
  flex-shrink: 0;
}
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
                fontSize: "clamp(36px, 5.8vw, 68px)",
                fontWeight: 700, color: FG,
                lineHeight: 1.08, letterSpacing: "-1.8px",
                marginBottom: 20,
              }}
            >
              A new way to shop your high street.
              <br />
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>
                See it. Claim it. Collect it.
              </em>
            </h1>

            <p
              className="uw-fade-3"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 16 : 17,
                color: FG, lineHeight: 1.55, marginBottom: 28, fontWeight: 400,
                maxWidth: 520,
              }}
            >
              Imagine looking into your favourite local shops from the sofa or the bus —
              seeing what's ready, claiming it, and walking in to collect.
              That's the high street we're bringing to life.
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
                  Look in. See it. Claim it. Collect.
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
                  JOIN THE WAITLIST
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
                  Get seen — so you can sell and welcome customers in.
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
                  PARTNER YOUR SHOP
                </a>
              </div>
            </div>
          </div>

          {/* (Removed) hero mock map image */}
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

      {/* ── 2. HOW IT WORKS — mission infographic ── */}
      <section style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          background: FG,
          color: BG,
          padding: isMobile ? "40px 20px 32px" : "52px 40px 40px",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 16,
          }}>
            <span
              className="uw-pulse-dot"
              style={{ width: 7, height: 7, borderRadius: "50%", background: V, display: "inline-block", flexShrink: 0 }}
            />
            HOW IT WORKS · THE MISSION
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 30 : 44,
            fontWeight: 700, letterSpacing: "-1px",
            lineHeight: 1.08, marginBottom: 18, maxWidth: 720,
          }}>
            Bring the buzz back to your high street —{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>before it's gone.</em>
          </h2>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: isMobile ? 8 : 12,
          }}>
            {[
              "Limited quantity",
              "Real photo or clip",
              "Pay upfront · it's yours",
              "Collect when you're free",
            ].map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9,
                  letterSpacing: "0.1em", color: BG,
                  border: "1px solid rgba(250,250,248,0.35)",
                  padding: "7px 12px",
                }}
              >
                {tag.toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          padding: isMobile ? "24px 16px 36px" : "32px 40px 48px",
          background: BG,
        }}>
          <figure style={{ margin: 0, maxWidth: 1100, marginLeft: "auto", marginRight: "auto" }}>
            <img
              src="/landing/mission-infographic.jpg"
              alt="Unwrapped mission infographic: peek into local shops from your phone with real photos and clips; see it, claim it, and collect with a QR code; no mystery bags — choose real stock like sourdough or a salon slot; bring buzz and more faces through local shop doors."
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                border: `1px solid ${BORDER}`,
                background: BG,
              }}
            />
            <figcaption style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: MUTED_FG,
              lineHeight: 1.55,
              marginTop: 14,
              textAlign: "center",
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              Connects neighbours to local shops in real time — see the real thing, claim it, collect it.
            </figcaption>
          </figure>

          <div style={{
            marginTop: isMobile ? 24 : 28,
            padding: isMobile ? "20px 18px" : "22px 26px",
            border: `1px solid ${FG}`,
            background: MUTED,
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 16,
            maxWidth: 1100,
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 20 : 24,
              fontWeight: 600,
              color: FG,
              lineHeight: 1.3,
              margin: 0,
              maxWidth: 520,
            }}>
              Drops sell out.{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>
                Don't find out when you're already at the shop.
              </em>
            </p>
            <button
              onClick={() => navigate("/signin")}
              className="uw-btn-primary"
              style={{
                flexShrink: 0,
                background: V, color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "13px 22px",
                border: "none", cursor: "pointer",
                width: isMobile ? "100%" : "auto",
              }}
            >
              JOIN THE WAITLIST
            </button>
          </div>
        </div>
      </section>

      {/* ── 3. SAMPLES — desire ── */}
      <section>
        <div style={{ padding: isMobile ? "40px 20px 20px" : "56px 40px 24px" }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 12,
          }}>
            WHAT A DROP FEELS LIKE
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 28 : 36,
            fontWeight: 700, color: FG, letterSpacing: "-0.8px",
            lineHeight: 1.15, maxWidth: 560, marginBottom: 16,
          }}>
            See the real thing. Then collect it.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 16,
            color: FG, lineHeight: 1.7, maxWidth: 560, fontWeight: 400, marginBottom: 8,
          }}>
            Unwrapped turns your high street into something you can browse from the sofa —
            then actually go and get.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.7, maxWidth: 560, fontWeight: 300, marginBottom: 20,
          }}>
            A bakery posts the loaf that just came out. A boutique shows the jacket that just landed.
            A salon opens a free slot. You see it in a photo or short video, claim it in seconds,
            pay in the app, and walk in with a QR. No mystery bag. No delivery wait.
            Just something you chose — waiting for you at the counter.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            color: "#A8A8A0", lineHeight: 1.5, margin: 0,
          }}>
            Mock examples · fictional shops — nothing here can be reserved yet.
          </p>
        </div>

        <SampleDropsCarousel />
      </section>

      {/* ── 4. FOUNDING — belonging + convert ── */}
      {PRE_LAUNCH && (
        <section style={{
          padding: isMobile ? "40px 20px" : "52px 40px",
          borderBottom: `1px solid ${BORDER}`,
          background: `linear-gradient(135deg, ${MUTED} 0%, ${BG} 55%, rgba(232,52,28,0.03) 100%)`,
        }}>
          <div style={{ maxWidth: 820 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: V, letterSpacing: "0.14em", marginBottom: 12,
            }}>
              PRE-LAUNCH · FOUNDING MEMBERS
            </div>
            <div style={{ width: 40, height: 3, background: V, marginBottom: 20 }} />

            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: V,
              letterSpacing: "0.14em",
              marginBottom: 12,
            }}>
              WHY WE NEED YOU
            </div>

            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 28 : 40,
              fontWeight: 700, color: FG, lineHeight: 1.15,
              letterSpacing: "-0.8px", marginBottom: 16, maxWidth: 640,
            }}>
              Be part of something new —{" "}
              <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>a high street that buzzes again.</em>
            </h2>

            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17,
              color: FG, lineHeight: 1.65, marginBottom: isMobile ? 24 : 28, maxWidth: 620, fontWeight: 300,
            }}>
              When shops get seen and neighbours show up, everyone wins —
              more life on the street, more faces through the door, a local that feels alive.
              Founding members help make that real, neighbourhood by neighbourhood.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: isMobile ? 22 : 0,
              marginBottom: 24,
              maxWidth: 760,
              border: `1px solid ${BORDER}`,
              background: BG,
            }}>
              <div style={{
                padding: isMobile ? "18px 18px 0" : "22px 26px",
                borderRight: isMobile ? "none" : `1px solid ${BORDER}`,
                borderBottom: isMobile ? `1px solid ${BORDER}` : "none",
              }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: V,
                  letterSpacing: "0.14em",
                  marginBottom: 12,
                }}>
                  FOUNDING SHOPS
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    "Get seen — first drop free",
                    "We can shoot your first photo or short clip",
                    "You set the price — no mystery-bag model",
                    "Priority on the map as your area opens",
                  ].map((label) => (
                    <li
                      key={label}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        color: MUTED_FG,
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: V, flexShrink: 0, marginTop: 1 }}>—</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ padding: isMobile ? "18px" : "22px 26px" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  color: V,
                  letterSpacing: "0.14em",
                  marginBottom: 12,
                }}>
                  FOUNDING SHOPPERS
                </div>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                  {[
                    "First look when drops open near you",
                    "See into shops before you walk over",
                    "Nominate the local shops you love",
                  ].map((label) => (
                    <li
                      key={label}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        color: MUTED_FG,
                        lineHeight: 1.45,
                      }}
                    >
                      <span style={{ color: V, flexShrink: 0, marginTop: 1 }}>—</span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              color: MUTED_FG,
              lineHeight: 1.55,
              margin: "0 0 18px",
              maxWidth: 560,
            }}>
              Join as a shopper or partner a shop — both help bring your high street to life.
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
                JOIN AS A FOUNDING SHOPPER
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
                PARTNER AS A FOUNDING SHOP
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. MAP — London is real ── */}
      {PRE_LAUNCH ? (
        <PrelaunchDirectorySection pins={PRELAUNCH_WAVE1_DIRECTORY_PINS} />
      ) : (
        <MapSection drops={drops ?? []} onDropClick={(id) => navigate(`/drop/${id}`)} />
      )}

      {/* ── 6. FOR BUSINESSES — help sell ── */}
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
            Get seen.
            <br />
            <em style={{ fontStyle: "italic", color: V }}>Sell and welcome customers through the door.</em>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.7, marginBottom: 14, maxWidth: 440, fontWeight: 300,
          }}>
            No catalog to build. When something's ready — a batch, a quiet slot, a limited edit —
            publish a photo or short video, set price and quantity, and hit publish.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.7, marginBottom: 28, maxWidth: 420, fontWeight: 300,
          }}>
            Locals nearby see you, claim it, pay upfront, and collect with a QR.
            You welcome customers at the counter — regulars and new faces alike.
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
            PARTNER YOUR SHOP
          </a>
        </div>

        <div style={{ border: `1px solid ${BORDER}`, boxShadow: `8px 8px 0 ${MUTED}` }}>
          {[
            {
              label: "Show what's ready",
              body: "Upload a photo or short clip. No product IDs. No endless catalog setup.",
            },
            {
              label: "Paid claims, not maybe-laters",
              body: "Shoppers pay when they claim. You set the collection window. No holding stock for no-shows.",
            },
            {
              label: "Customers through your door",
              body: "They must walk in and scan a QR. You welcome customers who already know what they came for.",
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

      {/* ── 6a. MERCHANT FAQ ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "64px 40px",
        borderBottom: `1px solid ${BORDER}`,
        background: BG,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12,
        }}>
          FOR BUSINESSES · FAQ
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 26 : 32,
          fontWeight: 700, color: FG, letterSpacing: "-0.6px",
          lineHeight: 1.15, marginBottom: 28, maxWidth: 480,
        }}>
          Quick answers before you apply.
        </h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 20 : 28,
          maxWidth: 920,
        }}>
          {[
            {
              q: "Is this another deep-discount app?",
              a: "No. You set the price and quantity. Drops are about showing what's ready and getting people through your door — not training locals to only buy on slash prices.",
            },
            {
              q: "Do I have to build a catalog?",
              a: "No. When you have something to drop, upload a photo or short video, add a title, price, and quantity, and publish. Under a minute.",
            },
            {
              q: "What if they don't show up?",
              a: "They pay when they claim. You set the collection window. You're not holding stock for a maybe.",
            },
            {
              q: "Who is Unwrapped for?",
              a: "Local shops, cafés, salons, restaurants, freelancers, services, and charity shops — the high street, not chains.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif", fontSize: 18,
                fontWeight: 600, color: FG, marginBottom: 8, lineHeight: 1.3,
              }}>
                {q}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: MUTED_FG, lineHeight: 1.65, fontWeight: 300, margin: 0,
              }}>
                {a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6b. RECOMMEND A SHOP — neighbourhood nominations ── */}
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
            Shoppers: get on the list to look in, see, claim, and collect.
            Businesses: get on the map so your high street can see you.
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
              JOIN THE WAITLIST
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
              PARTNER YOUR SHOP
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
            Look in. See it. Claim it. Collect — your high street, from wherever you are.
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

function normalizeDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function PrelaunchDirectorySection({ pins }: { pins: PrelaunchDirectoryPin[] }) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 51.509865, lng: -0.118092 });
  const [focusedId, setFocusedId] = useState<string | undefined>(undefined);
  const [focusedFromList, setFocusedFromList] = useState(false);

  const { data: members } = trpc.businesses.directoryMembers.useQuery();

  const directoryPins = useMemo(() => {
    const memberRows = members ?? [];
    const memberByName = new Map(
      memberRows.map((m) => [normalizeDirectoryName(m.name), m]),
    );
    const matchedMemberIds = new Set<string>();

    const curated: PrelaunchDirectoryPin[] = pins.map((p) => {
      const match = memberByName.get(normalizeDirectoryName(p.name));
      if (!match) return p;
      matchedMemberIds.add(match.id);
      return {
        ...p,
        isMember: true,
        slug: match.slug,
        category: match.category,
        // Prefer live business address when we have it
        address: match.address || p.address,
        postcode: match.postcode || p.postcode,
      };
    });

    const extras: PrelaunchDirectoryPin[] = memberRows
      .filter((m) => !matchedMemberIds.has(m.id) && m.lat != null && m.lng != null)
      .map((m) => ({
        id: `member-${m.id}`,
        name: m.name,
        lat: m.lat as number,
        lng: m.lng as number,
        postcode: m.postcode ?? undefined,
        address: m.address ?? undefined,
        district: m.city ?? undefined,
        type: m.category,
        category: m.category,
        isMember: true,
        slug: m.slug,
      }));

    // Members first in the list, then curated board
    return [...extras, ...curated].sort((a, b) => {
      if (!!a.isMember !== !!b.isMember) return a.isMember ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [pins, members]);

  const normalized = search.trim().toLowerCase();
  const filteredPins = useMemo(() => {
    if (!normalized) return directoryPins;
    return directoryPins.filter((p) => {
      const hay = `${p.name} ${p.address ?? ""} ${p.postcode ?? ""} ${p.district ?? ""} ${p.track ?? ""} ${p.type ?? ""} ${p.category ?? ""}`.toLowerCase();
      return hay.includes(normalized);
    });
  }, [directoryPins, normalized]);

  useEffect(() => {
    if (!focusedId) return;
    if (!filteredPins.some((p) => p.id === focusedId)) setFocusedId(undefined);
  }, [filteredPins, focusedId]);

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
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 0.95fr) minmax(0, 1.05fr)",
        gap: 20,
        alignItems: "start",
      }}>
        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 9,
            color: MUTED_FG,
            letterSpacing: "0.15em",
            marginBottom: 12,
          }}>
            LONDON · GETTING READY
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 24 : 30,
            fontWeight: 700,
            color: FG,
            letterSpacing: "-0.6px",
            lineHeight: 1.15,
            marginBottom: 8,
          }}>
            A new way to be local
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: MUTED_FG,
            lineHeight: 1.65,
            maxWidth: 520,
            fontWeight: 300,
            marginBottom: 8,
          }}>
            {filteredPins.length === 0
              ? "No matches — clear your search to see the full curated board."
              : "Nominate a shop you love, or apply to be listed — help bring your high street onto Unwrapped."}
          </p>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: MUTED_FG,
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}>
            {filteredPins.length} showing
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <a
              href="/business-apply"
              style={{
                background: FG,
                color: BG,
                textDecoration: "none",
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.06em",
                padding: "12px 18px",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 10px 26px rgba(0,0,0,0.10)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              LIST YOUR BUSINESS
            </a>
            <a
              href="/recommend"
              style={{
                background: "transparent",
                color: FG,
                textDecoration: "none",
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.06em",
                padding: "11px 18px",
                border: `1px solid ${FG}`,
                borderRadius: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              NOMINATE A SHOP
            </a>
          </div>

          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: 0,
              width: "100%",
              boxShadow: "none",
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                padding: "12px 16px",
                border: `1px solid ${BORDER}`,
                borderRight: "none",
                background: BG,
                color: FG,
                outline: "none",
                width: "100%",
              }}
              placeholder="Search an area, postcode, or shop name…"
            />
            <button
              type="submit"
              className="uw-btn-primary"
              style={{
                background: FG,
                color: BG,
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "12px 22px",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              GO
            </button>
          </form>

          <div style={{
            border: `1px solid ${BORDER}`,
            background: MUTED,
            marginTop: 16,
            maxHeight: isMobile ? 360 : 520,
            overflowY: "auto",
          }}>
            {filteredPins.length === 0 ? (
              <div style={{
                padding: 20,
                textAlign: "center",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: MUTED_FG,
              }}>
                No matches.
              </div>
            ) : (
              filteredPins.map((p) => {
                const focused = focusedId === p.id;
                return (
                  <div
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setFocusedFromList(true);
                      setFocusedId(p.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setFocusedFromList(true);
                        setFocusedId(p.id);
                      }
                    }}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${BORDER}`,
                      cursor: "pointer",
                      background: focused
                        ? (p.isMember ? "rgba(20,18,16,0.06)" : "rgba(232,52,28,0.06)")
                        : MUTED,
                    }}
                  >
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: FG,
                      fontWeight: 600,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}>
                      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {p.isMember ? (
                          <span style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 8,
                            color: FG,
                            letterSpacing: "0.1em",
                            border: `1px solid ${FG}`,
                            padding: "2px 6px",
                          }}>
                            MEMBER
                          </span>
                        ) : null}
                        {focused ? (
                          <span style={{
                            fontFamily: "'Space Mono', monospace",
                            fontSize: 9,
                            color: p.isMember ? FG : V,
                            letterSpacing: "0.12em",
                          }}>
                            FOCUSED
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: MUTED_FG,
                      letterSpacing: "0.08em",
                      lineHeight: 1.45,
                    }}>
                      {p.postcode ? p.postcode : p.district ?? "—"}
                      {p.isMember && p.category ? ` · ${p.category}` : p.track ? ` · ${p.track}` : ""}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 0 }}>
          <DirectoryMap
            pins={filteredPins}
            defaultLat={mapCenter.lat}
            defaultLng={mapCenter.lng}
            zoom={13}
            height={isMobile ? "360px" : "520px"}
            focusedId={focusedFromList ? focusedId : focusedId}
          />
        </div>
      </div>
    </section>
  );
}

function SampleDropsCarousel() {
  const isMobile = useIsMobile();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const pad = isMobile ? 20 : 40;
  const slideWidth = isMobile ? "min(300px, 82vw)" : "280px";

  function goTo(next: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(SAMPLE_DROPS.length - 1, next));
    const slide = el.children[clamped] as HTMLElement | undefined;
    if (!slide) return;
    el.scrollTo({ left: slide.offsetLeft - pad, behavior: "smooth" });
    setIndex(clamped);
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const slides = Array.from(el.children) as HTMLElement[];
      if (!slides.length) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((slide, i) => {
        const mid = slide.offsetLeft + slide.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      setIndex(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      borderTop: `1px solid ${BORDER}`,
      borderBottom: `1px solid ${BORDER}`,
      padding: `${isMobile ? 16 : 20}px 0 ${isMobile ? 20 : 24}px`,
      background: BG,
    }}>
      <div
        ref={scrollerRef}
        className="uw-sample-carousel"
        style={{ paddingInline: pad, scrollPaddingInline: pad }}
      >
        {SAMPLE_DROPS.map((sample) => (
          <div
            key={sample.title}
            className="uw-sample-slide"
            style={{ width: slideWidth, border: `1px solid ${BORDER}` }}
          >
            <SampleDropCard sample={sample} compact />
          </div>
        ))}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: `${isMobile ? 14 : 16}px ${pad}px 0`,
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {SAMPLE_DROPS.map((sample, i) => (
            <button
              key={sample.title}
              type="button"
              aria-label={`Go to example ${i + 1}`}
              onClick={() => goTo(i)}
              style={{
                width: i === index ? 18 : 7,
                height: 7,
                borderRadius: 999,
                border: "none",
                padding: 0,
                background: i === index ? V : BORDER,
                cursor: "pointer",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            aria-label="Previous example"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "10px 14px",
              border: `1px solid ${BORDER}`,
              background: BG,
              color: index === 0 ? MUTED_FG : FG,
              cursor: index === 0 ? "default" : "pointer",
            }}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next example"
            disabled={index >= SAMPLE_DROPS.length - 1}
            onClick={() => goTo(index + 1)}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.1em",
              padding: "10px 14px",
              border: `1px solid ${BORDER}`,
              background: BG,
              color: index >= SAMPLE_DROPS.length - 1 ? MUTED_FG : FG,
              cursor: index >= SAMPLE_DROPS.length - 1 ? "default" : "pointer",
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
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
