/**
 * Clean partial/full raw Places scrape → CSV + apparelMapData.ts
 * No API calls.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const OUT_DIR = __dirname;
const RAW = path.join(OUT_DIR, "lambeth_places_raw.json");

const POSTCODES = [
  "SE1", "SE5", "SE11", "SE19", "SE21", "SE24", "SE27",
  "SW2", "SW4", "SW8", "SW9", "SW12", "SW16",
];

const CHARITY_NAME_RE =
  /\b(oxfam|british heart foundation|bhf|cancer research|scope|shelter|marie curie|barnardo|salvation army|red cross|traid|fara|sense|mind\b|sue ryder|age uk|hospice|charity shop)\b/i;

const CHAIN_NAME_RE = new RegExp(
  [
    "primark", "h&m", "zara", "next", "tk maxx", "tkmaxx", "marks & spencer", "marks and spencer",
    "m&s ", "uniqlo", "\\bgap\\b", "asos", "jd sports", "sports direct", "decathlon",
    "mcdonald", "burger king", "kfc", "subway", "dominos", "pizza hut", "nando",
    "starbucks", "costa coffee", "\\bcosta\\b", "pret a manger", "\\bpret\\b", "greggs", "cafe nero", "caffè nero",
    "tesco", "sainsbury", "asda", "waitrose", "morrisons", "lidl", "aldi", "co-op", "\\bcoop\\b",
    "boots", "superdrug", "holland & barrett", "whsmith", "wh smith",
    "vodafone", "ee store", "o2 store", "three store", "carphone", "currys",
    "ikea", "argos", "wilko", "poundland", "poundstretcher", "home bargains", "\\bb&m\\b",
    "specsavers", "vision express", "boots opticians",
    "puregym", "the gym group", "fitness first", "nuffield",
    "hilton", "premier inn", "travelodge", "\\bibis\\b",
  ].join("|"),
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

const OTHER_DISTRICT_RE =
  /^(E\d|N\d|NW\d|W\d|WC\d|EC\d|SW1|SW3|SW5|SW6|SW7|SW10|SW11|SW13|SW14|SW15|SW17|SW18|SW19|SW20|SE2$|SE3|SE4|SE6|SE7|SE8|SE9|SE10|SE12|SE13|SE14|SE15|SE16|SE17|SE18|SE20|SE22|SE23|SE25|SE26|SE28)/i;

function isJunk(p) {
  if (!p.name || p.lat == null || p.lng == null) return true;
  if (p.businessStatus && p.businessStatus !== "OPERATIONAL") return true;
  if (CHARITY_NAME_RE.test(p.name)) return true;
  if (CHAIN_NAME_RE.test(p.name)) return true;
  if ((p.types || []).some((t) => JUNK_TYPES.has(t))) return true;
  if (p.district && OTHER_DISTRICT_RE.test(p.district) && !POSTCODES.includes(p.district)) return true;
  return false;
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

function main() {
  const raw = JSON.parse(fs.readFileSync(RAW, "utf8"));
  const all = raw.places || [];
  const kept = all.filter((p) => !isJunk(p)).map((p) => {
    const social = socialFromWebsite(p.website);
    return {
      ...p,
      category: (p.categories && p.categories[0]) || p.category || "Fashion & Apparel",
      categories: p.categories || [p.category],
      email: "",
      instagram: p.instagram || social.instagram,
      facebook: p.facebook || social.facebook,
      twitter: p.twitter || social.twitter,
      tiktok: p.tiktok || social.tiktok,
    };
  });

  kept.sort((a, b) =>
    a.category.localeCompare(b.category) ||
    (a.corridor || "").localeCompare(b.corridor || "") ||
    a.name.localeCompare(b.name),
  );

  const cleanedPath = path.join(OUT_DIR, "lambeth_places_cleaned.json");
  fs.writeFileSync(
    cleanedPath,
    JSON.stringify(
      {
        scrapedAt: raw.scrapedAt,
        processedAt: new Date().toISOString(),
        requestCount: raw.requestCount,
        rawCount: all.length,
        cleanedCount: kept.length,
        dropped: all.length - kept.length,
        note: "Google Places has no email field. Social only when websiteUri is a social URL.",
        places: kept,
      },
      null,
      2,
    ),
  );

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
        .map((h) => (h === "categories" ? esc((p.categories || []).join("|")) : esc(p[h])))
        .join(","),
    );
  }
  fs.writeFileSync(path.join(OUT_DIR, "lambeth_places_list.csv"), csvLines.join("\n"));

  // Map data for admin UI
  const mapPlaces = kept.map((p) => ({
    placeId: p.placeId,
    name: p.name,
    category: p.category,
    type: p.type || "",
    city: p.city || "London",
    address: p.address || p.formattedAddress || "",
    postcode: p.postcode || "",
    district: p.district || "",
    website: p.website || "",
    phone: p.phone || "",
    googleMapsUri: p.googleMapsUri || "",
    email: "",
    instagram: p.instagram || "",
    facebook: p.facebook || "",
    lat: p.lat,
    lng: p.lng,
    corridor: p.corridor || p.district || "",
    rating: p.rating ?? null,
    reviews: p.reviews ?? null,
  }));

  const tsPath = path.join(ROOT, "client/src/pages/admin/apparelMapData.ts");
  const ts = `export type ApparelPlace = {
  placeId: string;
  name: string;
  category: string;
  type: string;
  city: string;
  address: string;
  postcode: string;
  district: string;
  website: string;
  phone: string;
  googleMapsUri: string;
  email: string;
  instagram: string;
  facebook: string;
  lat: number;
  lng: number;
  corridor: string;
  rating: number | null;
  reviews: number | null;
};

/** Lambeth Places scrape (Google). Emails are empty — enrich via Outscraper after map select. */
export const APPAREL_PLACES: ApparelPlace[] = ${JSON.stringify(mapPlaces, null, 2)};
`;
  fs.writeFileSync(tsPath, ts);

  const byCat = {};
  for (const p of kept) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`Raw ${all.length} → cleaned ${kept.length} (dropped ${all.length - kept.length})`);
  console.log("By category:", byCat);
  console.log(`website=${kept.filter((p) => p.website).length} phone=${kept.filter((p) => p.phone).length} social=${kept.filter((p) => p.instagram || p.facebook).length}`);
  console.log("Wrote", cleanedPath);
  console.log("Wrote", tsPath);
}

main();
