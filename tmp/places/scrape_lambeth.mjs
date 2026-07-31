/**
 * Lambeth Google Places Text Search (New) — all Unwrapped categories × postcodes.
 * Reads GOOGLE_PLACES_API_KEY from server/.env. Does not print the key.
 *
 * Google does NOT return email or dedicated social fields. We capture everything
 * contact-related they expose: phone, websiteUri (sometimes Instagram), maps URI, address.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = __dirname;

const POSTCODES = [
  "SE1", "SE5", "SE11", "SE19", "SE21", "SE24", "SE27",
  "SW2", "SW4", "SW8", "SW9", "SW12", "SW16",
];

const DISTRICT_AREA = {
  SE1: "Waterloo / South Bank",
  SE5: "Camberwell",
  SE11: "Kennington / Oval",
  SE19: "Crystal Palace / Norwood",
  SE21: "Dulwich",
  SE24: "Herne Hill",
  SE27: "West Norwood",
  SW2: "Brixton / Tulse Hill",
  SW4: "Clapham",
  SW8: "Vauxhall / Stockwell",
  SW9: "Brixton",
  SW12: "Balham",
  SW16: "Streatham",
};

/** Unwrapped category → focused text queries (kept lean for free-tier). */
const CATEGORIES = [
  {
    name: "Fashion & Apparel",
    queries: ["clothing store", "vintage clothing", "shoe store", "fashion boutique"],
  },
  {
    name: "Food & Drink",
    queries: ["restaurant", "cafe", "bakery", "coffee shop"],
  },
  {
    name: "Beauty & Wellness",
    queries: ["beauty salon", "hair salon", "spa", "nail salon"],
  },
  {
    name: "Home & Living",
    queries: ["home goods store", "furniture store", "gift shop", "florist"],
  },
  {
    name: "Art & Culture",
    queries: ["art gallery", "craft store", "museum"],
  },
  {
    name: "Books & Music",
    queries: ["bookstore", "record store", "music store"],
  },
  {
    name: "Sports & Outdoor",
    queries: ["sporting goods store", "bike shop", "outdoor store"],
  },
  {
    name: "Tech & Gadgets",
    queries: ["electronics store", "mobile phone shop", "computer store"],
  },
  {
    name: "Kids & Family",
    queries: ["toy store", "children's clothing", "baby store"],
  },
  {
    name: "Services & Experiences",
    queries: ["photography studio", "yoga studio", "dance studio", "barbershop"],
  },
];

const FIELD_MASK = [
  "places.id",
  "places.name",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.addressComponents",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.editorialSummary",
  "nextPageToken",
].join(",");

const MAX_PAGES = 2; // 20 results/page → up to 40 per query
const PAGE_SIZE = 20;
const SLEEP_MS = 120;

const CHARITY_NAME_RE =
  /\b(oxfam|british heart foundation|bhf|cancer research|scope|shelter|marie curie|barnardo|salvation army|red cross|traid|fara|sense|mind\b|sue ryder|age uk|hospice|charity shop)\b/i;

