// (r85, owner 18 Oct 2026 AEDT: "ensure all function in game should be able to control by studio"; "stories film
// switch is not available on studio") every switch the game reads has a Studio control: each id the game asks
// featureOn / releaseOn / keptOn / releaseNew / isPeek / G.keep for (or a file's own wrapper of them, like
// `const feat = id => featureOn(id, true)`) is in js/content/releases.js RELEASES, which Studio's Releases page and
// Sparkle Lab draw card by card (studio/ui/app.js drawReleases). A new feature switch without a Studio card fails here.
// Ids built from a list are expanded from that list: explain_<kind>_note/voice (js/explain.js EXPLAIN_KINDS),
// money_<game> (MONEY_GAMES), story_<chapter> (CHAPTERS), fest_<festival> (FESTCAL). No browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RELEASES, RELEASE_GROUPS } from '../../js/content/releases.js';
import { FESTCAL } from '../../js/content/festcal.js';
import { MONEY_GAMES } from '../../js/custom.js';
import { CHAPTERS } from '../../js/content/chapters.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const IDS = new Set(RELEASES.map(r => r.id));
const READERS = ['featureOn', 'releaseOn', 'keptOn', 'releaseNew', 'isPeek', 'G\\.keep'];

// every game source file once (a .ts and the .js made from it are the same file: the .ts is read)
function sources(dir = join(ROOT, 'js'), out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) sources(p, out);
    else if (/\.ts$/.test(f) || (/\.js$/.test(f) && !existsSync(p.replace(/\.js$/, '.ts')))) out.push(p);
  }
  return out;
}

