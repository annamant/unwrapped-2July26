import { Link, useParams } from "wouter";
import Nav from "../components/Nav";
import SeoHead from "../components/SeoHead";
import useIsMobile from "../hooks/useIsMobile";
import {
  BG,
  BG_WASH,
  BORDER,
  CREAM,
  FG,
  MUTED_FG,
  V,
  V_DEEP,
} from "../theme";
import {
  boroughJsonLd,
  boroughSeo,
  getBoroughBySlug,
} from "../lib/londonBoroughs";

export default function BoroughLanding() {
  const params = useParams<{ borough: string }>();
  const borough = getBoroughBySlug(params.borough);
  const mobile = useIsMobile();

  if (!borough) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <SeoHead
          title="Borough not found — Unwrapped"
          path={`/london/${params.borough || "unknown"}`}
          noindex
        />
        <Nav />
        <div style={{ maxWidth: 640, margin: "0 auto", padding: mobile ? "48px 20px" : "80px 24px", textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: FG, marginBottom: 12 }}>
            Borough not found
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: MUTED_FG, marginBottom: 24 }}>
            Unwrapped lets you know when a shop you already know has a deal on.
          </p>
          <Link href="/london" style={{ color: V, fontWeight: 700, textDecoration: "none" }}>
            What's on →
          </Link>
        </div>
      </div>
    );
  }

  const seo = boroughSeo(borough);

  return (
    <div style={{ minHeight: "100vh", background: BG, backgroundImage: BG_WASH }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={boroughJsonLd(borough)}
      />
      <Nav />

      <header style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "36px 20px 28px" : "56px 24px 40px" }}>
        <nav aria-label="Breadcrumb" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16 }}>
          <Link href="/" style={{ color: MUTED_FG, textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link href="/london" style={{ color: MUTED_FG, textDecoration: "none" }}>What's on</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: FG, fontWeight: 600 }}>{borough.name}</span>
        </nav>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: mobile ? 36 : 48,
          fontWeight: 700,
          color: FG,
          lineHeight: 1.08,
          marginBottom: 16,
        }}>
          Unwrapped lets you know when a shop you already know has a deal on.
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: mobile ? 16 : 18,
          color: MUTED_FG,
          lineHeight: 1.65,
          maxWidth: 620,
          marginBottom: 28,
        }}>
          The connection between the shops you trust and you. We'll let you know when something's on.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Link
            href="/signin"
            style={{
              display: "inline-block",
              background: V,
              color: CREAM,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 800,
              fontSize: 18,
              padding: "16px 26px",
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            Notify me
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

      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "28px 20px 56px" : "36px 24px 72px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED_FG, marginBottom: 10 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 24 : 28, color: FG, marginBottom: 8 }}>
            Get notified. Then claim. Then collect.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.6, maxWidth: 560 }}>
            We'll let you know when a shop you know has a deal on. Then you claim it, and collect it.
          </p>
        </div>
      </section>
    </div>
  );
}
