#!/usr/bin/env python3
"""Score Lambeth + Wandsworth Places lists for the curation-offer email wave.

Google lists have websites, never emails. Output is who to enrich — not a send file.
"""
from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLACES = Path(__file__).resolve().parent
OUTSCRAPER = ROOT / "tmp/outscraper"
OUT = PLACES / "outreach_targets_curation.csv"

CHAIN_RE = re.compile(
    r"primark|h&m|\bzara\b|\bnext\b|tk ?maxx|marks & spencer|marks and spencer|"
    r"\bm&s\b|uniqlo|\bgap\b|\basos\b|jd sports|sports direct|decathlon|"
    r"mcdonald|burger king|\bkfc\b|subway|dominos|pizza hut|nando|"
    r"starbucks|costa coffee|\bcosta\b|pret a manger|\bpret\b|greggs|"
    r"cafe nero|caff[eè] nero|tesco|sainsbury|asda|waitrose|morrisons|"
    r"lidl|aldi|co-op|\bcoop\b|boots|superdrug|holland & barrett|"
    r"whsmith|wh smith|vodafone|\bee store\b|o2 store|three store|"
    r"carphone|currys|\bikea\b|argos|wilko|poundland|poundstretcher|"
    r"home bargains|\bb&m\b|specsavers|vision express|"
    r"puregym|the gym group|fitness first|nuffield|anytime fitness|"
    r"virgin active|jetts|\bcex\b|\bb&q\b|accessorize|"
    r"majestic wine|waterstones|\bfoyles\b|hotel chocolat|"
    r"bloom & wild|paris baguette|the pasty shop|moyses stevens|"
    r"new look|river island|\bclarks\b|\bschuh\b|oliver bonas|\bwhistles\b|"
    r"trespass|cotswold outdoor|\balo\b yoga|\balo\b$",
    re.I,
)

EXCLUDE_NAME_RE = re.compile(
    r"gym|pilates|yoga|boxing|taekwondo|krav|martial arts|fitness|"
    r"hair salon|barber|nails?\b|braidz|beauty salon|massage|spa\b|"
    r"library|funeral|newsagent|\bnews\b|convenience|"
    r"food & wine|food and wine|"
    r"flower delivery|interflora|"
    r"islamic book|tabernacle|socialist party|"
    r"school uniform|schoolwear|waist trainer|girdle|"
    r"virgin active|puregym",
    re.I,
)

LAMBETH_PC = {"SE1", "SE5", "SE11", "SE19", "SE21", "SE24", "SE27", "SW2", "SW4", "SW8", "SW9", "SW12", "SW16"}
WANDSWORTH_PC = {"SW11", "SW12", "SW15", "SW17", "SW18", "SW19"}
IN_AREA_PC = LAMBETH_PC | WANDSWORTH_PC

EXCLUDE_TYPES = {
    "hair salon",
    "barber shop",
    "nail salon",
    "beauty salon",
    "spa",
    "massage service",
    "massage spa",
    "yoga studio",
    "gym",
    "sports school",
    "sports club",
    "coffee shop",
    "cafe",
    "restaurant",
    "pub",
    "bar",
    "italian restaurant",
    "pizza restaurant",
    "indian restaurant",
    "takeout restaurant",
    "brunch restaurant",
    "mediterranean restaurant",
    "japanese restaurant",
    "lebanese restaurant",
    "portuguese restaurant",
    "caribbean restaurant",
    "mexican restaurant",
    "chinese restaurant",
    "korean restaurant",
    "fish & chips restaurant",
    "library",
    "museum",
    "park",
    "services",
    "point_of_interest",
    "electronics store",
    "cell phone store",
    "convenience store",
    "supermarket",
    "grocery store",
    "hardware store",
    "building materials store",
    "home improvement store",
    "general contractor",
    "child care agency",
    "educational institution",
    "bike sharing station",
    "wellness center",
    "skin care clinic",
    "health",
}

