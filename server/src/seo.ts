import { and, eq, gte, sql } from "drizzle-orm";
import { businesses, drops, users } from "./db/schema";
import { db } from "./db";
import { claimedPartnerSql, isIndexablePartner, isTestShop } from "./seoIndexable";
import {
  LONDON_BOROUGHS,
  boroughJsonLd,
  boroughSeo,
  getBoroughBySlug,
  londonHubJsonLd,
  londonHubSeo,
  shopMatchesBorough,
} from "./londonBoroughs";

const SITE = () =>
  (process.env.CLIENT_URL ?? "https://shopunwrapped.com").split(",")[0].trim().replace(/\/$/, "") ||
  "https://shopunwrapped.com";

const DEFAULT_OG = () => `${SITE()}/og-image.png`;

const DEFAULT_TITLE = "Unwrapped — Your high street, live.";
const DEFAULT_DESCRIPTION =
  "Shops post a photo of the exact item. You see it, claim it in the app, collect in person.";

const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: "What is Unwrapped?",
    a: "Your high street, live. Shops post a photo of the exact item. You see it, claim it in the app, and collect in person.",
  },
  {
    q: "How does it work?",
    a: "See it. Claim it. Collect it. A bakery posts the loaf that just came out. A boutique shows the jacket on the rail. You see the actual item in a photo or video, claim it before someone else does, and walk in to collect it — no guessing, no waiting for delivery.",
  },
  {
    q: "How do I collect?",
    a: "Claim and pay in the app, then walk in and collect in person. You get a QR for the collection window.",
  },
  {
    q: "Where is Unwrapped launching?",
    a: "London. Opening soon — densest first in South London, neighbourhood by neighbourhood.",
  },
];

const MERCHANT_FAQS: { q: string; a: string }[] = [
  {
    q: "Is this another deep-discount app?",
    a: "No. You set the price and quantity. Drops are about showing what's ready and getting people through your door — not training locals to only buy on slash prices.",
  },
  {
    q: "Do I have to build a catalog?",
    a: "No. When you have something to drop, upload a photo or short video, add a title, price, and quantity, and publish. Under a minute.",
  },
  {
    q: "What if they don't show up?",
    a: "They pay when they claim. You set the collection window. You're not holding stock for a maybe.",
  },
  {
    q: "Who is Unwrapped for?",
    a: "Local high-street shops — bakeries, florists, bookshops, beauty, fashion, wine, specialty food, and charity shops. If people can collect from you in person during a window, you can list a drop.",
  },
];

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
  /** HTTP status hint for the SEO shell server (defaults to 200). */
  status?: number;
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
    title: "Apply to partner your shop — Unwrapped",
    description:
      "Get seen — so you can sell and welcome customers through the door. Publish a photo or short clip, set your price, and welcome customers who already paid.",
    type: "website",
  },
  "/recommend": {
    path: "/recommend",
    title: "Recommend a shop — Unwrapped",
    description:
      "Know a shop you'd really love on Unwrapped? Recommend a bakery, florist, bookshop, boutique, or charity shop — you don't need to own the business.",
    type: "website",
  },
  "/instagram": {
    path: "/instagram",
    title: "Live drops for Instagram — Unwrapped",
    description:
      "See what's live on Unwrapped right now — video and photos of what's just landed on London high streets. See it, claim it, collect it.",
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
  "/london": {
    path: "/london",
    title: londonHubSeo().title,
    description: londonHubSeo().description,
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
      areaServed: {
        "@type": "City",
        name: "London",
        containedInPlace: { "@type": "Country", name: "United Kingdom" },
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "London",
        addressCountry: "GB",
      },
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
      inLanguage: "en-GB",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: HOME_FAQS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ];
}

function merchantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MERCHANT_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export async function buildSitemapPayload(): Promise<{
  businesses: { slug: string; lastmod: string }[];
  drops: { id: string; lastmod: string }[];
}> {
  const now = new Date();
  const bizRows = await db
    .select({
      slug: businesses.slug,
      name: businesses.name,
      lastmod: sql<string>`coalesce(${businesses.approvedAt}, ${businesses.createdAt})`,
    })
    .from(businesses)
    .innerJoin(users, eq(businesses.ownerId, users.id))
    .where(claimedPartnerSql);

  const dropRows = await db
    .select({
      id: drops.id,
      lastmod: drops.createdAt,
      businessName: businesses.name,
      businessSlug: businesses.slug,
    })
    .from(drops)
    .innerJoin(businesses, eq(drops.businessId, businesses.id))
    .innerJoin(users, eq(businesses.ownerId, users.id))
    .where(and(eq(drops.status, "active"), gte(drops.collectionEnd, now), claimedPartnerSql));

  return {
    businesses: bizRows
      .filter((b) => !isTestShop(b.name, b.slug))
      .map((b) => ({
        slug: b.slug,
        lastmod: new Date(b.lastmod).toISOString(),
      })),
    drops: dropRows
      .filter((d) => !isTestShop(d.businessName, d.businessSlug))
      .map((d) => ({
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
  push(abs("/london"), undefined, "weekly", "0.9");
  for (const b of LONDON_BOROUGHS) {
    push(abs(`/london/${b.slug}`), undefined, "weekly", b.region === "south" ? "0.85" : "0.7");
  }
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
        contactEmail: businesses.contactEmail,
        passwordHash: users.passwordHash,
        status: businesses.status,
      })
      .from(businesses)
      .innerJoin(users, eq(businesses.ownerId, users.id))
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

    const indexable = isIndexablePartner({
      name: biz.name,
      slug: biz.slug,
      status: biz.status,
      contactEmail: biz.contactEmail,
      passwordHash: biz.passwordHash,
    });

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
      robots: indexable ? "index, follow" : "noindex, follow",
      jsonLd: indexable
        ? {
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
          }
        : undefined,
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
        contactEmail: businesses.contactEmail,
        passwordHash: users.passwordHash,
        businessStatus: businesses.status,
      })
      .from(drops)
      .innerJoin(businesses, eq(drops.businessId, businesses.id))
      .innerJoin(users, eq(businesses.ownerId, users.id))
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

    const dropIndexable = isIndexablePartner({
      name: row.businessName,
      slug: row.businessSlug,
      status: row.businessStatus,
      contactEmail: row.contactEmail,
      passwordHash: row.passwordHash,
    });

    return {
      title,
      description: desc,
      canonical: abs(`/drop/${row.dropId}`),
      image,
      type: "product",
      robots: dropIndexable ? "index, follow" : "noindex, follow",
      jsonLd: dropIndexable
        ? {
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
      }
        : undefined,
      bodyHtml: `<article><h1>${escapeHtml(row.title)}</h1><p>From ${escapeHtml(row.businessName)}</p><p>${escapeHtml(desc)}</p><p><a href="${escapeHtml(abs(`/drop/${row.dropId}`))}">Claim on Unwrapped</a></p></article>`,
    };
  }

  const boroughMatch = path.match(/^\/london\/([^/]+)$/);
  if (boroughMatch) {
    const borough = getBoroughBySlug(decodeURIComponent(boroughMatch[1]));
    if (!borough) {
      return {
        title: "Borough not found — Unwrapped",
        description: DEFAULT_DESCRIPTION,
        canonical: abs(path),
        image: DEFAULT_OG(),
        type: "website",
        robots: "noindex, follow",
        status: 404,
      };
    }
    const s = boroughSeo(borough);
    const bizRows = await db
      .select({
        name: businesses.name,
        slug: businesses.slug,
        city: businesses.city,
        postcode: businesses.postcode,
        address: businesses.address,
        category: businesses.category,
      })
      .from(businesses)
      .innerJoin(users, eq(businesses.ownerId, users.id))
      .where(claimedPartnerSql);

    const matched = bizRows
      .filter((b) => !isTestShop(b.name, b.slug) && shopMatchesBorough(b, borough))
      .slice(0, 40);

    const shopLinks = matched
      .map(
        (b) =>
          `<li><a href="${escapeHtml(abs(`/business/${b.slug}`))}">${escapeHtml(b.name)}</a>${b.city || b.postcode ? ` — ${escapeHtml([b.city, b.postcode].filter(Boolean).join(", "))}` : ""}</li>`,
      )
      .join("");

    return {
      title: s.title,
      description: truncate(s.description),
      canonical: abs(s.path),
      image: DEFAULT_OG(),
      type: "website",
      robots: "index, follow",
      jsonLd: boroughJsonLd(
        borough,
        matched.map((b) => ({ name: b.name, slug: b.slug })),
      ),
      bodyHtml: `<article><h1>${escapeHtml(borough.name)} on Unwrapped</h1><p>${escapeHtml(borough.blurb)}</p><p>Neighbourhoods: ${escapeHtml(borough.neighbourhoods.join(", "))}</p>${matched.length ? `<h2>Shops in ${escapeHtml(borough.name)}</h2><ul>${shopLinks}</ul>` : `<p>We're onboarding ${escapeHtml(borough.name)} shops now.</p>`}<p><a href="${escapeHtml(abs("/london"))}">All London boroughs</a> · <a href="${escapeHtml(abs("/business-apply"))}">Apply to partner your shop</a></p></article>`,
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
      jsonLd:
        path === "/"
          ? homeJsonLd()
          : path === "/london"
            ? londonHubJsonLd()
            : path === "/business-apply"
              ? merchantJsonLd()
              : undefined,
      bodyHtml:
        path === "/"
          ? `<article><h1>Your high street, live.</h1><p>London · Opening soon</p><p>${escapeHtml(DEFAULT_DESCRIPTION)}</p><h2>See it. Claim it. Collect it.</h2><p>A bakery posts the loaf that just came out. A boutique shows the jacket on the rail. You see the actual item in a photo or video, claim it before someone else does, and walk in to collect it — no guessing, no waiting for delivery.</p><p><a href="${escapeHtml(abs("/london"))}">London boroughs</a> · <a href="${escapeHtml(abs("/business-apply"))}">Partner with us</a> · <a href="${escapeHtml(SITE())}">shopunwrapped.com</a></p></article>`
          : path === "/london"
            ? `<article><h1>London boroughs</h1><p>${escapeHtml(staticPage.description)}</p><ul>${LONDON_BOROUGHS.map((b) => `<li><a href="${escapeHtml(abs(`/london/${b.slug}`))}">${escapeHtml(b.name)}</a> — ${escapeHtml(b.neighbourhoods.slice(0, 3).join(", "))}</li>`).join("")}</ul></article>`
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
    status: 404,
  };
}
