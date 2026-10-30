// The checks, quicker (owner, 13 Oct: "changed files checks, run 3 at once and smarter slow checks").
// Start the game server first (python3 -m http.server 8765 in the repo), then from tests/:
//   node suite.mjs                     the full suite: 3 checks at a time, the speed checks alone at the end; it also
//                                      records which game code each check runs (tests/check-map.json)
//   node suite.mjs --changed           only the checks for what changed since main (a film, a button fix…)
//   node suite.mjs --changed --list    show which checks it would run and why, without running them
// Options: --base <git ref> (default origin/main), --jobs <n> (default 3), --all (no samples: every slow check in full),
// --no-map (the full suite without recording code), --only a,b,c (just these checks, for timing the runner);
// on GitHub (.github/workflows/full-suite.yml): --shard k/n --no-solo on each machine, then --collect <dir>.
// The slowest checks (reading, films, voicearea) try a sample that changes every run, and everything when their own
// files changed since the base (run.mjs: SV_SAMPLE, SV_FULL, SV_SEED). The heavy checks share one lane; a check that
// failed beside others runs once more alone, and the summary lists it as "passed only alone".
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, execFileSync } from 'child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.resolve(HERE, '..');
const args = process.argv.slice(2), flag = n => args.includes(n), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const JOBS = Math.max(1, Number(opt('--jobs', 3)) || 3), CHANGED = flag('--changed'), LIST = flag('--list');
// these measure how fast the game is: never beside another check
const SOLO = ['perf', 'startup', 'battery'];
// (13 Oct trial: 3 at once overloaded the machine when these ran side by side) the heavy checks share one lane, one after
// another; the everyday checks share the other lanes
const HEAVY = ['ownerdesk', 'ownerstudioperms', 'ownerstudiofolds', 'ownerround', 'ownerfamily', 'ownercapture', 'films', 'testerrewards', 'reading', 'facetoface', 'phone', 'chapter2', 'chapter3', 'studio', 'voicearea', 'solid', 'nametags', 'migrate', 'testerreport', 'camera', 'spill', 'games'];
// the slowest checks and the files that are theirs: in full when one of these changed, a sample otherwise
const SLOW_OWN = {
  reading: [/^js\/games\/reading/, /^js\/content\/reading/],
  films: [/^js\/film\.js$/, /^js\/content\/[a-z0-9]*films?\.js$/, /^js\/tales\.js$/, /^js\/howto\.js$/, /^js\/talesdata\.js$/],
  voicearea: [/^js\/voice[a-z]*\.js$/, /^voices\//, /^tools\/make-voice-pack/],
};
// a change to the look (css) is checked by the checks that measure what is on screen
const LAYOUT = ['phone', 'contract', 'hscroll', 'chips', 'a11y', 'iphone', 'simple', 'adventure', 'facetoface', 'two-players', 'questbar', 'bagitems', 'friendstab', 'shop', 'mictest'];
// checks without a browser, a few seconds each: always run
const QUICK = ['unit', 'rules', 'types', 'arch', 'emoji', 'noemoji', 'preload', 'names', 'bilingual'];

// (r82) core.quotePath=false: a folder with Vietnamese letters (photos/vi-bạch-dinh/) comes back as its plain name,
// not git's quoted "photos/vi-b\341\272\241ch-dinh/", which no rule below could place
const git = (...a) => execFileSync('git', ['-c', 'core.quotePath=false', ...a], { cwd: REPO, encoding: 'utf8', maxBuffer: 1 << 28 });
const tryGit = (...a) => { try { return git(...a); } catch (e) { return null; } };
const RUN = fs.readFileSync(path.join(HERE, 'run.mjs'), 'utf8'), RUNLINES = RUN.split('\n');
const ALL = [...RUN.matchAll(/^await check\('([a-z0-9-]+)'/gm)].map(m => m[1]);
const TIMES_F = path.join(HERE, 'check-times.json'), MAP_F = path.join(HERE, 'check-map.json');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return d; } };
const times = readJSON(TIMES_F, {});
const GAME_URL = process.env.SV_URL || 'http://localhost:8765/';
// (owner, 16 Oct AEDT: TypeScript, batch 0) the game's .ts files made into .js once, before any run (tools/build.mts)
if (!flag('--list') && !flag('--collect')) { execFileSync(process.execPath, [path.join(HERE, '../tools/build.mts')], { stdio: 'inherit' }); process.env.SV_BUILT = '1'; }

