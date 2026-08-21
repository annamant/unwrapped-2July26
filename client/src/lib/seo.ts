/** Site-wide SEO constants and helpers for Unwrapped (shopunwrapped.com). */

import { getBoroughBySlug, boroughSeo, londonHubSeo, boroughJsonLd, londonHubJsonLd } from "./londonBoroughs";

export const SITE_ORIGIN = "https://shopunwrapped.com";
export const SITE_NAME = "Unwrapped";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.png`;
export const DEFAULT_TITLE = "Unwrapped — see it, claim it, collect it on your London high street";
export const DEFAULT_DESCRIPTION =
  "Unwrapped (London): look into your high street from anywhere — see what's ready in a photo or short video, claim in the app, collect at the counter. Launching in South London. Not mystery bags — local shopping you can see.";

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
  ];
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
        title: `List your shop on ${SITE_NAME}`,
        description:
          "Apply to publish photo and video drops on Unwrapped — local shoppers see the real thing, claim in the app, and collect at your counter.",
        path,
      };
    case "/recommend":
      return {
        title: `Recommend a shop — ${SITE_NAME}`,
        description:
          "Know a brilliant independent on your high street? Recommend them for Unwrapped — see it, claim it, collect it.",
        path,
      };
    case "/instagram":
      return {
        title: `Live drops for Instagram — ${SITE_NAME}`,
        description:
          "See what's live on Unwrapped right now — shareable drops from London high streets.",
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
