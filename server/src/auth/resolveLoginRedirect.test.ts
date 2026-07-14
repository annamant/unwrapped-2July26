import { resolveLoginRedirect } from "./resolveLoginRedirect";

const active = { status: "active" as const };
const pending = { status: "pending" as const };

const cases: Array<{
  name: string;
  user: { onboardingComplete: boolean; role: string };
  business: { status: string } | undefined;
  portal: "shopper" | "business";
  want: string;
}> = [
  {
    name: "merchant via business portal (the P0 bug)",
    user: { onboardingComplete: false, role: "consumer" },
    business: active,
    portal: "business",
    want: "/dashboard",
  },
  {
    name: "merchant via shopper portal",
    user: { onboardingComplete: false, role: "consumer" },
    business: active,
    portal: "shopper",
    want: "/home",
  },
  {
    name: "admin-only via shopper portal",
    user: { onboardingComplete: false, role: "admin" },
    business: undefined,
    portal: "shopper",
    want: "/admin",
  },
  {
    name: "admin-only via business portal",
    user: { onboardingComplete: false, role: "admin" },
    business: undefined,
    portal: "business",
    want: "/admin",
  },
  {
    name: "new shopper, incomplete onboarding",
    user: { onboardingComplete: false, role: "consumer" },
    business: undefined,
    portal: "shopper",
    want: "/onboarding",
  },
  {
    name: "shopper, onboarding done",
    user: { onboardingComplete: true, role: "consumer" },
    business: undefined,
    portal: "shopper",
    want: "/home",
  },
  {
    name: "business portal, no active business",
    user: { onboardingComplete: true, role: "consumer" },
    business: pending,
    portal: "business",
    want: "/business/signin",
  },
];

let failed = 0;
for (const c of cases) {
  const got = resolveLoginRedirect(c.user, c.business, c.portal);
  if (got !== c.want) {
    console.error(`FAIL: ${c.name}\n  want ${c.want}, got ${got}`);
    failed++;
  } else {
    console.log(`ok   ${c.name} → ${got}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log(`\nAll ${cases.length} redirect cases passed.`);
