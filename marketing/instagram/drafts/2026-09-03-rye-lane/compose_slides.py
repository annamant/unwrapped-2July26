#!/usr/bin/env python3
"""Compose Unwrapped London High Streets episode slides — Rye Lane #01.

Layout (2026-09-03, Anna):
- TOP: short beat title; slide 01 is a BOLD LARGE Playfair `Rye Lane`
- BODY: next chunk of the FULL canonical script in readable story prose
- Espresso #160703 solid panels behind titles + story chunks (readable on busy photos)
- Soft scrim only as whisper; photos still support the narrative
- 1080×1350 · espresso #160703 + baby pink #FFE0E7 sparingly
- Script is split across 6 slides — do not invent a different story
- Slide 01 cover = TODAY's high street photo (F-) with exact title `Rye Lane`
- Slide 01 location under title (Space Mono): borough · South London + station
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent
PHOTOS = ROOT / "your-photos"
SLIDES = ROOT / "slides"
FONTS = ROOT / "fonts"

W, H = 1080, 1350
MARGIN = 72
TITLE_Y = 56
HERO_TITLE_Y = 48
BODY_MAX_W = W - 2 * MARGIN

PINK = (255, 224, 231, 255)  # #FFE0E7
ESPRESSO = (22, 7, 3, 255)  # #160703
CREAM = (255, 244, 238, 255)
WHITE = (255, 255, 255, 255)


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
        path = Path(alts.get(name, "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"))
        if not path.exists():
            path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf")
    return ImageFont.truetype(str(path), size)


def cover_crop(im: Image.Image, focus=(0.5, 0.45)) -> Image.Image:
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


def text_size(draw, text, fnt):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(draw, text: str, fnt, max_w: int) -> list[str]:
    """Word-wrap a paragraph; preserve intentional newlines as paragraph breaks."""
    out: list[str] = []
    paragraphs = text.split("\n")
    for pi, para in enumerate(paragraphs):
        words = para.split()
        if not words:
            if pi < len(paragraphs) - 1:
                out.append("")
            continue
        line = words[0]
        for w in words[1:]:
            trial = f"{line} {w}"
            tw, _ = text_size(draw, trial, fnt)
            if tw <= max_w:
                line = trial
            else:
                out.append(line)
                line = w
        out.append(line)
        if pi < len(paragraphs) - 1:
            out.append("")
    return out


def soft_scrim_top(base: Image.Image, bottom=0.18, strength=0.55) -> Image.Image:
    """Whisper scrim under the title at the top."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = base.size[1]
    y1 = int(h * bottom)
    r, g, b = ESPRESSO[:3]
    for y in range(0, y1):
        t = 1.0 - (y / max(1, y1 - 1))
        a = int(255 * strength * (t ** 1.1))
        draw.line([(0, y), (base.size[0], y)], fill=(r, g, b, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def soft_scrim_bottom(base: Image.Image, top=0.55, strength=0.62) -> Image.Image:
    """Bottom/mid scrim for body prose."""
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    h = base.size[1]
    y0 = int(h * top)
    r, g, b = ESPRESSO[:3]
    for y in range(y0, h):
        t = (y - y0) / max(1, h - y0 - 1)
        a = int(255 * strength * (t ** 0.85))
        draw.line([(0, y), (base.size[0], y)], fill=(r, g, b, a))
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def letter_glow(base, lines, fnt, x, y, gap, color, alpha=170, thicken=7, blur=5):
    mask = Image.new("L", base.size, 0)
    md = ImageDraw.Draw(mask)
    yy = y
    for line in lines:
        if line == "":
            yy += int(fnt.size * 0.55)
            continue
        _, th = text_size(md, line, fnt)
        md.text((x, yy), line, font=fnt, fill=255)
        yy += th + gap
    if thicken >= 3:
        k = thicken if thicken % 2 else thicken + 1
        mask = mask.filter(ImageFilter.MaxFilter(k))
    mask = mask.filter(ImageFilter.GaussianBlur(blur))
    glow = Image.new("RGBA", base.size, (*color[:3], 0))
    glow.putalpha(mask.point(lambda a: int(a * alpha / 255)))
    return Image.alpha_composite(base.convert("RGBA"), glow)



def espresso_panel(base: Image.Image, box, *, alpha=235, radius=18) -> Image.Image:
    """Solid espresso #160703 panel behind type — readable on busy photos."""
    x0, y0, x1, y1 = [int(v) for v in box]
    x0 = max(0, x0)
    y0 = max(0, y0)
    x1 = min(base.size[0], x1)
    y1 = min(base.size[1], y1)
    if x1 <= x0 or y1 <= y0:
        return base.convert("RGBA")
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    fill = (*ESPRESSO[:3], alpha)
    try:
        d.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill)
    except Exception:
        d.rectangle([x0, y0, x1, y1], fill=fill)
    return Image.alpha_composite(base.convert("RGBA"), overlay)


def compose_slide(
    photo: Image.Image,
    *,
    title: str,
    body: str,
    focus=(0.5, 0.45),
    region=None,
    body_fill=CREAM,
    title_fill=PINK,
    ask_lines: list[str] | None = None,
    location_lines: list[str] | None = None,
    hero: bool = False,
) -> Image.Image:
    """Compose one slide. Type sits on solid espresso panels for readability."""
    if region is not None:
        base = region_cover(photo, region, focus=focus)
    else:
        base = cover_crop(photo, focus=focus)

    # Light photo scrims only — legibility comes from espresso panels under type
    if hero:
        base = soft_scrim_top(base, bottom=0.22, strength=0.35)
        base = soft_scrim_bottom(base, top=0.62, strength=0.40)
        title_fnt = font("PlayfairDisplay-Bold.ttf", 108)
        title_y = HERO_TITLE_Y
    else:
        base = soft_scrim_top(base, bottom=0.12, strength=0.28)
        base = soft_scrim_bottom(base, top=0.58, strength=0.38)
        title_fnt = font("SpaceMono-Bold.ttf", 22)
        title_y = TITLE_Y

    body_fnt = font("PlayfairDisplay-Regular.ttf", 30)
    body_gap = 10
    loc_fnt = font("SpaceMono-Regular.ttf", 22 if hero else 18)
    loc_gap = 6
    ask_fnt = font("PlayfairDisplay-Medium.ttf", 28)
    ask_gap = 8

    probe = ImageDraw.Draw(base)
    body_lines = wrap_text(probe, body, body_fnt, BODY_MAX_W)

    # measure body block
    heights = []
    for line in body_lines:
        if line == "":
            heights.append(int(body_fnt.size * 0.55))
        else:
            _, th = text_size(probe, line, body_fnt)
            heights.append(th)
    body_h = sum(heights) + body_gap * max(0, len(heights) - 1)

    ask_h = 0
    ask_wrapped: list[str] = []
    if ask_lines:
        ask_text = "\n".join(ask_lines)
        ask_wrapped = wrap_text(probe, ask_text, ask_fnt, BODY_MAX_W)
        ah = []
        for line in ask_wrapped:
            if line == "":
                ah.append(int(ask_fnt.size * 0.5))
            else:
                _, th = text_size(probe, line, ask_fnt)
                ah.append(th)
        ask_h = sum(ah) + ask_gap * max(0, len(ah) - 1) + 28

    bottom_pad = 72 if not ask_lines else 56
    total_h = body_h + ask_h
    y_body = H - bottom_pad - total_h
    y_body = max(y_body, (360 if location_lines else 300) if hero else 220)

    title_x = MARGIN
    tw, th = text_size(probe, title, title_fnt)

    # measure location block
    loc_lines = location_lines or []
    loc_block_h = 0
    loc_max_w = 0
    for line in loc_lines:
        lw, lh = text_size(probe, line, loc_fnt)
        loc_max_w = max(loc_max_w, lw)
        loc_block_h += lh + loc_gap
    if loc_lines:
        loc_block_h -= loc_gap

    rule_h = 3 if hero else 2
    rule_gap_above = 18 if hero else 14
    rule_gap_below = 16 if loc_lines else 0
    title_block_h = th + rule_gap_above + rule_h + rule_gap_below + loc_block_h
    title_pad_x = 28 if hero else 20
    title_pad_y = 22 if hero else 16
    title_panel_w = max(tw, loc_max_w) + title_pad_x * 2
    title_panel_x0 = title_x - title_pad_x
    title_panel_y0 = title_y - title_pad_y
    title_panel_x1 = title_panel_x0 + title_panel_w
    title_panel_y1 = title_y + title_block_h + title_pad_y

    base = espresso_panel(
        base,
        (title_panel_x0, title_panel_y0, title_panel_x1, title_panel_y1),
        alpha=240,
        radius=20 if hero else 14,
    )

    d = ImageDraw.Draw(base)
    d.text((title_x, title_y), title, font=title_fnt, fill=title_fill)

    rule_y = title_y + th + rule_gap_above
    rule_w = min(tw if hero else 120, tw)
    d.rectangle(
        [title_x, rule_y, title_x + rule_w, rule_y + rule_h],
        fill=PINK,
    )

    if loc_lines:
        loc_y = rule_y + rule_h + rule_gap_below
        yy = loc_y
        for line in loc_lines:
            _, lh = text_size(d, line, loc_fnt)
            d.text((title_x, yy), line, font=loc_fnt, fill=PINK)
            yy += lh + loc_gap

    # body (+ ask) espresso panel
    body_pad_x = 28
    body_pad_y = 26
    panel_x0 = MARGIN - body_pad_x
    panel_y0 = y_body - body_pad_y
    panel_x1 = W - MARGIN + body_pad_x
    panel_y1 = y_body + total_h + body_pad_y
    base = espresso_panel(
        base,
        (panel_x0, panel_y0, panel_x1, panel_y1),
        alpha=238,
        radius=18,
    )

    d = ImageDraw.Draw(base)
    yy = y_body
    for line in body_lines:
        if line == "":
            yy += int(body_fnt.size * 0.55)
            continue
        _, bh = text_size(d, line, body_fnt)
        d.text((MARGIN, yy), line, font=body_fnt, fill=body_fill)
        yy += bh + body_gap

    if ask_wrapped:
        yy += 18
        for line in ask_wrapped:
            if line == "":
                yy += int(ask_fnt.size * 0.5)
                continue
            _, ah = text_size(d, line, ask_fnt)
            d.text((MARGIN, yy), line, font=ask_fnt, fill=PINK)
            yy += ah + ask_gap

    return base



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
    H = Image.open(PHOTOS / "H-bussey-building.jpg")
    K = Image.open(PHOTOS / "K-jones-higgins-c1900.jpg")

    # --- 01  COVER  exactly `Rye Lane` · TODAY's high street (F-)
    # Location under title: borough · South London + station (Overground, not Tube)
    base = compose_slide(
        F,
        title="Rye Lane",
        location_lines=[
            "Peckham · Southwark · South London",
            "Peckham Rye station · Overground",
        ],
        body=(
            "Once upon a time, people called Rye Lane the Oxford Street "
            "of South London. Stand under the railway bridge at Peckham Rye "
            "today and you can still feel why."
        ),
        focus=(0.50, 0.44),
        hero=True,
    )
    save(base, "01.jpg")

    # --- 02  Walk south
    base = compose_slide(
        B,
        title="Walk south",
        body=(
            "The street runs south through Southwark SE15 in a tight, noisy "
            "ribbon — buses, produce crates, fabric shops, fish on ice, "
            "phone-repair stickers in the windows — a high street you walk, "
            "not a mall you drive to."
        ),
        focus=(0.54, 0.42),
    )
    save(base, "02.jpg")

    # --- 03  The golden mile  (Jones & Higgins, Rye Lane, Peckham, c. 1900)
    # Ideal Homes / University of Greenwich · Southwark archive — NOT CC / NOT PD
    base = compose_slide(
        K,
        title="The golden mile",
        body=(
            "After the station opened in 1865, this strip grew into a Victorian "
            "“golden mile.” Grand stores lined the pavement; Jones & Higgins "
            "became a local landmark; shoppers came from across the south for "
            "the spectacle of it. Empires of retail rose and fell, but the habit "
            "of coming here to buy something real never quite left."
        ),
        focus=(0.52, 0.45),
    )
    save(base, "03.jpg")

    # --- 04  Today  (Peckhamplex) — today’s vibe, not a throwaway cinema mention
    # No partnership claim. Plex photo (G-) stays.
    base = compose_slide(
        G,
        title="Today",
        body=(
            "What’s left is not nostalgia — it’s life. Young, multicultural, loud "
            "with markets and late cafés — and Peckhamplex at the centre of it: "
            "the independent cinema where this street’s social crowd still gathers "
            "after dark."
        ),
        focus=(0.50, 0.55),
    )
    save(base, "04.jpg")

    # --- 05  Behind the shopfronts  (Bussey Building / Copeland Park)
    base = compose_slide(
        H,
        title="Behind the shopfronts",
        body=(
            "And here’s the twist most people miss while they’re looking at the "
            "shopfronts: behind Rye Lane sits Copeland Park and the Bussey Building, "
            "where George Gibson Bussey’s firm once made cricket bats (the famous "
            "Demon Drivers, the kind associated with W.G. Grace) at Museum Works. "
            "Victorian industry, folded into today’s studios and creative spaces — "
            "still attached to the same street."
        ),
        focus=(0.50, 0.28),
    )
    save(base, "05.jpg")

    # --- 06  Close + favourite-shop ask
    base = compose_slide(
        F,
        title="One street, whole story",
        body=(
            "So Rye Lane isn’t just “Peckham.” It’s a whole South London story "
            "in one strip: what the high street used to mean, what it still does, "
            "and the strange histories hiding one door back from the pavement."
        ),
        focus=(0.62, 0.55),
        region=(160, 260, 1681, 1509),
        ask_lines=[
            "What’s your favourite shop on Rye Lane?",
            "Drop it in the comments — or recommend a shop → shopunwrapped.com/recommend",
        ],
    )
    save(base, "06.jpg")

    print("done")


if __name__ == "__main__":
    main()
