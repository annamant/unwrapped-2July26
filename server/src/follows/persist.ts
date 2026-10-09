import { and, eq, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { DB } from "../db";
import { businesses, follows } from "../db/schema";
import { matchCuratedPinToBusiness } from "../curatedDirectory";
import { WAVE1_DIRECTORY_PINS, isWave1PinId } from "../wave1Directory";
import { planFollow, planUnfollow, type FollowTarget, type StoredFollow } from "./model";
import { linkBusinessToDirectoryPin } from "./linkPin";

export type FollowInput = {
  businessId?: string | null;
  directoryPinId?: string | null;
};

export function isCuratedPinId(id: string): boolean {
  return isWave1PinId(id);
}

export async function resolveFollowTarget(db: DB, input: FollowInput): Promise<FollowTarget> {
  let businessId = input.businessId ?? null;
  let directoryPinId = input.directoryPinId?.trim() || null;

  if (directoryPinId && !isCuratedPinId(directoryPinId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
  }

  if (businessId) {
    const [biz] = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        postcode: businesses.postcode,
        status: businesses.status,
        directoryPinId: businesses.directoryPinId,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (!biz || (biz.status !== "active" && !directoryPinId)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
    }

    if (!directoryPinId) {
      directoryPinId = biz.directoryPinId ?? await linkBusinessToDirectoryPin(db, biz);
    }
  } else if (directoryPinId) {
    const [linked] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.directoryPinId, directoryPinId))
      .limit(1);
    if (linked) {
      businessId = linked.id;
    } else {
      const pin = WAVE1_DIRECTORY_PINS.find((candidate) => candidate.id === directoryPinId);
      if (pin) {
        const all = await db
          .select({
            id: businesses.id,
            name: businesses.name,
            postcode: businesses.postcode,
          })
          .from(businesses);
        const match = matchCuratedPinToBusiness(pin, all);
        if (match) {
          businessId = match.id;
          await linkBusinessToDirectoryPin(db, {
            id: match.id,
            name: match.name,
            postcode: match.postcode,
          });
        }
      }
    }
  }

  if (!businessId && !directoryPinId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a shop" });
  }

  return { businessId, directoryPinId };
}

async function loadUserFollows(db: DB, userId: string): Promise<StoredFollow[]> {
  const rows = await db
    .select({
      id: follows.id,
      userId: follows.userId,
      businessId: follows.businessId,
      directoryPinId: follows.directoryPinId,
      requestedAtSignup: follows.requestedAtSignup,
    })
    .from(follows)
    .where(eq(follows.userId, userId));
  return rows;
}

export async function applyFollow(
  db: DB,
  userId: string,
  input: FollowInput,
  requestedAtSignup: boolean,
): Promise<{ following: true }> {
  const target = await resolveFollowTarget(db, input);
  const existing = await loadUserFollows(db, userId);
  const plan = planFollow(existing, userId, target, requestedAtSignup);

  if (plan.action === "insert") {
    try {
      await db.insert(follows).values({
        userId: plan.values.userId,
        businessId: plan.values.businessId,
        directoryPinId: plan.values.directoryPinId,
        requestedAtSignup: plan.values.requestedAtSignup,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== "23505") throw err;
    }
    return { following: true };
  }

  for (const id of plan.deleteIds) {
    await db.delete(follows).where(eq(follows.id, id));
  }
  await db
    .update(follows)
    .set({
      businessId: plan.values.businessId,
      directoryPinId: plan.values.directoryPinId,
      requestedAtSignup: plan.values.requestedAtSignup,
    })
    .where(and(eq(follows.id, plan.id), eq(follows.userId, userId)));

  return { following: true };
}

export async function applyUnfollow(db: DB, userId: string, input: FollowInput): Promise<{ following: false }> {
  const target: FollowTarget = {
    businessId: input.businessId ?? null,
    directoryPinId: input.directoryPinId?.trim() || null,
  };
  if (target.directoryPinId && !isCuratedPinId(target.directoryPinId)) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Shop not found" });
  }
  if (!target.businessId && !target.directoryPinId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a shop" });
  }

  const existing = await loadUserFollows(db, userId);
  const ids = planUnfollow(existing, userId, target);
  for (const id of ids) {
    await db.delete(follows).where(and(eq(follows.id, id), eq(follows.userId, userId)));
  }
  return { following: false };
}

export async function isFollowing(db: DB, userId: string, input: FollowInput): Promise<boolean> {
  const businessId = input.businessId ?? null;
  const directoryPinId = input.directoryPinId?.trim() || null;
  if (!businessId && !directoryPinId) return false;

  const conditions = [];
  if (directoryPinId) conditions.push(eq(follows.directoryPinId, directoryPinId));
  if (businessId) conditions.push(eq(follows.businessId, businessId));

  const [row] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.userId, userId), or(...conditions)))
    .limit(1);
  return !!row;
}

/** Signup saves what it can. A bad id does not fail account creation. */
export async function saveSignupFollows(db: DB, userId: string, inputs: FollowInput[]): Promise<number> {
  let saved = 0;
  const seen = new Set<string>();
  for (const input of inputs.slice(0, 40)) {
    const key = `${input.directoryPinId ?? ""}|${input.businessId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      await applyFollow(db, userId, input, true);
      saved += 1;
    } catch (err) {
      if (err instanceof TRPCError && (err.code === "NOT_FOUND" || err.code === "BAD_REQUEST")) continue;
      throw err;
    }
  }
  return saved;
}
