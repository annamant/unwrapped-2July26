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
import { checkoutFromList } from "../payments/fees";

function formatDropPriceText(drop: DropPayload): string {
  const price = `£${(drop.price / 100).toFixed(2)}`;
  if (drop.originalPrice && checkoutFromList(drop.originalPrice) > drop.price) {
    const was = `£${(checkoutFromList(drop.originalPrice) / 100).toFixed(2)}`;
    const pct = Math.round((1 - drop.price / checkoutFromList(drop.originalPrice)) * 100);
    return `${price} (${pct}% off, was ${was})`;
  }
  return price;
}

function formatDropPriceHtml(drop: DropPayload): string {
  const price = `£${(drop.price / 100).toFixed(2)}`;
  if (drop.originalPrice && checkoutFromList(drop.originalPrice) > drop.price) {
    const was = `£${(checkoutFromList(drop.originalPrice) / 100).toFixed(2)}`;
    const pct = Math.round((1 - drop.price / checkoutFromList(drop.originalPrice)) * 100);
    return `<strong style="font-family:monospace">${price}</strong> <span style="text-decoration:line-through;color:#5A6E62">${was}</span> <span style="color:#244B36">${pct}% off</span>`;
  }
  return `<strong style="font-family:monospace">${price}</strong>`;
}

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
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#244B36">
            <p style="font-family:monospace;font-size:11px;color:#5A6E62;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
              Unwrapped · New drop
            </p>
            <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin-bottom:8px">${esc(drop.title)}</h1>
            <p style="font-size:14px;color:#5A6E62;margin-bottom:20px">${esc(drop.businessName)}</p>
            <p style="font-size:15px;color:#244B36;margin-bottom:24px">
              ${formatDropPriceHtml(drop)}
              &nbsp;·&nbsp; Collect until ${endStr}
              &nbsp;·&nbsp; <span style="color:#244B36">${drop.availableQuantity} available</span>
            </p>
            <a href="https://shopunwrapped.com/drop/${drop.id}"
               style="display:inline-block;background:#244B36;color:#FFE0E7;font-family:monospace;
                      font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">
              CLAIM YOUR SPOT
            </a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">
              You're receiving this because you follow ${esc(drop.businessName)} or have matching interests.
              <a href="https://shopunwrapped.com/profile" style="color:#5A6E62">Manage preferences</a>
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
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#244B36">
            <p style="font-family:monospace;font-size:11px;color:#5A6E62;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
              Unwrapped · Business application
            </p>
            <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin-bottom:16px">You're approved!</h1>
            <p style="font-size:15px;color:#244B36;margin-bottom:24px;line-height:1.6">
              Good news — <strong>${esc(businessName)}</strong> has been approved to list on Unwrapped.
              Click below to set your password (this link is valid for 7 days), then sign in with this
              email address (${esc(to)}) to access your business dashboard.
            </p>
            <a href="${setupUrl}"
               style="display:inline-block;background:#244B36;color:#FFE0E7;font-family:monospace;
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

/**
 * Follow-up to a business that was sent a claim invite but didn't act on it
 * before the 7-day link expired. Shorter than the original invite — assumes
 * they already saw (or at least received) the first email. Sends a fresh
 * password-setup link (caller is responsible for issuing a new token).
 * Inline HTML rather than a Resend template, so no publish step required.
 */
