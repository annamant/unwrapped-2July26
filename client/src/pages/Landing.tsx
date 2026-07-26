import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "../trpc";
import DropMap, { toDropPin } from "../components/DropMap";
import useIsMobile from "../hooks/useIsMobile";

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
  price: string;
  window: string;
  left: string;
  imageUrl: string;
};

const SAMPLE_DROPS: SampleDrop[] = [
  {
    category: "Food & Drink",
    neighbourhood: "Hackney",
    title: "Saturday sourdough — six loaves",
    business: "River Oven Bakery",
    price: "£4.50",
    window: "Collect Sat 9–11am",
    left: "6 available",
    imageUrl: "/samples/sourdough.jpg",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Clapham",
    title: "Express blow-dry — walk-in window",
    business: "Marlow Hair Studio",
    price: "£28.00",
    window: "Session today 4–7pm",
    left: "4 spots",
    imageUrl: "/samples/blowdry.jpg",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Islington",
    title: "45-min personal training session",
    business: "Jordan Ellis PT",
    price: "£35.00",
    window: "Session Tue 6–8pm",
    left: "3 spots",
    imageUrl: "/samples/pt.jpg",
  },
];

const BUSINESS_TYPES = [
  "Charity shops",
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
@keyframes uw-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
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
@keyframes uw-float-a {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes uw-float-b {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
@keyframes uw-float-c {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
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
.uw-float-a { animation: uw-float-a 5.5s ease-in-out infinite; }
.uw-float-b { animation: uw-float-b 6.5s ease-in-out infinite 0.4s; }
.uw-float-c { animation: uw-float-c 7s ease-in-out infinite 0.8s; }
.uw-btn-primary {
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}
.uw-btn-primary:hover {
  background: ${V} !important;
  color: ${BG} !important;
  transform: translateY(-1px);
}
.uw-btn-ghost {
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}
.uw-btn-ghost:hover {
  border-color: ${FG} !important;
  background: ${MUTED} !important;
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
  .uw-hero-map, .uw-pulse-dot, .uw-marquee-track,
  .uw-float-a, .uw-float-b, .uw-float-c { animation: none !important; }
  .uw-sample-img, .uw-btn-primary, .uw-btn-ghost { transition: none !important; }
}
`;

export default function Landing() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const today = format(new Date(), "EEE d MMM yyyy").toUpperCase();
  const [scrolled, setScrolled] = useState(false);

  // Keep fetching drops so the London map shows real pins as soon as partners go live.
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

      {/* ── Masthead nav ── */}
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
            color: MUTED_FG, letterSpacing: "0.12em",
            minWidth: 180,
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
          <img
            src="/logo-mark.svg"
            alt=""
            width={28}
            height={28}
            style={{ display: "block", flexShrink: 0 }}
          />
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
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: MUTED_FG, textDecoration: "none",
            }}
          >
            Instagram
          </a>
          <a
            href="/business-apply"
            className="uw-link"
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              color: MUTED_FG, textDecoration: "none",
            }}
          >
            {isMobile ? "Business" : "List your business"}
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

      {/* ── Hero ── */}
      <section style={{
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        {/* Atmospheric map plane */}
        <div
          aria-hidden
          style={{
            position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
          }}
        >
          <div
            className="uw-hero-map"
            style={{
              position: "absolute",
              inset: "-6%",
              backgroundImage: "url(/email-london-map.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center 42%",
              opacity: 0.22,
              filter: "grayscale(0.35) contrast(0.95) brightness(1.08)",
            }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: `
              linear-gradient(180deg, ${BG} 0%, rgba(250,250,248,0.72) 28%, rgba(250,250,248,0.92) 70%, ${BG} 100%),
              radial-gradient(ellipse 50% 45% at 88% 38%, rgba(232,52,28,0.06), transparent 55%)
            `,
          }} />
        </div>

        <div style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(0, 0.95fr)",
          gap: isMobile ? 28 : 40,
          alignItems: "start",
          padding: isMobile ? "36px 20px 28px" : "48px 40px 40px",
        }}>
          {/* Copy column */}
          <div style={{ maxWidth: 560 }}>
            <div
              className="uw-fade-1"
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                color: V, letterSpacing: "0.14em", marginBottom: 16,
              }}
            >
              <span
                className="uw-pulse-dot"
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: V, display: "inline-block", flexShrink: 0,
                }}
              />
              LIVE RIGHT NOW · SIGNING UP BUSINESSES ACROSS LONDON
            </div>

            <h1
              className="uw-fade-2"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(36px, 5.5vw, 62px)",
                fontWeight: 700, color: FG,
                lineHeight: 1.05, letterSpacing: "-1.5px",
                marginBottom: 16,
              }}
            >
              Limited local drops.
              <br />
              <em style={{ fontStyle: "italic", fontWeight: 400 }}>We're building the street.</em>
            </h1>

            <p
              className="uw-fade-3"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17,
                color: FG, lineHeight: 1.55,
                marginBottom: 12, fontWeight: 400,
              }}
            >
              Unwrapped is where you discover time-limited drops from local businesses
              near you — reserve in seconds, collect with a QR code.
            </p>

            <p
              className="uw-fade-3"
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 15,
                color: MUTED_FG, lineHeight: 1.6,
                marginBottom: 24, fontWeight: 300,
              }}
            >
              Sign up now — be ready the moment things start to drop.
              We're boarding shops, salons, cafés, freelancers, accountants, and{" "}
              <em style={{ fontStyle: "italic", color: FG, fontWeight: 400 }}>charity shops</em>
              {" "}(we love charity shops) every day.
            </p>

            <div className="uw-fade-4" style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => navigate("/signin")}
                  className="uw-btn-primary"
                  style={{
                    background: FG, color: BG,
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "15px 30px",
                    border: "none", cursor: "pointer",
                  }}
                >
                  SIGN UP — BE READY
                </button>
                <a
                  href="/business-apply"
                  className="uw-btn-ghost"
                  style={{
                    border: `1px solid ${FG}`, color: FG,
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "14px 26px",
                    textDecoration: "none", display: "inline-block",
                    background: "transparent",
                  }}
                >
                  LIST YOUR BUSINESS
                </a>
              </div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                color: MUTED_FG, lineHeight: 1.55, maxWidth: 420,
              }}>
                Follow the build on{" "}
                <a
                  href="https://www.instagram.com/shopunwrapped/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: V, textDecoration: "none", borderBottom: `1px solid ${V}` }}
                >
                  @shopunwrapped
                </a>
                .
              </p>
            </div>
          </div>

          {/* Visual column */}
          <div className="uw-fade-3">
            <HeroVisual isMobile={isMobile} />
          </div>
        </div>

        {/* Scrolling business types */}
        <div
          className="uw-fade-4"
          style={{
            position: "relative",
            borderTop: `1px solid ${BORDER}`,
            background: "rgba(250,250,248,0.92)",
            overflow: "hidden",
          }}
        >
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 48, zIndex: 1,
            background: `linear-gradient(90deg, ${BG}, transparent)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 48, zIndex: 1,
            background: `linear-gradient(270deg, ${BG}, transparent)`,
            pointerEvents: "none",
          }} />
          <div className="uw-marquee-track" aria-hidden>
            {[...BUSINESS_TYPES, ...BUSINESS_TYPES].map((type, i) => (
              <div
                key={`${type}-${i}`}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  padding: "16px 28px",
                  whiteSpace: "nowrap",
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
                  fontSize: type === "Charity shops" ? 15 : 11,
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

      {/* ── Mission invite — pre-launch ── */}
      {PRE_LAUNCH && (
        <section style={{
          padding: isMobile ? "40px 20px" : "56px 40px",
          borderBottom: `1px solid ${BORDER}`,
          background: `
            linear-gradient(135deg, ${MUTED} 0%, ${BG} 48%, rgba(232,52,28,0.04) 100%)
          `,
        }}>
          <div style={{
            maxWidth: 880,
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "200px 1fr",
            gap: isMobile ? 28 : 56,
            alignItems: "start",
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9,
                color: V, letterSpacing: "0.14em", marginBottom: 16,
              }}>
                BE PART OF THIS
              </div>
              <div style={{
                width: 40, height: 3, background: V, marginBottom: 20,
              }} />
              <p style={{
                fontFamily: "'Space Mono', monospace", fontSize: 11,
                color: MUTED_FG, letterSpacing: "0.08em", lineHeight: 1.7,
              }}>
                LONDON
                <br />
                PRE-LAUNCH
              </p>
            </div>

            <div>
              <p style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? 28 : 38,
                fontWeight: 700, color: FG, lineHeight: 1.18,
                letterSpacing: "-0.8px", marginBottom: 20,
              }}>
                We're not live yet — and that's exactly why{" "}
                <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>you</em> matter.
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 16,
                color: FG, lineHeight: 1.75, marginBottom: 18, maxWidth: 560, fontWeight: 300,
              }}>
                Unwrapped only works if neighbourhood businesses and local people build it together.
                The businesses boarding now aren't unlocking a finished product — they're making
                the drops happen. Shoppers who sign up now aren't waiting on the sidelines —
                they're the first ones we'll keep posted.
              </p>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                color: MUTED_FG, lineHeight: 1.7, maxWidth: 520,
              }}>
                We need you. We want to hear what you have to say. This only becomes real if
                you're in it with us.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── Sample drops ── */}
      <section>
        <div style={{
          padding: isMobile ? "36px 20px 24px" : "56px 40px 28px",
        }}>
          <div style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16, marginBottom: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "'Space Mono', monospace", fontSize: 9,
                color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12,
              }}>
                WHAT A DROP LOOKS LIKE
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? 28 : 36,
                fontWeight: 700, color: FG, letterSpacing: "-0.8px",
                lineHeight: 1.15, maxWidth: 420,
              }}>
                The feeling, before it's live.
              </h2>
            </div>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: V, letterSpacing: "0.12em",
              border: `1px solid ${V}`,
              padding: "8px 12px",
              alignSelf: isMobile ? "flex-start" : "flex-end",
            }}>
              SAMPLE · NOT LIVE
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.65, maxWidth: 520,
          }}>
            Fictional shops and drops — so you can see how Unwrapped will feel.
            Real ones appear here once we launch.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1, background: BORDER,
          borderTop: `1px solid ${BORDER}`,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {SAMPLE_DROPS.map((sample) => (
            <SampleDropCard key={sample.title} sample={sample} />
          ))}
        </div>
      </section>

      {/* ── London map ── */}
      <MapSection
        drops={drops ?? []}
        onDropClick={(id) => navigate(`/drop/${id}`)}
      />

      {/* ── Mission / why ── */}
      <section style={{
        padding: isMobile ? "56px 20px" : "88px 40px",
        borderBottom: `1px solid ${BORDER}`,
        position: "relative",
        overflow: "hidden",
      }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: isMobile ? -40 : 40,
            top: isMobile ? 20 : 48,
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 120 : 200,
            fontWeight: 700,
            color: FG,
            opacity: 0.035,
            lineHeight: 1,
            letterSpacing: "-6px",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          local
        </div>

        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 24,
        }}>
          WHY WE'RE DOING THIS
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(30px, 4vw, 48px)",
          fontWeight: 700, color: FG,
          lineHeight: 1.12, letterSpacing: "-1.2px",
          marginBottom: 36, maxWidth: 680,
        }}>
          Because the best things happen{" "}
          <em style={{ fontStyle: "italic", color: V }}>on your street</em> —
          not in another endless feed.
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 28 : 56,
          maxWidth: 860,
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.8, fontWeight: 300,
          }}>
            Local people deserve a simple way to find what's on offer nearby —
            a morning special, a spare salon slot, a trainer with three openings
            this week — before it disappears.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.8, fontWeight: 300,
          }}>
            The businesses on your street — shops, salons, cafés, freelancers,
            franchisees running a local branch — are run by real people. Unwrapped
            helps them show you what they have, when they have something to share.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={{
        padding: isMobile ? "56px 20px" : "80px 40px",
        borderBottom: `1px solid ${BORDER}`,
        background: MUTED,
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          flexWrap: "wrap", gap: 16, marginBottom: 40,
        }}>
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 14,
            }}>
              HOW IT WORKS
            </div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 28 : 36,
              fontWeight: 700, color: FG, letterSpacing: "-0.8px", lineHeight: 1.15,
            }}>
              Three steps. That's it.
            </h2>
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 20 : 0,
        }}>
          {[
            {
              n: "01",
              title: "Discover what's dropping",
              body: "Browse time-limited drops from local businesses near you — shops, salons, cafés, freelancers and more.",
            },
            {
              n: "02",
              title: "Reserve before it's gone",
              body: "Tap to reserve. Your ticket is issued instantly — only as many as the business decides to release.",
            },
            {
              n: "03",
              title: "Show up. QR. Done.",
              body: "Arrive in the collection window. The business scans your code. The drop is yours.",
            },
          ].map(({ n, title, body }, i) => (
            <div
              key={n}
              className="uw-step"
              style={{
                background: BG,
                padding: isMobile ? "28px 24px" : "40px 36px",
                borderRight: !isMobile && i < 2 ? `1px solid ${BORDER}` : "none",
                border: isMobile ? `1px solid ${BORDER}` : undefined,
                borderTop: !isMobile ? `1px solid ${BORDER}` : undefined,
                borderBottom: !isMobile ? `1px solid ${BORDER}` : undefined,
                borderLeft: !isMobile && i === 0 ? `1px solid ${BORDER}` : undefined,
                position: "relative",
              }}
            >
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 48, fontWeight: 700, color: V,
                opacity: 0.18, lineHeight: 1, marginBottom: 20,
                letterSpacing: "-2px",
              }}>
                {n}
              </div>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, fontWeight: 600, color: FG,
                marginBottom: 14, lineHeight: 1.25,
              }}>
                {title}
              </h3>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15, color: MUTED_FG, lineHeight: 1.7, fontWeight: 300,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Building now ── */}
      <section style={{
        padding: isMobile ? "56px 20px" : "80px 40px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 14,
        }}>
          WHAT WE'RE BUILDING
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: isMobile ? 28 : 36,
          fontWeight: 700, color: FG, letterSpacing: "-0.8px",
          lineHeight: 1.15, marginBottom: 40, maxWidth: 520,
        }}>
          Built with the people who use it.
        </h2>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1, background: BORDER,
          border: `1px solid ${BORDER}`,
        }}>
          {[
            {
              n: "01",
              title: "Businesses making this happen",
              body: "The businesses boarding now aren't unlocking a finished product — they're helping build Unwrapped with us. Local shops, salons, cafés, freelancers, franchisees.",
            },
            {
              n: "02",
              title: "Shoppers signing up",
              body: "Sign up as a shopper and we'll keep you posted on every development — so when neighbourhoods go live, you're already part of it.",
            },
            {
              n: "03",
              title: "Getting ready to launch",
              body: "We're not live yet. When we open, you'll browse what's dropping near you, reserve in seconds, and collect with a QR code.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="uw-step" style={{ background: BG, padding: isMobile ? "28px 24px" : "36px 32px" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11, color: V, letterSpacing: "0.1em", marginBottom: 18,
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
                fontSize: 14, color: MUTED_FG, lineHeight: 1.7, fontWeight: 300,
              }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Business pitch ── */}
      <section style={{
        padding: isMobile ? "56px 20px" : "88px 40px",
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.05fr 0.95fr",
        gap: isMobile ? 40 : 72, alignItems: "center",
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
            fontSize: "clamp(30px, 3.8vw, 44px)",
            fontWeight: 700, color: FG,
            lineHeight: 1.1, letterSpacing: "-1.2px", marginBottom: 24,
          }}>
            Drop when you want.
            <br />
            <em style={{ fontStyle: "italic" }}>We bring</em>{" "}
            <em style={{ fontStyle: "italic", color: V }}>the street to you.</em>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: MUTED_FG, lineHeight: 1.75,
            marginBottom: 18, maxWidth: 440, fontWeight: 300,
          }}>
            If you're boarding now, you're not accessing something finished — you're making
            this happen. We need neighbourhood businesses. We're building this together.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.75,
            marginBottom: 36, maxWidth: 420, fontWeight: 300,
          }}>
            No schedule to keep. No endless promo. When it's convenient — a quiet afternoon,
            a special, something you're proud of — publish a drop in minutes.
          </p>

          <a
            href="/business-apply"
            className="uw-btn-primary"
            style={{
              background: FG, color: BG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "15px 28px",
              textDecoration: "none", display: "inline-block",
              border: "none",
            }}
          >
            APPLY TO LIST YOUR BUSINESS
          </a>
        </div>

        <div style={{
          border: `1px solid ${BORDER}`,
          boxShadow: `8px 8px 0 ${MUTED}`,
        }}>
          {[
            {
              label: "Built with you",
              body: "Early businesses aren't customers of a finished product — you're partners. Tell us what works. We're in this together.",
              shade: BG,
            },
            {
              label: "On your terms",
              body: "You drop when you want — when it's convenient, when you have something to say. Your window, your quantity, your call.",
              shade: MUTED,
            },
            {
              label: "We bring the street to you",
              body: "We help you market the fantastic things you do to people nearby who already care — and fill the blanks when the diary is empty.",
              shade: BG,
            },
          ].map(({ label, body, shade }, i) => (
            <div
              key={label}
              style={{
                padding: isMobile ? "24px 22px" : "28px 32px",
                background: shade,
                borderBottom: i < 2 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div style={{
                display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10,
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  color: V, letterSpacing: "0.1em",
                }}>
                  0{i + 1}
                </span>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 18, fontWeight: 600, color: FG,
                }}>
                  {label}
                </div>
              </div>
              <div style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: MUTED_FG, lineHeight: 1.65, fontWeight: 300,
              }}>
                {body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section style={{
        padding: isMobile ? "64px 20px" : "96px 40px",
        borderBottom: `1px solid ${BORDER}`,
        background: FG,
        color: BG,
        position: "relative",
        overflow: "hidden",
      }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `
              radial-gradient(ellipse 50% 80% at 100% 0%, rgba(232,52,28,0.22), transparent 55%),
              radial-gradient(ellipse 40% 60% at 0% 100%, rgba(232,52,28,0.12), transparent 50%)
            `,
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative", maxWidth: 720 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.15em", marginBottom: 20,
          }}>
            READY WHEN YOU ARE
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(32px, 4.5vw, 52px)",
            fontWeight: 700, lineHeight: 1.1, letterSpacing: "-1.4px",
            marginBottom: 20,
          }}>
            Be here when London{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: V }}>unwraps.</em>
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16,
            color: "rgba(250,250,248,0.62)", lineHeight: 1.7,
            marginBottom: 36, maxWidth: 460, fontWeight: 300,
          }}>
            Sign up to stay in the loop — or list your business and help make the first drops real.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => navigate("/signin")}
              className="uw-btn-primary"
              style={{
                background: V, color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "15px 30px",
                border: "none", cursor: "pointer",
              }}
            >
              SIGN UP
            </button>
            <a
              href="/business-apply"
              className="uw-btn-ghost"
              style={{
                border: `1px solid rgba(250,250,248,0.35)`, color: BG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "14px 26px",
                textDecoration: "none", display: "inline-block",
                background: "transparent",
              }}
            >
              LIST YOUR BUSINESS
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: isMobile ? "36px 20px 28px" : "48px 40px 36px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr 1fr",
        gap: isMobile ? 28 : 40,
        background: BG,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img
              src="/logo-mark.svg"
              alt=""
              width={24}
              height={24}
              style={{ display: "block", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: FG }}>
              Unwrapped
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.65, maxWidth: 280, fontWeight: 300,
          }}>
            Limited local drops from neighbourhood businesses. Reserve in seconds. Collect with QR.
          </p>
        </div>

        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 16,
          }}>
            EXPLORE
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Sign in", href: "/signin" },
              { label: "List your business", href: "/business-apply" },
              { label: "Instagram", href: "https://www.instagram.com/shopunwrapped/", external: true },
            ].map(({ label, href, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="uw-link"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: FG, textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 16,
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
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: FG, textDecoration: "none",
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        <div style={{
          gridColumn: isMobile ? "auto" : "1 / -1",
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 20,
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

function HeroVisual({ isMobile }: { isMobile: boolean }) {
  const cards = [
    {
      src: SAMPLE_DROPS[0].imageUrl,
      label: "Bakery · Hackney",
      title: "Saturday sourdough",
      price: "£4.50",
      className: "uw-float-a",
    },
    {
      src: SAMPLE_DROPS[1].imageUrl,
      label: "Salon · Clapham",
      title: "Express blow-dry",
      price: "£28",
      className: "uw-float-b",
    },
    {
      src: SAMPLE_DROPS[2].imageUrl,
      label: "Trainer · Islington",
      title: "45-min session",
      price: "£35",
      className: "uw-float-c",
    },
  ] as const;

  return (
    <div aria-hidden style={{ width: "100%" }}>
      {/* Status bar */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        gap: 1,
        background: BORDER,
        border: `1px solid ${BORDER}`,
        marginBottom: 12,
      }}>
        <div style={{
          flex: 1,
          background: FG,
          color: BG,
          padding: isMobile ? "12px 14px" : "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span
            className="uw-pulse-dot"
            style={{
              width: 7, height: 7, borderRadius: "50%",
              background: V, display: "inline-block", flexShrink: 0,
            }}
          />
          <div>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 8,
              letterSpacing: "0.12em", color: "rgba(250,250,248,0.55)", marginBottom: 2,
            }}>
              BOARDING NOW
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 14 : 16, fontWeight: 600, lineHeight: 1.2,
            }}>
              Businesses joining daily
            </div>
          </div>
        </div>
        <div style={{
          flex: isMobile ? "0 0 auto" : "0 0 42%",
          background: BG,
          padding: isMobile ? "12px 14px" : "14px 16px",
          borderLeft: `3px solid ${V}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: isMobile ? 120 : 0,
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8,
            color: V, letterSpacing: "0.12em", marginBottom: 4,
          }}>
            FAVOURITES
          </div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 13 : 15, fontWeight: 600, fontStyle: "italic",
            color: FG, lineHeight: 1.25,
          }}>
            Charity shops welcome
          </div>
        </div>
      </div>

      {/* Card mosaic — grid, not free-floating overlaps */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: isMobile ? "auto auto" : "auto auto",
        gap: 10,
      }}>
        {cards.map((card, i) => (
          <div
            key={card.title}
            className={card.className}
            style={{
              background: BG,
              border: `1px solid ${BORDER}`,
              overflow: "hidden",
              gridColumn: i === 2 ? "1 / -1" : "auto",
            }}
          >
            <div style={{
              height: i === 2 ? (isMobile ? 120 : 150) : (isMobile ? 110 : 140),
              background: `${MUTED} url(${card.src}) center/cover no-repeat`,
            }} />
            <div style={{
              padding: isMobile ? "10px 12px 12px" : "12px 14px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 8,
                  color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 4,
                  textTransform: "uppercase",
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: isMobile ? 14 : 16, fontWeight: 600, color: FG, lineHeight: 1.25,
                }}>
                  {card.title}
                </div>
              </div>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: V,
                flexShrink: 0,
              }}>
                {card.price}
              </span>
            </div>
          </div>
        ))}
      </div>
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
            DROPS ON THE MAP
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 26 : 32,
            fontWeight: 700, color: FG, letterSpacing: "-0.6px",
            lineHeight: 1.15, marginBottom: 8,
          }}>
            London, pin by pin.
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.6, maxWidth: 420, fontWeight: 300,
          }}>
            {pins.length === 0
              ? "No live drops yet. When neighbourhood businesses launch, their pins show up here."
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

function SampleDropCard({ sample }: { sample: SampleDrop }) {
  return (
    <div
      className="uw-sample-card"
      style={{
        background: BG,
        padding: 0,
        position: "relative",
      }}
      aria-label={`Sample drop: ${sample.title}. Not live.`}
    >
      <div style={{
        height: 200, position: "relative",
        overflow: "hidden",
        background: MUTED,
      }}>
        <div
          className="uw-sample-img"
          style={{
            position: "absolute", inset: 0,
            background: `url(${sample.imageUrl}) center/cover no-repeat`,
          }}
        />
        <div style={{
          position: "absolute", top: 14, left: 14,
          background: BG, padding: "5px 9px",
          border: `1px solid ${BORDER}`,
        }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            color: V, letterSpacing: "0.1em",
          }}>
            SAMPLE
          </span>
        </div>
      </div>

      <div style={{ padding: "22px 22px 26px" }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase",
        }}>
          {sample.category} · {sample.neighbourhood}
        </div>

        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18,
          fontWeight: 600, color: FG, marginBottom: 6, lineHeight: 1.3,
        }}>
          {sample.title}
        </h3>

        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: MUTED_FG, marginBottom: 16, fontWeight: 300,
        }}>
          {sample.business}
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          marginBottom: 8, paddingTop: 14, borderTop: `1px solid ${BORDER}`,
        }}>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: FG }}>
            {sample.price}
          </span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: V }}>
            {sample.left}
          </span>
        </div>

        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG }}>
          {sample.window}
        </div>
      </div>
    </div>
  );
}
