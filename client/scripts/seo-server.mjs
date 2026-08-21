/**
 * Production static server with crawler-aware meta injection.
 *
 * Serves Vite `dist/` with SPA fallback. For known bots on public deep links
 * (/business/:slug, /drop/:id, and key marketing paths), fetches SEO payload
 * from the API and injects title/description/canonical/OG/JSON-LD into the
 * HTML shell before responding — so Google and social crawlers see real tags
 * without executing the React app.
 *
 * Env:
 *   PORT (default 4173)
 *   API_URL or VITE_API_URL — Unwrapped API origin
 *   DIST_DIR — override dist path
 */
import http from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = process.env.DIST_DIR || join(ROOT, "dist");
const PORT = Number(process.env.PORT || 4173);
const API = (
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  "https://unwrapped-2july26-production.up.railway.app"
).replace(/\/$/, "");

const BOT_RE =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|whatsapp|telegrambot|applebot|pinterest|embedly|quora link preview|showyoubot|outbrain|vkshare|w3c_validator|redditbot|applebot|semrushbot|ahrefsbot|mj12bot|dotbot|petalbot/i;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
  ".map": "application/json",
};

function isBot(ua) {
  return Boolean(ua && BOT_RE.test(ua));
}

function safeJoin(root, reqPath) {
  const cleaned = decodeURIComponent(reqPath.split("?")[0]).replace(/^\/+/, "");
  const full = normalize(join(root, cleaned));
  if (!full.startsWith(normalize(root))) return null;
  return full;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function injectSeo(html, seo) {
  if (!seo) return html;
  let out = html;

  if (seo.title) {
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  }
  if (seo.description) {
    out = upsertMetaTag(out, "name", "description", seo.description);
  }
  if (seo.robots) {
    out = upsertMetaTag(out, "name", "robots", seo.robots);
  }
  if (seo.canonical) {
    out = out.replace(
      /<link[^>]+rel=["']canonical["'][^>]*>/i,
      `<link rel="canonical" href="${escapeAttr(seo.canonical)}" />`,
    );
    if (!/<link[^>]+rel=["']canonical["']/i.test(out)) {
      out = out.replace(
        /<\/head>/i,
        `    <link rel="canonical" href="${escapeAttr(seo.canonical)}" />\n  </head>`,
      );
    }
  }
  const og = {
    "og:title": seo.title,
    "og:description": seo.description,
    "og:url": seo.canonical,
    "og:image": seo.image,
    "og:type": seo.type || "website",
    "og:site_name": "Unwrapped",
  };
  for (const [k, v] of Object.entries(og)) {
    if (v) out = upsertMetaTag(out, "property", k, v);
  }
  const tw = {
    "twitter:card": "summary_large_image",
    "twitter:title": seo.title,
    "twitter:description": seo.description,
    "twitter:image": seo.image,
  };
  for (const [k, v] of Object.entries(tw)) {
    if (v) out = upsertMetaTag(out, "name", k, v);
  }

  if (seo.jsonLd) {
    const items = Array.isArray(seo.jsonLd) ? seo.jsonLd : [seo.jsonLd];
    const scripts = items
      .map(
        (item) =>
          `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, "\\u003c")}</script>`,
      )
      .join("\n    ");
    out = out.replace(/<\/head>/i, `    ${scripts}\n  </head>`);
  }

  if (seo.bodyHtml) {
    out = out.replace(
      /<div id="root"><\/div>/i,
      `<div id="root"></div>\n    <noscript>${seo.bodyHtml}</noscript>`,
    );
  }

  return out;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function upsertMetaTag(html, attr, key, content) {
  const re = new RegExp(
    `<meta[^>]+${attr}=["']${key}["'][^>]*>`,
    "i",
  );
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

async function fetchSeo(pathname) {
  const url = `${API}/api/seo/meta?path=${encodeURIComponent(pathname)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function readIndex() {
  return readFileSync(join(DIST, "index.html"), "utf8");
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || "shopunwrapped.com";
    const url = new URL(req.url || "/", `https://${host}`);
    const pathname = url.pathname;
    const ua = req.headers["user-agent"] || "";

    // Static asset if it exists on disk
    const filePath = safeJoin(DIST, pathname === "/" ? "/index.html" : pathname);
    if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      // Never bot-inject binary/static assets
      if (ext && ext !== ".html") {
        const body = readFileSync(filePath);
        return send(res, 200, body, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
        });
      }
    }

    // SPA shell (possibly with bot SEO injection)
    let html = readIndex();
    if (isBot(ua)) {
      const seo = await fetchSeo(pathname);
      if (seo) html = injectSeo(html, seo);
    }

    return send(res, 200, html, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
  } catch (err) {
    console.error("[seo-server]", err);
    return send(res, 500, "Internal Server Error", { "Content-Type": "text/plain" });
  }
});

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`[seo-server] missing ${join(DIST, "index.html")} — run vite build first`);
  process.exit(1);
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[seo-server] listening on :${PORT} (API=${API})`);
});
