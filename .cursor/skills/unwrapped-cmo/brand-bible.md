# Unwrapped brand bible (social)

Source of truth for marketing agents. Product site: https://shopunwrapped.com

## What Unwrapped is

Local drop discovery and reservation. Independent shops publish **time-limited drops**; shoppers **reserve in seconds** and **collect with a QR code**.

One-liner: **Limited local drops from independent shops near you.**

SEO / masthead line: **limited local drops, reserved in seconds.**

## Positioning

| | |
|--|--|
| **Category** | Local commerce / drop marketplace |
| **For** | Londoners who want scarce, real neighbourhood finds |
| **Also for** | Independent shops that want demand without endless promo noise |
| **Against** | Generic delivery apps, endless scroll deals, "everything always available" |
| **Promise** | Limited. Local. Gone when they're gone. |

## Audiences

1. **Shoppers** — FOMO + neighbourhood discovery; speed and simplicity
2. **Businesses** — fill quiet windows, turn walk-ins into reserved demand (apply at `/business-apply`)

Social primary channel (phase 1): **shopper Instagram**. Business content is secondary (highlights, occasional carousels, LinkedIn later).

## Voice

- Editorial, not startup-pitchy
- Sparse sentences. Short hooks. Concrete nouns (bakery, vinyl, flowers) over abstractions
- Urgency without fake scarcity language ("ending soon" only when true)
- Local colour: London neighbourhoods, independent shops — never generic "your city"

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
Limited local drops from independent shops near you.
Reserve in seconds · Collect with QR
London
shopunwrapped.com/instagram
```

Highlights: Drops · How it works · Shops · For business  
(covers in `brand/svg/story-highlight-*.svg`)

## Asset library

See `brand/README.md` and `brand/preview.html` for PNG export of:

- Profile picture, logos
- Post templates: drop alert, shop spotlight, stat
- Story template: ending soon
- OG image

When generating in Gamma, match these templates' typography and colour — do not invent a parallel brand.