// what each file reads: { literal ids, built ids (prefix/suffix), places that read an id no check can see }
function reads() {
  const lit = new Map(), built = new Map(), blind = [];
  const at = (m, id, where) => { if (!m.has(id)) m.set(id, []); m.get(id).push(where); };
  for (const file of sources()) {
    const src = readFileSync(file, 'utf8'), rel = relative(ROOT, file);
    if (/^js\/custom\.(js|ts)$/.test(rel)) continue; // (where the readers are made)
    // a file's own wrapper: const feat = id => featureOn(id, true); const keep = id => G.keep ? G.keep(id) : featureOn(id, true)
    const wraps = [...src.matchAll(new RegExp(`(?:const|let)\\s+(\\w+)\\s*=\\s*\\(?\\s*id\\b[^=;\\n]*=>[^;\\n]*?\\b(?:${READERS.join('|')})\\(\\s*id\\b`, 'g'))].map(m => m[1]);
    const names = [...READERS, ...wraps.filter(w => !READERS.includes(w))];
    const call = new RegExp(`(?<![\\w.])(${names.join('|')})\\(\\s*([^,)]*)`, 'g');
    for (const m of src.matchAll(call)) {
      const arg = m[2].trim(), line = src.slice(0, m.index).split('\n').length, where = `${rel}:${line}`;
      let k;
      if ((k = arg.match(/^(['"])(\w+)\1$/))) at(lit, k[2], where);
      else if ((k = arg.match(/^`(\w*)\$\{[^}]+\}(\w*)`$/))) at(built, `${k[1]}*${k[2]}`, where);
      else if ((k = arg.match(/^(['"])(\w+_)\1\s*\+/))) at(built, `${k[2]}*`, where);
      else if (/^id$/.test(arg) && (wraps.length || /G\.keep\s*=|const\s+\w+\s*=\s*id\b/.test(src.split('\n')[line - 1]))) continue; // (the wrapper itself)
      else if (/^id$/.test(arg) && /^js\/main\.js$/.test(rel)) continue; // (G.keep = (id, def) => keptOn(id, …))
      else if (/^\w+\.id$/.test(arg) && /\bRELEASES\.(filter|map|forEach|find)\b/.test(src.split('\n')[line - 1])) continue; // (going through RELEASES itself)
      else if ((k = arg.match(/^\w+\.(\w+)$/))) {
        // a slot's switch kept on it (traffic.js: sl.feat = 'rideAny'; sl.feat = sl.hide = 'rideBikes'): every id set on that field
        const set = [...src.matchAll(new RegExp(`\\.${k[1]}\\s*=\\s*(?:[\\w.]+\\s*=\\s*)*(['"])(\\w+)\\1`, 'g'))].map(s => s[2]);
        if (set.length) set.forEach(id => at(lit, id, where)); else blind.push(`${where} ${m[0]}`);
      }
      else if (!/^id$/.test(arg)) blind.push(`${where} ${m[0]}`);
    }
  }
  return { lit, built, blind };
}

// what each built id stands for, from the game's own lists
// (a game file's TypeScript source when it has one)
const src = f => readFileSync(join(ROOT, existsSync(join(ROOT, f.replace(/\.js$/, '.ts'))) ? f.replace(/\.js$/, '.ts') : f), 'utf8');
const EXPLAIN_KINDS = (src('js/explain.js').match(/EXPLAIN_KINDS\s*=\s*\[([^\]]*)\]/) || [, ''])[1].match(/\w+/g) || [];
const EXPAND = {
  'explain_*_note': EXPLAIN_KINDS.map(k => `explain_${k}_note`),
  'explain_*_voice': EXPLAIN_KINDS.map(k => `explain_${k}_voice`),
  'money_*': MONEY_GAMES.map(g => 'money_' + g),
  'story_*': CHAPTERS.map(c => 'story_' + c.id),
  'fest_*': FESTCAL.map(F => 'fest_' + F.id),
  'sparkleFruitParade_*': ['sparkleFruitParade_single', 'sparkleFruitParade_multi', 'sparkleFruitParade_tester']
};

test('every switch the game reads by name has a Studio control (Releases or Sparkle Lab)', () => {
  const { lit } = reads();
  assert.ok(lit.size > 30, `found the game's switches (${lit.size})`);
  const missing = [...lit].filter(([id]) => !IDS.has(id)).map(([id, w]) => `${id} (${w.join(', ')})`);
  assert.deepEqual(missing, [], 'add each to js/content/releases.js RELEASES (en, vi, group, def) so Studio can switch it');
});

test('every switch the game builds from a list has a Studio control for each one', () => {
  const { built } = reads();
  const unknown = [...built.keys()].filter(k => !EXPAND[k]);
  assert.deepEqual(unknown, [], 'a switch id built from a list: name the list in EXPAND here so each id is checked');
  assert.ok(EXPLAIN_KINDS.length >= 2, 'read EXPLAIN_KINDS');
  const missing = Object.entries(EXPAND).filter(([k]) => built.has(k)).flatMap(([, ids]) => ids.filter(id => !IDS.has(id)));
  assert.deepEqual(missing, [], 'add each to js/content/releases.js RELEASES');
});

test('no switch is read in a way this check cannot see', () => {
  assert.deepEqual(reads().blind, [], 'read a switch by its name (or a `prefix${x}` built from a list named in EXPAND)');
});

test('the story films can be switched in Studio (owner, 18 Oct AEDT)', () => {
  const f = RELEASES.find(r => r.id === 'storyFilms');
  assert.ok(f, 'storyFilms is in RELEASES'); assert.equal(f.group, 'story'); assert.equal(f.def, true);
  assert.ok(reads().lit.has('storyFilms'), 'the game reads storyFilms');
});

test('every Releases card has a group Studio shows, both languages and its own id', () => {
  const seen = new Set();
  for (const r of RELEASES) {
    assert.ok(!seen.has(r.id), `${r.id} once`); seen.add(r.id);
    assert.ok(RELEASE_GROUPS[r.group], `${r.id}: group ${r.group} is in RELEASE_GROUPS`);
    assert.ok(typeof r.en === 'string' && r.en.trim() && typeof r.vi === 'string' && r.vi.trim(), `${r.id}: English and Vietnamese`);
    assert.equal(typeof r.def, 'boolean', `${r.id}: def`);
  }
});

test('the Defaults page and content/custom.json switch only what Releases also has', () => {
  const app = readFileSync(join(ROOT, 'studio/ui/app.ts'), 'utf8'), from = app.indexOf('PAGES.play = '), page = app.slice(from, app.indexOf('\nPAGES.', from + 1));
  assert.ok(from > 0, 'found the Defaults page (PAGES.play)');
  const onDefaults = [...page.matchAll(/<select data-f="(\w+)">/g)].map(m => m[1]);
  assert.ok(onDefaults.includes('storyFilms'), 'Defaults still has the films');
  assert.deepEqual(onDefaults.filter(id => !IDS.has(id)), []);
  const custom = JSON.parse(readFileSync(join(ROOT, 'content/custom.json'), 'utf8'));
  assert.deepEqual(Object.keys(custom.features || {}).filter(id => !IDS.has(id)), []);
});
