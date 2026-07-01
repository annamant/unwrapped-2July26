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
import { eq, sql, and, ne } from "drizzle-orm";

// ─── VAPID setup ──────────────────────────────────────────────────────────────

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     ?? "mailto:hello@unwrapped.shop";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

// ─── Haversine distance (km) ──────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
        from: "Unwrapped <drops@unwrapped.shop>",
        to,
        subject: `New drop near you: ${drop.title}`,
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAFAF8;color:#141210">
            <p style="font-family:monospace;font-size:11px;color:#7a7a7a;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px">
              Unwrapped · New drop
            </p>
            <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin-bottom:8px">${drop.title}</h1>
            <p style="font-size:14px;color:#7a7a7a;margin-bottom:20px">${drop.businessName}</p>
            <p style="font-size:15px;color:#141210;margin-bottom:24px">
              <strong style="font-family:monospace">£${(drop.price / 100).toFixed(2)}</strong>
              &nbsp;·&nbsp; Collect until ${endStr}
              &nbsp;·&nbsp; <span style="color:#E8341C">${drop.availableQuantity} available</span>
            </p>
            <a href="https://unwrapped.shop/drop/${drop.id}"
               style="display:inline-block;background:#141210;color:#FAFAF8;font-family:monospace;
                      font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">
              CLAIM YOUR SPOT
            </a>
            <p style="font-size:12px;color:#b0a89e;margin-top:32px">
              You're receiving this because you follow ${drop.businessName} or have matching interests.
              <a href="https://unwrapped.shop/profile" style="color:#7a7a7a">Manage preferences</a>
            </p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error("[notifications] email error:", err);
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
    // 1. Find all users with a matching category preference
    const allUsers = await db.select().from(users);
    const interested = allUsers.filter(u =>
      u.interestCategories.includes(drop.category),
    );

    if (interested.length === 0) return;
    const interestedIds = interested.map(u => u.id);

    // 2. Load their location zones and notification prefs in bulk
    const zones = await db
      .select()
      .from(locationZones)
      .where(sql`${locationZones.userId} = ANY(${interestedIds})`);

    const prefs = await db
      .select()
      .from(notificationPreferences)
      .where(sql`${notificationPreferences.userId} = ANY(${interestedIds})`);

    const mutes = await db
      .select()
      .from(notificationMutes)
      .where(sql`${notificationMutes.userId} = ANY(${interestedIds})`);

    // 3. Load their push subscriptions
    const subs = await db
      .select()
      .from(pushSubscriptions)
      .where(sql`${pushSubscriptions.userId} = ANY(${interestedIds})`);

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
