/**
 * usePushNotifications
 *
 * Registers a web push subscription after user grants permission.
 * Call requestPermission() from onboarding or the profile page.
 * The subscription is sent to POST /api/push/subscribe on the server.
 */

import { getSessionToken } from "../trpc";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";
const API_URL = import.meta.env.VITE_API_URL ?? "";

function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function requestPushPermission(): Promise<"granted" | "denied" | "unavailable"> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unavailable";
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn("[push] VITE_VAPID_PUBLIC_KEY not set — skipping push registration");
    return "unavailable";
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const { endpoint, keys } = subscription.toJSON() as any;

    await fetch(`${API_URL}/api/push/subscribe`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }),
    });

    return "granted";
  } catch (err) {
    console.error("[push] subscription error:", err);
    return "denied";
  }
}

export async function unregisterPush(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    await sub.unsubscribe();
    await fetch(`${API_URL}/api/push/unsubscribe`, {
      method: "POST",
      credentials: "include",
      headers: authHeaders(),
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });
  }
}
