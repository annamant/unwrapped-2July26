import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import DropMap, { toDropPin } from "../components/DropMap";
import DirectoryMap from "../components/DirectoryMap";
import DropPrice from "../components/DropPrice";
import DropMedia from "../components/DropMedia";
import { checkoutFromList, discountPercent } from "../lib/fees";
import { format } from "date-fns";
import useIsMobile from "../hooks/useIsMobile";
import type { PrelaunchDirectoryPin } from "../lib/prelaunch_wave1_directory_pins";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

const CATEGORIES = [
  "All", "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

type TimeWindow = "now" | "today" | "tomorrow";
type PageTab = "drops" | "shops";
type ViewMode = "list" | "map";

function tabFromSearch(search: string): PageTab | null {
  const q = search.startsWith("?") ? search.slice(1) : search;
  const t = new URLSearchParams(q).get("tab");
  return t === "drops" || t === "shops" ? t : null;
}

export default function Home() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const isMobile = useIsMobile();
  const explicitTab = tabFromSearch(searchString);

  const [tab, setTab] = useState<PageTab>(explicitTab ?? "shops");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [timeWindow, setTimeWindow] = useState<TimeWindow | undefined>(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [searchError, setSearchError] = useState("");
  const [mapCenter, setMapCenter] = useState({ lat: 51.509865, lng: -0.118092 });
  const [focusedShopId, setFocusedShopId] = useState<string | undefined>(undefined);

  const { data: drops, isLoading: dropsLoading } = trpc.drops.list.useQuery({
    category: category || undefined,
    timeWindow,
    limit: 60,
  });
  const { data: members, isLoading: membersLoading } = trpc.businesses.directoryMembers.useQuery();
  const { data: follows } = trpc.businesses.myFollows.useQuery();
  const utils = trpc.useUtils();

  const follow = trpc.businesses.follow.useMutation({
    onSuccess: () => utils.businesses.myFollows.invalidate(),
  });
  const unfollow = trpc.businesses.unfollow.useMutation({
    onSuccess: () => utils.businesses.myFollows.invalidate(),
  });

  // URL tab wins. Otherwise: drops when something is live, shops when the feed is empty.
  useEffect(() => {
    if (explicitTab) {
      setTab(explicitTab);
      return;
    }
    if (dropsLoading) return;
    setTab((drops?.length ?? 0) > 0 ? "drops" : "shops");
  }, [explicitTab, dropsLoading, drops?.length]);

  function goTab(next: PageTab) {
    setTab(next);
    navigate(`/home?tab=${next}`, { replace: true });
  }

  async function handleMapSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError("");
    if (!search.trim()) return;
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search + ", London, UK")}&format=json&limit=1&countrycodes=gb`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await resp.json();
      if (data[0]) {
        setMapCenter({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
      } else {
        setSearchError("Couldn't find that place — try a full postcode or area name.");
      }
    } catch {
      setSearchError("Search failed — check your connection and try again.");
    }
  }

  const pins = useMemo(() => (drops ?? []).map(toDropPin), [drops]);

  const followedIds = useMemo(
    () => new Set((follows ?? []).map((f) => f.business.id)),
    [follows],
  );

  const filteredShops = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (members ?? []).filter((m) => {
      if (category && m.category !== category) return false;
      if (!q) return true;
      const hay = `${m.name} ${m.address ?? ""} ${m.postcode ?? ""} ${m.city ?? ""} ${m.category ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, category, search]);

  const shopPins: PrelaunchDirectoryPin[] = useMemo(
    () =>
      filteredShops
        .filter((m) => m.lat != null && m.lng != null)
        .map((m) => ({
          id: m.id,
          name: m.name,
          lat: m.lat as number,
          lng: m.lng as number,
          postcode: m.postcode ?? undefined,
          address: m.address ?? undefined,
          district: m.city ?? undefined,
          category: m.category,
          isMember: true,
          slug: m.slug,
        })),
    [filteredShops],
  );

  const dropCount = drops?.length ?? 0;
  const shopCount = members?.length ?? 0;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />

      {/* ── Drops / Shops ── */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        background: BG,
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", gap: 0,
        }}>
          {([
            { key: "drops" as const, label: "Drops", count: dropsLoading ? "…" : String(dropCount) },
            { key: "shops" as const, label: "Shops", count: membersLoading ? "…" : String(shopCount) },
          ]).map(({ key, label, count }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => goTab(key)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15, fontWeight: active ? 600 : 400,
                  padding: "16px 20px 14px",
                  background: "none", border: "none",
                  borderBottom: active ? `2px solid ${FG}` : "2px solid transparent",
                  color: active ? FG : MUTED_FG,
                  cursor: "pointer",
                  marginBottom: -1,
                }}
              >
                {label}
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10, letterSpacing: "0.08em",
                  color: MUTED_FG, marginLeft: 8, fontWeight: 400,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category filter bar ── */}
      <div style={{
        borderBottom: `1px solid ${BORDER}`,
        padding: "0 24px",
        position: "sticky", top: 56,
        background: BG, zIndex: 90,
      }}>
        <div style={{ display: "flex", gap: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {CATEGORIES.map(cat => {
            const active = cat === "All" ? !category : category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat === "All" ? undefined : cat)}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13, fontWeight: active ? 500 : 400,
                  padding: "14px 16px",
                  background: "none", border: "none",
                  borderBottom: active ? `2px solid ${V}` : "2px solid transparent",
                  color: active ? V : MUTED_FG,
                  cursor: "pointer", whiteSpace: "nowrap",
                  transition: "all 0.1s", marginBottom: -1,
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {tab === "drops" ? (
          <>
            {/* ── Time window + view toggle ── */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 28,
              flexWrap: "wrap", gap: 12,
            }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { key: undefined as TimeWindow | undefined, label: "All drops" },
                  { key: "now" as TimeWindow, label: "Live now" },
                  { key: "today" as TimeWindow, label: "Today" },
                  { key: "tomorrow" as TimeWindow, label: "Tomorrow" },
                ].map(({ key, label }) => (
                  <button
                    key={label}
                    onClick={() => setTimeWindow(key)}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10, letterSpacing: "0.08em",
                      padding: "8px 16px", cursor: "pointer",
                      border: timeWindow === key ? `1px solid ${FG}` : `1px solid ${BORDER}`,
                      background: timeWindow === key ? FG : BG,
                      color: timeWindow === key ? BG : MUTED_FG,
                      transition: "all 0.1s",
                    }}
                  >
                    {label.toUpperCase()}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: 1 }}>
                  {dropsLoading ? "..." : `${dropCount} DROPS`}
                </span>
                {dropCount > 0 && <ListMapToggle viewMode={viewMode} setViewMode={setViewMode} />}
              </div>
            </div>

            {dropsLoading ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 1, background: BORDER,
              }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ background: BG, height: 340 }} />
                ))}
              </div>
            ) : dropCount === 0 ? (
              <EmptyDrops onSeeShops={() => goTab("shops")} />
            ) : (
              <>
                <div style={{ display: viewMode === "map" ? "block" : "none" }}>
                  <AreaSearch
                    search={search}
                    setSearch={setSearch}
                    searchError={searchError}
                    setSearchError={setSearchError}
                    onSubmit={handleMapSearch}
                    isMobile={isMobile}
                    placeholder="Search an area or postcode…"
                  />
                  <div style={{ border: `1px solid ${BORDER}` }}>
                    <DropMap
                      drops={pins}
                      onDropClick={(id) => navigate(`/drop/${id}`)}
                      defaultLat={mapCenter.lat}
                      defaultLng={mapCenter.lng}
                      height={isMobile ? "420px" : "600px"}
                      zoom={13}
                    />
                  </div>
                </div>

                {viewMode === "list" && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 1, background: BORDER,
                  }}>
                    {drops?.map(({ drop, business, location }) => (
                      <DropCard
                        key={drop.id}
                        drop={drop}
                        business={business}
                        location={location}
                        onClick={() => navigate(`/drop/${drop.id}`)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <NominateBanner />

            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 20,
              flexWrap: "wrap", gap: 12,
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 15,
                color: MUTED_FG, lineHeight: 1.6, margin: 0, maxWidth: 560,
              }}>
                Neighbourhood shops already on Unwrapped. Follow the ones you love — we'll tell you when they drop.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: 1 }}>
                  {membersLoading ? "..." : `${filteredShops.length} SHOPS`}
                </span>
                <ListMapToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>

            <AreaSearch
              search={search}
              setSearch={setSearch}
              searchError={searchError}
              setSearchError={setSearchError}
              onSubmit={handleMapSearch}
              isMobile={isMobile}
              placeholder="Search a shop, area, or postcode…"
            />

            <div style={{ display: viewMode === "map" ? "block" : "none" }}>
              <div style={{ border: `1px solid ${BORDER}` }}>
                <DirectoryMap
                  pins={shopPins}
                  defaultLat={mapCenter.lat}
                  defaultLng={mapCenter.lng}
                  height={isMobile ? "420px" : "600px"}
                  zoom={13}
                  focusedId={focusedShopId}
                  onPinSelect={(id) => setFocusedShopId(id)}
                />
              </div>
              {filteredShops.length > shopPins.length && (
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG,
                  marginTop: 10,
                }}>
                  {filteredShops.length - shopPins.length} shop{filteredShops.length - shopPins.length === 1 ? "" : "s"} without a map pin — switch to list to see them.
                </p>
              )}
            </div>

            {viewMode === "list" && (
              membersLoading ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 1, background: BORDER,
                }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{ background: BG, height: 180 }} />
                  ))}
                </div>
              ) : filteredShops.length === 0 ? (
                <EmptyShops
                  hasMembers={shopCount > 0}
                  onClear={() => { setSearch(""); setCategory(undefined); }}
                />
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: 1, background: BORDER,
                }}>
                  {filteredShops.map((shop) => (
                    <ShopCard
                      key={shop.id}
                      shop={shop}
                      following={followedIds.has(shop.id)}
                      followPending={follow.isPending || unfollow.isPending}
                      onOpen={() => navigate(`/business/${shop.slug}`)}
                      onToggleFollow={(e) => {
                        e.stopPropagation();
                        if (followedIds.has(shop.id)) unfollow.mutate({ businessId: shop.id });
                        else follow.mutate({ businessId: shop.id });
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ListMapToggle({ viewMode, setViewMode }: {
  viewMode: ViewMode; setViewMode: (m: ViewMode) => void;
}) {
  return (
    <div style={{ display: "flex", border: `1px solid ${BORDER}` }}>
      {(["list", "map"] as const).map(mode => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10, letterSpacing: "0.08em",
            padding: "8px 16px", cursor: "pointer", border: "none",
            background: viewMode === mode ? FG : BG,
            color: viewMode === mode ? BG : MUTED_FG,
            transition: "all 0.1s",
          }}
        >
          {mode === "list" ? "≡ LIST" : "⊙ MAP"}
        </button>
      ))}
    </div>
  );
}

function AreaSearch({
  search, setSearch, searchError, setSearchError, onSubmit, isMobile, placeholder,
}: {
  search: string;
  setSearch: (v: string) => void;
  searchError: string;
  setSearchError: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isMobile: boolean;
  placeholder: string;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      {searchError && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: V }}>{searchError}</span>
      )}
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 0, width: isMobile ? "100%" : "auto" }}>
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSearchError(""); }}
          placeholder={placeholder}
          style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
            padding: "9px 14px", border: `1px solid ${BORDER}`,
            borderRight: "none", background: BG, color: FG,
            outline: "none", width: isMobile ? "100%" : 280, minWidth: 0, flex: isMobile ? 1 : "none",
          }}
        />
        <button type="submit" style={{
          background: FG, color: BG,
          fontFamily: "'Space Mono', monospace", fontSize: 10,
          letterSpacing: "0.08em", padding: "9px 18px",
          border: "none", cursor: "pointer",
        }}>
          GO
        </button>
      </form>
    </div>
  );
}

