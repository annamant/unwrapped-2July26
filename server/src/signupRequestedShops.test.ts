import { sanitizeSignupRequestedShops } from "./signupRequestedShops";

function check(name: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (!ok) {
    console.error(`FAIL ${name}\n  got:      ${JSON.stringify(got)}\n  expected: ${JSON.stringify(expected)}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${name}`);
  }
}

check("empty string yields empty", sanitizeSignupRequestedShops(""), []);
check("undefined yields empty", sanitizeSignupRequestedShops(undefined), []);
check("non-string non-array yields empty", sanitizeSignupRequestedShops(12), []);
check(
  "splits commas and newlines",
  sanitizeSignupRequestedShops("  Bread Shop , Cafe Alma\nMakers Market  "),
  ["Bread Shop", "Cafe Alma", "Makers Market"],
);
check(
  "dedupes case-insensitively",
  sanitizeSignupRequestedShops("Alma\nalma\nALMA, Alma Cafe"),
  ["Alma", "Alma Cafe"],
);
check(
  "accepts array of strings",
  sanitizeSignupRequestedShops(["Shop A", "Shop B, Shop C"]),
  ["Shop A", "Shop B", "Shop C"],
);
check(
  "trims and collapses whitespace",
  sanitizeSignupRequestedShops("  The   Local   Bakery  "),
  ["The Local Bakery"],
);
check(
  "drops blank chunks",
  sanitizeSignupRequestedShops(",,\n  \nOnly One,"),
  ["Only One"],
);

const longName = "A".repeat(120);
check(
  "caps each name length",
  sanitizeSignupRequestedShops(longName)[0]?.length,
  80,
);

const many = Array.from({ length: 50 }, (_, i) => `Shop ${i + 1}`).join("\n");
check("caps total names at 40", sanitizeSignupRequestedShops(many).length, 40);

if (process.exitCode) {
  console.error("\nsignupRequestedShops tests failed.");
  process.exit(1);
}
console.log("\nAll signupRequestedShops cases passed.");
