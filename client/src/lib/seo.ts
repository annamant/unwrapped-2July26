/** Site-wide SEO constants and helpers for Unwrapped (shopunwrapped.com). */

import { getBoroughBySlug, boroughSeo, londonHubSeo, boroughJsonLd, londonHubJsonLd } from "./londonBoroughs";

export const SITE_ORIGIN = "https://shopunwrapped.com";
export const SITE_NAME = "Unwrapped";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const DEFAULT_TITLE = "Unwrapped — Your high street, live.";
export const DEFAULT_DESCRIPTION =
  "Shops post a photo of the exact item. You see it, claim it in the app, collect in person.";

/** Shopper FAQ for the homepage FAQPage JSON-LD — matches live landing copy. */
export const HOME_FAQS: { q: string; a: string }[] = [
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

/** Merchant FAQ for /business-apply. */
export const MERCHANT_FAQS: { q: string; a: string }[] = [
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

export type SeoProps = {
  title?: string;
  description?: string;
  /** Path only, e.g. `/business/foo` — becomes the canonical URL. */
  path?: string;
  image?: string | null;
  noindex?: boolean;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[] | null;
};

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  let p = path.startsWith("/") ? path : `/${path}`;
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");
  return `${SITE_ORIGIN}${p === "/" ? "/" : p}`;
}

export function truncateMeta(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

/** Organization + WebSite JSON-LD for the marketing homepage. */
export function homeJsonLd(): Record<string, unknown>[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/icon-512.png`,
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
      name: SITE_NAME,
      url: SITE_ORIGIN,
      description: DEFAULT_DESCRIPTION,
      publisher: { "@type": "Organization", name: SITE_NAME },
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

export function merchantJsonLd(): Record<string, unknown> {
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

export function businessJsonLd(input: {
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  address?: string | null;
  postcode?: string | null;
  city?: string | null;
  website?: string | null;
  instagramHandle?: string | null;
}): Record<string, unknown> {
  const url = absoluteUrl(`/business/${input.slug}`);
  const sameAs: string[] = [];
  if (input.website) {
    sameAs.push(input.website.startsWith("http") ? input.website : `https://${input.website}`);
  }
  if (input.instagramHandle) {
    const handle = input.instagramHandle.replace(/^@/, "");
    sameAs.push(`https://instagram.com/${handle}`);
  }
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url,
    description: input.description || undefined,
    image: input.image || DEFAULT_OG_IMAGE,
    category: input.category || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: input.address || undefined,
      addressLocality: input.city || "London",
      postalCode: input.postcode || undefined,
      addressCountry: "GB",
    },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function dropJsonLd(input: {
  id: string;
  title: string;
  description?: string | null;
  image?: string | null;
  pricePence: number;
  availableQuantity: number;
  businessName: string;
  businessSlug: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.title,
    description: input.description || undefined,
    image: input.image || DEFAULT_OG_IMAGE,
    url: absoluteUrl(`/drop/${input.id}`),
    brand: {
      "@type": "Brand",
      name: input.businessName,
      url: absoluteUrl(`/business/${input.businessSlug}`),
    },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/drop/${input.id}`),
      priceCurrency: "GBP",
      price: (input.pricePence / 100).toFixed(2),
      availability:
        input.availableQuantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
  };
}

/** Default SEO for a path when the page itself does not set richer tags. */
export function seoForPath(pathname: string): SeoProps {
  const path = pathname.split("?")[0] || "/";

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
      title: `${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      path,
      noindex: true,
    };
  }

  switch (path) {
    case "/":
      return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        path: "/",
        jsonLd: homeJsonLd(),
      };
    case "/business-apply":
      return {
        title: `Apply to partner your shop — ${SITE_NAME}`,
        description:
          "Get seen — so you can sell and welcome customers through the door. Publish a photo or short clip, set your price, and welcome customers who already paid.",
        path,
        jsonLd: merchantJsonLd(),
      };
    case "/recommend":
      return {
        title: `Recommend a shop — ${SITE_NAME}`,
        description:
          "Know a shop you'd really love on Unwrapped? Recommend a bakery, florist, bookshop, boutique, or charity shop — you don't need to own the business.",
        path,
      };
    case "/instagram":
      return {
        title: `Live drops for Instagram — ${SITE_NAME}`,
        description:
          "See what's live on Unwrapped right now — video and photos of what's just landed on London high streets. See it, claim it, collect it.",
        path,
      };
    case "/resources":
      return {
        title: `Brand resources — ${SITE_NAME}`,
        description:
          "Posters, assets, and resources for Unwrapped partner shops and the neighbourhood.",
        path,
      };
    case "/privacy":
      return {
        title: `Privacy Policy — ${SITE_NAME}`,
        description: "How Unwrapped collects, uses, and protects your personal data.",
        path,
      };
    case "/terms":
      return {
        title: `Terms & Conditions — ${SITE_NAME}`,
        description: "Terms governing use of Unwrapped at shopunwrapped.com.",
        path,
      };
    case "/london": {
      const hub = londonHubSeo();
      return { title: hub.title, description: hub.description, path: hub.path, jsonLd: londonHubJsonLd() };
    }
    default: {
      const boroughMatch = path.match(/^\/london\/([^/]+)$/);
      if (boroughMatch) {
        const borough = getBoroughBySlug(decodeURIComponent(boroughMatch[1]));
        if (borough) {
          const s = boroughSeo(borough);
          return {
            title: s.title,
            description: s.description,
            path: s.path,
            jsonLd: boroughJsonLd(borough),
          };
        }
        return {
          title: `Borough not found — ${SITE_NAME}`,
          description: DEFAULT_DESCRIPTION,
          path,
          noindex: true,
        };
      }
      if (path.startsWith("/business/") || path.startsWith("/drop/")) {
        // Page components set rich tags once data loads; keep indexable defaults.
        return {
          title: DEFAULT_TITLE,
          description: DEFAULT_DESCRIPTION,
          path,
        };
      }
      return {
        title: `Page not found — ${SITE_NAME}`,
        description: DEFAULT_DESCRIPTION,
        path,
        noindex: true,
      };
    }
  }
}
