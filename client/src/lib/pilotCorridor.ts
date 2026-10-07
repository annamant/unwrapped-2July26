/**
 * Shopper-facing lines for the public site.
 * The place matcher below is an ops seed fence only. Do not put those place names in UI copy.
 * Keep the matcher aligned with server/src/pilotCorridor.ts.
 */

export const PILOT_TITLE =
  "Unwrapped lets you know when a shop you already know has a deal on.";

export const PILOT_DESCRIPTION =
  "The connection between the shops you trust and you. We ping you when something's on.";

export const PILOT_H1 =
  "Unwrapped lets you know when a shop you already know has a deal on.";

export const PILOT_KICKER = "Notify me";

export const PILOT_LOOP = "Get notified. Then claim. Then collect.";

export const PILOT_SUB =
  "The connection between the shops you trust and you. We ping you when something's on.";

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