// where each check's code sits in run.mjs (line numbers, from 1)
// (from its "await check(" line to its closing "});"; lines between checks are shared helpers)
const blocks = (() => { const out = []; RUNLINES.forEach((l, i) => { const m = /^await check\('([a-z0-9-]+)'/.exec(l); if (m) { let j = i; while (j < RUNLINES.length - 1 && !/^\}\);/.test(RUNLINES[j])) j++; out.push({ name: m[1], from: i + 1, to: j + 1 }); } }); return out; })();
const bodyOf = n => { const b = blocks.find(x => x.name === n); return b ? RUNLINES.slice(b.from - 1, b.to).join('\n') : ''; };

const base = (() => { const b = opt('--base', tryGit('rev-parse', '--verify', '-q', 'origin/main') ? 'origin/main' : 'main'); return (tryGit('merge-base', 'HEAD', b) || b).trim(); })();
const changedFiles = () => {
  const d = (tryGit('diff', '--name-only', base) || '').split('\n'), u = (tryGit('ls-files', '--others', '--exclude-standard') || '').split('\n');
  return [...new Set([...d, ...u].map(s => s.trim()).filter(Boolean))];
};
// "@@ -a,b +c,d @@" → { old: [a, b], new: [c, d] }
const hunks = (from, file) => (tryGit('diff', '-U0', from, '--', file) || '').split('\n').map(l => /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(l)).filter(Boolean)
  .map(m => ({ old: [+m[1], m[2] === undefined ? 1 : +m[2]], new: [+m[3], m[4] === undefined ? 1 : +m[4]] }));

