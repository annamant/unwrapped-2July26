import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED, MUTED_FG, V } from "../../theme";


function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(768);
  const [location] = useLocation();
  const signOut = trpc.auth.signOut.useMutation({ onSuccess: () => { window.location.href = "/"; } });

  const NAV = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/businesses", label: "Onboarding pipeline" },
    { href: "/admin/databases", label: "Databases" },
    { href: "/admin/drops", label: "Drops" },
    { href: "/admin/reservations", label: "Reservations" },
    { href: "/admin/applications", label: "Applications" },
    { href: "/admin/recommendations", label: "Recommendations" },
    { href: "/admin/apparel-map", label: "Claimed map" },
  ];

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px", borderBottom: `1px solid ${BORDER}`,
        }}>
          <div>
            <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: FG, textDecoration: "none" }}>
              Unwrapped
            </a>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: V, letterSpacing: "0.15em", marginLeft: 8 }}>
              ADMIN
            </span>
          </div>
          <button
            onClick={() => signOut.mutate()}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Sign out
          </button>
        </div>
        <nav style={{ display: "flex", overflowX: "auto", scrollbarWidth: "none", borderBottom: `1px solid ${BORDER}` }}>
          {NAV.map(n => {
            const active = n.href === "/admin" ? location === "/admin" : location.startsWith(n.href);
            return (
            <a
              key={n.href}
              href={n.href}
              style={{
                padding: "12px 16px", whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: active ? FG : MUTED_FG,
                textDecoration: "none",
                borderBottom: active ? `2px solid ${FG}` : "2px solid transparent",
              }}
            >
              {n.label}
            </a>
          );})}
        </nav>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>
      <div style={{ width: 200, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700, color: FG, textDecoration: "none" }}>
            Unwrapped
          </a>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: V, letterSpacing: "0.15em", marginTop: 4 }}>
            ADMIN
          </div>
        </div>
        <nav style={{ flex: 1, padding: "12px 0" }}>
          {NAV.map(n => {
            const active = n.href === "/admin" ? location === "/admin" : location.startsWith(n.href);
            return (
            <a
              key={n.href}
              href={n.href}
              style={{
                display: "block", padding: "10px 20px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: active ? FG : MUTED_FG,
                textDecoration: "none",
                background: active ? MUTED : "transparent",
                borderLeft: active ? `2px solid ${FG}` : "2px solid transparent",
              }}
            >
              {n.label}
            </a>
          );})}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: `1px solid ${BORDER}` }}>
          <button
            onClick={() => signOut.mutate()}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Sign out
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

export { AdminLayout };

