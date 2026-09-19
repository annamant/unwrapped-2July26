/**
 * Pure HTML SEO injection used by seo-server.mjs.
 * Keeps the Vite shell's homepage tags, then overwrites title / description /
 * canonical / OG / Twitter / JSON-LD for the actual request path.
 */

export const SITE = "https://shopunwrapped.com";
export const DEFAULT_TITLE =
  "Unwrapped · Grab specials from shops near you before they're gone.";
export const DEFAULT_DESCRIPTION =
  "Local shops post photos and videos of limited deals. You see it, claim it on your phone, and collect it in person. Never miss what's around the corner.";
export const DEFAULT_OG = `${SITE}/og-image.png`;

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function escapeAttr(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

export function upsertMetaTag(html, attr, key, content) {
  const re = new RegExp(`<meta[^>]+${attr}=["']${escapeRegExp(key)}["'][^>]*>`, "i");
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

/** Keep name=googlebot aligned with name=robots so Googlebot does not keep the homepage index tag. */
export function googlebotFromRobots(robots) {
  const value = String(robots || "").toLowerCase();
  if (value.includes("noindex") && value.includes("nofollow")) return "noindex, nofollow";
  if (value.includes("noindex")) return "noindex, follow";
  return "index, follow, max-image-preview:large";
}

/** Cache-Control for files served from dist/. Robots/sitemap must stay refreshable. */
export function cacheControlForAsset(filePath, ext) {
  const name = String(filePath).split(/[/\\]/).pop().toLowerCase();
  if (name === "robots.txt" || name === "sitemap.xml") {
    return "public, max-age=300";
  }
  return ext === ".html" ? "no-cache" : "public, max-age=31536000, immutable";
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripJsonLd(html) {
  return html.replace(
    /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
}

function titleCaseSlug(slug) {
  return decodeURIComponent(slug)
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Last-resort tags when /api/seo/meta is unreachable.
 * Canonical / og:url always match the request path — never the homepage.
 */
export function fallbackSeo(pathname) {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
  const canonical = path === "/" ? `${SITE}/` : `${SITE}${path}`;
  const base = {
    description: DEFAULT_DESCRIPTION,
    canonical,
    image: DEFAULT_OG,
    type: "website",
  };

  if (path === "/") {
    return { ...base, title: DEFAULT_TITLE };
  }
  if (path === "/london") {
    return {
      ...base,
      title: "London boroughs — Unwrapped",
      description:
        "Grab specials from shops near you before they're gone. Local shops post photos and videos of limited deals — claim in the app, collect at the counter. Launching densest in South London, with a page for every borough.",
      bodyHtml:
        "<article><h1>London boroughs</h1><p>Neighbourhood pages for every London borough.</p></article>",
    };
  }
  const borough = path.match(/^\/london\/([^/]+)$/);
  if (borough) {
    const name = titleCaseSlug(borough[1]);
    return {
      ...base,
      title: `${name} high street drops — Unwrapped (London)`,
      bodyHtml: `<article><h1>${escapeHtml(name)} on Unwrapped</h1></article>`,
    };
  }
  const biz = path.match(/^\/business\/([^/]+)$/);
  if (biz) {
    const name = titleCaseSlug(biz[1]);
    return {
      ...base,
      title: `${name} — Unwrapped`,
      bodyHtml: `<article><h1>${escapeHtml(name)}</h1></article>`,
    };
  }
  const drop = path.match(/^\/drop\/([^/]+)$/);
  if (drop) {
    return {
      ...base,
      title: "Drop — Unwrapped",
      type: "product",
      robots: "noindex, follow",
      bodyHtml: "<article><h1>Drop on Unwrapped</h1></article>",
    };
  }
  return {
    ...base,
    title: "Unwrapped",
    bodyHtml: `<article><h1>Unwrapped</h1></article>`,
  };
}

export function injectSeo(html, seo) {
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
    out = upsertMetaTag(out, "name", "googlebot", googlebotFromRobots(seo.robots));
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
    "og:image:alt": seo.title,
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

  // Deep links must not keep the homepage Organization/WebSite JSON-LD.
  out = stripJsonLd(out);
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
    if (/<noscript[\s\S]*?<\/noscript>/i.test(out)) {
      out = out.replace(/<noscript[\s\S]*?<\/noscript>/i, `<noscript>${seo.bodyHtml}</noscript>`);
    } else {
      out = out.replace(
        /<div id="root"><\/div>/i,
        `<div id="root"></div>\n    <noscript>${seo.bodyHtml}</noscript>`,
      );
    }
  }

  return out;
}
