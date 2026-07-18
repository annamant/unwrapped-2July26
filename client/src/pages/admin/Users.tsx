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

export default function AdminUsers() {
  const isMobile = useIsMobile(768);
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ limit: 500 });
  const utils = trpc.useUtils();
  const setRole = trpc.admin.setUserRole.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
  });

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 8 }}>
          Users
        </h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 32 }}>
          {users?.length ?? 0} registered {users?.length === 1 ? "account" : "accounts"}
        </p>

        {isLoading ? (
          <LoadingState />
        ) : !users?.length ? (
          <EmptyState label="No users yet." />
        ) : (
          <div style={{ border: `1px solid ${BORDER}` }}>
            {users.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 100px 120px 100px auto",
                  gap: isMobile ? 8 : 16,
                  alignItems: "center",
                  padding: isMobile ? "16px" : "16px 20px",
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
                <RoleBadge role={user.role} />
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {user.onboardingComplete ? "Onboarded" : "Incomplete"}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                  {format(new Date(user.createdAt), "d MMM yyyy")}
                </div>
                {!isMobile && (
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

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "admin";
  return (
    <span style={{
      fontFamily: "'Space Mono', monospace", fontSize: 8,
      letterSpacing: "0.1em", padding: "3px 8px",
      background: isAdmin ? "#FEF3C7" : MUTED,
      color: isAdmin ? "#92400E" : MUTED_FG,
      display: "inline-block", width: "fit-content",
    }}>
      {role.toUpperCase()}
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
