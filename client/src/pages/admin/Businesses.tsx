import { useRef, useState } from "react";
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

const CATEGORIES = [
  "Fashion & Apparel", "Food & Drink", "Beauty & Wellness", "Home & Living",
  "Art & Culture", "Books & Music", "Sports & Outdoor", "Tech & Gadgets",
  "Kids & Family", "Services & Experiences",
] as const;

type StatusFilter = "active" | "pending" | "suspended" | "all";

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
  const [filter, setFilter] = useState<StatusFilter>("all");
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
  const importBiz = trpc.admin.importBusinesses.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.admin.listBusinesses.invalidate();
      utils.admin.stats.invalidate();
    },
  });

  const { data: claimStats } = trpc.admin.claimInviteStats.useQuery();
  const [inviteResult, setInviteResult] = useState<{
    sentCount: number;
    failedCount: number;
    remaining: number;
  } | null>(null);
  const sendInvites = trpc.admin.sendClaimInvites.useMutation({
    onSuccess: (data) => {
      setInviteResult({
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        remaining: data.remaining,
      });
      utils.admin.claimInviteStats.invalidate();
    },
  });

  const FILTERS: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending", label: "Pending" },
    { key: "suspended", label: "Suspended" },
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

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "40px 48px" }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          marginBottom: 32,
        }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, margin: 0 }}>
            Businesses
          </h1>
          <button
            onClick={() => setShowImport(v => !v)}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
              padding: "12px 18px", background: showImport ? BG : FG, color: showImport ? FG : BG,
              border: `1px solid ${FG}`, cursor: "pointer",
            }}
          >
            {showImport ? "CLOSE IMPORT" : "IMPORT LIST"}
          </button>
        </div>

        <div style={{
          border: `1px solid ${BORDER}`, padding: isMobile ? 16 : 20, marginBottom: 32, background: MUTED,
          display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, justifyContent: "space-between",
        }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 6 }}>
              CLAIM INVITES
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>
              {claimStats
                ? `${claimStats.pending} unclaimed profile${claimStats.pending === 1 ? "" : "s"} awaiting an invite · ${claimStats.invited} already sent`
                : "Loading…"}
            </div>
            {inviteResult && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: inviteResult.failedCount ? V : "#15803D", marginTop: 6 }}>
                Sent {inviteResult.sentCount}
                {inviteResult.failedCount ? ` · ${inviteResult.failedCount} failed` : ""}
                {" "}· {inviteResult.remaining} remaining
              </div>
            )}
            {sendInvites.isError && (
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginTop: 6 }}>
                {sendInvites.error.message}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Send the next 50 claim invites now?")) {
                sendInvites.mutate({ limit: 50 });
              }
            }}
            disabled={sendInvites.isPending || !claimStats?.pending}
            style={{
              fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
              padding: "12px 18px",
              background: (sendInvites.isPending || !claimStats?.pending) ? BORDER : FG,
              color: BG, border: "none",
              cursor: (sendInvites.isPending || !claimStats?.pending) ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {sendInvites.isPending ? "SENDING…" : "SEND NEXT 50 INVITES"}
          </button>
        </div>

        {showImport && (
          <div style={{ border: `1px solid ${BORDER}`, padding: isMobile ? 16 : 24, marginBottom: 32, background: MUTED }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.15em", marginBottom: 8 }}>
              BULK IMPORT
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, lineHeight: 1.6, marginBottom: 16, maxWidth: 640 }}>
              Upload or paste a CSV to create active profiles. With an email, owners get a claim link
              (skipped if they already have a password). Without an email, profiles are seeded as unclaimed. Max 500 rows.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 16 }}>
              Required columns: <code style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>name, category, city</code>
              {" "}· Optional: contactEmail, address, postcode, instagramHandle, website, description
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
                  padding: "10px 14px", background: BG, border: `1px solid ${BORDER}`, color: FG, cursor: "pointer",
                }}
              >
                CHOOSE CSV FILE
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv,text/plain"
                style={{ display: "none" }}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => handleParse(SAMPLE_CSV)}
                style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.08em",
                  padding: "10px 14px", background: BG, border: `1px solid ${BORDER}`, color: MUTED_FG, cursor: "pointer",
                }}
              >
                LOAD SAMPLE
              </button>
              <label style={{
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, cursor: "pointer",
              }}>
                <input
                  type="checkbox"
                  checked={sendInviteEmails}
                  onChange={(e) => setSendInviteEmails(e.target.checked)}
                />
                Send claim emails
              </label>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => handleParse(e.target.value)}
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
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: V, letterSpacing: "0.1em", marginBottom: 8 }}>
                  FIX THESE ROWS ({parseIssues.length})
                </div>
                {parseIssues.slice(0, 12).map((issue, i) => (
                  <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG, marginBottom: 4 }}>
                    Line {issue.line}: {issue.message}
                  </div>
                ))}
                {parseIssues.length > 12 && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                    …and {parseIssues.length - 12} more
                  </div>
                )}
              </div>
            )}

            {parsedRows.length > 0 && parseIssues.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", marginBottom: 8 }}>
                  PREVIEW · {parsedRows.length} READY
                </div>
                <div style={{ border: `1px solid ${BORDER}`, background: BG, maxHeight: 220, overflowY: "auto" }}>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "10px 14px",
                        borderBottom: i < Math.min(parsedRows.length, 50) - 1 ? `1px solid ${BORDER}` : "none",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: FG,
                      }}
                    >
                      <strong>{row.name}</strong>
                      <span style={{ color: MUTED_FG }}> · {row.contactEmail || "no email"} · {row.category} · {row.city}</span>
                    </div>
                  ))}
                  {parsedRows.length > 50 && (
                    <div style={{ padding: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: MUTED_FG }}>
                      …and {parsedRows.length - 50} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={runImport}
              disabled={!parsedRows.length || parseIssues.length > 0 || importBiz.isPending}
              style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.1em",
                padding: "12px 20px",
                background: (!parsedRows.length || parseIssues.length > 0) ? BORDER : FG,
                color: BG, border: "none",
                cursor: (!parsedRows.length || parseIssues.length > 0 || importBiz.isPending) ? "not-allowed" : "pointer",
              }}
            >
              {importBiz.isPending ? "IMPORTING…" : `CREATE ${parsedRows.length || ""} PROFILES`}
            </button>

            {importBiz.isError && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginTop: 12 }}>
                {importBiz.error.message}
              </p>
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
                    {c.inviteSent ? " · claim email sent" : " · no email"}
                  </div>
                ))}
                {result.skipped.map((s, i) => (
                  <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG, marginBottom: 4 }}>
                    — {s.name} ({s.contactEmail}): {s.reason}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

function parseBusinessCsv(text: string): { rows: ImportRow[]; issues: ParseIssue[] } {
  const issues: ParseIssue[] = [];
  const rows: ImportRow[] = [];
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { rows, issues };

  const headerCells = splitCsvLine(lines[0]).map(h => h.trim());
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

/** Minimal CSV splitter that respects double-quoted fields. */
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