export async function sendBusinessClaimFollowUpEmail(to: string, businessName: string, setupUrl: string) {
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
      subject: `Still want to claim ${businessName} on Unwrapped?`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#E8E7E2;-webkit-text-size-adjust:100%;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#E8E7E2;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#FFE0E7;border:1px solid #F0B8C4;">
                  <tr>
                    <td style="padding:28px 32px 24px;border-bottom:3px solid #244B36;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td width="52" valign="middle" style="padding-right:14px;">
                            <img src="https://shopunwrapped.com/icon-192.png" width="48" height="48" alt="Unwrapped" style="display:block;border:0;border-radius:4px;" />
                          </td>
                          <td valign="middle">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#244B36;line-height:1.1;letter-spacing:-0.02em;">
                              Unwrapped
                            </div>
                            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#5A6E62;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">
                              Limited · Local · Worth sharing
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px 0;">
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        Hi — I emailed recently about a free profile I made for <strong>${esc(businessName)}</strong> on
                        Unwrapped. The original claim link has expired, so here's a fresh one in case you missed it.
                      </p>
                      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        It takes about a minute: set a password, sign in as
                        <strong>${esc(to)}</strong>, and post your first drop whenever something's happening
                        — a new product, a discount, a one-off. Nothing goes live from your side until you do.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px 28px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="background-color:#244B36;border-radius:0;">
                            <a href="${setupUrl}" style="display:inline-block;padding:14px 28px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:#FFE0E7;">
                              Claim your profile
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px;border-top:1px solid #F0B8C4;">
                      <p style="margin:20px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#5A6E62;">
                        Not interested? Ignore this — nothing goes live until you claim. Don't want a profile at all?
                        Reply "REMOVE" and I'll delete it. Questions? Just reply, or email
                        <a href="mailto:anna@shopunwrapped.com" style="color:#5A6E62;">anna@shopunwrapped.com</a>.
                      </p>
                      <p style="margin:12px 0 0;font-family:'Courier New',Courier,monospace;font-size:9px;color:#ABABAB;letter-spacing:0.1em;text-transform:uppercase;">
                        © Unwrapped · shopunwrapped.com
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body.slice(0, 200)}`);
  }
}

/**
 * "Thank you / what's next" email sent to a business owner after they've
 * claimed their profile and set a password. Inline HTML (no Resend template
 * publish step required). Sent only to owners who actually completed the
 * claim flow (password_hash IS NOT NULL).
 */
export async function sendBusinessClaimThankYouEmail(to: string, businessName: string, businessSlug: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");

  const profileUrl = `https://shopunwrapped.com/business/${businessSlug}`;
  const dashboardUrl = "https://shopunwrapped.com/business";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Anna at Unwrapped <anna@shopunwrapped.com>",
      to,
      subject: `Welcome to Unwrapped — what happens next for ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
        <body style="margin:0;padding:0;background-color:#E8E7E2;-webkit-text-size-adjust:100%;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#E8E7E2;">
            <tr>
              <td align="center" style="padding:40px 16px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background-color:#FFE0E7;border:1px solid #F0B8C4;">
                  <tr>
                    <td style="padding:28px 32px 24px;border-bottom:3px solid #244B36;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td width="52" valign="middle" style="padding-right:14px;">
                            <img src="https://shopunwrapped.com/icon-192.png" width="48" height="48" alt="Unwrapped" style="display:block;border:0;border-radius:4px;" />
                          </td>
                          <td valign="middle">
                            <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#244B36;line-height:1.1;letter-spacing:-0.02em;">
                              Unwrapped
                            </div>
                            <div style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#5A6E62;letter-spacing:0.14em;text-transform:uppercase;margin-top:4px;">
                              Limited · Local · Worth sharing
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 32px 0;">
                      <p style="margin:0 0 16px;font-family:'Courier New',Courier,monospace;font-size:10px;color:#5A6E62;letter-spacing:0.14em;text-transform:uppercase;">
                        Thank you
                      </p>
                      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;line-height:1.2;color:#244B36;">
                        You're in — here's what happens next
                      </h1>
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        Hi, Anna here — I run Unwrapped. Thanks for claiming <strong>${esc(businessName)}</strong>.
                        You're one of the first businesses on the platform, which means you're helping shape what
                        this becomes. I really appreciate that.
                      </p>
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        Here's the short version of what to do next:
                      </p>
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        <strong style="font-family:'Courier New',monospace;font-size:13px;">1.</strong>
                        Sign in at
                        <a href="${dashboardUrl}" style="color:#244B36;font-weight:500;">${dashboardUrl}</a>
                        with this email address (${esc(to)}) and the password you just set.
                      </p>
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        <strong style="font-family:'Courier New',monospace;font-size:13px;">2.</strong>
                        Tidy up your profile — add a logo, a cover photo, your Instagram handle, and a one-line
                        description so nearby shoppers recognise you. Your public page is
                        <a href="${profileUrl}" style="color:#244B36;font-weight:500;">${profileUrl}</a>.
                      </p>
                      <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        <strong style="font-family:'Courier New',monospace;font-size:13px;">3.</strong>
                        Post your first <em>drop</em> — a new product, a discount, a one-off, a launch. Shoppers
                        within a couple of kilometres get an alert and can claim a QR ticket. That's the whole
                        point of Unwrapped: telling the neighbourhood when something's happening. You're welcome
                        to post one now, or just get your profile looking right first — entirely up to you.
                      </p>
                      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#244B36;">
                        A few honest things, since you're one of the first:
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 32px 0;">
                      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#244B36;">
                        — <strong>This is a pilot, and we're still signing up businesses like you.</strong> So I want
                        to be straight with you: if you post a drop today, it won't reach a flood of shoppers
                        tomorrow. The shopper side grows once there's a critical mass of interesting local
                        businesses on the map — that's the part we're building right now, and you're helping build it.
                      </p>
                      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#244B36;">
                        — We're not relying on the internet to do the work. We're planning a proper local campaign —
                        door-to-door, postcards, talking to people on the high street — to make sure the
                        neighbourhoods around your shops actually know about Unwrapped. That takes a little time,
                        and it's coming.
                      </p>
                      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#244B36;">
                        — So please be patient with us. You're not just joining an app — you're helping build
                        something that doesn't quite exist yet. Your feedback in these early weeks genuinely
                        shapes what it becomes. Reply to this email with what's useful, what's missing, what's
                        confusing.
                      </p>
                      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#244B36;">
                        — There's no cost to you during the pilot. We'll figure out pricing together later;
                        nothing changes without you saying yes.
                      </p>
                      <p style="margin:0 0 12px;font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;color:#244B36;">
                        — Your public profile is live now at
                        <a href="${profileUrl}" style="color:#244B36;font-weight:500;">${profileUrl}</a>.
                        Shoppers can already follow you there.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 32px 28px;">
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td style="background-color:#244B36;border-radius:0;">
                            <a href="${dashboardUrl}" style="display:inline-block;padding:14px 28px;font-family:'Courier New',Courier,monospace;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:#FFE0E7;">
                              Sign in to your dashboard
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 32px 32px;border-top:1px solid #F0B8C4;">
                      <p style="margin:20px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#5A6E62;">
                        Thanks again for being one of the first — it genuinely matters.<br/>
                        Anna
                      </p>
                      <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#5A6E62;">
                        Questions? Just reply to this email, or write to
                        <a href="mailto:anna@shopunwrapped.com" style="color:#5A6E62;">anna@shopunwrapped.com</a>.
                      </p>
                      <p style="margin:12px 0 0;font-family:'Courier New',Courier,monospace;font-size:9px;color:#ABABAB;letter-spacing:0.1em;text-transform:uppercase;">
                        © Unwrapped · shopunwrapped.com
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
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
                                      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#244B36">
                                                  <p style="font-family:monospace;font-size:11px;color:#5A6E62;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
                                                                Unwrapped · Business application
                                                                            </p>
                                                                                        <h1 style="font-size:24px;font-weight:700;line-height:1.2;margin-bottom:16px">
                                                                                                      Thanks for applying, ${esc(businessName)}
                                                                                                                  </h1>
                                                                                                                              <p style="font-size:15px;color:#244B36;margin-bottom:16px;line-height:1.6">
                                                                                                                                            We're not able to approve your application to list on Unwrapped at this time.
                                                                                                                                                        </p>
                                                                                                                                                                    ${reason ? `<p style="font-size:14px;color:#5A6E62;margin-bottom:24px;line-height:1.6">${esc(reason)}</p>` : ""}
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
        body: `${drop.businessName} · ${formatDropPriceText(drop)} · ${drop.availableQuantity} available`,
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
  /** Original list price in pence — shown for discount drops. */
  originalPrice?: number | null;
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
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#244B36">
            <p style="font-family:monospace;font-size:11px;color:#5A6E62;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">Unwrapped · Password reset</p>
            <h1 style="font-size:24px;font-weight:700;line-height:1.2;margin-bottom:12px">Reset your password</h1>
            <p style="font-size:15px;line-height:1.6;margin-bottom:24px">Someone (hopefully you) asked to reset the password for this email address. This link is valid for 1 hour and can be used once.</p>
            <a href="${resetUrl}" style="display:inline-block;background:#244B36;color:#FFE0E7;font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">CHOOSE A NEW PASSWORD</a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">If you didn't request this, ignore this email — your password is unchanged. Questions: <a href="mailto:anna@shopunwrapped.com" style="color:#5A6E62">anna@shopunwrapped.com</a></p>
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
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#244B36">
            <p style="font-family:monospace;font-size:11px;color:#5A6E62;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">Unwrapped · Reservation confirmed</p>
            <h1 style="font-size:26px;font-weight:700;line-height:1.15;margin-bottom:6px">${esc(params.dropTitle)}</h1>
            <p style="font-size:14px;color:#5A6E62;margin-bottom:24px">${esc(params.businessName)}</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
              <tr><td style="padding:8px 0;color:#5A6E62">Reference</td><td style="padding:8px 0;font-family:monospace;font-weight:700">${esc(params.referenceCode)}</td></tr>
              <tr><td style="padding:8px 0;color:#5A6E62">Collect</td><td style="padding:8px 0">${fmt(params.collectionStart)} – ${params.collectionEnd.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</td></tr>
              <tr><td style="padding:8px 0;color:#5A6E62">Where</td><td style="padding:8px 0">${esc(params.address)}</td></tr>
              <tr><td style="padding:8px 0;color:#5A6E62">Paid</td><td style="padding:8px 0;font-family:monospace">£${(params.pricePence / 100).toFixed(2)}</td></tr>
            </table>
            <a href="https://shopunwrapped.com/ticket/${params.reservationId}" style="display:inline-block;background:#244B36;color:#FFE0E7;font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">VIEW YOUR QR TICKET</a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">Show the QR code (or your reference) at the door during the collection window. Need help? <a href="mailto:anna@shopunwrapped.com" style="color:#5A6E62">anna@shopunwrapped.com</a></p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] reservation confirmation email error:", err);
  }
}
