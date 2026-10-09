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

check("product floor is £5", MIN_LIST_PRICE_PENCE === 500);
check("message is exact", MIN_LIST_PRICE_MESSAGE === "Enter a price of at least £5.");
check("zero is rejected", paidListPriceError(0) === MIN_LIST_PRICE_MESSAGE);
check("stripe minimum alone is rejected", paidListPriceError(30) === MIN_LIST_PRICE_MESSAGE);
check("£4.99 is rejected", paidListPriceError(499) === MIN_LIST_PRICE_MESSAGE);
check("£5 is accepted", paidListPriceError(500) === null);
check(
  "£5 list price clears Stripe's charge minimum",
  checkoutFromList(500) >= STRIPE_GBP_MIN_CHARGE_PENCE,
);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nclient paid-only price checks passed.");
