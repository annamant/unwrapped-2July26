/** Free-text shop names typed at signup when a shop isn't in the picker list. */

const MAX_NAMES = 40;
const MAX_NAME_LEN = 80;

/**
 * Accept a textarea string (or array), split on commas / newlines,
 * trim, drop empties, dedupe case-insensitively, cap length/count.
 */
export function sanitizeSignupRequestedShops(raw: unknown): string[] {
  const chunks: string[] = [];
  if (typeof raw === "string") {
    chunks.push(...raw.split(/[\n,]+/));
  } else if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string") chunks.push(...item.split(/[\n,]+/));
    }
  } else {
    return [];
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const chunk of chunks) {
    const name = chunk.replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LEN);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= MAX_NAMES) break;
  }
  return out;
}
