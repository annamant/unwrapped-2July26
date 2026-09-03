# Notes — Rye Lane, Peckham · Episode #01

**Folder:** `marketing/instagram/drafts/2026-09-03-rye-lane/`  
**Status:** `drafting` (look-dev) · **Do not publish** until Anna approves + preferably reshoots.  
**Date:** 2026-09-03

---

## Rights status (CRITICAL)

> **These are LICENSED LOOK-DEV / draft assets — not Unwrapped-owned.**  
> Final Meta publish is still preferred with **Anna-owned shots** per `LONDON_HIGH_STREETS.md`.  
> Geograph / Wikimedia images used here are CC BY / CC BY-SA — **credit required in the first comment**.  
> CC BY-SA crops (slides 01, 02, 04, 06) are adaptations → ShareAlike applies.

| Verdict | Detail |
|---------|--------|
| Publish-safe *with attribution*? | Technically yes for CC-licensed reuse if credits + SA respected |
| Preferred for brand feed? | **No — reshoot** (≥3 Anna photos: wide / life / detail) |
| Blockers to `ready` | Anna photos; optional Bussey Building exterior shot; clear remaining [VERIFY] |

---

## Photo map (source → slide)

| Slide | Beat | File in `your-photos/` | Source / license |
|-------|------|-------------------------|------------------|
| 01 | Cover | `F-rye-lane-2024ish-8189377.jpg` | Thomas Roberts · Geograph 8189377 · **CC BY-SA 2.0** |
| 02 | WHERE | `B-wide-street-2014-mels.jpg` (crop toward railway bridge) | Mels van der Mede · Commons · **CC BY-SA 4.0** |
| 03 | NOW | `G-peckham-plex.jpg` | Rhagfyr · Commons · **CC0 1.0** |
| 04 | DID YOU KNOW? | `B-wide-street-2014-mels.jpg` (shopfront / produce crop) | same as 02 · **CC BY-SA 4.0** |
| 05 | Breath | `G-peckham-plex.jpg` (banner / pink-arches crop) | same as 03 · **CC0 1.0** |
| 06 | Engage | `F-rye-lane-2024ish-8189377.jpg` (soft bottom scrim + thin espresso pill) | same as 01 · **CC BY-SA 2.0** |

**Mix check:** (A) wide street — F + B · (B) life on street — G Peckhamplex · (C) detail — G banner crop · Simon `A-` held unused (walker disliked).  
**Long edge:** G 4032 · B 3840 · F 1681 — all ≥1500 on working set used for finals.

Full log: `sources/attribution.md`. Dangling commit `4d099ff` Rye Lane sources recovered into `sources/from-4d099ff-*`.

---

## Verified research (Where / Then / Now / Did you know)

### WHERE
- Street: **Rye Lane**, Peckham, London Borough of **Southwark**, **SE15**
- Station: **Peckham Rye** (opened **1865**) — railway bridge visible mid-lane
- Sources: Wikipedia *Peckham*; Ideal Homes / Southwark history pages

### THEN
- Post-1865 railway + later horse trams → Rye Lane becomes major Victorian shopping street
- Described historically as the **“Oxford Street of South London”** / “golden mile” (Peckham Vision / Derek Kinrade notes; Victorian Society on Jones & Higgins)
- Landmark store: **Jones & Higgins** (from 1867 at Rye Lane / Peckham High Street corner; closed 1980)
- Sources: Wikipedia *Peckham*; Victorian Society; Peckham Vision PDF (Derek Kinrade)

### NOW
- Independent / specialist retail: butchers, fish, tropical produce, fabric, repair, cafés, indoor markets (e.g. Rye Lane Market)
- **Peckhamplex** (95a Rye Lane) — independent six-screen cinema on the lane (established 1994; current independent operator). Visible landmark, not a partner.
- Longstanding Caribbean / African retail corridor character (visible on Geograph 221990 caption, 2006; still visible in 2021 street photo)
- Soft Unwrapped only — **no partnership / live-drop claims**

### DID YOU KNOW? (lead verified)
**Fact line used on slide 04:**  
*Behind Rye Lane: the Bussey Building — Victorian cricket-bat works, now studios.*

