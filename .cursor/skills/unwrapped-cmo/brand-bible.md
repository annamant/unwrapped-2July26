# Unwrapped brand bible (social)

Source of truth for marketing voice + visuals. Product / positioning thesis: **`brand/WHITE_PAPER_v1.md`** (v1 — CMO, SDR, and related agents must follow it).

Product site: https://shopunwrapped.com

## What Unwrapped is

A new way to shop your high street: local shops post **photos and videos of limited deals** → you **see** it → **claim** & pay → **collect** in person with a QR. Merchants **get seen** so they can sell and welcome customers through the door.

**Locked shopper framing:**  
**Grab specials from shops near you before they're gone.**  
**Local shops post photos and videos of limited deals. You see it, claim it on your phone, and collect it in person. Never miss what's around the corner.**

**Locked merchant framing:**  
**Get seen — so you can sell and welcome customers through the door.**

Do **not** position Unwrapped as Too Good To Go (mystery bags / waste), a static directory, or livestream commerce (live video is Phase 2 only — white paper §9).

### Who lists drops (framing — non-negotiable)

**Problem:** “Independent shops” alone is too narrow if overused. Prefer **your high street / local shops**. “Local businesses” alone is too vague.

**Solution — three layers:**

| Layer | Use when | Line |
|-------|----------|------|
| **1. One-liner** | Headlines, posters, bio, OG | **Grab specials from shops near you before they're gone.** |
| **2. Proof set** | Body copy, landing, apply pages, emails | Concrete types (below) |
| **3. Eligibility** | Business pitch / apply | **If people can collect from you in person during a window, you can list a drop.** |

**Proof set** (rotate; don’t dump all in a headline):  
shops · restaurants · cafés · salons · freelancers · services · charities  
(+ accountants, trainers, studios, makers when useful)

**Product truth:** Unwrapped is for anyone who serves the neighbourhood **in person** and can host a short collection window (door, studio, table, pop-up point).

**Do say:** grab · specials · near you · before they're gone · limited deals · photo or video · see it · claim it · collect it · never miss what's around the corner  
**Don't say:** pick up at your convenience · drops (as the lead) · mystery bag · waste · livestream (unless Phase 2) · people and places (retired)

**Hero rule:** FOMO in the headline. Plain explanation in the sub.

**Example — short:** Grab specials from shops near you before they're gone.  
**Example — with proof:** Local shops post photos and videos of limited deals. You see it, claim it, collect it. Never miss what's around the corner.  
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
| **Baby Pink (background)** | `#FFE0E7` | 255, 224, 231 | Page/card/creative field |
| **Espresso (foreground / ink)** | `#160703` | 22, 7, 3 | Headlines, body, buttons, logo on light, accents |
| **Cream (on dark)** | `#FFF0F4` | 255, 240, 244 | Type and UI on espresso fields |
| **Muted surface** | `#FFCEDA` | 255, 206, 218 | Secondary panels |
| **Muted text** | `#8B555E` | 139, 85, 94 | Captions, labels, meta |
| **Border** | `#F0B8C4` | 240, 184, 196 | Dividers, hairlines |

**Colour rules**

- Default creative = baby pink `#FFE0E7` field + espresso `#160703` type
- Two-colour system only: Espresso + Baby Pink (plus derived muted/border/cream)
- Inverse lockup allowed: espresso `#160703` square + baby pink type (see logo mark); spark circle is baby pink on the mark
- Full espresso field is allowed for high-impact storytelling / dark stories — use baby pink type, no gradients as the main look
- Do **not** introduce purple, indigo, neon, vermillion/red washes, pure black `#000`, or pure white as brand field

**Gamma / design tool paste string:**  
`Background #FFE0E7 · Ink #160703 · Accent #160703 · Muted #FFCEDA · Muted text #8B555E · Border #F0B8C4`

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
| **Mark** | `brand/svg/logo-mark.svg` | App icon, favicon, small avatars — espresso square, baby pink “U”, baby pink spark |
| **Wordmark** | `brand/svg/logo-wordmark.svg` | “Unwrapped” text only — espresso on baby pink |
| **Horizontal lockup** | `brand/svg/logo-lockup-horizontal.svg` | Mark + wordmark side by side |
| **Profile picture** | `brand/svg/profile-picture.svg` | Instagram 512×512 |

**Logo construction (mark)**

- Field: `#160703` square
- Letter: baby pink `#FFE0E7` bold serif “U” (Playfair / Georgia fallback in SVG)
- Accent: baby pink `#FFE0E7` circle (upper right) — the “live” spark

**Logo rules**

- Prefer official SVGs above; don’t redraw a different “U”
- Keep clear space; don’t stretch, recolour arbitrarily, or add shadows/glow
- On baby pink creatives: use espresso wordmark or full lockup
- On espresso creatives: use mark or baby pink wordmark
- Minimum: mark alone for tiny sizes; wordmark/lockup when name must read

Also live on site: `client/public/icon-512.png` (and related icons) for product favicon/PWA.

## Look rules

- Baby pink + espresso — that is the brand
- No purple gradients, neon glow, glassmorphism, or generic “AI social” templates
- One idea per frame; generous whitespace; no sticker spam on creatives

## Product facts agents may use

- Reserve + pay (when priced) → in-person collection in the drop window
- QR ticket for collection
- Businesses join by application (not open self-serve signup)
- Support: anna@shopunwrapped.com
- Instagram landing: shopunwrapped.com/instagram

## Instagram profile (canonical)

Aligned to live homepage + SEO (`client/index.html`, `.cursor/skills/unwrapped-seo/SKILL.md`):

```
Grab specials from shops near you before they're gone.
Local shops post photos & videos of limited deals. See it, claim it, collect it. Never miss what's around the corner.
London
```

Profile link: `shopunwrapped.com/instagram`

**Primary feed series:** [London High Streets](../../marketing/instagram/LONDON_HIGH_STREETS.md) — one street per 6-slide photo-led carousel. Grid is empty; relaunch starts with episode #01 when photos land. Not a website blog.

Highlights: **London High Streets** · Drops · How it works · For business  
(covers in `brand/svg/story-highlight-*.svg`)

## Asset library

See `brand/README.md` and `brand/preview.html` for PNG export of:

- Profile picture, logos
- Post templates: drop alert, business spotlight, stat
- Story template: ending soon
- OG image

When generating in Gamma, match these templates' typography and colour — do not invent a parallel brand.
