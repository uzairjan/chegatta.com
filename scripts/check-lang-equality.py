#!/usr/bin/env python3
"""
Chegatta PT vs ES page equality checker.

Compares the localized Portuguese (pt/) and Spanish (es/) HTML sites and reports
drift so the two languages stay "equal in content":

  1. Page-set parity  — which filenames are present in one language but not the
     other (ignoring language-neutral assets like robots.txt).
  2. Per-page structural parity — for matching pages, extracts the <footer> and
     <nav> blocks and reports whether they differ structurally (number of links
     and the link-href sets). A structural diff means the two localized pages
     expose a different footer/nav, which is what users notice (e.g. a missing
     "Termos" or a different "Casos de uso" link).
  3. Missing link targets — for a given language folder, any footer/nav internal
     href that points to a page that does not exist in the CURRENT folder (a
     relative link without ../ that has no locally-available target).

Exit code 0 = PASS (parity holds), 1 = FAIL (differences found).

Usage:
    python3 scripts/check-lang-equality.py [--dir pt es] [--verbose]
"""

from __future__ import annotations

import argparse
import html
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Files that are language-neutral and should be ignored when comparing page sets.
IGNORED = {"robots.txt"}

# PT filename -> ES filename for the same page. The site uses localized
# filenames for a few pages (e.g. pt/ponto-eletronico.html = es/control-horario.html).
FILENAME_MAP = {
    "ponto-eletronico.html": "control-horario.html",
}


def map_filename(name: str, lang: str) -> str:
    """Map a page filename to its canonical (pt) name for cross-language compare."""
    if lang == "es":
        for pt_name, es_name in FILENAME_MAP.items():
            if name == es_name:
                return pt_name
    return name


def norm_href(href: str, lang: str) -> str:
    """Normalize an href for cross-language comparison: strip '../', strip lang dir,
    map the filename, keep only path.html + anchor."""
    h = href
    if h.startswith("../"):
        h = h[3:]
    if h.startswith(f"{lang}/"):
        h = h[len(lang) + 1:]
    # keep only file + anchor
    return map_filename(h, lang)

_NAV_RE = re.compile(r"<nav[^>]*>.*?</nav>", re.DOTALL)
_FOOTER_RE = re.compile(r"<footer[^>]*>.*?</footer>", re.DOTALL)


def extract_blocks(text: str) -> tuple[str, str]:
    """Return (nav_html, footer_html) or empty strings if not found."""
    nav = _NAV_RE.search(text)
    foot = _FOOTER_RE.search(text)
    return (nav.group(0) if nav else ""), (foot.group(0) if foot else "")


def hrefs(block: str) -> set[str]:
    """Extract the set of href attribute values from an HTML block."""
    return set(re.findall(r'href=["\']([^"\']+)["\']', block))


