/** In-memory follow rules shared by the router and tests. */

export type FollowTarget = {
  businessId: string | null;
  directoryPinId: string | null;
};

export type StoredFollow = FollowTarget & {
  id: string;
  userId: string;
  requestedAtSignup: boolean;
};

export type FollowPlan =
  | { action: "insert"; values: Omit<StoredFollow, "id"> }
  | { action: "update"; id: string; values: Omit<StoredFollow, "id">; deleteIds: string[] };

export function assertFollowTarget(target: FollowTarget): void {
  if (!target.businessId && !target.directoryPinId) {
    throw new Error("Shop required");
  }
}

export function followMatches(row: StoredFollow, userId: string, target: FollowTarget): boolean {
  if (row.userId !== userId) return false;
  if (target.directoryPinId && row.directoryPinId === target.directoryPinId) return true;
  if (target.businessId && row.businessId === target.businessId) return true;
  return false;
}

export function planFollow(
  existing: StoredFollow[],
  userId: string,
  target: FollowTarget,
  requestedAtSignup: boolean,
): FollowPlan {
  assertFollowTarget(target);
  const matches = existing.filter((row) => followMatches(row, userId, target));
  const mergedTarget: FollowTarget = {
    businessId: target.businessId ?? matches.find((row) => row.businessId)?.businessId ?? null,
    directoryPinId: target.directoryPinId ?? matches.find((row) => row.directoryPinId)?.directoryPinId ?? null,
  };
  const signup = requestedAtSignup || matches.some((row) => row.requestedAtSignup);

  if (matches.length === 0) {
    return {
      action: "insert",
      values: {
        userId,
        businessId: mergedTarget.businessId,
        directoryPinId: mergedTarget.directoryPinId,
        requestedAtSignup: signup,
      },
    };
  }

  const keeper = matches[0];
  return {
    action: "update",
    id: keeper.id,
    deleteIds: matches.slice(1).map((row) => row.id),
    values: {
      userId,
      businessId: mergedTarget.businessId,
      directoryPinId: mergedTarget.directoryPinId,
      requestedAtSignup: signup,
    },
  };
}

export function planUnfollow(existing: StoredFollow[], userId: string, target: FollowTarget): string[] {
  assertFollowTarget(target);
  return existing.filter((row) => followMatches(row, userId, target)).map((row) => row.id);
}

export type CarryOverPlan = {
  updates: Array<{ id: string; businessId: string; directoryPinId: string; requestedAtSignup: boolean }>;
  deleteIds: string[];
};

/** Attach a curated pin to the business that later claims it, one follow per person. */
export function carryOverFollows(rows: StoredFollow[], pinId: string, businessId: string): CarryOverPlan {
  const related = rows.filter((row) => {
    if (row.directoryPinId === pinId) return row.businessId == null || row.businessId === businessId;
    return row.businessId === businessId && (row.directoryPinId == null || row.directoryPinId === pinId);
  });

  const byUser = new Map<string, StoredFollow[]>();
  for (const row of related) {
    const list = byUser.get(row.userId) ?? [];
    list.push(row);
    byUser.set(row.userId, list);
  }

  const updates: CarryOverPlan["updates"] = [];
  const deleteIds: string[] = [];

  for (const group of byUser.values()) {
    const keeper = group[0];
    const requestedAtSignup = group.some((row) => row.requestedAtSignup);
    const changed =
      keeper.businessId !== businessId ||
      keeper.directoryPinId !== pinId ||
      keeper.requestedAtSignup !== requestedAtSignup;
    if (changed) {
      updates.push({
        id: keeper.id,
        businessId,
        directoryPinId: pinId,
        requestedAtSignup,
      });
    }
    for (const extra of group.slice(1)) deleteIds.push(extra.id);
  }

  return { updates, deleteIds };
}
