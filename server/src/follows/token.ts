import crypto from "crypto";

const DEV_SECRET = "dev-alert-unsubscribe-secret";

/** Stable secret for signed unsubscribe links. Null in production when unset. */
export function resolveUnsubscribeSecret(): string | null {
  const configured = process.env.ALERT_UNSUBSCRIBE_SECRET?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === "production") return null;
  return DEV_SECRET;
}

export function signAlertUnsubscribeToken(userId: string, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ u: userId, v: 1 }), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAlertUnsubscribeToken(token: string, secret: string): string | null {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!payload || !sig) return null;

  const expected = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  const got = Buffer.from(sig);
  const want = Buffer.from(expected);
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { u?: unknown };
    if (typeof data.u !== "string" || data.u.length === 0) return null;
    return data.u;
  } catch {
    return null;
  }
}
