# Unwrapped brand bible (social)

Source of truth for marketing voice + visuals. Product / positioning thesis: **`brand/WHITE_PAPER_v1.md`** (v1 — CMO, SDR, and related agents must follow it).

Product site: https://shopunwrapped.com

## What Unwrapped is

A new way to shop your high street: **look in** from afar → **see** what's ready (photo or short video) → **claim** & pay → **collect** in person with a QR. Merchants **get seen** so they can sell and welcome customers through the door.

**Locked shopper framing:**  
**A new way to shop your high street. See it. Claim it. Collect it.**

**Locked merchant framing:**  
**Get seen — so you can sell and welcome customers through the door.**

Do **not** position Unwrapped as Too Good To Go (mystery bags / waste / deep discount), a static directory, or livestream commerce (live video is Phase 2 only — white paper §9).

### Who lists drops (framing — non-negotiable)

**Problem:** “Independent shops” alone is too narrow if overused. Prefer **your high street / local shops**. “Local businesses” alone is too vague.

**Solution — three layers:**

| Layer | Use when | Line |
|-------|----------|------|
| **1. One-liner** | Headlines, posters, bio, OG | **See it. Claim it. Collect it.** (with “a new way to shop your high street” when there’s room) |
| **2. Proof set** | Body copy, landing, apply pages, emails | Concrete types (below) |
| **3. Eligibility** | Business pitch / apply | **If people can collect from you in person during a window, you can list a drop.** |

**Proof set** (rotate; don’t dump all in a headline):  
shops · restaurants · cafés · salons · freelancers · services · charities  
(+ accountants, trainers, studios, makers when useful)

**Product truth:** Unwrapped is for anyone who serves the neighbourhood **in person** and can host a short collection window (door, studio, table, pop-up point).

**Do say:** look in · see it · claim it · collect · your high street · local shops · get seen · pay upfront · photo or short video  
**Don't say:** mystery bag · waste clearance as the brand · livestream (unless Phase 2) · people and places (retired) · independents (alone / overused)

**Example — short:** A new way to shop your high street. See it. Claim it. Collect it.  
**Example — with proof:** Shops, restaurants, freelancers, services, charities — look in, claim what’s ready, collect in person.  
**Example — business CTA:** Get seen. Sell and welcome customers through the door.

## Positioning

| | |
|--|--|
| **Category** | Local commerce / drop marketplace |
| **For** | Londoners who want scarce, real neighbourhood finds |
| **Also for** | Neighbourhood operators (proof set) that want demand without endless promo noise |
| **Against** | Generic delivery apps, endless scroll deals, "everything always available" |
| **Promise** | Limited. Local. Gone when they're gone. |

## Audiences

1. **Shoppers** — FOMO + neighbourhood discovery; speed and simplicity
2. **Supply side** — shops, restaurants, cafés, salons, freelancers, services, charities, and anyone else with an in-person collection point; fill quiet windows, turn walk-ins into reserved demand (apply at `/business-apply`)

Social primary channel (phase 1): **shopper Instagram**. Business content is secondary (highlights, occasional carousels, LinkedIn later).

## Voice

- Editorial, not startup-pitchy
- Sparse sentences. Short hooks. Concrete nouns (bakery, restaurant, salon, florist, trainer) over abstractions
- Urgency without fake scarcity language ("ending soon" only when true)
- Local colour: London neighbourhoods, streets, concrete venues — never generic "your city"
- Never default to "independent shops" or bare "local businesses" — use the locked one-liner + proof set above
- Never reopen “people and places” as the brand definition

**Sounds like:** "three drops ending before lunch." / "reserve in seconds. collect with QR."

**Does not sound like:** "revolutionizing local retail with AI-powered discovery" / "unlock exclusive deals today!!!"

## Colour scheme (non-negotiable)

| Token | Hex | RGB | Role |
|-------|-----|-----|------|
| **Background** | `#FAFAF8` | 250, 250, 248 | Cream paper — page/card/creative field |
| **Foreground / Ink** | `#141210` | 20, 18, 16 | Headlines, body, buttons, logo on light |
| **Vermillion** | `#E8341C` | 232, 52, 28 | Accent only — live dots, urgency, links, sparklight |
| **Muted surface** | `#F5F4F0` | 245, 244, 240 | Secondary panels |
| **Muted text** | `#7A7A7A` | 122, 122, 122 | Captions, labels, meta |
| **Border** | `#E0DFD9` | 224, 223, 217 | Dividers, hairlines |