CURATED_CHARITY_RE = re.compile(
    r"crisis|emmaus|save the children|living and giving|living & giving|"
    r"all aboard|traid|oxfam|octavia",
    re.I,
)
GENERIC_CHARITY_RE = re.compile(
    r"british heart|cancer research|scope|shelter|marie curie|barnardo|"
    r"salvation army|red cross|fara|sense|\bmind\b|sue ryder|age uk|"
    r"hospice|charity shop|st christopher",
    re.I,
)

WINE_NAME_RE = re.compile(
    r"wine merchant|wine shop|wine tasting|cellar|bodega|bottle apostle|"
    r"good drinker|clapton craft|ghost whale|wild \+ lees|wild and lees|"
    r"urban cellar|we brought beer|bottle \+ rye|sourcing table",
    re.I,
)
SPIRIT_NAME_RE = re.compile(r"\bgin\b|whisky|whiskey|distill|spirit|bottle shop", re.I)
FLOWER_NAME_RE = re.compile(r"florist|flowers?\b|bloom|petal|bunch|floral", re.I)
BOOK_NAME_RE = re.compile(r"\bbooks?\b|bookseller|bookshop", re.I)
RECORD_NAME_RE = re.compile(r"vinyl|record store|records\b|hotwax|coldcuts", re.I)
VINTAGE_NAME_RE = re.compile(r"vintage|deadstock|archive|thrift|second.?hand", re.I)
FASHION_NAME_RE = re.compile(
    r"boutique|atelier|tailor|couture|concept store|ready to wear", re.I
)
FOOD_NAME_RE = re.compile(
    r"bakery|patisserie|deli|butcher|cheese|chocolate|chocolat|"
    r"fromager|grocer|fine food|sourdough|pastry",
    re.I,
)


