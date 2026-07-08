import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "../trpc";
import Nav from "../components/Nav";
import { format } from "date-fns";
import { requestPushPermission } from "../hooks/usePushNotifications";
import useIsMobile from "../hooks/useIsMobile";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

export default function BusinessProfile() {
  const isMobile = useIsMobile();
  const [, params] = useRoute("/business/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug ?? "";
  const [pushStatus, setPushStatus] = useState<"idle" | "requesting" | "done" | "denied">("idle");

  const { data, isLoading } = trpc.businesses.getBySlug.useQuery({ slug }, { enabled: !!slug });
  const { data: user } = trpc.auth.me.useQuery();
  const { data: followStatus } = trpc.businesses.followStatus.useQuery(
    { businessId: data?.business.id ?? "" },
    { enabled: !!data && !!user }
  );

  const utils = trpc.useUtils();
  const follow = trpc.businesses.follow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate({ businessId: data?.business.id ?? "" }),
  });
  const unfollow = trpc.businesses.unfollow.useMutation({
    onSuccess: () => utils.businesses.followStatus.invalidate({ businessId: data?.business.id ?? "" }),
  });

  async function handleNotify() {
    if (!user) { navigate("/signin"); return; }
    setPushStatus("requesting");
    const result = await requestPushPermission();
    setPushStatus(result === "granted" ? "done" : result === "denied" ? "denied" : "idle");
  }

  if (isLoading) return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />
      <div style={{ padding: 80, textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 11, color: MUTED_FG, letterSpacing: "0.15em" }}>
        LOADING
      </div>
    </div>
  );

  if (!data) return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />
      <div style={{ padding: 80, textAlign: "center" }}>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, color: MUTED_FG }}>Business not found</p>
        <a href="/" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: FG }}>← Back</a>
      </div>
    </div>
  );

  const { business, drops } = data;
  const activeDrops = drops.filter(d => d.status === "active" || d.status === "sold_out");
  const isFollowing = followStatus?.following ?? false;

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />

      {/* Hero band */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: isMobile ? "32px 20px" : "48px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12, textTransform: "uppercase" }}>
                {business.category} · {business.city}
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(32px, 5vw, 56px)",
                fontWeight: 700, color: FG, lineHeight: 1.05,
                letterSpacing: "-1.5px", marginBottom: 12,
              }}>
                {business.name}
              </h1>
              {business.description && (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: MUTED_FG, lineHeight: 1.7, maxWidth: 560 }}>
                  {business.description}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              {user ? (
                <button
                  onClick={() => isFollowing
                    ? unfollow.mutate({ businessId: business.id })
                    : follow.mutate({ businessId: business.id })}
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "12px 24px",
                    border: `1px solid ${FG}`,
                    background: isFollowing ? FG : BG,
                    color: isFollowing ? BG : FG,
                    cursor: "pointer",
                  }}
                >
                  {isFollowing ? "FOLLOWING" : "+ FOLLOW"}
                </button>
              ) : (
                <a href="/signin" style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  letterSpacing: "0.1em", padding: "12px 24px",
                  border: `1px solid ${FG}`, color: FG, textDecoration: "none",
                }}>
                  + FOLLOW
                </a>
              )}
              {business.instagramHandle && (
                <a
                  href={`https://instagram.com/${business.instagramHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "12px 24px",
                    border: `1px solid ${BORDER}`, color: MUTED_FG, textDecoration: "none",
                  }}
                >
                  IG
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "32px 20px" : "48px 40px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 320px",
          gap: isMobile ? 32 : 56, alignItems: "start",
        }}>

          {/* ── Left: drops ── */}
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 24 }}>
              {activeDrops.length > 0 ? `${activeDrops.length} DROP${activeDrops.length !== 1 ? "S" : ""} AVAILABLE` : "NO ACTIVE DROPS"}
            </div>

            {drops.length === 0 ? (
              <div style={{ padding: "48px 0" }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: MUTED_FG, fontStyle: "italic" }}>
                  Nothing dropping right now.
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginTop: 8 }}>
                  Follow to get notified when a new drop lands.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 1, background: BORDER }}>
                {drops.map(drop => <DropCard key={drop.id} drop={drop} />)}
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div style={isMobile ? {} : { position: "sticky", top: 88 }}>

            {/* Get notified */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
                GET NOTIFIED
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.6, marginBottom: 16 }}>
                Be the first to know when {business.name} drops something new.
              </p>
              {pushStatus === "done" ? (
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#22C55E", letterSpacing: "0.1em" }}>
                  ✓ ALERTS ON
                </p>
              ) : pushStatus === "denied" ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  Enable notifications in your browser settings to receive alerts.
                </p>
              ) : (
                <button
                  onClick={handleNotify}
                  disabled={pushStatus === "requesting"}
                  style={{
                    width: "100%", padding: "12px",
                    background: FG, color: BG, border: "none",
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >
                  {pushStatus === "requesting" ? "REQUESTING…" : "NOTIFY ME"}
                </button>
              )}
            </div>

            {/* Business details */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
                ABOUT
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {business.address && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 2 }}>Location</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>{business.address}</div>
                  </div>
                )}
                {business.website && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 2 }}>Website</div>
                    <a href={business.website} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>
                      {business.website.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {business.instagramHandle && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 2 }}>Instagram</div>
                    <a href={`https://instagram.com/${business.instagramHandle.replace("@", "")}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>
                      {business.instagramHandle}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropCard({ drop }: { drop: any }) {
  const now = new Date();
  const end = new Date(drop.collectionEnd);
  const start = new Date(drop.collectionStart);
  const isLive = now >= start && now <= end;
  const isExpired = now > end;
  const scarce = !isExpired && drop.availableQuantity <= 3 && drop.availableQuantity > 0;

  return (
    <a
      href={`/drop/${drop.id}`}
      style={{ background: BG, textDecoration: "none", display: "block", padding: "0" }}
    >
      <div style={{
        background: drop.imageUrl ? `url(${drop.imageUrl}) center/cover` : MUTED,
        aspectRatio: "4/3", position: "relative",
      }}>
        {isLive && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 5,
            background: BG, padding: "4px 8px", border: `1px solid ${BORDER}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", display: "inline-block" }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: FG, letterSpacing: 1 }}>LIVE</span>
          </div>
        )}
      </div>
      <div style={{ padding: "16px" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 600, color: FG, marginBottom: 6, lineHeight: 1.3 }}>
          {drop.title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: FG }}>
            £{(drop.price / 100).toFixed(2)}
          </div>
          {scarce ? (
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.05em" }}>
              {drop.availableQuantity} LEFT
            </div>
          ) : isExpired ? (
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.05em" }}>ENDED</div>
          ) : (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
              {format(new Date(drop.collectionStart), "d MMM")}
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
