import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import SeoHead from "../components/SeoHead";
import { BG, FG, MUTED_FG } from "../theme";

const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export default function Unsubscribe() {
  const search = useSearch();
  const token = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("token") ?? "";
  const [state, setState] = useState<"working" | "ok" | "bad">(token ? "working" : "bad");

  useEffect(() => {
    if (!token) return;
    const url = `${API}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
    let cancelled = false;
    fetch(url, { headers: { Accept: "application/json" } })
      .then(async (res) => {
        const data = await res.json().catch(() => ({ ok: false }));
        if (!cancelled) setState(res.ok && data.ok ? "ok" : "bad");
      })
      .catch(() => {
        if (!cancelled) setState("bad");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const title = state === "ok" ? "You're unsubscribed" : state === "bad" ? "This link doesn't work" : "One moment";
  const body = state === "ok"
    ? "We won't email you when a shop you follow posts a drop. You can turn alerts back on from your account, and you can unfollow a shop any time."
    : state === "bad"
      ? "This unsubscribe link is invalid. Sign in and open Notifications to turn drop alerts off."
      : "Unsubscribing you from drop alerts.";

  return (
    <div style={{ minHeight: "100vh", background: BG, color: FG }}>
      <SeoHead title={`${title} — Unwrapped`} description={body} path="/unsubscribe" noindex />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: MUTED_FG }}>
          Unwrapped
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, lineHeight: 1.1, margin: "12px 0" }}>{title}</h1>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.6 }}>{body}</p>
        <p style={{ marginTop: 28 }}>
          <a href="/profile" style={{ color: FG, fontFamily: "'DM Sans', sans-serif" }}>Back to your account</a>
        </p>
      </main>
    </div>
  );
}