def norm_name(s: str) -> str:
    s = (s or "").lower().strip()
    s = re.sub(r"[^a-z0-9&+ ]+", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s


def norm_web(s: str) -> str:
    s = (s or "").lower().strip().rstrip("/")
    s = re.sub(r"^https?://", "", s)
    s = re.sub(r"^www\.", "", s)
    return s


def load_csv(path: Path) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def already_contacted() -> tuple[set[str], set[str]]:
    names, webs = set(), set()
    for p in [
        OUTSCRAPER / "unwrapped_import_all.csv",
        OUTSCRAPER / "unwrapped_import_streatham_westnorwood.csv",
        OUTSCRAPER / "unwrapped_import_lambeth_clothing_all.csv",
        OUTSCRAPER / "unwrapped_import_lambeth_clothing_with_email.csv",
        OUTSCRAPER / "accidental_claim_batch.csv",
        OUTSCRAPER / "business_emails_mapped.csv",
    ]:
        if not p.exists():
            continue
        for r in load_csv(p):
            names.add(norm_name(r.get("name") or ""))
            webs.add(norm_web(r.get("website") or r.get("Website") or ""))
    prod = Path(
        "/Users/annamantova/.cursor/projects/Users-annamantova-CODE-unwrapped-2July26/"
        "agent-tools/be1a075e-76a5-44c2-8bed-e86bcfe470bb.txt"
    )
    if prod.exists():
        data = json.loads(prod.read_text())
        for r in data:
            names.add(norm_name(r.get("name") or ""))
            webs.add(norm_web(r.get("website") or ""))
    names.discard("")
    webs.discard("")
    return names, webs


def classify(r: dict) -> tuple[str | None, str]:
    """Return (track, reason) or (None, why_excluded)."""
    name = r.get("name") or ""
    typ = (r.get("type") or "").strip()
    typ_l = typ.lower()
    blob = f"{name} {typ} {r.get('category') or ''}"

    if (r.get("businessStatus") or "OPERATIONAL") != "OPERATIONAL":
        return None, "closed"
    pc = (r.get("postcode") or "").split()[0] if r.get("postcode") else ""
    if pc and pc not in IN_AREA_PC:
        return None, "outside_borough"
    if not (r.get("website") or "").strip():
        return None, "no_website"
    if CHAIN_RE.search(name):
        return None, "chain"
    if EXCLUDE_NAME_RE.search(name):
        return None, "excluded_name"
    if typ_l in EXCLUDE_TYPES:
        return None, f"excluded_type:{typ}"

    if CURATED_CHARITY_RE.search(name) or (
        typ_l == "thrift store" and GENERIC_CHARITY_RE.search(name)
    ):
        if CURATED_CHARITY_RE.search(name):
            return "charity", "curated charity shop"
        return "charity", "charity thrift"

    if typ_l in {"liquor store", "liquor_store"} or WINE_NAME_RE.search(name):
        if re.search(r"food & wine|food and wine", name, re.I):
            return None, "convenience"
        if SPIRIT_NAME_RE.search(name) and not WINE_NAME_RE.search(name):
            return "spirits", "bottle shop / distillery"
        return "wine", "independent wine / bottle shop"

    if typ_l == "wine bar" and WINE_NAME_RE.search(name):
        return "wine", "wine shop / tasting"

    if re.search(r"funeral", name, re.I):
        return None, "funeral"
    if typ_l == "florist" and FLOWER_NAME_RE.search(blob):
        if re.search(r"artificial|auto retail", name, re.I):
            return None, "not_shop_florist"
        return "flowers", "florist"

    if typ_l == "book store" or BOOK_NAME_RE.search(name):
        if re.search(r"news\b|islamic|da.?wah|national theatre|iwm ", name, re.I):
            return None, "not_indie_bookshop"
        return "books", "bookshop"

    if RECORD_NAME_RE.search(name) or typ_l in {"record store", "music store"}:
        return "books", "record / vinyl shop"

    if typ_l == "jewelry store" or re.search(r"jewell?er", name, re.I):
        return "fashion", "independent jewellery"

    if typ_l == "cosmetics store" and not re.search(r"hair", name, re.I):
        return "beauty", "cosmetics / product"

    if typ_l in {"clothing store", "women's clothing store", "clothing_store", "shoe store"}:
        if VINTAGE_NAME_RE.search(name) or FASHION_NAME_RE.search(name):
            return "fashion", "vintage / boutique"
        if typ_l == "shoe store":
            return None, "generic_shoes"
        # Independent clothing: keep if it looks like a shop with reviews, not a stall
        reviews = int(r.get("reviews") or 0)
        rating = float(r.get("rating") or 0)
        if rating >= 4.4 and reviews >= 15:
            return "fashion", "independent clothing"
        return None, "weak_fashion_signal"

    if VINTAGE_NAME_RE.search(name) and typ_l in {"store", "thrift store", "gift shop"}:
        return "fashion", "vintage / thrift"

    if typ_l in {"bakery", "pastry shop", "deli", "butcher shop", "chocolate shop"} or FOOD_NAME_RE.search(
        name
    ):
        if re.search(r"wedding house|pasty shop|paris baguette", name, re.I):
            return None, "chain_or_generic_food"
        return "specialty_food", f"specialty food ({typ or 'name'})"

    return None, "not_launch_category"


def score(r: dict, track: str, borough: str) -> int:
    s = 0
    s += 20 if borough == "Lambeth" else 8
    rating = float(r.get("rating") or 0)
    reviews = int(r.get("reviews") or 0)
    if rating >= 4.6:
        s += 8
    elif rating >= 4.3:
        s += 4
    if reviews >= 150:
        s += 10
    elif reviews >= 40:
        s += 6
    elif reviews >= 15:
        s += 3
    name = r.get("name") or ""
    if VINTAGE_NAME_RE.search(name) or RECORD_NAME_RE.search(name):
        s += 10
    if track == "wine":
        s += 12
    elif track == "flowers":
        s += 10
    elif track == "books":
        s += 10
    elif track == "spirits":
        s += 10
    elif track == "charity":
        s += 6 if CURATED_CHARITY_RE.search(name) else 0
    elif track == "fashion":
        s += 8
    elif track == "beauty":
        s += 4
    elif track == "specialty_food":
        s += 5
    if re.search(r"flower delivery|station\b|kiosk|event florist|wedding and event", name, re.I):
        s -= 12
    addr = r.get("address") or ""
    if re.search(r"new covent garden|nine elms", addr, re.I) and track == "flowers":
        s -= 15  # wholesale market, not a neighbourhood shop
    return s


def priority(score_n: int, borough: str, track: str) -> str:
    # A = first enrich + first email. Lambeth launch tracks, or exceptional Wandsworth wine/books/flowers.
    if borough == "Lambeth" and track in {"wine", "flowers", "books", "spirits", "fashion", "charity"} and score_n >= 38:
        return "A"
    if borough == "Lambeth" and track == "wine":
        return "A"
    if borough == "Wandsworth" and track in {"wine", "books", "flowers"} and score_n >= 42:
        return "A"
    if borough == "Lambeth" and score_n >= 30:
        return "B"
    return "C"


def main() -> None:
    old_names, old_webs = already_contacted()
    rows = []
    for path, boro in [
        (PLACES / "lambeth_places_list.csv", "Lambeth"),
        (PLACES / "wandsworth_places_list.csv", "Wandsworth"),
    ]:
        for r in load_csv(path):
            r["_borough"] = boro
            rows.append(r)

    # Dedupe by placeId, prefer Lambeth
    by_id: dict[str, dict] = {}
    for r in rows:
        pid = r.get("placeId") or ""
        if not pid:
            continue
        if pid not in by_id or (r["_borough"] == "Lambeth" and by_id[pid]["_borough"] != "Lambeth"):
            by_id[pid] = r

    out = []
    skip_contacted = 0
    skip_reasons: dict[str, int] = {}
    for r in by_id.values():
        n, w = norm_name(r.get("name") or ""), norm_web(r.get("website") or "")
        if n in old_names or (w and w in old_webs):
            skip_contacted += 1
            continue
        track, reason = classify(r)
        if not track:
            skip_reasons[reason] = skip_reasons.get(reason, 0) + 1
            continue
        sc = score(r, track, r["_borough"])
        out.append(
            {
                "priority": priority(sc, r["_borough"], track),
                "track": track,
                "email_variant": "charity" if track == "charity" else "commercial",
                "score": sc,
                "borough": r["_borough"],
                "name": r.get("name"),
                "type": r.get("type"),
                "category": r.get("category"),
                "address": r.get("address"),
                "postcode": r.get("postcode"),
                "district": r.get("district") or r.get("corridor"),
                "phone": r.get("phone"),
                "website": r.get("website"),
                "rating": r.get("rating"),
                "reviews": r.get("reviews"),
                "placeId": r.get("placeId"),
                "googleMapsUri": r.get("googleMapsUri"),
                "why": reason,
                "email": "",
            }
        )

    out.sort(key=lambda x: ({"A": 0, "B": 1, "C": 2}[x["priority"]], -int(x["score"]), x["borough"], x["name"] or ""))

    fields = list(out[0].keys()) if out else []
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out)

    from collections import Counter

    print(f"wrote {OUT}")
    print(f"qualified {len(out)} | skipped already-contacted {skip_contacted}")
    print("priority", dict(Counter(r["priority"] for r in out)))
    print("track", dict(Counter(r["track"] for r in out)))
    print("borough", dict(Counter(r["borough"] for r in out)))
    print("top skip reasons:")
    for k, v in sorted(skip_reasons.items(), key=lambda kv: -kv[1])[:12]:
        print(f"  {v:5} {k}")
    print("\n=== WAVE A ===")
    for r in out:
        if r["priority"] != "A":
            continue
        print(
            f"{r['score']:3} {r['track']:15} {r['borough'][0]}  {r['name'][:42]:42} {r['postcode']}  {r['reviews']:>4}rev"
        )


if __name__ == "__main__":
    main()
