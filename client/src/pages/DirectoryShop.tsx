import { useEffect, useRef } from "react";
import { useRoute, useLocation, useSearch } from "wouter";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import SeoHead from "../components/SeoHead";
import useIsMobile from "../hooks/useIsMobile";
import { PRELAUNCH_WAVE1_DIRECTORY_PINS } from "../lib/prelaunch_wave1_directory_pins";
import { rememberPendingFollow } from "../lib/shopFollow";
import { BG, FG, BORDER, MUTED_FG, V } from "../theme";

function decodePinId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function DirectoryShop() {
  const isMobile = useIsMobile();
  const [, params] = useRoute("/shop/:pinId");
  const [, navigate] = useLocation();
  const search = useSearch();
  const pinId = decodePinId(params?.pinId ?? "");
  const pin = PRELAUNCH_WAVE1_DIRECTORY_PINS.find((candidate) => candidate.id === pinId);
  const { data: user } = trpc.auth.me.useQuery();
  const { data: linked } = trpc.businesses.directoryShop.useQuery(
    { pinId },
    { enabled: !!pin, retry: false },
  );
  const { data: followStatus } = trpc.businesses.followStatus.useQuery(
    { directoryPinId: pinId, businessId: linked?.business?.id },
    { enabled: !!pin && !!user },
  );
  const utils = trpc.useUtils();
  const follow = trpc.businesses.follow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate(),
  });
  const unfollow = trpc.businesses.unfollow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate(),
  });
  const started = useRef(false);
  const business = linked?.business ?? null;

  useEffect(() => {
    if (business?.slug) {
      const q = search ? (search.startsWith("?") ? search : `?${search}`) : "";
      navigate(`/business/${business.slug}${q}`, { replace: true });
    }
  }, [business?.slug, navigate, search]);

  useEffect(() => {
    if (!pin) return;
    const q = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    if (q.get("follow") !== "1" || started.current) return;
    const target = { directoryPinId: pin.id, businessId: business?.id, name: pin.name };
    if (!user) {
      started.current = true;
      rememberPendingFollow(target);
      navigate("/signin?mode=register");
      return;
    }
    if (followStatus?.following) return;
    if (followStatus === undefined) return;
    started.current = true;
    follow.mutate({ directoryPinId: pin.id, businessId: business?.id });
  }, [pin, search, user, business?.id, followStatus, follow, navigate]);

  if (!pin) {
    return (
      <div style={{ minHeight: "100vh", background: BG }}>
        <SeoHead title="Shop not found — Unwrapped" path={`/shop/${pinId}`} noindex />
        <Nav />
        <div style={{ padding: 80, textAlign: "center" }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: MUTED_FG }}>Shop not found</p>
          <a href="/" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>Back</a>
        </div>
      </div>
    );
  }

  const shop = pin;
  const following = followStatus?.following ?? false;
  const place = [shop.address, shop.postcode].filter(Boolean).join(" · ");

  function onFollow() {
    const target = { directoryPinId: shop.id, businessId: business?.id, name: shop.name };
    if (!user) {
      rememberPendingFollow(target);
      navigate("/signin?mode=register");
      return;
    }
    if (following) unfollow.mutate({ directoryPinId: shop.id, businessId: business?.id });
    else follow.mutate({ directoryPinId: shop.id, businessId: business?.id });
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <SeoHead
        title={`${shop.name} — Unwrapped`}
        description={`Follow ${shop.name} and we'll email you when they post something.`}
        path={`/shop/${encodeURIComponent(shop.id)}`}
        noindex
      />
      <Nav />
      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "32px 20px" : "56px 24px" }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 12 }}>
          {(shop.type || "SHOP").toUpperCase()}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 700, color: FG, lineHeight: 1.05, marginBottom: 12 }}>
          {shop.name}
        </h1>
        {place && (
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, marginBottom: 24 }}>{place}</p>
        )}
        <button
          type="button"
          onClick={onFollow}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            letterSpacing: "0.12em",
            padding: "16px 28px",
            border: `1px solid ${FG}`,
            background: following ? BG : FG,
            color: following ? FG : BG,
            cursor: "pointer",
          }}
        >
          {following ? "FOLLOWING" : "FOLLOW"}
        </button>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, lineHeight: 1.6, marginTop: 20, maxWidth: 460 }}>
          Follow {shop.name} and we'll email you when they post something.
        </p>
        <div style={{ marginTop: 40, paddingTop: 28, borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: MUTED_FG, marginBottom: 12 }}>
            LIVE DROPS
          </div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: MUTED_FG, fontStyle: "italic" }}>
            Nothing dropping right now.
          </p>
        </div>
      </div>
    </div>
  );
}
