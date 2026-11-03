// Sparkle Valley checks: Code and content rules (no game play): unit tests, rule registry, types, names, emoji, preload, validate.
// Run them through tests/run.mts (node run.mts <check>) or tests/suite.mts, not on their own.
// Moved unchanged from tests/run.mts (v1.07 split-tests, 2 Nov 2026 AEDT); see tests/checks/README.md.
import { fs, launch, open, clear, start, openAllGamesFixture, only, want, check, ok, b } from './shared.mts';

await check('validate', async () => {
  // the one world checker (js/validate.js): every hard rule it knows holds, each problem named by its rule id
  const P = await open(b, { w: 700, h: 500 }); await clear(P.page);
  const r = await P.page.evaluate(async () => (await import('/js/validate.js')).validateWorld(__sv));
  const errs = P.errors; await P.ctx.close();
  ok(!r.length && !errs.length, JSON.stringify(r.slice(0, 12)) + JSON.stringify(errs));
  return 'ROAD-001/002/003/004/011, VEH-001 and STALL-001…004 hold';
});

await check('emoji', async () => {
  // every emoji the game uses has a drawing in js/art.js (tools/emoji-audit.mts)
  const { execFileSync } = await import('child_process'), { fileURLToPath } = await import('url');
  let out = ''; try { out = execFileSync(process.execPath, ['../tools/emoji-audit.mts'], { encoding: 'utf8' }); } catch (e) { out = (e.stdout || '') + ''; ok(false, out.split('\n').slice(0, 12).join(' | ')); }
  // (owner, round R: "don't use emoji at all, including in all our docs, only our drawings") no emoji in the docs either
  const EMO = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]/u, ARROWS = /^[\u2190-\u21FF\u25A0-\u25FF\u2B05-\u2B07\u23E9-\u23FA©®™‼⁉〰]$/u, inDocs = [];
  for (const f of execFileSync('git', ['ls-files', '*.md', '*.txt'], { cwd: '..', encoding: 'utf8' }).split('\n').filter(Boolean)) {
    if (f.includes('node_modules')) continue;
    for (const ch of fs.readFileSync('../' + f, 'utf8')) if (EMO.test(ch) && !ARROWS.test(ch)) { inDocs.push(f + ' ' + ch); break; }
  }
  ok(!inDocs.length, 'emoji in the docs: ' + inDocs.join(', '));
  return out.trim().split('\n').pop() + '; no emoji in the docs';
});

await check('preload', async () => {
  // (round R, faster launch) index.html lists every start-up script so the browser fetches them all at once
  const { execFileSync } = await import('child_process'), { fileURLToPath } = await import('url');
  try { return execFileSync(process.execPath, [fileURLToPath(new globalThis.URL('../../tools/preload.mts', import.meta.url)), '--check'], { encoding: 'utf8' }).trim(); }
  catch (e) { throw new Error((e.stdout || e.message).trim()); }
});

