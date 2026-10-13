/**
 * Shopper-facing lines for the public site.
 * Keep the copy aligned with server/src/pilotCorridor.ts.
 */

export const PILOT_TITLE = "Know first. Reserve first.";

export const PILOT_DESCRIPTION =
  "Hear the moment your favourite local shops post something new, and pay to reserve it before anyone else can.";

export const PILOT_H1 = "Know first. Reserve first.";

export const PILOT_KICKER = "Get first dibs";

/** Under the Get first dibs button. */
export const PILOT_NOTE =
  "Free. Emails only from shops you pick. Unsubscribe in one click.";

export const PILOT_LOOP = "Pick your shops. Get the heads-up. Pay for it, collect it.";

export const PILOT_SUB = PILOT_DESCRIPTION;

/** Shop-side line. Links to the existing partner application. */
export const PILOT_SHOP =
  "Tell your regulars when you've got something on.";

/**
 * Directly under the shopper hero — What it is / What it does / Why sign up.
 * For everyone (not women-only). Not food-only. No high street / street names /
 * photographed specials / commission numbers.
 */
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

/** @deprecated Prefer WHAT_IT_IS — kept so older imports keep compiling. */
export const WHAT_UNWRAPPED_IS = WHAT_IT_IS;
/** @deprecated Prefer WHAT_IT_DOES */
export const WHAT_UNWRAPPED_DOES = WHAT_IT_DOES;
/** @deprecated Prefer WHY_SIGN_UP */
export const WHAT_UNWRAPPED_WHY = WHY_SIGN_UP;

export const WHAT_UNWRAPPED_EXAMPLES =
  "It could be an item from a shop you like, a meal from a lunch spot you already go to, or a last-minute appointment at a barber or salon.";

/** How it works — shopper steps. */
export const HOW_IT_WORKS_HEAD = "How it works";

export const HOW_IT_WORKS_STEPS = [
  {
    num: "01",
    title: "Pick your shops.",
    body: "Any local shop you already go to. Not listed? Tell us which one.",
    recommendLink: true,
  },
  {
    num: "02",
    title: "Get the heads-up.",
    body: "Only when they post something, never spam.",
    recommendLink: false,
  },
  {
    num: "03",
    title: "Pay for it, collect it.",
    body: "It's held for you in store.",
    recommendLink: false,
  },
] as const;

/** Below how-it-works steps. Never a headline. */
export const LOCAL_COLLECT_LINE =
  "Like Vinted or Whatnot, but from shops near you, and no courier.";

export const SHOP_LIST_HEAD = "Follow the shops you know.";

export const SHOP_LIST_FOOT =
  "Shops start posting as they join. Follow now and you'll hear the moment they do.";

export const CLOSE_HEAD = "Which shops should we watch for you?";

/** Shop-facing value prop — business apply only, not the homepage. */
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

/** Neutral London map centre. Not a neighbourhood label. */
export const PILOT_MAP = { lat: 51.509865, lng: -0.118092, zoom: 13 };

/**
 * Real claimed member shops to hide from the public homepage list/map only.
 * Keep them in the DB and available in admin / signup picker.
 */
export const HOMEPAGE_HIDDEN_MEMBER_NAMES = [
  "Brixton Village",
  "Brixton Village Market",
  "Dash The Henge Store",
  "G-Force Reformer Pilates",
  "Get Rid of and Donate CIC",
  "Inverted Audio Record Store",
  "Pulkra",
  "Wave Brazilian Jiu Jitsu",
] as const;
