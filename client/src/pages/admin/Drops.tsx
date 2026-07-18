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

type DropFilter = "all" | "draft" | "active" | "sold_out" | "cancelled" | "expired";

export default function AdminDrops() {
  const isMobile = useIsMobile(768);
  const [filter, setFilter] = useState<DropFilter>("all");
  const { data: drops, isLoading } = trpc.admin.listDrops.useQuery({
    status: filter === "all" ? undefined : filter,
    limit: 200,
  });

  const FILTERS: { key: DropFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "draft", label: "Draft" },
    { key: "sold_out", label: "Sold out" },
    { key: "cancelled", label: "Cancelled" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 32 }}>
          Drops
        </h1>

        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
          {FILTERS.map(f => (
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
          <LoadingState />
        ) : !drops?.length ? (
          <EmptyState label={`No ${filter !== "all" ? filter.replace("_", " ") : ""} drops.`} />
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {drops.map((row, i) => (
              <div
                key={row.drop.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr auto" : "1fr 140px 80px 80px 100px 80px",
                  gap: isMobile ? 8 : 16,
                  alignItems: "center",
                  padding: isMobile ? "16px" : "16px 20px",
                  borderBottom: i < drops.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, marginBottom: 2 }}>
                    <a href={`/drop/${row.drop.id}`} style={{ color: FG, textDecoration: "none" }}>
                      {row.drop.title}
                    </a>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {row.business.name}
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>
                  £{(row.drop.price / 100).toFixed(2)}
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: FG }}>
                  {row.drop.availableQuantity}/{row.drop.totalQuantity}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(row.drop.collectionStart), "d MMM")}
                </div>
                <StatusBadge status={row.drop.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "#15803D", draft: "#92400E", sold_out: "#92400E",
    cancelled: MUTED_FG, expired: MUTED_FG,
  };
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      color: colors[status] ?? MUTED_FG, letterSpacing: "0.1em",
    }}>
      {status.replace("_", " ").toUpperCase()}
    </span>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: 60, textAlign: "center", fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG, letterSpacing: "0.15em" }}>
      LOADING
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: 60, textAlign: "center", border: `1px solid ${BORDER}` }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: MUTED_FG, fontStyle: "italic" }}>
        {label}
      </p>
    </div>
  );
}
