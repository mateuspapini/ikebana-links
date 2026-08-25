#!/usr/bin/env python3
"""Validate the production package and its protected external destinations."""

from __future__ import annotations

import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen


EXPECTED_LINKS = {
    "whatsapp": "https://api.whatsapp.com/send/?phone=553187998070&text=Vim+pelo+Instagram+e+quero+saber+mais%21&type=phone_number&app_absent=0",
    "loja": "https://www.ikebanaflores.com.br/?utm_source=instagram&utm_medium=bio&utm_campaign=ikebana_links&utm_content=home",
    "rosa-eterna": "https://www.ikebanaflores.com.br/flores/rosa-eterna-bh/?utm_source=instagram&utm_medium=bio&utm_campaign=ikebana_links&utm_content=rosa_eterna",
    "curso": "https://www.ikebanaflores.com.br/curso-de-buque-de-flores-para-iniciantes-curso-de-flores-em-bh?utm_source=instagram&utm_medium=bio&utm_campaign=ikebana_links&utm_content=curso_buque",
    "tiktok": "https://www.tiktok.com/@ikebanaflores",
    "instagram": "https://www.instagram.com/ikebanafloresbh",
    "youtube": "https://www.youtube.com/@ikebanaflores",
    "site": "https://www.ikebanaflores.com.br/",
}

REQUIRED_FILES = {
    "app.js",
    "styles.css",
    "favicon.svg",
    "site.webmanifest",
    "robots.txt",
    "sitemap.xml",
    "CNAME",
    "assets/apple-touch-icon.png",
    "assets/icon-192.png",
    "assets/icon-512.png",
    "assets/banner-curso.webp",
    "assets/banner-rosa-eterna.webp",
    "assets/banner-vitrine.webp",
    "assets/banner-whatsapp.webp",
    "assets/logo-footer.webp",
    "assets/logo-ikebana-avatar.webp",
    "assets/og-ikebana-links.jpg",
    "assets/fonts/cormorant-garamond-normal.woff2",
    "assets/fonts/cormorant-garamond-italic.woff2",
}


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: dict[str, dict[str, str]] = {}
        self.asset_refs: set[str] = set()
        self.inline_scripts = 0
        self.inline_styles = 0
        self.event_handlers: list[str] = []
        self.csp = ""

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = {key: value or "" for key, value in attrs_list}
        for key in attrs:
            if key.lower().startswith("on"):
                self.event_handlers.append(f"{tag}[{key}]")

        if tag == "a" and attrs.get("data-link-id"):
            self.links[attrs["data-link-id"]] = attrs
        if tag in {"img", "script"} and attrs.get("src"):
            self.asset_refs.add(attrs["src"])
        if tag == "link" and attrs.get("href") and not attrs["href"].startswith("https://"):
            self.asset_refs.add(attrs["href"])
        if tag == "script" and not attrs.get("src"):
            self.inline_scripts += 1
        if tag == "style":
            self.inline_styles += 1
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "content-security-policy":
            self.csp = attrs.get("content", "")


def validate_html(html: str, root: Path) -> list[str]:
    parser = SiteParser()
    parser.feed(html)
    errors: list[str] = []

    if parser.links.keys() != EXPECTED_LINKS.keys():
        errors.append(f"Link IDs differ. Expected {sorted(EXPECTED_LINKS)}, found {sorted(parser.links)}")

    for link_id, expected in EXPECTED_LINKS.items():
        attrs = parser.links.get(link_id, {})
        if attrs.get("href") != expected:
            errors.append(f"{link_id}: unexpected destination {attrs.get('href')!r}")
        if attrs.get("target") != "_blank":
            errors.append(f"{link_id}: target must be _blank")
        rel = set(attrs.get("rel", "").split())
        if not {"noopener", "noreferrer"}.issubset(rel):
            errors.append(f"{link_id}: rel must include noopener and noreferrer")

    if "553187998070" not in html:
        errors.append("Protected WhatsApp number is missing")
    if "http://" in html:
        errors.append("Insecure http:// URL found")
    if "javascript:" in html.lower():
        errors.append("javascript: URL found")
    if parser.inline_scripts or parser.inline_styles or parser.event_handlers:
        errors.append("Inline executable code or event handlers found")

    required_csp = {
        "default-src 'none'",
        "script-src 'self'",
        "style-src 'self'",
        "connect-src 'none'",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'none'",
        "require-trusted-types-for 'script'",
    }
    missing_csp = sorted(item for item in required_csp if item not in parser.csp)
    if missing_csp:
        errors.append(f"CSP is missing: {', '.join(missing_csp)}")

    for relative in REQUIRED_FILES:
        if not (root / relative).is_file():
            errors.append(f"Required file missing: {relative}")

    for ref in parser.asset_refs:
        clean = ref.split("?", 1)[0].split("#", 1)[0]
        if clean and not clean.startswith(("https://", "data:")) and not (root / clean).is_file():
            errors.append(f"Referenced local asset is missing: {clean}")

    return errors


def load_published(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Ikebana-Link-Integrity/1.0"})
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError(f"Published site returned HTTP {response.status}")
        return response.read().decode("utf-8")


def main() -> int:
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("--published", help="Also validate the HTML currently published at this URL")
    args = arg_parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    errors = validate_html((root / "index.html").read_text(encoding="utf-8"), root)

    if args.published:
        try:
            published_errors = validate_html(load_published(args.published), root)
            errors.extend(f"Published site: {error}" for error in published_errors if "Required file missing" not in error)
        except Exception as exc:  # Network and TLS errors must fail the monitor.
            errors.append(f"Published site could not be validated: {exc}")

    if errors:
        print("Site validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Site validation passed. Protected links and security controls are intact.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
