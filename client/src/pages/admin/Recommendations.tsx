import { useState } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type RecFilter = "pending" | "contacted" | "listed" | "dismissed" | "all";
type RecStatus = "pending" | "contacted" | "listed" | "dismissed";

export default function Recommendations() {
  const isMobile = useIsMobile(768);
  const [filter, setFilter] = useState<RecFilter>("pending");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: recommendations, isLoading } = trpc.admin.listRecommendations.useQuery({
    status: filter === "all" ? undefined : filter,
  });
  const utils = trpc.useUtils();

  const updateStatus = trpc.admin.updateRecommendationStatus.useMutation({
    onSuccess: (row) => {
      utils.admin.listRecommendations.invalidate();
      utils.admin.stats.invalidate();
      setSelected(row);
      setAdminNotes(row.adminNotes ?? "");
    },
  });

  const FILTERS: { key: RecFilter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "contacted", label: "Contacted" },
    { key: "listed", label: "Listed" },
    { key: "dismissed", label: "Dismissed" },
    { key: "all", label: "All" },
  ];

  function open(row: any) {
    setSelected(row);
    setAdminNotes(row.adminNotes ?? "");
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Recommendations
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 32, maxWidth: 520 }}>
          Shops and neighbourhood spots nominated by the public. Reach out, then mark status here.
        </p>

        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: filter === f.key ? `2px solid ${FG}` : "2px solid transparent",
                color: filter === f.key ? FG : MUTED_FG,
                cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
            LOADING
          </div>
        ) : !recommendations?.length ? (
          <div style={{ padding: "60px", textAlign: "center", border: `1px solid ${BORDER}` }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED_FG, fontStyle: "italic" }}>
              No {filter !== "all" ? filter : ""} recommendations.
            </p>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {recommendations.map((rec: any, i: number) => (
              <div
                key={rec.id}
                onClick={() => open(rec)}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr auto" : "1fr 140px 100px 100px",
                  gap: isMobile ? 8 : 16, alignItems: "center",
                  padding: isMobile ? "16px" : "16px 20px",
                  borderBottom: i < recommendations.length - 1 ? `1px solid ${BORDER}` : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = MUTED)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BG)}
              >
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, marginBottom: 2 }}>
                    {rec.businessName}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {rec.neighbourhood}
                    {rec.recommenderName ? ` · via ${rec.recommenderName}` : ""}
                  </div>
                </div>
                {!isMobile && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {rec.category || "—"}
                  </div>
                )}
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(rec.createdAt), "d MMM")}
                </div>
                <StatusBadge status={rec.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(20,18,16,0.6)",
          display: "flex", alignItems: "center", justifyContent: "flex-end", zIndex: 100,
        }}>
          <div style={{
            background: BG, width: "min(540px, 90vw)", height: "100vh",
            overflowY: "auto", borderLeft: `1px solid ${BORDER}`,
            display: "flex", flexDirection: "column",
          }}>
            <div style={{
              padding: "20px 28px", borderBottom: `1px solid ${BORDER}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
                RECOMMENDATION
              </span>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: MUTED_FG }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, padding: "28px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: FG, marginBottom: 4 }}>
                {selected.businessName}
              </h2>
              <StatusBadge status={selected.status} />

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <InfoRow label="Area" value={selected.neighbourhood} />
                {selected.category && <InfoRow label="Category" value={selected.category} />}
                {selected.businessAddress && <InfoRow label="Address" value={selected.businessAddress} />}
                {selected.businessInstagram && (
                  <InfoRow
                    label="Instagram"
                    value={selected.businessInstagram}
                    href={`https://instagram.com/${selected.businessInstagram.replace("@", "")}`}
                  />
                )}
                {selected.businessWebsite && (
                  <InfoRow
                    label="Link"
                    value={selected.businessWebsite}
                    href={selected.businessWebsite.startsWith("http") ? selected.businessWebsite : `https://${selected.businessWebsite}`}
                  />
                )}
                {selected.note && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 6 }}>Why they love them</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.7 }}>
                      {selected.note}
                    </p>
                  </div>
                )}
                <InfoRow label="Nominated" value={format(new Date(selected.createdAt), "d MMM yyyy 'at' h:mm a")} />
                {(selected.recommenderName || selected.recommenderEmail) && (
                  <>
                    {selected.recommenderName && <InfoRow label="From" value={selected.recommenderName} />}
                    {selected.recommenderEmail && <InfoRow label="Email" value={selected.recommenderEmail} />}
                  </>
                )}
              </div>

              <div style={{ marginTop: 32 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
                  ADMIN NOTES
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Outreach notes, contact found, etc."
                  style={{
                    width: "100%", padding: "10px 14px", boxSizing: "border-box",
                    border: `1px solid ${BORDER}`, background: BG, color: FG,
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    outline: "none", resize: "vertical", marginBottom: 16,
                  }}
                />

                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
                  UPDATE STATUS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {([
                    { status: "contacted" as RecStatus, label: "MARK CONTACTED", color: FG },
                    { status: "listed" as RecStatus, label: "MARK LISTED", color: "#15803D" },
                    { status: "dismissed" as RecStatus, label: "DISMISS", color: V },
                    { status: "pending" as RecStatus, label: "BACK TO PENDING", color: MUTED_FG },
                  ]).map(({ status, label, color }) => (
                    <button
                      key={status}
                      onClick={() => updateStatus.mutate({
                        recommendationId: selected.id,
                        status,
                        adminNotes,
                      })}
                      disabled={updateStatus.isPending || selected.status === status}
                      style={{
                        width: "100%", padding: "12px",
                        background: selected.status === status ? MUTED : BG,
                        color,
                        border: `1px solid ${color === MUTED_FG ? BORDER : color}`,
                        fontFamily: "'Space Mono', monospace", fontSize: 10,
                        letterSpacing: "0.1em",
                        cursor: selected.status === status ? "default" : "pointer",
                        opacity: updateStatus.isPending ? 0.6 : 1,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div style={{ display: "flex", gap: 16, paddingBottom: 12, borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, width: 90, flexShrink: 0 }}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>
          {value}
        </a>
      ) : (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>{value}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    contacted: { bg: "#EFF6FF", text: "#1D4ED8" },
    listed: { bg: "#F0FDF4", text: "#15803D" },
    dismissed: { bg: "#FEF2F2", text: V },
  };
  const c = colors[status] ?? { bg: MUTED, text: MUTED_FG };
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.1em", padding: "3px 8px",
      background: c.bg, color: c.text, display: "inline-block",
    }}>
      {status.toUpperCase()}
    </span>
  );
}
