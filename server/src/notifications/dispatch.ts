/**
 * Unwrapped notification dispatch
 *
 * Called whenever a drop becomes active (on create, or at scheduled start time).
 * Finds every user who matches BOTH:
 *   1. Category preference (user.interestCategories ∩ drop.category)
 *   2. Location zone (user has a locationZone within radiusKm of the drop's coordinates)
 * Then sends a web push + email to each matching user (excluding mutes).
 */

import webpush from "web-push";
import { db } from "../db";
import {
  users,
  locationZones,
  notificationPreferences,
  notificationMutes,
  pushSubscriptions,
} from "../db/schema";
import { eq, inArray, arrayContains } from "drizzle-orm";

// Escape user-supplied strings before interpolating into email HTML (XSS).
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── VAPID setup ──────────────────────────────────────────────────────────────

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     ?? "mailto:hello@shopunwrapped.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

import { haversineKm } from "../geo";

// ─── Current hour check (respects quiet hours) ────────────────────────────────

function isQuietHour(prefs: typeof notificationPreferences.$inferSelect | null): boolean {
  if (!prefs || !prefs.quietHoursEnabled) return false;
  const hour = new Date().getHours();
  const { quietHoursStart: s, quietHoursEnd: e } = prefs;
  return s > e ? hour >= s || hour < e : hour >= s && hour < e;
}

// ─── Resend email (optional, gracefully skipped if RESEND_API_KEY missing) ────

