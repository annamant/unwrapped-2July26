/** Same obvious-test rule as server/src/seoIndexable.ts isTestShop. */
export function isObviousTestShop(name?: string | null, slug?: string | null): boolean {
  const n = (name ?? "").trim().toLowerCase();
  const s = (slug ?? "").toLowerCase();
  if (n.includes("[test]")) return true;
  if (s.startsWith("claim-")) return true;
  if (/(^|\s)test(\s|$)/.test(n)) return true;
  return false;
}
