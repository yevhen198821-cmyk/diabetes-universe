#!/usr/bin/env python3
"""Validate internal Markdown links across the repository."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LINK_PATTERN = re.compile(r"\[[^\]]+\]\(([^)]+)\)")


def is_external(link: str) -> bool:
    return link.startswith(("http://", "https://", "mailto:"))


def is_ignored(link: str) -> bool:
    return link.startswith("#") or link.startswith("<!--")


def resolve_link(source: Path, link: str) -> Path:
    target = link.split("#", 1)[0]
    if target.startswith("/"):
        return ROOT / target.lstrip("/")
    return (source.parent / target).resolve()


def main() -> int:
    broken: list[tuple[Path, str, str]] = []

    for md_file in sorted(ROOT.rglob("*.md")):
        if ".next" in md_file.parts or "node_modules" in md_file.parts:
            continue

        text = md_file.read_text(encoding="utf-8")
        for match in LINK_PATTERN.finditer(text):
            link = match.group(1).strip()
            if not link or is_external(link) or is_ignored(link):
                continue

            resolved = resolve_link(md_file, link)
            if not resolved.exists():
                broken.append((md_file.relative_to(ROOT), link, str(resolved)))

    if broken:
        print(f"BROKEN LINKS: {len(broken)}")
        for source, link, resolved in broken:
            print(f"  {source}: ({link}) -> {resolved}")
        return 1

    print("All internal Markdown links valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