**Colour rules**

- Default creative = cream `#FAFAF8` field + ink `#141210` type
- Vermillion is a **spark**, not a wash — never flood backgrounds with red
- Exception: a full vermillion field is allowed sparingly for high-impact storytelling / origin posts when the brief asks for a standout red background. Keep it editorial and minimal, with cream type and no gradients.
- Inverse lockup allowed: ink `#141210` square + cream type (see logo mark)
- Do **not** introduce purple, indigo, neon, pure black `#000`, pure white as brand field, or gradients as the main look

**Gamma / design tool paste string:**  
`Background #FAFAF8 · Ink #141210 · Accent #E8341C · Muted #F5F4F0 · Muted text #7A7A7A · Border #E0DFD9`

## Fonts (non-negotiable)

| Role | Font | Weights / styles | Use |
|------|------|------------------|-----|
| **Display / headlines** | **Playfair Display** | 400, 600, 700 · italic OK | Hero lines, atmosphere, italic sublines |
| **Labels / stats / CTAs** | **Space Mono** | 400, 700 | Eyebrows, counts, buttons, “LIVE”, mono meta |
| **Body** | **DM Sans** | 300, 400, 500 | Captions, longer copy in-product; keep short on social creatives |

**Google Fonts (same as live site):**  
`https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap`

**CSS stacks**

```css
font-family: 'Playfair Display', Georgia, serif;
font-family: 'Space Mono', ui-monospace, monospace;
font-family: 'DM Sans', system-ui, sans-serif;
```

**Type rules**

- One strong Playfair line + optional Space Mono label beats busy type mixes
- Tracking: Space Mono labels often use wide letter-spacing (≈0.08–0.12em)
- Never substitute Inter, Roboto, Arial, or generic “AI social” fonts

## Logo

Source files in `brand/svg/`. Export PNGs via `brand/preview.html` (open in browser → DOWNLOAD PNG).

| Asset | File | Use |
|-------|------|-----|
| **Mark** | `brand/svg/logo-mark.svg` | App icon, favicon, small avatars — ink square, cream “U”, vermillion dot |
| **Wordmark** | `brand/svg/logo-wordmark.svg` | “Unwrapped” text only — ink on cream |
| **Horizontal lockup** | `brand/svg/logo-lockup-horizontal.svg` | Mark + wordmark side by side |
| **Profile picture** | `brand/svg/profile-picture.svg` | Instagram 512×512 |

**Logo construction (mark)**

- Field: `#141210` square
- Letter: cream `#FAFAF8` bold serif “U” (Playfair / Georgia fallback in SVG)
- Accent: vermillion `#E8341C` circle (upper right) — the “live” spark

**Logo rules**

- Prefer official SVGs above; don’t redraw a different “U”
- Keep clear space; don’t stretch, recolour arbitrarily, or add shadows/glow
- On cream creatives: use ink wordmark or full lockup
- On ink creatives: use mark or cream wordmark
- Minimum: mark alone for tiny sizes; wordmark/lockup when name must read

Also live on site: `client/public/icon-512.png` (and related icons) for product favicon/PWA.

## Look rules

- Cream paper + black ink + vermillion spark — that is the brand
- No purple gradients, neon glow, glassmorphism, or generic “AI social” templates
- One idea per frame; generous whitespace; no sticker spam on creatives

## Product facts agents may use

- Reserve + pay (when priced) → in-person collection in the drop window
- QR ticket for collection
- Businesses join by application (not open self-serve signup)
- Support: anna@shopunwrapped.com
- Instagram landing: shopunwrapped.com/instagram

## Instagram profile (canonical)

```
Limited local drops, reserved in seconds.
Collect with QR · London
shopunwrapped.com/instagram
```

Highlights: Drops · How it works · Businesses · For business  
(covers in `brand/svg/story-highlight-*.svg`)

## Asset library

See `brand/README.md` and `brand/preview.html` for PNG export of:

- Profile picture, logos
- Post templates: drop alert, business spotlight, stat
- Story template: ending soon
- OG image

When generating in Gamma, match these templates' typography and colour — do not invent a parallel brand.
