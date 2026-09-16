import {
  dropPublicUrl,
  dropShareNudge,
  dropShareText,
  formatCollectionWindow,
  whatsappShareUrl,
} from "./dropShare";

const dropId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const title = "Sourdough surplus";
const collectionStart = "2026-09-16T09:00:00.000Z";
const collectionEnd = "2026-09-16T12:00:00.000Z";

let failed = 0;

function check(name: string, got: string, want: string | ((g: string) => boolean)) {
  const ok = typeof want === "function" ? want(got) : got === want;
  if (ok) {
    console.log(`ok   ${name}`);
  } else {
    failed++;
    console.error(`fail ${name}\n  got:  ${got}\n  want: ${want}`);
  }
}

check("drop URL is production /drop/:id", dropPublicUrl(dropId), `https://shopunwrapped.com/drop/${dropId}`);

const windowLabel = formatCollectionWindow(collectionStart, collectionEnd);
check("collection window includes start and end times", windowLabel, g => g.includes("–") && !g.includes("Invalid"));

const text = dropShareText({ title, collectionStart, collectionEnd, dropId });
check("share text has title", text, g => g.startsWith(title));
check("share text has Collect line", text, g => g.includes("Collect "));
check("share text has drop URL", text, g => g.includes(`https://shopunwrapped.com/drop/${dropId}`));

const wa = whatsappShareUrl({ title, collectionStart, collectionEnd, dropId });
check("WhatsApp uses wa.me/?text=", wa, g => g.startsWith("https://wa.me/?text="));
check("WhatsApp text is encoded", wa, `https://wa.me/?text=${encodeURIComponent(text)}`);
check("WhatsApp payload is not the scanner", wa, g => !g.includes("scanner"));

const nudge = dropShareNudge({ title, collectionStart, collectionEnd, dropId });
check("nudge mentions Unwrapped", nudge, g => g.includes("Unwrapped"));
check("nudge has drop URL", nudge, g => g.includes(`https://shopunwrapped.com/drop/${dropId}`));

if (failed > 0) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log("\nAll dropShare cases passed.");
