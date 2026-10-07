import { Link, useParams } from "wouter";
import Nav from "../components/Nav";
import SeoHead from "../components/SeoHead";
import useIsMobile from "../hooks/useIsMobile";
import { trpc } from "../trpc";
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
import { PRELAUNCH_WAVE1_DIRECTORY_PINS } from "../lib/prelaunch_wave1_directory_pins";
import {
  LONDON_BOROUGHS,
  boroughJsonLd,
  boroughSeo,
  getBoroughBySlug,
  shopMatchesBorough,
  type LondonBorough,
} from "../lib/londonBoroughs";

type ListedShop = {
  key: string;
  name: string;
  city?: string | null;
  postcode?: string | null;
  address?: string | null;
  category?: string | null;
  isMember: boolean;
  slug?: string;
};

function shopsForBorough(borough: LondonBorough, members: {
  name: string;
  slug: string;
  city?: string | null;
  postcode?: string | null;
  address?: string | null;
  category?: string | null;
}[] | undefined): ListedShop[] {
  const memberMatches = (members ?? [])
    .filter((m) => shopMatchesBorough(m, borough))
    .map((m) => ({
      key: `m-${m.slug}`,
      name: m.name,
      city: m.city,
      postcode: m.postcode,
      address: m.address,
      category: m.category,
      isMember: true,
      slug: m.slug,
    }));

  const memberNames = new Set(memberMatches.map((m) => m.name.toLowerCase()));
  const pinMatches = PRELAUNCH_WAVE1_DIRECTORY_PINS
    .filter((p) => shopMatchesBorough(p, borough))
    .filter((p) => !memberNames.has(p.name.toLowerCase()))
    .map((p) => ({
      key: `p-${p.id}`,
      name: p.name,
      city: p.district ?? null,
      postcode: p.postcode,
      address: p.address,
      category: p.type ?? p.category ?? null,
      isMember: !!p.isMember,
      slug: p.slug,
    }));

  return [...memberMatches, ...pinMatches].sort((a, b) => {
    if (a.isMember !== b.isMember) return a.isMember ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export default function BoroughLanding() {
  const params = useParams<{ borough: string }>();
  const borough = getBoroughBySlug(params.borough);
  const mobile = useIsMobile();
  const { data: members, isLoading } = trpc.businesses.directoryMembers.useQuery(undefined, {
    enabled: !!borough,
  });

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
            Unwrapped lets you know when a shop you already know has something on.
          </p>
          <Link href="/london" style={{ color: V, fontWeight: 700, textDecoration: "none" }}>
            What's on →
          </Link>
        </div>
      </div>
    );
  }

  const seo = boroughSeo(borough);
  const shops = shopsForBorough(borough, members);
  const membersCount = shops.filter((s) => s.isMember).length;
  const southPeers = LONDON_BOROUGHS.filter((b) => b.region === "south" && b.slug !== borough.slug).slice(0, 8);
  const peerStrip = borough.region === "south"
    ? southPeers
    : LONDON_BOROUGHS.filter((b) => b.region === borough.region && b.slug !== borough.slug).slice(0, 8);

  return (
    <div style={{ minHeight: "100vh", background: BG, backgroundImage: BG_WASH }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={boroughJsonLd(borough, shops.map((s) => ({ name: s.name, slug: s.slug })))}
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
          Unwrapped lets you know when a shop you already know has something on.
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: mobile ? 16 : 18,
          color: MUTED_FG,
          lineHeight: 1.65,
          maxWidth: 620,
          marginBottom: 28,
        }}>
          It connects you with the local shops you already like. Sign up and we'll tell you when something's on.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
          <Link
            href="/signin?mode=register"
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

      <section style={{ backgroundImage: SECTION_WASH, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "32px 20px 48px" : "44px 24px 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 28 : 34, color: FG, margin: 0 }}>
              Shops in {borough.name}
            </h2>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
              {isLoading ? "Loading…" : `${shops.length} listed · ${membersCount} on Unwrapped`}
            </span>
          </div>

          {!isLoading && shops.length === 0 ? (
            <div style={{
              background: CREAM,
              border: `1px solid ${BORDER}`,
              borderRadius: 16,
              padding: mobile ? 24 : 32,
            }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: FG, lineHeight: 1.6, marginBottom: 12 }}>
                Nothing from {borough.name} is on the list yet.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6 }}>
                Nominate a shop you already like, and we'll tell you when something's on.
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {shops.map((shop) => (
                <li
                  key={shop.key}
                  style={{
                    background: CREAM,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 14,
                    padding: mobile ? "14px 16px" : "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: FG }}>
                      {shop.isMember && shop.slug ? (
                        <Link href={`/business/${shop.slug}`} style={{ color: FG, textDecoration: "none" }}>
                          {shop.name}
                        </Link>
                      ) : (
                        shop.name
                      )}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginTop: 4 }}>
                      {[shop.category, shop.city || shop.postcode, shop.address].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  {shop.isMember ? (
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: V,
                      background: MUTED,
                      padding: "6px 10px",
                      borderRadius: 999,
                    }}>
                      On Unwrapped
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {peerStrip.length > 0 && (
        <section style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "36px 20px 56px" : "48px 24px 72px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: FG, marginBottom: 16 }}>
            Other boroughs
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {peerStrip.map((b) => (
              <Link
                key={b.slug}
                href={`/london/${b.slug}`}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: V_DEEP,
                  background: CREAM,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 999,
                  padding: "10px 16px",
                  textDecoration: "none",
                }}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section style={{ borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "28px 20px 56px" : "36px 24px 72px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: MUTED_FG, marginBottom: 10 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 24 : 28, color: FG, marginBottom: 8 }}>
            Get notified. Then claim. Then collect.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.6, maxWidth: 560 }}>
            We'll let you know when a shop you like has something on. You claim it, then you collect it.
          </p>
        </div>
      </section>
    </div>
  );
}
