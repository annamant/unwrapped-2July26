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
import { isPublicPilotShop } from "../lib/pilotCorridor";
import {
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
    .filter((m) => isPublicPilotShop(m))
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
    .filter((p) => isPublicPilotShop(p))
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
            The live pilot is Brixton Village, Market Row and Coldharbour.
          </p>
          <Link href="/london" style={{ color: V, fontWeight: 700, textDecoration: "none" }}>
            See the Brixton pilot →
          </Link>
        </div>
      </div>
    );
  }

  const seo = boroughSeo(borough);
  const inPilot = borough.slug === "lambeth";
  const shops = inPilot ? shopsForBorough(borough, members) : [];

  return (
    <div style={{ minHeight: "100vh", background: BG, backgroundImage: BG_WASH }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        jsonLd={boroughJsonLd(
          borough,
          shops.map((s) => ({ name: s.name, slug: s.slug })),
        )}
      />
      <Nav />

      <header style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "36px 20px 28px" : "56px 24px 40px" }}>
        <nav aria-label="Breadcrumb" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16 }}>
          <Link href="/" style={{ color: MUTED_FG, textDecoration: "none" }}>Home</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <Link href="/london" style={{ color: MUTED_FG, textDecoration: "none" }}>London</Link>
          <span style={{ margin: "0 8px" }}>›</span>
          <span style={{ color: FG, fontWeight: 600 }}>{borough.name}</span>
        </nav>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: V, marginBottom: 14 }}>
          {inPilot ? "Pilot corridor · Lambeth" : "Not in this pilot"}
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: mobile ? 40 : 56,
          fontWeight: 700,
          color: FG,
          lineHeight: 1.05,
          marginBottom: 16,
        }}>
          {inPilot ? "Brixton Village, Market Row and Coldharbour" : borough.name}
        </h1>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: mobile ? 16 : 18,
          color: MUTED_FG,
          lineHeight: 1.65,
          maxWidth: 620,
          marginBottom: 20,
        }}>
          {inPilot
            ? "Bakery and specialty food photo specials in Brixton Village, Market Row and Coldharbour, plus Aries on Acre Lane. See the photo, claim it, collect it in person."
            : `The live pilot is bakery and specialty food photo specials in Brixton Village, Market Row and Coldharbour. ${borough.name} is not part of it.`}
        </p>
        {inPilot && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 28 }}>
            Brixton Village · Market Row · Coldharbour · Aries on Acre Lane
          </p>
        )}
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
          <Link
            href="/london"
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: V_DEEP,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
              padding: "14px 8px",
            }}
          >
            Back to the pilot →
          </Link>
        </div>
      </header>

      <section style={{ backgroundImage: SECTION_WASH, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: mobile ? "32px 20px 48px" : "44px 24px 64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: mobile ? 28 : 34, color: FG, margin: 0 }}>
              {inPilot ? "Bakeries and specialty food" : borough.name}
            </h2>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
              {inPilot ? (isLoading ? "Loading…" : `${shops.length} in the corridor`) : "Outside this pilot"}
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
                {inPilot
                  ? "No bakery or specialty food shops from this corridor are listed yet. Nominate one, or check back when a photo special is up."
                  : `${borough.name} is not in the Brixton Village pilot. Photo specials are in Brixton Village, Market Row and Coldharbour.`}
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6 }}>
                {inPilot
                  ? "Acre Lane is included for Aries Bakehouse."
                  : "Claim and collect still work on a special you already hold. This page is not a browse of the whole city."}
              </p>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {shops.slice(0, 60).map((shop) => (
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
                  ) : (
                    <span style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 11,
                      fontWeight: 600,
                      color: MUTED_FG,
                    }}>
                      In the corridor
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
