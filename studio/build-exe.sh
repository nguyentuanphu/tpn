#!/usr/bin/env bash
# Builds studio/dist/SparkleStudio.exe: Windows Node (same version as the node running this script) with
# studio.cts, the Studio engine (core.cts, the same one the online Studio runs) and the dashboard files packed
# inside (Node "single executable application"). Build it again whenever studio/ changes, so the exe and the
# online Studio stay one program (studio/version.json goes up with the game's build number).
# Needs: node 22+, npx, curl, unzip. Run from the repo root: bash studio/build-exe.sh
set -euo pipefail
cd "$(dirname "$0")"
V=$(node -p process.version)
mkdir -p dist .build
if [ ! -f ".build/node-$V.exe" ]; then
  curl -sSfL -o .build/node.zip "https://nodejs.org/dist/$V/node-$V-win-x64.zip"
  want=$(curl -sSfL "https://nodejs.org/dist/$V/SHASUMS256.txt" | grep " node-$V-win-x64.zip$" | cut -d' ' -f1)
  [ "$(sha256sum .build/node.zip | cut -d' ' -f1)" = "$want" ] || { echo "node.zip checksum does not match"; exit 1; }
  unzip -qo -j .build/node.zip "node-$V-win-x64/node.exe" -d .build && mv .build/node.exe ".build/node-$V.exe" && rm .build/node.zip
fi
# (owner, 16 Oct AEDT: TypeScript) the dashboard's .ts files made into the .js packed below (tools/build.mts)
(cd .. && node tools/build.mts)
# one file: studio.cts with core.cts and version.json (an exe can only load what is inside it)
npx --yes esbuild@0.25.10 studio.cts --bundle --platform=node --format=cjs --outfile=.build/studio.bundle.cjs --log-level=warning
cat > .build/sea-config.json <<EOF
{ "main": ".build/studio.bundle.cjs", "output": ".build/studio.blob", "disableExperimentalSEAWarning": true, "useSnapshot": false, "useCodeCache": false,
  "assets": { "index.html": "ui/index.html", "app.js": "ui/app.js", "management.js": "ui/management.js", "management.css": "ui/management.css", "finance.js": "ui/finance.js", "brand.js": "ui/brand.js", "desk-charts.js": "ui/desk-charts.js", "owner-desk.js": "ui/owner-desk.js", "owner-desk.css": "ui/owner-desk.css", "style.css": "ui/style.css", "vi.js": "ui/vi.js", "lame.min.js": "ui/lame.min.js",
    "ads-guide/board-computer.jpg": "ui/ads-guide/board-computer.jpg", "ads-guide/card-computer.jpg": "ui/ads-guide/card-computer.jpg", "ads-guide/board-phone.jpg": "ui/ads-guide/board-phone.jpg", "ads-guide/card-phone.jpg": "ui/ads-guide/card-phone.jpg" } }
EOF
node --experimental-sea-config .build/sea-config.json
cp ".build/node-$V.exe" dist/SparkleStudio.exe
npx --yes postject@1.0.0-alpha.6 dist/SparkleStudio.exe NODE_SEA_BLOB .build/studio.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2
# a Windows app, not a console program: no black window (messages go to %APPDATA%\SparkleStudio\studio.log)
node -e "const fs=require('fs'),f='dist/SparkleStudio.exe',b=fs.readFileSync(f),pe=b.readUInt32LE(0x3c);if(b.readUInt32LE(pe)!==0x4550)throw new Error('not a PE file');b.writeUInt16LE(2,pe+24+68);fs.writeFileSync(f,b)"
ls -la dist/SparkleStudio.exe
