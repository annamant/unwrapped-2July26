import { useState } from "react";
import { trpc, setSessionToken } from "../trpc";
import useIsMobile from "../hooks/useIsMobile";

const V = "rgb(232, 52, 28)";

export default function SignIn() {
  const isMobile = useIsMobile(900);
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
        const result = await login.mutateAsync({ email, password, portal: "shopper" });
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
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr" }}>
      <div style={{ background: "#020202", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: isMobile ? 24 : 48, gap: isMobile ? 20 : 0 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#FCFCFC", textDecoration: "none" }}>
          Unwrapped
        </a>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? 30 : "clamp(40px, 5vw, 64px)", fontWeight: 700, color: "#FCFCFC", lineHeight: 1.05, letterSpacing: "-1.5px", marginBottom: isMobile ? 12 : 24 }}>
            The best things<br />
            <em style={{ color: V, fontStyle: "italic" }}>don't last long.</em>
          </h1>
          {!isMobile && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: "#888", lineHeight: 1.65, maxWidth: 360 }}>
              Reserve local drops from independent shops, cafés, and studios near you. Your ticket, your QR code, your pick-up.
            </p>
          )}
        </div>
        {!isMobile && (
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#444", letterSpacing: 1.5 }}>
            SHOPUNWRAPPED.COM
          </p>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: isMobile ? "32px 20px" : 48, background: "#FCFCFC" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, marginBottom: 8, color: "#020202" }}>
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 32, lineHeight: 1.5 }}>
            {mode === "login" ? "Welcome back." : "Join Unwrapped in seconds."}
          </p>

          <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "2px solid #E2E2E2" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: mode === m ? `2px solid ${V}` : "2px solid transparent", marginBottom: -2, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: mode === m ? 600 : 400, color: mode === m ? "#020202" : "#888", cursor: "pointer" }}>
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
              style={{ display: "block", width: "100%", background: loading ? "#888" : V, color: "#FCFCFC", fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, textAlign: "center", padding: "16px 0", border: "none", marginTop: 20, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Please wait…" : mode === "login" ? "Sign in →" : "Create account →"}
            </button>
          </form>

          {mode === "login" && (
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 16, textAlign: "center" }}>
              <a href="/reset-password" style={{ color: "#888", textDecoration: "none" }}>Forgot your password?</a>
            </p>
          )}

          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid #E2E2E2", textAlign: "center" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#ABABAB" }}>
              Are you a business?{" "}
              <a href="/business/signin" style={{ color: V, textDecoration: "none", fontWeight: 500 }}>Business sign in →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
