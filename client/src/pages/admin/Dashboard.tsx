import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

function AdminLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(768);
  const [location] = useLocation();
  const signOut = trpc.auth.signOut.useMutation({ onSuccess: () => { window.location.href = "/"; } });

  const NAV = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/applications", label: "Applications" },
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
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              style={{
                padding: "12px 16px", whiteSpace: "nowrap",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: location === n.href ? FG : MUTED_FG,
                textDecoration: "none",
                borderBottom: location === n.href ? `2px solid ${FG}` : "2px solid transparent",
              }}
            >
              {n.label}
            </a>
          ))}
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
          {NAV.map(n => (
            <a
              key={n.href}
              href={n.href}
              style={{
                display: "block", padding: "10px 20px",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                color: location === n.href ? FG : MUTED_FG,
                textDecoration: "none",
                background: location === n.href ? MUTED : "transparent",
                borderLeft: location === n.href ? `2px solid ${FG}` : "2px solid transparent",
              }}
            >
              {n.label}
            </a>
          ))}
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
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>
            {format(new Date(), "EEEE d MMMM yyyy")}
          </p>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: BORDER, marginBottom: 48 }}>
          {[
            { label: "Total users", value: stats?.totalUsers },
            { label: "Total businesses", value: stats?.totalBusinesses },
            { label: "Active drops", value: stats?.activeDrops },
            { label: "Pending applications", value: stats?.pendingApplications, accent: (stats?.pendingApplications ?? 0) > 0 },
            { label: "Total reservations", value: stats?.totalReservations },
            { label: "Fulfillments today", value: stats?.fulfillmentsToday },
            { label: "Revenue (gross)", value: stats?.grossRevenue != null ? `£${(stats.grossRevenue / 100).toFixed(2)}` : "—" },
            { label: "Platform take", value: stats?.platformRevenue != null ? `£${(stats.platformRevenue / 100).toFixed(2)}` : "—" },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ background: BG, padding: "24px 20px" }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: typeof value === "string" && value.length > 5 ? 22 : 28,
                fontWeight: 700, color: accent ? V : FG, marginBottom: 6,
              }}>
                {value ?? "—"}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pending applications shortcut */}
        {(stats?.pendingApplications ?? 0) > 0 && (
          <a
            href="/admin/applications"
            style={{
              display: "block", padding: "16px 20px",
              border: `1px solid ${V}`, marginBottom: 32,
              textDecoration: "none",
            }}
          >
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: V, letterSpacing: "0.1em" }}>
              {stats!.pendingApplications} APPLICATION{stats!.pendingApplications !== 1 ? "S" : ""} AWAITING REVIEW →
            </span>
          </a>
        )}

        {/* Recent drops */}
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            RECENT DROPS
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
