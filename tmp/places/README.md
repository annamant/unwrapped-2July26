# Lambeth Google Places scrape

## Status (31 Jul 2026)

- Hit **daily** `SearchTextRequest` quota after ~95 requests (~50 Fashion jobs).
- Fashion & Apparel largely complete: **672 raw → 299 cleaned** (chains/charity/junk/closed dropped).
- Remaining: 9 categories × postcodes (resume via progress file). Quota typically resets **00:00 Pacific**.

## What Google returns

| Field | Available |
|-------|-----------|
| Name, address, lat/lng | Yes |
| Phone | Yes |
| Website | Yes (sometimes Instagram URL) |
| Google Maps URI | Yes |
| Email | **No** — Outscraper later |
| Dedicated social fields | **No** |

## Commands

```bash
# Resume (skips done jobs in lambeth_progress.json)
node tmp/places/scrape_lambeth.mjs

# Rebuild CSV + client/src/pages/admin/apparelMapData.ts from raw
node tmp/places/process_lambeth.mjs
```

## Outputs

- `lambeth_places_raw.json` — all unique place IDs
- `lambeth_places_cleaned.json` / `lambeth_places_list.csv` — filtered list
- `lambeth_progress.json` — resume state

## Raise daily quota (optional)

Google Cloud Console → project **UNWRAPPED** → Google Maps Platform → Quotas → Places API → `SearchTextRequest` per day → Edit / increase.
