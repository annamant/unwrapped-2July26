import curatedPins from "./data/curatedDirectoryPins.json";

export type CuratedDirectoryPin = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  postcode?: string;
  address?: string;
  track?: string;
  type?: string;
  mechanic?: string;
  district?: string;
};

export const CURATED_DIRECTORY_PINS = curatedPins as CuratedDirectoryPin[];

export function normalizeShopName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizePostcode(postcode: string | null | undefined): string {
  return (postcode ?? "").replace(/\s+/g, "").toUpperCase();
}

export type MatchableBusiness = {
  id: string;
  name: string;
  postcode: string | null;
};

/** Best single match for a curated pin against claim-system businesses. */
export function matchCuratedPinToBusiness<T extends MatchableBusiness>(
  pin: CuratedDirectoryPin,
  businesses: T[],
): T | null {
  const pinName = normalizeShopName(pin.name);
  const pinPc = normalizePostcode(pin.postcode);
  const nameHits = businesses.filter((b) => normalizeShopName(b.name) === pinName);
  if (nameHits.length === 1) return nameHits[0];
  if (nameHits.length > 1 && pinPc) {
    const pcHits = nameHits.filter((b) => normalizePostcode(b.postcode) === pinPc);
    if (pcHits.length === 1) return pcHits[0];
  }
  return null;
}
