# Sparkle Valley checks

1. In the repo folder: `npm ci` for the server dependencies, then `python3 -m http.server 8765`
2. Here: `npm install` (Playwright; in the cloud sandbox Chromium is already in `/opt/pw-browsers`), then:
   - **a change:** `node suite.mjs --changed` (only the checks for what changed since main; `--list` shows them and why)
   - **a release, before "yes, deploy":** `node suite.mjs` (all checks, 3 at a time, speed checks alone; refreshes `check-map.json`
     and `check-times.json`: commit them). `--all`: `reading`, `films`, `voicearea` in full instead of a sample. `--jobs n`, `--base ref`.
   - one check by hand: `node run.mjs <check …>` (owner, 13 Oct AEDT: these rules are in CLAUDE.md)
   - only some checks: `node run.mjs games features`
   - re-record the UI structure (only when the owner asked for a UI change): `node run.mjs --update-contract`
3. Screenshots go to `out/` (not committed).

**Multiplayer check:** it needs a PeerJS server on this machine (the public one is not reachable from the test machine):
```
mkdir peer && cd peer && npm init -y && npm install peer@1
node -e "const http=require('http'),express=require('express'),{ExpressPeerServer}=require('peer');const a=express(),s=http.createServer(a);a.use('/myapp',ExpressPeerServer(s,{path:'/'}));s.listen(9000,'127.0.0.1')"
```
Without it the check says "skipped".

**Cloud relay check (`cloud`):** needs a local MQTT broker with WebSockets on 127.0.0.1:9001 (it stands in for the public brokers):
```
npm install aedes@0.51 ws@8
node -e "const a=require('aedes')(),h=require('http'),{WebSocketServer,createWebSocketStream}=require('ws');const s=h.createServer(),w=new WebSocketServer({server:s,handleProtocols:p=>p.has('mqtt')?'mqtt':false});w.on('connection',x=>a.handle(createWebSocketStream(x)));s.listen(9001,'127.0.0.1')"
```


Pinned repair environment: `npm ci` in tests, then `npx playwright install chromium` (or `--with-deps` on a fresh Linux runner). Playwright1.56.1, TypeScript5.9.3 and Node types22.20.5 are exact lockfile dependencies. Browser cache may be set with `PLAYWRIGHT_BROWSERS_PATH`; retain the Playwright-pinned browser rather than substituting a system browser.

All online synthetic services can be started reproducibly from tests:
```
npm ci --prefix services --no-audit --no-fund
node services/start.cjs
```
In a second terminal run `node services/wait.cjs`, then the suite. These services bind only loopback ports9000/9001 and use synthetic player data. Keep them running for online checks. GitHub Full suite provisions these services for every shard; missing services must remain visible as skips, never substantive passes.
