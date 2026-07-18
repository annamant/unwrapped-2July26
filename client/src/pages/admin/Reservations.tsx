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

type StatusFilter = "all" | "active" | "fulfilled" | "cancelled" | "expired";

export default function AdminReservations() {
  const isMobile = useIsMobile(768);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { data: reservations, isLoading } = trpc.admin.listReservations.useQuery({
    status: filter === "all" ? undefined : filter,
    limit: 200,
  });

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "fulfilled", label: "Fulfilled" },
    { key: "cancelled", label: "Cancelled" },
    { key: "expired", label: "Expired" },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 32 }}>
          Reservations
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
                cursor: "pointer", marginBottom: -1,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !reservations?.length ? (
          <EmptyState label={`No ${filter !== "all" ? filter : ""} reservations.`} />
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {reservations.map((res, i) => (
              <div
                key={res.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr auto" : "100px 1fr 140px 80px 100px 100px",
                  gap: isMobile ? 8 : 16,
                  alignItems: "center",
                  padding: isMobile ? "16px" : "16px 20px",
                  borderBottom: i < reservations.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: FG }}>
                  {res.referenceCode}
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, marginBottom: 2 }}>
                    {res.dropTitle}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {res.userName || res.userEmail} · {res.businessName}
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>
                  £{(res.price / 100).toFixed(2)}
                </div>
                <StatusBadge status={res.status} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(res.createdAt), "d MMM yyyy")}
                </div>
                {res.fulfilledAt && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#15803D" }}>
                    Fulfilled {format(new Date(res.fulfilledAt), "d MMM")}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#FEF3C7", text: "#92400E" },
    fulfilled: { bg: "#F0FDF4", text: "#15803D" },
    cancelled: { bg: "#FEF2F2", text: V },
    expired: { bg: MUTED, text: MUTED_FG },
  };
  const c = colors[status] ?? { bg: MUTED, text: MUTED_FG };
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.1em", padding: "3px 8px",
      background: c.bg, color: c.text, display: "inline-block", width: "fit-content",
    }}>
      {status.toUpperCase()}
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
