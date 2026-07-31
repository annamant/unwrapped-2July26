/**
 * Wandsworth Google Places scrape — LEAN (1 query/category) to fit remaining
 * July free Text Search allowance after Lambeth (~846 used).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = __dirname;
const PREFIX = "wandsworth";

const POSTCODES = ["SW11", "SW12", "SW15", "SW17", "SW18", "SW19"];

const DISTRICT_AREA = {
  SW11: "Battersea",
  SW12: "Balham",
  SW15: "Putney",
  SW17: "Tooting",
  SW18: "Wandsworth / Earlsfield",
  SW19: "Wimbledon / Southfields edge",
};

/** One query per category — ~60 requests total. */
const CATEGORIES = [
  { name: "Fashion & Apparel", queries: ["clothing store"] },
  { name: "Food & Drink", queries: ["restaurant"] },
  { name: "Beauty & Wellness", queries: ["beauty salon"] },
  { name: "Home & Living", queries: ["home goods store"] },
  { name: "Art & Culture", queries: ["art gallery"] },
  { name: "Books & Music", queries: ["bookstore"] },
  { name: "Sports & Outdoor", queries: ["sporting goods store"] },
  { name: "Tech & Gadgets", queries: ["electronics store"] },
  { name: "Kids & Family", queries: ["toy store"] },
  { name: "Services & Experiences", queries: ["yoga studio"] },
];

const FIELD_MASK = [
  "places.id", "places.name", "places.displayName", "places.formattedAddress",
  "places.shortFormattedAddress", "places.addressComponents", "places.location",
  "places.types", "places.primaryType", "places.primaryTypeDisplayName",
  "places.nationalPhoneNumber", "places.internationalPhoneNumber",
  "places.websiteUri", "places.googleMapsUri", "places.businessStatus",
  "places.rating", "places.userRatingCount", "places.editorialSummary",
  "nextPageToken",
].join(",");

const MAX_PAGES = 1;
const PAGE_SIZE = 20;
const SLEEP_MS = 80;

const CHARITY_NAME_RE =
  /\b(oxfam|british heart foundation|bhf|cancer research|scope|shelter|marie curie|barnardo|salvation army|red cross|traid|fara|sue ryder|age uk|hospice|charity shop)\b/i;