await check('viwords', async () => {
  // (round R, owner: "bánh khọt" and "nước mía" said by the English voice can't be understood) Vietnamese names and dishes
  // inside English lines are cut out and said by the Vietnamese voice: by the recorded pack, the phone voice and online voices
  const { viRuns } = await import('../../js/viwords.js'), show = t => viRuns(t).map(([l, x]) => l === 'vi' ? '[' + x + ']' : x).join('');
  const cases = [['Buy some bánh khọt?', 'Buy some [bánh khọt]?'], ['Welcome to Hội An and Bắc Ninh!', 'Welcome to [Hội An] and [Bắc Ninh]!'],
    ['I am Bác 2. Every afternoon Bác 3, Bác 4 and I play cards.', 'I am [Bác 2]. Every afternoon [Bác 3], [Bác 4] and I play cards.'],
    ['We went to Nha Trang and Vũng Tàu.', 'We went to [Nha Trang] and [Vũng Tàu].'], ['Phố Hai Quê is home.', '[Phố Hai Quê] is home.'],
    ['Long ago, a kind girl called An Tiêm was sent', 'Long ago, a kind girl called [An Tiêm] was sent'], ['Xiè xie means thank you!', 'Xiè xie means thank you!'], ['Let us play a game!', 'Let us play a game!']];
  for (const [t, want] of cases) ok(show(t) === want, `cut: ${show(t)} (wanted ${want})`);
  const P = await open(b, { w: 1180, h: 820 }); await clear(P.page);
  const line = "I am Miss Tam. I teach at the secondary school, trường cấp 2. After school I help at my family's sugarcane juice cart, nước mía, on Two Homes Street, just like in Bà Rịa."; // Cô Tam's line as English says it
  const r = await P.page.evaluate(async line => {
    // a phone with an English and a Vietnamese voice: record what each utterance says, and in which language
    const said = [], fake = [{ name: 'Karen', lang: 'en-AU', localService: true }, { name: 'Linh', lang: 'vi-VN', localService: true }];
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
    speechSynthesis.getVoices = () => fake; speechSynthesis.speak = u => { said.push([u.lang, u.text]); setTimeout(() => u.onend && u.onend(), 5); };
    speechSynthesis.dispatchEvent(new Event('voiceschanged'));
    const V = await import('/js/voice.js'), H = await import('/js/packhash.js');
    await V.sayDevice('en', 'Buy some bánh khọt from Vũng Tàu, please!');
    const pack = V.voicePack(), h = H.lineHash('en', line);
    return { said, rec: pack && pack.lines[h], old: pack && pack.lines[H.packHash('en', line)], url: V.packUrl('en', line, 'f'), h };
  }, line);
  ok(JSON.stringify(r.said) === JSON.stringify([['en-AU', 'Buy some'], ['vi-VN', 'bánh khọt'], ['en-AU', 'from'], ['vi-VN', 'Vũng Tàu'], ['en-AU', ', please!']]), 'phone voice: ' + JSON.stringify(r.said));
  // (owner's decision, 3 Nov 2026 AEDT, v1.08 voices-aside: female voices only; not a weakened check) the male voice is put
  // aside, so the line's recording is the female one
  ok(r.rec === 'f', `the pack has no female recording of Cô Tam's line, or still names a male one (${r.rec})`);
  ok(!r.old && r.url.endsWith(r.h + '.mp3'), 'the old all-English recording is still used');
  const mp3 = fs.statSync(`../voices/en/f/${r.h}.mp3`).size;
  ok(!P.errors.length, P.errors.join(' | ')); await P.ctx.close();
  return `${cases.length} lines cut right; the phone says the Vietnamese words with its Vietnamese voice; recorded lines use the female voice (Cô Tam ${(mp3 / 1024).toFixed(0)} KB)`;
});

