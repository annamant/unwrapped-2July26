import { useMemo, useState, type CSSProperties } from "react";
import { trpc } from "../../trpc";
import { AdminLayout } from "./Dashboard";
import useIsMobile from "../../hooks/useIsMobile";
import { BG, FG, BORDER, MUTED_FG, V } from "../../theme";

type SortKey = "name" | "followers" | "requestedAtSignup";

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function AdminFollows() {
  const isMobile = useIsMobile(768);
  const { data, isLoading } = trpc.admin.followCounts.useQuery();
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    const list = [...(data ?? [])];
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return list;
  }, [data, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function exportCsv() {
    const header = ["name", "kind", "followers", "requested_at_signup", "slug", "pin_id", "business_id"];
    const lines = [
      header.join(","),
      ...rows.map((row) => [
        csvCell(row.name),
        row.kind,
        row.followers,
        row.requestedAtSignup,
        csvCell(row.slug ?? ""),
        csvCell(row.pinId ?? ""),
        csvCell(row.businessId ?? ""),
      ].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "unwrapped-follow-counts.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const th = (key: SortKey): CSSProperties => ({
    textAlign: key === "name" ? "left" : "right",
    fontFamily: "'Space Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.08em",
    padding: "10px 12px",
    cursor: "pointer",
    color: sortKey === key ? FG : MUTED_FG,
    borderBottom: `1px solid ${BORDER}`,
    whiteSpace: "nowrap",
  });

  return (
    <AdminLayout>
      <div style={{ padding: isMobile ? "24px 16px" : "32px 28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: "0.14em", color: V, marginBottom: 8 }}>
              INTERNAL
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: FG, margin: 0 }}>
              Followers
            </h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: MUTED_FG, marginTop: 8 }}>
              {isLoading ? "Loading shops…" : `${rows.length} shops, including curated pins.`}
            </p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!rows.length}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.1em",
              padding: "12px 16px",
              background: FG,
              color: BG,
              border: "none",
              cursor: rows.length ? "pointer" : "not-allowed",
            }}
          >
            EXPORT CSV
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          {([
            ["followers", "FOLLOWERS"],
            ["requestedAtSignup", "SIGNUP"],
            ["name", "NAME"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleSort(key)}
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                padding: "8px 10px",
                border: `1px solid ${BORDER}`,
                background: sortKey === key ? FG : BG,
                color: sortKey === key ? BG : MUTED_FG,
                cursor: "pointer",
              }}
            >
              {label}{sortKey === key ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
            </button>
          ))}
        </div>

        {isMobile ? (
          <div style={{ border: `1px solid ${BORDER}`, background: BG }}>
            {rows.map((row) => (
              <div key={row.key} style={{ padding: "14px 12px", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: FG, fontWeight: 600, marginBottom: 6 }}>
                  {row.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG }}>
                    {row.kind === "curated" ? "CURATED" : "LIVE"}
                  </span>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: FG }}>
                    {row.followers} followers · {row.requestedAtSignup} signup
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: "auto", border: `1px solid ${BORDER}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: BG, minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={th("name")} onClick={() => toggleSort("name")}>SHOP</th>
                  <th style={{ ...th("followers"), textAlign: "left" }}>KIND</th>
                  <th style={th("followers")} onClick={() => toggleSort("followers")}>FOLLOWERS</th>
                  <th style={th("requestedAtSignup")} onClick={() => toggleSort("requestedAtSignup")}>REQUESTED AT SIGNUP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.key}>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${BORDER}`, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: FG }}>
                      {row.name}
                    </td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${BORDER}`, fontFamily: "'Space Mono', monospace", fontSize: 10, color: MUTED_FG }}>
                      {row.kind === "curated" ? "CURATED" : "LIVE"}
                    </td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${BORDER}`, textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 13, color: FG }}>
                      {row.followers}
                    </td>
                    <td style={{ padding: "12px", borderBottom: `1px solid ${BORDER}`, textAlign: "right", fontFamily: "'Space Mono', monospace", fontSize: 13, color: FG }}>
                      {row.requestedAtSignup}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
