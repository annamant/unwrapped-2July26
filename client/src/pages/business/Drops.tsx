import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { DashLayout, StatusBadge } from "./Dashboard";
import { format } from "date-fns";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type Filter = "all" | "active" | "past";

export default function Drops() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<Filter>("all");
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data: drops, isLoading } = trpc.drops.myDrops.useQuery({});
  const utils = trpc.useUtils();
  const cancelDrop = trpc.drops.cancel.useMutation({
    onSuccess: () => {
      utils.drops.myDrops.invalidate();
      setCancelTarget(null);
    },
  });

  const filtered = (drops ?? []).filter((d: any) => {
    if (filter === "active") return d.status === "active" || d.status === "live";
    if (filter === "past") return d.status === "expired" || d.status === "cancelled" || d.status === "sold_out";
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "past", label: "Past" },
  ];

  return (
    <DashLayout>
      <div style={{ padding: "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG }}>
            Drops
          </h1>
          <button
            onClick={() => navigate("/dashboard/drops/new")}
            style={{
              background: FG, color: BG, border: "none",
              fontFamily: "'Space Mono', monospace", fontSize: 10,
              letterSpacing: "0.1em", padding: "12px 20px", cursor: "pointer",
            }}
          >
            + NEW DROP
          </button>
        </div>

        {/* Filters */}
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
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", fontFamily: "'Space Mono',monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
            LOADING
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", border: `1px solid ${BORDER}` }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: MUTED_FG, fontStyle: "italic", marginBottom: 16 }}>
              No drops here yet.
            </p>
            <button
              onClick={() => navigate("/dashboard/drops/new")}
              style={{
                background: FG, color: BG, border: "none",
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", padding: "11px 20px", cursor: "pointer",
              }}
            >
              CREATE A DROP
            </button>
          </div>
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {filtered.map((drop: any, i: number) => (
              <div
                key={drop.id}
                style={{
                  padding: "20px 24px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none",
                  display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "center",
                }}
              >
                <div>
                  {/* Title + status row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, fontWeight: 500 }}>
                      {drop.title}
                    </span>
                    <StatusBadge status={drop.status} />
                  </div>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <Meta label="Date" value={format(new Date(drop.collectionStart), "d MMM yyyy")} />
                    <Meta label="Window" value={`${format(new Date(drop.collectionStart), "h:mm a")} – ${format(new Date(drop.collectionEnd), "h:mm a")}`} />
                    <Meta label="Price" value={`£${(drop.price / 100).toFixed(2)}`} />
                    <Meta label="Stock" value={`${drop.availableQuantity} / ${drop.totalQuantity} remaining`} />
                    <Meta label="Reservations" value={`${drop.totalQuantity - drop.availableQuantity}`} />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <a
                    href={`/drop/${drop.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      letterSpacing: "0.1em", color: MUTED_FG, textDecoration: "none",
                      border: `1px solid ${BORDER}`, padding: "6px 12px",
                    }}
                  >
                    VIEW
                  </a>
                  {(drop.status === "active" || drop.status === "draft") && (
                    <button
                      onClick={() => setCancelTarget(drop.id)}
                      style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 9,
                        letterSpacing: "0.1em", color: V,
                        border: `1px solid ${V}`, padding: "6px 12px",
                        background: BG, cursor: "pointer",
                      }}
                    >
                      CANCEL
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel confirmation modal */}
        {cancelTarget && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(20,18,16,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}>
            <div style={{ background: BG, border: `1px solid ${BORDER}`, padding: "32px", maxWidth: 400, width: "90%" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.15em", marginBottom: 16 }}>
                CANCEL DROP
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, lineHeight: 1.6, marginBottom: 24 }}>
                This will cancel the drop and notify all reservation holders. Refunds will be issued automatically.
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => cancelDrop.mutate({ dropId: cancelTarget })}
                  disabled={cancelDrop.isPending}
                  style={{
                    flex: 1, padding: "12px",
                    background: V, color: BG, border: "none",
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >
                  {cancelDrop.isPending ? "CANCELLING…" : "CONFIRM CANCEL"}
                </button>
                <button
                  onClick={() => setCancelTarget(null)}
                  style={{
                    padding: "12px 20px",
                    border: `1px solid ${BORDER}`, background: BG, color: FG,
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >
                  KEEP
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashLayout>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: MUTED_FG }}>{label}: </span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: FG }}>{value}</span>
    </div>
  );
}
