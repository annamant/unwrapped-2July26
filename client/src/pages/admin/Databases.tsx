import { useMemo, useState } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED, MUTED_FG, V } from "../../theme";

type DbTab = "accounts" | "warehouse";

type KindFilter =
  | "all"
  | "shopper"
  | "invite_pending"
  | "claimed_owner"
  | "admin"
  | "directory_placeholder"
  | "other";

const KIND_LABEL: Record<Exclude<KindFilter, "all">, string> = {
  shopper: "Shopper",
  invite_pending: "Invited shop — not claimed",
  claimed_owner: "Claimed shop owner",
  admin: "Admin",
  directory_placeholder: "Directory placeholder",
  other: "Other",
};

function initialTab(): DbTab {
  if (typeof window === "undefined") return "accounts";
  return new URLSearchParams(window.location.search).get("tab") === "warehouse"
    ? "warehouse"
    : "accounts";
}

export default function AdminDatabases() {
  const isMobile = useIsMobile(768);
  const [tab, setTab] = useState<DbTab>(initialTab);

  const setTabAndUrl = (next: DbTab) => {
    setTab(next);
    const url = next === "warehouse" ? "/admin/databases?tab=warehouse" : "/admin/databases";
    window.history.replaceState(null, "", url);
  };

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Databases
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 24, maxWidth: 640, lineHeight: 1.5 }}>
          Raw tables from imports and sign-ups. Keep these for lookup and housekeeping — day-to-day onboarding lives under Onboarding pipeline.
        </p>

        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, marginBottom: 28 }}>
          {([
            { key: "accounts" as const, label: "Accounts (logins)" },
            { key: "warehouse" as const, label: "Warehouse shops" },
          ]).map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabAndUrl(t.key)}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                  padding: "12px 18px", cursor: "pointer",
                  background: "none", border: "none",
                  color: active ? FG : MUTED_FG,
                  borderBottom: active ? `2px solid ${FG}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "accounts" ? <AccountsTab isMobile={isMobile} /> : <WarehouseTab isMobile={isMobile} />}
      </div>
    </AdminLayout>
  );
}


function AccountsTab({ isMobile }: { isMobile: boolean }) {
  const [kind, setKind] = useState<KindFilter>("all");
  const { data, isLoading } = trpc.admin.listUsers.useQuery({ limit: 2000, kind });
  const utils = trpc.useUtils();
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const counts = data?.counts;
  const users = data?.users ?? [];

  const filters = useMemo(() => {
    const base: { key: KindFilter; label: string; count?: number }[] = [
      { key: "all", label: "All", count: counts?.total },
      { key: "invite_pending", label: "Invited · not claimed", count: counts?.invitePending },
      { key: "shopper", label: "Shoppers", count: counts?.shopper },
      { key: "claimed_owner", label: "Claimed owners", count: counts?.claimedOwner },
      { key: "admin", label: "Admins", count: counts?.admin },
    ];
    if ((counts?.directoryPlaceholder ?? 0) > 0 || (counts?.other ?? 0) > 0) {
      base.push(
        { key: "directory_placeholder", label: "Directory stub", count: counts?.directoryPlaceholder },
        { key: "other", label: "Other", count: counts?.other },
      );
    }
    return base;
  }, [counts]);

  return (
    <>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 20, maxWidth: 640, lineHeight: 1.45 }}>
        Every login row. Invited shops that never claimed are not shoppers — they are passwordless owners on a claim link.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
        {filters.map((f) => {
          const active = kind === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setKind(f.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                padding: "8px 12px", cursor: "pointer",
                background: active ? MUTED : BG,
                border: `1px solid ${active ? FG : BORDER}`,
                color: active ? FG : MUTED_FG,
              }}
            >
              {f.label}
              {f.count != null ? (
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 11,
                  marginLeft: 8, color: active ? V : MUTED_FG,
                }}>
                  {f.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16 }}>
        Showing {users.length}
        {data?.totalMatching != null && data.totalMatching !== users.length
          ? ` of ${data.totalMatching}`
          : ""}
        {kind === "all" && counts?.total != null ? ` · ${counts.total} total` : ""}
        {data?.truncated ? " (list truncated)" : ""}
      </p>

      {isLoading ? (
        <LoadingState />
      ) : !users.length ? (
        <EmptyState label="No accounts in this filter." />
      ) : (
        <div style={{ border: `1px solid ${BORDER}` }}>
          {!isMobile && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 160px 1fr 140px 100px auto",
              gap: 16,
              padding: "10px 20px",
              borderBottom: `1px solid ${BORDER}`,
              background: MUTED,
            }}>
              {["Name / email", "Account type", "Shop", "Status", "Created", ""].map((h) => (
                <div key={h || "a"} style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 8,
                  letterSpacing: "0.12em", color: MUTED_FG,
                }}>
                  {h.toUpperCase()}
                </div>
              ))}
            </div>
          )}
          {users.map((user, i) => (
            <div
              key={user.id}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 160px 1fr 140px 100px auto",
                gap: isMobile ? 8 : 16,
                alignItems: "center",
                padding: isMobile ? "16px" : "14px 20px",
                borderBottom: i < users.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, marginBottom: 2 }}>
                  {user.name || "—"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {user.email}
                </div>
              </div>
              <KindBadge kind={user.kind} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG }}>
                {user.businessName
                  ? (
                    <>
                      {user.businessName}
                      {user.businessCount > 1 ? (
                        <span style={{ color: MUTED_FG }}> · +{user.businessCount - 1} more</span>
                      ) : null}
                    </>
                  )
                  : <span style={{ color: MUTED_FG }}>—</span>}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                {user.statusLabel}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                {format(new Date(user.createdAt), "d MMM yyyy")}
              </div>
              {!isMobile && user.kind !== "directory_placeholder" && (
                <button
                  onClick={() => setRole.mutate({
                    userId: user.id,
                    role: user.role === "admin" ? "consumer" : "admin",
                  })}
                  disabled={setRole.isPending}
                  style={{
                    fontFamily: "'Space Mono', monospace", fontSize: 9,
                    letterSpacing: "0.08em", padding: "6px 10px",
                    background: BG, border: `1px solid ${BORDER}`,
                    color: MUTED_FG, cursor: "pointer", whiteSpace: "nowrap",
                  }}
                >
                  {user.role === "admin" ? "REVOKE ADMIN" : "MAKE ADMIN"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WarehouseTab({ isMobile }: { isMobile: boolean }) {
  const utils = trpc.useUtils();
  const { data: warehouse, isLoading } = trpc.admin.listBusinesses.useQuery({ status: "active" });
  const setStatus = trpc.admin.setBusinessStatus.useMutation({
    onSuccess: () => {
      utils.admin.listBusinesses.invalidate();
      utils.admin.opsPipeline.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  return (
    <>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 20, maxWidth: 640, lineHeight: 1.45 }}>
        Every active shop profile in the warehouse — scrapes, imports, claimed members. Not the curated landing board.
      </p>

      {isLoading ? (
        <LoadingState />
      ) : !warehouse?.length ? (
        <EmptyState label="No warehouse profiles." />
      ) : (
        <div style={{ border: `1px solid ${BORDER}` }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG,
            letterSpacing: "0.1em", padding: "10px 20px", borderBottom: `1px solid ${BORDER}`, background: MUTED,
          }}>
            {warehouse.length} PROFILE{warehouse.length === 1 ? "" : "S"}
          </div>
          {warehouse.map((biz, i) => (
            <div
              key={biz.id}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 140px 110px auto",
                gap: isMobile ? 8 : 16,
                alignItems: "center",
                padding: isMobile ? "14px 16px" : "14px 20px",
                borderBottom: i < warehouse.length - 1 ? `1px solid ${BORDER}` : "none",
              }}
            >
              <div>
                <a href={`/business/${biz.slug}`} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, textDecoration: "none" }}>
                  {biz.name}
                </a>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
                  {isPlaceholderEmail(biz.contactEmail) ? "no email" : biz.contactEmail}
                  {biz.city ? ` · ${biz.city}` : ""}
                </div>
              </div>
              <ClaimBadge status={biz.claimStatus} />
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                {format(new Date(biz.createdAt), "d MMM yyyy")}
              </div>
              {biz.status !== "pending" && (
                <button
                  type="button"
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
                  {biz.status === "active" ? "SUSPEND" : "LIST"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function KindBadge({ kind }: { kind: string }) {
  const label = KIND_LABEL[kind as Exclude<KindFilter, "all">] ?? kind;
  const isInvite = kind === "invite_pending";
  const isAdmin = kind === "admin";
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.08em", padding: "4px 8px",
      background: isAdmin ? "#FEF3C7" : isInvite ? "#FFD5E0" : MUTED,
      color: isAdmin ? "#92400E" : isInvite ? V : MUTED_FG,
      display: "inline-block", width: "fit-content", maxWidth: "100%",
      lineHeight: 1.35,
    }}>
      {label.toUpperCase()}
    </span>
  );
}

function isPlaceholderEmail(email: string | null | undefined): boolean {
  return !email || email.toLowerCase() === "unclaimed-directory@shopunwrapped.com";
}

function ClaimBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string; label: string }> = {
    claimed: { bg: "#F0FDF4", text: "#15803D", label: "CLAIMED" },
    invite_sent: { bg: "#EFF6FF", text: "#1D4ED8", label: "INVITE SENT" },
    awaiting_invite: { bg: "#FEF3C7", text: "#92400E", label: "AWAITING INVITE" },
    no_email: { bg: MUTED, text: MUTED_FG, label: "NO EMAIL" },
  };
  const c = colors[status] ?? { bg: MUTED, text: MUTED_FG, label: status.toUpperCase() };
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.1em", padding: "3px 8px",
      background: c.bg, color: c.text, display: "inline-block", width: "fit-content",
    }}>
      {c.label}
    </span>
  );
}

function LoadingState() {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center" }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>Loading…</span>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div style={{ padding: "48px 20px", textAlign: "center", border: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>{label}</span>
    </div>
  );
}
