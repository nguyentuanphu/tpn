# Sparkle Valley — Infrastructure

Everything the game runs on, where each piece lives, who can change it, and how to test it locally.
Companion documents:
- `HANDOFF.md`: rules, features and history.
- `docs/ARCHITECTURE.md`: how the code is built.
- `docs/SO-TAY-THIET-KE.md`: the design handbook.

Keep this file current in the same round as any change to hosting, servers, keys or the bundle.

## 1. The pieces at a glance

| Piece | What it is | Where it runs | Source |
|---|---|---|---|
| **The game** | Plain JS ES modules + three.js, PWA, no build step to run it. The website serves a packed copy (`tools/bundle.mts`, see §2) | The child's browser / Home Screen app | repo root: `index.html`, `js/`, `css/`, `vendor/`, `fonts/`, `icons/`, `content/`, `sw.js` |
| **Voices** | Recorded Azure voice pack (EN/VI, ~7,400 files, ~140 MB) | Downloaded to each device (Cache Storage `sv-voices`), played offline | `voices/` in **GitHub** (tracked) |
| **World pictures** | Pictures worked out from the world at start (today: the map), stored by build | Cache Storage `sv-world` on each device (painted once per build; the service worker clears it on update) | `js/worldcache.js` |
| **Real photos** | Landmark photos chosen in the Studio | Cached on the device once seen | `photos/` (from the Studio; none yet) |
| **Family content** | Message, names, faces, tales, quiz, villagers, buildings, defaults, the Family album (postcards) | Read at start by `js/custom.js` | `content/custom.json`, `content/faces/`, `content/album/` (photos ≤ 1000 px, ≤ 600 KB) |
| **Live website** | Netlify site **sparklevalley**, linked to GitHub `main` | Netlify CDN | whole repo (`netlify.toml`: publish `.`, build command `node tools/bundle.mts .`) |
| **Checks on GitHub** | The fast checks on every pull request and branch push (unit, rules, preload, emoji, arch, types, names) and a packed Netlify zip | GitHub Actions | `.github/workflows/checks.yml` |
| **Player counter** | Anonymous "hello" from devices | Netlify Function `/api/hello` + Netlify Blobs store `players` | `netlify/functions/hello.mts`, `netlify/lib/players.mts`, `js/players.js` |
| **Sparkle Studio online** | Grown-ups' dashboard at `/studio/` | Netlify Function `/studio/api/*` | `netlify/functions/studio.mts` + `studio/core.cts` + `studio/ui/` |
| **Sparkle Studio exe** | The same dashboard on Windows | `SparkleStudio.exe` → local server 127.0.0.1:7777 | `studio/studio.cts` + `studio/core.cts` + `studio/ui/` (built by `studio/build-exe.sh`) |
| **Online play** | Rooms of up to 6, voice, friends | Peer-to-peer (PeerJS/WebRTC) + public MQTT brokers as the cloud relay | `js/net.js`, `js/relay.js`, `js/roomcode.js` |
| **Google Drive mirror** | A second source of truth: every pushed branch, copied file by file | GitHub Action `drive-mirror.yml` (rclone) → the owner's Drive folder "Sparkle Valley" / "GitHub mirror" / branch | `.github/workflows/drive-mirror.yml` (secrets `RCLONE_CONF`, `DRIVE_FOLDER_ID`) |
| **Bug robot** | The moment a bug is filed, labelled or gets the owner's "go" (5-minute timer as a backup) it picks up open GitHub issues labelled `bug` plus a core label; small bugs are fixed and pushed to their own `bugfix/<core>-<issue>` branch with a draft pull request, big bugs get a plan and wait for the owner's "go"; it never pushes to `main` (see `docs/cores/front-desk.md`) | GitHub Action `bug-fixer.yml` | `.github/workflows/bug-fixer.yml` |
| **GitHub Pages** (optional) | Second copy of the site | Only by hand (Actions → Run; owner, 11 Oct AEDT: not switched on, it failed on every merge) | `.github/workflows/pages.yml` (needs Settings → Pages → Source: GitHub Actions first) |

## 2. How a change reaches children

1. Work happens on a feature branch and is committed locally.
   - **HARD RULE:** nothing is pushed until the owner has checked it and said "yes, push".
2. A pushed branch gets a draft PR. Netlify makes a **deploy preview** for each PR.
3. Merge to `main` → Netlify rebuilds `sparklevalley` in 1–2 minutes. The functions are bundled by esbuild (`[functions]` in `netlify.toml`).
   - **The start-up scripts are packed** (10 Oct, Analytics & Infra): Netlify's build runs `node tools/bundle.mts .` in its own copy. js/main.js and everything it imports become a few minified files in `bundle/` (names carry a content hash); `index.html` starts `bundle/main-….js` and preloads its start-up chunks; `sw.js` FILES lists `bundle/` instead of the game's js/ files. js/ stays on the site because Sparkle Studio's pages read it. A small import map points `/js/state.js`, `/js/custom.js`, `/js/world.js` and `/js/games/frame.js` at their packed entries, so the checks reach the game's running copy. esbuild (pinned version) is installed in the system's temp folder, never published. If packing cannot run, the site keeps the plain modules, which work the same. `build-netlify.sh` packs the zip the same way.
   - Start-up before and after (`tools/startup-time.mts`, compressed as Netlify serves it): 1.17 MB → 0.95 MB, about 150 files → 19, a slow phone connection 11.1 s → 9.3 s to the first screen.
   - **Offline and slow networks:** nothing at start waits on the network. The family's content pack (`content/custom.json`) and the photo list come from the network if it answers within 1.5 s, otherwise from the saved copy (the answer still refreshes the copy); `js/custom.js` gives up after 4 s on a device with no saved copy. Checked by `offline` (no connection, and a connection that never answers).
