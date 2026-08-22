import { useRef, useState, type CSSProperties, type RefObject } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import { format } from "date-fns";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED, MUTED_FG, V } from "../../theme";


const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
] as const;

type OpsTab = "curated" | "invite_sent" | "claimed";

type ImportRow = {
  name: string;
  contactEmail?: string;
  category: (typeof CATEGORIES)[number];
  city: string;
  address?: string;
  postcode?: string;
  instagramHandle?: string;
  website?: string;
  description?: string;
};

type ParseIssue = { line: number; message: string };

const CSV_HEADERS = [
  "name", "contactEmail", "category", "city",
  "address", "postcode", "instagramHandle", "website", "description",
] as const;

const SAMPLE_CSV = [
  CSV_HEADERS.join(","),
  "Maison Blanc,hello@maisonblanc.example,Food & Drink,London,123 Portobello Road,W11 2DY,@maisonblanc,https://maisonblanc.example,Pastry shop",
  "Atelier North,studio@atelier.example,Fashion & Apparel,Manchester,,,@ateliernorth,,",
].join("\n");

export default function AdminBusinesses() {
  const isMobile = useIsMobile(768);
  const [tab, setTab] = useState<OpsTab>("curated");
  const [showWarehouse, setShowWarehouse] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [sendInviteEmails, setSendInviteEmails] = useState(true);
  const [parseIssues, setParseIssues] = useState<ParseIssue[]>([]);
  const [parsedRows, setParsedRows] = useState<ImportRow[]>([]);
  const [result, setResult] = useState<{
    createdCount: number;
    skippedCount: number;
    created: { name: string; slug: string; contactEmail: string; inviteSent: boolean }[];
    skipped: { name: string; contactEmail: string; reason: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: pipeline, isLoading } = trpc.admin.opsPipeline.useQuery();
  const { data: warehouse, isLoading: warehouseLoading } = trpc.admin.listBusinesses.useQuery(
    { status: "active" },
    { enabled: showWarehouse },
  );

  const [inviteResult, setInviteResult] = useState<{
    sentCount: number;
    failedCount: number;
    skippedCount?: number;
    remaining: number;
  } | null>(null);
  const [invitePreview, setInvitePreview] = useState<{
    name: string;
    contactEmail: string;
    emailSubject: string;
    signInAs: string;
    profileUrl: string;
  }[] | null>(null);

  const sendInvites = trpc.admin.sendClaimInvites.useMutation({
    onSuccess: (data) => {
      if (data.dryRun) {
        setInvitePreview(data.preview);
        return;
      }
      setInvitePreview(null);
      setInviteResult({
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        skippedCount: data.skippedCount,
        remaining: data.remaining,
      });
      utils.admin.opsPipeline.invalidate();
      utils.admin.stats.invalidate();
      utils.admin.claimInviteStats.invalidate();
      utils.admin.listBusinesses.invalidate();
    },
  });

  const [followUpResult, setFollowUpResult] = useState<{ sentCount: number; failedCount: number } | null>(null);
  const sendFollowUps = trpc.admin.sendClaimFollowUps.useMutation({
    onSuccess: (data) => {
      if (data.dryRun) return;
      setFollowUpResult({ sentCount: data.sentCount, failedCount: data.failedCount });
      utils.admin.opsPipeline.invalidate();
      utils.admin.stats.invalidate();
      utils.admin.claimInviteStats.invalidate();
    },
  });

  const [thankYouResult, setThankYouResult] = useState<{ sentCount: number; failedCount: number } | null>(null);
  const sendThankYous = trpc.admin.sendClaimThankYous.useMutation({
    onSuccess: (data) => {
      if (data.dryRun) return;
      setThankYouResult({ sentCount: data.sentCount, failedCount: data.failedCount });
      utils.admin.opsPipeline.invalidate();
      utils.admin.claimedBusinesses.invalidate();
    },
  });

  const importBiz = trpc.admin.importBusinesses.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.admin.opsPipeline.invalidate();
      utils.admin.listBusinesses.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const setStatus = trpc.admin.setBusinessStatus.useMutation({
    onSuccess: () => {
      utils.admin.listBusinesses.invalidate();
      utils.admin.opsPipeline.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const counts = pipeline?.counts;
  const TABS: { key: OpsTab; label: string; count?: number; hint: string }[] = [
    {
      key: "curated",
      label: "Curated board",
      count: counts?.curatedNotInvited,
      hint: `${counts?.curatedTotal ?? "—"} on landing map · still to approach`,
    },
    {
      key: "invite_sent",
      label: "Claim campaign · invited",
      count: counts?.inviteSent,
      hint: "Warehouse claim emails — not the curated 221",
    },
    {
      key: "claimed",
      label: "Claim campaign · members",
      count: counts?.claimed,
      hint: "Signed up from the invite campaign",
    },
  ];

  function handleParse(text: string) {
    setCsvText(text);
    setResult(null);
    const { rows, issues } = parseBusinessCsv(text);
    setParsedRows(rows);
    setParseIssues(issues);
  }

  function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => handleParse(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function runImport() {
    if (!parsedRows.length || parseIssues.length) return;
    importBiz.mutate({ rows: parsedRows, sendInviteEmails });
  }

  const invitablesOnCurated = (pipeline?.curatedNotInvited ?? []).filter((r) => r.businessId && r.contactEmail);
  const unthanked = (pipeline?.claimed ?? []).filter((b) => !b.thankYouSentAt);

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, margin: 0 }}>
              Onboarding pipeline
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, margin: "8px 0 0", maxWidth: 580, lineHeight: 1.5 }}>
              Two separate tracks: the curated landing board (approach list), and the claim campaign (warehouse invites → members). Account login rows live under Accounts — not here.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowImport((v) => !v)}
              style={ghostBtn(showImport)}
            >
              {showImport ? "CLOSE IMPORT" : "IMPORT LIST"}
            </button>
            <button
              type="button"
              onClick={() => setShowWarehouse((v) => !v)}
              style={ghostBtn(showWarehouse)}
            >
              {showWarehouse ? "HIDE WAREHOUSE" : "WAREHOUSE"}
            </button>
          </div>
        </div>

        {/* Pipeline counts */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 1,
          background: BORDER,
          marginBottom: 24,
        }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              style={{
                background: tab === t.key ? MUTED : BG,
                border: "none",
                textAlign: "left",
                padding: isMobile ? "18px 16px" : "22px 20px",
                cursor: "pointer",
                borderBottom: tab === t.key ? `2px solid ${FG}` : "2px solid transparent",
              }}
            >
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: t.key === "curated" && (t.count ?? 0) > 0 ? V : FG,
                marginBottom: 6,
              }}>
                {t.count ?? "—"}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, fontWeight: 500 }}>
                {t.label}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 4, lineHeight: 1.4 }}>
                {t.hint}
              </div>
            </button>
          ))}
        </div>

        {/* Actions for the active tab */}
        <div style={{
          border: `1px solid ${BORDER}`,
          padding: isMobile ? 14 : 18,
          marginBottom: 24,
          background: MUTED,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, lineHeight: 1.45 }}>
            {tab === "curated" && (
              <>
                {counts ? `${counts.curatedTotal} shops on the curated landing map · ${counts.curatedNotInvited} still to approach` : "Loading…"}
                {invitablesOnCurated.length > 0 && (
                  <span style={{ color: FG }}> · {invitablesOnCurated.length} already have a claim-system profile + email</span>
                )}
              </>
            )}
            {tab === "invite_sent" && (
              <>
                {counts ? `${counts.inviteSent} warehouse invites still awaiting claim` : "Loading…"}
                {(counts?.followUpDue ?? 0) > 0 && (
                  <span style={{ color: V }}> · {counts!.followUpDue} follow-up due</span>
                )}
              </>
            )}
            {tab === "claimed" && (
              <>
                {counts ? `${counts.claimed} members from the claim campaign` : "Loading…"}
                {unthanked.length > 0 && (
                  <span style={{ color: FG }}> · {unthanked.length} still need a thank-you</span>
                )}
              </>
            )}
            {inviteResult && (
              <div style={{ color: inviteResult.failedCount ? V : "#15803D", marginTop: 4 }}>
                Sent {inviteResult.sentCount}
                {inviteResult.skippedCount ? ` · ${inviteResult.skippedCount} skipped` : ""}
                {inviteResult.failedCount ? ` · ${inviteResult.failedCount} failed` : ""}
                {" "}· {inviteResult.remaining} remaining
              </div>
            )}
            {followUpResult && (
              <div style={{ color: followUpResult.failedCount ? V : "#15803D", marginTop: 4 }}>
                Follow-ups sent {followUpResult.sentCount}
                {followUpResult.failedCount ? ` · ${followUpResult.failedCount} failed` : ""}
              </div>
            )}
            {thankYouResult && (
              <div style={{ color: thankYouResult.failedCount ? V : "#15803D", marginTop: 4 }}>
                Thank-yous sent {thankYouResult.sentCount}
                {thankYouResult.failedCount ? ` · ${thankYouResult.failedCount} failed` : ""}
              </div>
            )}
            {(sendInvites.isError || sendFollowUps.isError || sendThankYous.isError) && (
              <div style={{ color: V, marginTop: 4 }}>
                {sendInvites.error?.message || sendFollowUps.error?.message || sendThankYous.error?.message}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {tab === "curated" && (
              <>
                <button type="button" onClick={() => sendInvites.mutate({ limit: 5, dryRun: true })} style={ghostBtn()} disabled={sendInvites.isPending}>
                  PREVIEW NEXT 5
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Send the next 50 claim invites to REAL businesses now?")) {
                      sendInvites.mutate({ limit: 50 });
                    }
                  }}
                  style={primaryBtn()}
                  disabled={sendInvites.isPending}
                >
                  {sendInvites.isPending ? "SENDING…" : "SEND NEXT 50 INVITES"}
                </button>
              </>
            )}
            {tab === "invite_sent" && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Send follow-up emails to the next 50 businesses whose claim link expired?")) {
                    sendFollowUps.mutate({ limit: 50 });
                  }
                }}
                style={accentBtn()}
                disabled={sendFollowUps.isPending || !(counts?.followUpDue)}
              >
                {sendFollowUps.isPending ? "SENDING…" : `SEND FOLLOW-UPS${counts?.followUpDue ? ` (${counts.followUpDue})` : ""}`}
              </button>
            )}
            {tab === "claimed" && (
              <button
                type="button"
                onClick={() => {
                  if (unthanked.length === 0) {
                    window.alert("All claimed businesses have already been sent a thank-you.");
                    return;
                  }
                  if (window.confirm(`Send thank-you emails to ${unthanked.length} claimed business${unthanked.length === 1 ? "" : "es"}?`)) {
                    sendThankYous.mutate({ businessIds: unthanked.map((b) => b.id) });
                  }
                }}
                style={primaryBtn()}
                disabled={sendThankYous.isPending || unthanked.length === 0}
              >
                {sendThankYous.isPending ? "SENDING…" : "SEND ALL THANK-YOUS"}
              </button>
            )}
          </div>
        </div>

        {invitePreview && invitePreview.length > 0 && (
          <div style={{ border: `1px solid ${BORDER}`, padding: 16, marginBottom: 24, background: BG }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.12em", marginBottom: 10 }}>
              PREVIEW (not sent)
            </div>
            {invitePreview.map((p) => (
              <div key={p.contactEmail + p.name} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, marginBottom: 10, lineHeight: 1.45 }}>
                <div><strong>{p.name}</strong></div>
                <div style={{ color: MUTED_FG }}>To: {p.contactEmail}</div>
                <div style={{ color: MUTED_FG }}>Subject: {p.emailSubject}</div>
              </div>
            ))}
          </div>
        )}

        {showImport && (
          <ImportPanel
            isMobile={isMobile}
            csvText={csvText}
            sendInviteEmails={sendInviteEmails}
            parseIssues={parseIssues}
            parsedRows={parsedRows}
            result={result}
            fileRef={fileRef}
            importPending={importBiz.isPending}
            importError={importBiz.isError ? importBiz.error.message : null}
            onToggleEmails={setSendInviteEmails}
            onParse={handleParse}
            onFile={onFile}
            onRun={runImport}
          />
        )}

        {isLoading ? (
          <LoadingState />
        ) : tab === "curated" ? (
          <CuratedList rows={pipeline?.curatedNotInvited ?? []} isMobile={isMobile} />
        ) : tab === "invite_sent" ? (
          <InviteSentList rows={pipeline?.inviteSent ?? []} isMobile={isMobile} />
        ) : (
          <ClaimedList
            rows={pipeline?.claimed ?? []}
            isMobile={isMobile}
            sending={sendThankYous.isPending}
            onThank={(id, name, email) => {
              if (window.confirm(`Send a thank-you email to ${name} (${email})?`)) {
                sendThankYous.mutate({ businessIds: [id] });
              }
            }}
          />
        )}

        {showWarehouse && (
          <div style={{ marginTop: 40 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 12 }}>
              WAREHOUSE · FULL DIRECTORY
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16, maxWidth: 560 }}>
              Bulk-imported / scraped profiles. Not the curated landing map. Use for suspend/list housekeeping only.
            </p>
            {warehouseLoading ? (
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
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function CuratedList({
  rows,
  isMobile,
}: {
  rows: {
    placeId: string;
    name: string;
    postcode: string | null;
    address: string | null;
    district: string | null;
    track: string | null;
    type: string | null;
    businessId: string | null;
    slug: string | null;
    contactEmail: string | null;
    inClaimSystem: boolean;
  }[];
  isMobile: boolean;
}) {
  if (!rows.length) return <EmptyState label="Every curated map shop already has a claim-system invite or is claimed." />;
  return (
    <div style={{ border: `1px solid ${BORDER}` }}>
      <div style={listHeaderStyle}>{rows.length} CURATED · STILL TO APPROACH</div>
      {rows.map((r, i) => (
        <div
          key={r.placeId}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 160px 140px",
            gap: isMobile ? 6 : 16,
            alignItems: "center",
            padding: isMobile ? "14px 16px" : "14px 20px",
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, fontWeight: 500 }}>
              {r.name}
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
              {[r.district || r.postcode, r.type, r.track].filter(Boolean).join(" · ") || "—"}
            </div>
            {r.address && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
                {r.address}
              </div>
            )}
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
            {r.contactEmail || "no email in claim system"}
          </div>
          <div>
            {r.inClaimSystem && r.slug ? (
              <a href={`/business/${r.slug}`} style={linkStyle}>VIEW PROFILE</a>
            ) : (
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.08em" }}>
                MAP ONLY
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InviteSentList({
  rows,
  isMobile,
}: {
  rows: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    contactEmail: string;
    claimInviteSentAt: Date | string | null;
    followUpDue: boolean;
  }[];
  isMobile: boolean;
}) {
  if (!rows.length) return <EmptyState label="No outstanding claim-campaign invites." />;
  return (
    <div style={{ border: `1px solid ${BORDER}` }}>
      <div style={listHeaderStyle}>{rows.length} CLAIM CAMPAIGN · INVITED</div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 180px 120px 100px",
            gap: isMobile ? 6 : 16,
            alignItems: "center",
            padding: isMobile ? "14px 16px" : "14px 20px",
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
              {r.city ?? "—"} · {r.contactEmail}
            </div>
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
            invited {r.claimInviteSentAt ? format(new Date(r.claimInviteSentAt), "d MMM yyyy") : "—"}
          </div>
          <div>
            {r.followUpDue ? (
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.08em" }}>FOLLOW-UP DUE</span>
            ) : (
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.08em" }}>WAITING</span>
            )}
          </div>
          <a href={`/business/${r.slug}`} style={linkStyle}>VIEW PROFILE</a>
        </div>
      ))}
    </div>
  );
}

function ClaimedList({
  rows,
  isMobile,
  sending,
  onThank,
}: {
  rows: {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    ownerEmail: string;
    thankYouSentAt: Date | string | null;
    ownerCreatedAt: Date | string | null;
  }[];
  isMobile: boolean;
  sending: boolean;
  onThank: (id: string, name: string, email: string) => void;
}) {
  if (!rows.length) return <EmptyState label="No claim-campaign members yet." />;
  return (
    <div style={{ border: `1px solid ${BORDER}` }}>
      <div style={listHeaderStyle}>{rows.length} CLAIM CAMPAIGN · MEMBERS</div>
      {rows.map((r, i) => (
        <div
          key={r.id}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: isMobile ? "14px 16px" : "14px 20px",
            borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : "none",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG, fontWeight: 500 }}>{r.name}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG, marginTop: 2 }}>
              {r.city ?? "—"} · {r.ownerEmail}
              {r.ownerCreatedAt ? ` · account ${format(new Date(r.ownerCreatedAt), "d MMM yyyy")}` : ""}
            </div>
            <div style={{ marginTop: 4 }}>
              <a href={`/business/${r.slug}`} style={linkStyle}>VIEW PROFILE</a>
            </div>
          </div>
          {r.thankYouSentAt ? (
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#15803D", letterSpacing: "0.1em" }}>
              ✓ THANKED {format(new Date(r.thankYouSentAt), "d MMM")}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onThank(r.id, r.name, r.ownerEmail)}
              disabled={sending}
              style={ghostBtn()}
            >
              SEND THANK-YOU
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function ImportPanel(props: {
  isMobile: boolean;
  csvText: string;
  sendInviteEmails: boolean;
  parseIssues: ParseIssue[];
  parsedRows: ImportRow[];
  result: {
    createdCount: number;
    skippedCount: number;
    created: { name: string; slug: string; contactEmail: string; inviteSent: boolean }[];
    skipped: { name: string; contactEmail: string; reason: string }[];
  } | null;
  fileRef: RefObject<HTMLInputElement | null>;
  importPending: boolean;
  importError: string | null;
  onToggleEmails: (v: boolean) => void;
  onParse: (text: string) => void;
  onFile: (file: File | undefined) => void;
  onRun: () => void;
}) {
  const {
    isMobile, csvText, sendInviteEmails, parseIssues, parsedRows, result,
    fileRef, importPending, importError, onToggleEmails, onParse, onFile, onRun,
  } = props;

  return (
    <div style={{ border: `1px solid ${BORDER}`, padding: isMobile ? 16 : 24, marginBottom: 32, background: MUTED }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 8 }}>
        BULK IMPORT
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6, marginBottom: 16, maxWidth: 640 }}>
        Upload or paste a CSV to create active profiles. With an email, owners can get a claim link.
        Without an email, profiles are seeded as unclaimed. Max 500 rows.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={ghostBtn()}>CHOOSE CSV FILE</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: "none" }} onChange={(e) => onFile(e.target.files?.[0])} />
        <button type="button" onClick={() => onParse(SAMPLE_CSV)} style={ghostBtn()}>LOAD SAMPLE</button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, cursor: "pointer" }}>
          <input type="checkbox" checked={sendInviteEmails} onChange={(e) => onToggleEmails(e.target.checked)} />
          Send claim emails
        </label>
      </div>
      <textarea
        value={csvText}
        onChange={(e) => onParse(e.target.value)}
        placeholder={SAMPLE_CSV}
        rows={8}
        style={{
          width: "100%", boxSizing: "border-box",
          fontFamily: "'Space Mono', monospace", fontSize: 11, lineHeight: 1.5,
          padding: 12, border: `1px solid ${BORDER}`, background: BG, color: FG,
          resize: "vertical", marginBottom: 16,
        }}
      />
      {parseIssues.length > 0 && (
        <div style={{ marginBottom: 16, border: `1px solid ${V}`, padding: 12, background: BG }}>
          {parseIssues.slice(0, 12).map((issue, i) => (
            <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, marginBottom: 4 }}>
              Line {issue.line}: {issue.message}
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onRun}
        disabled={!parsedRows.length || parseIssues.length > 0 || importPending}
        style={primaryBtn(!parsedRows.length || parseIssues.length > 0)}
      >
        {importPending ? "IMPORTING…" : `CREATE ${parsedRows.length || ""} PROFILES`}
      </button>
      {importError && (
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginTop: 12 }}>{importError}</p>
      )}
      {result && (
        <div style={{ marginTop: 20, border: `1px solid ${BORDER}`, padding: 16, background: BG }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.1em", color: FG, marginBottom: 12 }}>
            DONE · {result.createdCount} CREATED · {result.skippedCount} SKIPPED
          </div>
          {result.created.map((c, i) => (
            <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, marginBottom: 4 }}>
              ✓ {c.name}{" "}
              <a href={`/business/${c.slug}`} style={{ color: MUTED_FG }}>/business/{c.slug}</a>
              {c.inviteSent ? " · claim email sent" : " · invite not sent"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const listHeaderStyle: CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 9,
  color: MUTED_FG,
  letterSpacing: "0.1em",
  padding: "10px 20px",
  borderBottom: `1px solid ${BORDER}`,
  background: MUTED,
};

const linkStyle: CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 10,
  color: MUTED_FG,
  letterSpacing: "0.08em",
  textDecoration: "none",
};

function ghostBtn(active = false): CSSProperties {
  return {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    padding: "10px 14px",
    background: active ? FG : BG,
    color: active ? BG : FG,
    border: `1px solid ${FG}`,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function primaryBtn(disabled = false): CSSProperties {
  return {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    padding: "10px 14px",
    background: disabled ? BORDER : FG,
    color: BG,
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
  };
}

function accentBtn(): CSSProperties {
  return {
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.1em",
    padding: "10px 14px",
    background: V,
    color: BG,
    border: "none",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function parseBusinessCsv(text: string): { rows: ImportRow[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const rows: ImportRow[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (!lines.length) return { rows, issues };

  const headerCells = splitCsvLine(lines[0]).map((h) => h.trim());
  const headerMap = new Map(headerCells.map((h, i) => [normalizeHeader(h), i]));

  for (const required of ["name", "category", "city"]) {
    if (!headerMap.has(required)) {
      issues.push({ line: 1, message: `Missing required column "${required}"` });
    }
  }
  if (issues.length) return { rows, issues };

  if (lines.length - 1 > 500) {
    issues.push({ line: 1, message: "Too many rows (max 500)" });
    return { rows, issues };
  }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const get = (key: string) => {
      const idx = headerMap.get(key);
      if (idx === undefined) return "";
      return (cells[idx] ?? "").trim();
    };

    const name = get("name");
    const contactEmail = get("contactemail");
    const categoryRaw = get("category");
    const city = get("city");
    const line = i + 1;

    if (!name && !contactEmail && !categoryRaw && !city) continue;
    if (!name) { issues.push({ line, message: "name is required" }); continue; }
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      issues.push({ line, message: `invalid contactEmail "${contactEmail}"` });
      continue;
    }
    if (!(CATEGORIES as readonly string[]).includes(categoryRaw)) {
      issues.push({
        line,
        message: `invalid category "${categoryRaw}" (must be one of: ${CATEGORIES.join("; ")})`,
      });
      continue;
    }
    if (!city) { issues.push({ line, message: "city is required" }); continue; }

    const row: ImportRow = {
      name,
      category: categoryRaw as ImportRow["category"],
      city,
    };
    if (contactEmail) row.contactEmail = contactEmail;
    const address = get("address");
    const postcode = get("postcode");
    const instagramHandle = get("instagramhandle") || get("instagram");
    const website = get("website");
    const description = get("description");
    if (address) row.address = address;
    if (postcode) row.postcode = postcode;
    if (instagramHandle) row.instagramHandle = instagramHandle;
    if (website) row.website = website;
    if (description) row.description = description;
    rows.push(row);
  }

  return { rows, issues };
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[\s_-]+/g, "");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
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
