import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../trpc";
import DropMap, { toDropPin } from "../components/DropMap";
import DirectoryMap from "../components/DirectoryMap";
import useIsMobile from "../hooks/useIsMobile";
import { checkoutFromList, discountPercent } from "../lib/fees";
import { PRELAUNCH_WAVE1_DIRECTORY_PINS, type PrelaunchDirectoryPin } from "../lib/prelaunch_wave1_directory_pins";
import { BG, FG, BORDER, MUTED, MUTED_FG, V, V_DEEP, V_RICH, CREAM, RADIUS, RADIUS_SM, BG_WASH, SECTION_WASH, BAND_WASH } from "../theme";

const HERO_SHOP_IMAGES = [
  "/landing/hero-owner-bakery.jpg",
  "/landing/hero-owner-florist.jpg",
  "/landing/hero-owner-boutique.jpg",
  "/landing/hero-owner-salon.jpg",
];

/** Flip to false when real drops go live and the landing should show the live feed again. */
const PRE_LAUNCH = true;
/** Hero floating sample cards — muted for now. */
const SHOW_HERO_FLOATING_CARDS = false;
/** "What you see" sample carousel — muted; hero + How it works phones carry the proof. */
const SHOW_WHAT_YOU_SEE = false;

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
    neighbourhood: "Brixton",
    title: "Morning bake — country loaf",
    business: "River Oven Bakery",
    pricePence: 450,
    window: "Example window · Sat morning",
    left: "e.g. 6 available",
    imageUrl: "/samples/sourdough.jpg",
  },
  {
    category: "Fashion & Retail",
    neighbourhood: "Peckham",
    title: "Weekend edit — 3-piece clothing bundle",
    business: "North Lane Boutique",
    pricePence: checkoutFromList(10800),
    window: "Example window · Sat–Sun",
    left: "e.g. 8 bundles",
    imageUrl: "/samples/clothing.jpg",
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
];

/** Whatnot-style phone screens for How it works — owner on camera + drop meta. */
const HOW_IT_WORKS_PHONES: {
  ownerImage: string;
  dropLabel: string;
  title: string;
  business: string;
  pricePence: number;
  media: "video" | "photo";
}[] = [
  {
    ownerImage: "/landing/hero-owner-bakery.jpg",
    dropLabel: "Dropping Tue · 4pm",
    title: "Morning bake — country loaf",
    business: "River Oven Bakery",
    pricePence: 450,
    media: "video",
  },
  {
    ownerImage: "/landing/drop-jacket-photo.jpg",
    dropLabel: "Dropping Sat · 11am",
    title: "Weekend jacket — rail edit",
    business: "North Lane Boutique",
    pricePence: checkoutFromList(10800),
    media: "photo",
  },
  {
    ownerImage: "/landing/hero-owner-salon.jpg",
    dropLabel: "Dropping today · 2pm",
    title: "Express blow-dry — afternoon",
    business: "Marlow Hair Studio",
    pricePence: 2800,
    media: "video",
  },
];

const BUSINESS_TYPES = [
  "Charity shops",
  "Florists",
  "Bakeries",
  "Bookshops",
  "Wine merchants",
  "Beauty",
  "Fashion",
  "Spirits",
  "Boutiques",
  "Specialty food",
];

