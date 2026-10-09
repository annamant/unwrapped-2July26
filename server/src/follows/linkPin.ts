import { eq, or } from "drizzle-orm";
import type { DB } from "../db";
import { businesses, follows } from "../db/schema";
import { matchCuratedPinToBusiness } from "../curatedDirectory";
import { WAVE1_DIRECTORY_PINS } from "../wave1Directory";
import { carryOverFollows, type StoredFollow } from "./model";

type LinkableBusiness = {
  id: string;
  name: string;
  postcode: string | null;
  directoryPinId?: string | null;
};

/**
 * Remember which curated pin a business is, and point existing follows at it.
 * Safe to call more than once.
 */
export async function linkBusinessToDirectoryPin(db: DB, business: LinkableBusiness): Promise<string | null> {
  if (business.directoryPinId) {
    await persistCarryOver(db, business.directoryPinId, business.id);
    return business.directoryPinId;
  }

  const all = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      postcode: businesses.postcode,
      directoryPinId: businesses.directoryPinId,
    })
    .from(businesses);

  const pin = WAVE1_DIRECTORY_PINS.find((candidate) => {
    return matchCuratedPinToBusiness(candidate, all)?.id === business.id;
  });
  if (!pin) return null;

  const taken = all.find((row) => row.directoryPinId === pin.id && row.id !== business.id);
  if (taken) return null;

  await db
    .update(businesses)
    .set({ directoryPinId: pin.id })
    .where(eq(businesses.id, business.id));

  await persistCarryOver(db, pin.id, business.id);
  return pin.id;
}

async function persistCarryOver(db: DB, pinId: string, businessId: string): Promise<void> {
  const rows = await db
    .select({
      id: follows.id,
      userId: follows.userId,
      businessId: follows.businessId,
      directoryPinId: follows.directoryPinId,
      requestedAtSignup: follows.requestedAtSignup,
    })
    .from(follows)
    .where(or(eq(follows.directoryPinId, pinId), eq(follows.businessId, businessId)));

  const stored: StoredFollow[] = rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    businessId: row.businessId,
    directoryPinId: row.directoryPinId,
    requestedAtSignup: row.requestedAtSignup,
  }));

  const plan = carryOverFollows(stored, pinId, businessId);
  if (plan.deleteIds.length) {
    for (const id of plan.deleteIds) {
      await db.delete(follows).where(eq(follows.id, id));
    }
  }
  for (const update of plan.updates) {
    await db
      .update(follows)
      .set({
        businessId: update.businessId,
        directoryPinId: update.directoryPinId,
        requestedAtSignup: update.requestedAtSignup,
      })
      .where(eq(follows.id, update.id));
  }
}