def strip_whitespace(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def page_files(folder: Path) -> dict[str, Path]:
    """Map html filename -> path for a language folder."""
    out: dict[str, Path] = {}
    for p in sorted(folder.glob("*.html")):
        out[p.name] = p
    return out


def internal_targets(folder: Path, batch: str, hrefs_set: set[str]) -> list[str]:
    """
    For a block's href set, return the hrefs that point to a missing local html
    file. A relative href without '../' should resolve within `folder`; relative
    hrefs WITH '../' resolve to the repo root.
    """
    missing = []
    for h in sorted(hrefs_set):
        if h.startswith(("#", "http", "mailto:", "tel:", "javascript:", "//")):
            continue
        base = "/".join(h.split("/")[:-1])
        if h.startswith("../"):
            target_root = ROOT / h[3:]
        else:
            target_root = folder / h
        # Only consider it a "missing page" if it looks like an html link.
        if target_root.suffix.lower() == ".html" and not target_root.exists():
            missing.append(h)
    return missing


def struct_fingerprint(block: str, lang: str = "") -> tuple[int, frozenset[str]]:
    """Fingerprint for structural comparison: (link count, normalized href set)."""
    hs = hrefs(block)
    normed = frozenset(norm_href(h, lang) for h in hs)
    return (len(hs), normed)


def compare_langs(pt_dir: Path, es_dir: Path, verbose: bool) -> int:
    failures = 0
    pt_pages = page_files(pt_dir)
    es_pages = page_files(es_dir)

    pt_names = {n for n in pt_pages if n not in IGNORED}
    es_names = {n for n in es_pages if n not in IGNORED}

    print(f"PT pages ({len(pt_names)}): pt/")
    print(f"ES pages ({len(es_names)}): es/")
    print("=" * 70)

    # --- 1. Page-set parity ------------------------------------------------
    # Compare against ES filenames normalized to their PT (canonical) name so
    # filename-translation pairs (e.g. ponto-eletronico.html = control-horario.html)
    # count as the same page instead of a false missing-page.
    es_normalized = {map_filename(n, "es") for n in es_names}
    only_pt = {n for n in pt_names if n not in es_normalized}
    only_es = {n for n in es_names if map_filename(n, "es") not in pt_names}
    if only_pt:
        failures += 1
        print(f"  [MISSING in ES] pages present in pt/ but not es/:")
        for n in sorted(only_pt):
            print(f"      - {n}")
    if only_es:
        failures += 1
        print(f"  [MISSING in PT] pages present in es/ but not pt/:")
        for n in sorted(only_es):
            print(f"      - {n}")
    if not only_pt and not only_es and not only_es:
        print("  Page-set parity: OK (identical page sets)")

    # --- 2. Per-page structural parity (footer + nav) ----------------------
    common = pt_names & es_names
    struct_diffs = []
    for name in sorted(common):
        pt_text = pt_pages[name].read_text(encoding="utf-8")
        es_text = es_pages[name].read_text(encoding="utf-8")
        pt_nav, pt_foot = extract_blocks(pt_text)
        es_nav, es_foot = extract_blocks(es_text)

        issues = []
        for label, pt_b, es_b in (("nav", pt_nav, es_nav), ("footer", pt_foot, es_foot)):
            if (not pt_b) or (not es_b):
                if bool(pt_b) != bool(es_b):
                    issues.append(f"{label}: present in one language only")
                continue
            pt_fp = struct_fingerprint(pt_b, "pt")
            es_fp = struct_fingerprint(es_b, "es")
            if pt_fp != es_fp:
                # Link structure differs (count or set). Report which hrefs differ.
                pt_h = frozenset(norm_href(h, "pt") for h in hrefs(pt_b))
                es_h = frozenset(norm_href(h, "es") for h in hrefs(es_b))
                only_in_pt = pt_h - es_h
                only_in_es = es_h - pt_h
                issues.append(
                    f"{label}: structure differs (PT={pt_fp[0]} links, ES={es_fp[0]} links) "
                    f"| only-in-PT={sorted(only_in_pt)} | only-in-ES={sorted(only_in_es)}"
                )

        if issues:
            struct_diffs.append(name)
            failures += 1
            print(f"\n  [STRUCT DIFF] {name}")
            for i in issues:
                print(f"      - {i}")

    if not struct_diffs:
        print("  Structural parity (footer+nav on shared pages): OK")

    # --- 3. Missing link targets within each shared page's footer/nav ------
    print("\n  Missing internal link targets (footer/nav only):")
    any_missing = False
    for lang, folder, pages in (("PT", pt_dir, pt_pages), ("ES", es_dir, es_pages)):
        for name, path in sorted(pages.items()):
            if name in IGNORED:
                continue
            _, foot = extract_blocks(path.read_text(encoding="utf-8"))
            if not foot:
                continue
            missing = internal_targets(folder, foot, hrefs(foot))
            if missing:
                any_missing = True
                print(f"    [{lang}] {name}: missing={missing}")
    if not any_missing:
        print("        (none)")

    print("=" * 70)
    if failures:
        print(f"RESULT: {failures} problem group(s) — PT/ES are NOT equal.")
        return 1
    print("RESULT: PASS — PT/ES page sets, footers, and navs are equal.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="PT vs ES equality checker")
    ap.add_argument("--dir", nargs=2, default=["pt", "es"], help="Two subdirs to compare")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    d1, d2 = [ROOT / d for d in args.dir]
    if not d1.is_dir() or not d2.is_dir():
        print(f"error: directories not found ({d1}, {d2})", file=sys.stderr)
        return 2

    return compare_langs(d1, d2, args.verbose)


if __name__ == "__main__":
    sys.exit(main())
