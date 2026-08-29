import { and, eq, sql } from "drizzle-orm";
import { businesses, users } from "./db/schema";

/** Seeded Places / directory rows owned by the shared unclaimed placeholder. */
export const UNCLAIMED_DIRECTORY_EMAIL = "unclaimed-directory@shopunwrapped.com";

/** Same rule as public directoryMembers: active + claimed owner (has a password). */
export const claimedPartnerSql = and(
  eq(businesses.status, "active"),
  sql`lower(${businesses.contactEmail}) <> ${UNCLAIMED_DIRECTORY_EMAIL}`,
  sql`${users.passwordHash} IS NOT NULL`,
);

export function isTestShop(name: string, slug: string): boolean {
  const n = name.trim().toLowerCase();
  const s = slug.toLowerCase();
  if (n.includes("[test]")) return true;
  if (s.startsWith("claim-")) return true;
  if (/(^|\s)test(\s|$)/.test(n)) return true;
  return false;
}

export function isIndexablePartner(input: {
  name: string;
  slug: string;
  status?: string;
  contactEmail: string | null;
  passwordHash: string | null;
}): boolean {
  if (input.status && input.status !== "active") return false;
  const email = (input.contactEmail || "").toLowerCase();
  if (email === UNCLAIMED_DIRECTORY_EMAIL) return false;
  if (!input.passwordHash) return false;
  if (isTestShop(input.name, input.slug)) return false;
  return true;
}
