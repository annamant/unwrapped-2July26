import type { DB } from "../db";
import { businesses, follows } from "../db/schema";
import { matchCuratedPinToBusiness } from "../curatedDirectory";
import { WAVE1_DIRECTORY_PINS } from "../wave1Directory";

export type FollowCountRow = {
  key: string;
  name: string;
  kind: "curated" | "live";
  pinId: string | null;
  businessId: string | null;
  slug: string | null;
  followers: number;
  requestedAtSignup: number;
};

type ShopBucket = FollowCountRow;

export function buildFollowCountRows(input: {
  pins: Array<{ id: string; name: string }>;
  businesses: Array<{ id: string; name: string; slug: string; postcode: string | null; directoryPinId: string | null }>;
  follows: Array<{ id: string; businessId: string | null; directoryPinId: string | null; requestedAtSignup: boolean }>;
}): FollowCountRow[] {
  const linked = new Map<string, string>();
  for (const business of input.businesses) {
    if (business.directoryPinId) linked.set(business.directoryPinId, business.id);
  }
  for (const pin of input.pins) {
    if (linked.has(pin.id)) continue;
    const match = matchCuratedPinToBusiness(
      { id: pin.id, name: pin.name, lat: 0, lng: 0 },
      input.businesses,
    );
    if (match) linked.set(pin.id, match.id);
  }

  const businessById = new Map(input.businesses.map((business) => [business.id, business]));
  const shops: ShopBucket[] = input.pins.map((pin) => {
    const businessId = linked.get(pin.id) ?? null;
    const business = businessId ? businessById.get(businessId) : undefined;
    return {
      key: `pin:${pin.id}`,
      name: pin.name,
      kind: "curated",
      pinId: pin.id,
      businessId,
      slug: business?.slug ?? null,
      followers: 0,
      requestedAtSignup: 0,
    };
  });

  const byPin = new Map(shops.map((shop) => [shop.pinId, shop]));
  const byBusiness = new Map<string, ShopBucket>();
  for (const shop of shops) {
    if (shop.businessId) byBusiness.set(shop.businessId, shop);
  }

  for (const business of input.businesses) {
    if (byBusiness.has(business.id)) continue;
    const shop: ShopBucket = {
      key: `biz:${business.id}`,
      name: business.name,
      kind: "live",
      pinId: business.directoryPinId,
      businessId: business.id,
      slug: business.slug,
      followers: 0,
      requestedAtSignup: 0,
    };
    shops.push(shop);
    byBusiness.set(business.id, shop);
  }

  const counted = new Set<string>();
  for (const follow of input.follows) {
    if (counted.has(follow.id)) continue;
    const shop =
      (follow.directoryPinId ? byPin.get(follow.directoryPinId) : undefined) ??
      (follow.businessId ? byBusiness.get(follow.businessId) : undefined);
    if (!shop) continue;
    counted.add(follow.id);
    shop.followers += 1;
    if (follow.requestedAtSignup) shop.requestedAtSignup += 1;
  }

  return shops;
}

export async function loadFollowCounts(db: DB): Promise<FollowCountRow[]> {
  const [businessRows, followRows] = await Promise.all([
    db
      .select({
        id: businesses.id,
        name: businesses.name,
        slug: businesses.slug,
        postcode: businesses.postcode,
        directoryPinId: businesses.directoryPinId,
      })
      .from(businesses),
    db
      .select({
        id: follows.id,
        businessId: follows.businessId,
        directoryPinId: follows.directoryPinId,
        requestedAtSignup: follows.requestedAtSignup,
      })
      .from(follows),
  ]);

  return buildFollowCountRows({
    pins: WAVE1_DIRECTORY_PINS.map((pin) => ({ id: pin.id, name: pin.name })),
    businesses: businessRows,
    follows: followRows,
  });
}
