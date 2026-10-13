import {
  buildInterestCounts,
  sanitizeSignupInterests,
  SIGNUP_INTEREST_IDS,
  SIGNUP_INTEREST_LABELS,
} from "./signupInterests";

function check(name: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL ${name}\n  got:      ${JSON.stringify(got)}\n  expected: ${JSON.stringify(expected)}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${name}`);
  }
}

check("empty input yields empty interests", sanitizeSignupInterests(undefined), []);
check("non-array yields empty", sanitizeSignupInterests("food_drink"), []);
check(
  "keeps known ids and drops unknowns",
  sanitizeSignupInterests(["food_drink", "not-a-real", "beauty", "food_drink", "  ", 12]),
  ["food_drink", "beauty"],
);
check(
  "preserves catalogue order",
  sanitizeSignupInterests(["fitness_wellbeing", "food_drink", "hair_grooming"]),
  ["food_drink", "hair_grooming", "fitness_wellbeing"],
);
check("catalogue covers every label", SIGNUP_INTEREST_IDS.every((id) => SIGNUP_INTEREST_LABELS[id]), true);

const counts = buildInterestCounts([
  { signupInterests: ["food_drink", "beauty"] },
  { signupInterests: ["food_drink", "food_drink", "unknown"] },
  { signupInterests: [] },
  { signupInterests: null },
  { signupInterests: ["hair_grooming"] },
]);
check("food & drink count", counts.find((row) => row.id === "food_drink")?.subscribers, 2);
check("beauty count", counts.find((row) => row.id === "beauty")?.subscribers, 1);
check("hair count", counts.find((row) => row.id === "hair_grooming")?.subscribers, 1);
check("unused interest stays zero", counts.find((row) => row.id === "home_gifts")?.subscribers, 0);
check("returns one row per catalogue interest", counts.length, SIGNUP_INTEREST_IDS.length);
check(
  "labels match catalogue",
  counts.map((row) => row.label),
  SIGNUP_INTEREST_IDS.map((id) => SIGNUP_INTEREST_LABELS[id]),
);

if (process.exitCode) {
  console.error("\nsignupInterests tests failed.");
  process.exit(1);
}
console.log("\nAll signupInterests cases passed.");
