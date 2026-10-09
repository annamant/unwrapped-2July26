import { signAlertUnsubscribeToken } from "./token";

export type AlertMediaType = "image" | "video";

export type FollowerAlertDrop = {
  id: string;
  title: string;
  pricePence: number;
  imageUrl: string | null;
  mediaType: AlertMediaType;
  businessName: string;
  bookingUrl: string;
};

export type AlertFollower = {
  userId: string;
  email: string;
  dropAlertsEnabled: boolean;
};

export type AlertEmail = {
  to: string;
  subject: string;
  html: string;
  headers: Record<string, string>;
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatAlertPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

/** Photo URL, or a still frame for a Cloudinary video. */
export function dropMediaPosterUrl(url: string | null | undefined, mediaType: AlertMediaType): string | null {
  if (!url) return null;
  if (mediaType !== "video") return url;
  if (!/\/video\/upload\//.test(url)) return null;
  const framed = url.replace("/video/upload/", "/video/upload/so_0,f_jpg/");
  return framed.replace(/\.(mp4|webm|mov)(?=\?|#|$)/i, ".jpg");
}

export function oneClickUnsubscribeUrl(apiOrigin: string, token: string): string {
  const base = apiOrigin.replace(/\/$/, "");
  return `${base}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function buildFollowerAlertEmail(opts: {
  to: string;
  drop: FollowerAlertDrop;
  unsubscribePageUrl: string;
  oneClickUrl: string;
}): AlertEmail {
  const poster = dropMediaPosterUrl(opts.drop.imageUrl, opts.drop.mediaType);
  const price = formatAlertPrice(opts.drop.pricePence);
  const subject = `${opts.drop.businessName.replace(/[\r\n]/g, " ")} posted ${opts.drop.title.replace(/[\r\n]/g, " ")}`;
  const image = poster
    ? `<img src="${esc(poster)}" alt="" width="432" style="display:block;width:100%;max-width:432px;height:auto;margin:0 0 20px;border:0" />`
    : "";

  const html = `
    <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FFE0E7;color:#160703">
      <p style="font-family:monospace;font-size:11px;color:#8B555E;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 24px">
        Unwrapped · New drop
      </p>
      ${image}
      <p style="font-size:14px;color:#8B555E;margin:0 0 8px">${esc(opts.drop.businessName)}</p>
      <h1 style="font-size:28px;font-weight:700;line-height:1.15;margin:0 0 12px">${esc(opts.drop.title)}</h1>
      <p style="font-size:16px;margin:0 0 24px"><strong style="font-family:monospace">${esc(price)}</strong></p>
      <a href="${esc(opts.drop.bookingUrl)}"
         style="display:inline-block;background:#160703;color:#FFE0E7;font-family:monospace;font-size:11px;letter-spacing:0.1em;padding:13px 28px;text-decoration:none">
        BOOK THIS DROP
      </a>
      <p style="font-size:12px;color:#8B555E;margin:32px 0 0;line-height:1.5">
        You're getting this because you follow ${esc(opts.drop.businessName)}.
        <a href="${esc(opts.unsubscribePageUrl)}" style="color:#160703">Unsubscribe</a>
        from drop alerts.
      </p>
    </div>
  `;

  return {
    to: opts.to,
    subject,
    html,
    headers: {
      "List-Unsubscribe": `<${opts.oneClickUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export type FanOutResult = {
  sent: string[];
  skipped: string[];
};

export async function fanOutFollowerAlerts(opts: {
  drop: FollowerAlertDrop;
  followers: AlertFollower[];
  claimSend: (userId: string) => Promise<boolean>;
  releaseSend: (userId: string) => Promise<void>;
  mailer: (email: AlertEmail) => Promise<void>;
  unsubscribePageUrl: (userId: string) => string;
  oneClickUrl: (userId: string) => string;
}): Promise<FanOutResult> {
  const sent: string[] = [];
  const skipped: string[] = [];
  const seen = new Set<string>();

  for (const follower of opts.followers) {
    if (seen.has(follower.userId)) {
      skipped.push(follower.userId);
      continue;
    }
    seen.add(follower.userId);

    if (!follower.dropAlertsEnabled || !follower.email) {
      skipped.push(follower.userId);
      continue;
    }

    const claimed = await opts.claimSend(follower.userId);
    if (!claimed) {
      skipped.push(follower.userId);
      continue;
    }

    try {
      await opts.mailer(buildFollowerAlertEmail({
        to: follower.email,
        drop: opts.drop,
        unsubscribePageUrl: opts.unsubscribePageUrl(follower.userId),
        oneClickUrl: opts.oneClickUrl(follower.userId),
      }));
      sent.push(follower.userId);
    } catch (err) {
      await opts.releaseSend(follower.userId);
      skipped.push(follower.userId);
      console.error("[alerts] follower email failed:", err);
    }
  }

  return { sent, skipped };
}

export function unsubscribeLinkForUser(userId: string, secret: string, clientOrigin: string, apiOrigin: string) {
  const token = signAlertUnsubscribeToken(userId, secret);
  const page = `${clientOrigin.replace(/\/$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
  const oneClick = oneClickUnsubscribeUrl(apiOrigin, token);
  return { token, page, oneClick };
}
