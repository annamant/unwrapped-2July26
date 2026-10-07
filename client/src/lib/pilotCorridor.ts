/**
 * Shopper-facing lines for the public site.
 * The place matcher below is an ops seed fence only. Do not put those place names in UI copy.
 * Keep the matcher aligned with server/src/pilotCorridor.ts.
 */

export const PILOT_TITLE =
  "Unwrapped · What's on deal right now at shops you already know.";

export const PILOT_DESCRIPTION =
  "Notify me when a shop you already know has something on deal. A photo of the special — not a mystery bag.";

export const PILOT_H1 = "What's on deal right now at shops you already know.";

export const PILOT_KICKER = "Notify me";

export const PILOT_LOOP = "See it. Claim it. Collect it.";

export const PILOT_SUB =
  "Shops you already know. Notify me when a photographed special is on deal — not a mystery bag, and not a browse of every shop in the city.";

/** Internal map focus for the seed fence. Not a public label. */
export const PILOT_MAP = { lat: 51.4613, lng: -0.1148, zoom: 15 };

const CORRIDOR_MARKERS = [
  "brixton village",
  "granville arcade",
  "market row",
  "coldharbour",
];

const PILOT_FOOD_TYPES = new Set([
  "bakery",
  "specialty food",
  "deli",
  "food & drink",
]);

export type PilotPlace = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  postcode?: string | null;
  type?: string | null;
  category?: string | null;
  track?: string | null;
};

function haystack(shop: PilotPlace): string {
  return `${shop.name ?? ""} ${shop.address ?? ""} ${shop.city ?? ""} ${shop.district ?? ""} ${shop.postcode ?? ""}`.toLowerCase();
}

/** Named streets, plus Acre Lane only when the shop is Aries. */
export function isPilotCorridorPlace(shop: PilotPlace): boolean {
  const hay = haystack(shop);
  if (CORRIDOR_MARKERS.some((marker) => hay.includes(marker))) return true;
  const name = (shop.name ?? "").toLowerCase();
  const acre = hay.includes("acre lane") || hay.includes("acre ln");
  return name.includes("aries") && acre;
}

export function isPilotFoodShop(shop: PilotPlace): boolean {
  const type = (shop.type || shop.category || "").trim().toLowerCase();
  if (PILOT_FOOD_TYPES.has(type)) return true;
  const name = (shop.name ?? "").toLowerCase();
  if (/\b(bakery|bakehouse|patisserie)\b/.test(name)) return true;
  if (name.includes("aries")) return true;
  return false;
}

/** Public discovery: in the corridor and bakery / specialty food (or a claimed food shop there). */
export function isPublicPilotShop(shop: PilotPlace): boolean {
  return isPilotCorridorPlace(shop) && isPilotFoodShop(shop);
}
