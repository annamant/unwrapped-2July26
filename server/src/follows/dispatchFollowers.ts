import { and, eq, or } from "drizzle-orm";
import { db } from "../db";
import { businesses, dropAlertSends, follows, notificationPreferences, users } from "../db/schema";
import { dispatchDropNotifications, type DropPayload } from "../notifications/dispatch";
import { fanOutFollowerAlerts, oneClickUnsubscribeUrl, type AlertEmail } from "./alerts";
import { linkBusinessToDirectoryPin } from "./linkPin";
import { resolveUnsubscribeSecret, signAlertUnsubscribeToken } from "./token";

export type PublishedDropAlert = DropPayload & {
  imageUrl?: string | null;
  mediaType?: "image" | "video";
  businessSlug: string;
};

export function clientOrigin(): string {
  return (process.env.CLIENT_URL ?? "https://shopunwrapped.com").split(",")[0].trim().replace(/\/$/, "");
}

export function apiOrigin(): string {
  const explicit = process.env.PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (domain) return `https://${domain.replace(/^https?:\/\//, "")}`;
  return clientOrigin();
}

async function sendViaResend(email: AlertEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  await deliverViaResend(key, email);
}

/** Same Resend path as follower alerts, but fails loud when the key is missing. */
export async function sendAlertEmailViaResend(email: AlertEmail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  await deliverViaResend(key, email);
}

async function deliverViaResend(key: string, email: AlertEmail): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unwrapped <anna@shopunwrapped.com>",
      to: email.to,
      subject: email.subject,
      html: email.html,
      headers: email.headers,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status} ${body.slice(0, 200)}`);
  }
}

export async function sendFollowerAlerts(drop: PublishedDropAlert): Promise<Set<string>> {
  const sent = new Set<string>();
  const secret = resolveUnsubscribeSecret();
  if (!secret) {
    console.error("[alerts] ALERT_UNSUBSCRIBE_SECRET missing — follower emails not sent");
    return sent;
  }
  if (!process.env.RESEND_API_KEY) {
    console.error("[alerts] RESEND_API_KEY missing — follower emails not sent");
    return sent;
  }

  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      postcode: businesses.postcode,
      directoryPinId: businesses.directoryPinId,
      slug: businesses.slug,
    })
    .from(businesses)
    .where(eq(businesses.id, drop.businessId))
    .limit(1);
  if (!business) return sent;

  let pinId = business.directoryPinId;
  try {
    pinId = await linkBusinessToDirectoryPin(db, business);
  } catch (err) {
    console.error("[alerts] pin link failed:", err);
  }

  const followWhere = pinId
    ? or(eq(follows.businessId, business.id), eq(follows.directoryPinId, pinId))
    : eq(follows.businessId, business.id);

  const rows = await db
    .select({
      userId: follows.userId,
      email: users.email,
      dropAlertsEnabled: notificationPreferences.dropAlertsEnabled,
    })
    .from(follows)
    .innerJoin(users, eq(follows.userId, users.id))
    .leftJoin(notificationPreferences, eq(notificationPreferences.userId, users.id))
    .where(followWhere);

  const origin = clientOrigin();
  const api = apiOrigin();
  const bookingUrl = `${origin}/drop/${drop.id}`;

  const result = await fanOutFollowerAlerts({
    drop: {
      id: drop.id,
      title: drop.title,
      pricePence: drop.price,
      imageUrl: drop.imageUrl ?? null,
      mediaType: drop.mediaType ?? "image",
      businessName: drop.businessName || business.name,
      bookingUrl,
    },
    followers: rows.map((row) => ({
      userId: row.userId,
      email: row.email,
      dropAlertsEnabled: row.dropAlertsEnabled !== false,
    })),
    claimSend: async (userId) => {
      try {
        const inserted = await db
          .insert(dropAlertSends)
          .values({ dropId: drop.id, userId })
          .onConflictDoNothing()
          .returning({ id: dropAlertSends.id });
        return inserted.length > 0;
      } catch (err: unknown) {
        if ((err as { code?: string })?.code === "23505") return false;
        throw err;
      }
    },
    releaseSend: async (userId) => {
      await db
        .delete(dropAlertSends)
        .where(and(eq(dropAlertSends.userId, userId), eq(dropAlertSends.dropId, drop.id)));
    },
    mailer: sendViaResend,
    unsubscribePageUrl: (userId) => {
      const token = signAlertUnsubscribeToken(userId, secret);
      return `${origin}/unsubscribe?token=${encodeURIComponent(token)}`;
    },
    oneClickUrl: (userId) => oneClickUnsubscribeUrl(api, signAlertUnsubscribeToken(userId, secret)),
  });

  for (const id of result.sent) sent.add(id);
  return sent;
}

/** Publish path: follower emails first, then the existing push fan-out. Never throws to the caller. */
export function queueDropAlerts(drop: PublishedDropAlert): void {
  void (async () => {
    await sendFollowerAlerts(drop);
    await dispatchDropNotifications(drop);
  })().catch((err) => console.error("[alerts] dispatch failed:", err));
}

export async function markDropAlertsUnsubscribed(userId: string): Promise<boolean> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  await db
    .insert(notificationPreferences)
    .values({ userId, dropAlertsEnabled: false })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { dropAlertsEnabled: false, updatedAt: new Date() },
    });
  return true;
}

export function unsubscribeConfirmationHtml(ok: boolean): string {
  const title = ok ? "You're unsubscribed" : "This link doesn't work";
  const body = ok
    ? "We won't email you when a shop you follow posts a drop. You can turn alerts back on from your account, and you can unfollow a shop any time."
    : "This unsubscribe link is invalid. Sign in and open Notifications to turn drop alerts off.";
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title} — Unwrapped</title>
</head>
<body style="margin:0;background:#FFE0E7;color:#160703;font-family:Georgia,serif">
  <main style="max-width:480px;margin:0 auto;padding:64px 24px">
    <p style="font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8B555E">Unwrapped</p>
    <h1 style="font-size:36px;line-height:1.1;margin:12px 0">${title}</h1>
    <p style="font-size:16px;line-height:1.6">${body}</p>
    <p style="margin-top:28px"><a href="https://shopunwrapped.com/profile" style="color:#160703">Back to your account</a></p>
  </main>
</body>
</html>`;
}