// No phone emoji anywhere (owner, round R): every emoji on screen is the game's own drawing (js/emojiswap.js), on the
// page (menus, Grown-ups, games, speech boxes) and on canvases (signs, name tags, the mini-map)
await check('noemoji', async () => {
  const bad = [];
  const scan = (P, where) => P.page.evaluate(w => {
    const EMO = /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*)*|[\u{1F1E6}-\u{1F1FF}]{2}/gu, out = new Set();
    const t0 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let t = t0.nextNode(); t; t = t0.nextNode()) { const p = t.parentElement; if (!p || p.closest('script,style,svg,textarea,input') || !p.getClientRects().length) continue; const s = t.nodeValue; for (const m of s.matchAll(EMO)) if (s[m.index + m[0].length] !== '︎') out.add(m[0] + ' (' + w + ')'); }
    return [...out];
  }, where).then(r => bad.push(...r));
  { const P = await open(b, { w: 820, h: 1180, touch: true, play: false, lang: 'vi' });
    await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who'); await P.page.click('.modes button[data-m=split]'); await scan(P, 'who'); await P.ctx.close(); }
  const P = await openAllGamesFixture(b, { w: 1180, h: 820, lang: 'vi' }); await clear(P.page);
  await scan(P, 'valley');
  await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForTimeout(500); await scan(P, 'Vui chơi'); await clear(P.page);
  for (const t of ['map', 'bag', 'log', 'album', 'passport', 'games', 'cam', 'friend']) { await P.page.evaluate(t => __sv.openPad(0, t), t); await P.page.waitForTimeout(400); await scan(P, 'Pad ' + t); await clear(P.page); }
  await P.page.evaluate(async () => { await (await import('/js/ui.js')).openGrownups(() => { }); }); await P.page.waitForTimeout(500);
  await P.page.evaluate(() => document.querySelectorAll('details').forEach(d => { d.open = true; })); await P.page.waitForTimeout(300); await scan(P, 'Grown-ups'); await clear(P.page);
  await P.page.evaluate(() => { __sv.dialog('Bà Năm', [['🌸 Hello! 🇻🇳 🇦🇺', '🌸 Chào con! 🇻🇳 🇦🇺']]); }); await P.page.waitForTimeout(400); await scan(P, 'speech box'); await clear(P.page);
  const ids = await P.page.evaluate(async () => Object.keys((await import('/js/games/frame.js')).GAMES));
  for (const id of ids) { await P.page.evaluate(id => { __sv.playGame(0, id, 'replay'); }, id); await P.page.waitForTimeout(400); await scan(P, 'game ' + id); await P.page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); }); await P.page.waitForTimeout(250); }
  // a canvas label with a flag and a flower is painted with the drawings (blue from the Australian flag)
  const cv = await P.page.evaluate(() => { const c = document.createElement('canvas'); c.width = 200; c.height = 60; const g = c.getContext('2d'); g.font = '40px sans-serif'; g.textBaseline = 'middle'; g.fillText('Jack 🇦🇺 🌸', 4, 30); const d = g.getImageData(0, 0, 200, 60).data; let blue = 0; for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 80 && d[i] < 30 && d[i + 1] < 60) blue++; return blue; });
  if (cv < 200) bad.push('canvas labels still use phone emoji');
  const noArt = await P.page.evaluate(() => [...(window.__svNoArt || [])]); if (noArt.length) bad.push('no drawing yet: ' + noArt.join(' '));
  if (P.errors.length) bad.push(...P.errors);
  await P.ctx.close();
  ok(!bad.length, [...new Set(bad)].slice(0, 10).join(' · '));
  return `no phone emoji on Who's playing, the valley, Vui chơi, 8 Pad tabs, Grown-ups, a speech box and ${ids.length} games; painted labels use the drawings`;
});

await check('arch', async () => {
  // the import map: groups of files importing each other in a circle may only get fewer (tests/arch.mts)
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['arch.mts'], { encoding: 'utf8' }); } catch (e) { ok(false, (e.stdout || '') + ''); }
  return out.trim().split('\n')[0];
});

await check('mapcoords', async () => {
  // (round T) js/content/map.js is the only place that holds world positions: the files that build the valley place their
  // things from a place's anchor, never at a position written as plain numbers (tests/mapcoords.mts; r54 had 103)
  const { strayCoords, FILES } = await import('../mapcoords.mts'), f = strayCoords('../js');
  ok(!f.length, f.slice(0, 12).map(x => `${x.file}:${x.line} ${x.text}`).join('; ') + (f.length > 12 ? ` (+${f.length - 12})` : ''));
  return `no world positions outside js/content/map.js in ${FILES.length} files`;
});

await check('unit', async () => {
  // Node unit tests (architecture §10): the L0 core (ids, events, seeded random, geometry), node --test tests/unit
  const { execFileSync } = await import('child_process');
  let out = ''; try { out = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...fs.readdirSync('unit').filter(f => f.endsWith('.test.mts')).map(f => 'unit/' + f)], { encoding: 'utf8' }); } catch (e) { const tap=String(e.stdout||''); fs.writeFileSync('out/unit-failure.tap',tap); ok(false, tap.split('\n').filter(l => /^not ok|Error|^\s*(?:error:|expected:|actual:|operator:)/.test(l)).slice(0, 20).join(' | ')); }
  const pass = (out.match(/^# pass (\d+)/m) || [])[1], fail = (out.match(/^# fail (\d+)/m) || [])[1];
  ok(+fail === 0 && +pass > 0, out.slice(-400));
  return `${pass} unit tests passed`;
});

