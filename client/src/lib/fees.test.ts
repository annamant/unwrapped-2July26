import {
  checkoutFromList,
  MIN_LIST_PRICE_MESSAGE,
  MIN_LIST_PRICE_PENCE,
  paidListPriceError,
  STRIPE_GBP_MIN_CHARGE_PENCE,
} from "./fees";

let failed = 0;

function check(name: string, ok: boolean) {
  if (ok) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`fail ${name}`);
  }
}

check("stripe floor is £0.30", STRIPE_GBP_MIN_CHARGE_PENCE === 30);
check("list floor matches stripe charge floor", MIN_LIST_PRICE_PENCE === 30);
check("zero is rejected", paidListPriceError(0) === MIN_LIST_PRICE_MESSAGE);
check("one pence is rejected", paidListPriceError(1) === MIN_LIST_PRICE_MESSAGE);
check("29 pence is rejected", paidListPriceError(29) === MIN_LIST_PRICE_MESSAGE);
check("£0.30 is accepted", paidListPriceError(30) === null);
check(
  "£0.30 list price clears Stripe's charge minimum",
  checkoutFromList(30) >= STRIPE_GBP_MIN_CHARGE_PENCE,
);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nclient paid-only price checks passed.");
