import { useState } from "react";
import { useLocation } from "wouter";
import { trpc, clearSessionToken } from "../trpc";
import Nav from "../components/Nav";
import { format } from "date-fns";
import { requestPushPermission } from "../hooks/usePushNotifications";

const V = "#E8341C";
const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
];

type Tab = "reservations" | "past" | "notifications" | "account";

export default function Profile() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("reservations");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [pushStatus, setPushStatus] = useState<string>("");

  const { data: user } = trpc.auth.me.useQuery();
  const { data: active } = trpc.reservations.myReservations.useQuery({ status: "active" }, { enabled: tab === "reservations" });
  const { data: past } = trpc.reservations.myReservations.useQuery({ status: "past" }, { enabled: tab === "past" });
  const { data: notifPrefs } = trpc.auth.getNotificationPreferences.useQuery(undefined, { enabled: tab === "notifications" });

  const utils = trpc.useUtils();
  const signOut = trpc.auth.signOut.useMutation({ onSuccess: () => { clearSessionToken(); window.location.href = "/"; } });
  const deleteAccount = trpc.auth.deleteAccount.useMutation({ onSuccess: () => { clearSessionToken(); window.location.href = "/"; } });
  const updateNotifPrefs = trpc.auth.updateNotificationPreferences.useMutation({
    onSuccess: () => utils.auth.getNotificationPreferences.invalidate(),
  });

  const TABS: { key: Tab; label: string }[] = [
    { key: "reservations", label: "My drops" },
    { key: "past", label: "Past" },
    { key: "notifications", label: "Notifications" },
    { key: "account", label: "Account" },
  ];

  async function handleEnablePush() {
    setPushStatus("requesting");
    const result = await requestPushPermission();
    setPushStatus(result === "granted" ? "enabled" : result === "denied" ? "denied" : "unavailable");
  }

  return (
    <div style={{ minHeight: "100vh", background: BG }}>
      <Nav />

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, marginBottom: 4 }}>
            {user?.name ?? "My account"}
          </h1>
          {user?.email && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG }}>{user.email}</p>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 32, overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                padding: "12px 20px", background: "none", border: "none", whiteSpace: "nowrap",
                borderBottom: tab === t.key ? `2px solid ${FG}` : "2px solid transparent",
                color: tab === t.key ? FG : MUTED_FG,
                cursor: "pointer", marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Active reservations ── */}
        {tab === "reservations" && (
          <div>
            {!active?.length ? (
              <EmptyState
                title="No active drops"
                sub="When you reserve a drop, your ticket appears here."
                cta="Browse drops"
                href="/home"
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: BORDER }}>
                {active.map(({ reservation, drop, business, location }) => (
                  <ReservationRow
                    key={reservation.id}
                    reservationId={reservation.id}
                    drop={drop} business={business} location={location}
                    status={reservation.status}
                    referenceCode={reservation.referenceCode}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Past ── */}
        {tab === "past" && (
          <div>
            {!past?.length ? (
              <EmptyState title="No past drops yet" sub="Your collected and expired drops will appear here." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 1, background: BORDER }}>
                {past.map(({ reservation, drop, business, location }) => (
                  <ReservationRow
                    key={reservation.id}
                    reservationId={reservation.id}
                    drop={drop} business={business} location={location}
                    status={reservation.status}
                    referenceCode={reservation.referenceCode}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Notifications ── */}
        {tab === "notifications" && (
          <div>
            {/* Push permission */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
                DROP ALERTS
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, lineHeight: 1.6, marginBottom: 16 }}>
                Get notified the moment a new drop lands near you in a category you follow.
              </p>
              {pushStatus === "enabled" ? (
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#22C55E", letterSpacing: "0.1em" }}>✓ ALERTS ENABLED</p>
              ) : pushStatus === "denied" ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>Permission denied. Enable notifications in your browser settings.</p>
              ) : pushStatus === "unavailable" ? (
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>Push notifications aren't supported in this browser.</p>
              ) : (
                <button
                  onClick={handleEnablePush}
                  disabled={pushStatus === "requesting"}
                  style={{
                    background: FG, color: BG, border: "none",
                    fontFamily: "'Space Mono', monospace", fontSize: 10,
                    letterSpacing: "0.1em", padding: "11px 24px", cursor: "pointer",
                  }}
                >
                  {pushStatus === "requesting" ? "REQUESTING…" : "ENABLE DROP ALERTS"}
                </button>
              )}
            </div>

            {/* Category prefs */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
                CATEGORIES TO NOTIFY
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 20 }}>
                Leave all unchecked to receive alerts for every category.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map(cat => {
                  const enabled = notifPrefs?.enabledCategories.length === 0 || notifPrefs?.enabledCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = notifPrefs?.enabledCategories ?? [];
                        const next = current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat];
                        updateNotifPrefs.mutate({ enabledCategories: next });
                      }}
                      style={{
                        fontFamily: "'Space Mono', monospace", fontSize: 9,
                        letterSpacing: "0.08em", padding: "7px 14px",
                        border: `1px solid ${enabled ? FG : BORDER}`,
                        background: enabled ? FG : BG, color: enabled ? BG : MUTED_FG,
                        cursor: "pointer",
                      }}
                    >
                      {cat.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Account ── */}
        {tab === "account" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 16 }}>
                ACCOUNT
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                <Row label="Name" value={user?.name ?? "—"} />
                <Row label="Email" value={user?.email ?? "—"} />
                <Row label="Member since" value={user ? format(new Date(user.createdAt ?? Date.now()), "MMMM yyyy") : "—"} />
              </div>
            </div>

            <button
              onClick={() => signOut.mutate()}
              style={{
                padding: "14px", border: `1px solid ${BORDER}`,
                background: BG, color: FG,
                fontFamily: "'Space Mono', monospace", fontSize: 10,
                letterSpacing: "0.1em", cursor: "pointer",
              }}
            >
              SIGN OUT
            </button>

            {/* Delete account */}
            <div style={{ border: `1px solid ${BORDER}`, padding: "24px" }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.15em", marginBottom: 12 }}>
                DELETE ACCOUNT
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.6, marginBottom: 16 }}>
                Permanently deletes your account, all reservations, and your data. This cannot be undone.
              </p>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, marginBottom: 8 }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  style={{
                    flex: 1, padding: "10px 14px",
                    border: `1px solid ${BORDER}`, background: BG,
                    fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG, outline: "none",
                  }}
                />
                <button
                  onClick={() => deleteAccount.mutate({ confirmation: "DELETE" })}
                  disabled={deleteConfirm !== "DELETE" || deleteAccount.isPending}
                  style={{
                    padding: "10px 20px", background: deleteConfirm === "DELETE" ? V : MUTED,
                    color: deleteConfirm === "DELETE" ? BG : MUTED_FG,
                    border: "none", cursor: deleteConfirm === "DELETE" ? "pointer" : "not-allowed",
                    fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
                  }}
                >
                  {deleteAccount.isPending ? "DELETING…" : "DELETE"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReservationRow({ reservationId, drop, business, location, status, referenceCode }: {
  reservationId: string; drop: any; business: any; location: any;
  status: string; referenceCode: string;
}) {
  const statusColor: Record<string, string> = {
    active: FG, fulfilled: "#22C55E", cancelled: MUTED_FG, expired: MUTED_FG,
  };
  return (
    <a
      href={`/ticket/${reservationId}`}
      style={{ background: BG, padding: "20px", textDecoration: "none", display: "block" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
            {business.name}
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 600, color: FG, marginBottom: 6 }}>
            {drop.title}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
            {format(new Date(drop.collectionStart), "EEE d MMM")} · {format(new Date(drop.collectionStart), "h:mm a")} – {format(new Date(drop.collectionEnd), "h:mm a")}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
            {location.address.split(",")[0]}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: statusColor[status] ?? FG, letterSpacing: "0.1em", marginBottom: 8 }}>
            {status.toUpperCase()}
          </div>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: FG }}>
            {referenceCode}
          </div>
        </div>
      </div>
    </a>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>{label}</span>
      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>{value}</span>
    </div>
  );
}

function EmptyState({ title, sub, cta, href }: { title: string; sub: string; cta?: string; href?: string }) {
  return (
    <div style={{ padding: "60px 0", textAlign: "center" }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: MUTED_FG, marginBottom: 8 }}>{title}</p>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginBottom: 24 }}>{sub}</p>
      {cta && href && <a href={href} style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: FG, letterSpacing: "0.1em", border: `1px solid ${FG}`, padding: "10px 20px" }}>{cta.toUpperCase()}</a>}
    </div>
  );
}
