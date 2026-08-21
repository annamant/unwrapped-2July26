/**
 * Post-build sitemap writer.
 * Merges static marketing URLs with live business + drop URLs from the API.
 * Falls back to static-only if the API is unreachable (e.g. local build).
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const SITE = "https://shopunwrapped.com";
const API =
  process.env.VITE_API_URL?.replace(/\/$/, "") ||
  process.env.API_URL?.replace(/\/$/, "") ||
  "https://unwrapped-2july26-production.up.railway.app";

const STATIC_PAGES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/business-apply", priority: "0.8", changefreq: "monthly" },
  { path: "/recommend", priority: "0.7", changefreq: "monthly" },
  { path: "/instagram", priority: "0.6", changefreq: "weekly" },
  { path: "/resources", priority: "0.6", changefreq: "monthly" },
  { path: "/london", priority: "0.9", changefreq: "weekly" },
  // South London launch priority
  { path: "/london/lambeth", priority: "0.85", changefreq: "weekly" },
  { path: "/london/wandsworth", priority: "0.85", changefreq: "weekly" },
  { path: "/london/southwark", priority: "0.85", changefreq: "weekly" },
  { path: "/london/lewisham", priority: "0.85", changefreq: "weekly" },
  { path: "/london/greenwich", priority: "0.85", changefreq: "weekly" },
  { path: "/london/croydon", priority: "0.85", changefreq: "weekly" },
  { path: "/london/bromley", priority: "0.85", changefreq: "weekly" },
  { path: "/london/merton", priority: "0.85", changefreq: "weekly" },
  { path: "/london/kingston-upon-thames", priority: "0.85", changefreq: "weekly" },
  { path: "/london/sutton", priority: "0.85", changefreq: "weekly" },
  { path: "/london/richmond-upon-thames", priority: "0.85", changefreq: "weekly" },
  { path: "/london/bexley", priority: "0.85", changefreq: "weekly" },
  // Rest of London
  { path: "/london/westminster", priority: "0.7", changefreq: "weekly" },
  { path: "/london/city-of-london", priority: "0.7", changefreq: "weekly" },
  { path: "/london/camden", priority: "0.7", changefreq: "weekly" },
  { path: "/london/islington", priority: "0.7", changefreq: "weekly" },
  { path: "/london/kensington-and-chelsea", priority: "0.7", changefreq: "weekly" },
  { path: "/london/hackney", priority: "0.7", changefreq: "weekly" },
  { path: "/london/tower-hamlets", priority: "0.7", changefreq: "weekly" },
  { path: "/london/newham", priority: "0.7", changefreq: "weekly" },
  { path: "/london/waltham-forest", priority: "0.7", changefreq: "weekly" },
  { path: "/london/redbridge", priority: "0.7", changefreq: "weekly" },
  { path: "/london/barking-and-dagenham", priority: "0.7", changefreq: "weekly" },
  { path: "/london/havering", priority: "0.7", changefreq: "weekly" },
  { path: "/london/haringey", priority: "0.7", changefreq: "weekly" },
  { path: "/london/enfield", priority: "0.7", changefreq: "weekly" },
  { path: "/london/barnet", priority: "0.7", changefreq: "weekly" },
  { path: "/london/hammersmith-and-fulham", priority: "0.7", changefreq: "weekly" },
  { path: "/london/ealing", priority: "0.7", changefreq: "weekly" },
  { path: "/london/hounslow", priority: "0.7", changefreq: "weekly" },
  { path: "/london/brent", priority: "0.7", changefreq: "weekly" },
  { path: "/london/harrow", priority: "0.7", changefreq: "weekly" },
  { path: "/london/hillingdon", priority: "0.7", changefreq: "weekly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

function esc(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc, { lastmod, changefreq, priority } = {}) {
  const parts = [`    <loc>${esc(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${esc(lastmod)}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

function day(d) {
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

async function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function main() {
  const entries = STATIC_PAGES.map((p) =>
    urlEntry(`${SITE}${p.path === "/" ? "/" : p.path}`, {
      changefreq: p.changefreq,
      priority: p.priority,
    }),
  );

  let bizCount = 0;
  let dropCount = 0;

  try {
    const data = await fetchJson(`${API}/api/sitemap.json`);
    const businesses = data?.businesses ?? [];
    const drops = data?.drops ?? [];

    for (const b of businesses) {
      if (!b?.slug) continue;
      entries.push(
        urlEntry(`${SITE}/business/${b.slug}`, {
          lastmod: day(b.lastmod),
          changefreq: "weekly",
          priority: "0.7",
        }),
      );
      bizCount++;
    }
    for (const d of drops) {
      if (!d?.id) continue;
      entries.push(
        urlEntry(`${SITE}/drop/${d.id}`, {
          lastmod: day(d.lastmod),
          changefreq: "hourly",
          priority: "0.8",
        }),
      );
      dropCount++;
    }
    console.log(`[sitemap] API ok — ${bizCount} businesses, ${dropCount} drops`);
  } catch (err) {
    console.warn(`[sitemap] API unavailable (${err?.message ?? err}) — writing static URLs only`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join("\n") +
    `\n</urlset>\n`;

  if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });
  writeFileSync(join(DIST, "sitemap.xml"), xml, "utf8");
  // Keep public/ in sync so local preview / accidental static deploys still work.
  writeFileSync(join(ROOT, "public", "sitemap.xml"), xml, "utf8");
  console.log(`[sitemap] wrote ${entries.length} URLs → dist/sitemap.xml`);
}

main().catch((err) => {
  console.error("[sitemap] failed:", err);
  process.exitCode = 1;
});
