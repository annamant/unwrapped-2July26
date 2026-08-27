# Instagram playbook — Unwrapped

## Channel job

Be the local FOMO feed for London independent drops. Convert profile visitors via link → `shopunwrapped.com/instagram`.

## Profile checklist

- [ ] PFP from `brand` profile-picture export
- [ ] Bio = brand bible canonical text
- [ ] Link = shopunwrapped.com/instagram
- [ ] Highlights: Drops · How it works · Shops · For business

## Weekly CMO ritual

1. Scan live site for real drop energy (do not invent counts).
2. Fill next 7 days in `marketing/instagram/CONTENT_CALENDAR.md`.
3. Produce creatives (canvas brand templates first for single-image feed posts; Gamma/Meta/manual export for carousel work).
4. Save drafts to `marketing/instagram/drafts/YYYY-MM-DD/`.
5. Update calendar statuses.
6. Optionally push drafts into Meta Business Suite planner (browser, logged-in session).
7. Send CMO report; wait for publish approval unless told otherwise.

## Creative production preference

For Instagram single-image feed posts, prefer the **canvas-to-File** brand template workflow when the idea can be expressed typographically or with simple brand shapes. It keeps the Unwrapped logo precise, avoids download/export handoffs, and can publish directly through Instagram web.

Use Gamma when the human explicitly asks for Gamma, when making decks/presentations, when a creative needs a richer layout than the canvas template can reasonably produce, or when the post must be a true carousel.

## Gamma prompts (seed, when using Gamma)

Always inject brand tokens and "editorial London local businesses, baby pink #FFE0E7, British Racing Green #244B36, Playfair Display headline, Space Mono labels, sparse layout, no purple, no stock AI gradient".

**Drop alert (1:1)**  
Big Space-Mono number or LIVE mark; Playfair italic subline; racing-green live dot; "Reserve in seconds".

**Business spotlight (4:5)**  
Business name as hero; neighbourhood label in mono; quiet cream field; single CTA.

**How it works carousel**  
3 cards: Find a drop → Reserve → Collect with QR. One action per card. Use Gamma/Meta/manual export for true carousel publishing; do not use direct-web multi-file canvas upload.

## Login & account access

The CMO uses the human’s browser session. No passwords in the repo.

1. Open Meta Business Suite / Instagram / Gamma.
2. If already signed in → proceed.
3. If login, 2FA, or checkpoint → stop, ask the human to sign in (or Take Control), then continue.
4. Prefer Meta Business Suite planner over Instagram mobile web for scheduling.

## Direct Instagram web posting — known working path

Use this when the human explicitly asks to **post / publish now** on Instagram and the account is already logged in. This is the preferred path for grid-safe typographic single-image Instagram feed posts. It avoids the native file picker, which is unreliable from the browser automation tools, and avoids Gamma download/export handoffs.

Known working route:

1. Browser → `https://www.instagram.com/shopunwrapped/`
2. Click `New post`.
3. Use `browser_cdp` with `Runtime.evaluate` to create the creative in-page as a canvas, convert it to a JPEG `File`, attach it to Instagram's hidden `input[type="file"]`, and dispatch `input` / `change` / drag-drop events.
4. Instagram should move to the crop/edit screen.
5. Click `Next`, fill the caption, click `Share`.
6. Verify with a fresh load of `https://www.instagram.com/shopunwrapped/?fresh=1`; do not trust the first cached profile view.
7. Update `marketing/instagram/CONTENT_CALENDAR.md` with the actual live post(s).

Important:

- Do **not** keep retrying `Select From Computer` if the native picker does not open. Switch to the canvas-to-`File` workflow.
- Treat the canvas-to-`File` workflow as proven for **single-image posts only**. A multi-file `DataTransfer` may show as a carousel during crop, but Instagram can publish only the first file. Do not label or design anything as `01/03` unless a real carousel has been verified after posting.
- Use square `1080x1080` for grid-safe single posts; use `1080x1350` only when the post needs 4:5 portrait.
- Keep all critical text away from edges because the profile grid square-crops portrait posts.
- If Instagram returns to the feed after `Share`, reload the profile with `?fresh=1`; newly posted tiles may appear only after a fresh load.

