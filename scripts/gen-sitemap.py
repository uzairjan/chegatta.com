#!/usr/bin/env python3
"""
Chegatta sitemap.xml generator.

Rebuilds sitemap.xml deterministically from the actual page inventory so every
page in the EN root, pt/, and es/ exists in the sitemap with correct xhtml
hreflang alternates (en/pt/es + x-default) across the three languages.

Run:    python3 scripts/gen-sitemap.py [--out sitemap.xml]
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent

BASE = "https://chegatta.com"
LASTMOD = date.today().isoformat()

# PT <-> ES localized filename pair (matches scripts/check-lang-equality.py).
FILENAME_MAP = {"ponto-eletronico.html": "control-horario.html"}

# Pages with lower priority / slower change cadence.
LEGAL = {"privacy.html", "terms.html", "security.html"}
LOW = {"about.html", "contact.html"}


def es_of(name: str) -> str:
    return FILENAME_MAP.get(name, name)


def priority(name: str, lang: str = "en") -> str:
    if name == "index.html":
        return "1.0"
    if name in LEGAL:
        return "0.3"
    if name in LOW:
        return "0.5"
    return "0.9" if lang == "en" else "0.8"


def changefreq(name: str) -> str:
    if name == "index.html":
        return "weekly"
    if name in LEGAL or name in LOW:
        return "yearly"
    return "monthly"


def alternate_tags(page: str) -> str:
    """xhtml:link alternates for a 'page' (e.g. 'about.html' or 'blog/x.html')."""
    name = Path(page).name
    pt_name = name
    es_name = es_of(name)
    if "/" in page:
        en_url = f"{BASE}/{page}"
        pt_url = f"{BASE}/pt/{page}"
        es_url = f"{BASE}/es/{page}"
    else:
        en_url = f"{BASE}/{name}"
        pt_url = f"{BASE}/pt/{pt_name}"
        es_url = f"{BASE}/es/{es_name}"
    lines = [
        f'    <xhtml:link rel="alternate" hreflang="en" href="{en_url}"/>',
        f'    <xhtml:link rel="alternate" hreflang="es" href="{es_url}"/>',
        f'    <xhtml:link rel="alternate" hreflang="pt" href="{pt_url}"/>',
        f'    <xhtml:link rel="alternate" hreflang="x-default" href="{en_url}"/>',
    ]
    return "\n".join(lines)


def url_block(loc: str, page: str, lang: str) -> str:
    name = Path(page).name
    alt = alternate_tags(page) if lang != "pt" or name != "index.html" else (
        '    <xhtml:link rel="alternate" hreflang="en" href="%s/"/>\n' % BASE
        + '    <xhtml:link rel="alternate" hreflang="es" href="%s/es/"/>\n' % BASE
        + '    <xhtml:link rel="alternate" hreflang="pt" href="%s/pt/"/>\n' % BASE
        + '    <xhtml:link rel="alternate" hreflang="x-default" href="%s/"/>' % BASE
    )
    return (
        f"  <url>\n"
        f"    <loc>{escape(loc)}</loc>\n"
        f"    <lastmod>{LASTMOD}</lastmod>\n"
        f"    <changefreq>{changefreq(name)}</changefreq>\n"
        f"    <priority>{priority(name, lang)}</priority>\n"
        f"{alt}\n"
        f"  </url>"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="sitemap.xml")
    args = ap.parse_args()

    root_pages = sorted(p.name for p in ROOT.glob("*.html"))
    pt_pages = sorted(p.name for p in (ROOT / "pt").glob("*.html"))
    es_pages = sorted(p.name for p in (ROOT / "es").glob("*.html"))
    # blog subfolder pages
    blog_pages = sorted(
        f"blog/{p.name}"
        for p in (ROOT / "blog").glob("*.html")
        if p.is_file()
    )

    blocks: list[str] = []

    # EN index maps to / (root), with folder-level alternates.
    blocks.append(
        "  <url>\n"
        "    <loc>%s/</loc>\n"
        "    <lastmod>%s</lastmod>\n"
        "    <changefreq>weekly</changefreq>\n"
        "    <priority>1.0</priority>\n"
        "    <xhtml:link rel=\"alternate\" hreflang=\"en\" href=\"%s/\"/>\n"
        "    <xhtml:link rel=\"alternate\" hreflang=\"es\" href=\"%s/es/\"/>\n"
        "    <xhtml:link rel=\"alternate\" hreflang=\"pt\" href=\"%s/pt/\"/>\n"
        "    <xhtml:link rel=\"alternate\" hreflang=\"x-default\" href=\"%s/\"/>\n"
        "  </url>" % (BASE, LASTMOD, BASE, BASE, BASE, BASE)
    )

    # EN root pages (index.html handled above, use "/" loc).
    for name in root_pages:
        if name == "index.html":
            continue
        blocks.append(url_block(f"{BASE}/{name}", name, "en"))

    # PT pages.
    for name in pt_pages:
        blocks.append(url_block(f"{BASE}/pt/{name}", name, "pt"))

    # ES pages.
    for name in es_pages:
        blocks.append(url_block(f"{BASE}/es/{name}", name, "es"))

    # Blog subfolder pages (only those with a localized twin).
    for page in blog_pages:
        name = Path(page).name
        has_pt = (ROOT / "pt" / page).is_file()
        has_es = (ROOT / "es" / page).is_file()
        if has_pt and has_es:
            en_alt = alternate_tags(page)
        else:
            en_alt = f'    <xhtml:link rel="alternate" hreflang="x-default" href="{BASE}/{page}"/>'
        blocks.append(
            f"  <url>\n"
            f"    <loc>{BASE}/{page}</loc>\n"
            f"    <lastmod>{LASTMOD}</lastmod>\n"
            f"    <changefreq>monthly</changefreq>\n"
            f"    <priority>0.8</priority>\n"
            f"    {en_alt}\n"
            f"  </url>"
        )
        if has_pt:
            blocks.append(
                f"  <url>\n"
                f"    <loc>{BASE}/pt/{page}</loc>\n"
                f"    <lastmod>{LASTMOD}</lastmod>\n"
                f"    <changefreq>monthly</changefreq>\n"
                f"    <priority>0.8</priority>\n"
                f"    {alternate_tags(page)}\n"
                f"  </url>"
            )
        if has_es:
            blocks.append(
                f"  <url>\n"
                f"    <loc>{BASE}/es/{page}</loc>\n"
                f"    <lastmod>{LASTMOD}</lastmod>\n"
                f"    <changefreq>monthly</changefreq>\n"
                f"    <priority>0.8</priority>\n"
                f"    {alternate_tags(page)}\n"
                f"  </url>"
            )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        + "\n".join(blocks)
        + "\n</urlset>\n"
    )

    out = ROOT / args.out
    out.write_text(xml, encoding="utf-8")
    print(f"written {out} ({len(blocks)} URLs)")
    return 0


if __name__ == "__main__":
    sys.exit(main())