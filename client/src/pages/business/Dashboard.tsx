import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";
import BusinessShell, { BG, FG, BORDER, MUTED, MUTED_FG } from "../../components/business/BusinessShell";

const V = "#E8341C";

export default function Dashboard() {
  const isMobile = useIsMobile(768);
  const { data: stats } = trpc.businesses.dashboardStats.useQuery();
  const { data: recentDrops } = trpc.drops.myDrops.useQuery({ limit: 5 });
  const [, navigate] = useLocation();

  return (
    <BusinessShell>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px", maxWidth: 900 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 4 }}>
            {stats?.businessName ?? "Dashboard"}
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>
            {format(new Date(), "EEEE d MMMM yyyy")}
          </p>
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 1, background: BORDER, marginBottom: 40 }}>
          {[
            { label: "Active drops", value: stats?.activeDrops ?? "—" },
            { label: "Reservations today", value: stats?.reservationsToday ?? "—" },
            { label: "Collections today", value: stats?.collectionsToday ?? "—" },
            { label: "Followers", value: stats?.followers ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: BG, padding: "24px 20px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 28, fontWeight: 700, color: FG, marginBottom: 6 }}>
                {value}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 48, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/dashboard/drops/new")}
            style={{
              background: FG, color: BG, border: "none",
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "13px 24px", cursor: "pointer",
            }}
          >
            + NEW DROP
          </button>
          <a
            href="/dashboard/scanner"
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "13px 24px",
              border: `1px solid ${BORDER}`, color: FG, textDecoration: "none",
            }}
          >
            ⊙ SCANNER
          </a>
        </div>

        {/* Recent drops */}
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
            RECENT DROPS
          </div>
          {!recentDrops?.length ? (
            <div style={{ padding: "40px", border: `1px solid ${BORDER}`, textAlign: "center" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED_FG, fontStyle: "italic", marginBottom: 12 }}>
                No drops yet.
              </p>
              <button
                onClick={() => navigate("/dashboard/drops/new")}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10,
                  letterSpacing: "0.1em", padding: "11px 20px",
                  background: FG, color: BG, border: "none", cursor: "pointer",
                }}
              >
                CREATE YOUR FIRST DROP
              </button>
            </div>
          ) : (
            <div style={{ border: `1px solid ${BORDER}` }}>
              {recentDrops.map((drop: any, i: number) => (
                <div
                  key={drop.id}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "16px 20px",
                    borderBottom: i < recentDrops.length - 1 ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, marginBottom: 2 }}>
                      {drop.title}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                      {format(new Date(drop.collectionStart), "d MMM")} · {drop.availableQuantity} / {drop.totalQuantity} remaining
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <StatusBadge status={drop.status} />
                    <a
                      href={`/drop/${drop.id}`}
                      style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", textDecoration: "none" }}
                    >
                      VIEW →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BusinessShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#F0FDF4", text: "#15803D" },
    live: { bg: "#F0FDF4", text: "#15803D" },
    sold_out: { bg: "#FEF3C7", text: "#92400E" },
    cancelled: { bg: MUTED, text: MUTED_FG },
    expired: { bg: MUTED, text: MUTED_FG },
    draft: { bg: MUTED, text: MUTED_FG },
  };
  const c = colors[status] ?? { bg: MUTED, text: MUTED_FG };
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.1em", padding: "3px 8px",
      background: c.bg, color: c.text,
    }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

export { StatusBadge };
