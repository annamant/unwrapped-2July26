import { useLocation } from "wouter";
import { format } from "date-fns";
import { trpc } from "../trpc";

const BG = "#FAFAF8";
const FG = "#141210";
const BORDER = "#E0DFD9";
const MUTED_FG = "#7A7A7A";
const V = "#E8341C";

const linkBtn: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  textDecoration: "none",
  fontFamily: "'Space Mono', monospace",
  fontSize: 11,
  letterSpacing: "0.1em",
  padding: "16px 20px",
  border: `1px solid ${FG}`,
  color: FG,
  background: BG,
  cursor: "pointer",
  boxSizing: "border-box",
};

export default function Instagram() {
  const [, navigate] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: drops } = trpc.drops.list.useQuery({ limit: 20, timeWindow: undefined });

  const now = new Date();
  const liveDrops = drops?.filter(({ drop }) => {
    const start = new Date(drop.collectionStart);
    const end = new Date(drop.collectionEnd);
    return start <= now && end >= now && drop.availableQuantity > 0;
  }) ?? [];

  const browseHref = user ? "/home" : "/signin";

  return (
    <div style={{
      background: BG,
      color: FG,
      minHeight: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      padding: "48px 24px 64px",
    }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>

        {/* Logo mark */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
          <div style={{ position: "relative", width: 72, height: 72, background: FG }}>
            <span style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Playfair Display', serif", fontWeight: 700,
              fontSize: 44, color: BG, paddingTop: 6,
            }}>U</span>
            <span style={{
              position: "absolute", top: 10, right: 10,
              width: 10, height: 10, borderRadius: "50%", background: V,
            }} />
          </div>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 28,
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "-0.5px",
          marginBottom: 8,
        }}>
          Unwrapped
        </h1>

        <p style={{
          fontFamily: "'Playfair Display', serif",
          fontStyle: "italic",
          fontSize: 16,
          color: MUTED_FG,
          textAlign: "center",
          lineHeight: 1.5,
          marginBottom: 8,
        }}>
          Limited local drops from independent shops near you.
        </p>

        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: MUTED_FG,
          textAlign: "center",
          letterSpacing: "0.12em",
          marginBottom: 32,
        }}>
          LONDON · RESERVE IN SECONDS
        </p>

        {liveDrops.length > 0 && (
          <p style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: V,
            textAlign: "center",
            letterSpacing: "0.1em",
            marginBottom: 24,
          }}>
            ● {liveDrops.length} LIVE NOW
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          <a href={browseHref} style={{ ...linkBtn, background: FG, color: BG, border: `1px solid ${FG}` }}>
            BROWSE DROPS
          </a>
          <a href="/signin" style={linkBtn}>
            {user ? "MY ACCOUNT" : "SIGN UP · FREE"}
          </a>
          <a href="/business-apply" style={linkBtn}>
            LIST YOUR BUSINESS
          </a>
        </div>

        {liveDrops.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              color: MUTED_FG,
              letterSpacing: "0.15em",
              marginBottom: 12,
              paddingBottom: 12,
              borderBottom: `1px solid ${BORDER}`,
            }}>
              LIVE RIGHT NOW
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: BORDER, border: `1px solid ${BORDER}` }}>
              {liveDrops.slice(0, 5).map(({ drop, business, location }) => (
                <button
                  key={drop.id}
                  onClick={() => navigate(`/drop/${drop.id}`)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: BG,
                    border: "none",
                    padding: "16px 18px",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 17,
                    fontWeight: 600,
                    color: FG,
                    marginBottom: 4,
                  }}>
                    {drop.title}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: MUTED_FG }}>
                    {business.name}
                    {location?.city ? ` · ${location.city}` : ""}
                    {" · "}
                    until {format(new Date(drop.collectionEnd), "h:mma")}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 24,
          textAlign: "center",
        }}>
          <a
            href="mailto:anna@shopunwrapped.com"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: MUTED_FG,
              textDecoration: "none",
            }}
          >
            anna@shopunwrapped.com
          </a>
          <div style={{ marginTop: 12 }}>
            <a
              href="/"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: FG,
                letterSpacing: "0.08em",
                textDecoration: "none",
              }}
            >
              SHOPUNWRAPPED.COM →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
