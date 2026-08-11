#!/usr/bin/env python3
"""Build a write-channel for every wave-1 shop."""

from __future__ import annotations

import csv
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
FINAL = ROOT / "outreach_final_list.csv"
RAW = ROOT / "outreach_outscraper_raw.csv"
OUT = ROOT / "outreach_contact_channels.csv"

# Google-search hits we accepted (title matched the shop / street).
SEARCH_SOCIAL = {
    "Coconut Trading Ltd": {
        "instagram": "https://www.instagram.com/coconut_trading/",
        "facebook": "https://www.facebook.com/coconuttrading/",
    },
    "Elkins": {"instagram": "https://www.instagram.com/elkinsshop/"},
    "MAKAS BARBERS SHOP": {"instagram": "https://www.instagram.com/makas.barbers/"},
    "Way Ahead London": {"facebook": "https://www.facebook.com/p/Way-Ahead-100063746884232/"},
    "La Bruschetta": {"instagram": "https://www.instagram.com/labruschettacp/"},
    "Softplay by Coffee Cup House": {"instagram": "https://www.instagram.com/softplay.cch/"},
    "Zola's": {"instagram": "https://www.instagram.com/zolasdayandnight/"},
    "rymcafe": {"instagram": "https://www.instagram.com/rym_cafe_crystal_palace_/"},
    "Glistering Nails": {"instagram": "https://www.instagram.com/glisteringnails/"},
    "Cafe' del Cuore (cafe' of the heart)": {"instagram": "https://www.instagram.com/cafedelcuore/"},
    "Flo's": {"instagram": "https://www.instagram.com/flos_hernehill/"},
    "JayJay Barber Shop": {"instagram": "https://www.instagram.com/jayjaybarbers21/"},
    "Klassique Barbers London": {"instagram": "https://www.instagram.com/klassiquebarbers/"},
    "United Cutz Brixton Barber": {"instagram": "https://www.instagram.com/united_cutz/"},
    "Victoria Beauty & Aesthetics": {"instagram": "https://www.instagram.com/victoriab_aesthetics/"},
    "BAD BREW INC.": {"instagram": "https://www.instagram.com/badbrewinc/"},
    "Four Boroughs - Coldharbour Works": {
        "instagram": "https://www.instagram.com/four_boroughs/",
        "facebook": "https://www.facebook.com/fourboroughs/",
    },
    "JOHNNIES": {"instagram": "https://www.instagram.com/johnniescamberwell/"},
    "Kalandula Brixton": {"instagram": "https://www.instagram.com/kalandulabng/"},
    "LJ Grind": {"instagram": "https://www.instagram.com/lj.grind/"},
    "Viv’s Coffee": {"instagram": "https://www.instagram.com/vivs.coffee/"},
    "Reyes Coffee & Brunch": {"instagram": "https://www.instagram.com/reyes_coffeebrunch/"},
    "KC Nails & Beauty": {"instagram": "https://www.instagram.com/kcnailsbeauty_london/"},
    "Luna & Wilde Brixton Biab Nail Salon": {"instagram": "https://www.instagram.com/lunaandwilde/"},
    "Birksen": {"instagram": "https://www.instagram.com/flowersbybirksen/"},
    "Crown and Glory Barbers": {"instagram": "https://www.instagram.com/crownandglory23/"},
}


def host(url: str) -> str:
    if not url:
        return ""
    raw = url if "://" in url else "https://" + url
    h = (urlparse(raw).hostname or "").lower()
    return h[4:] if h.startswith("www.") else h


def clean_social(url: str, kind: str) -> str:
    if not url:
        return ""
    u = url.strip().split("?")[0].split("#")[0].rstrip("/")
    low = u.lower()
    if kind == "instagram":
        if "instagram.com" not in low:
            return ""
        if re.search(r"instagram\.com/(p|reel|reels|stories|explore|accounts|share|tv|popular)/", low):
            return ""
        return u
    if kind == "facebook":
        if "facebook.com" not in low and "fb.com" not in low:
            return ""
        if re.search(r"facebook\.com/(share|login|watch|groups|events|privacy|help|r\.php)", low):
            return ""
        return u
    return ""


