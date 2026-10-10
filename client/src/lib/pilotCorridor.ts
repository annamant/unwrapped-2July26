/**
 * Shopper-facing lines for the public site.
 * Keep the copy aligned with server/src/pilotCorridor.ts.
 */

export const PILOT_TITLE =
  "Your favourite local shops, telling you first.";

export const PILOT_DESCRIPTION =
  "Pick the shops you love. When one has something worth the trip, like a fresh batch, a one-off piece or a limited run, you hear about it before it sells out. Pay to hold it, then pick it up in store.";

export const PILOT_H1 =
  "Your favourite local shops, telling you first.";

export const PILOT_KICKER = "Choose my shops";

/** Under the Choose my shops button. */
export const PILOT_NOTE =
  "Free. Emails only from shops you pick. Unsubscribe in one click.";

export const PILOT_LOOP = "Pick your shops. Get the heads-up. Pay for it, collect it.";

export const PILOT_SUB = PILOT_DESCRIPTION;

/** Shop-side line. Links to the existing partner application. */
export const PILOT_SHOP =
  "Tell your regulars when you've got something on.";

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

/** Kept for business apply / FOR SHOPS band. */
export const SHOP_VALUE_HEAD =
  "Tell your regulars when you've got something on, and they come through the door.";

export const SHOP_VALUE_POINTS = [
  "Post one photo or short video and a line. No content job, no followers to build.",
  "Customers pay before they arrive, so no-shows don't cost you.",
  "You choose what and how many, so you never have to discount your brand.",
  "Free to join.",
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
