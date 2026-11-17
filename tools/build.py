#!/usr/bin/env python3
"""Builds the four site pages from the bodies in tools/pages/. Run: python3 tools/build.py
The output (index.html, features.html, download.html, about.html) is plain HTML with no build step to serve."""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
APP = "https://algophobic-dev.github.io/Kestrel-EFB-App/"
REPO = "https://github.com/algophobic-dev/Kestrel-EFB-App"
DMG = REPO + "/releases/latest/download/Kestrel-EFB.dmg"
EXE = REPO + "/releases/latest/download/Kestrel-EFB.exe"

PAGES = {
    "index": ("Kestrel EFB · Free flight planning for US pilots", "Kestrel EFB is a free flight planning app for US pilots, with FAA charts, weather, routes, approach plates and a 3D terrain view. For Mac, Windows, iPad and iPhone."),
    "features": ("Features · Kestrel EFB", "What Kestrel EFB does: FAA charts, weather, flight plans with airways and procedures, plates on the map, weight and balance, logbook, checklists and sync."),
    "download": ("Download · Kestrel EFB", "Get Kestrel EFB for Mac, Windows, iPad and iPhone, or open it in your browser. Free."),
    "about": ("About · Kestrel EFB", "About Kestrel EFB: why it is free, where its data comes from, and what it keeps on your device."),
}
NAV = [("features", "Features"), ("download", "Download"), ("about", "About")]


def page(name):
    title, desc = PAGES[name]
    file = lambda n: "./" if n == "index" else n + ".html"
    links = "".join(f'<li{" class=opt" if n == "about" else " class=opt2" if n == "download" else ""}><a href="{file(n)}"{" aria-current=page" if n == name else ""}>{label}</a></li>' for n, label in NAV)
    body = (ROOT / "tools" / "pages" / f"{name}.html").read_text()
    credit = '<p class="credit">Photograph: "American Kestrel" by USFWS Mountain Prairie, <a href="https://creativecommons.org/licenses/by/2.0/">CC BY 2.0</a>, via <a href="https://www.flickr.com/photos/51986662@N05/15290757126">Flickr</a>. Charts and plates: FAA.</p>' if "american-kestrel" in body else ""
    html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#10161a">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="img/map-route.jpg">
<link rel="icon" href="img/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="img/icon-180.png">
<link rel="stylesheet" href="css/site.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body>
<header class="nav">
  <a class="mark" href="./"><img src="img/icon-180.png" width="28" height="28" alt="">Kestrel EFB</a>
  <nav aria-label="Main"><ul>{links}<li><a class="btn sm" href="{APP}">Open the app</a></li></ul></nav>
</header>
<main>
{body}
</main>
<footer>
  <div>Kestrel EFB. Free flight planning.</div>
  <nav aria-label="Footer"><a href="features.html">Features</a><a href="download.html">Download</a><a href="about.html">About</a><a href="{REPO}">GitHub</a></nav>
  <div class="end">2026. Provided as is, with no warranty.</div>
</footer>
{credit}
<script type="module" src="js/site.js"></script>
<script>
// This address used to hold the app. Remove its old offline worker so visitors get this site.
if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => {{ if (new URL(r.scope).pathname === new URL('./', location.href).pathname) r.unregister(); }}));
</script>
</body>
</html>
"""
    html = html.replace("{{APP}}", APP).replace("{{REPO}}", REPO).replace("{{DMG}}", DMG).replace("{{EXE}}", EXE)
    (ROOT / file(name).replace("./", "index.html")).write_text(html)


for n in PAGES:
    page(n)
print("Built", ", ".join(PAGES))
