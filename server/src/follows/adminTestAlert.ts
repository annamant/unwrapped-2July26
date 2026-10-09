import {
  buildFollowerAlertEmail,
  oneClickUnsubscribeUrl,
  type AlertEmail,
  type FollowerAlertDrop,
} from "./alerts";
import { signAlertUnsubscribeToken } from "./token";

export type AdminTestAlertPlan =
  | { ok: true; email: AlertEmail; sample: boolean }
  | { ok: false; reason: string };

/** Parse ADMIN_EMAILS into a lowercase set. */
export function parseAdminEmails(envValue: string | undefined | null): Set<string> {
  return new Set(
    (envValue ?? "")
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Build one follower-alert email for the signed-in admin only.
 * Never accepts a recipient other than that admin, and refuses if they are
 * not listed in ADMIN_EMAILS. Callers must not write drop_alert_sends.
 */
export function planAdminTestAlert(opts: {
  adminUserId: string;
  adminEmail: string;
  adminEmailsEnv: string | undefined | null;
  drop: FollowerAlertDrop;
  sample: boolean;
  secret: string;
  clientOrigin: string;
  apiOrigin: string;
  /** Forbidden: any alternate recipient. Kept only so tests can prove we reject it. */
  forbiddenTo?: string;
}): AdminTestAlertPlan {
  const adminEmail = opts.adminEmail.trim();
  if (!adminEmail || !adminEmail.includes("@")) {
    return { ok: false, reason: "Admin email missing" };
  }
  if (!opts.adminUserId) {
    return { ok: false, reason: "Admin user missing" };
  }
  if (!opts.secret) {
    return { ok: false, reason: "ALERT_UNSUBSCRIBE_SECRET missing" };
  }

  const allowed = parseAdminEmails(opts.adminEmailsEnv);
  if (!allowed.has(adminEmail.toLowerCase())) {
    return { ok: false, reason: "Your email is not in ADMIN_EMAILS" };
  }

  if (opts.forbiddenTo && opts.forbiddenTo.trim().toLowerCase() !== adminEmail.toLowerCase()) {
    return { ok: false, reason: "Test alerts can only go to your own email" };
  }

  const origin = opts.clientOrigin.replace(/\/$/, "");
  const api = opts.apiOrigin.replace(/\/$/, "");
  const token = signAlertUnsubscribeToken(opts.adminUserId, opts.secret);
  const title = opts.drop.title.startsWith("[TEST]")
    ? opts.drop.title
    : `[TEST] ${opts.drop.title}`;

  const email = buildFollowerAlertEmail({
    to: adminEmail,
    drop: { ...opts.drop, title },
    unsubscribePageUrl: `${origin}/unsubscribe?token=${encodeURIComponent(token)}`,
    oneClickUrl: oneClickUnsubscribeUrl(api, token),
  });

  if (email.to.trim().toLowerCase() !== adminEmail.toLowerCase()) {
    return { ok: false, reason: "Refusing to send test alert to anyone else" };
  }

  return { ok: true, email, sample: opts.sample };
}

/** Send the planned admin test alert through the given mailer. No dedupe table. */
export async function sendPlannedAdminTestAlert(opts: {
  plan: AdminTestAlertPlan;
  adminEmail: string;
  mailer: (email: AlertEmail) => Promise<void>;
}): Promise<{ to: string; sample: boolean; subject: string }> {
  if (!opts.plan.ok) {
    throw new Error(opts.plan.reason);
  }
  if (opts.plan.email.to.trim().toLowerCase() !== opts.adminEmail.trim().toLowerCase()) {
    throw new Error("Refusing to send test alert to anyone else");
  }
  await opts.mailer(opts.plan.email);
  return {
    to: opts.plan.email.to,
    sample: opts.plan.sample,
    subject: opts.plan.email.subject,
  };
}

export function sampleAdminTestDrop(clientOrigin: string): FollowerAlertDrop {
  const origin = clientOrigin.replace(/\/$/, "");
  return {
    id: "admin-test-sample",
    title: "[TEST] Sample drop",
    pricePence: 450,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=60",
    mediaType: "image",
    businessName: "Michael's Meat Market",
    bookingUrl: `${origin}/shop/${encodeURIComponent("lead:michael-s-meat-market")}`,
  };
}