async function sendDropEmail(to: string, drop: DropPayload) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  try {
    const endStr = new Date(drop.collectionEnd).toLocaleTimeString("en-GB", {
      hour: "2-digit", minute: "2-digit",
    });

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Unwrapped <anna@shopunwrapped.com>",
        to,
        subject: `New drop near you: ${drop.title.replace(/[\r\n]/g, " ")}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
            <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
              Unwrapped · New drop
            </p>
            <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin-bottom:8px">${esc(drop.title)}</h1>
            <p style="font-size:14px;color:#7a7a7a;margin-bottom:20px">${esc(drop.businessName)}</p>
            <p style="font-size:15px;color:#141210;margin-bottom:24px">
              <strong style="font-family:monospace">£${(drop.price / 100).toFixed(2)}</strong>
              &nbsp;·&nbsp; Collect until ${endStr}
              &nbsp;·&nbsp; <span style="color:#E8341C">${drop.availableQuantity} available</span>
            </p>
            <a href="https://shopunwrapped.com/drop/${drop.id}"
               style="display:inline-block;background:#141210;color:#FAFAF8;font-family:monospace;
                      font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">
              CLAIM YOUR SPOT
            </a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">
              You're receiving this because you follow ${esc(drop.businessName)} or have matching interests.
              <a href="https://shopunwrapped.com/profile" style="color:#7a7a7a">Manage preferences</a>
            </p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] email error:", err);
  }
}

// ─── Business application emails ───────────────────────────────────────────────

export async function sendApplicationApprovedEmail(to: string, businessName: string, setupUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Unwrapped <anna@shopunwrapped.com>",
        to,
        subject: "You're approved to list on Unwrapped",
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
            <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
              Unwrapped · Business application
            </p>
            <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin-bottom:16px">You're approved!</h1>
            <p style="font-size:15px;color:#141210;margin-bottom:24px;line-height:1.6">
              Good news — <strong>${esc(businessName)}</strong> has been approved to list on Unwrapped.
              Click below to set your password (this link is valid for 7 days), then sign in with this
              email address (${esc(to)}) to access your business dashboard.
            </p>
            <a href="${setupUrl}"
               style="display:inline-block;background:#141210;color:#FAFAF8;font-family:monospace;
                      font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">
              SET YOUR PASSWORD
            </a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">
              Link expired? Use "Forgot your password?" at shopunwrapped.com/reset-password with this email.
              Questions? Just reply to this email.
            </p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] approval email error:", err);
  }
}

/** Resend template alias for claim invites (must be published). */
const CLAIM_PROFILE_TEMPLATE = "claim-profile";

/** Invite a business owner to claim a profile seeded by admin (bulk import). Throws on failure. */
export async function sendBusinessClaimInviteEmail(to: string, businessName: string, setupUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Unwrapped <anna@shopunwrapped.com>",
      to,
      // Subject comes from the published Resend template (includes BUSINESS_NAME).
      template: {
        id: CLAIM_PROFILE_TEMPLATE,
        variables: {
          BUSINESS_NAME: businessName,
          SIGN_IN_EMAIL: to,
          SETUP_URL: setupUrl,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}

export async function sendApplicationRejectedEmail(to: string, businessName: string, reason?: string | null) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return;

    try {
          await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                            Authorization: `Bearer ${key}`,
                            "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                            from: "Unwrapped <anna@shopunwrapped.com>",
                            to,
                            subject: "Update on your Unwrapped application",
                            html: `
                                      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
                                                  <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
                                                                Unwrapped · Business application
                                                                            </p>
                                                                                        <h1 style="font-size:24px;font-weight:700;line-height:1.2;margin-bottom:16px">
                                                                                                      Thanks for applying, ${esc(businessName)}
                                                                                                                  </h1>
                                                                                                                              <p style="font-size:15px;color:#141210;margin-bottom:16px;line-height:1.6">
                                                                                                                                            We're not able to approve your application to list on Unwrapped at this time.
                                                                                                                                                        </p>
                                                                                                                                                                    ${reason ? `<p style="font-size:14px;color:#7a7a7a;margin-bottom:24px;line-height:1.6">${esc(reason)}</p>` : ""}
                                                                                                                                                                                <p style="font-size:12px;color:#b0a89e;margin-top:32px">
                                                                                                                                                                                              Questions? Just reply to this email.
                                                                                                                                                                                                          </p>
                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                            `,
                  }),
          });
    } catch (err) {
          console.error("[notifications] rejection email error:", err);
    }
}

// ─── Web push ─────────────────────────────────────────────────────────────────

async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  drop: DropPayload,
) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: `New drop: ${drop.title}`,
        body: `${drop.businessName} · £${(drop.price / 100).toFixed(2)} · ${drop.availableQuantity} available`,
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        data: { url: `/drop/${drop.id}` },
      }),
    );
  } catch (err: any) {
    if (err.statusCode === 410) {
      // Subscription expired — clean it up
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    } else {
      console.error("[notifications] push error:", err);
    }
  }
}

// ─── Main dispatch ────────────────────────────────────────────────────────────

export interface DropPayload {
  id: string;
  title: string;
  businessId: string;
  businessName: string;
  category: string;
  price: number;
  availableQuantity: number;
  collectionEnd: string;
  locationLat: number;
  locationLng: number;
}

export async function dispatchDropNotifications(drop: DropPayload): Promise<void> {
  try {
    // 1. Find users with a matching category preference (filtered in SQL —
    // don't load the whole users table into memory)
    const interested = await db
      .select()
      .from(users)
      .where(arrayContains(users.interestCategories, [drop.category]));

    if (interested.length === 0) return;
    const interestedIds = interested.map(u => u.id);

    // 2. Load their location zones and notification prefs in bulk
    const zones = await db
      .select()
      .from(locationZones)
      .where(inArray(locationZones.userId, interestedIds));

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(inArray(notificationPreferences.userId, interestedIds));

    const mutes = await db
      .select()
      .from(notificationMutes)
      .where(inArray(notificationMutes.userId, interestedIds));

    // 3. Load their push subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(inArray(pushSubscriptions.userId, interestedIds));

    // 4. Build lookup maps
    const zonesByUser = new Map<string, typeof zones>();
    zones.forEach(z => {
      const arr = zonesByUser.get(z.userId) ?? [];
      arr.push(z);
      zonesByUser.set(z.userId, arr);
    });

    const prefsByUser = new Map(prefs.map(p => [p.userId, p]));
    const muteSet = new Set(mutes.filter(m => m.businessId === drop.businessId).map(m => m.userId));
    const subsByUser = new Map<string, typeof subs>();
    subs.forEach(s => {
      const arr = subsByUser.get(s.userId) ?? [];
      arr.push(s);
      subsByUser.set(s.userId, arr);
    });

    // 5. Filter to users in range + not muted + not in quiet hours
    const toNotify = interested.filter(user => {
      if (muteSet.has(user.id)) return false;

      const userPrefs = prefsByUser.get(user.id) ?? null;
      if (isQuietHour(userPrefs)) return false;

      // Check category is enabled in their prefs (empty array = all enabled)
      if (userPrefs && userPrefs.enabledCategories.length > 0) {
        if (!userPrefs.enabledCategories.includes(drop.category)) return false;
      }

      // Must have at least one location zone within radius of the drop
      const userZones = zonesByUser.get(user.id) ?? [];
      if (userZones.length === 0) return true; // no zones set = always notify

      return userZones.some(zone => {
        const dist = haversineKm(zone.latitude, zone.longitude, drop.locationLat, drop.locationLng);
        return dist <= zone.radiusKm;
      });
    });

    console.log(`[notifications] dispatching to ${toNotify.length} users for drop ${drop.id}`);

    // 6. Send in parallel (web push + email)
    await Promise.allSettled(
      toNotify.flatMap(user => {
        const userSubs = subsByUser.get(user.id) ?? [];
        const tasks: Promise<void>[] = [];

        // Web push for each registered subscription
        userSubs.forEach(sub => tasks.push(sendPushNotification(sub, drop)));

        // Email if they have one
        if (user.email) tasks.push(sendDropEmail(user.email, drop));

        return tasks;
      }),
    );
  } catch (err) {
    console.error("[notifications] dispatch error:", err);
  }
}

// ─── Password reset email ──────────────────────────────────────────────────────

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[notifications] RESEND_API_KEY missing — password reset email NOT sent to", to);
    return;
  }
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Unwrapped <anna@shopunwrapped.com>",
        to,
        subject: "Reset your Unwrapped password",
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
            <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">Unwrapped · Password reset</p>
            <h1 style="font-size:24px;font-weight:700;line-height:1.2;margin-bottom:12px">Reset your password</h1>
            <p style="font-size:15px;line-height:1.6;margin-bottom:24px">Someone (hopefully you) asked to reset the password for this email address. This link is valid for 1 hour and can be used once.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#141210;color:#FAFAF8;font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">CHOOSE A NEW PASSWORD</a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">If you didn't request this, ignore this email — your password is unchanged. Questions: <a href="mailto:anna@shopunwrapped.com" style="color:#7a7a7a">anna@shopunwrapped.com</a></p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] password reset email error:", err);
  }
}

// ─── Reservation confirmation email ────────────────────────────────────────────

export async function sendReservationConfirmationEmail(params: {
  to: string;
  dropTitle: string;
  businessName: string;
  address: string;
  collectionStart: Date;
  collectionEnd: Date;
  pricePence: number;
  referenceCode: string;
  reservationId: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  try {
    const fmt = (d: Date) =>
      d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Unwrapped <anna@shopunwrapped.com>",
        to: params.to,
        subject: `Reserved: ${params.dropTitle.replace(/[\r\n]/g, " ")} — ref ${params.referenceCode}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
            <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">Unwrapped · Reservation confirmed</p>
            <h1 style="font-size:26px;font-weight:700;line-height:1.15;margin-bottom:6px">${esc(params.dropTitle)}</h1>
            <p style="font-size:14px;color:#7a7a7a;margin-bottom:24px">${esc(params.businessName)}</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
              <tr><td style="padding:8px 0;color:#7a7a7a">Reference</td><td style="padding:8px 0;font-family:monospace;font-weight:700">${esc(params.referenceCode)}</td></tr>
              <tr><td style="padding:8px 0;color:#7a7a7a">Collect</td><td style="padding:8px 0">${fmt(params.collectionStart)} – ${params.collectionEnd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td></tr>
              <tr><td style="padding:8px 0;color:#7a7a7a">Where</td><td style="padding:8px 0">${esc(params.address)}</td></tr>
              <tr><td style="padding:8px 0;color:#7a7a7a">Paid</td><td style="padding:8px 0;font-family:monospace">£${(params.pricePence / 100).toFixed(2)}</td></tr>
            </table>
            <a href="https://shopunwrapped.com/ticket/${params.reservationId}" style="display:inline-block;background:#141210;color:#FAFAF8;font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">VIEW YOUR QR TICKET</a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">Show the QR code (or your reference) at the door during the collection window. Need help? <a href="mailto:anna@shopunwrapped.com" style="color:#7a7a7a">anna@shopunwrapped.com</a></p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] reservation confirmation email error:", err);
  }
}
