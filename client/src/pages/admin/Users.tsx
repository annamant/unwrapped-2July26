import { useState } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED, MUTED_FG, V } from "../../theme";

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

export default function AdminUsers() {
  const isMobile = useIsMobile(768);
  const [kind, setKind] = useState<KindFilter>("all");
  const { data, isLoading } = trpc.admin.listUsers.useQuery({ limit: 2000, kind });
  const utils = trpc.useUtils();
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  const counts = data?.counts;
  const users = data?.users ?? [];

  const filters: { key: KindFilter; label: string; count?: number }[] = [
    { key: "all", label: "All", count: counts?.total },
    { key: "invite_pending", label: "Invited · not claimed", count: counts?.invitePending },
    { key: "shopper", label: "Shoppers", count: counts?.shopper },
    { key: "claimed_owner", label: "Claimed owners", count: counts?.claimedOwner },
    { key: "admin", label: "Admins", count: counts?.admin },
  ];
  if ((counts?.directoryPlaceholder ?? 0) > 0 || (counts?.other ?? 0) > 0) {
    filters.push(
      { key: "directory_placeholder", label: "Directory stub", count: counts?.directoryPlaceholder },
      { key: "other", label: "Other", count: counts?.other },
    );
  }

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Accounts
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 24, maxWidth: 640, lineHeight: 1.5 }}>
          Every login row in the database. Most are invited shops that got a claim email but have not set a password yet — not shoppers. Self-signups and claimed owners are separate.
        </p>

        <div style={{
          display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28,
        }}>
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
          {kind === "all" && counts?.total != null ? ` · ${counts.total} total accounts` : ""}
          {data?.truncated ? " (list truncated — raise limit)" : ""}
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
      </div>
    </AdminLayout>
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
      background: isAdmin ? "#FEF3C7" : isInvite ? "#FFE8DE" : MUTED,
      color: isAdmin ? "#92400E" : isInvite ? V : MUTED_FG,
      display: "inline-block", width: "fit-content", maxWidth: "100%",
      lineHeight: 1.35,
    }}>
      {label.toUpperCase()}
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
