#!/usr/bin/env sh
# Builds a clean folder (and zip) containing only the files the game needs,
# ready to drag onto https://app.netlify.com/drop
set -e
cd "$(dirname "$0")"
OUT=netlify-site
# (owner, 16 Oct AEDT: TypeScript, batch 0) every .ts becomes the .js beside it first (tools/build.mts); with .ts files
# in the game this needs Node, and the zip is not made without it
if command -v node >/dev/null 2>&1; then node tools/build.mts
elif find js studio/ui -name '*.ts' ! -name '*.d.ts' 2>/dev/null | grep -q . || [ -f sw.ts ]; then echo "Node is needed to build the game's TypeScript files (tools/build.mts)"; exit 1; fi
rm -rf "$OUT" sparkle-valley-netlify.zip
mkdir -p "$OUT"
cp -r index.html manifest.webmanifest sw.js netlify.toml css fonts icons js vendor videos content "$OUT"/
# (r89) the family website at /home, made from the reviewed design by tools/build-website.mts (its TypeScript was made
# into .js above); only the page, its pictures and its scripts, not the TypeScript
mkdir -p "$OUT"/home && cp -r home/index.html home/assets home/site.js home/analytics.js home/festivals.js "$OUT"/home/
rm -rf "$OUT"/content/old   # Sparkle Studio backups stay on the computer
# the offline voice pack (made with tools/make-voice-pack.mts), when there is one
[ -d voices ] && cp -r voices "$OUT"/
[ -d photos ] && cp -r photos "$OUT"/   # real photos saved by Sparkle Studio
[ -d sounds ] && cp -r sounds "$OUT"/   # recorded sounds: the animals' real voices (owner, 17 Oct AEDT)
# pack the start-up scripts (tools/bundle.mts: smaller start-up download; js/ stays for Sparkle Studio's pages).
# Without Node or esbuild the site keeps the plain modules, which work the same.
if command -v node >/dev/null 2>&1; then node tools/bundle.mts "$OUT" || echo "bundle step failed: the zip keeps the plain modules"; fi
(cd "$OUT" && zip -qr ../sparkle-valley-netlify.zip .)
echo "Ready: $OUT/ and sparkle-valley-netlify.zip"
