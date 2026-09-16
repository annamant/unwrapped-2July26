import QRCode from "qrcode";
import {
  DROP_ID_RE,
  dropPublicUrl,
  dropShareNudge,
  dropShareText,
  formatCollectionWindow,
  isDropId,
  whatsappShareUrl,
} from "./dropShare";

const dropId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const title = "Sourdough surplus";
const collectionStart = "2026-09-16T09:00:00.000Z";
const collectionEnd = "2026-09-16T12:00:00.000Z";

let failed = 0;

function check(name: string, got: string | boolean, want: string | boolean | ((g: string) => boolean)) {
  const ok = typeof want === "function" ? want(String(got)) : got === want;
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}\n  got:  ${got}\n  want: ${want}`);
  }
}

check("drop URL is production /drop/:id", dropPublicUrl(dropId), `https://shopunwrapped.com/drop/${dropId}`);
check("drop URL is never the scanner", dropPublicUrl(dropId), g => !g.includes("scanner"));

check("UUID id is accepted", isDropId(dropId), true);
check("uppercase UUID is accepted", isDropId(dropId.toUpperCase()), true);
check("'new' is not a drop id", isDropId("new"), false);
check("scanner path is not a drop id", isDropId("scanner"), false);
check("empty id is rejected", isDropId(""), false);
check("DROP_ID_RE matches create-drop ids", DROP_ID_RE.test(dropId), true);

const windowLabel = formatCollectionWindow(collectionStart, collectionEnd);
check("collection window includes start and end times", windowLabel, g => g.includes("–") && !g.includes("Invalid") && g !== "window TBC");
check("invalid dates do not throw", formatCollectionWindow("nope", "also-nope"), "window TBC");

const overnight = formatCollectionWindow("2026-09-16T23:00:00.000Z", "2026-09-17T01:00:00.000Z");
check("multi-day window keeps both dates or times", overnight, g => g.includes("–") && g !== "window TBC");

const text = dropShareText({ title, collectionStart, collectionEnd, dropId });
check("share text has title", text, g => g.startsWith(title));
check("share text has Collect line", text, g => g.includes("Collect "));
check("share text has drop URL", text, g => g.includes(`https://shopunwrapped.com/drop/${dropId}`));
check("share text is not the scanner", text, g => !g.includes("scanner") && !g.includes("/dashboard/"));

const wa = whatsappShareUrl({ title, collectionStart, collectionEnd, dropId });
check("WhatsApp uses wa.me/?text=", wa, g => g.startsWith("https://wa.me/?text="));
check("WhatsApp text is encoded", wa, `https://wa.me/?text=${encodeURIComponent(text)}`);
check("WhatsApp payload is not the scanner", wa, g => !g.includes("scanner"));

const nudge = dropShareNudge({ title, collectionStart, collectionEnd, dropId });
check("nudge mentions Unwrapped", nudge, g => g.includes("Unwrapped"));
check("nudge has drop URL", nudge, g => g.includes(`https://shopunwrapped.com/drop/${dropId}`));
check("nudge is readonly-copy payload not a dashboard URL", nudge, g => !g.includes("/dashboard/"));
check("nudge does not shadow collection window", dropShareNudge({ title, collectionStart, collectionEnd, dropId }), g => g.includes("Collect ") && g.includes(title));

const qrUrl = dropPublicUrl(dropId);
try {
  const payload = QRCode.create(qrUrl, { errorCorrectionLevel: "H" });
  check("QR encodes the public drop URL", payload.modules.size > 0, true);
} catch (err) {
  failed++;
  console.error(`fail QR generation\n  ${err}`);
}

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll dropShare cases passed.");
