/**
 * Guardrails for shopper-facing homepage copy.
 * Fail if forbidden phrases sneak back into the shared constants.
 */
import {
  BEFORE_SIGNUP_FAQS,
  CLOSE_HEAD,
  CLOSE_SUB,
  FEELS_LIKE_BODY,
  FEELS_LIKE_HEAD,
  HOW_IT_WORKS_STEPS,
  PILOT_DESCRIPTION,
  PILOT_H1,
  PILOT_KICKER,
  PILOT_NOTE,
  PILOT_SUB,
  WHY_LIKE_POINTS,
} from "./pilotCorridor";

function check(name: string, got: unknown, expected: unknown) {
  const ok = got === expected;
  if (!ok) {
    console.error(`FAIL ${name}\n  got:      ${JSON.stringify(got)}\n  expected: ${JSON.stringify(expected)}`);
    process.exitCode = 1;
  } else {
    console.log(`ok ${name}`);
  }
}

const shopperCopy = [
  PILOT_H1,
  PILOT_SUB,
  PILOT_DESCRIPTION,
  PILOT_KICKER,
  PILOT_NOTE,
  FEELS_LIKE_HEAD,
  FEELS_LIKE_BODY,
  ...WHY_LIKE_POINTS.flatMap((p) => [p.lead, p.body]),
  ...HOW_IT_WORKS_STEPS.flatMap((s) => [s.title, s.body]),
  ...BEFORE_SIGNUP_FAQS.flatMap((f) => [f.q, f.a]),
  CLOSE_HEAD,
  CLOSE_SUB,
].join("\n");

const lower = shopperCopy.toLowerCase();

check("hero h1 matches brief", PILOT_H1, "First pick from the local shops you love.");
check("cta matches brief", PILOT_KICKER, "Get first dibs. Free.");
check("no high street", lower.includes("high street"), false);
check("no commission talk", /commission|%\s*fee|take\s+\d+%/.test(lower), false);
check("no request counts", /request count|\d+\s+requests|people asked/.test(lower), false);
check(
  "does not promise taking picks to shops",
  /take your (requests|picks) to|use your picks to onboard|we'll (contact|reach out to) (those |the )?shops|tell (the|those) shops you asked/.test(
    lower,
  ),
  false,
);
check("closing asks which shops they'd hate to miss", CLOSE_HEAD.includes("hate to miss"), true);
check("closing sub is hear-first", CLOSE_SUB.includes("hear first"), true);
check("how it works has 3 steps", HOW_IT_WORKS_STEPS.length, 3);
check("why you'll like it has 4 points", WHY_LIKE_POINTS.length, 4);
check("faq has 3 items", BEFORE_SIGNUP_FAQS.length, 3);

if (process.exitCode) {
  console.error("\npilotCorridor copy tests failed.");
  process.exit(1);
}
console.log("\nAll pilotCorridor copy cases passed.");
