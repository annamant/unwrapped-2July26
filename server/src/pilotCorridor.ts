/**
 * Shopper-facing lines for crawler HTML.
 * Keep aligned with client/src/lib/pilotCorridor.ts.
 */

export const PILOT_TITLE = "Know first. Reserve first.";

export const PILOT_DESCRIPTION =
  "Hear the moment your favourite local shops post something new, and pay to reserve it before anyone else can.";

export const PILOT_H1 = "Know first. Reserve first.";

export const PILOT_KICKER = "Choose my shops";

export const PILOT_NOTE =
  "Free. Emails only from shops you pick. Unsubscribe in one click.";

export const PILOT_SUB = PILOT_DESCRIPTION;

export const PILOT_SHOP =
  "Tell your regulars when you've got something on.";

/** Under the shopper hero — keep aligned with client/src/lib/pilotCorridor.ts. */
export const WHAT_UNWRAPPED_HEAD = "What Unwrapped is";

export const WHAT_IT_IS_LABEL = "What it is";
export const WHAT_IT_IS =
  "Unwrapped connects you with the local businesses near you that you love.";

export const WHAT_IT_DOES_LABEL = "What it does";
export const WHAT_IT_DOES =
  "You pick your interests and your favourite businesses, and we tell you the moment one posts something new. You pay to reserve it before anyone else can, then collect or turn up.";

export const WHY_SIGN_UP_LABEL = "Why sign up";
export const WHY_SIGN_UP =
  "Sign up for priority access — you hear first and reserve first — and for convenience: no checking feeds, no queueing, no missing out.";

export const WHAT_UNWRAPPED_IS = WHAT_IT_IS;
export const WHAT_UNWRAPPED_DOES = WHAT_IT_DOES;
export const WHAT_UNWRAPPED_WHY = WHY_SIGN_UP;

export const WHAT_UNWRAPPED_EXAMPLES =
  "It could be an item from a shop you like, a meal from a lunch spot you already go to, or a last-minute appointment at a barber or salon.";

export const HOW_IT_WORKS_STEPS = [
  {
    num: "01",
    title: "Pick your shops.",
    body: "Any local shop you already go to. Not listed? Tell us which one.",
  },
  {
    num: "02",
    title: "Get the heads-up.",
    body: "Only when they post something, never spam.",
  },
  {
    num: "03",
    title: "Pay for it, collect it.",
    body: "It's held for you in store.",
  },
] as const;

export const LOCAL_COLLECT_LINE =
  "Like Vinted or Whatnot, but from shops near you, and no courier.";

export const SHOP_LIST_HEAD = "Follow the shops you know.";

export const CLOSE_HEAD = "Which shops should we watch for you?";

export const SHOP_VALUE_HEAD =
  "We promote your offers to your customers at the right moment, in a way they'll want to open. Free to join, and you only pay when you sell.";

export const SHOP_VALUE_POINTS = [
  "Post one photo or short video and a line. No content job: your regulars follow you with one scan.",
  "Customers pay before they arrive, so no-shows don't cost you.",
  "You choose what and how many, so you never have to discount your brand.",
] as const;

/** How it works — shop steps on /business-apply. No commission numbers. */
export const SHOP_HOW_IT_WORKS_STEPS = [
  { num: "1", title: "Sign up." },
  { num: "2", title: "Post a photo or short video with a price." },
  { num: "3", title: "Your customers get told and pay to reserve." },
  { num: "4", title: "They collect in store." },
] as const;
