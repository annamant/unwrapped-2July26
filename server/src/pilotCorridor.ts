/**
 * Slice 1 public pilot matcher for crawler HTML.
 * Keep aligned with client/src/lib/pilotCorridor.ts.
 */

const CORRIDOR_MARKERS = [
  "brixton village",
  "granville arcade",
  "market row",
  "coldharbour",
];

export type PilotPlace = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  postcode?: string | null;
  type?: string | null;
  category?: string | null;
};

function haystack(shop: PilotPlace): string {
  return `${shop.name ?? ""} ${shop.address ?? ""} ${shop.city ?? ""} ${shop.district ?? ""} ${shop.postcode ?? ""}`.toLowerCase();
}

export function isPilotCorridorPlace(shop: PilotPlace): boolean {
  const hay = haystack(shop);
  if (CORRIDOR_MARKERS.some((marker) => hay.includes(marker))) return true;
  const name = (shop.name ?? "").toLowerCase();
  const acre = hay.includes("acre lane") || hay.includes("acre ln");
  return name.includes("aries") && acre;
}

/** Public discovery: any shop inside the ops seed fence. Category is not a gate. */
export function isPublicPilotShop(shop: PilotPlace): boolean {
  return isPilotCorridorPlace(shop);
}

export const PILOT_TITLE =
  "Unwrapped lets you know when a shop you already know has a deal on.";

export const PILOT_DESCRIPTION =
  "The connection between the shops you trust and you. We'll let you know when something's on.";

export const PILOT_H1 =
  "Unwrapped lets you know when a shop you already know has a deal on.";

export const PILOT_KICKER = "Notify me";

export const PILOT_NOTE =
  "Sign up and we'll tell you when shops you know post a deal.";
