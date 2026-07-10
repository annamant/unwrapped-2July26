import { useState } from "react";
import { trpc } from "../trpc";

const V = "rgb(232, 52, 28)";
const BORDER = "#E2E2E2";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 15,
  border: `1px solid ${BORDER}`,
  background: "#FAFAFA",
  color: "#020202",
  outline: "none",
  boxSizing: "border-box",
  marginBottom: 12,
};

const buttonStyle = (loading: boolean): React.CSSProperties => ({
  display: "block",
  width: "100%",
  background: loading ? "#888" : "#020202",
  color: "#FCFCFC",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 16,
  fontWeight: 500,
  textAlign: "center",
  padding: "16px 0",
  border: "none",
  marginTop: 8,
  cursor: loading ? "not-allowed" : "pointer",
});

export default function ResetPassword() {
  // Token present in URL → set a new password; otherwise → request a link.
  const token = new URLSearchParams(window.location.search).get("token");

  return (
    <div style={{ minHeight: "100vh", background: "#FCFCFC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <a href="/" style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#020202", textDecoration: "none" }}>
          Unwrapped
        </a>
        <div style={{ marginTop: 40 }}>
          {token ? <SetNewPassword token={token} /> : <RequestReset />}
        </div>
      </div>
    </div>
  );
}

function RequestReset() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const request = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => setSent(true),
    onError: (e) => setError(e.message),
  });

  if (sent) {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#020202" }}>Check your inbox</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.6 }}>
          If an account exists for <strong>{email}</strong>, we've sent a reset link. It's valid for 1 hour.
          Nothing arriving? Check spam, or contact{" "}
          <a href="mailto:anna@shopunwrapped.com" style={{ color: V }}>anna@shopunwrapped.com</a>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#020202" }}>Reset your password</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.5 }}>
        Enter your email and we'll send you a reset link.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); setError(""); request.mutate({ email }); }}>
        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginBottom: 8 }}>{error}</p>}
        <button type="submit" disabled={request.isPending} style={buttonStyle(request.isPending)}>
          {request.isPending ? "Sending…" : "Send reset link →"}
        </button>
      </form>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#ABABAB", marginTop: 24, textAlign: "center" }}>
        Remembered it? <a href="/signin" style={{ color: "#020202", fontWeight: 500, textDecoration: "none" }}>Sign in →</a>
      </p>
    </div>
  );
}

function SetNewPassword({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const reset = trpc.auth.resetPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: (e) => setError(e.message),
  });

  if (done) {
    return (
      <div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 12, color: "#020202" }}>Password updated</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.6, marginBottom: 24 }}>
          You've been signed out everywhere for security. Sign in with your new password.
        </p>
        <a href="/signin" style={{ ...buttonStyle(false), textDecoration: "none", boxSizing: "border-box" }}>Sign in →</a>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, marginBottom: 8, color: "#020202" }}>Choose a new password</h1>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#888", marginBottom: 28, lineHeight: 1.5 }}>
        Minimum 8 characters.
      </p>
      <form onSubmit={(e) => {
        e.preventDefault();
        setError("");
        if (password !== confirm) { setError("Passwords don't match."); return; }
        reset.mutate({ token, password });
      }}>
        <input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
        <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required style={inputStyle} />
        {error && <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: V, marginBottom: 8 }}>{error}</p>}
        <button type="submit" disabled={reset.isPending} style={buttonStyle(reset.isPending)}>
          {reset.isPending ? "Saving…" : "Set new password →"}
        </button>
      </form>
    </div>
  );
}