function NominateBanner() {
  return (
    <div style={{
      border: `1px solid ${FG}`,
      padding: "20px 22px",
      marginBottom: 28,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      background: MUTED,
    }}>
      <div>
        <div style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, color: V,
          letterSpacing: "0.15em", marginBottom: 6,
        }}>
          HELP BUILD UNWRAPPED
        </div>
        <p style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 600,
          color: FG, lineHeight: 1.25, marginBottom: 4,
        }}>
          Don't see a shop you love?
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.55 }}>
          Nominate them. We'll reach out and say a neighbour sent us.
        </p>
      </div>
      <a
        href="/recommend"
        style={{
          fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
          background: FG, color: BG, textDecoration: "none",
          padding: "12px 20px", whiteSpace: "nowrap",
        }}
      >
        NOMINATE A SHOP
      </a>
    </div>
  );
}

function EmptyDrops({ onSeeShops }: { onSeeShops: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 0 80px", maxWidth: 520, margin: "0 auto" }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: FG, marginBottom: 12 }}>
        Nothing dropping right now
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, marginBottom: 28 }}>
        We're filling London with neighbourhood shops first. Follow members so you're first in line — or nominate a shop you want on Unwrapped.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={onSeeShops}
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
            background: FG, color: BG, border: "none",
            padding: "12px 20px", cursor: "pointer",
          }}
        >
          SEE MEMBER SHOPS
        </button>
        <a
          href="/recommend"
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
            color: FG, border: `1px solid ${FG}`,
            padding: "12px 20px", textDecoration: "none",
          }}
        >
          NOMINATE A SHOP
        </a>
      </div>
    </div>
  );
}