const CHAIN_NAME_RE = new RegExp(
  [
    "primark", "h&m", "zara", "next", "tk maxx", "tkmaxx", "marks & spencer", "marks and spencer",
    "m&s", "uniqlo", "gap", "asos", "jd sports", "sports direct", "decathlon",
    "mcdonald", "burger king", "kfc", "subway", "dominos", "pizza hut", "nando",
    "starbucks", "costa coffee", "costa", "pret a manger", "pret", "greggs", "cafe nero", "caffè nero",
    "tesco", "sainsbury", "asda", "waitrose", "morrisons", "lidl", "aldi", "co-op", "coop",
    "boots", "superdrug", "holland & barrett", "whsmith", "wh smith",
    "vodafone", "ee store", "o2 store", "three store", "carphone", "currys",
    "ikea", "argos", "wilko", "poundland", "poundstretcher", "home bargains", "b&m",
    "specsavers", "vision express", "boots opticians",
    "puregym", "the gym group", "fitness first", "nuffield",
    "hilton", "premier inn", "travelodge", "ibis",
  ].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

const JUNK_TYPES = new Set([
  "atm", "bank", "parking", "parking_garage", "gas_station", "car_dealer",
  "car_rental", "car_repair", "car_wash", "cemetery", "church", "mosque",
  "synagogue", "hindu_temple", "hospital", "doctor", "dentist", "pharmacy",
  "police", "post_office", "school", "secondary_school", "primary_school",
  "university", "local_government_office", "embassy", "transit_station",
  "subway_station", "train_station", "bus_station", "taxi_stand",
]);

function loadApiKey() {
  const envPath = path.join(ROOT, "server/.env");
  const text = fs.readFileSync(envPath, "utf8");
  const m = text.match(/^GOOGLE_PLACES_API_KEY=(.+)$/m);
  if (!m) throw new Error("GOOGLE_PLACES_API_KEY missing in server/.env");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchText(apiKey, textQuery, pageToken) {
  const body = {
    textQuery,
    pageSize: PAGE_SIZE,
    languageCode: "en",
    regionCode: "GB",
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || JSON.stringify(json).slice(0, 300);
    throw new Error(`Places ${res.status}: ${msg}`);
  }
  return json;
}

function component(place, type, short = true) {
  const c = (place.addressComponents || []).find((a) => a.types?.includes(type));
  if (!c) return "";
  return short ? (c.shortText || c.longText || "") : (c.longText || c.shortText || "");
}

function extractPostcode(place) {
  const full = component(place, "postal_code", false) || component(place, "postal_code", true);
  if (full) return full.trim().toUpperCase();
  const addr = place.formattedAddress || "";
  const m = addr.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return m ? m[1].toUpperCase().replace(/\s+/, " ") : "";
}

function districtFromPostcode(pc) {
  const m = (pc || "").toUpperCase().match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return m ? m[1] : "";
}

function socialFromWebsite(website) {
  if (!website) return { instagram: "", facebook: "", twitter: "", tiktok: "" };
  const u = website.toLowerCase();
  return {
    instagram: /instagram\.com|instagr\.am/.test(u) ? website : "",
    facebook: /facebook\.com|fb\.com/.test(u) ? website : "",
    twitter: /twitter\.com|x\.com/.test(u) ? website : "",
    tiktok: /tiktok\.com/.test(u) ? website : "",
  };
}

function normalizePlace(raw, category, query, postcodeHint) {
  const name = raw.displayName?.text || "";
  const postcode = extractPostcode(raw);
  const district = districtFromPostcode(postcode) || postcodeHint;
  const website = raw.websiteUri || "";
  const social = socialFromWebsite(website);
  return {
    placeId: raw.id || (raw.name || "").replace(/^places\//, ""),
    name,
    category,
    type: raw.primaryTypeDisplayName?.text || raw.primaryType || (raw.types || [])[0] || "",
    primaryType: raw.primaryType || "",
    types: raw.types || [],
    address: raw.shortFormattedAddress || raw.formattedAddress || "",
    formattedAddress: raw.formattedAddress || "",
    postcode,
    district,
    city: component(raw, "postal_town") || component(raw, "locality") || "London",
    corridor: DISTRICT_AREA[district] || DISTRICT_AREA[postcodeHint] || district || postcodeHint,
    phone: raw.internationalPhoneNumber || raw.nationalPhoneNumber || "",
    phoneNational: raw.nationalPhoneNumber || "",
    website,
    googleMapsUri: raw.googleMapsUri || "",
    email: "", // Google Places does not expose email
    instagram: social.instagram,
    facebook: social.facebook,
    twitter: social.twitter,
    tiktok: social.tiktok,
    lat: raw.location?.latitude ?? null,
    lng: raw.location?.longitude ?? null,
    rating: raw.rating ?? null,
    reviews: raw.userRatingCount ?? null,
    businessStatus: raw.businessStatus || "",
    editorialSummary: raw.editorialSummary?.text || "",
    sourceQuery: query,
    sourcePostcode: postcodeHint,
  };
}

function isJunk(p) {
  if (!p.name || p.lat == null || p.lng == null) return true;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return true;
  if (CHARITY_NAME_RE.test(p.name)) return true;
  if (CHAIN_NAME_RE.test(p.name)) return true;
  if ((p.types || []).some((t) => JUNK_TYPES.has(t))) return true;
  // Drop if postcode district clearly outside our Lambeth set (when we have one)
  if (p.district && !POSTCODES.includes(p.district) && !POSTCODES.some((d) => p.postcode.startsWith(d))) {
    // keep borderline — SE1 etc can spill; only drop if clearly other boroughs
    const other = /^(E\d|N\d|NW\d|W\d|WC\d|EC\d|SW1|SW3|SW5|SW6|SW7|SW10|SW11|SW13|SW14|SW15|SW17|SW18|SW19|SW20|SE2\b|SE3|SE4|SE6|SE7|SE8|SE9|SE10|SE12|SE13|SE14|SE15|SE16|SE17|SE18|SE20|SE22|SE23|SE25|SE26|SE28)/i;
    if (other.test(p.district)) return true;
  }
  return false;
}

function jobs() {
  const list = [];
  for (const cat of CATEGORIES) {
    for (const q of cat.queries) {
      for (const pc of POSTCODES) {
        list.push({
          key: `${cat.name}::${q}::${pc}`,
          category: cat.name,
          query: q,
          postcode: pc,
          textQuery: `${q} in ${pc} London`,
        });
      }
    }
  }
  return list;
}

async function main() {
  const apiKey = loadApiKey();
  const allJobs = jobs();
  const progressPath = path.join(OUT_DIR, "lambeth_progress.json");
  const rawPath = path.join(OUT_DIR, "lambeth_places_raw.json");

  let progress = { done: {}, requestCount: 0, startedAt: new Date().toISOString() };
  if (fs.existsSync(progressPath)) {
    try {
      progress = JSON.parse(fs.readFileSync(progressPath, "utf8"));
    } catch { /* fresh */ }
  }

  /** @type {Map<string, object>} */
  const byId = new Map();
  if (fs.existsSync(rawPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(rawPath, "utf8"));
      for (const p of prev.places || []) {
        if (p.placeId) byId.set(p.placeId, p);
      }
    } catch { /* ignore */ }
  }

  console.log(`Jobs: ${allJobs.length}; already done: ${Object.keys(progress.done).length}; cached places: ${byId.size}`);

  let i = 0;
  for (const job of allJobs) {
    i += 1;
    if (progress.done[job.key]) {
      continue;
    }

    const pages = [];
    let pageToken = undefined;
    for (let page = 0; page < MAX_PAGES; page++) {
      if (page > 0 && !pageToken) break;
      if (page > 0) await sleep(2000); // nextPageToken needs brief delay
      else await sleep(SLEEP_MS);

      const result = await searchText(apiKey, job.textQuery, pageToken);
      progress.requestCount += 1;
      pages.push(result);
      const places = result.places || [];
      for (const raw of places) {
        const norm = normalizePlace(raw, job.category, job.textQuery, job.postcode);
        if (!norm.placeId) continue;
        const existing = byId.get(norm.placeId);
        if (existing) {
          // Keep first category; append if new
          if (existing.category !== norm.category) {
            const cats = new Set([...(existing.categories || [existing.category]), norm.category]);
            existing.categories = [...cats];
          }
          // Prefer richer contact fields
          if (!existing.website && norm.website) existing.website = norm.website;
          if (!existing.phone && norm.phone) existing.phone = norm.phone;
          if (!existing.instagram && norm.instagram) existing.instagram = norm.instagram;
        } else {
          byId.set(norm.placeId, { ...norm, categories: [norm.category] });
        }
      }
      pageToken = result.nextPageToken;
      if (!pageToken) break;
    }

    progress.done[job.key] = {
      at: new Date().toISOString(),
      pages: pages.length,
      count: pages.reduce((n, p) => n + (p.places?.length || 0), 0),
    };

    if (i % 10 === 0 || i === allJobs.length) {
      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
      fs.writeFileSync(
        rawPath,
        JSON.stringify(
          {
            scrapedAt: new Date().toISOString(),
            requestCount: progress.requestCount,
            placeCount: byId.size,
            places: [...byId.values()],
          },
          null,
          2,
        ),
      );
      console.log(`[${i}/${allJobs.length}] requests=${progress.requestCount} unique=${byId.size} last=${job.textQuery}`);
    }
  }

  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

  const all = [...byId.values()];
  const kept = all.filter((p) => !isJunk(p));
  const dropped = all.length - kept.length;

  // Primary category = first; ensure category field set
  for (const p of kept) {
    if (p.categories?.length) p.category = p.categories[0];
  }

  const cleanedPath = path.join(OUT_DIR, "lambeth_places_cleaned.json");
  fs.writeFileSync(
    cleanedPath,
    JSON.stringify(
      {
        scrapedAt: new Date().toISOString(),
        requestCount: progress.requestCount,
        rawCount: all.length,
        cleanedCount: kept.length,
        dropped,
        note: "Google Places has no email field. Social only when websiteUri is a social URL. Emails via Outscraper later.",
        places: kept.sort((a, b) =>
          a.category.localeCompare(b.category) ||
          a.corridor.localeCompare(b.corridor) ||
          a.name.localeCompare(b.name),
        ),
      },
      null,
      2,
    ),
  );

  // CSV
  const csvHeaders = [
    "placeId", "name", "category", "categories", "type", "address", "postcode", "district",
    "corridor", "city", "phone", "website", "instagram", "facebook", "email",
    "googleMapsUri", "lat", "lng", "rating", "reviews", "businessStatus",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvLines = [csvHeaders.join(",")];
  for (const p of kept) {
    csvLines.push(
      csvHeaders
        .map((h) => {
          if (h === "categories") return esc((p.categories || []).join("|"));
          return esc(p[h]);
        })
        .join(","),
    );
  }
  const csvPath = path.join(OUT_DIR, "lambeth_places_list.csv");
  fs.writeFileSync(csvPath, csvLines.join("\n"));

  // Stats
  const byCat = {};
  const withWeb = kept.filter((p) => p.website).length;
  const withPhone = kept.filter((p) => p.phone).length;
  const withSocial = kept.filter((p) => p.instagram || p.facebook || p.twitter || p.tiktok).length;
  for (const p of kept) byCat[p.category] = (byCat[p.category] || 0) + 1;

  console.log("\nDone.");
  console.log(`Requests: ${progress.requestCount}`);
  console.log(`Raw unique: ${all.length} → cleaned: ${kept.length} (dropped ${dropped})`);
  console.log(`With website: ${withWeb} | phone: ${withPhone} | social-as-website: ${withSocial} | email from Google: 0`);
  console.log("By category:", byCat);
  console.log(`Wrote:\n  ${rawPath}\n  ${cleanedPath}\n  ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
