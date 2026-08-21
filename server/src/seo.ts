import { and, eq, gte, sql } from "drizzle-orm";
import { businesses, drops } from "./db/schema";
import { db } from "./db";

const SITE = () =>
  (process.env.CLIENT_URL ?? "https://shopunwrapped.com").split(",")[0].trim().replace(/\/$/, "") ||
  "https://shopunwrapped.com";

const DEFAULT_OG = () => `${SITE()}/og-image.png`;

const DEFAULT_TITLE = "Unwrapped — see it, claim it, collect it on your high street";
const DEFAULT_DESCRIPTION =
  "Unwrapped: look into your high street from anywhere — see what's ready in a photo or short video, claim in the app, collect at the counter. Not mystery bags — local shopping you can see.";

function abs(path: string): string {
  return `${SITE()}${path.startsWith("/") ? path : `/${path}`}`;
}

function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type SeoPayload = {
  title: string;
  description: string;
  canonical: string;
  image: string;
  type: string;
  robots: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  bodyHtml?: string;
};

const STATIC: Record<string, Omit<SeoPayload, "canonical" | "image" | "robots"> & { path: string; noindex?: boolean }> = {
  "/": {
    path: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    type: "website",
  },
  "/business-apply": {
    path: "/business-apply",
    title: "List your shop on Unwrapped",
    description:
      "Apply to publish photo and video drops on Unwrapped — local shoppers see the real thing, claim in the app, and collect at your counter.",
    type: "website",
  },
  "/recommend": {
    path: "/recommend",
    title: "Recommend a shop — Unwrapped",
    description:
      "Know a brilliant independent on your high street? Recommend them for Unwrapped — see it, claim it, collect it.",
    type: "website",
  },
  "/instagram": {
    path: "/instagram",
    title: "Live drops for Instagram — Unwrapped",
    description: "See what's live on Unwrapped right now — shareable drops from London high streets.",
    type: "website",
  },
  "/resources": {
    path: "/resources",
    title: "Brand resources — Unwrapped",
    description: "Posters, assets, and resources for Unwrapped partner shops and the neighbourhood.",
    type: "website",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy — Unwrapped",
    description: "How Unwrapped collects, uses, and protects your personal data.",
    type: "website",
  },
  "/terms": {
    path: "/terms",
    title: "Terms & Conditions — Unwrapped",
    description: "Terms governing use of Unwrapped at shopunwrapped.com.",
    type: "website",
  },
};

function homeJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Unwrapped",
      url: SITE(),
      logo: `${SITE()}/icon-512.png`,
      email: "anna@shopunwrapped.com",
      sameAs: [
        "https://www.instagram.com/shopunwrapped/",
        "https://www.linkedin.com/company/shopunwrapped/",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Unwrapped",
      url: SITE(),
      description: DEFAULT_DESCRIPTION,
    },
  ];
}

export async function buildSitemapPayload(): Promise<{
  businesses: { slug: string; lastmod: string }[];
  drops: { id: string; lastmod: string }[];
}> {
  const now = new Date();
  const bizRows = await db
    .select({
      slug: businesses.slug,
      lastmod: sql<string>`coalesce(${businesses.approvedAt}, ${businesses.createdAt})`,
    })
    .from(businesses)
    .where(eq(businesses.status, "active"));

  const dropRows = await db
    .select({
      id: drops.id,
      lastmod: drops.createdAt,
    })
    .from(drops)
    .where(and(eq(drops.status, "active"), gte(drops.collectionEnd, now)));

  return {
    businesses: bizRows.map((b) => ({
      slug: b.slug,
      lastmod: new Date(b.lastmod).toISOString(),
    })),
    drops: dropRows.map((d) => ({
      id: d.id,
      lastmod: new Date(d.lastmod).toISOString(),
    })),
  };
}

