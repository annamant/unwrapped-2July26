import { useLocation } from "wouter";
import { format } from "date-fns";
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
  accent: string;
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
    accent: "#C4B8A5",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Clapham",
    title: "Express blow-dry — walk-in window",
    business: "Marlow Hair Studio",
    price: "£28.00",
    window: "Session today 4–7pm",
    left: "4 spots",
    accent: "#C9B4B0",
  },
  {
    category: "Beauty & Wellness",
    neighbourhood: "Islington",
    title: "45-min personal training session",
    business: "Jordan Ellis PT",
    price: "£35.00",
    window: "Session Tue 6–8pm",
    left: "3 spots",
    accent: "#A8B5A0",
  },
];

export default function Landing() {
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const today = format(new Date(), "EEE d MMM yyyy").toUpperCase();

  return (
    <div style={{ background: BG, color: FG, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Masthead nav ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "14px 20px" : "18px 40px", borderBottom: `1px solid ${BORDER}`,
      }}>
        {!isMobile && (
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10,
            color: MUTED_FG, letterSpacing: "0.12em",
          }}>
            LONDON · {today}
          </span>
        )}

        <a href="/" style={{
          display: "flex", alignItems: "center", gap: 10,
          textDecoration: "none", color: FG,
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
        padding: isMobile ? "48px 20px 40px" : "72px 40px 56px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          color: V, letterSpacing: "0.14em", marginBottom: 20,
        }}>
          GETTING READY TO LAUNCH · LONDON
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 700, color: FG,
          lineHeight: 1.05, letterSpacing: "-1.5px",
          marginBottom: 20, maxWidth: 720,
        }}>
          Limited local drops.<br />
          <em style={{ fontStyle: "italic", fontWeight: 400 }}>Reserved in seconds.</em>
        </h1>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 16 : 18,
          color: MUTED_FG, lineHeight: 1.6,
          marginBottom: 36, maxWidth: 520,
        }}>
          Unwrapped is the place to discover time-limited drops from local businesses near you —
          reserve your spot, then collect with a QR code.
        </p>

        {/* Pre-launch status */}
        {PRE_LAUNCH && (
          <div style={{
            border: `1px solid ${BORDER}`,
            background: MUTED,
            padding: isMobile ? "24px 20px" : "28px 32px",
            marginBottom: 36,
            maxWidth: 640,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: MUTED_FG, letterSpacing: "0.14em", marginBottom: 14,
            }}>
              WHERE WE ARE NOW
            </div>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? 20 : 24,
              color: FG, lineHeight: 1.35, marginBottom: 16,
            }}>
              We're onboarding businesses, building our community, and getting ready to launch.
            </p>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: MUTED_FG, lineHeight: 1.65,
            }}>
              There are no live drops yet. Join early as a shopper, or apply to list your business —
              you'll be first in line when neighbourhoods go live.
            </p>
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
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
            JOIN THE COMMUNITY
          </button>
          <a
            href="/business-apply"
            style={{
              border: `1px solid ${FG}`, color: FG,
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "12px 24px",
              textDecoration: "none", display: "inline-block",
            }}
          >
            LIST YOUR BUSINESS
          </a>
        </div>
      </section>

      {/* ── Sample drops ── */}
      <section style={{ marginTop: 0 }}>
        <div style={{
          padding: isMobile ? "28px 20px 20px" : "36px 40px 20px",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            flexWrap: "wrap", gap: 12, marginBottom: 12,
          }}>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: MUTED_FG, letterSpacing: "0.15em",
            }}>
              WHAT A DROP LOOKS LIKE
            </span>
            <span style={{
              fontFamily: "'Space Mono', monospace", fontSize: 9,
              color: V, letterSpacing: "0.12em",
            }}>
              SAMPLE · NOT LIVE
            </span>
          </div>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 14,
            color: MUTED_FG, lineHeight: 1.6, maxWidth: 520,
          }}>
            These are examples only — fictional shops and drops, so you can see how Unwrapped will feel.
            Real drops will appear here once we launch.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1, background: BORDER,
          borderBottom: `1px solid ${BORDER}`,
        }}>
          {SAMPLE_DROPS.map((sample) => (
            <SampleDropCard key={sample.title} sample={sample} />
          ))}
        </div>
      </section>

      {/* ── Mission / why ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "72px 40px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 20,
        }}>
          WHY WE'RE DOING THIS
        </div>

        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(28px, 3.5vw, 42px)",
          fontWeight: 700, color: FG,
          lineHeight: 1.15, letterSpacing: "-1px",
          marginBottom: 24, maxWidth: 640,
        }}>
          Because the best things happen{" "}
          <em style={{ fontStyle: "italic", color: V }}>on your street</em> —
          not in another endless feed.
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 24 : 48,
          maxWidth: 860,
        }}>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.75,
          }}>
            Local people deserve a simple way to find what's on offer nearby —
            a morning special, a spare salon slot, a trainer with three openings
            this week — before it disappears.
          </p>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.75,
          }}>
            The businesses on your street — shops, salons, cafés, freelancers,
            franchisees running a local branch — are run by real people. Unwrapped
            helps them show you what they have to offer, when they have something
            to share. Neighbourhood businesses. Real people. Limited drops.
          </p>
        </div>
      </section>

      {/* ── Building now ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "64px 40px",
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 40,
        }}>
          WHAT WE'RE BUILDING
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1, background: BORDER,
        }}>
          {[
            {
              n: "01",
              title: "Onboarding businesses",
              body: "Local shops, cafés, salons, studios and neighbourhood businesses across London are applying to list — including people running a local branch. We're onboarding partners ready to run real drops.",
            },
            {
              n: "02",
              title: "Building the community",
              body: "Shoppers who sign up early get drop alerts when neighbourhoods go live — so the first releases reach people who already care.",
            },
            {
              n: "03",
              title: "Getting ready to launch",
              body: "When we open, you'll browse what's dropping near you, reserve in seconds, and collect with a QR code. Limited. Local. Gone when they're gone.",
            },
          ].map(({ n, title, body }) => (
            <div key={n} style={{ background: BG, padding: isMobile ? "28px 24px" : "36px 32px" }}>
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

      {/* ── How it works ── */}
      <section style={{ padding: isMobile ? "48px 20px" : "64px 40px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 40,
        }}>
          HOW IT WORKS
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1, background: BORDER,
        }}>
          {[
            {
              n: "01",
              title: "Discover what's dropping",
              body: "Browse time-limited drops from local businesses near you — shops, salons, cafés, freelancers and more. Each one is unique to that moment.",
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
            <div key={n} style={{ background: BG, padding: isMobile ? "28px 24px" : "36px 32px" }}>
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

      {/* ── Business pitch ── */}
      <section style={{
        padding: isMobile ? "48px 20px" : "72px 40px",
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 40 : 80, alignItems: "center",
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
            Drop when you want.<br />
            <em style={{ fontStyle: "italic" }}>We bring</em>{" "}
            <em style={{ fontStyle: "italic", color: V }}>the street to you.</em>
          </h2>

          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 15,
            color: MUTED_FG, lineHeight: 1.7,
            marginBottom: 36, maxWidth: 400,
          }}>
            No schedule to keep. No endless promo. When it's convenient — a quiet afternoon,
            a special, something you're proud of — publish a drop in minutes. We help you market
            the fantastic things you already do, and fill the blanks when the diary is empty.
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

        <div style={{ border: `1px solid ${BORDER}` }}>
          {[
            {
              label: "On your terms",
              body: "You drop when you want — when it's convenient, when you have something to say. No pressure to post every day. Your window, your quantity, your call.",
              shade: BG,
            },
            {
              label: "We bring the street to you",
              body: "We help you market the fantastic things you do to people nearby who already care. They get an alert. They reserve. They show up.",
              shade: MUTED,
            },
            {
              label: "Fill your blanks",
              body: "Quiet slots, spare capacity, a last-minute special — turn empty time into reserved demand without chasing walk-ins.",
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

      {/* ── Footer ── */}
      <footer style={{
        padding: isMobile ? "20px" : "20px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src="/logo-mark.svg"
            alt=""
            width={22}
            height={22}
            style={{ display: "block", flexShrink: 0 }}
          />
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700, color: FG }}>
            Unwrapped
          </span>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
            { label: "Contact", href: "mailto:anna@shopunwrapped.com" },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12, color: MUTED_FG, textDecoration: "none",
            }}>
              {label}
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

function SampleDropCard({ sample }: { sample: SampleDrop }) {
  return (
    <div
      style={{
        background: BG,
        padding: 20,
        position: "relative",
        opacity: 0.95,
      }}
      aria-label={`Sample drop: ${sample.title}. Not live.`}
    >
      <div style={{
        height: 160, marginBottom: 14, position: "relative",
        background: `linear-gradient(145deg, ${sample.accent} 0%, ${MUTED} 100%)`,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif", fontSize: 13,
          color: FG, fontStyle: "italic", opacity: 0.55,
        }}>
          {sample.business}
        </span>
        <div style={{
          position: "absolute", top: 10, left: 10,
          background: BG, padding: "4px 8px",
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

      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase",
      }}>
        {sample.category} · {sample.neighbourhood}
      </div>

      <h3 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 16,
        fontWeight: 600, color: FG, marginBottom: 10, lineHeight: 1.3,
      }}>
        {sample.title}
      </h3>

      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8,
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: FG }}>
          {sample.price}
        </span>
        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG }}>
          {sample.left}
        </span>
      </div>

      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, marginBottom: 10 }}>
        {sample.window}
      </div>

      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: 9,
        color: MUTED_FG, letterSpacing: "0.08em",
      }}>
        Not a real listing · example only
      </div>
    </div>
  );
}
