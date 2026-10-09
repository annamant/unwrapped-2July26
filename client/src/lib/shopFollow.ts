const STORAGE_KEY = "unwrapped.pendingFollow";

export type PendingFollow = {
  name?: string;
  directoryPinId?: string;
  businessId?: string;
};

export function rememberPendingFollow(follow: PendingFollow) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(follow));
  } catch {
    // Private mode can block storage. The query string still carries the shop.
  }
}

export function readPendingFollow(): PendingFollow | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingFollow;
    if (!parsed.directoryPinId && !parsed.businessId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingFollow() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

export function signupPath(): string {
  return "/signin?mode=register";
}