export function renderSitemapXml(payload: {
  businesses: { slug: string; lastmod: string }[];
  drops: { id: string; lastmod: string }[];
}): string {
  const urls: string[] = [];
  const push = (loc: string, lastmod?: string, changefreq?: string, priority?: string) => {
    urls.push(
      [
        "  <url>",
        `    <loc>${escapeXml(loc)}</loc>`,
        lastmod ? `    <lastmod>${escapeXml(lastmod.slice(0, 10))}</lastmod>` : "",
        changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
        priority ? `    <priority>${priority}</priority>` : "",
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  };

  push(abs("/"), undefined, "daily", "1.0");
  push(abs("/business-apply"), undefined, "monthly", "0.8");
  push(abs("/recommend"), undefined, "monthly", "0.7");
  push(abs("/instagram"), undefined, "weekly", "0.6");
  push(abs("/resources"), undefined, "monthly", "0.6");
  push(abs("/privacy"), undefined, "yearly", "0.3");
  push(abs("/terms"), undefined, "yearly", "0.3");

  for (const b of payload.businesses) {
    push(abs(`/business/${b.slug}`), b.lastmod, "weekly", "0.7");
  }
  for (const d of payload.drops) {
    push(abs(`/drop/${d.id}`), d.lastmod, "hourly", "0.8");
  }

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function resolveSeoMeta(pathname: string): Promise<SeoPayload> {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";

  // Private app surfaces
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/ticket/") ||
    path === "/home" ||
    path === "/profile" ||
    path === "/onboarding" ||
    path === "/signin" ||
    path === "/business/signin" ||
    path === "/reset-password"
  ) {
    return {
      title: "Unwrapped",
      description: DEFAULT_DESCRIPTION,
      canonical: abs(path),
      image: DEFAULT_OG(),
      type: "website",
      robots: "noindex, nofollow",
    };
  }

  const bizMatch = path.match(/^\/business\/([^/]+)$/);
  if (bizMatch) {
    const slug = decodeURIComponent(bizMatch[1]);
    const [biz] = await db
      .select({
        name: businesses.name,
        slug: businesses.slug,
        description: businesses.description,
        category: businesses.category,
        logoUrl: businesses.logoUrl,
        coverUrl: businesses.coverUrl,
        address: businesses.address,
        postcode: businesses.postcode,
        city: businesses.city,
        website: businesses.website,
        instagramHandle: businesses.instagramHandle,
      })
      .from(businesses)
      .where(and(eq(businesses.slug, slug), eq(businesses.status, "active")))
      .limit(1);

    if (!biz) {
      return {
        title: "Business not found — Unwrapped",
        description: DEFAULT_DESCRIPTION,
        canonical: abs(path),
        image: DEFAULT_OG(),
        type: "website",
        robots: "noindex, follow",
      };
    }

    const desc = truncate(
      biz.description ||
        `${biz.name} on Unwrapped — see drops from this ${biz.city || "London"} shop, claim in the app, collect at the counter.`,
    );
    const image = biz.coverUrl || biz.logoUrl || DEFAULT_OG();
    const title = `${biz.name} — Unwrapped`;
    const sameAs: string[] = [];
    if (biz.website) {
      sameAs.push(biz.website.startsWith("http") ? biz.website : `https://${biz.website}`);
    }
    if (biz.instagramHandle) {
      sameAs.push(`https://instagram.com/${biz.instagramHandle.replace(/^@/, "")}`);
    }

    return {
      title,
      description: desc,
      canonical: abs(`/business/${biz.slug}`),
      image,
      type: "website",
      robots: "index, follow",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: biz.name,
        url: abs(`/business/${biz.slug}`),
        description: biz.description || undefined,
        image,
        category: biz.category || undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: biz.address || undefined,
          addressLocality: biz.city || "London",
          postalCode: biz.postcode || undefined,
          addressCountry: "GB",
        },
        ...(sameAs.length ? { sameAs } : {}),
      },
      bodyHtml: `<article><h1>${escapeHtml(biz.name)}</h1><p>${escapeHtml(desc)}</p><p><a href="${escapeHtml(abs(`/business/${biz.slug}`))}">View on Unwrapped</a></p></article>`,
    };
  }

  const dropMatch = path.match(/^\/drop\/([^/]+)$/);
  if (dropMatch) {
    const id = decodeURIComponent(dropMatch[1]);
    const [row] = await db
      .select({
        dropId: drops.id,
        title: drops.title,
        description: drops.description,
        imageUrl: drops.imageUrl,
        price: drops.price,
        availableQuantity: drops.availableQuantity,
        status: drops.status,
        businessName: businesses.name,
        businessSlug: businesses.slug,
      })
      .from(drops)
      .innerJoin(businesses, eq(drops.businessId, businesses.id))
      .where(eq(drops.id, id))
      .limit(1);

    if (!row || (row.status !== "active" && row.status !== "sold_out")) {
      return {
        title: "Drop not found — Unwrapped",
        description: DEFAULT_DESCRIPTION,
        canonical: abs(path),
        image: DEFAULT_OG(),
        type: "website",
        robots: "noindex, follow",
      };
    }

    const desc = truncate(
      row.description ||
        `${row.title} from ${row.businessName} on Unwrapped — see it, claim it, collect it on your high street.`,
    );
    const image = row.imageUrl || DEFAULT_OG();
    const title = `${row.title} · ${row.businessName} — Unwrapped`;

    return {
      title,
      description: desc,
      canonical: abs(`/drop/${row.dropId}`),
      image,
      type: "product",
      robots: "index, follow",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: row.title,
        description: row.description || undefined,
        image,
        url: abs(`/drop/${row.dropId}`),
        brand: {
          "@type": "Brand",
          name: row.businessName,
          url: abs(`/business/${row.businessSlug}`),
        },
        offers: {
          "@type": "Offer",
          url: abs(`/drop/${row.dropId}`),
          priceCurrency: "GBP",
          price: (row.price / 100).toFixed(2),
          availability:
            row.availableQuantity > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
        },
      },
      bodyHtml: `<article><h1>${escapeHtml(row.title)}</h1><p>From ${escapeHtml(row.businessName)}</p><p>${escapeHtml(desc)}</p><p><a href="${escapeHtml(abs(`/drop/${row.dropId}`))}">Claim on Unwrapped</a></p></article>`,
    };
  }

  const staticPage = STATIC[path];
  if (staticPage) {
    return {
      title: staticPage.title,
      description: staticPage.description,
      canonical: abs(staticPage.path),
      image: DEFAULT_OG(),
      type: staticPage.type,
      robots: staticPage.noindex ? "noindex, nofollow" : "index, follow",
      jsonLd: path === "/" ? homeJsonLd() : undefined,
      bodyHtml:
        path === "/"
          ? `<article><h1>Unwrapped</h1><p>${escapeHtml(DEFAULT_DESCRIPTION)}</p><p><a href="${escapeHtml(SITE())}">shopunwrapped.com</a></p></article>`
          : `<article><h1>${escapeHtml(staticPage.title)}</h1><p>${escapeHtml(staticPage.description)}</p></article>`,
    };
  }

  return {
    title: "Page not found — Unwrapped",
    description: DEFAULT_DESCRIPTION,
    canonical: abs(path),
    image: DEFAULT_OG(),
    type: "website",
    robots: "noindex, follow",
  };
}
