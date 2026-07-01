import { useEffect } from "react";
import { trpc } from "../trpc";

const V = "rgb(232, 52, 28)";

export default function SignIn() {
  const { data: urlData } = trpc.auth.getLoginUrl.useQuery({ returnPath: "/home" });

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      {/* Left — editorial */}
      <div style={{ background: "#020202", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 48 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#FCFCFC", textDecoration: "none" }}>
          Unwrapped
        </a>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(40px, 5vw, 64px)", fontWeight: 700, color: "#FCFCFC", lineHeight: 1.05, letterSpacing: "-1.5px", marginBottom: 24 }}>
            The best things<br />
            <em style={{ color: V, fontStyle: "italic" }}>don't last long.</em>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#888", lineHeight: 1.65, maxWidth: 360 }}>
            Reserve local drops from independent shops, cafés, and studios near you. Your ticket, your QR code, your pick-up.
          </p>
        </div>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#444", letterSpacing: 1.5 }}>
          UNWRAPPED.SHOP
        </p>
      </div>

      {/* Right — sign in */}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 48, background: "#FCFCFC" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#020202" }}>
            Create account
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 40, lineHeight: 1.5 }}>
            Sign up or sign in with your Manus account. It takes 10 seconds.
          </p>

          <a
            href={urlData?.url ?? "#"}
            style={{
              display: "block",
              width: "100%",
              background: V,
              color: "#FCFCFC",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 500,
              textAlign: "center",
              padding: "16px 0",
              textDecoration: "none",
              marginBottom: 24,
              cursor: urlData ? "pointer" : "not-allowed",
              opacity: urlData ? 1 : 0.5,
            }}
          >
            Continue with Manus →
          </a>

          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#ABABAB", textAlign: "center", lineHeight: 1.6 }}>
            By continuing you agree to our terms. New to Manus?{" "}
            <a href="https://manus.im" target="_blank" rel="noopener" style={{ color: "#020202" }}>
              Create a free account
            </a>{" "}
            first.
          </p>

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #E2E2E2", textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#ABABAB" }}>
              Are you a business?{" "}
              <a href="/business/signin" style={{ color: V, textDecoration: "none", fontWeight: 500 }}>
                Business sign in →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
