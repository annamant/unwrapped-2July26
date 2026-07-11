import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import { DashLayout, StatusBadge } from "./Dashboard";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

type Filter = "all" | "active" | "past";

export default function Drops() {
  const isMobile = useIsMobile(768);
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

  // ── Edit drop state ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "", imageUrl: "", addQuantity: "", collectionEnd: "" });
  const [editError, setEditError] = useState("");
  const updateDrop = trpc.drops.update.useMutation({
    onSuccess: () => {
      utils.drops.myDrops.invalidate();
      setEditingId(null);
      setEditError("");
    },
    onError: (e) => setEditError(e.message),
  });

  function startEdit(drop: any) {
    setEditError("");
    setEditingId(drop.id);
    setEditForm({
      title: drop.title ?? "",
      description: drop.description ?? "",
      imageUrl: drop.imageUrl ?? "",
      addQuantity: "",
      collectionEnd: "",
    });
  }

  function saveEdit(drop: any) {
    setEditError("");
    const addQty = editForm.addQuantity ? parseInt(editForm.addQuantity) : undefined;
    if (editForm.addQuantity && (isNaN(addQty!) || addQty! < 1)) {
      setEditError("Added stock must be a positive number.");
      return;
    }
    updateDrop.mutate({
      dropId: drop.id,
      ...(editForm.title !== drop.title && editForm.title.trim() && { title: editForm.title.trim() }),
      ...(editForm.description !== (drop.description ?? "") && { description: editForm.description }),
      ...(editForm.imageUrl !== (drop.imageUrl ?? "") && { imageUrl: editForm.imageUrl.trim() || null }),
      ...(addQty && { addQuantity: addQty }),
      ...(editForm.collectionEnd && { collectionEnd: new Date(editForm.collectionEnd).toISOString() }),
    });
  }

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
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
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
              <div key={drop.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div
                style={{
                  padding: isMobile ? "16px" : "20px 24px",
                  display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
                  gap: isMobile ? 14 : 24, alignItems: "center",
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
                  {(drop.status === "active" || drop.status === "sold_out" || drop.status === "draft") && (
                    <button
                      onClick={() => editingId === drop.id ? setEditingId(null) : startEdit(drop)}
                      style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 9,
                        letterSpacing: "0.1em", color: FG,
                        border: `1px solid ${FG}`, padding: "6px 12px",
                        background: editingId === drop.id ? MUTED : BG, cursor: "pointer",
                      }}
                    >
                      {editingId === drop.id ? "CLOSE" : "EDIT"}
                    </button>
                  )}
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

              {/* Inline editor */}
              {editingId === drop.id && (
                <div style={{ padding: isMobile ? "0 16px 20px" : "0 24px 24px", background: MUTED }}>
                  <div style={{ paddingTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
                    <EditField label="Title">
                      <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} style={editInputStyle} maxLength={100} />
                    </EditField>
                    <EditField label="Description">
                      <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...editInputStyle, resize: "vertical" }} maxLength={1000} />
                    </EditField>
                    <EditField label="Image URL">
                      <input value={editForm.imageUrl} onChange={e => setEditForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://…" style={editInputStyle} />
                    </EditField>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                      <EditField label="Add stock (existing tickets unaffected)">
                        <input type="number" min="1" value={editForm.addQuantity} onChange={e => setEditForm(f => ({ ...f, addQuantity: e.target.value }))} placeholder="e.g. 5" style={editInputStyle} />
                      </EditField>
                      <EditField label="Extend collection end (later than current only)">
                        <input type="datetime-local" value={editForm.collectionEnd} onChange={e => setEditForm(f => ({ ...f, collectionEnd: e.target.value }))} style={editInputStyle} />
                      </EditField>
                    </div>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, margin: 0 }}>
                      Price, date and start time can't be edited once a drop is live — cancel and recreate if those are wrong (refunds are automatic).
                    </p>
                    {editError && (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, margin: 0 }}>{editError}</p>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button
                        onClick={() => saveEdit(drop)}
                        disabled={updateDrop.isPending}
                        style={{
                          padding: "11px 20px", background: FG, color: BG, border: "none",
                          fontFamily: "'Space Mono', monospace", fontSize: 10,
                          letterSpacing: "0.1em", cursor: "pointer",
                        }}
                      >
                        {updateDrop.isPending ? "SAVING…" : "SAVE CHANGES"}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditError(""); }}
                        style={{
                          padding: "11px 20px", border: `1px solid ${BORDER}`, background: BG, color: FG,
                          fontFamily: "'Space Mono', monospace", fontSize: 10,
                          letterSpacing: "0.1em", cursor: "pointer",
                        }}
                      >
                        DISCARD
                      </button>
                    </div>
                  </div>
                </div>
              )}
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

const editInputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
  border: `1px solid ${BORDER}`, background: BG, color: FG, outline: "none",
};

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, display: "block", marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
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
