// The game's TypeScript files made into the plain JavaScript the phone runs (owner, 16 Oct AEDT: "TypeScript
// everywhere", in batches; plan docs/cores/tasks/typescript-plan-20261016.md). Every js/**/*.ts, studio/ui/**/*.ts and
// sw.ts gets its .js beside it, with the type notes taken out by Node's own type stripping: every line and column stays
// where it was, so an error on a phone points at the same line in the .ts (no source maps needed). Everything that
// loads the game (index.html, sw.js's offline list, tools/bundle.mts, the checks, Sparkle Studio) keeps loading .js
// by the same address. The .js made here is never committed: .gitignore lists each one (kept up to date here).
// Only type notes are allowed (tsconfig.base.json: erasableSyntaxOnly; no enum or namespace).
//   node tools/build.mts           make every .js that is missing or older than its .ts
//   node tools/build.mts --check   change nothing; exit 1 if a .js is missing or out of date, or .gitignore is
//   node tools/build.mts <folder>  the same in another copy of the game (build-netlify.sh's netlify-site)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripTypeScriptTypes } from 'module';
import { execFileSync } from 'child_process';

// Node calls type stripping "experimental" and says so once per run: the warning is left out of the build's output
const warn = process.emitWarning; process.emitWarning = (w, ...a) => { if (!/stripTypeScriptTypes|Type Stripping/i.test(String(w))) warn.call(process, w, ...a); };

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), CHECK = args.includes('--check'), ROOT = path.resolve(args.find(a => !a.startsWith('--')) || path.join(HERE, '..'));
const TAIL = f => `\n// made from ${path.basename(f)} by tools/build.mts: change the .ts, not this file\n`;
const START = '# --- made by tools/build.mts from .ts files (never committed; do not edit by hand) ---', END = '# --- end of tools/build.mts ---';

/** every TypeScript file of the game, relative to ROOT, with / */
export function sources(root = ROOT) {
  const out = [], walk = rel => { let ents; try { ents = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch (e) { return; }
    for (const d of ents) { const r = rel ? rel + '/' + d.name : d.name; if (d.isDirectory()) { if (d.name !== 'node_modules') walk(r); } else if (r.endsWith('.ts') && !r.endsWith('.d.ts')) out.push(r); } };
  walk('js'); walk('studio/ui'); walk('home'); if (fs.existsSync(path.join(root, 'sw.ts'))) out.push('sw.ts');
  return out.sort();
}
/** a .ts file's text as the JavaScript the browser runs (same lines and columns) */
export function strip(src, file = 'file.ts') {
  try { return stripTypeScriptTypes(src, { mode: 'strip' }) + TAIL(file); }
  catch (e) { throw new Error(`${file}: ${e.code === 'ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX' ? 'only type notes are allowed here (no enum, namespace or parameter properties)' : 'cannot be read as TypeScript'}: ${String(e.message).split('\n')[0]}`); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // Regenerate public source facts in a complete checkout before packaging.
  // Tiny build fixtures intentionally omit these inputs.
  if (ROOT === path.resolve(HERE, '..') && fs.existsSync(path.join(ROOT, 'js/games/catalog.ts'))) {
    execFileSync(process.execPath, [path.join(HERE, 'export-management-catalogue.mts'), ...(CHECK ? ['--check'] : [])], { cwd: ROOT, stdio: 'inherit' });
  }
  const ts = sources(), outs = ts.map(f => f.replace(/\.ts$/, '.js')), problems = [];
  // a .js committed to git beside its .ts would be two copies of the same file
  let tracked = new Set(); try { tracked = new Set(execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '--', ...outs], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean)); } catch (e) { }
  for (const o of outs) if (tracked.has(o)) problems.push(`${o} is committed to git and also made from ${o.replace(/\.js$/, '.ts')}: git rm --cached it`);
  let made = 0;
  for (const f of ts) {
    const src = path.join(ROOT, f), dst = src.replace(/\.ts$/, '.js');
    let js; try { js = strip(fs.readFileSync(src, 'utf8'), f); } catch (e) { problems.push(e.message); continue; }
    let have = null; try { have = fs.readFileSync(dst, 'utf8'); } catch (e) { }
    if (have === js) continue; // (compared by content, not by time: a git checkout gives every file a new time)
    if (CHECK) { problems.push(`${f.replace(/\.ts$/, '.js')} is missing or out of date with ${f}: run node tools/build.mts`); continue; }
    fs.writeFileSync(dst, js); made++;
  }
  // .gitignore: the list of made files, between the two marker lines (an old one whose .ts is gone is deleted too)
  const gi = path.join(ROOT, '.gitignore'), text = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
  // (a list written before the tool was renamed, by tools/build.mjs, is taken over, not kept twice)
  const mark = (m: string) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('build\\.mts', 'build\\.m[jt]s');
  const re = new RegExp(`${mark(START)}\\r?\\n([\\s\\S]*?)${mark(END)}\\r?\\n?`);
  const old = ((re.exec(text) || [])[1] || '').split(/\r?\n/).filter(Boolean).map(l => l.replace(/^\//, ''));
  const nl = text.includes('\r\n') ? '\r\n' : '\n';
  const block = outs.length ? `${START}${nl}${outs.map(o => '/' + o).join(nl)}${nl}${END}${nl}` : '';
  const next = re.test(text) ? text.replace(re, block) : text + (block && !text.endsWith('\n') && text ? '\n' : '') + block;
  if (next !== text) { if (CHECK) problems.push('.gitignore does not list the made .js files: run node tools/build.mts'); else fs.writeFileSync(gi, next); }
  if (!CHECK) for (const o of old) if (!outs.includes(o) && !fs.existsSync(path.join(ROOT, o.replace(/\.js$/, '.ts')))) fs.rmSync(path.join(ROOT, o), { force: true });
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(CHECK ? `build: ${ts.length} TypeScript files, every .js up to date` : `build: ${ts.length} TypeScript files, ${made} made`);
}
