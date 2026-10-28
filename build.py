#!/usr/bin/env python3
"""Assemble the static pages from partials/. Run: python3 build.py"""
from pathlib import Path

ROOT = Path(__file__).parent
P = ROOT / "partials"
PAGES = {
    "index": "Child Wealth Fund",
    "performance": "Performance · Child Wealth Fund",
    "transparency": "Transparency · Child Wealth Fund",
    "contribute": "Contribute · Child Wealth Fund",
    "login": "Log in · Child Wealth Fund",
    "dashboard": "My account · Child Wealth Fund",
}
head = (P / "head.html").read_text()
foot = (P / "foot.html").read_text()
for name, title in PAGES.items():
    body = (P / f"{name}.body.html").read_text()
    html = head.replace("__TITLE__", title).replace("__PAGE__", "home" if name == "index" else name) + body + foot
    (ROOT / f"{name}.html").write_text(html)
    print("built", name + ".html")
