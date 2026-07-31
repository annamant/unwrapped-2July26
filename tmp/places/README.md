# London borough Google Places scrapes

Owned by the **Unwrapped SDR / lead generation** skill: `.cursor/skills/unwrapped-sdr/SKILL.md`.  
Call it with: “SDR — scrape \<borough\>”, “lead gen — next borough”, etc.

## Permanent rule

**Every borough scrape must use the full category query lists** (same set as Lambeth: multiple queries per Unwrapped category). Never run a “lean” 1-query-per-category pass for a borough.

Categories / queries live in each `scrape_*.mjs` and must stay in sync across boroughs.

## What Google returns

| Field | Available |
|-------|-----------|
| Name, address, lat/lng | Yes |
| Phone | Yes |
| Website | Yes (sometimes Instagram URL) |
| Google Maps URI | Yes |
| Email | **No** — Outscraper later |
| Dedicated social fields | **No** |

## Boroughs

### Lambeth
```bash
node tmp/places/scrape_lambeth.mjs
node tmp/places/process_lambeth.mjs
```
Outputs: `lambeth_places_list.csv` (+ raw/cleaned/progress)

### Wandsworth
```bash
node tmp/places/scrape_wandsworth.mjs
```
Postcodes: SW11, SW12, SW15, SW17, SW18, SW19  
Outputs: `wandsworth_places_list.csv` (+ raw/cleaned/progress)

## Admin map

Admin `/admin/apparel-map` shows **claimed Unwrapped businesses only**. Outreach CSVs stay in `tmp/places/` — do not load scrape lists into the client bundle.