4. Devices pick up the new version the next time the game opens online.
   - The service worker `sw.js` has `VERSION = 'sv-<date>-r<NN>'`.
   - `js/build.js` `BUILD` must match it (the `ground` check enforces this).
   - Every new file must be in `sw.js` `FILES`, or it won't work offline.
5. Voices come **from GitHub through Netlify**. A new voice file pushed to `voices/` is live after the next deploy. Each device's voice-pack check (`js/voice.js` `checkPack`, on every open) downloads what it is missing, with the small progress bar (`js/packbar.js`).
6. Sparkle Studio changes:
   - **Online Studio:** saves to the `studio-draft` branch; **Publish** copies only the family's files (`content/ voices/ photos/ tools/voice-extra.json`) to `main`.
   - **Exe:** the same two steps: **1. Save a draft** sends the changed family files from the computer's game folder to `studio-draft`; **2. Publish** puts the draft on `main`. Both Studios share the one draft branch.

A drag-and-drop zip (`build-netlify.sh`) still works as an emergency fallback, but it has **no functions**, so the counter and online Studio stop working on that deploy. Use Git deploys.

## 3. Keys, secrets and settings (names only, never values)

**Rule:** no key, password or personal data in the code or the repo.

| Where | Name | What for | Needed? |
|---|---|---|---|
| Netlify → Site configuration → Environment variables | `STUDIO_PASSWORD` | Online Studio login, 12 characters or more (then a two-step code from an authenticator app, unless the owner chose password only in Setup → Admins) | required for `/studio/` |
| 〃 | `FAMILY_CODE` | The family code the devices type to see family photos (else Studio makes one: Family → Family code) | optional |
| 〃 | `GITHUB_TOKEN` | Fine-grained, this repo only, Contents read/write: the online Studio reads/saves family files | required for saving |
| 〃 | `GITHUB_REPO`, `GITHUB_BRANCH` | Defaults: `nguyentuanphu/Sparkle-Valley`, `main` | optional |
| GitHub → Settings → Secrets → Actions | `RCLONE_CONF`, `DRIVE_FOLDER_ID` | The Google Drive mirror (rclone config made by the owner with `rclone config`; the Drive folder's id) | for the Drive mirror |
| Tests only | `STUDIO_GITHUB_API` | Points the exe at the pretend GitHub in `tests/studio-check.mjs`; never set for families | — |
| 〃 | `AZURE_KEY`, `AZURE_REGION` | Making voices from the online Studio | optional |
| 〃 | `NETLIFY_TOKEN`, `NETLIFY_SITE` | The Studio's Website page (deploys) | optional |
| Windows PC | `%APPDATA%\SparkleStudio\settings.json` | The exe's keys: Azure, Netlify, GitHub token, the Studio key (made online: Setup → Security) | as needed |
| Windows PC | `%APPDATA%\SparkleStudio\family-photos\` | The exe's copies of the family photos (never in the game folder) | — |
| Each device | `localStorage sv2_familycode`, cache `sv-family` | The family code and the family photos (never in a backup, never in the game's cache) | when family photos are used |
| Each device | `localStorage sv2_settings` | A grown-up's own keys typed in the game (Anthropic chat, TURN relay); no voice keys since round R privacy (an old one is deleted on load) | optional |

Netlify Blobs needs no key; it is attached to the site automatically.

## 4. Servers and services we depend on (all free tiers)

| Service | Used for | If it is down |
|---|---|---|
| Netlify (hosting, Functions, Blobs) | The website, `/api/hello`, `/studio/` | Installed games keep working offline. Counting waits in the device outbox (≤ 14 days) and sends later |
| GitHub | Source, voices, Studio storage, Netlify builds | No new deploys or Studio saves; the live site stays |
| PeerJS public server (`0.peerjs.com`) | Introduces devices for direct links | Rooms carry on through the cloud relay (no voice calls) |
| STUN (Google, Cloudflare) | Finding public addresses | Same as above |
| Public TURN (Open Relay; may need an account now) | Voice across strict networks | A grown-up can add their own TURN in Grown-ups → Online play |
| Public MQTT brokers: emqx, hivemq, mosquitto, eclipse (`wss://`) | Cloud relay, friends' status, invites | All four are used at once, so one being down doesn't matter |
| Wikipedia / Wikimedia Commons / Openverse | The Studio's real-photo search; `tools/fetch-landmark-photos.mts` (run by a developer) | Studio and the tool only: the game shows only the saved `photos/` (round R privacy) |
| Google Maps / Street View (embedded) | A landmark's real place, inside the game | Opens only after a grown-up's press and hold (round R privacy), or straight away once a grown-up has turned on Grown-ups → Internet and playing online → Use the internet (owner, 10 Oct) |
| Microsoft Azure Speech | Making voice files (Studio, or `tools/make-voice-pack.mts --engine azure`) | Making voices only; children play recorded files. (In the cloud sandbox Node needs `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` to reach Azure through the proxy; without it Azure answers 403 although the key is right.) |

## 5. Data that leaves a device (privacy summary; full table in handbook §10)

Parents see the same list in plain words, folded under the Use the internet switch (`netListHTML` in `js/extras.js`). Nothing a parent or child sees names Sparkle Studio (owner, 10 Oct: it is for the admin only; check `nostudio`).

- **Player hello:** random device id, build, language, number of profiles, minutes, games, stories, device type, observed install confirmation and last reported app/browser context (with Analytics on; unconfirmed is not uninstalled), minutes online, and ≤ 15 game lines that had no recording.
  - Never names, photos, places or anything typed.
  - Off switch: Grown-ups → Advanced → Count players.
- **Online play:** names, outfits, positions and the player photo go to the other players only.
  - Photos travel under a pair lock (ECDH).
  - **Newcomers knock** and the room's starter lets them in; saved friends come straight in.
  - Known gap: the relay lock comes from the room code.
- **Backups:** to the family's own iCloud/Drive through the share sheet. Never to our server.
- **Photos taken in the game:** kept in the Album on the device. "Save to my photos" puts a full-size copy in the device's own library: the share sheet on iPhone/iPad, a download on Android and computers. Nothing is uploaded.

## 6. Local testing

### 6.1 The local bundle (made every round)

`tools/make-bundle.sh` makes **`SparkleValley-<build>-local.zip`**. It always contains:

| In the zip | What |
|---|---|
| `game/` | The **full game**: every tracked file, including `voices/`, `photos/`, `content/`, the Netlify functions, the Studio sources and the tests |
| `SparkleStudio.exe` | The Windows Studio built from the same commit (if it was built) |
| `HANDOFF.md`, `INFRASTRUCTURE.md`, `ARCHITECTURE.md`, `SO-TAY-THIET-KE.md` | The documents |
| `START-HERE.txt` | How to run it |

### 6.2 Running it

- **Game:** in `game/`, run `python3 -m http.server 8765` → http://localhost:8765. Any static server works; the service worker needs `localhost` or https.
- **Studio exe:** put `SparkleStudio.exe` in `game/` and double-click it (or `node studio/studio.cts` with Node 22) → http://127.0.0.1:7777.
- **On a phone on the same Wi-Fi:** open `http://<computer-ip>:8765`.
  - The service worker and microphone need https on a phone, so offline install, voice chat and the voice pack won't work.
  - Use a Netlify deploy preview for full phone tests.
- **Not available locally:** `/api/hello` and `/studio/` (they are Netlify Functions). The game skips counting on localhost by design. To run them locally, use `netlify dev` (Netlify CLI) in `game/`.

### 6.3 Automated checks

In `tests/`, run `npm install` once (Playwright, and TypeScript for the `types` check), then `node run.mjs [check…]` (it runs `node tools/build.mts` first, so every `.ts` has its `.js`; HANDOFF §1). The full list is in HANDOFF §2.
- **`unit`** runs `node --test` on `tests/unit/` (no browser).
- **On GitHub:** `.github/workflows/checks.yml` runs `unit rules preload emoji arch types names` and builds the packed zip on every pull request and every push to a branch (not `main`; Netlify deploys that). Nothing is deployed.
- **`offline`** serves the game itself on 127.0.0.2 (the game skips its service worker on localhost) and can stop answering. `SV_ROOT=../netlify-site` runs it on the packed copy.
- **Start-up numbers for a report:** `cd tests && node ../tools/startup-time.mts [folder]` (fresh, slow phone connection, saved, offline, no answer; time to walk into the valley).
- **`perf`** compares against `tests/perf-baseline.json` (PERF budgets; numbers may only go down). The test browser draws in software, so frames per second is measured on real phones.
- **Online checks:** `multiplayer`, `meet`, `cloud`, `knock` need a local PeerJS server (127.0.0.1:9000) and an MQTT broker (127.0.0.1:9001). The commands are in `tests/README.md`; without them those checks say "skipped".
- **`studio`** uses a fake GitHub and fake Netlify (ports 8791/8792) built into `tests/studio-check.mjs`.

## 7. Versions and release checklist

1. Bump `js/build.js` `BUILD`, `sw.js` `VERSION`, `studio/version.json` together. The exe and online Studio are always updated together.
2. New files go into `sw.js` `FILES`.
3. Run the full suite (desktop + phone). Fix everything red.
4. Rebuild the exe (`bash studio/build-exe.sh`); make the local bundle (`tools/make-bundle.sh`).
5. Update HANDOFF (history line, test table), this file if infrastructure changed, and the handbook if a design rule changed.
6. Commit locally, show the owner the changes, tests and bundle, then wait for "yes, push".
