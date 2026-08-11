# Wave 1 outreach — session handoff (11 Aug 2026)

**Status:** lists + contact channels saved. **Email copy is NOT approved.** Nothing sent. Do not bulk-send claim emails. Do not change `claim-invite.html` unless Anna asks.

Restart the next chat as **SDR**. Open this file first.

## What this campaign is

Five street pockets so the photographer does not tour the whole borough:

1. Crystal Palace triangle (Church Rd / Westow Hill / Westow St)
2. Herne Hill (Half Moon Ln + Railton Rd)
3. Brixton Village (Coldharbour / Atlantic / Market Row / Station Rd)
4. Clapham Old Town
5. Clapham High Street

Three mechanics (Anna overrode excluding chains/barbers/food):

- `curated_object` — one limited item, we shoot + write the story
- `end_of_day_food` — leftover capacity (TGTG-style)
- `empty_chair` — unused salon/barber slot

## Files to use

| File | What it is |
|------|------------|
| **`outreach_ready_to_email.csv`** | **Mailshot list — 119 independents with a usable email** |
| **`outreach_contact_channels.csv`** | All **221** shops: email / Instagram DM / Facebook / WhatsApp / walk-in |
| `outreach_final_list.csv` | Full 221 with emails + quality flags |
| `outreach_needs_email.csv` | Earlier “missing email” sheet (superseded by contact_channels) |
| `outreach_outscraper_raw.csv` | Outscraper dump (emails, validator, IG/FB) |
| `Outscraper-20260811185243s3871.xlsx` | Original Outscraper xlsx |
| `outreach_scripts_DRAFT.md` | Email drafts — **not signed off** |

Scripts: `select_outreach_targets.py`, `map_outscraper_emails.py`, `build_contact_channels.py`

## Channel counts (11 Aug evening)

- Email: **119** (mailshot)
- Instagram DM: **50**
- Facebook: **15**
- WhatsApp (UK mobile only, `07…`): **16** primary; more have WhatsApp as backup
- Walk-in (landline / nothing): **21**
- **Can write to: 200 / 221**

## Shared inboxes — send once

- `hello@larklondon.com` — Lark Herne Hill + Lark Clapham
- `shop@claphambooks.com` — Herne Hill Books + Clapham Books
- `info@concretejunglelondon.com` — Brothers Green florist + vintage
- `steve@bluetitlondon.com` — Blue Tit CP + Brixton
- `blackbirdbakerylondon@gmail.com` — Blackbird CP + Herne Hill
- `info@okanlondon.com` — OKAN East + Village
- `weddings@mylaanddavis.co.uk` — two Myla and Davis rows
- `hello@perksandwhite.com` — two station kiosks

Skip chain/platform HQ inboxes (GAIL’s, Treatwell, Headmasters, etc.) — already excluded from the 119.

## What failed last time (do not repeat)

July claim blast (~800 sent): ~11% bounce, ~14% open, ~1% click. Wrong ask (claim profile + password), wrong offer (self-serve marketplace), wrong list (gyms/salons/chains), generic info@, empty product. Old template: `server/src/notifications/resend-templates/claim-invite.html` — leave it.

## Next session

1. Rewrite the two scripts with Anna until she is convinced (`outreach_scripts_DRAFT.md`).
2. Then merge-ready emails for the 119. Claim link only as a P.S., not the hook.
3. IG / WhatsApp one-liners from the same pitch.
4. **Do not send** until she explicitly says send.
5. Do not load these CSVs into the admin claimed-businesses map.
