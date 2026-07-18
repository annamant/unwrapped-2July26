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

type StatusFilter = "active" | "pending" | "suspended" | "all";

export default function AdminBusinesses() {
  const isMobile = useIsMobile(768);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { data: businesses, isLoading } = trpc.admin.listBusinesses.useQuery({
    status: filter === "all" ? undefined : filter,
  });
  const utils = trpc.useUtils();
  const setStatus = trpc.admin.setBusinessStatus.useMutation({
    onSuccess: () => {
      utils.admin.listBusinesses.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 32 }}>
          Businesses
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
        ) : !businesses?.length ? (
          <EmptyState label={`No ${filter !== "all" ? filter : ""} businesses.`} />
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {businesses.map((biz, i) => (
              <div
                key={biz.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 120px 100px 100px auto",
                  gap: isMobile ? 8 : 16,
                  alignItems: "center",
                  padding: isMobile ? "16px" : "16px 20px",
                  borderBottom: i < businesses.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, marginBottom: 2 }}>
                    <a href={`/business/${biz.slug}`} style={{ color: FG, textDecoration: "none" }}>
                      {biz.name}
                    </a>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    {biz.contactEmail}{biz.city ? ` · ${biz.city}` : ""}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {biz.category}
                </div>
                <StatusBadge status={biz.status} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(biz.createdAt), "d MMM yyyy")}
                </div>
                {!isMobile && biz.status !== "pending" && (
                  <button
                    onClick={() => setStatus.mutate({
                      businessId: biz.id,
                      status: biz.status === "active" ? "suspended" : "active",
                    })}
                    disabled={setStatus.isPending}
                    style={{
                      fontFamily: "'Space Mono', monospace", fontSize: 9,
                      letterSpacing: "0.08em", padding: "6px 10px",
                      background: BG, border: `1px solid ${BORDER}`,
                      color: biz.status === "active" ? V : "#15803D",
                      cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    {biz.status === "active" ? "SUSPEND" : "ACTIVATE"}
                  </button>
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
    active: { bg: "#F0FDF4", text: "#15803D" },
    pending: { bg: "#FEF3C7", text: "#92400E" },
    suspended: { bg: "#FEF2F2", text: V },
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