const LANDING_CSS = `
@keyframes uw-fade-up {
  from { opacity: 0; transform: translateY(22px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes uw-pulse-dot {
  0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(22,7,3,0.55); }
  50% { transform: scale(1.15); opacity: 0.85; box-shadow: 0 0 0 10px rgba(22,7,3,0); }
}
@keyframes uw-float {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-10px) rotate(-1deg); }
}
@keyframes uw-float-delay {
  0%, 100% { transform: translateY(0) rotate(3deg); }
  50% { transform: translateY(-14px) rotate(2deg); }
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
@keyframes uw-kenburns-a {
  0% { transform: scale(1) translate(0, 0); }
  100% { transform: scale(1.14) translate(-2.5%, -1.5%); }
}
@keyframes uw-kenburns-b {
  0% { transform: scale(1.12) translate(-1%, 0); }
  100% { transform: scale(1) translate(1.5%, -2%); }
}
@keyframes uw-hero-fade {
  0% { opacity: 0; }
  8% { opacity: 1; }
  25% { opacity: 1; }
  33% { opacity: 0; }
  100% { opacity: 0; }
}
.uw-hero-slide {
  position: absolute;
  inset: -4%;
  background-size: cover;
  background-position: center;
  opacity: 0;
  will-change: transform, opacity;
}
.uw-hero-slide:nth-child(1) {
  animation: uw-hero-fade 28s ease-in-out infinite, uw-kenburns-a 28s ease-in-out infinite;
  animation-delay: 0s, 0s;
}
.uw-hero-slide:nth-child(2) {
  animation: uw-hero-fade 28s ease-in-out infinite, uw-kenburns-b 28s ease-in-out infinite;
  animation-delay: -7s, -7s;
}
.uw-hero-slide:nth-child(3) {
  animation: uw-hero-fade 28s ease-in-out infinite, uw-kenburns-a 28s ease-in-out infinite;
  animation-delay: -14s, -14s;
}
.uw-hero-slide:nth-child(4) {
  animation: uw-hero-fade 28s ease-in-out infinite, uw-kenburns-b 28s ease-in-out infinite;
  animation-delay: -21s, -21s;
}
.uw-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(105deg, rgba(22,7,3,0.82) 0%, rgba(22,7,3,0.62) 42%, rgba(44,20,16,0.38) 72%, rgba(22,7,3,0.48) 100%),
    linear-gradient(180deg, rgba(22,7,3,0.22) 0%, transparent 40%, rgba(22,7,3,0.45) 100%);
  pointer-events: none;
}
@keyframes uw-wiggle {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}
@keyframes uw-pop {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}
.uw-fade-1 { animation: uw-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.uw-fade-2 { animation: uw-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both; }
.uw-fade-3 { animation: uw-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
.uw-fade-4 { animation: uw-fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both; }
.uw-hero-map { animation: uw-map-drift 28s ease-in-out infinite; }
.uw-pulse-dot { animation: uw-pulse-dot 1.6s ease-in-out infinite; }
.uw-marquee-track {
  display: flex;
  width: max-content;
  animation: uw-marquee 22s linear infinite;
}
.uw-marquee-track:hover { animation-play-state: paused; }
.uw-btn-primary {
  border-radius: ${RADIUS_SM}px !important;
  font-weight: 800 !important;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease;
}
.uw-btn-primary:hover {
  background: #2C1410 !important;
  color: #FFE0E7 !important;
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 14px 32px rgba(22, 7, 3, 0.4);
}
.uw-btn-primary:active { transform: translateY(0) scale(0.98); }
.uw-btn-ghost {
  border-radius: ${RADIUS_SM}px !important;
  font-weight: 700 !important;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, color 0.2s ease;
}
.uw-btn-ghost:hover {
  border-color: ${V} !important;
  color: ${V} !important;
  background: ${MUTED} !important;
  transform: translateY(-3px) scale(1.02);
}
.uw-btn-ghost-dark:hover {
  border-color: ${CREAM} !important;
  background: rgba(255,240,244,0.16) !important;
  color: ${CREAM} !important;
  transform: translateY(-3px) scale(1.02);
}
.uw-link {
  transition: color 0.15s ease, transform 0.15s ease;
}
.uw-link:hover { color: ${V} !important; }
.uw-sample-card {
  transition: background 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s ease;
  border-radius: ${RADIUS}px;
  overflow: hidden;
}
.uw-sample-card:hover {
  background: ${MUTED} !important;
  transform: translateY(-4px) rotate(-0.5deg);
  box-shadow: 0 18px 40px rgba(44,20,16,0.14);
}
.uw-sample-img {
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.uw-sample-card:hover .uw-sample-img {
  transform: scale(1.08);
}
.uw-sample-carousel {
  display: flex;
  gap: 14px;
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
  border-radius: ${RADIUS}px;
  overflow: hidden;
}
.uw-step {
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
  border-radius: ${RADIUS}px;
}
.uw-step:hover {
  background: ${MUTED} !important;
  border-color: ${V} !important;
  transform: translateY(-3px) rotate(0.4deg);
}
.uw-step-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${V};
  font-family: 'DM Sans', sans-serif;
  font-size: 18px;
  padding: 0 4px;
  flex-shrink: 0;
}
.uw-pill {
  border-radius: 999px;
  background: ${MUTED};
  border: 1px solid ${BORDER};
}
.uw-float { animation: uw-float 5.5s ease-in-out infinite; }
.uw-float-delay { animation: uw-float-delay 6.5s ease-in-out infinite; }
.uw-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #fff;
  color: ${V};
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 8px 14px;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(0,0,0,0.18);
  animation: uw-pop 2.8s ease-in-out infinite;
}
.uw-sticker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${V};
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 14px;
  border-radius: 999px;
  transform: rotate(-2deg);
  box-shadow: 0 8px 20px rgba(22,7,3,0.3);
}
.uw-sticker:nth-child(even) { transform: rotate(2deg); }
.uw-phone-frame {
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
  background: #1a1210;
  border-radius: 28px;
  padding: 10px;
  box-shadow: 0 24px 50px rgba(0,0,0,0.28);
  border: 2px solid rgba(255,240,244,0.18);
}
.uw-phone-screen {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  aspect-ratio: 9 / 16;
  background: #0f0a09;
}
.uw-phone-notch {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 18px;
  border-radius: 999px;
  background: #1a1210;
  z-index: 3;
}
.uw-phones-row {
  display: flex;
  gap: 18px;
  justify-content: center;
  align-items: flex-end;
  flex-wrap: wrap;
}
@media (min-width: 900px) {
  .uw-phones-row .uw-phone-wrap:nth-child(2) {
    transform: translateY(-18px);
  }
}
.uw-page-wash {
  background: ${BG_WASH};
  background-attachment: fixed;
}
.uw-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  opacity: 0.55;
  z-index: 0;
  animation: uw-blob-drift 18s ease-in-out infinite;
}
@keyframes uw-blob-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(4%, -3%) scale(1.08); }
  66% { transform: translate(-3%, 4%) scale(0.94); }
}
@media (prefers-reduced-motion: reduce) {
  .uw-fade-1, .uw-fade-2, .uw-fade-3, .uw-fade-4,
  .uw-hero-map, .uw-pulse-dot, .uw-marquee-track, .uw-float, .uw-float-delay, .uw-live-badge, .uw-blob,
  .uw-hero-slide { animation: none !important; }
  .uw-hero-slide:nth-child(1) { opacity: 1 !important; transform: none !important; }
  .uw-sample-img, .uw-btn-primary, .uw-btn-ghost { transition: none !important; }
}
`;