## Correction protocol for live Instagram posts

If the image itself contains a mistake, Instagram cannot edit the pixels after publishing.

1. Create the corrected single-image creative.
2. Publish the corrected post first, using the same or improved caption.
3. Fresh-load the profile and verify the corrected post is live.
4. Delete the confusing old post only after the corrected post is visible.
5. Update `marketing/instagram/CONTENT_CALENDAR.md` with `corrected` status and a short note.

Reusable `browser_cdp` expression template:

```js
(async () => {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d");
  const cream = "#FFE0E7";
  const ink = "#244B36";
  const inkGreen = "#244B36";
  const border = "#E0DFD9";

  ctx.fillStyle = cream;
  ctx.fillRect(0, 0, W, H);

  function text(value, x, y, size, font, color = ink, weight = "400") {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillText(value, x, y);
  }

  // Build the creative. Keep this brand-sparse and grid-safe.
  ctx.fillStyle = ink;
  ctx.fillRect(96, 86, 78, 78);
  text("U", 119, 146, 54, "Georgia, serif", cream, "700");
  ctx.fillStyle = inkGreen;
  ctx.beginPath();
  ctx.arc(172, 88, 13, 0, Math.PI * 2);
  ctx.fill();

  text("Unwrapped", 202, 143, 48, "Georgia, serif", ink, "700");
  text("HOW IT WORKS", 96, 280, 25, "Menlo, monospace", inkGreen);
  text("A drop is simple.", 96, 430, 82, "Georgia, serif", ink, "700");

  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.roundRect(96, 535, 888, 260, 28);
  ctx.stroke();
  text("01", 136, 620, 30, "Menlo, monospace", inkGreen);
  text("Find what is live.", 205, 620, 38, "Helvetica, Arial, sans-serif");
  text("02", 136, 695, 30, "Menlo, monospace", inkGreen);
  text("Reserve in seconds.", 205, 695, 38, "Helvetica, Arial, sans-serif");
  text("03", 136, 770, 30, "Menlo, monospace", inkGreen);
  text("Collect with QR.", 205, 770, 38, "Helvetica, Arial, sans-serif");
  text("SHOPUNWRAPPED.COM", 96, 970, 25, "Menlo, monospace");

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92)
  );
  const file = new File([blob], "unwrapped-instagram-post.jpg", {
    type: "image/jpeg",
  });

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  const input = document.querySelector('input[type="file"]');
  if (!input) return { ok: false, error: "no file input" };

  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));

  const dropTarget =
    [...document.querySelectorAll("div, main, section")].find((el) =>
      /Drag photos and videos here/i.test(el.innerText || "")
    ) || input;

  for (const type of ["dragenter", "dragover", "drop"]) {
    dropTarget.dispatchEvent(
      new DragEvent(type, {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      })
    );
  }

  return { ok: true, file: file.name, size: file.size };
})();
```

## Meta Business Suite (schedule)

When the user asks to update the account calendar:

1. Browser → business.facebook.com (or Instagram professional tools) → Content / Planner
2. Create **draft or scheduled** posts matching calendar rows
3. Attach exported PNGs + paste captions
4. Do not hit Publish unless explicitly approved
5. If login / 2FA blocks you: stop, report, leave calendar file updated

## Hashtag bank (rotate, don't dump)

`#london` `#shoplocal` `#independentshops` `#londonfood` `#londoncafe` `#hackney` `#shoreditch` `#localbusiness` `#popup` `#limiteddrop` — pick 3–8 relevant; never paste the whole bank.

## Out of scope (for now)

Auto-DMs, comment bots, paid ads management, influencer outreach CRM — ask before expanding.
