/**
 * Production static server with per-route meta injection.
 *
 * Serves Vite `dist/` with SPA fallback. For every HTML request except `/`,
 * fetches SEO payload from the API and injects title/description/canonical/OG/
 * JSON-LD into the HTML shell before responding — so `curl`, view-source,
 * Google, and social crawlers all see tags that match the actual URL.
 *
 * The homepage (`/`) is served from `index.html` as-is (already correct).
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
import { fallbackSeo, injectSeo } from "./seo-inject.mjs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = process.env.DIST_DIR || join(ROOT, "dist");
const PORT = Number(process.env.PORT || 4173);
const API = (
  process.env.API_URL ||
  process.env.VITE_API_URL ||
  "https://unwrapped-2july26-production.up.railway.app"
).replace(/\/$/, "");

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

const SEO_TTL_MS = 60_000;
const seoCache = new Map();

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

async function fetchSeo(pathname) {
  const hit = seoCache.get(pathname);
  if (hit && hit.expires > Date.now()) return hit.data;

  const url = `${API}/api/seo/meta?path=${encodeURIComponent(pathname)}`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 4_000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    seoCache.set(pathname, { expires: Date.now() + SEO_TTL_MS, data });
    return data;
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

    // Static asset if it exists on disk
    const filePath = safeJoin(DIST, pathname === "/" ? "/index.html" : pathname);
    if (filePath && existsSync(filePath) && statSync(filePath).isFile()) {
      const ext = extname(filePath).toLowerCase();
      // Never inject into binary/static assets
      if (ext && ext !== ".html") {
        const body = readFileSync(filePath);
        return send(res, 200, body, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable",
        });
      }
    }

    // SPA shell (with per-route SEO injection on every non-home HTML request)
    let html = readIndex();
    let status = 200;
    // Canonical paths are slash-free except `/`
    const seoPath = pathname.length > 1 && pathname.endsWith("/") ? pathname.replace(/\/+$/, "") : pathname;
    if (seoPath !== "/") {
      const seo = (await fetchSeo(seoPath)) || fallbackSeo(seoPath);
      html = injectSeo(html, seo);
      if (typeof seo.status === "number" && seo.status >= 400) status = seo.status;
    }

    return send(res, status, html, {
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
