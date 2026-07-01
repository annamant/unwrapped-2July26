import { useState } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import { format } from "date-fns";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type AppFilter = "pending" | "approved" | "rejected" | "all";

export default function Applications() {
  const [filter, setFilter] = useState<AppFilter>("pending");
  const [selected, setSelected] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: applications, isLoading } = trpc.admin.listApplications.useQuery({ status: filter === "all" ? undefined : filter });
  const utils = trpc.useUtils();

  const approve = trpc.admin.approveApplication.useMutation({
    onSuccess: () => {
      utils.admin.listApplications.invalidate();
      utils.admin.stats.invalidate();
      setSelected(null);
    },
  });
  const reject = trpc.admin.rejectApplication.useMutation({
    onSuccess: () => {
      utils.admin.listApplications.invalidate();
      utils.admin.stats.invalidate();
      setSelected(null);
      setRejectReason("");
    },
  });

  const FILTERS: { key: AppFilter; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 32 }}>
          Applications
        </h1>

        {/* Filter tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                padding: "10px 20px", background: "none", border: "none",
                borderBottom: filter === f.key ? `2px solid ${FG}` : "2px solid transparent",
                color: filter === f.key ? FG : MUTED_FG,
                cursor: "pointer", marginBottom: -1,
              }}
            >
              {f.label}
              {f.key === "pending" && (applications?.length ?? 0) > 0 && filter !== "pending" && (
                <span style={{ marginLeft: 8, fontFamily: "'Space Mono',monospace", fontSize: 8, color: V }}>
                  {applications?.filter((a: any) => a.status === "pending").length || ""}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
            LOADING
          </div>
        ) : !applications?.length ? (
          <div style={{ padding: "60px", textAlign: "center", border: `1px solid ${BORDER}` }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED_FG, fontStyle: "italic" }}>
              No {filter !== "all" ? filter : ""} applications.
            </p>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {applications.map((app: any, i: number) => (
              <div
                key={app.id}
                onClick={() => setSelected(app)}
                style={{
                  display: "grid", gridTemplateColumns: "1fr 120px 100px 100px",
                  gap: 16, alignItems: "center",
                  padding: "16px 20px",
                  borderBottom: i < applications.length - 1 ? `1px solid ${BORDER}` : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = MUTED)}
                onMouseLeave={e => (e.currentTarget.style.background = BG)}
              >
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, marginBottom: 2 }}>
                    {app.name}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {app.contactEmail} · {app.city}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {app.category}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(app.createdAt), "d MMM")}
                </div>
                <AppStatusBadge status={app.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel / modal */}
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
            {/* Panel header */}
            <div style={{
              padding: "20px 28px", borderBottom: `1px solid ${BORDER}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
                APPLICATION
              </span>
              <button
                onClick={() => { setSelected(null); setRejectReason(""); }}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: MUTED_FG }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, padding: "28px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: FG, marginBottom: 4 }}>
                {selected.name}
              </h2>
              <AppStatusBadge status={selected.status} />

              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                <InfoRow label="Email" value={selected.contactEmail} />
                <InfoRow label="Category" value={selected.category} />
                <InfoRow label="City" value={selected.city} />
                {selected.address && <InfoRow label="Address" value={selected.address} />}
                {selected.postcode && <InfoRow label="Postcode" value={selected.postcode} />}
                {selected.instagramHandle && (
                  <InfoRow label="Instagram" value={selected.instagramHandle}
                    href={`https://instagram.com/${selected.instagramHandle.replace("@", "")}`} />
                )}
                {selected.website && (
                  <InfoRow label="Website" value={selected.website} href={selected.website} />
                )}
                {selected.description && (
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG, marginBottom: 6 }}>About</div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.7 }}>
                      {selected.description}
                    </p>
                  </div>
                )}
                <InfoRow label="Applied" value={format(new Date(selected.createdAt), "d MMM yyyy 'at' h:mm a")} />
              </div>

              {/* Actions */}
              {selected.status === "pending" && (
                <div style={{ marginTop: 32 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
                    DECISION
                  </div>

                  <button
                    onClick={() => approve.mutate({ applicationId: selected.id })}
                    disabled={approve.isPending}
                    style={{
                      width: "100%", padding: "14px",
                      background: "#15803D", color: BG, border: "none",
                      fontFamily: "'Space Mono', monospace", fontSize: 11,
                      letterSpacing: "0.12em", cursor: "pointer",
                      marginBottom: 10,
                    }}
                  >
                    {approve.isPending ? "APPROVING…" : "✓ APPROVE"}
                  </button>

                  <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, marginTop: 16 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, display: "block", marginBottom: 8 }}>
                      Rejection reason (optional)
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      rows={2}
                      placeholder="e.g. Not accepting new applications in this category right now."
                      style={{
                        width: "100%", padding: "10px 14px", boxSizing: "border-box",
                        border: `1px solid ${BORDER}`, background: BG, color: FG,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        outline: "none", resize: "vertical", marginBottom: 10,
                      }}
                    />
                    <button
                      onClick={() => reject.mutate({ applicationId: selected.id, reason: rejectReason || undefined })}
                      disabled={reject.isPending}
                      style={{
                        width: "100%", padding: "14px",
                        background: BG, color: V,
                        border: `1px solid ${V}`,
                        fontFamily: "'Space Mono', monospace", fontSize: 11,
                        letterSpacing: "0.12em", cursor: "pointer",
                      }}
                    >
                      {reject.isPending ? "REJECTING…" : "✕ REJECT"}
                    </button>
                  </div>
                </div>
              )}

              {selected.status === "approved" && (
                <div style={{ marginTop: 24, padding: "14px", background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#15803D", letterSpacing: "0.1em" }}>
                    ✓ APPROVED — Business has been created
                  </span>
                </div>
              )}

              {selected.status === "rejected" && selected.rejectionReason && (
                <div style={{ marginTop: 24, padding: "14px", background: "#FEF2F2", border: `1px solid ${V}40` }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.1em", marginBottom: 8 }}>
                    REJECTION REASON
                  </div>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>{selected.rejectionReason}</p>
                </div>
              )}
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

function AppStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    pending: { bg: "#FEF3C7", text: "#92400E" },
    approved: { bg: "#F0FDF4", text: "#15803D" },
    rejected: { bg: "#FEF2F2", text: V },
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
