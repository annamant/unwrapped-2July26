import { useEffect } from "react";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_ORIGIN,
  absoluteUrl,
  type SeoProps,
  truncateMeta,
} from "../lib/seo";

const JSON_LD_ATTR = "data-unwrapped-jsonld";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown> | Record<string, unknown>[] | null | undefined) {
  document.head.querySelectorAll(`script[${JSON_LD_ATTR}]`).forEach((n) => n.remove());
  if (!data) return;
  const items = Array.isArray(data) ? data : [data];
  for (const item of items) {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute(JSON_LD_ATTR, "true");
    script.textContent = JSON.stringify(item);
    document.head.appendChild(script);
  }
}

/**
 * Sets document title, description, canonical, Open Graph, Twitter, robots,
 * and optional JSON-LD. Safe to call from many routes; last mount wins.
 */
export default function SeoHead({
  title,
  description,
  path = "/",
  image,
  noindex = false,
  type = "website",
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const fullTitle = title?.trim() || DEFAULT_TITLE;
    const desc = truncateMeta(description?.trim() || DEFAULT_DESCRIPTION);
    const url = absoluteUrl(path);
    const img = image?.trim() || DEFAULT_OG_IMAGE;

    document.title = fullTitle;

    upsertMeta("name", "description", desc);
    upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    upsertMeta("name", "googlebot", noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large");

    upsertLink("canonical", url);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:image", img);
    upsertMeta("property", "og:locale", "en_GB");

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    upsertMeta("name", "twitter:image", img);

    setJsonLd(jsonLd ?? null);
    // Serialize jsonLd so inline object literals from pages don't retrigger every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, image, noindex, type, JSON.stringify(jsonLd ?? null)]);

  return null;
}

export { SITE_ORIGIN, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE };
