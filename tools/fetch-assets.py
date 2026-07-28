#!/usr/bin/env python3
"""FASE 0.6 — descarga los assets del CDN de Webflow que mueren al cancelar la cuenta.

Fuentes: assets-manifest.csv (crawl de las 26 rutas) + las 24 URLs de los CSV de
Services. Descarta los derivados responsive de Webflow (-p-500/-800/-1080/-1600),
que se regeneran con astro:assets.

Almacenamiento direccionable por contenido: el mismo icono aparece en varias
paginas y no queremos copias. El sha256 tambien detecta descargas corruptas.
"""
import csv
import hashlib
import os
import re
import subprocess
import sys
import urllib.parse

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "baseline")
OUT = os.path.join(ROOT, "assets")
DOWNLOADS = os.path.expanduser("~/Downloads")
SERVICES_CSV = os.path.join(
    DOWNLOADS, "Accounting Max Services - Services - 678170792441245c3514a9d5.csv"
)

RESPONSIVE = re.compile(r"-p-(500|800|1080|1600)\.[a-z0-9]+$", re.I)
# Solo imagenes: el manifiesto tambien recoge .js/.css del runtime de Webflow,
# que no migran.
IMAGE_EXT = {".webp", ".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico"}
UA = "Mozilla/5.0 (migration-baseline; +senaviacorp.com)"


def request_url(url):
    """Re-codifica SOLO la ruta. El manifiesto guarda las URLs ya decodificadas
    (con espacios literales) y curl las rechaza; pero re-codificar una URL que
    aun tuviera %20 daria %2520 y un 404. Por eso se normaliza siempre desde la
    forma decodificada."""
    p = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit(
        (p.scheme, p.netloc, urllib.parse.quote(urllib.parse.unquote(p.path)), p.query, p.fragment)
    )


def safe_name(url):
    base = urllib.parse.unquote(os.path.basename(urllib.parse.urlparse(url).path))
    stem, ext = os.path.splitext(base)
    stem = re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")
    return f"{stem}{ext.lower()}"


def sources():
    urls = set()
    with open(os.path.join(ROOT, "assets-manifest.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            urls.add(r["url"])
    # Los CSV traen las URLs ya percent-encoded: no re-codificar nunca.
    with open(SERVICES_CSV, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for col in ("Icon", "Picture"):
                v = (row.get(col) or "").strip()
                if v.startswith("http"):
                    urls.add(urllib.parse.unquote(v))
    return sorted(urls)


def main():
    os.makedirs(OUT, exist_ok=True)
    rows, skipped, failed = [], 0, []

    for url in sources():
        name = safe_name(url)
        ext = os.path.splitext(name)[1]
        # /plugins/ es chrome del propio Webflow (placeholder.svg), no contenido
        # del cliente, y responde 403 a peticiones externas.
        if "/plugins/" in url or ext not in IMAGE_EXT or RESPONSIVE.search(name):
            skipped += 1
            continue
        # curl re-codifica lo necesario; pasamos la URL decodificada una sola vez.
        r = subprocess.run(
            ["curl", "-sS", "-L", "--max-time", "60", "-A", UA, "-w", "%{http_code}",
             "-o", "/tmp/asset.bin", "--url", request_url(url)],
            capture_output=True, text=True,
        )
        code = (r.stdout or "").strip()[-3:]
        if r.returncode != 0 or code != "200":
            failed.append((url, code or r.stderr.strip()[:60]))
            continue
        data = open("/tmp/asset.bin", "rb").read()
        if not data:
            failed.append((url, "0 bytes"))
            continue
        sha = hashlib.sha256(data).hexdigest()
        local = f"{sha[:16]}__{name}"
        path = os.path.join(OUT, local)
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(data)
        rows.append({"url": url, "sha256": sha, "bytes": len(data), "local": local})

    with open(os.path.join(ROOT, "assets-descargados.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["url", "sha256", "bytes", "local"])
        w.writeheader()
        w.writerows(rows)

    total = sum(r["bytes"] for r in rows)
    uniq = len({r["sha256"] for r in rows})
    print(f"descargados: {len(rows)}  unicos por contenido: {uniq}  omitidos: {skipped}")
    print(f"peso total: {total/1024/1024:.2f} MB")
    assert not any("%" in r["local"] or " " in r["local"] for r in rows), "nombre sin sanear"
    if failed:
        print(f"FALLOS ({len(failed)}):")
        for u, e in failed[:10]:
            print("  ", e, u)
        sys.exit(1)


if __name__ == "__main__":
    main()
