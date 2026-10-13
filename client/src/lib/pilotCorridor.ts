/**
 * Shopper-facing lines for the public site.
 * Keep the copy aligned with server/src/pilotCorridor.ts.
 *
 * Rules for shopper homepage copy: no "high street", no street names,
 * no commission numbers, no request counts, and nothing telling shoppers
 * we'll take their requests to shops or use their picks to onboard shops.
 */

export const PILOT_TITLE = "First pick from the local shops you love.";

export const PILOT_DESCRIPTION =
  "Tell us the shops and the kinds of things you want to hear about. When there's something new, you're the first to know. Pay to reserve in a tap and it's held for you under your name.";

export const PILOT_H1 = "First pick from the local shops you love.";

export const PILOT_KICKER = "Get first dibs. Free.";

/** Under the Get first dibs button. */
export const PILOT_NOTE =
  "Only the shops and interests you choose. Unsubscribe in one click.";

export const PILOT_LOOP =
  "Tell us what you're after. Hear the moment something's up. Reserve it and collect.";

export const PILOT_SUB = PILOT_DESCRIPTION;

/** Shop-side line. Links to the existing partner application. */
export const PILOT_SHOP =
  "Tell your regulars when you've got something on.";

/** Directly under the shopper hero. */
export const FEELS_LIKE_HEAD = "What it feels like";

export const FEELS_LIKE_BODY =
  "The sourdough you always miss. The jacket that was never there when you went in. The barber slot that opened ten minutes ago. You hear first, and it's yours before anyone else can take it.";

export const WHY_LIKE_HEAD = "Why you'll like it";

export const WHY_LIKE_POINTS = [
  {
    lead: "Get the thing you wanted.",
    body: "Something good goes up and you get the first chance at it.",
  },
  {
    lead: "No queueing, no wasted trips.",
    body: "You only go in when something is waiting for you.",
  },
  {
    lead: "Back your local shops.",
    body: "Your money goes to the independents you want around for years.",
  },
  {
    lead: "Only what you chose.",
    body: "Follow specific shops, or whole interests like vintage, coffee, barbers or salons.",
  },
] as const;

/** How it works — shopper steps. */
export const HOW_IT_WORKS_HEAD = "How it works";

export const HOW_IT_WORKS_STEPS = [
  {
    num: "01",
    title: "Tell us what you're after.",
    body: "Name the local shops you'd follow, or pick the interests you care about.",
  },
  {
    num: "02",
    title: "Hear the moment something's up.",
    body: "We alert you when a shop or interest you chose has something new.",
  },
  {
    num: "03",
    title: "Reserve it and collect.",
    body: "It's held for you under your name. No courier, no waiting.",
  },
] as const;

export const BEFORE_SIGNUP_HEAD = "Before you sign up";

export const BEFORE_SIGNUP_FAQS = [
  {
    q: "Is it free?",
    a: "Yes. Joining costs nothing.",
  },
  {
    q: "Why pay to reserve?",
    a: "Paying is what holds it for you. If the shop can't hand it over, or you cancel before collection opens, you get a full refund.",
  },
  {
    q: "When does it start?",
    a: "Live in London now, with more shops joining every week.",
  },
] as const;

export const SHOP_LIST_HEAD = "Follow the shops you know.";

export const SHOP_LIST_FOOT =
  "Shops start posting as they join. Follow now and you'll hear the moment they do.";

export const CLOSE_HEAD = "Which shops would you hate to miss out on?";

export const CLOSE_SUB = "Name them, and you'll hear first when they post.";

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
