import { trpc } from "../trpc";

const V = "rgb(232, 52, 28)";

export default function BusinessSignIn() {
  const { data: urlData } = trpc.auth.getLoginUrl.useQuery({ returnPath: "/dashboard" });

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left */}
      <div style={{ background: "#020202", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#FCFCFC", textDecoration: "none" }}>
          Unwrapped
        </a>
        <div>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: V, letterSpacing: 2, textTransform: "uppercase", marginBottom: 24 }}>
            Business Portal
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(36px, 4vw, 56px)", fontWeight: 700, color: "#FCFCFC", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 24 }}>
            Create a drop.<br />
            <em style={{ color: V, fontStyle: "italic" }}>In 2 minutes.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", lineHeight: 1.65 }}>
            Manage your drops, scan QR codes at check-in, and track your payouts — all from one dashboard.
          </p>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[["85%", "You keep"], ["0", "Monthly fees"], ["2 min", "To publish"]].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: "#FCFCFC" }}>{val}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 48, background: "#FCFCFC" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#020202" }}>
            Business sign in
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 40, lineHeight: 1.5 }}>
            Access your business dashboard using your Manus account linked to your Unwrapped business.
          </p>

          <a
            href={urlData?.url ?? "#"}
            style={{
              display: "block",
              width: "100%",
              background: "#020202",
              color: "#FCFCFC",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 500,
              textAlign: "center",
              padding: "16px 0",
              textDecoration: "none",
              marginBottom: 24,
              cursor: urlData ? "pointer" : "not-allowed",
            }}
          >
            Sign in with Manus →
          </a>

          <div style={{ background: "#F4F4F4", padding: 16, marginBottom: 24 }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666", lineHeight: 1.6 }}>
              <strong style={{ color: "#020202" }}>Not approved yet?</strong> Your Manus account must be linked to an approved Unwrapped business to access the dashboard.{" "}
              <a href="/business-apply" style={{ color: V, textDecoration: "none" }}>Apply to join →</a>
            </p>
          </div>

          <div style={{ paddingTop: 24, borderTop: "1px solid #E2E2E2", textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#ABABAB" }}>
              Looking for drops?{" "}
              <a href="/signin" style={{ color: "#020202", textDecoration: "none", fontWeight: 500 }}>
                Consumer sign in →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