await check('names', async () => {
  // every game file: no name used that is never defined or imported (TypeScript's TS2304 on all of js/, nothing else
  // judged). Moving code between files (the architecture steps) is where this goes wrong; it once stopped the game.
  const { execFileSync } = await import('child_process'), tsc = 'node_modules/typescript/lib/tsc.js';
  if (!fs.existsSync(tsc)) return 'skipped (run npm install in tests)';
  let out = ''; try { out = execFileSync(process.execPath, [tsc, '-p', 'tsconfig.names.json'], { encoding: 'utf8', maxBuffer: 64e6 }); } catch (e) { out = (e.stdout || '') + ''; }
  const bad = out.split('\n').filter(l => /TS2304/.test(l) && !l.startsWith('../vendor'));
  ok(!bad.length, bad.slice(0, 6).join(' | '));
  return `${fs.readdirSync('../js', { recursive: true }).filter(f => String(f).endsWith('.js')).length} game files: every name is defined or imported`;
});

await check('bilingual', async () => {
  // (Round U, owner 11 Oct: Grandma Huệ spoke Vietnamese with English set) no English slot of an [English, Vietnamese]
  // pair (an array, T(…, …) or { en, vi }) holds a Vietnamese sentence; names, songs and sayings that stay Vietnamese
  // on purpose are listed with a reason in tools/lang-allow.json (tools/lang-audit.mts)
  const { audit } = await import('../../tools/lang-audit.mts'), r = audit();
  ok(!r.length, r.slice(0, 12).map(x => `${x.file}:${x.line} "${x.en}"`).join(' | '));
  return 'every English line is English (names, songs and sayings on the allow list)';
});

await check('rules', async () => {
  // the rule registry (architecture step 0): js/content/rules.js is exactly what docs/ARCHITECTURE.md §9 says, and every
  // rule id the code and the checks name (ROAD-003, VEH-001, PRIV-004…) is in it
  const { execFileSync } = await import('child_process');
  try { execFileSync(process.execPath, ['../tools/rules-from-doc.mts', '--check'], { encoding: 'utf8' }); } catch (e) { ok(false, (e.stdout || '') + ''); }
  const { RULES } = await import('../../js/content/rules.js');
  const src = ['../js/validate.js', 'run.mts', ...fs.readdirSync('checks').filter(f => f.endsWith('.mts')).sort().map(f => 'checks/' + f), 'perf-baseline.json'].map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const named = [...new Set([...src.matchAll(/\b([A-Z]{2,8}-\d{3})\b/g)].map(m => m[1]))], missing = named.filter(id => !RULES[id]);
  ok(!missing.length, 'named in code but not in the registry: ' + missing.join(', '));
  return `${Object.keys(RULES).length} rules, the same in the document and the code; ${named.length} rule ids named by the checks, all known`;
});

await check('types', async () => {
  // type checking (owner, round 30): the files that start with // @ts-check are checked against their JSDoc types
  // (js/state.js, js/netmsg.js; tests/tsconfig.json lists them), then the .mts and .cts files (tests/tsconfig.server.json). Needs: cd tests && npm install
  const { execFileSync } = await import('child_process'), tsc = 'node_modules/typescript/lib/tsc.js';
  if (!fs.existsSync(tsc)) return 'skipped (run npm install in tests)';
  const runTsc = args => execFileSync(process.execPath, [tsc, ...args], { encoding: 'utf8' });
  const diagnostics = e => [e.stdout, e.stderr].filter(Boolean).join('\n').trim() || e.message;
  try { runTsc(['-p', '.']); runTsc(['-p', 'tsconfig-contracts.json']); runTsc(['-p', 'sw-tsconfig.json']); } catch (e) { ok(false, diagnostics(e)); }
  // (owner, 16-17 Oct AEDT: TypeScript batches 1 and 2) the website's server pieces, the Studio engine and the tools, as Node runs them
  let server = ''; try { server = runTsc(['-p', 'tsconfig.server.json', '--listFilesOnly']); runTsc(['-p', 'tsconfig.server.json']); } catch (e) { ok(false, 'tsconfig.server.json: ' + diagnostics(e)); }
  const n = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8')).files.length, ts = server.split('\n').filter(f => /\.(mts|cts)$/.test(f) && !f.includes('node_modules')).length;
  return `${n} explicit files type-checked; detector/outbox/family-backup modules additionally strict-checked; ${ts} TypeScript files of the server, Studio and tools; no errors`;
});
