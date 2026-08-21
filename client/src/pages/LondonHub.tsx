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
  SECTION_WASH,
  V,
  V_DEEP,
} from "../theme";
import {
  LONDON_BOROUGHS,
  londonHubJsonLd,
  londonHubSeo,
  type LondonRegion,
} from "../lib/londonBoroughs";

const REGION_LABEL: Record<LondonRegion, string> = {
  south: "South London — launch focus",
  central: "Central London",
  east: "East London",
  north: "North London",
  west: "West London",
};

const REGION_ORDER: LondonRegion[] = ["south", "central", "east", "north", "west"];

export default function LondonHub() {
  const mobile = useIsMobile();
  const seo = londonHubSeo();

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
          <span style={{ color: FG, fontWeight: 600 }}>London</span>
        </nav>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: V, marginBottom: 14 }}>
          United Kingdom · London
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: mobile ? 40 : 56,
          fontWeight: 700,
          color: FG,
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          London boroughs
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: mobile ? 16 : 18,
          color: MUTED_FG,
          lineHeight: 1.65,
          maxWidth: 640,
          marginBottom: 24,
        }}>
          Unwrapped lets you see what's ready on London high streets — a photo or short video, claim in the app, collect at the counter. We're launching densest in <strong style={{ color: FG }}>South London</strong>, with a page for every borough.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link
            href="/business-apply"
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
            Apply to partner your shop
          </Link>
          <Link
            href="/recommend"
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
            Nominate a shop
          </Link>
        </div>
      </header>

      {REGION_ORDER.map((region) => {
        const list = LONDON_BOROUGHS.filter((b) => b.region === region);
        return (
          <section
            key={region}
            style={{
              backgroundImage: region === "south" ? SECTION_WASH : undefined,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "28px 20px 36px" : "36px 24px 48px" }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: mobile ? 24 : 28,
                color: FG,
                marginBottom: 6,
              }}>
                {REGION_LABEL[region]}
              </h2>
              {region === "south" && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 18, maxWidth: 560 }}>
                  Priority launch area — Lambeth, Wandsworth, Southwark and neighbours first.
                </p>
              )}
              <div style={{
                display: "grid",
                gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
                gap: 10,
                marginTop: region === "south" ? 0 : 18,
              }}>
                {list.map((b) => (
                  <Link
                    key={b.slug}
                    href={`/london/${b.slug}`}
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
                      {b.name}
                      {region === "south" && (
                        <span style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          color: V,
                          background: MUTED,
                          padding: "3px 8px",
                          borderRadius: 999,
                          verticalAlign: "middle",
                        }}>
                          Launch
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.5 }}>
                      {b.neighbourhoods.slice(0, 4).join(" · ")}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      <footer style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "24px 20px 56px" : "32px 24px 72px" }}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6 }}>
          Looking for a shop already live?{" "}
          <Link href="/" style={{ color: V, fontWeight: 700, textDecoration: "none" }}>Back to Unwrapped</Link>
          {" · "}
          <Link href="/business-apply" style={{ color: V, fontWeight: 700, textDecoration: "none" }}>Apply as a business</Link>
        </p>
      </footer>
    </div>
  );
}
