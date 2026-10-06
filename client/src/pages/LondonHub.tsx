import { useState } from "react";
import { Link } from "wouter";
import Nav from "../components/Nav";
import SeoHead from "../components/SeoHead";
import useIsMobile from "../hooks/useIsMobile";
import {
  BG,
  BG_WASH,
  BORDER,
  CREAM,
  FG,
  MUTED,
  MUTED_FG,
  V,
  V_DEEP,
} from "../theme";
import {
  LONDON_BOROUGHS,
  londonHubJsonLd,
  londonHubSeo,
  type LondonRegion,
} from "../lib/londonBoroughs";
import { PILOT_KICKER, PILOT_SUB } from "../lib/pilotCorridor";

const REGION_LABEL: Record<LondonRegion, string> = {
  south: "South London",
  central: "Central London",
  east: "East London",
  north: "North London",
  west: "West London",
};

const REGION_ORDER: LondonRegion[] = ["south", "central", "east", "north", "west"];

const CORRIDOR = [
  { name: "Brixton Village", note: "Bakeries and specialty food inside the market." },
  { name: "Market Row", note: "Photo specials from the row, collected at the counter." },
  { name: "Coldharbour", note: "Coldharbour Lane shops in this same walk." },
  { name: "Acre Lane — Aries", note: "Acre Lane is in the pilot for Aries Bakehouse." },
];

export default function LondonHub() {
  const mobile = useIsMobile();
  const seo = londonHubSeo();
  const [showBoroughs, setShowBoroughs] = useState(false);

  return (
    <div style={{ minHeight: "100vh", background: BG, backgroundImage: BG_WASH }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={londonHubJsonLd()}
      />
      <Nav />

      <header style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "36px 20px 28px" : "56px 24px 40px" }}>
        <nav aria-label="Breadcrumb" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16 }}>
          <Link href="/" style={{ color: MUTED_FG, textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: FG, fontWeight: 600 }}>Brixton pilot</span>
        </nav>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: V, marginBottom: 14 }}>
          {PILOT_KICKER}
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: mobile ? 40 : 56,
          fontWeight: 700,
          color: FG,
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          Brixton Village, Market Row and Coldharbour
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: mobile ? 16 : 18,
          color: MUTED_FG,
          lineHeight: 1.65,
          maxWidth: 640,
          marginBottom: 24,
        }}>
          {PILOT_SUB}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/signin"
            style={{
              display: "inline-block",
              background: V,
              color: CREAM,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: "14px 22px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            Sign in to claim
          </Link>
          <Link
            href="/business-apply"
            style={{
              display: "inline-block",
              background: CREAM,
              color: V_DEEP,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              padding: "14px 22px",
              borderRadius: 999,
              textDecoration: "none",
              border: `1.5px solid ${BORDER}`,
            }}
          >
            Bakeries — list a photo special
          </Link>
        </div>
      </header>

      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "28px 20px 36px" : "36px 24px 48px" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: mobile ? 24 : 28,
            color: FG,
            marginBottom: 8,
          }}>
            This pilot
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 18, maxWidth: 560 }}>
            Chosen specials with photos. See it, claim it, collect it in person.
          </p>
          <div style={{
            display: "grid",
            gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: 10,
          }}>
            {CORRIDOR.map((place) => (
              <Link
                key={place.name}
                href="/london/lambeth"
                style={{
                  display: "block",
                  background: CREAM,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  padding: "16px 18px",
                  textDecoration: "none",
                }}
              >
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: FG, marginBottom: 6 }}>
                  {place.name}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.5 }}>
                  {place.note}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "24px 20px 40px" : "28px 24px 56px" }}>
          <button
            type="button"
            onClick={() => setShowBoroughs((open) => !open)}
            aria-expanded={showBoroughs}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: MUTED_FG,
              textAlign: "left",
            }}
          >
            {showBoroughs ? "Hide other London pages" : "Other London pages — not this pilot"}
          </button>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.55, maxWidth: 560, marginTop: 8 }}>
            These pages stay up. They are not a city-wide shop directory and nothing is launching there in this pilot.
          </p>
          {showBoroughs && REGION_ORDER.map((region) => {
            const list = LONDON_BOROUGHS.filter((b) => b.region === region);
            return (
              <div key={region} style={{ marginTop: 22 }}>
                <h2 style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: MUTED_FG,
                  marginBottom: 10,
                }}>
                  {REGION_LABEL[region]}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {list.map((b) => (
                    <Link
                      key={b.slug}
                      href={`/london/${b.slug}`}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: FG,
                        background: MUTED,
                        borderRadius: 999,
                        padding: "8px 12px",
                        textDecoration: "none",
                      }}
                    >
                      {b.name}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
