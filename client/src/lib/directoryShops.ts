import type { PrelaunchDirectoryPin } from "./prelaunch_wave1_directory_pins";

export type DirectoryMember = {
  id: string;
  name: string;
  slug: string;
  category: string;
  address: string | null;
  postcode: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  description?: string | null;
  logoUrl?: string | null;
};

export type DirectoryShop = PrelaunchDirectoryPin & {
  isMember?: boolean;
  slug?: string;
  category?: string;
  businessId?: string;
  directoryPinId?: string;
  description?: string | null;
  logoUrl?: string | null;
};

export function normalizeDirectoryName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function shopPublicPath(shop: { id: string; slug?: string; directoryPinId?: string; isMember?: boolean }): string {
  if (shop.slug) return `/business/${shop.slug}`;
  const pinId = shop.directoryPinId || shop.id;
  return `/shop/${encodeURIComponent(pinId)}`;
}

/** Curated pins plus live businesses that are not already one of those pins. */
export function mergeDirectoryShops(
  pins: PrelaunchDirectoryPin[],
  members: DirectoryMember[],
  options?: { isTest?: (name: string, slug: string) => boolean },
): DirectoryShop[] {
  const isTest = options?.isTest ?? (() => false);
  const memberByName = new Map(members.map((member) => [normalizeDirectoryName(member.name), member]));
  const matchedMemberIds = new Set<string>();

  const curated: DirectoryShop[] = pins.map((pin) => {
    const match = memberByName.get(normalizeDirectoryName(pin.name));
    if (!match || isTest(match.name, match.slug)) {
      return { ...pin, directoryPinId: pin.id, isMember: false };
    }
    matchedMemberIds.add(match.id);
    return {
      ...pin,
      directoryPinId: pin.id,
      businessId: match.id,
      isMember: true,
      slug: match.slug,
      category: match.category,
      address: match.address || pin.address,
      postcode: match.postcode || pin.postcode,
      description: match.description,
      logoUrl: match.logoUrl,
    };
  });

  const extras: DirectoryShop[] = members
    .filter((member) => !matchedMemberIds.has(member.id) && !isTest(member.name, member.slug))
    .map((member) => ({
      id: `member-${member.id}`,
      name: member.name,
      lat: member.lat ?? Number.NaN,
      lng: member.lng ?? Number.NaN,
      postcode: member.postcode ?? undefined,
      address: member.address ?? undefined,
      district: member.city ?? undefined,
      type: member.category,
      category: member.category,
      isMember: true,
      slug: member.slug,
      businessId: member.id,
      description: member.description,
      logoUrl: member.logoUrl,
    }));

  return [...extras, ...curated].sort((a, b) => {
    if (!!a.isMember !== !!b.isMember) return a.isMember ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