function EmptyShops({ hasMembers, onClear }: { hasMembers: boolean; onClear: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "64px 0 80px", maxWidth: 480, margin: "0 auto" }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: FG, marginBottom: 12 }}>
        {hasMembers ? "No shops match that search" : "The member list is just getting started"}
      </p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, marginBottom: 28 }}>
        {hasMembers
          ? "Try another name or neighbourhood — or nominate the shop you're looking for."
          : "Know a café, salon, florist, or neighbourhood spot that should be here? Tell us. That's how the map fills."}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {hasMembers && (
          <button
            onClick={onClear}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
              background: BG, color: FG, border: `1px solid ${FG}`,
              padding: "12px 20px", cursor: "pointer",
            }}
          >
            CLEAR SEARCH
          </button>
        )}
        <a
          href="/recommend"
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
            background: FG, color: BG, textDecoration: "none",
            padding: "12px 20px",
          }}
        >
          NOMINATE A SHOP
        </a>
      </div>
    </div>
  );
}

function ShopCard({ shop, following, followPending, onOpen, onToggleFollow }: {
  shop: {
    id: string; name: string; slug: string; category: string;
    description: string | null; logoUrl: string | null;
    city: string | null; address: string | null; postcode: string | null;
  };
  following: boolean;
  followPending: boolean;
  onOpen: () => void;
  onToggleFollow: (e: React.MouseEvent) => void;
}) {
  const place = [shop.address?.split(",")[0], shop.city, shop.postcode].filter(Boolean).join(" · ");
  const blurb = shop.description
    ? (shop.description.length > 110 ? shop.description.slice(0, 107).trimEnd() + "…" : shop.description)
    : null;

  return (
    <div
      onClick={onOpen}
      style={{ cursor: "pointer", background: BG, padding: "20px 18px 18px", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = MUTED)}
      onMouseLeave={e => (e.currentTarget.style.background = BG)}
    >
      <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, flexShrink: 0,
          background: shop.logoUrl ? `url(${shop.logoUrl}) center/cover` : MUTED,
          border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {!shop.logoUrl && (
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: MUTED_FG }}>
              {shop.name.slice(0, 1)}
            </span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 8,
            color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 4,
          }}>
            MEMBER · {shop.category.toUpperCase()}
          </div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 18, fontWeight: 600, color: FG, lineHeight: 1.25, margin: 0,
          }}>
            {shop.name}
          </h3>
        </div>
      </div>
      {place && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: blurb ? 8 : 16 }}>
          {place}
        </p>
      )}
      {blurb && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.5, marginBottom: 16 }}>
          {blurb}
        </p>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onToggleFollow}
          disabled={followPending}
          style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em",
            padding: "8px 12px", cursor: followPending ? "not-allowed" : "pointer",
            border: `1px solid ${FG}`,
            background: following ? FG : BG,
            color: following ? BG : FG,
          }}
        >
          {following ? "FOLLOWING" : "+ FOLLOW"}
        </button>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em",
          padding: "8px 12px", color: MUTED_FG, border: `1px solid ${BORDER}`,
        }}>
          VIEW
        </span>
      </div>
    </div>
  );
}

