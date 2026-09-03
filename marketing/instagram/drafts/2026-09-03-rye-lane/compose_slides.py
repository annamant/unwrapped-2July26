#!/usr/bin/env python3
"""Compose Unwrapped London High Streets episode slides — Rye Lane #01.

Quieter editorial overlays (2026-09-03 iteration):
- Soft gradient scrim only (top/bottom third) — no solid cards / thick bands
- Smaller Space Mono labels · shorter Playfair · ≥80px safe margin
- Espresso type on soft translucent light scrim; baby-pink used sparingly
- Slide 5: tiny location only · Slide 6: light engage + thin espresso pill
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent
PHOTOS = ROOT / "your-photos"
SLIDES = ROOT / "slides"
FONTS = ROOT / "fonts"

W, H = 1080, 1350
MARGIN = 80  # safe margin from edges

PINK = (255, 224, 231, 255)  # #FFE0E7
ESPRESSO = (22, 7, 3, 255)  # #160703
# Soft warm ivory for rare accents / pill label
IVORY = (255, 248, 245, 255)


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    path = FONTS / name
    if not path.exists():
        alts = {
            "PlayfairDisplay-Bold.ttf": "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
            "PlayfairDisplay-Regular.ttf": "/System/Library/Fonts/Supplemental/Georgia.ttf",
            "PlayfairDisplay-Medium.ttf": "/System/Library/Fonts/Supplemental/Georgia.ttf",
            "SpaceMono-Regular.ttf": "/System/Library/Fonts/Supplemental/Courier New.ttf",
            "SpaceMono-Bold.ttf": "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
        }
        path = Path(alts.get(name, "/System/Library/Fonts/Supplemental/Georgia.ttf"))
    return ImageFont.truetype(str(path), size)


def cover_crop(im: Image.Image, focus=(0.5, 0.45)) -> Image.Image:
    """Center-crop to 4:5 covering full canvas."""
    im = ImageOps.exif_transpose(im).convert("RGB")
    tw, th = W, H
    target_ratio = tw / th
    sw, sh = im.size
    src_ratio = sw / sh
    if src_ratio > target_ratio:
        new_w = int(sh * target_ratio)
        cx = int(sw * focus[0])
        left = max(0, min(sw - new_w, cx - new_w // 2))
        box = (left, 0, left + new_w, sh)
    else:
        new_h = int(sw / target_ratio)
        cy = int(sh * focus[1])
        top = max(0, min(sh - new_h, cy - new_h // 2))
        box = (0, top, sw, top + new_h)
    return im.crop(box).resize((tw, th), Image.Resampling.LANCZOS)


def region_cover(im: Image.Image, box, focus=(0.5, 0.45)) -> Image.Image:
    return cover_crop(im.crop(box), focus=focus)


def soft_scrim_top(base: Image.Image, bottom=0.34, strength=0.38) -> Image.Image:
    """Soft espresso gradient in the top third only — airy, not plate-like."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = base.size[1]
    y1 = int(h * bottom)
    r, g, b = ESPRESSO[:3]
    for y in range(0, y1):
        t = y / max(1, y1 - 1)
        # strongest at top edge, fades to transparent by bottom of band
        a = int(255 * strength * (1 - t) ** 1.35)
        draw.line([(0, y), (base.size[0], y)], fill=(r, g, b, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def soft_scrim_bottom(base: Image.Image, top=0.66, strength=0.42) -> Image.Image:
    """Soft espresso gradient in the bottom third only."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = base.size[1]
    y0 = int(h * top)
    r, g, b = ESPRESSO[:3]
    for y in range(y0, h):
        t = (y - y0) / max(1, h - y0 - 1)
        a = int(255 * strength * (t ** 1.1))
        draw.line([(0, y), (base.size[0], y)], fill=(r, g, b, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def soft_light_wash(base: Image.Image, bottom=0.36, strength=0.42) -> Image.Image:
    """Soft warm translucent wash under espresso type (top third).
    Keeps photo visible — not a solid card."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = base.size[1]
    y1 = int(h * bottom)
    # warm ivory wash
    wr, wg, wb = 255, 244, 238
    for y in range(0, y1):
        t = y / max(1, y1 - 1)
        a = int(255 * strength * (1 - t) ** 1.25)
        draw.line([(0, y), (base.size[0], y)], fill=(wr, wg, wb, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def text_size(draw, text, fnt):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_centered(draw, y, text, fnt, fill=ESPRESSO):
    tw, th = text_size(draw, text, fnt)
    x = (W - tw) // 2
    draw.text((x, y), text, font=fnt, fill=fill)
    return y + th


def wrap_lines(text, fnt, max_w, draw):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        tw, _ = text_size(draw, trial, fnt)
        if tw <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def thin_espresso_pill(draw, cx, cy, label, fnt, pad_x=28, pad_y=12):
    """Thin espresso CTA pill — pink label text. Not a heavy pink slab."""
    tw, th = text_size(draw, label, fnt)
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x0 = cx - w // 2
    y0 = cy - h // 2
    r = h // 2
    draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=r, fill=ESPRESSO)
    draw.text((x0 + pad_x, y0 + pad_y - 1), label, font=fnt, fill=PINK)
    return y0 + h


def eyebrow(draw, y=MARGIN):
    """Smaller Space Mono series eyebrow — espresso, quiet."""
    f = font("SpaceMono-Bold.ttf", 16)
    return draw_centered(draw, y, "LONDON HIGH STREETS", f, ESPRESSO)


def label(draw, text, y):
    """Beat label — smaller Space Mono."""
    f = font("SpaceMono-Bold.ttf", 18)
    return draw_centered(draw, y, text, f, ESPRESSO)


def save(im: Image.Image, name: str):
    SLIDES.mkdir(parents=True, exist_ok=True)
    out = SLIDES / name
    rgb = im.convert("RGB")
    rgb.save(out, "JPEG", quality=92, optimize=True)
    print("wrote", out, rgb.size)


def main():
    B = Image.open(PHOTOS / "B-wide-street-2014-mels.jpg")
    F = Image.open(PHOTOS / "F-rye-lane-2024ish-8189377.jpg")
    G = Image.open(PHOTOS / "G-peckham-plex.jpg")

    max_text_w = W - 2 * MARGIN

    # --- 01 Cover ---
    # Soft light wash + espresso type (no loud pink-on-plate)
    base = cover_crop(F, focus=(0.48, 0.42))
    base = soft_light_wash(base, bottom=0.32, strength=0.48)
    d = ImageDraw.Draw(base)
    y = eyebrow(d, MARGIN)
    y += 28
    y = draw_centered(d, y, "Rye Lane", font("PlayfairDisplay-Bold.ttf", 78), ESPRESSO)
    y += 10
    draw_centered(d, y, "Peckham", font("PlayfairDisplay-Regular.ttf", 36), ESPRESSO)
    save(base, "01.jpg")

    # --- 02 WHERE ---
    # Shorter copy · top-third wash · espresso type
    base = cover_crop(B, focus=(0.55, 0.42))
    base = soft_light_wash(base, bottom=0.38, strength=0.52)
    d = ImageDraw.Draw(base)
    y = eyebrow(d, MARGIN)
    y += 18
    y = label(d, "WHERE", y)
    y += 22
    body = font("PlayfairDisplay-Regular.ttf", 34)
    for line in [
        "Peckham Rye · SE15",
        "Once the Oxford Street",
        "of South London.",
    ]:
        y = draw_centered(d, y, line, body, ESPRESSO)
        y += 10
    save(base, "02.jpg")

    # --- 03 NOW ---
    # Keep Peckhamplex photo; short lines sit in sky / soft wash
    base = cover_crop(G, focus=(0.50, 0.40))
    base = soft_light_wash(base, bottom=0.30, strength=0.55)
    d = ImageDraw.Draw(base)
    y = eyebrow(d, MARGIN)
    y += 18
    y = label(d, "NOW", y)
    y += 20
    body = font("PlayfairDisplay-Regular.ttf", 34)
    for line in [
        "Butchers, markets, cafés —",
        "and Peckhamplex.",
    ]:
        y = draw_centered(d, y, line, body, ESPRESSO)
        y += 10
    save(base, "03.jpg")

    # --- 04 DID YOU KNOW ---
    # One short fact · drop support clutter
    base = cover_crop(B, focus=(0.28, 0.48))
    base = soft_light_wash(base, bottom=0.40, strength=0.54)
    d = ImageDraw.Draw(base)
    y = eyebrow(d, MARGIN)
    y += 16
    y = label(d, "DID YOU KNOW?", y)
    y += 22
    fact = font("PlayfairDisplay-Bold.ttf", 36)
    lines = wrap_lines(
        "The Bussey Building — once cricket-bat works, now studios.",
        fact,
        max_text_w,
        d,
    )
    for line in lines:
        y = draw_centered(d, y, line, fact, ESPRESSO)
        y += 8
    save(base, "04.jpg")

    # --- 05 Breath ---
    # Almost no text — tiny location only; espresso on pale sky (no wash)
    base = region_cover(G, (520, 40, 2500, 2515), focus=(0.50, 0.42))
    d = ImageDraw.Draw(base)
    tiny = font("SpaceMono-Regular.ttf", 15)
    draw_centered(d, MARGIN + 8, "RYE LANE · SE15", tiny, ESPRESSO)
    save(base, "05.jpg")

    # --- 06 Engage ---
    # Soft bottom scrim only — no full darken / thick band
    # Thin espresso pill (pink label) — don't cover the whole photo
    base = cover_crop(F, focus=(0.5, 0.5))
    base = soft_scrim_bottom(base, top=0.58, strength=0.62)
    # whisper top for eyebrow readability
    base = soft_scrim_top(base, bottom=0.14, strength=0.22)
    d = ImageDraw.Draw(base)
    # eyebrow in soft pink — sparingly, against soft dark top
    f_eye = font("SpaceMono-Bold.ttf", 16)
    draw_centered(d, MARGIN, "LONDON HIGH STREETS", f_eye, PINK)

    q = font("PlayfairDisplay-Bold.ttf", 38)
    # sit question in bottom third with air
    lines = wrap_lines("What's your favourite shop on Rye Lane?", q, max_text_w, d)
    # measure block height to place above pill with margin
    line_gap = 8
    block_h = sum(text_size(d, ln, q)[1] + line_gap for ln in lines)
    pill_h = 48
    gap_q_pill = 28
    bottom_pad = MARGIN + 12
    y = H - bottom_pad - pill_h - gap_q_pill - block_h
    for line in lines:
        y = draw_centered(d, y, line, q, PINK)
        y += line_gap
    y += gap_q_pill
    pill_font = font("SpaceMono-Bold.ttf", 17)
    thin_espresso_pill(d, W // 2, y + pill_h // 2, "Recommend a shop →", pill_font)
    save(base, "06.jpg")

    print("done")


if __name__ == "__main__":
    main()
