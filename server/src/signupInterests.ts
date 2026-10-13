/** Broad interests offered next to the signup "which shops?" picker. */

export const SIGNUP_INTEREST_IDS = [
  "food_drink",
  "hair_grooming",
  "beauty",
  "fashion_vintage",
  "home_gifts",
  "fitness_wellbeing",
] as const;

export type SignupInterestId = (typeof SIGNUP_INTEREST_IDS)[number];

export const SIGNUP_INTEREST_LABELS: Record<SignupInterestId, string> = {
  food_drink: "Food & drink",
  hair_grooming: "Hair & grooming",
  beauty: "Beauty",
  fashion_vintage: "Fashion & vintage",
  home_gifts: "Home & gifts",
  fitness_wellbeing: "Fitness & wellbeing",
};

const ALLOWED = new Set<string>(SIGNUP_INTEREST_IDS);

/** Keep only known ids, drop duplicates, preserve catalogue order. */
export function sanitizeSignupInterests(raw: unknown): SignupInterestId[] {
  if (!Array.isArray(raw)) return [];
  const chosen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim();
    if (ALLOWED.has(id)) chosen.add(id);
  }
  return SIGNUP_INTEREST_IDS.filter((id) => chosen.has(id));
}

export type InterestCountRow = {
  id: SignupInterestId;
  label: string;
  subscribers: number;
};

/** Aggregate how many subscribers picked each interest. */
export function buildInterestCounts(
  rows: Array<{ signupInterests: string[] | null | undefined }>,
): InterestCountRow[] {
  const tallies = Object.fromEntries(SIGNUP_INTEREST_IDS.map((id) => [id, 0])) as Record<
    SignupInterestId,
    number
  >;
  for (const row of rows) {
    const unique = new Set(sanitizeSignupInterests(row.signupInterests ?? []));
    for (const id of unique) tallies[id] += 1;
  }
  return SIGNUP_INTEREST_IDS.map((id) => ({
    id,
    label: SIGNUP_INTEREST_LABELS[id],
    subscribers: tallies[id],
  }));
}
