// Sparkle Valley regression checks. Start the game first (python3 -m http.server 8765 in the repo), then:
//   cd tests && npm install && node run.mjs            all checks
//   node run.mjs games features                        only some
//   node run.mjs --update-contract                     re-record the UI structure (only when the owner asked for a UI change)
// Multiplayer runs when a local PeerJS server is up on 127.0.0.1:9000 (see the README in this folder).
//
// The checks live in groups under tests/checks/ (games, valley, voice, online, studio...; the list is in
// tests/checks/index.mjs) and share tests/checks/shared.mjs (the browser `b`, `check`, `ok`, `open`, `clear`...).
// A NEW CHECK: add it as its own `await check('name', async () => { ... });` block at the end of this file, just above
// "await b.close()", and add any shared name it uses to the import line below. Release moves it into the right group
// file when it merges (tests/checks/README.md says how). Every check name is unique across all the files.
import { b, check, results } from './checks/shared.mjs';
import { GROUPS } from './checks/index.mjs';
// one group after another, in this order (each file's checks in their own order)
for (const g of GROUPS) await import(`./checks/${g}.mjs`);

// ---- checks not yet in a group (newest last) ----
await check('terrainmath', async () => (await import('./terrain-math.mts')).terrainMathCheck());
await check('renderaudit', async () => (await import('./render-audit.mts')).renderAudit(b));
await check('r87ui', async () => (await import('./r87-ui.mts')).r87UiCheck(b));

await b.close();
const failed = results.filter(r => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
