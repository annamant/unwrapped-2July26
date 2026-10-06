/**
 * Slice 1 public pilot — bakery + specialty food photo specials.
 * Streets: Brixton Village (incl. Granville Arcade), Market Row, Coldharbour.
 * Acre Lane is in the pilot only for Aries, not the rest of that road.
 * Keep this matcher aligned with server/src/pilotCorridor.ts.
 */

export const PILOT_TITLE =
  "Unwrapped · Photo specials in Brixton Village, Market Row and Coldharbour.";

export const PILOT_DESCRIPTION =
  "Bakeries and specialty food shops post a photo of a chosen special. See it, claim it, and collect it in person — Brixton Village, Market Row, Coldharbour, and Aries on Acre Lane.";

export const PILOT_H1 =
  "Photo specials from bakeries and specialty food shops in Brixton Village, Market Row and Coldharbour.";

export const PILOT_KICKER = "Brixton Village · Market Row · Coldharbour";

export const PILOT_LOOP = "See it. Claim it. Collect it.";

export const PILOT_SUB =
  "A bakery or specialty food shop posts a photo of something chosen — the loaf, the tin, the counter special. You claim it on your phone and collect it in person. Aries is on Acre Lane. Not a mystery bag.";

/** Map opens on Brixton Village, wide enough to include Acre Lane (Aries). */
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
