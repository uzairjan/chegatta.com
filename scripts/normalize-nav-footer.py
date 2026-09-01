#!/usr/bin/env python3
"""
Chegatta localized nav/footer normalizer.

Rewrites the <nav> and <footer> blocks of every page in a language folder so
the whole folder is consistent AND the two language folders expose the same
link structure (equal footers).

Design:
  * The canonical PT nav/footer and canonical ES nav/footer live in
    scripts/templates/nav-pt.html, footer-pt.html, nav-es.html, footer-es.html.
  * All internal links use local-relative paths (no "../") because each
    language folder is self-contained after all pages exist.
  * The template files are extracted from pt/index.html and es/index.html
    (already near-canonical) with "../" literal links rewritten to local ones.

Usage:
    python3 scripts/normalize-nav-footer.py [--check]

With --check, only reports files whose nav/footer differ from the canonical
template (diff count) without writing.
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "scripts" / "templates"
LANG_DIRS = {"pt": ROOT / "pt", "es": ROOT / "es"}

_NAV_RE = re.compile(r"<nav[^>]*>.*?</nav>", re.DOTALL)
_FOOTER_RE = re.compile(r"<footer[^>]*>.*?</footer>", re.DOTALL)


def canonical(lang: str) -> tuple[str, str]:
    """Return (nav, footer) canonical blocks for a language."""
    nav = (TEMPLATES / f"nav-{lang}.html").read_text(encoding="utf-8").strip()
    foot = (TEMPLATES / f"footer-{lang}.html").read_text(encoding="utf-8").strip()
    return nav, foot


def normalize_page(path: Path, lang: str, check_only: bool) -> tuple[bool, str]:
    """Rewrite nav+footer in one page. Returns (changed, detail)."""
    nav, foot = canonical(lang)
    text = path.read_text(encoding="utf-8")
    orig = text

    nm = _NAV_RE.search(text)
    fm = _FOOTER_RE.search(text)
    if not nm or not fm:
        return False, "missing nav/footer"

    text = text[: nm.start()] + nav + text[nm.end(): fm.start()] + foot + text[fm.end():]
    changed = text != orig
    if changed and not check_only:
        path.write_text(text, encoding="utf-8")
    return changed, "nav/footer rewritten"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="only report diffs, do not write")
    args = ap.parse_args()

    total = 0
    for lang, folder in LANG_DIRS.items():
        if not folder.is_dir():
            continue
        for page in sorted(folder.glob("*.html")):
            changed, detail = normalize_page(page, lang, args.check)
            if changed:
                total += 1
                print(f"[{'DIFF' if args.check else 'OK '}] {lang}/{page.name}: {detail}")
    print(f"\n{total} file(s) {'differ from canonical' if args.check else 'normalized'}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())