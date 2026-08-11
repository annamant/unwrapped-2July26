#!/usr/bin/env python3
"""Map Outscraper emails onto outreach_final_list.csv."""

from __future__ import annotations

import csv
from pathlib import Path
from urllib.parse import urlparse

import openpyxl

ROOT = Path(__file__).resolve().parent
XLSX = ROOT / "Outscraper-20260811185243s3871.xlsx"
FINAL = ROOT / "outreach_final_list.csv"
DUMP = ROOT / "outreach_outscraper_raw.csv"
READY = ROOT / "outreach_ready_to_email.csv"

PLATFORM_DOMAINS = {
    "treatwell.co.uk",
    "widget.treatwell.co.uk",
    "sites.google.com",
    "booksolo.co",
    "soloist.ai",
    "sumupbookings.com",
    "beautybypatti.book.app",
    "ramas.10to8.com",
    "softplaybycch.as.me",
    "so.me",
    "gatoreasy.com",
}

CHAIN_HQ_DOMAINS = {
    "gails.com",
    "gailsbread.co.uk",
    "headmasters.com",
    "rush.co.uk",
    "oliverbonas.com",
    "fireaway.co.uk",
    "wingstop.co.uk",
    "tonkotsu.co.uk",
    "blankstreet.com",
    "savethechildren.org.uk",
    "townhouse.co.uk",
    "blacksheepcoffee.co.uk",
    "daisygreenfood.com",
}

JUNK_LOCAL = {
    "noreply",
    "no-reply",
    "donotreply",
    "privacy",
    "legal",
    "gdpr",
    "careers",
    "jobs",
    "press",
    "media",
    "webmaster",
    "postmaster",
    "abuse",
    "support",
}

VALID_RANK = {
    "RECEIVING": 0,
    "UNKNOWN": 1,
    "": 2,
    None: 2,
    "RISKY": 3,
}

SKIP_STATUS = {"INVALID", "BLACKLISTED", "UNDELIVERABLE"}


def host_of(url: str) -> str:
    if not url:
        return ""
    raw = url.strip()
    if "://" not in raw:
        raw = "https://" + raw
    host = (urlparse(raw).hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    return host


def local_part(email: str) -> str:
    return email.split("@", 1)[0].lower()


def pick_emails(row: dict) -> tuple[str, str, str]:
    query = (row.get("query") or "").strip().lower()
    candidates = []
    for n in (1, 2, 3):
        email = (row.get(f"email_{n}") or "").strip()
        status = (row.get(f"email_{n}.emails_validator.status") or "").strip()
        if not email or "@" not in email:
            continue
        if status in SKIP_STATUS:
            continue
        if local_part(email) in JUNK_LOCAL:
            continue
        email_host = host_of("https://" + email.split("@", 1)[1])
        same = 0 if email_host == query or email_host.endswith("." + query) else 1
        rank = VALID_RANK.get(status, 4)
        # Prefer a named inbox on the shop domain, then hello/info.
        local = local_part(email)
        named = 0 if ("." in local or local not in {"info", "hello", "contact", "enquiries", "studio", "shop"}) else 1
        generic = 0 if local in {"hello", "info", "contact", "enquiries", "studio", "shop", "bookings"} else 1
        candidates.append((rank, same, generic, named, n, email, status))
    candidates.sort()
    chosen = candidates[0][5] if candidates else ""
    alts = [c[5] for c in candidates[1:3]]
    return chosen, (alts[0] if alts else ""), (alts[1] if len(alts) > 1 else "")


def quality_for(query: str, email: str) -> str:
    if not email:
        return "none"
    if query in PLATFORM_DOMAINS:
        return "platform"
    if query in CHAIN_HQ_DOMAINS:
        return "chain_hq"
    return "ok"


def main() -> None:
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    headers = [str(h) if h is not None else "" for h in rows[0]]
    scraped = []
    by_host: dict[str, dict] = {}
    for values in rows[1:]:
        row = {headers[i]: (values[i] if i < len(values) else None) for i in range(len(headers))}
        for k, v in list(row.items()):
            if v is None:
                row[k] = ""
            else:
                row[k] = str(v).strip()
        query = row["query"].lower()
        email, alt1, alt2 = pick_emails(row)
        rec = {
            **row,
            "best_email": email,
            "email_alt_1": alt1,
            "email_alt_2": alt2,
            "email_quality": quality_for(query, email),
        }
        scraped.append(rec)
        by_host[query] = rec

    dump_fields = (
        ["query", "best_email", "email_alt_1", "email_alt_2", "email_quality"]
        + [h for h in headers if h.startswith("email_") or h.startswith("phone_") or h in {"facebook", "instagram"}]
    )
    with DUMP.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=dump_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(scraped)

    with FINAL.open(newline="", encoding="utf-8") as f:
        final_rows = list(csv.DictReader(f))
        final_fields = list(final_rows[0].keys()) if final_rows else []
    if "email_quality" not in final_fields:
        # insert after email
        i = final_fields.index("email") + 1
        final_fields[i:i] = ["email_alt", "email_quality"]
    elif "email_alt" not in final_fields:
        i = final_fields.index("email") + 1
        final_fields.insert(i, "email_alt")

    matched = 0
    ready = []
    for row in final_rows:
        host = host_of(row.get("website") or "")
        rec = by_host.get(host)
        if rec and rec["best_email"]:
            row["email"] = rec["best_email"]
            row["email_alt"] = rec["email_alt_1"]
            row["email_quality"] = rec["email_quality"]
            matched += 1
            if rec["email_quality"] == "ok":
                ready.append(row)
        else:
            row.setdefault("email", "")
            row.setdefault("email_alt", "")
            row.setdefault("email_quality", "none" if host else "no_website")

    with FINAL.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=final_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(final_rows)

    ready_fields = [
        "cluster",
        "mechanic",
        "track",
        "name",
        "email",
        "email_alt",
        "phone",
        "website",
        "address",
        "postcode",
        "street",
        "type",
        "note",
        "placeId",
    ]
    with READY.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=ready_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(ready)

    by_cluster = {}
    by_mechanic = {}
    for row in ready:
        by_cluster[row["cluster"]] = by_cluster.get(row["cluster"], 0) + 1
        by_mechanic[row["mechanic"]] = by_mechanic.get(row["mechanic"], 0) + 1

    print(f"scraped_domains={len(scraped)}")
    print(f"with_best_email={sum(1 for r in scraped if r['best_email'])}")
    print(f"quality_ok={sum(1 for r in scraped if r['email_quality']=='ok')}")
    print(f"quality_platform={sum(1 for r in scraped if r['email_quality']=='platform')}")
    print(f"quality_chain_hq={sum(1 for r in scraped if r['email_quality']=='chain_hq')}")
    print(f"final_rows={len(final_rows)}")
    print(f"final_with_email={sum(1 for r in final_rows if r.get('email'))}")
    print(f"ready_independent={len(ready)}")
    print("ready_by_cluster", by_cluster)
    print("ready_by_mechanic", by_mechanic)
    print(f"wrote {FINAL.name}, {DUMP.name}, {READY.name}")


if __name__ == "__main__":
    main()