// ---------- which checks for what changed ----------
function select() {
  const files = changedFiles(), pick = new Map(), notes = [];
  const add = (names, why) => { for (const n of names) if (ALL.includes(n)) { if (!pick.has(n)) pick.set(n, new Set()); pick.get(n).add(why); } };
  const full = why => ({ full: true, why, files });
  const map = readJSON(MAP_F, null);
  const bitsOf = hex => { const out = []; let v = BigInt('0x' + (hex || '0')); for (let i = 0; v; i++, v >>= 1n) if (v & 1n) out.push(map.checks[i]); return out; };
  let game = false;
  for (const f of files) {
    if (/^(docs\/|\.github\/|README|HANDOFF|CLAUDE|LICENSE)|\.md$/.test(f)) continue;
    if (f === 'tests/run.mjs') {
      for (const h of hunks(base, f)) {
        const [c, d] = h.new, lo = c, hi = d ? c + d - 1 : c;
        const inside = blocks.filter(b => b.to >= lo && b.from <= hi), held = l => blocks.some(b => b.from <= l && l <= b.to);
        if (!inside.length || !held(lo) || !held(hi)) return full(`tests/run.mjs changed outside a check, near line ${lo} (shared helpers)`);
        add(inside.map(b => b.name), 'its check changed');
      }
      continue;
    }
    if (f === 'tests/studio-check.mjs') { add(['studio'], f); continue; }
    if (/^tests\/unit\/[\w.-]+\.test\.mjs$/.test(f)) { add(['unit'], f); continue; } // (r82) a unit test file changes only the unit check
    if (/^types\/.*\.d\.ts$|^tsconfig\.base\.json$/.test(f)) { add(['types', 'names'], f); continue; } // (r82) shared type notes: only the type checks read them
    if (/^tests\/(check-map|check-times)\.json$|^tests\/suite\.mjs$/.test(f)) continue;
    if (f === 'tests/ui-contract.json') { add(['contract'], f); continue; }
    if (f.startsWith('tests/')) return full(f + ' changed (shared test code)');
    // (r82, TypeScript) a game file in .ts runs as the .js made beside it (tools/build.mts), so every check that loads that
    // .js; a line-by-line choice cannot follow a file that was renamed from .js
    if (/^js\/.*\.ts$/.test(f) && !f.endsWith('.d.ts')) {
      game = true;
      if (!map) return full('no code map yet (tests/check-map.json): run the full suite once');
      const entry = map.files[f.replace(/\.ts$/, '.js')];
      if (!entry) notes.push(`${f}: a new file (checked through the file that loads it)`); else add(bitsOf(entry.load), f + ' (TypeScript: every check that loads it)');
      continue;
    }
    if (/^js\/.*\.js$/.test(f)) {
      game = true;
      if (!map) return full('no code map yet (tests/check-map.json): run the full suite once');
      const entry = map.files[f];
      if (!entry) { notes.push(tryGit('cat-file', '-e', `${map.commit}:${f}`) !== null ? `${f}: no check runs this file` : `${f}: a new file (checked through the file that loads it)`); continue; }
      const old = tryGit('show', `${map.commit}:${f}`);
      if (old === null) { add(bitsOf(entry.load), f + ' (whole file: the code map is from an older history)'); continue; }
      const starts = [0]; for (let i = 0; i < old.length; i++) if (old[i] === '\n') starts.push(i + 1);
      const lineAt = n => starts[Math.min(Math.max(n, 1), starts.length) - 1], lineEnd = n => (n < starts.length ? starts[n] - 1 : old.length);
      for (const h of hunks(map.commit, f)) {
        const [a, b] = h.old, s = lineAt(b ? a : Math.max(a, 1)), e = lineEnd(b ? a + b - 1 : Math.max(a, 1));
        // the innermost function that holds the whole change; the file's top level when none does
        let best = null; for (const fn of entry.fns) if (fn[0] <= s && fn[1] >= e && !(fn[0] === 0 && fn[1] >= old.length - 2) && (!best || fn[1] - fn[0] < best[1] - best[0])) best = fn;
        if (!best) { add(bitsOf(entry.load), `${f}:${a} (top level)`); continue; }
        const who = bitsOf(best[2]);
        if (!who.length) notes.push(`${f}:${a}: no check runs the changed function (line ${a})`); else add(who, `${f}:${a}`);
      }
      continue;
    }
    if (/^css\//.test(f)) { game = true; add(LAYOUT, f); add(ALL.filter(n => bodyOf(n).includes(path.basename(f))), f); continue; }
    if (/^(index\.html|sw\.js|manifest\.webmanifest|netlify\.toml)$/.test(f)) { game = true; add(['boot', 'offline', 'startup', 'preload', 'contract', 'phone', 'perf'], f); continue; }
    if (/^voices\//.test(f)) { add(ALL.filter(n => /voice/.test(n)), f); continue; }
    if (/^photos\//.test(f)) { add(['realphotos', 'familyphotos', 'boot'], f); continue; }
    if (/^(vendor|fonts|icons)\//.test(f)) return full(f + ' changed (shared by everything)');
    // anything else (content, studio, tools…): the checks that name the file; nothing names it → the full suite
    const named = ALL.filter(n => bodyOf(n).includes(path.basename(f)) || bodyOf(n).includes(f));
    if (/^tools\//.test(f)) { add(named, f); continue; }
    if (/^studio\//.test(f)) { add(['studio', 'nostudio', ...named], f); continue; }
    if (!named.length) return full(f + ' changed and no check names it');
    add(named, f);
  }
  add(QUICK, 'always (no browser, seconds)');
  if (game) {
    add(['boot', 'phone', 'contract'], 'a game file changed');
    if (map) add([...map.nocover, ...ALL.filter(n => !map.checks.includes(n))], 'a game file changed (checks the code map cannot see)');
  }
  return { full: false, files, pick, notes, map };
}
function slowFull(files) { return Object.keys(SLOW_OWN).filter(n => files.some(f => SLOW_OWN[n].some(r => r.test(f)))); }

// ---------- running ----------
function runOne(list, env, tag) {
  return new Promise(res => {
    const out = new Map(), log = fs.createWriteStream(path.join(HERE, `out/suite-${tag}.log`));
    const p = spawn(process.execPath, ['run.mjs', ...list], { cwd: HERE, env: { ...(fs.existsSync('/opt/pw-browsers/chromium') ? { CHROMIUM: '/opt/pw-browsers/chromium' } : {}), SV_URL: GAME_URL, ...process.env, ...env } });
    let buf = '';
    const line = l => {
      log.write(l + '\n');
      const ok = /^✅ ([a-z0-9-]+) \((\d+)s\) ?(.*)/.exec(l), bad = /^❌ ([a-z0-9-]+): (.*)/.exec(l);
      if (ok) { out.set(ok[1], { ok: true, secs: +ok[2], note: ok[3] }); console.log(`[${tag}] ${l.slice(0, 160)}`); }
      if (bad) { out.set(bad[1], { ok: false, note: bad[2] }); console.log(`[${tag}] ${l.slice(0, 300)}`); }
    };
    const eat = d => { buf += d; const parts = buf.split('\n'); buf = parts.pop(); parts.forEach(line); };
    p.stdout.on('data', eat); p.stderr.on('data', d => log.write(d));
    p.on('close', () => { if (buf) line(buf); log.end(); for (const n of list) if (!out.has(n)) out.set(n, { ok: false, note: 'did not finish (the run stopped)' }); res(out); });
  });
}
// split into n groups of about the same length (longest first)
function shards(list, n) {
  const g = Array.from({ length: n }, () => ({ t: 0, list: [] }));
  for (const c of [...list].sort((a, b) => (times[b] || 60) - (times[a] || 60))) { const s = g.reduce((m, x) => x.t < m.t ? x : m); s.list.push(c); s.t += times[c] || 60; }
  return g.filter(x => x.list.length);
}
async function runAll(list, env) {
  const results = new Map(), par = list.filter(c => !SOLO.includes(c)), solo = list.filter(c => SOLO.includes(c));
  const heavy = par.filter(c => HEAVY.includes(c)), light = par.filter(c => !HEAVY.includes(c));
  const groups = JOBS > 1 && heavy.length ? [{ t: heavy.reduce((a, c) => a + (times[c] || 60), 0), list: heavy }, ...shards(light, JOBS - 1)] : shards(par, JOBS);
  console.log(`${list.length} checks: ${groups.map((g, i) => `group ${i + 1} ${g.list.length} (~${Math.round(g.t / 60)} min)`).join(', ')}${solo.length ? `, then alone: ${solo.join(', ')}` : ''}`);
  (await Promise.all(groups.map((g, i) => runOne(g.list, env, String(i + 1))))).forEach(m => m.forEach((v, k) => results.set(k, v)));
  // (the speed checks measure the game: never with the code recording on, which slows it)
  if (solo.length) { const { SV_COVER, ...plain } = env; (await runOne(solo, plain, 'solo')).forEach((v, k) => results.set(k, v)); }
  // a check that failed beside others runs once more alone (nothing else running); the summary says which passed only alone,
  // so a real failure is never hidden: one that also fails alone stays FAILED
  const red = [...results].filter(([k, r]) => !r.ok && !SOLO.includes(k)).map(([k]) => k);
  if (red.length && (JOBS > 1 || /^\d+\/\d+$/.test(opt('--shard', '')))) { console.log(`once more, alone: ${red.join(', ')}`); (await runOne(red, env, 'alone')).forEach((v, k) => results.set(k, { ...v, alone: true, first: results.get(k).note })); }
  return results;
}
function buildMap(names) {
  const dir = path.join(HERE, 'out/cover'), files = {}, nocover = [];
  names.forEach((n, i) => {
    const c = readJSON(path.join(dir, n + '.json'), null);
    if (!c || !Object.keys(c.ran || {}).length) { nocover.push(n); return; }
    const bit = 1n << BigInt(i);
    for (const [f, ranges] of Object.entries(c.seen || {})) { const e = files[f] = files[f] || { load: 0n, fns: new Map() }; for (const [s, t] of ranges) if (!e.fns.has(s + ':' + t)) e.fns.set(s + ':' + t, 0n); }
    for (const [f, ranges] of Object.entries(c.ran)) { const e = files[f] = files[f] || { load: 0n, fns: new Map() }; e.load |= bit; for (const [s, t] of ranges) e.fns.set(s + ':' + t, (e.fns.get(s + ':' + t) || 0n) | bit); }
  });
  const out = { commit: git('rev-parse', 'HEAD').trim(), made: new Date().toISOString(), checks: names, nocover, files: {} };
  for (const [f, e] of Object.entries(files).sort()) out.files[f] = { load: e.load.toString(16), fns: [...e.fns].map(([k, v]) => [...k.split(':').map(Number), v.toString(16)]).sort((a, b) => a[0] - b[0] || b[1] - a[1]) };
  return out;
}

// ---------- main ----------
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
// (GitHub full suite, docs/cores/tasks/github-suite.md) --collect <dir>: join the results of the GitHub machines (each one's
// out/suite-result.json and out/cover/), write the summary (out/suite-summary.md), refresh the code map and the times
if (flag('--collect')) {
  const dir = path.resolve(opt('--collect', 'shards')), results = new Map();
  fs.rmSync(path.join(HERE, 'out/cover'), { recursive: true, force: true }); fs.mkdirSync(path.join(HERE, 'out/cover'), { recursive: true });
  for (const d of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    for (const [n, r] of Object.entries(readJSON(path.join(dir, d, 'suite-result.json'), {}))) results.set(n, r);
    const cov = path.join(dir, d, 'cover'); if (fs.existsSync(cov)) for (const f of fs.readdirSync(cov)) fs.copyFileSync(path.join(cov, f), path.join(HERE, 'out/cover', f));
  }
  // (30 Oct AEDT) a run of chosen checks (--only, as the machines had) misses only the chosen ones
  const chosen = opt('--only', '') ? opt('--only', '').split(',').filter(n => ALL.includes(n)) : ALL;
  for (const n of chosen.filter(n => !SOLO.includes(n))) if (!results.has(n)) results.set(n, { ok: false, note: 'did not run (its machine stopped)' });
  for (const [n, r] of results) if (r.ok && r.secs) times[n] = r.secs;
  fs.writeFileSync(TIMES_F, JSON.stringify(Object.fromEntries(Object.entries(times).sort()), null, 0).replace(/,"/g, ',\n"') + '\n');
  const m = buildMap(ALL); fs.writeFileSync(MAP_F, JSON.stringify(m));
  const failed = [...results].filter(([, r]) => !r.ok), skipped = [...results].filter(([, r]) => r.ok && /^skipped/.test(r.note)), again = [...results].filter(([, r]) => r.ok && r.alone);
  const md = [`## Full suite on GitHub: ${results.size - failed.length}/${results.size} passed`, '',
    'The speed checks (`perf`, `startup`, `battery`) are not run here: the Release chat runs them on its own machine.', '',
    ...(failed.length ? ['### Failed', ...failed.map(([n, r]) => `- **${n}**: ${String(r.note).slice(0, 400).replace(/\n/g, ' ')}`), ''] : []),
    ...(again.length ? ['### Passed only on a second try', ...again.map(([n, r]) => `- ${n} (first: ${String(r.first).slice(0, 120)})`), ''] : []),
    ...(skipped.length ? [`Skipped here: ${skipped.map(([n]) => n).join(', ')}`, ''] : []),
    `Code map refreshed: ${Object.keys(m.files).length} files (the artifact "check-map" holds tests/check-map.json and tests/check-times.json for Release to commit).`];
  fs.writeFileSync(path.join(HERE, 'out/suite-summary.md'), md.join('\n') + '\n');
  console.log(md.join('\n'));
  process.exit(failed.length ? 1 : 0);
}
const up = await fetch(GAME_URL).then(r => r.ok).catch(() => false);
if (!up && !LIST) { console.log(`The game server is not answering at ${GAME_URL}: start it with "python3 -m http.server 8765" in the repo.`); process.exit(2); }
let list = ALL, mapping = false;
const files = changedFiles();
if (CHANGED) {
  const s = select();
  if (s.full) { console.log(`Full suite: ${s.why}.`); }
  else {
    list = ALL.filter(n => s.pick.has(n));
    console.log(`${s.files.length} changed file(s) since ${base.slice(0, 8)}; ${list.length} of ${ALL.length} checks:`);
    for (const n of list) console.log(`  ${n.padEnd(16)} ${[...s.pick.get(n)].slice(0, 3).join('; ')}`);
    for (const t of s.notes) console.log(`  note: ${t}`);
  }
} else if (opt('--only', '')) { list = opt('--only', '').split(',').filter(n => ALL.includes(n)); console.log(`only: ${list.join(', ')}`); }
else mapping = !flag('--no-map');
// --no-solo: leave out the speed checks (GitHub machines are shared: they measure speed badly)
if (flag('--no-solo')) list = list.filter(n => !SOLO.includes(n));
// --shard k/n: this machine's share of the checks (the n shares about the same length, longest first)
const SHARD = /^(\d+)\/(\d+)$/.exec(opt('--shard', ''));
if (SHARD) { const k = +SHARD[1], n = +SHARD[2], g = Array.from({ length: n }, () => ({ t: 0, list: [] })); for (const c of [...list].sort((a, b) => (times[b] || 60) - (times[a] || 60) || a.localeCompare(b))) { const s = g.reduce((m, x) => x.t < m.t ? x : m); s.list.push(c); s.t += times[c] || 60; } list = g[k - 1] ? g[k - 1].list : []; console.log(`share ${k} of ${n}: ${list.length} checks (~${Math.round((g[k - 1] || { t: 0 }).t / 60)} min): ${list.join(', ')}`); }
const full = flag('--all') ? Object.keys(SLOW_OWN) : slowFull(files), seed = Number(process.env.SV_SEED) || Math.floor(Date.now() / 36e5);
const sampledNow = list.filter(n => SLOW_OWN[n] && !full.includes(n));
if (sampledNow.length) console.log(`samples this run (seed ${seed}): ${sampledNow.join(', ')}${full.length ? `; in full (their files changed): ${full.join(', ')}` : ''}`);
if (LIST) process.exit(0);
if (mapping) fs.rmSync(path.join(HERE, 'out/cover'), { recursive: true, force: true });
const t0 = Date.now();
const results = await runAll(list, { SV_SAMPLE: '1', SV_FULL: full.join(','), SV_SEED: String(seed), ...(mapping ? { SV_COVER: '1' } : {}) });
for (const [n, r] of results) if (r.ok && r.secs) times[n] = r.secs;
fs.writeFileSync(TIMES_F, JSON.stringify(Object.fromEntries(Object.entries(times).sort()), null, 0).replace(/,"/g, ',\n"') + '\n');
fs.writeFileSync(path.join(HERE, 'out/suite-result.json'), JSON.stringify(Object.fromEntries(results)));
const failed = [...results].filter(([, r]) => !r.ok), skipped = [...results].filter(([, r]) => r.ok && /^skipped/.test(r.note));
if (mapping && !SHARD) {
  const dirty = (tryGit('status', '--porcelain', '--', 'js') || '').trim();
  if (dirty) console.log('code map NOT saved: js/ has uncommitted changes (commit first, so the map matches a commit)');
  else { const m = buildMap(ALL); fs.writeFileSync(MAP_F, JSON.stringify(m)); console.log(`code map saved: tests/check-map.json (${Object.keys(m.files).length} files, ${m.nocover.length} checks without a game page, ${(fs.statSync(MAP_F).size / 1048576).toFixed(1)} MB)`); }
}
const summary = [`${results.size - failed.length}/${results.size} checks passed in ${Math.round((Date.now() - t0) / 60000)} min (${JOBS} at a time${CHANGED ? ', changed files only' : ''}${SHARD ? `, share ${SHARD[1]}/${SHARD[2]}` : ''})`,
  ...(skipped.length ? [`skipped here: ${skipped.map(([n]) => n).join(', ')}`] : []),
  ...(() => { const a = [...results].filter(([, r]) => r.ok && r.alone); return a.length ? [`passed only alone (failed beside other checks, first: ${a.map(([n, r]) => `${n}: ${String(r.first).slice(0, 80)}`).join(' | ')})`] : []; })(),
  ...failed.map(([n, r]) => `FAILED ${n}: ${r.note.slice(0, 400)}`)];
fs.writeFileSync(path.join(HERE, 'out/suite-result.txt'), summary.join('\n') + '\n');
console.log('\n' + summary.join('\n'));
// a shard always ends 0 so its results reach --collect, which decides pass or fail
process.exit(failed.length && !SHARD ? 1 : 0);