const CHAIN_NAME_RE = new RegExp(
  [
    "primark", "h&m", "zara", "next", "tk maxx", "tkmaxx", "marks & spencer", "marks and spencer",
    "uniqlo", "jd sports", "sports direct", "decathlon",
    "mcdonald", "burger king", "kfc", "subway", "dominos", "pizza hut", "nando",
    "starbucks", "costa coffee", "pret a manger", "greggs", "cafe nero", "caffè nero",
    "tesco", "sainsbury", "asda", "waitrose", "morrisons", "lidl", "aldi",
    "boots", "superdrug", "holland & barrett", "whsmith", "wh smith",
    "vodafone", "currys", "ikea", "argos", "poundland", "specsavers",
    "puregym", "the gym group", "hilton", "premier inn", "travelodge",
  ].map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

const JUNK_TYPES = new Set([
  "atm", "bank", "parking", "parking_garage", "gas_station", "car_dealer",
  "car_rental", "car_repair", "car_wash", "cemetery", "church", "mosque",
  "synagogue", "hindu_temple", "hospital", "doctor", "dentist", "pharmacy",
  "police", "post_office", "school", "secondary_school", "primary_school",
  "university", "local_government_office", "embassy", "transit_station",
  "subway_station", "train_station", "bus_station", "taxi_stand", "library",
]);

function loadApiKey() {
  const text = fs.readFileSync(path.join(ROOT, "server/.env"), "utf8");
  const m = text.match(/^GOOGLE_PLACES_API_KEY=(.+)$/m);
  if (!m) throw new Error("GOOGLE_PLACES_API_KEY missing");
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function searchText(apiKey, textQuery, pageToken) {
  const body = { textQuery, pageSize: PAGE_SIZE, languageCode: "en", regionCode: "GB" };
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
  if (!res.ok) throw new Error(`Places ${res.status}: ${json?.error?.message || JSON.stringify(json).slice(0, 300)}`);
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
  const m = (place.formattedAddress || "").match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
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
    email: "",
    ...social,
    lat: raw.location?.latitude ?? null,
    lng: raw.location?.longitude ?? null,
    rating: raw.rating ?? null,
    reviews: raw.userRatingCount ?? null,
    businessStatus: raw.businessStatus || "",
    editorialSummary: raw.editorialSummary?.text || "",
    sourceQuery: query,
    sourcePostcode: postcodeHint,
    borough: "Wandsworth",
  };
}

function isJunk(p) {
  if (!p.name || p.lat == null || p.lng == null) return true;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return true;
  if (CHARITY_NAME_RE.test(p.name)) return true;
  if (CHAIN_NAME_RE.test(p.name)) return true;
  if ((p.types || []).some((t) => JUNK_TYPES.has(t))) return true;
  // Strict: keep only Wandsworth target districts
  if (p.district && !POSTCODES.includes(p.district)) return true;
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
  const progressPath = path.join(OUT_DIR, `${PREFIX}_progress.json`);
  const rawPath = path.join(OUT_DIR, `${PREFIX}_places_raw.json`);

  let progress = { done: {}, requestCount: 0, startedAt: new Date().toISOString() };
  if (fs.existsSync(progressPath)) {
    try { progress = JSON.parse(fs.readFileSync(progressPath, "utf8")); } catch { /* fresh */ }
  }

  const byId = new Map();
  if (fs.existsSync(rawPath)) {
    try {
      const prev = JSON.parse(fs.readFileSync(rawPath, "utf8"));
      for (const p of prev.places || []) if (p.placeId) byId.set(p.placeId, p);
    } catch { /* ignore */ }
  }

  console.log(`Wandsworth lean jobs: ${allJobs.length}; done: ${Object.keys(progress.done).length}; cached: ${byId.size}`);

  let i = 0;
  for (const job of allJobs) {
    i += 1;
    if (progress.done[job.key]) continue;

    await sleep(SLEEP_MS);
    const result = await searchText(apiKey, job.textQuery);
    progress.requestCount += 1;
    for (const raw of result.places || []) {
      const norm = normalizePlace(raw, job.category, job.textQuery, job.postcode);
      if (!norm.placeId) continue;
      const existing = byId.get(norm.placeId);
      if (existing) {
        if (existing.category !== norm.category) {
          existing.categories = [...new Set([...(existing.categories || [existing.category]), norm.category])];
        }
        if (!existing.website && norm.website) existing.website = norm.website;
        if (!existing.phone && norm.phone) existing.phone = norm.phone;
      } else {
        byId.set(norm.placeId, { ...norm, categories: [norm.category] });
      }
    }

    progress.done[job.key] = {
      at: new Date().toISOString(),
      count: result.places?.length || 0,
    };

    if (i % 10 === 0 || i === allJobs.length) {
      fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
      fs.writeFileSync(rawPath, JSON.stringify({
        scrapedAt: new Date().toISOString(),
        borough: "Wandsworth",
        mode: "lean",
        requestCount: progress.requestCount,
        placeCount: byId.size,
        places: [...byId.values()],
      }, null, 2));
      console.log(`[${i}/${allJobs.length}] requests=${progress.requestCount} unique=${byId.size} last=${job.textQuery}`);
    }
  }

  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  const all = [...byId.values()];
  const kept = all.filter((p) => !isJunk(p));
  for (const p of kept) {
    if (p.categories?.length) p.category = p.categories[0];
  }
  kept.sort((a, b) =>
    a.category.localeCompare(b.category) ||
    (a.corridor || "").localeCompare(b.corridor || "") ||
    a.name.localeCompare(b.name),
  );

  const cleanedPath = path.join(OUT_DIR, `${PREFIX}_places_cleaned.json`);
  fs.writeFileSync(cleanedPath, JSON.stringify({
    scrapedAt: new Date().toISOString(),
    borough: "Wandsworth",
    mode: "lean-1query-per-category",
    requestCount: progress.requestCount,
    rawCount: all.length,
    cleanedCount: kept.length,
    dropped: all.length - kept.length,
    note: "Lean pass for free-tier. No emails from Google.",
    places: kept,
  }, null, 2));

  const csvHeaders = [
    "placeId", "name", "category", "categories", "type", "address", "postcode", "district",
    "corridor", "city", "phone", "website", "instagram", "facebook", "email",
    "googleMapsUri", "lat", "lng", "rating", "reviews", "businessStatus", "borough",
  ];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csvLines = [csvHeaders.join(",")];
  for (const p of kept) {
    csvLines.push(csvHeaders.map((h) =>
      h === "categories" ? esc((p.categories || []).join("|")) : esc(p[h]),
    ).join(","));
  }
  const csvPath = path.join(OUT_DIR, `${PREFIX}_places_list.csv`);
  fs.writeFileSync(csvPath, csvLines.join("\n"));

  const byCat = {};
  for (const p of kept) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log("\nDone Wandsworth lean.");
  console.log(`Requests: ${progress.requestCount}`);
  console.log(`Raw ${all.length} → cleaned ${kept.length}`);
  console.log(`website=${kept.filter((p) => p.website).length} phone=${kept.filter((p) => p.phone).length}`);
  console.log("By category:", byCat);
  console.log(`Wrote ${csvPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