function DropCard({ drop, business, location, onClick }: {
  drop: any; business: any; location: any; onClick: () => void;
}) {
  const now = new Date();
  const start = new Date(drop.collectionStart);
  const end = new Date(drop.collectionEnd);
  const isLive = now >= start && now <= end;
  const total = drop.totalQuantity || 1;
  const pct = Math.round(((total - drop.availableQuantity) / total) * 100);
  const scarce = drop.availableQuantity > 0 && drop.availableQuantity <= 3;
  const hasDiscount = drop.originalPrice != null && checkoutFromList(drop.originalPrice) > drop.price;
  const discountPct = hasDiscount ? discountPercent(drop.originalPrice!, drop.price) : null;

  return (
    <div
      onClick={onClick}
      style={{ cursor: "pointer", background: BG, overflow: "hidden", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.background = MUTED)}
      onMouseLeave={e => (e.currentTarget.style.background = BG)}
    >
      {/* Media */}
      <div style={{
        height: 200, position: "relative", overflow: "hidden", background: MUTED,
      }}>
        <DropMedia
          url={drop.imageUrl}
          mediaType={drop.mediaType}
          placeholder={
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: MUTED_FG, fontStyle: "italic" }}>
              {business.name}
            </span>
          }
        />
        {drop.featured && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            background: FG, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.15em", padding: "4px 8px",
          }}>
            FEATURED
          </div>
        )}
        {hasDiscount && discountPct != null && discountPct > 0 && (
          <div style={{
            position: "absolute", bottom: 12, left: 12,
            background: V, color: BG,
            fontFamily: "'Space Mono', monospace", fontSize: 9,
            letterSpacing: "0.12em", padding: "4px 8px",
          }}>
            {discountPct}% OFF
          </div>
        )}
        {isLive && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            display: "flex", alignItems: "center", gap: 5,
            background: BG, padding: "4px 8px", border: `1px solid ${BORDER}`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: FG, letterSpacing: 1 }}>LIVE</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: "16px 16px 20px" }}>
        <p style={{
          fontFamily: "'Space Mono', monospace", fontSize: 9,
          color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 4, textTransform: "uppercase",
        }}>
          {business.name} · {location.address.split(",")[0]}
        </p>
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 18, fontWeight: 600, color: FG, lineHeight: 1.25, marginBottom: 12,
        }}>
          {drop.title}
        </h3>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <DropPrice price={drop.price} originalPrice={drop.originalPrice} size="md" />
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: scarce ? V : MUTED_FG }}>
            {drop.availableQuantity === 0
              ? "Sold out"
              : scarce
              ? `${drop.availableQuantity} left`
              : `${drop.availableQuantity} available`}
          </span>
        </div>

        <div style={{ height: 2, background: BORDER, marginBottom: 10 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: pct > 80 ? V : FG }} />
        </div>

        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
          {isLive ? `Until ${format(end, "h:mm a")}` : format(start, "EEE d MMM, h:mm a")}
        </p>
      </div>
    </div>
  );
}