Verified claims:
- **George Gibson Bussey** (1829–1889) established **George G. Bussey & Co.** sporting-goods manufacturing at **Museum Works, Rye Lane, Peckham** (directories from mid-1860s; Wikipedia; Peckham Vision)
- Firm manufactured **cricket bats** (willow from Bussey’s Suffolk farm) and other sports goods; associated with supplying **W.G. Grace**; famous bat name **Demon Driver** (Copeland Park history page; Exploring Southwark)
- Extant **Bussey Building** = late-19th-c industrial structure now within **Copeland Park** creative/commercial complex (133 Copeland Road / behind Rye Lane)
- Copeland Park saved from tram-depot redevelopment plans via local campaigning (**Peckham Vision**, ~2009) — per Copeland Park site
- **Peckham Levels** = separate adaptive reuse in a former multi-storey car park nearby (adjacent creative cluster — do not conflate as “the Bussey Building”)

Sources:
- https://www.copelandpark.com/about/history/
- https://en.wikipedia.org/wiki/George_G._Bussey_%26_Co.
- https://en.wikipedia.org/wiki/George_Gibson_Bussey
- https://www.exploringsouthwark.co.uk/the-bussey-building/4588614792
- Peckham Vision materials on George Bussey / Rye Lane

---

## [VERIFY] list

| Item | Status | Note |
|------|--------|------|
| Exact year Bussey Building fabric erected (e.g. “1887”) | **[VERIFY]** | Copeland/press say late 19th c / reinforced concrete; Wikipedia firm timeline stronger than single build year — do not put a contested year on-image |
| “Demon Driver” / W.G. Grace supply | Verified enough for soft caption | Site + Exploring Southwark; OK in caption; keep slide fact shorter |
| Munitions / WWII shelter claims | Soft / optional | Copeland Park site uses hedging (“possibly”, “said to”) — **omit from caption** unless further verified |
| “Oxford Street of South London” attribution | Soft verified | Appears in Peckham Vision / local history (William Margree quoted) — OK as “once called” |
| Caribbean/African corridor “from mid-20th century” | Soft | Geograph 2006 caption documents character; precise start decade not pinned — caption uses present-tense “remains” |
| Holdrons / Jones & Higgins dates in caption | Soft OK | Victorian Society + Peckham Vision; not on-image |
| No Bussey Building exterior photo in set | Gap | Slide 04 uses lane shopfronts as stand-in — reshoot Copeland/Bussey alley if possible |

---

## Iteration notes

- Composer: `compose_slides.py` (Pillow) · fonts in `fonts/` (Playfair Display + Space Mono)
- Brand: baby pink `#FFE0E7` · espresso `#160703` · soft gradient scrim only (no cards) · series eyebrow on every slide
- Slide 04 regenerated to use high-res Mels crop (market entrance Geograph 2443648 was softer / lower res)
- 2026-09-03 evening: slides 03 + 05 swapped off Simon walker (`A-`) onto Peckhamplex (`G-`, Commons CC0). NOW copy mentions cinema in one clause. Caption lightly updated. No partnership claim.
- Calendar + backlog set to `drafting` (not `ready`/`posted`)

- **2026-09-03 evening (quieter overlays):** Anna feedback — on-image text too loud / plate-like / fighting the photo. Photos + story kept. Regenerated `compose_slides.py` + `slides/01–06.jpg`:
  - Soft light wash / soft espresso gradient in top or bottom third only — **no** solid rounded cards, heavy boxes, or thick espresso bands
  - Smaller Space Mono labels (16–18px); shorter Playfair; safe margin ≥80px
  - Primary type: espresso on soft translucent light wash (slides 01–04); baby pink used sparingly (slide 06 question + thin espresso pill label)
  - Slide 05: tiny `RYE LANE · SE15` only
  - Slide 06: soft bottom scrim + engage question + **thin espresso pill** (not a pink slab covering the photo)
  - On-image copy tightened (~7–13 words + labels); Oxford Street energy kept in caption
  - Caption shortened to ~154 words; hashtags moved to **first comment** (caption kept clean)
  - No git commit · no Instagram publish
- No git commit · no Instagram publish