export default function Landing() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);

  const { data: drops } = trpc.drops.list.useQuery({ limit: 60, timeWindow: undefined });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="uw-page-wash" style={{ color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
      <style>{LANDING_CSS}</style>
      <div aria-hidden className="uw-blob" style={{
        top: "12%", left: "-8%", width: 420, height: 420,
        background: "rgba(255,80,50,0.35)",
      }} />
      <div aria-hidden className="uw-blob" style={{
        top: "48%", right: "-10%", width: 380, height: 380,
        background: "rgba(255,160,120,0.45)",
        animationDelay: "-6s",
      }} />
      <div aria-hidden className="uw-blob" style={{
        bottom: "8%", left: "30%", width: 320, height: 320,
        background: "rgba(22,7,3,0.18)",
        animationDelay: "-11s",
      }} />

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: isMobile ? 10 : 24,
        padding: isMobile ? "10px 12px" : "14px 40px",
        borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid rgba(255,240,244,0.12)",
        // At top the nav sits above the hero on the light page wash — must stay opaque
        // and high-contrast (cream on wine). Scrolled = cream glass + dark ink.
        background: scrolled
          ? "linear-gradient(180deg, rgba(255,240,244,0.96), rgba(255,232,222,0.94))"
          : V_DEEP,
        backdropFilter: scrolled ? "blur(14px)" : undefined,
        WebkitBackdropFilter: scrolled ? "blur(14px)" : undefined,
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}>
        <a href="/" aria-label="Unwrapped home" style={{
          display: "flex", alignItems: "center", gap: isMobile ? 6 : 10,
          textDecoration: "none", color: scrolled ? FG : CREAM,
          flexShrink: 0,
        }}>
          <img
            src="/logo-mark.svg"
            alt=""
            width={isMobile ? 22 : 28}
            height={isMobile ? 22 : 28}
            style={{
              display: "block",
              flexShrink: 0,
              // Keep the real mark (ink square + cream U + vermillion spark).
              // brightness/invert collapses it to a blank white box on the wine nav.
              borderRadius: 6,
            }}
          />
          <span style={{
            fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 15 : 22,
            fontWeight: 700, letterSpacing: "-0.5px",
            whiteSpace: "nowrap",
          }}>
            Unwrapped
          </span>
        </a>

        <div style={{
          display: "flex",
          gap: isMobile ? 8 : 22,
          alignItems: "center",
          flexShrink: 0,
          marginLeft: "auto",
        }}>
          <a
            href="https://www.instagram.com/shopunwrapped/"
            target="_blank"
            rel="noopener noreferrer"
            className="uw-link"
            aria-label="Instagram"
            title="Instagram"
            style={{
              color: scrolled ? MUTED_FG : "rgba(255,240,244,0.88)",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              width: isMobile ? 26 : 30,
              height: isMobile ? 26 : 30,
            }}
          >
            <svg width={isMobile ? 16 : 18} height={isMobile ? 16 : 18} viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>
            </svg>
          </a>
          {!isMobile && (
            <a
              href="/recommend"
              className="uw-link"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: scrolled ? MUTED_FG : "rgba(255,240,244,0.88)",
                textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap",
              }}
            >
              Recommend a shop
            </a>
          )}
          <a
            href="/business-apply"
            className="uw-link"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 11 : 13,
              color: scrolled ? MUTED_FG : "rgba(255,240,244,0.88)",
              textDecoration: "none", fontWeight: 500, whiteSpace: "nowrap",
            }}
          >
            {isMobile ? "Business" : "For businesses"}
          </a>
          <a
            href="/signin"
            className="uw-btn-ghost"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 11 : 13,
              color: scrolled ? FG : CREAM, letterSpacing: "0.02em", fontWeight: 700,
              border: scrolled ? `1.5px solid ${FG}` : "1.5px solid rgba(255,240,244,0.65)",
              padding: isMobile ? "6px 9px" : "9px 18px",
              textDecoration: "none",
              background: scrolled ? "transparent" : "rgba(255,240,244,0.12)",
              borderRadius: RADIUS_SM,
              whiteSpace: "nowrap",
            }}
          >
            SIGN IN
          </a>
        </div>
      </nav>

      {/* ── 1. HERO — product-first, live drop energy ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        zIndex: 1,
        color: CREAM,
        background: V_DEEP,
      }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "absolute", inset: "-2%",
              backgroundImage: `url(${HERO_SHOP_IMAGES[0]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          {HERO_SHOP_IMAGES.map((src) => (
            <div
              key={src}
              className="uw-hero-slide"
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
          <div className="uw-hero-overlay" />
        </div>

        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: SHOW_HERO_FLOATING_CARDS && !isMobile
            ? "minmax(0, 1fr) minmax(280px, 0.95fr)"
            : "1fr",
          gap: isMobile ? 36 : 40,
          alignItems: "center",
          padding: isMobile ? "36px 20px 28px" : "48px 40px 40px",
          minHeight: isMobile ? undefined : "calc(100vh - 72px)",
          maxHeight: isMobile ? undefined : 820,
        }}>
          <div style={{ maxWidth: SHOW_HERO_FLOATING_CARDS ? undefined : 580 }}>
            <div
              className="uw-fade-1"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                marginBottom: isMobile ? 16 : 20,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: isMobile ? 9 : 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(255,240,244,0.78)",
                  padding: isMobile ? "5px 0" : "6px 0",
                }}
              >
                <span
                  className="uw-pulse-dot"
                  style={{ width: 7, height: 7, borderRadius: "50%", background: CREAM, display: "inline-block", flexShrink: 0 }}
                />
                London · Opening soon
              </span>
            </div>

            <h1
              className="uw-fade-2"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: isMobile ? 32 : "clamp(38px, 4.6vw, 52px)",
                fontWeight: 800,
                color: CREAM,
                lineHeight: 1.02,
                letterSpacing: isMobile ? "-1px" : "-1.5px",
                marginBottom: isMobile ? 14 : 16,
                maxWidth: 580,
              }}
            >
              Your high street, live.
            </h1>

            <p
              className="uw-fade-3"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: isMobile ? 15 : 17,
                color: "rgba(255,240,244,0.82)",
                lineHeight: 1.5,
                marginBottom: isMobile ? 24 : 28,
                fontWeight: 500,
                maxWidth: 520,
              }}
            >
              Shops post video and images of what's just landed — fresh stock, one-off pieces, last-hour deals. Claim it, pay in the app, collect in person.
            </p>

            <div className="uw-fade-4" style={{ maxWidth: 420 }}>
              <button
                onClick={() => navigate("/signin")}
                className="uw-btn-primary"
                style={{
                  background: BG,
                  color: FG,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: isMobile ? 14 : 15,
                  letterSpacing: "0.01em",
                  padding: isMobile ? "15px 24px" : "17px 30px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: RADIUS_SM,
                  fontWeight: 800,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
                }}
              >
                Get early access
              </button>
              <div style={{
                marginTop: isMobile ? 12 : 14,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: isMobile ? 12 : 13,
                color: "rgba(255,240,244,0.58)",
                fontWeight: 500,
              }}>
                Own a shop?{" "}
                <a
                  href="/business-apply"
                  style={{ color: CREAM, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  Partner with us
                </a>
              </div>
            </div>
          </div>

          {/* Floating drop collage — muted; samples live in the section below */}
          {SHOW_HERO_FLOATING_CARDS && !isMobile && (
            <div
              className="uw-fade-4"
              aria-hidden
              style={{
                position: "relative",
                height: 520,
                marginRight: -8,
              }}
            >
              {[
                { sample: SAMPLE_DROPS[0], top: 20, left: 40, w: 220, z: 3, cls: "uw-float" },
                { sample: SAMPLE_DROPS[1], top: 120, left: 200, w: 200, z: 2, cls: "uw-float-delay" },
                { sample: SAMPLE_DROPS[2], top: 280, left: 60, w: 210, z: 4, cls: "uw-float" },
              ].map(({ sample, top, left, w, z, cls }) => (
                <div
                  key={sample.title}
                  className={cls}
                  style={{
                    position: "absolute",
                    top, left, width: w, zIndex: z,
                    borderRadius: 22,
                    overflow: "hidden",
                    boxShadow: "0 24px 50px rgba(44,20,16,0.4)",
                    border: "2px solid rgba(255,240,244,0.15)",
                    background: V_DEEP,
                  }}
                >
                  <div style={{
                    height: 150,
                    background: `url(${sample.imageUrl}) center/cover no-repeat`,
                    position: "relative",
                  }}>
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      background: "rgba(44,20,16,0.72)", color: "#fff",
                      fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                      padding: "5px 9px", borderRadius: 999,
                      backdropFilter: "blur(6px)",
                    }}>
                      EXAMPLE
                    </div>
                  </div>
                  <div style={{ padding: "12px 14px 14px", background: V_RICH }}>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.25, marginBottom: 4 }}>
                      {sample.title}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,240,244,0.55)" }}>{sample.business}</span>
                      <span style={{
                        background: V, color: "#fff", fontSize: 12, fontWeight: 800,
                        padding: "5px 10px", borderRadius: 999,
                      }}>
                        £{(sample.pricePence / 100).toFixed(sample.pricePence % 100 === 0 ? 0 : 2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category pills marquee */}
        <div
          className="uw-fade-4"
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "0 0 28px",
            borderTop: "1px solid rgba(255,240,244,0.08)",
          }}
        >
          <div className="uw-marquee-track" aria-hidden style={{ paddingTop: 22 }}>
            {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((type, i) => (
              <div
                key={`${type}-${i}`}
                style={{
                  display: "flex", alignItems: "center",
                  padding: "0 8px", whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: type === "Charity shops" ? 13 : 12,
                  fontStyle: type === "Charity shops" ? "italic" : "normal",
                  fontWeight: type === "Charity shops" ? 700 : 600,
                  color: type === "Charity shops" ? V : "#FFF0F4",
                  background: type === "Charity shops" ? "rgba(22,7,3,0.18)" : "rgba(255,240,244,0.08)",
                  border: type === "Charity shops" ? "1px solid rgba(22,7,3,0.45)" : "1px solid rgba(255,240,244,0.12)",
                  padding: "8px 16px",
                  borderRadius: 999,
                  letterSpacing: "0.02em",
                }}>
                  {type === "Charity shops" ? "Charity shops — we love them" : type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. HOW IT WORKS — phone proof ── */}
      <section style={{ borderBottom: "none", position: "relative", zIndex: 1, overflow: "hidden" }}>
        <div aria-hidden style={{
          position: "absolute",
          top: "5%",
          right: "-5%",
          width: 380,
          height: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,192,205,0.12), transparent 65%)",
          filter: "blur(90px)",
          pointerEvents: "none",
        }} />
        <div style={{
          background: SECTION_WASH,
          color: FG,
          padding: isMobile ? "40px 20px 12px" : "56px 40px 20px",
          position: "relative",
        }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: V, letterSpacing: "0.06em", marginBottom: 12,
          }}>
            <span
              className="uw-pulse-dot"
              style={{ width: 7, height: 7, borderRadius: "50%", background: V, display: "inline-block", flexShrink: 0 }}
            />
            HOW IT WORKS
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: isMobile ? 24 : 32,
            fontWeight: 700, letterSpacing: "-0.8px",
            lineHeight: 1.1, marginBottom: 14, maxWidth: 560,
            color: FG,
          }}>
            See it. Claim it. Collect it.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: isMobile ? 14 : 16,
            fontWeight: 400,
            color: MUTED_FG,
            lineHeight: 1.55,
            maxWidth: 760,
            margin: "0 0 16px",
          }}>
            A bakery posts the loaf that just came out. A boutique shows the jacket on the rail.
            You see the actual item in a photo or video, claim it before someone else does, and walk in to collect it — no guessing, no waiting for delivery.
          </p>
        </div>

        <div style={{
          padding: isMobile ? "20px 16px 48px" : "28px 40px 64px",
          background: SECTION_WASH,
          position: "relative",
        }}>
          <HowItWorksPhones />
          <p style={{
            margin: "18px auto 0",
            maxWidth: 520,
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: MUTED_FG,
            fontWeight: 500,
          }}>
            Illustrative phone screens · fictional shops — nothing here can be claimed yet.
          </p>
        </div>
      </section>

      {/* ── 3. SAMPLES — muted; hero + How it works phones carry the proof ── */}
      {SHOW_WHAT_YOU_SEE && (
      <section style={{ background: SECTION_WASH, position: "relative", zIndex: 1 }}>
        <div style={{ padding: isMobile ? "40px 20px 12px" : "56px 40px 16px" }}>
          <div className="uw-sticker" style={{ marginBottom: 16 }}>
            WHAT YOU SEE
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: isMobile ? 30 : 40,
            fontWeight: 800, color: FG, letterSpacing: "-1px",
            lineHeight: 1.1, maxWidth: 560, marginBottom: 14,
          }}>
            See the real thing. Then collect it.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17,
            color: FG, lineHeight: 1.55, maxWidth: 560, fontWeight: 500, marginBottom: 8,
          }}>
            A bakery posts the loaf that just came out. A florist shows the bunch that just landed.
            A boutique puts the jacket on the rail — in a photo or short video.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.6, maxWidth: 560, fontWeight: 400, marginBottom: 16,
          }}>
            You see it, claim it in seconds, pay in the app, and walk in with a QR.
            No mystery bag. No delivery wait. Just something you chose — waiting at the counter.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12,
            color: MUTED_FG, lineHeight: 1.5, margin: 0, fontWeight: 500,
          }}>
            Mock examples · fictional shops — nothing here can be reserved yet.
          </p>
        </div>

        <SampleDropsCarousel />
      </section>
      )}

      {/* ── 4. FOUNDING SHOPPERS ── */}
      {PRE_LAUNCH && (
        <section style={{
          padding: isMobile ? "52px 20px" : "72px 40px",
          borderBottom: "none",
          background: V,
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
        }}>
          <div aria-hidden style={{
            position: "absolute",
            top: "-20%",
            right: "-15%",
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,80,50,0.18), transparent 70%)",
            filter: "blur(80px)",
            pointerEvents: "none",
          }} />
          <div aria-hidden style={{
            position: "absolute",
            bottom: "-25%",
            left: "-10%",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,22,11,0.25), transparent 65%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }} />

          <div style={{ width: "100%", maxWidth: 680, margin: "0 auto", position: "relative" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 9,
              fontWeight: 800,
              color: CREAM,
              letterSpacing: "0.09em",
              marginBottom: 16,
              background: "rgba(255,240,244,0.12)",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,240,244,0.2)",
            }}>
              <span
                className="uw-pulse-dot"
                style={{ width: 6, height: 6, borderRadius: "50%", background: CREAM, display: "inline-block", flexShrink: 0 }}
              />
              FIRST 500 ONLY · CLOSING SOON
            </div>
            <h2 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: isMobile ? 32 : 44,
              fontWeight: 800,
              color: CREAM,
              letterSpacing: "-1.2px",
              lineHeight: 1.05,
              marginBottom: 16,
            }}>
              Be a founding shopper.
              <br />
              Get in before the doors open.
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: isMobile ? 16 : 18,
              fontWeight: 500,
              color: "rgba(255,240,244,0.85)",
              lineHeight: 1.5,
              marginBottom: 32,
              maxWidth: 540,
            }}>
              When we launch your neighbourhood, you'll have access before anyone else. Free premium features, first dibs on every drop, and real influence over what happens next.
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: isMobile ? 14 : 16,
              marginBottom: 36,
            }}>
              {[
                {
                  icon: "⚡",
                  title: "First access to every drop",
                  desc: "Claim items 24 hours before the public — the best stuff won't even make it to general release",
                },
                {
                  icon: "✨",
                  title: "Premium features, free forever",
                  desc: "Get all the premium tools for free while regular shoppers pay. Priority notifications, advanced filters, saved searches — all unlocked",
                },
                {
                  icon: "🎯",
                  title: "Shape what happens next",
                  desc: "Vote on which shops join your neighbourhood, request new features, and help build Unwrapped for your high street",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  style={{
                    background: "rgba(255,240,244,0.08)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,240,244,0.18)",
                    borderRadius: 14,
                    padding: isMobile ? "18px 16px" : "20px 22px",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,240,244,0.14)";
                    e.currentTarget.style.borderColor = "rgba(255,240,244,0.35)";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,240,244,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,240,244,0.18)";
                    e.currentTarget.style.transform = "translateX(0)";
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                  }}>
                    <span style={{
                      fontSize: 26,
                      lineHeight: 1,
                      flexShrink: 0,
                    }}>
                      {icon}
                    </span>
                    <div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: isMobile ? 16 : 17,
                        fontWeight: 700,
                        color: CREAM,
                        marginBottom: 6,
                        letterSpacing: "-0.2px",
                      }}>
                        {title}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: isMobile ? 14 : 15,
                        fontWeight: 400,
                        color: "rgba(255,240,244,0.75)",
                        lineHeight: 1.5,
                      }}>
                        {desc}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 14,
              alignItems: isMobile ? "stretch" : "center",
              marginBottom: 18,
            }}>
              <button
                onClick={() => navigate("/signin")}
                className="uw-btn-primary"
                style={{
                  background: CREAM,
                  color: V_DEEP,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 800,
                  letterSpacing: "0.01em",
                  padding: isMobile ? "17px 28px" : "18px 32px",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: RADIUS_SM,
                  boxShadow: "0 14px 38px rgba(0,0,0,0.35)",
                }}
              >
                Become a founding shopper
              </button>
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: "rgba(255,240,244,0.65)",
                fontWeight: 500,
                textAlign: isMobile ? "center" : "left",
              }}>
                No payment required · Just your email
              </div>
            </div>

            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "rgba(255,240,244,0.5)",
              fontWeight: 500,
              textAlign: "center",
              fontStyle: "italic",
            }}>
              Once we hit 500, this closes. Regular shoppers won't get early access or free premium features.
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

      {/* ── 6b. RECOMMEND A SHOP — neighbourhood nominations ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "64px 40px",
        borderBottom: "none",
        background: SECTION_WASH,
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ maxWidth: 720 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: V, letterSpacing: "0.06em", marginBottom: 16,
          }}>
            FOR NEIGHBOURS · NOMINATE
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
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
            Recommend a bakery, florist, bookshop, boutique, or charity shop.
            We'll reach out and let them know someone selected them — you don't need to own the business to nominate it.
          </p>
          <a
            href="/recommend"
            className="uw-btn-primary"
            style={{
              background: V_DEEP, color: BG,
              fontFamily: "'DM Sans', sans-serif", fontSize: 10,
              letterSpacing: "0.04em", padding: "15px 28px",
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
        background: BAND_WASH,
        color: BG,
        position: "relative",
        overflow: "hidden",
        zIndex: 1,
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
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: V, letterSpacing: "0.06em", marginBottom: 16,
          }}>
            SEE IT · CLAIM IT · COLLECT IT
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "clamp(30px, 4.2vw, 48px)",
            fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.2px",
            marginBottom: 16,
          }}>
            Be here when London{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>unwraps.</em>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: "rgba(255,248,245,0.7)", lineHeight: 1.65,
            marginBottom: 32, maxWidth: 440, fontWeight: 300,
          }}>
            Create a founding shopper account. When London's best shops post fresh arrivals and limited deals, claim them instantly on your phone before they're gone.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => navigate("/signin")}
              className="uw-btn-primary"
              style={{
                background: V, color: BG,
                fontFamily: "'DM Sans', sans-serif", fontSize: 10,
                letterSpacing: "0.04em", padding: "15px 28px",
                border: "none", cursor: "pointer",
              }}
            >
              JOIN AS A FOUNDING SHOPPER
            </button>
          </div>
          <p style={{
            marginTop: 18,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13,
            color: "rgba(255,248,245,0.65)",
            fontWeight: 500,
          }}>
            Own a shop?{" "}
            <a
              href="/business-apply"
              style={{ color: CREAM, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}
            >
              Partner with us
            </a>
          </p>
          <a
            href="/london"
            style={{
              display: "inline-block",
              marginTop: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,248,245,0.75)",
              textDecoration: "none",
            }}
          >
            Browse London boroughs →
          </a>
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
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: FG }}>
              Unwrapped
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.65, maxWidth: 280, fontWeight: 300,
          }}>
            See what local shops just posted. Claim it before it's gone. Collect in person.
          </p>
        </div>

        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.05em", marginBottom: 14,
          }}>
            EXPLORE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Sign in", href: "/signin" },
              { label: "For businesses", href: "/business-apply" },
              { label: "Recommend a shop", href: "/recommend" },
              { label: "London boroughs", href: "/london" },
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
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.05em", marginBottom: 14,
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
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: MUTED_FG, letterSpacing: "0.04em" }}>
            © 2026 UNWRAPPED · LONDON
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: MUTED_FG, letterSpacing: "0.04em" }}>
            SHOPUNWRAPPED.COM
          </span>
        </div>
      </footer>
    </div>
  );
}

function HowItWorksPhones() {
  const isMobile = useIsMobile();
  return (
    <div className="uw-phones-row" style={{ gap: isMobile ? 14 : 22 }}>
      {HOW_IT_WORKS_PHONES.map((phone) => (
        <div
          key={phone.title}
          className="uw-phone-wrap"
          style={{ flex: isMobile ? "0 0 min(200px, 72vw)" : "0 0 240px" }}
        >
          <div className="uw-phone-frame" style={{ maxWidth: isMobile ? 200 : 240 }}>
            <div className="uw-phone-screen">
              <div className="uw-phone-notch" aria-hidden />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `url(${phone.ownerImage}) center/cover no-repeat`,
                }}
              />
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(10,6,5,0.15) 0%, transparent 28%, rgba(10,6,5,0.35) 55%, rgba(10,6,5,0.92) 100%)",
                }}
              />
              {phone.media === "video" && (
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    top: "42%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                    width: 54,
                    height: 54,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.42)",
                    border: "1.5px solid rgba(255,240,244,0.85)",
                    display: "grid",
                    placeItems: "center",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                    <path d="M6.2 3.8v10.4L14.6 9 6.2 3.8Z" fill="#FFF7F2" />
                  </svg>
                </div>
              )}
              <div
                style={{
                  position: "absolute",
                  top: 34,
                  left: 12,
                  right: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    color: "#fff",
                    background: V,
                    padding: "6px 10px",
                    borderRadius: 999,
                    boxShadow: "0 8px 18px rgba(22,7,3,0.35)",
                  }}
                >
                  {phone.dropLabel}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    color: "#fff",
                    background: "rgba(0,0,0,0.5)",
                    padding: "5px 9px",
                    borderRadius: 999,
                    backdropFilter: "blur(6px)",
                  }}
                >
                  {phone.media === "video" ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                      <path d="M2.2 1.2v6.6L7.8 4.5 2.2 1.2Z" fill="#fff" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                      <rect x="1" y="2" width="8" height="6" rx="1" stroke="#fff" strokeWidth="1.2" />
                      <circle cx="3.6" cy="4.2" r="0.9" fill="#fff" />
                      <path d="M5.2 7.2 6.6 5.4 9 7.2" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {phone.media === "video" ? "VIDEO" : "PHOTO"}
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 12,
                  right: 12,
                  bottom: 14,
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,240,244,0.75)",
                    marginBottom: 4,
                  }}
                >
                  {phone.business}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.25,
                    marginBottom: 10,
                    letterSpacing: "-0.2px",
                  }}
                >
                  {phone.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      background: "#fff",
                      color: FG,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 800,
                      padding: "8px 12px",
                      borderRadius: 999,
                    }}
                  >
                    £{(phone.pricePence / 100).toFixed(phone.pricePence % 100 === 0 ? 0 : 2)}
                  </span>
                  <span
                    style={{
                      background: V,
                      color: "#fff",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "8px 14px",
                      borderRadius: 999,
                    }}
                  >
                    Claim
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
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
    <section style={{ borderBottom: "none" }}>
      <div style={{
        padding: isMobile ? "28px 20px" : "40px 40px 28px",
        display: "flex", justifyContent: "space-between",
        alignItems: isMobile ? "stretch" : "flex-end",
        flexDirection: isMobile ? "column" : "row",
        gap: 20,
      }}>
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.06em", marginBottom: 12,
          }}>
            LONDON · GETTING READY
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
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
            background: V_DEEP, color: BG,
            fontFamily: "'DM Sans', sans-serif", fontSize: 10,
            letterSpacing: "0.04em", padding: "12px 22px",
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
    <section style={{ borderBottom: "none" }}>
      <div style={{
        padding: isMobile ? "28px 20px" : "40px 40px 28px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "250px minmax(0, 1fr)",
        gap: isMobile ? 24 : 24,
        alignItems: "start",
      }}>
        <div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 9,
            color: FG,
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}>
            LONDON · GETTING READY
          </div>
          <h2 style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: isMobile ? 29 : 36,
            fontWeight: 750,
            color: FG,
            letterSpacing: "-1px",
            lineHeight: 1.08,
            marginBottom: 12,
          }}>
            Search the map
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: FG,
            lineHeight: 1.65,
            maxWidth: 520,
            fontWeight: 400,
            marginBottom: 8,
          }}>
            {filteredPins.length === 0
              ? "No matches — clear your search to see the full curated board."
              : "Browse shops coming onto Unwrapped. Nominate one you love."}
          </p>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 10,
            color: FG,
            letterSpacing: "0.04em",
            marginBottom: 14,
          }}>
            {filteredPins.length} showing
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <a
              href="/recommend"
              style={{
                background: V_DEEP,
                color: BG,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                letterSpacing: "0.06em",
                padding: "12px 18px",
                border: "none",
                borderRadius: 12,
                boxShadow: "0 10px 26px rgba(44,20,16,0.10)",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              NOMINATE A SHOP
            </a>
            <a
              href="/business-apply"
              style={{
                background: "transparent",
                color: FG,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
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
              FOR BUSINESSES
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
                background: V_DEEP,
                color: BG,
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                letterSpacing: "0.04em",
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
                    aria-pressed={focused}
                    onClick={() => {
                      setFocusedId((current) => (current === p.id ? undefined : p.id));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setFocusedId((current) => (current === p.id ? undefined : p.id));
                      }
                    }}
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${BORDER}`,
                      cursor: "pointer",
                      background: focused
                        ? (p.isMember ? "rgba(44,20,16,0.08)" : "rgba(22,7,3,0.08)")
                        : "transparent",
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
                      {p.isMember ? (
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 8,
                          color: FG,
                          letterSpacing: "0.04em",
                          border: `1px solid ${FG}`,
                          padding: "2px 6px",
                          flexShrink: 0,
                        }}>
                          MEMBER
                        </span>
                      ) : null}
                    </div>
                    <div style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 10,
                      color: FG,
                      letterSpacing: "0.04em",
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

        <div style={{
          border: `${isMobile ? 2 : 3}px solid ${FG}`,
          borderRadius: isMobile ? 18 : 22,
          overflow: "hidden",
          background: FG,
          boxShadow: "0 18px 50px rgba(75,32,22,0.12)",
          marginTop: isMobile ? 0 : 150,
        }}>
          <DirectoryMap
            pins={filteredPins}
            defaultLat={mapCenter.lat}
            defaultLng={mapCenter.lng}
            zoom={13}
            height={isMobile ? "356px" : "760px"}
            focusedId={focusedId}
            onPinSelect={setFocusedId}
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
      padding: `${isMobile ? 8 : 12}px 0 ${isMobile ? 28 : 36}px`,
      background: SECTION_WASH,
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
            style={{
              width: slideWidth,
              borderRadius: RADIUS,
              overflow: "hidden",
              boxShadow: "0 16px 40px rgba(44,20,16,0.12)",
              border: `1px solid ${BORDER}`,
              background: "#fff",
            }}
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
        padding: `${isMobile ? 16 : 20}px ${pad}px 0`,
      }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {SAMPLE_DROPS.map((sample, i) => (
            <button
              key={sample.title}
              type="button"
              aria-label={`Go to example ${i + 1}`}
              onClick={() => goTo(i)}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
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
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              padding: "10px 16px",
              border: `1.5px solid ${BORDER}`,
              background: "#fff",
              color: index === 0 ? MUTED_FG : FG,
              cursor: index === 0 ? "default" : "pointer",
              borderRadius: RADIUS_SM,
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
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              padding: "10px 16px",
              border: `1.5px solid ${BORDER}`,
              background: "#fff",
              color: index >= SAMPLE_DROPS.length - 1 ? MUTED_FG : FG,
              cursor: index >= SAMPLE_DROPS.length - 1 ? "default" : "pointer",
              borderRadius: RADIUS_SM,
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
      style={{ background: "#fff", padding: 0, position: "relative" }}
      aria-label={`Sample drop: ${sample.title}. Not live.`}
    >
      <div style={{
        height: compact ? 200 : 240,
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
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 45%, rgba(44,20,16,0.55) 100%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 12, left: 12,
          background: "rgba(18,14,12,0.72)", color: "#fff",
          padding: "6px 10px", borderRadius: 999,
          backdropFilter: "blur(8px)",
          fontFamily: "'DM Sans', sans-serif", fontSize: 10,
          fontWeight: 700, letterSpacing: "0.06em",
        }}>
          EXAMPLE
        </div>
        {hasDiscount && discountPct != null && discountPct > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            background: V, color: "#fff",
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            fontWeight: 800, letterSpacing: "0.04em", padding: "6px 10px",
            borderRadius: 999,
            boxShadow: "0 8px 18px rgba(22,7,3,0.35)",
          }}>
            {discountPct}% OFF
          </div>
        )}
        <div style={{
          position: "absolute", bottom: 12, left: 12, right: 12,
          display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 8,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 11,
            color: "rgba(255,240,244,0.9)", fontWeight: 600,
          }}>
            {sample.left}
          </span>
          <span style={{
            background: "#fff", color: FG,
            fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 800,
            padding: "7px 12px", borderRadius: 999,
          }}>
            £{(sample.pricePence / 100).toFixed(sample.pricePence % 100 === 0 ? 0 : 2)}
          </span>
        </div>
      </div>

      <div style={{ padding: compact ? "16px 16px 18px" : "18px 18px 22px" }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 11,
          color: V, letterSpacing: "0.04em", marginBottom: 6, fontWeight: 700,
          textTransform: "uppercase",
        }}>
          {sample.category} · {sample.neighbourhood}
        </div>

        <h3 style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: compact ? 17 : 19,
          fontWeight: 800, color: FG, marginBottom: 4, lineHeight: 1.25, letterSpacing: "-0.3px",
        }}>
          {sample.title}
        </h3>

        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: MUTED_FG, marginBottom: 14, fontWeight: 500,
        }}>
          {sample.business}
        </div>

        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginBottom: 12,
        }}>
          {sample.window}
        </div>

        <div style={{
          background: V, color: "#fff",
          textAlign: "center", fontWeight: 700, fontSize: 13,
          padding: "12px 14px", borderRadius: RADIUS_SM,
          letterSpacing: "0.02em",
        }}>
          Claim · illustrative only
        </div>
      </div>
    </div>
  );
}
