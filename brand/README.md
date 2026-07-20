# Unwrapped brand assets

Social media and link-preview assets for **Unwrapped** (shopunwrapped.com), matching the product design system.

## Quick start

1. Open **`preview.html`** in Chrome or Safari.
2. Wait ~1 second for fonts to load.
3. Click **DOWNLOAD PNG** on each asset you need.

## What's included

### Logos (`svg/`)
| File | Use |
|------|-----|
| `logo-mark.svg` | App icon, favicon, small avatars |
| `logo-wordmark.svg` | "Unwrapped" text only |
| `logo-lockup-horizontal.svg` | Mark + wordmark side by side |
| `profile-picture.svg` | Instagram profile (512×512) |

### Story highlight covers (1080×1080)
Designed for circular crop — keep icons/text centered.

- `story-highlight-drops.svg` — Live drops
- `story-highlight-how-it-works.svg` — How it works
- `story-highlight-shops.svg` — Shop spotlights
- `story-highlight-businesses.svg` — For businesses

### Post templates
| File | Size | Use |
|------|------|-----|
| `post-template-drop-alert.svg` | 1080×1080 | "Live now" drop posts |
| `post-template-shop-spotlight.svg` | 1080×1350 | Business profiles |
| `post-template-stat.svg` | 1080×1080 | "X drops near you" stats |
| `story-template-ending-soon.svg` | 1080×1920 | Urgency stories |

### Link preview
- `og-image.svg` — 1200×630 for Facebook/Twitter/iMessage link cards

## Design tokens

| Token | Hex | Use |
|-------|-----|-----|
| Background | `#FAFAF8` | Page/card backgrounds |
| Foreground | `#141210` | Headlines, buttons |
| Vermillion | `#E8341C` | Accent, urgency, live indicators |
| Muted | `#F5F4F0` | Secondary surfaces |
| Muted text | `#7A7A7A` | Captions, labels |
| Border | `#E0DFD9` | Dividers |

**Fonts:** Playfair Display (headlines), Space Mono (labels/stats), DM Sans (body)

## Instagram setup

**Profile picture:** Download `profile-picture` from preview.html (512×512).

**Bio:**
```
Limited local drops from independent shops near you.
Reserve in seconds · Collect with QR
London
shopunwrapped.com/instagram
```

**Highlights:** Use the four story highlight PNGs. Suggested names: Drops · How it works · Shops · For business

## OG image for production

The site references `/og-image.png` but it wasn't in the repo. After downloading from preview.html, copy to:

```
client/public/og-image.png
```

Then deploy so link shares show the branded card.

## Editing templates

- **Quick edits:** Duplicate an SVG in Figma/Canva and replace placeholder text.
- **Pixel-perfect exports:** Edit render functions in `preview.html` — fonts load from Google Fonts and match the live site.
