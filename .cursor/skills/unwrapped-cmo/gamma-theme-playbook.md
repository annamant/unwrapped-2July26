# Gamma theme playbook — Unwrapped 2026

Source of truth for the **workspace theme** used on all Unwrapped social creatives in Gamma.  
Brand tokens: [brand-bible.md](brand-bible.md) · Repo assets: `brand/` · Live theme name: **Unwrapped 2026**

## What this is (and is not)

| Do | Don't |
|----|-------|
| Edit the saved theme **Unwrapped 2026** at [gamma.app/#themes](https://gamma.app/#themes) | Use Gamma **Paste in text** / AI to generate a “brand deck” |
| Apply theme when creating **individual posts** (Social / Presentation as needed) | Treat an auto-generated multi-slide deck as the brand system |
| Build theme **from scratch** (Library → Themes → New theme → build) or edit existing | Import random PPT unless explicitly asked |

The theme controls colours, fonts, logo, and defaults for every gamma that selects it.

---

## Theme location

- **URL:** `https://gamma.app/#themes` (sidebar: **Library → Themes**)
- **Theme name:** `Unwrapped 2026`
- **When editing a gamma:** top bar **Theme → Custom → Unwrapped 2026**

Older themes in the workspace (`UNWRAPPED THEME`, `UNWRAPPED HOSTINGER`, imported PPT) are legacy — use **Unwrapped 2026** for all new work.

---

## Colours tab — exact values

### Theme palette

| Gamma field | Hex | Brand token |
|-------------|-----|-------------|
| **Primary accent color** | `#244B36` | British Racing Green |
| **Secondary accent 1** | `#FFCEDA` | Muted surface |
| **Secondary accent 2** | `#5A6E62` | Muted text |
| **Secondary accent 3** | `#F0B8C4` | Border |

Add secondaries via **Add color** under **Secondary accent colors** — not under Text.

### Text (fixed slots — set each, don't add new ones)

| Gamma field | Hex |
|-------------|-----|
| Heading color | `#244B36` |
| Body color | `#244B36` |
| Link color | `#244B36` |
| Button color | `#244B36` |

Muted caption grey (`#5A6E62`) lives in the **palette**; pick it manually on slides when needed.

### Background

| Gamma field | Hex |
|-------------|-----|
| Background color | `#FFE0E7` |
| Page background | **None** (unless a deliberate texture is requested) |

Leave **Adjust colors for contrast** checked unless the human asks otherwise.

**Paste string:**  
`Background #FFE0E7 · British Racing Green #244B36 · Accent #244B36 · Muted #FFCEDA · Muted text #5A6E62 · Border #F0B8C4`

---

## Fonts tab

| Gamma field | Value | Notes |
|-------------|-------|-------|
| **Heading** | Playfair Display | Prefer **Regular** or **SemiBold** over Bold for editorial look |
| **Body** | DM Sans | Regular |

Space Mono is not a native Gamma theme slot. Use it manually on slides for labels/stats/CTAs, or add via **Library → Custom fonts** if needed later.

---

## Logo tab

| Asset | Repo path |
|-------|-----------|
| **Primary (preferred)** | `brand/svg/logo-lockup-horizontal.svg` |
| Mark only (fallback) | `client/public/icon-512.png` |

**Human step required:** logo upload opens the OS file picker — the agent cannot complete upload alone. After the human uploads, click **Save theme**.

Optional: inverted logo for dark backgrounds (not required for cream-field social posts).

---

## Design tab

Editorial / minimal — match the product UI, not startup-purple Gamma defaults.

| Control | Target |
|---------|--------|
| Roundness | Lowest / sharpest option |
| Shadow | None or minimal |
| Border color | `#F0B8C4` |

Sub-tabs: **Slides** (page defaults), **Blocks & content**, **Buttons & links** — keep consistent with palette above.

---

## Images tab

### AI images — style prompt (seed)

```
editorial minimal photography, warm cream tones, natural light, independent retail, London streets, muted palette, no purple, no neon, sophisticated lifestyle
```

### Accent images

- Clear default purple Gamma accent shapes unless brand-appropriate assets are uploaded.
- Prefer empty accent set + cream/ink layouts over generic purple decorations.

---

## Agent browser workflow

1. Navigate to `https://gamma.app/#themes` · use human's logged-in session (see login protocol in [SKILL.md](SKILL.md)).
2. Open **Unwrapped 2026** → **Edit**.
3. Configure tabs in order: **Colors → Fonts → Logo (human upload) → Design → Images**.
4. **Save theme** before closing — unsaved changes trigger a warning on exit.

### Colour picker automation

Gamma colour fields are **readonly** in the UI. To set hex values via browser:

1. Click the colour field or its swatch button to open the picker.
2. Edit the **HEX** input (`placeholder="#FF0000"`) · press Enter.
3. Escape or click away before setting the next colour (picker reuse can overwrite the wrong slot).

Verify primary accent is `#244B36` after each batch — it is easy to swap with background baby pink by mistake.

### Blockers

| Blocker | Action |
|---------|--------|
| Login / 2FA | Stop · ask human to sign in |
| Logo file picker | Stop · ask human to upload · then Save theme |
| Unsaved-changes dialog | Choose **Keep editing** · finish · **Save theme** |

---

## Using the theme on a new creative

1. Create gamma (format per brief: often **Social** for Instagram).
2. **Theme → Custom → Unwrapped 2026**.
3. Do **not** regenerate the whole deck with AI unless the brief is explicitly “write copy for me”.
4. Export PNG at required aspect (1:1, 4:5, 9:16) · save under `marketing/instagram/drafts/YYYY-MM-DD/`.

---

## Checklist — theme complete

```
- [ ] Primary accent #244B36
- [ ] Secondaries #FFCEDA, #5A6E62, #F0B8C4
- [ ] Text: heading/body/button #244B36, link #244B36
- [ ] Background #FFE0E7
- [ ] Fonts: Playfair Display + DM Sans
- [ ] Logo: logo-lockup-horizontal.svg uploaded
- [ ] Design: minimal roundness/shadow
- [ ] Images: editorial AI prompt set, no purple accents
- [ ] Save theme clicked
```
