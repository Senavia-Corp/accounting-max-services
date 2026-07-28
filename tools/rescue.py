#!/usr/bin/env python3
"""FASE 0.4 + 0.6 — congela las 26 rutas vivas y rescata lo que solo existe en Webflow.

Se ejecuta contra el sitio en produccion. Solo GET. No escribe nada remoto.

Produce:
  baseline/urls-vivas.csv     26 rutas con status y <title>
  baseline/html/**            snapshot crudo de cada ruta (paridad posterior)
  baseline/posts/<slug>.json  los 10 posts parseados (unica fuente que existe)
  baseline/assets-manifest.csv  todo asset del CDN de Webflow referenciado
"""
import csv
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse

BASE = "https://www.accountingmaxservices.com"
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "baseline")

TOP = ["/", "/about-us", "/blog-news", "/contact-us"]
SERVICES = [
    "audit-assistance",
    "bilingual-services-english-spanish",
    "business-incorporation-in-florida",
    "corporate-tax-preparation",
    "employer-identification-number-application",
    "financial-statement-preparation",
    "itin-application-irs-tax-id",
    "monthly-bookkeeping-accounting",
    "notary-public-services",
    "personal-tax-preparation",
    "representation-before-the-irs",
    "sales-tax-filing-7k40q",
]
POSTS = [
    "common-tax-mistakes",
    "navigating-business-expenses",
    "preparing-for-tax-season",
    "retirement-planning-and-taxes",
    "tax-credits-explained",
    "tax-implications-of-investing",
    "tax-planning-strategies",
    "understanding-cryptocurrency-taxes",
    "understanding-sales-tax",
    "understanding-tax-deductions",
]
ROUTES = TOP + [f"/services/{s}" for s in SERVICES] + [f"/post/{s}" for s in POSTS]

CDN = re.compile(r"https://cdn\.prod\.website-files\.com/[^\"'\s)\\]+")
UA = {"User-Agent": "Mozilla/5.0 (migration-baseline; +senaviacorp.com)"}


def get(url):
    # ponytail: curl y no urllib — el Python de este equipo no tiene bundle de
    # CA y da CERTIFICATE_VERIFY_FAILED. curl usa el keychain del sistema.
    out = subprocess.run(
        ["curl", "-sS", "-L", "--max-time", "30", "-A", UA["User-Agent"],
         "-w", "\n%{http_code}", url],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        print(f"  !! {url}: {out.stderr.strip()[:120]}", file=sys.stderr)
        return 0, ""
    body, _, code = out.stdout.rpartition("\n")
    return int(code or 0), body


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()


def title_of(s):
    m = re.search(r"<title[^>]*>(.*?)</title>", s, re.S)
    return strip_tags(m.group(1)) if m else ""


def h1_of(s):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", s, re.S)
    return strip_tags(m.group(1)) if m else ""


def rich_text_of(s):
    """El cuerpo del post vive en el div w-richtext de Webflow."""
    m = re.search(r'<div[^>]*class="[^"]*w-richtext[^"]*"[^>]*>(.*?)</div>\s*</div>', s, re.S)
    if not m:
        m = re.search(r'<div[^>]*class="[^"]*w-richtext[^"]*"[^>]*>(.*)', s, re.S)
    return m.group(1).strip() if m else ""


def main():
    os.makedirs(os.path.join(ROOT, "html", "services"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "html", "post"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "posts"), exist_ok=True)

    rows = []
    assets = {}  # url -> set(rutas que lo referencian)

    for route in ROUTES:
        status, body = get(BASE + route)
        rows.append({"ruta": route, "status": status, "title": title_of(body)})
        name = "index" if route == "/" else route.strip("/")
        path = os.path.join(ROOT, "html", f"{name}.html")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            f.write(body)

        for u in CDN.findall(body):
            assets.setdefault(urllib.parse.unquote(u), set()).add(route)

        if route.startswith("/post/") and body:
            slug = route.rsplit("/", 1)[1]
            doc = {
                "slug": slug,
                "url": BASE + route,
                "title": h1_of(body),
                "metaTitle": title_of(body),
                "bodyHtml": rich_text_of(body),
                # No existen en Webflow: se dejan vacios a proposito (R3).
                "publishedAt": None,
                "author": None,
                "heroImage": None,
            }
            imgs = [
                u
                for u in CDN.findall(body)
                if re.search(r"\.(jpg|jpeg|png|webp)(\?|$)", u, re.I)
            ]
            body_imgs = [u for u in CDN.findall(doc["bodyHtml"] or "")]
            hero = [u for u in imgs if u not in body_imgs]
            doc["heroImage"] = urllib.parse.unquote(hero[-1]) if hero else None
            doc["bodyImages"] = sorted({urllib.parse.unquote(u) for u in body_imgs})
            with open(
                os.path.join(ROOT, "posts", f"{slug}.json"), "w", encoding="utf-8"
            ) as f:
                json.dump(doc, f, ensure_ascii=False, indent=2)
        print(f"  {status}  {route}")

    with open(os.path.join(ROOT, "urls-vivas.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ruta", "status", "title"])
        w.writeheader()
        w.writerows(rows)

    with open(
        os.path.join(ROOT, "assets-manifest.csv"), "w", newline="", encoding="utf-8"
    ) as f:
        w = csv.writer(f)
        w.writerow(["url", "filename", "referenciado_en"])
        for u in sorted(assets):
            w.writerow([u, os.path.basename(urllib.parse.urlparse(u).path), " ".join(sorted(assets[u]))])

    bad = [r for r in rows if r["status"] != 200]
    print(f"\nrutas: {len(rows)}  no-200: {len(bad)}  assets CDN unicos: {len(assets)}")
    posts_ok = sum(
        1
        for s in POSTS
        if json.load(open(os.path.join(ROOT, "posts", f"{s}.json"), encoding="utf-8"))["bodyHtml"]
    )
    print(f"posts con cuerpo extraido: {posts_ok}/{len(POSTS)}")
    if bad:
        print("NO-200:", bad)
        sys.exit(1)


if __name__ == "__main__":
    main()