def phone_digits(phone: str) -> str:
    d = re.sub(r"\D", "", phone or "")
    if d.startswith("00"):
        d = d[2:]
    if d.startswith("44"):
        return d
    if d.startswith("0"):
        return "44" + d[1:]
    return d


def is_uk_mobile(phone: str) -> bool:
    d = phone_digits(phone)
    return d.startswith("447") and len(d) >= 12


def wa_link(phone: str) -> str:
    return f"https://wa.me/{phone_digits(phone)}" if is_uk_mobile(phone) else ""


def main() -> None:
    raw_by_host = {}
    with RAW.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            raw_by_host[(row.get("query") or "").lower()] = row

    places = {}
    for path in (ROOT / "lambeth_places_list.csv", ROOT / "wandsworth_places_list.csv"):
        if not path.exists():
            continue
        with path.open(newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                places[row["placeId"]] = row

    with FINAL.open(newline="", encoding="utf-8") as f:
        shops = list(csv.DictReader(f))

    out_rows = []
    for s in shops:
        name = s["name"]
        website = (s.get("website") or "").strip()
        phone = (s.get("phone") or "").strip()
        email = (s.get("email") or "").strip()
        quality = s.get("email_quality") or ""
        usable_email = email if quality == "ok" else ""

        ig = clean_social(website, "instagram")
        fb = clean_social(website, "facebook")
        rec = raw_by_host.get(host(website))
        if rec:
            ig = ig or clean_social(rec.get("instagram") or "", "instagram")
            fb = fb or clean_social(rec.get("facebook") or "", "facebook")
        pl = places.get(s.get("placeId") or "")
        if pl:
            ig = ig or clean_social(pl.get("instagram") or "", "instagram")
            fb = fb or clean_social(pl.get("facebook") or "", "facebook")
            ig = ig or clean_social(pl.get("website") or "", "instagram")
            fb = fb or clean_social(pl.get("website") or "", "facebook")
        extra = SEARCH_SOCIAL.get(name) or {}
        ig = ig or extra.get("instagram", "")
        fb = fb or extra.get("facebook", "")

        whatsapp = wa_link(phone)
        phone_type = "mobile" if whatsapp else ("landline" if phone else "none")

        if usable_email:
            channel = "email"
            write_to = usable_email
        elif ig:
            channel = "instagram_dm"
            write_to = ig
        elif fb:
            channel = "facebook_dm"
            write_to = fb
        elif whatsapp:
            channel = "whatsapp"
            write_to = whatsapp
        else:
            channel = "walk_in"
            write_to = s.get("googleMapsUri") or s.get("address") or ""

        out_rows.append(
            {
                "cluster": s["cluster"],
                "mechanic": s["mechanic"],
                "track": s["track"],
                "name": name,
                "address": s.get("address") or "",
                "postcode": s.get("postcode") or "",
                "type": s.get("type") or "",
                "channel": channel,
                "write_to": write_to,
                "email": usable_email,
                "email_skipped": email if email and not usable_email else "",
                "instagram": ig,
                "facebook": fb,
                "whatsapp": whatsapp,
                "phone": phone,
                "phone_type": phone_type,
                "website": website,
                "google_maps": s.get("googleMapsUri") or "",
                "placeId": s.get("placeId") or "",
            }
        )

    fields = list(out_rows[0].keys())
    with OUT.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(out_rows)

    from collections import Counter

    ch = Counter(r["channel"] for r in out_rows)
    print("total", len(out_rows))
    print("by_channel", dict(ch))
    print("can_write", sum(1 for r in out_rows if r["channel"] != "walk_in"))
    print("walk_in", ch["walk_in"])
    print("whatsapp_available_even_if_not_primary", sum(1 for r in out_rows if r["whatsapp"]))
    print("CURATED walk-in:")
    for r in out_rows:
        if r["mechanic"] == "curated_object" and r["channel"] == "walk_in":
            print(" ", r["cluster"], r["name"], r["phone"] or "no phone")
    print("ALL walk-in:")
    for r in out_rows:
        if r["channel"] == "walk_in":
            print(f"  {r['cluster']:20} {r['name'][:36]:36} {r['phone_type']:8} {r['phone']}")


if __name__ == "__main__":
    main()