export default function AdminDashboard() {
  const isMobile = useIsMobile(768);
  const { data: stats } = trpc.admin.stats.useQuery();
  const { data: recentDrops } = trpc.admin.recentDrops.useQuery({ limit: 10 });

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG }}>
            Platform overview
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, maxWidth: 560, lineHeight: 1.5 }}>
            {format(new Date(), "EEEE d MMMM yyyy")} · Two separate pipelines: curated board vs claim campaign.
          </p>
        </div>

        {/* Pipeline A — curated landing board */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 10 }}>
            CURATED BOARD · LANDING MAP
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12, maxWidth: 640, lineHeight: 1.45 }}>
            Shops on the public curated map — the list you’re approaching for curation. Not the same as the claim-email campaign.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr", gap: 1, background: BORDER }}>
            {[
              {
                label: "On curated map",
                value: stats?.curatedTotal,
                hint: "Landing-page board",
                href: "/admin/businesses",
              },
              {
                label: "Still to approach",
                value: stats?.curatedNotInvited,
                hint: "No claim invite yet",
                href: "/admin/businesses",
                accent: (stats?.curatedNotInvited ?? 0) > 0,
              },
            ].map(({ label, value, hint, href, accent }) => (
              <a key={label} href={href} style={{ background: BG, padding: "22px 20px", textDecoration: "none", display: "block" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700,
                  color: accent ? V : FG, marginBottom: 6,
                }}>
                  {value ?? "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>{label} →</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 4 }}>{hint}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Pipeline B — claim campaign */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 10 }}>
            CLAIM CAMPAIGN · WAREHOUSE INVITES
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12, maxWidth: 640, lineHeight: 1.45 }}>
            Earlier bulk claim emails from scraped/imported profiles. The {stats?.claimed ?? "—"} members came from this campaign — not from the curated 221.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 1, background: BORDER }}>
            {[
              {
                label: "Invites sent",
                value: stats?.inviteSent,
                hint: (stats?.followUpDue ?? 0) > 0 ? `${stats!.followUpDue} follow-up due` : "Awaiting claim",
                href: "/admin/businesses",
              },
              {
                label: "Claimed members",
                value: stats?.claimed,
                hint: "Owners signed in · black pins on landing map",
                href: "/admin/businesses",
              },
              {
                label: "Claimed map",
                value: "→",
                hint: "Pins for signed-up shops only",
                href: "/admin/apparel-map",
              },
            ].map(({ label, value, hint, href }) => (
              <a key={label} href={href} style={{ background: BG, padding: "22px 20px", textDecoration: "none", display: "block" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700,
                  color: FG, marginBottom: 6,
                }}>
                  {value ?? "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>{label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 4 }}>{hint}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Live platform activity */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 10 }}>
            LIVE PLATFORM
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12, maxWidth: 640, lineHeight: 1.45 }}>
            Drops, reservations, applications — day-to-day product activity.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: BORDER, marginBottom: 28 }}>
          {[
            { label: "Active drops", value: stats?.activeDrops, href: "/admin/drops" },
            { label: "Pending applications", value: stats?.pendingApplications, accent: (stats?.pendingApplications ?? 0) > 0, href: "/admin/applications" },
            { label: "Pending recommendations", value: stats?.pendingRecommendations, accent: (stats?.pendingRecommendations ?? 0) > 0, href: "/admin/recommendations" },
            { label: "Total reservations", value: stats?.totalReservations, href: "/admin/reservations" },
            { label: "Fulfillments today", value: stats?.fulfillmentsToday, href: "/admin/reservations" },
            { label: "Revenue (gross)", value: stats?.grossRevenue != null ? `£${(stats.grossRevenue / 100).toFixed(2)}` : "—" },
            { label: "Platform take", value: stats?.platformRevenue != null ? `£${(stats.platformRevenue / 100).toFixed(2)}` : "—" },
          ].map(({ label, value, accent, href }) => {
            const inner = (
              <>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: typeof value === "string" && value.length > 5 ? 22 : 28,
                  fontWeight: 700, color: accent ? V : FG, marginBottom: 6,
                }}>
                  {value ?? "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {label}{href ? " →" : ""}
                </div>
              </>
            );
            return href ? (
              <a key={label} href={href} style={{ background: BG, padding: "24px 20px", textDecoration: "none", display: "block" }}>
                {inner}
              </a>
            ) : (
              <div key={label} style={{ background: BG, padding: "24px 20px" }}>
                {inner}
              </div>
            );
          })}
        </div>

        {/* Databases — under platform, above recent drops */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 10 }}>
            DATABASES · RAW TABLES
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 12, maxWidth: 640, lineHeight: 1.45 }}>
            Login accounts and warehouse shop profiles from imports. Kept for lookup — not the onboarding pipeline.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 1, background: BORDER }}>
            {[
              {
                label: "Accounts (logins)",
                value: stats?.totalUsers,
                hint: `${stats?.invitePendingAccounts ?? "—"} invited · not claimed`,
                href: "/admin/databases",
              },
              {
                label: "Warehouse shops",
                value: stats?.totalBusinesses,
                hint: "Scrapes + imports + members",
                href: "/admin/databases?tab=warehouse",
              },
              {
                label: "Open Databases →",
                value: "···",
                hint: "Full classified lists",
                href: "/admin/databases",
              },
            ].map(({ label, value, hint, href }) => (
              <a key={label} href={href} style={{ background: BG, padding: "22px 20px", textDecoration: "none", display: "block" }}>
                <div style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700,
                  color: FG, marginBottom: 6,
                }}>
                  {value ?? "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>{label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 4 }}>{hint}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Pending applications / recommendations shortcuts */}
        {(stats?.pendingApplications ?? 0) > 0 && (
          <a
            href="/admin/applications"
            style={{
              display: "block", padding: "16px 20px",
              border: `1px solid ${V}`,
              marginBottom: (stats?.pendingRecommendations ?? 0) > 0 ? 12 : 32,
              textDecoration: "none",
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: V, letterSpacing: "0.1em" }}>
              {stats!.pendingApplications} APPLICATION{stats!.pendingApplications !== 1 ? "S" : ""} AWAITING REVIEW →
            </span>
          </a>
        )}
        {(stats?.pendingRecommendations ?? 0) > 0 && (
          <a
            href="/admin/recommendations"
            style={{
              display: "block", padding: "16px 20px",
              border: `1px solid ${V}`, marginBottom: 32,
              textDecoration: "none",
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: V, letterSpacing: "0.1em" }}>
              {stats!.pendingRecommendations} RECOMMENDATION{stats!.pendingRecommendations !== 1 ? "S" : ""} TO FOLLOW UP →
            </span>
          </a>
        )}

        {/* Recent drops */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em" }}>
              RECENT DROPS
            </div>
            <a href="/admin/drops" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, textDecoration: "none" }}>
              View all →
            </a>
          </div>
          <div style={{ border: `1px solid ${BORDER}` }}>
            {!recentDrops?.length ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 14, color: MUTED_FG }}>No drops yet</span>
              </div>
            ) : recentDrops.map((drop: any, i: number) => (
              <div
                key={drop.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr auto" : "1fr 120px 100px 80px",
                  gap: isMobile ? 8 : 16, alignItems: "center",
                  padding: isMobile ? "14px 16px" : "14px 20px",
                  borderBottom: i < recentDrops.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, marginBottom: 2 }}>{drop.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>{drop.businessName}</div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(drop.collectionStart), "d MMM")}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: FG }}>
                  {drop.availableQuantity}/{drop.totalQuantity}
                </div>
                <DropStatus status={drop.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function DropStatus({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "#15803D", live: "#15803D",
    sold_out: "#92400E", cancelled: MUTED_FG, expired: MUTED_FG,
  };
  return (
    <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 8, color: colors[status] ?? MUTED_FG, letterSpacing: "0.1em" }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}
