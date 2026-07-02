import { useState } from "react";
import { trpc, setSessionToken } from "../trpc";

const V = "rgb(232, 52, 28)";

export default function BusinessSignIn() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = trpc.auth.login.useMutation();
  const register = trpc.auth.register.useMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        const result = await login.mutateAsync({ email, password });
        setSessionToken(result.token);
        window.location.href = result.redirect;
      } else {
        const result = await register.mutateAsync({ email, password, name });
        setSessionToken(result.token);
        window.location.href = result.redirect;
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    border: "1px solid #E2E2E2",
    background: "#FAFAFA",
    color: "#020202",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 12,
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
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

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 48, background: "#FCFCFC" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#020202" }}>
            {mode === "login" ? "Business sign in" : "Create business account"}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.5 }}>
            {mode === "login" ? "Access your business dashboard." : "Create an account then apply to join."}
          </p>

          <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "2px solid #E2E2E2" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: mode === m ? `2px solid #020202` : "2px solid transparent", marginBottom: -2, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: mode === m ? 600 : 400, color: mode === m ? "#020202" : "#888", cursor: "pointer" }}>
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
            )}
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
            <input type="password" placeholder={mode === "register" ? "Password (min 8 characters)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...inputStyle, marginBottom: 0 }} />

            {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginTop: 12, marginBottom: 0 }}>{error}</p>}

            <button type="submit" disabled={loading}
              style={{ display: "block", width: "100%", background: loading ? "#888" : "#020202", color: "#FCFCFC", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, textAlign: "center", padding: "16px 0", border: "none", marginTop: 20, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          {mode === "register" && (
            <div style={{ background: "#F4F4F4", padding: 16, marginTop: 20 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#666", lineHeight: 1.6, margin: 0 }}>
                After creating your account you'll need to{" "}
                <a href="/business-apply" style={{ color: V, textDecoration: "none" }}>apply to join as a business →</a>
              </p>
            </div>
          )}

          <div style={{ paddingTop: 32, marginTop: 32, borderTop: "1px solid #E2E2E2", textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#ABABAB" }}>
              Looking for drops?{" "}
              <a href="/signin" style={{ color: "#020202", textDecoration: "none", fontWeight: 500 }}>Consumer sign in →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
