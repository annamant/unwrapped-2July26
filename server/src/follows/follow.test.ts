import {
  buildFollowerAlertEmail,
  dropMediaPosterUrl,
  fanOutFollowerAlerts,
  formatAlertPrice,
} from "./alerts";
import { buildFollowCountRows } from "./counts";
import { carryOverFollows, planFollow, planUnfollow, type StoredFollow } from "./model";
import { resetRateLimits, takeRateLimit } from "./rateLimit";
import { signAlertUnsubscribeToken, verifyAlertUnsubscribeToken } from "./token";

let failed = 0;

function check(name: string, got: unknown, want: unknown) {
  const ok = typeof want === "function" ? (want as (value: unknown) => boolean)(got) : JSON.stringify(got) === JSON.stringify(want);
  if (ok) console.log(`ok   ${name}`);
  else {
    failed++;
    console.error(`fail ${name}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  }
}

const user = "user-1";
const pin = "lead:michael-s-meat-market";
const businessId = "11111111-1111-1111-1111-111111111111";

function row(partial: Partial<StoredFollow> & Pick<StoredFollow, "id">): StoredFollow {
  return {
    userId: user,
    businessId: null,
    directoryPinId: null,
    requestedAtSignup: false,
    ...partial,
  };
}

const empty: StoredFollow[] = [];
const first = planFollow(empty, user, { businessId: null, directoryPinId: pin }, false);
check("follow unclaimed pin inserts a pin id and no business", first, {
  action: "insert",
  values: { userId: user, businessId: null, directoryPinId: pin, requestedAtSignup: false },
});

const stored: StoredFollow[] = [
  row({ id: "f1", directoryPinId: pin }),
];
const again = planFollow(stored, user, { businessId: null, directoryPinId: pin }, false);
check("following the same pin again does not insert a second row", again.action, "update");
check("repeat follow keeps a single id", again.action === "update" ? again.deleteIds : [], []);

const signup = planFollow(stored, user, { businessId: null, directoryPinId: pin }, true);
check("signup request sticks on an existing follow", signup.action === "update" ? signup.values.requestedAtSignup : false, true);

const gone = planUnfollow(stored, user, { businessId: null, directoryPinId: pin });
check("unfollow removes the pin follow", gone, ["f1"]);

const other = planUnfollow(stored, user, { businessId: businessId, directoryPinId: null });
check("unfollow of a different shop leaves the pin follow", other, []);

const split: StoredFollow[] = [
  row({ id: "pin-row", directoryPinId: pin, requestedAtSignup: true }),
  row({ id: "biz-row", businessId, requestedAtSignup: false }),
];
const merged = planFollow(split, user, { businessId, directoryPinId: pin }, false);
check("follow merges pin and business rows for the same shop", merged.action === "update" ? merged.deleteIds : [], ["biz-row"]);
check("merged follow keeps the signup flag", merged.action === "update" ? merged.values.requestedAtSignup : false, true);
check("merged follow stores both keys", merged.action === "update" ? merged.values : null, {
  userId: user,
  businessId,
  directoryPinId: pin,
  requestedAtSignup: true,
});

const carried = carryOverFollows(
  [row({ id: "only-pin", directoryPinId: pin, requestedAtSignup: true })],
  pin,
  businessId,
);
check("claim attaches the business id to the pin follow", carried.updates, [{
  id: "only-pin",
  businessId,
  directoryPinId: pin,
  requestedAtSignup: true,
}]);
check("claim of a single follow deletes nothing", carried.deleteIds, []);

const carriedDupes = carryOverFollows(split, pin, businessId);
check("claim collapses two follows into one", carriedDupes.deleteIds, ["biz-row"]);
check("claim keeps the signup request", carriedDupes.updates[0]?.requestedAtSignup, true);

let blew = false;
try {
  planFollow(empty, user, { businessId: null, directoryPinId: null }, false);
} catch {
  blew = true;
}
check("follow without a shop is rejected", blew, true);

const secret = "test-secret";
const token = signAlertUnsubscribeToken(user, secret);
check("unsubscribe token round-trips", verifyAlertUnsubscribeToken(token, secret), user);
check("unsubscribe token rejects a bad signature", verifyAlertUnsubscribeToken(`${token}x`, secret), null);
check("unsubscribe token rejects the wrong secret", verifyAlertUnsubscribeToken(token, "other"), null);
check("unsubscribe token rejects junk", verifyAlertUnsubscribeToken("nope", secret), null);

const poster = "https://res.cloudinary.com/demo/video/upload/v1/clip.mp4";
check(
  "video poster is a cloudinary still",
  dropMediaPosterUrl(poster, "video"),
  "https://res.cloudinary.com/demo/video/upload/so_0,f_jpg/v1/clip.jpg",
);
check("photo url is used as itself", dropMediaPosterUrl("https://cdn.example/a.jpg", "image"), "https://cdn.example/a.jpg");
check("price formats pence", formatAlertPrice(1250), "£12.50");

const email = buildFollowerAlertEmail({
  to: "a@example.com",
  drop: {
    id: "drop-1",
    title: "Rye loaf",
    pricePence: 450,
    imageUrl: "https://cdn.example/loaf.jpg",
    mediaType: "image",
    businessName: "Michael's Meat Market",
    bookingUrl: "https://shopunwrapped.com/drop/drop-1",
  },
  unsubscribePageUrl: "https://shopunwrapped.com/unsubscribe?token=abc",
  oneClickUrl: "https://api.example/api/alerts/unsubscribe?token=abc",
});
check("alert subject names the shop and drop", email.subject, "Michael's Meat Market posted Rye loaf");
check("alert html includes the photo", email.html.includes("https://cdn.example/loaf.jpg"), true);
check("alert html includes the title", email.html.includes("Rye loaf"), true);
check("alert html includes the price", email.html.includes("£4.50"), true);
check("alert html includes the booking link", email.html.includes("https://shopunwrapped.com/drop/drop-1"), true);
check("alert html includes unsubscribe", email.html.includes("https://shopunwrapped.com/unsubscribe?token=abc"), true);
check("list-unsubscribe header is the one-click url", email.headers["List-Unsubscribe"], "<https://api.example/api/alerts/unsubscribe?token=abc>");
check("list-unsubscribe-post is one-click", email.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
check("shop name is escaped", email.html.includes("Michael&#39;s Meat Market"), true);

async function main() {
const mailed: string[] = [];
const claimed = new Set<string>();
const result = await fanOutFollowerAlerts({
  drop: {
    id: "drop-1",
    title: "Rye loaf",
    pricePence: 450,
    imageUrl: null,
    mediaType: "image",
    businessName: "Irene",
    bookingUrl: "https://shopunwrapped.com/drop/drop-1",
  },
  followers: [
    { userId: "a", email: "a@example.com", dropAlertsEnabled: true },
    { userId: "a", email: "a@example.com", dropAlertsEnabled: true },
    { userId: "b", email: "b@example.com", dropAlertsEnabled: false },
    { userId: "c", email: "c@example.com", dropAlertsEnabled: true },
    { userId: "d", email: "", dropAlertsEnabled: true },
  ],
  claimSend: async (id) => {
    if (claimed.has(id)) return false;
    claimed.add(id);
    return true;
  },
  releaseSend: async (id) => {
    claimed.delete(id);
  },
  mailer: async (message) => {
    mailed.push(message.to);
  },
  unsubscribePageUrl: (id) => `https://shopunwrapped.com/unsubscribe?token=${id}`,
  oneClickUrl: (id) => `https://api.example/unsub?token=${id}`,
});

check("fan-out emails each eligible follower once", mailed, ["a@example.com", "c@example.com"]);
check("fan-out records who was sent", result.sent, ["a", "c"]);
check("fan-out skips duplicates, opt-outs, and blank emails", result.skipped, ["a", "b", "d"]);

const mailedOnce: string[] = [];
const second = await fanOutFollowerAlerts({
  drop: {
    id: "drop-1",
    title: "Rye loaf",
    pricePence: 450,
    imageUrl: null,
    mediaType: "image",
    businessName: "Irene",
    bookingUrl: "https://shopunwrapped.com/drop/drop-1",
  },
  followers: [{ userId: "a", email: "a@example.com", dropAlertsEnabled: true }],
  claimSend: async () => false,
  releaseSend: async () => {},
  mailer: async (message) => {
    mailedOnce.push(message.to);
  },
  unsubscribePageUrl: () => "https://shopunwrapped.com/unsubscribe",
  oneClickUrl: () => "https://api.example/unsub",
});
check("already-sent follower is not emailed again", mailedOnce, []);
check("already-sent follower is skipped", second.skipped, ["a"]);

let released = false;
await fanOutFollowerAlerts({
  drop: {
    id: "drop-2",
    title: "Rye",
    pricePence: 100,
    imageUrl: null,
    mediaType: "image",
    businessName: "Irene",
    bookingUrl: "https://shopunwrapped.com/drop/drop-2",
  },
  followers: [{ userId: "e", email: "e@example.com", dropAlertsEnabled: true }],
  claimSend: async () => true,
  releaseSend: async () => {
    released = true;
  },
  mailer: async () => {
    throw new Error("mail down");
  },
  unsubscribePageUrl: () => "https://shopunwrapped.com/unsubscribe",
  oneClickUrl: () => "https://api.example/unsub",
});
check("a failed send releases the dedupe claim", released, true);

resetRateLimits();
let allowed = 0;
for (let i = 0; i < 5; i++) {
  if (takeRateLimit("follow-test", 3, 60_000, 1_000 + i)) allowed++;
}
check("rate limit allows the first three follows", allowed, 3);
check("rate limit blocks the fourth follow", takeRateLimit("follow-test", 3, 60_000, 2_000), false);

const counts = buildFollowCountRows({
  pins: [{ id: pin, name: "Michael's Meat Market" }],
  businesses: [
    { id: businessId, name: "Michael's Meat Market", slug: "michaels", postcode: "SW9 8JL", directoryPinId: pin },
    { id: "22222222-2222-2222-2222-222222222222", name: "Other Shop", slug: "other", postcode: null, directoryPinId: null },
  ],
  follows: [
    { id: "1", businessId, directoryPinId: pin, requestedAtSignup: true },
    { id: "2", businessId: null, directoryPinId: pin, requestedAtSignup: false },
    { id: "3", businessId: "22222222-2222-2222-2222-222222222222", directoryPinId: null, requestedAtSignup: true },
  ],
});
const curated = counts.find((shop) => shop.pinId === pin);
check("curated shop counts both pin follows once each", curated?.followers, 2);
check("signup requests are counted separately", curated?.requestedAtSignup, 1);
check("unmatched live business is still listed", counts.some((shop) => shop.businessId === "22222222-2222-2222-2222-222222222222" && shop.followers === 1), true);

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll follow tests passed.");
}

main();
