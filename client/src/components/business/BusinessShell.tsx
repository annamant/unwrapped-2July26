import { useLocation } from "wouter";
import { trpc } from "../../trpc";
import useIsMobile from "../../hooks/useIsMobile";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED = "#F5F4F0";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

const NAV = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/drops", label: "Drops", exact: false },
  { href: "/dashboard/drops/new", label: "New drop", exact: true },
  { href: "/dashboard/scanner", label: "Scanner", exact: true },
  { href: "/dashboard/settings", label: "Settings", exact: true },
];

function navActive(location: string, href: string, exact: boolean) {
  return exact ? location === href : location === href || location.startsWith(`${href}/`);
}

export default function BusinessShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(768);
  const [location] = useLocation();
  const signOut = trpc.auth.signOut.useMutation({ onSuccess: () => { window.location.href = "/"; } });

  const navLinks = (compact: boolean) => NAV.map(n => {
    const active = navActive(location, n.href, n.exact);
    return (
      <a
        key={n.href}
        href={n.href}
        style={compact ? {
          padding: "12px 16px", whiteSpace: "nowrap",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          color: active ? FG : MUTED_FG,
          textDecoration: "none",
          borderBottom: active ? `2px solid ${FG}` : "2px solid transparent",
        } : {
          display: "block", padding: "11px 24px",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          color: active ? FG : MUTED_FG,
          textDecoration: "none",
          background: active ? MUTED : "transparent",
          borderLeft: active ? `2px solid ${FG}` : "2px solid transparent",
        }}
      >
        {n.label}
      </a>
    );
  });

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px", borderBottom: `1px solid ${BORDER}`,
        }}>
          <div>
            <a href="/dashboard" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: FG, textDecoration: "none" }}>
              Unwrapped
            </a>
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", marginLeft: 8 }}>
              BUSINESS
            </span>
          </div>
          <button
            onClick={() => signOut.mutate()}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG,
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            Sign out
          </button>
        </div>
        <nav style={{
          display: "flex", overflowX: "auto", scrollbarWidth: "none",
          borderBottom: `1px solid ${BORDER}`, background: BG,
          position: "sticky", top: 0, zIndex: 50,
        }}>
          {navLinks(true)}
        </nav>
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <a href="/home" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: V, textDecoration: "none" }}>
            Browse as shopper →
          </a>
        </div>
        <div style={{ flex: 1 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex" }}>
      <div style={{ width: 220, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 24px 0", borderBottom: `1px solid ${BORDER}`, paddingBottom: 20 }}>
          <a href="/dashboard" style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: FG, textDecoration: "none" }}>
            Unwrapped
          </a>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: MUTED_FG, letterSpacing: "0.1em", marginTop: 4 }}>
            BUSINESS
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {navLinks(false)}
        </nav>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 12 }}>
          <a
            href="/home"
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, textDecoration: "none" }}
          >
            Browse as shopper →
          </a>
          <button
            onClick={() => signOut.mutate()}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG,
              background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
            }}
          >
            Sign out
          </button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
    </div>
  );
}

export { BG, FG, BORDER, MUTED, MUTED_FG, V };
