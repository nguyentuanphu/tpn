// Packs the game's scripts into a few small files for the website (Analytics & Infra, 10 Oct, task infra-speed): the
// start-up download shrinks (minified, ~150 files become a handful) and the phone makes far fewer requests.
//   node tools/bundle.mts <folder>        pack the game inside <folder> (a copy: build-netlify.sh's netlify-site, or
//                                         Netlify's own checkout); the repository itself is never changed
// What it does in <folder>:
//   - bundle/: js/main.js and everything it imports, minified, split into chunks (stories and games that load later
//     stay in their own chunks); file names carry a content hash
//   - index.html: starts bundle/main.js and preloads its start-up chunks (instead of the ~150 js/ files)
//   - sw.js: the offline list keeps everything else and lists bundle/ instead of the game's js/ files
// js/ stays in <folder> untouched: Sparkle Studio's pages read the game's own modules. Development and the checks run on
// the plain modules with no build step. If esbuild cannot be found or installed, nothing is changed and the site works
// as before (the plain modules), so a deploy never fails because of this step.
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const ESBUILD = '0.25.10';
const HERE = path.dirname(fileURLToPath(import.meta.url));
// esbuild is installed outside the site (never published): the system's temp folder
const TOOL = path.join(os.tmpdir(), 'sv-esbuild-' + ESBUILD);
const dir = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(dir, 'index.html')) || !fs.existsSync(path.join(dir, 'sw.js'))) { console.error('usage: node tools/bundle.mts <folder with index.html, sw.js and js/>'); process.exit(2); }
if (path.resolve(dir) === path.resolve(HERE, '..') && !process.env.NETLIFY) { console.error('bundle: refusing to change the repository itself; give it a copy (build-netlify.sh does)'); process.exit(2); }

async function loadEsbuild() {
  const tryReq = base => { try { return createRequire(path.join(base, 'x.js'))('esbuild'); } catch (e) { return null; } };
  let e = tryReq(TOOL) || tryReq(path.join(HERE, '..', 'tests'));
  if (e) return e;
  try {
    fs.mkdirSync(TOOL, { recursive: true });
    const args = ['install', '--no-audit', '--no-fund', '--no-save', '--prefix', TOOL, `esbuild@${ESBUILD}`];
    // Windows cannot start npm.cmd without a shell (EINVAL): run npm's own script, installed beside node.exe
    if (process.platform === 'win32') execFileSync(process.execPath, [path.join(path.dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npm-cli.js'), ...args], { stdio: 'inherit' });
    else execFileSync('npm', args, { stdio: 'inherit' });
  } catch (err) { return null; }
  return tryReq(TOOL);
}

const esbuild = await loadEsbuild();
if (!esbuild) { console.warn('bundle: esbuild not available: the site keeps the plain modules'); process.exit(0); }
// the game's modules that pages and the checks import by their own address (/js/state.js…): each gets its own small
// entry in bundle/, and an import map in index.html points the address at it, so they share the game's running copy
// (the plain js/ file would be a second copy that the game never sees)
const SHARED = ['js/state.js', 'js/custom.js', 'js/world.js', 'js/games/frame.js'];
const out = path.join(dir, 'bundle');
fs.rmSync(out, { recursive: true, force: true });
const res = await esbuild.build({
  entryPoints: { main: path.join(dir, 'js/launch.js'), ...Object.fromEntries(SHARED.map(f => [f.replace(/^js\//, '').replace(/\.js$/, '').replace(/\//g, '-'), path.join(dir, f)])) }, bundle: true, splitting: true, format: 'esm', target: 'es2022',
  // (11 Oct, #36) keepNames off: nothing reads a function's or class's own name; saves about 13 KB
  minify: true, keepNames: false, legalComments: 'none', charset: 'utf8', outdir: out, chunkNames: 'c-[hash]', entryNames: '[name]-[hash]',
  metafile: true, logLevel: 'error', preserveSymlinks: true // (a copy with linked folders, as the checks build it, keeps its own paths)
});
const rel = f => path.relative(dir, path.resolve(f)).split(path.sep).join('/');
// esbuild's account of each file it wrote (its metafile)
type Output = { entryPoint?: string, imports?: { path: string, kind: string, external?: boolean }[], inputs: Record<string, { bytesInOutput: number }>, bytes: number };
const outputs: Record<string, Output> = res.metafile.outputs, files = Object.keys(outputs).map(rel).filter(f => f.endsWith('.js')).sort();
const entry = Object.keys(outputs).find(k => outputs[k].entryPoint && rel(outputs[k].entryPoint) === 'js/launch.js' && k.endsWith('.js'));
if (!entry) throw new Error('bundle: no output for js/launch.js');
// the chunks the start needs (static imports from the entry, all the way down)
const start = new Set(), walk = k => { for (const i of outputs[k].imports || []) if (i.kind === 'import-statement' && !start.has(i.path)) { start.add(i.path); walk(i.path); } };
walk(entry);
// index.html: start the bundle, preload its start-up chunks
const idx = path.join(dir, 'index.html'); let html = fs.readFileSync(idx, 'utf8');
const pre = '<!-- preload:start (tools/bundle.mts) -->\n' + [...start].map(f => `<link rel="modulepreload" href="${rel(f)}">`).join('\n') + '\n<!-- preload:end -->';
if (!/<!-- preload:start[\s\S]*?<!-- preload:end -->/.test(html) || !html.includes('src="js/launch.js"')) throw new Error('index.html: no preload block or js/launch.js script');
const imap = {}; for (const [k, o] of Object.entries(outputs)) if (o.entryPoint && SHARED.includes(rel(o.entryPoint))) imap['/' + rel(o.entryPoint)] = './' + rel(k);
const mapTag = `<script type="importmap">${JSON.stringify({ imports: imap })}</script>`;
html = html.replace(/<!-- preload:start[\s\S]*?<!-- preload:end -->/, mapTag + '\n' + pre).replace('src="js/launch.js"', `src="${rel(entry)}"`);
fs.writeFileSync(idx, html);
// sw.js: the offline list without the bundled files, with bundle/ (every chunk, so stories and games that load later
// also play offline)
const swf = path.join(dir, 'sw.js'); let sw = fs.readFileSync(swf, 'utf8');
const m = sw.match(/const FILES = \[([\s\S]*?)\];/); if (!m) throw new Error('sw.js: no FILES list');
const inputs = new Set(Object.keys(res.metafile.inputs).map(rel));
// (v1.08) comments are left out first: an apostrophe in a comment ("the round's new games") once split the list into
// broken names, the offline copy could not be filled and every start downloaded the whole game again (check startup)
const keep = [...m[1].replace(/\/\/[^\n]*/g, '').matchAll(/'([^']+)'/g)].map(x => x[1]).filter(f => !inputs.has(f));
sw = sw.replace(m[0], `const FILES = ${JSON.stringify([...keep, ...files]).replace(/"/g, "'").replace(/','/g, "', '")};`);
fs.writeFileSync(swf, sw);
// (11 Oct, #36) the stylesheet minified into bundle/ under a hashed name (the plain css/style.css stays for Sparkle
// Studio's pages and the checks' linked copy); index.html and the offline list point at it
let cssOut = '';
{ const src = path.join(dir, 'css/style.css');
  if (fs.existsSync(src)) {
    const min = (await esbuild.transform(fs.readFileSync(src, 'utf8'), { loader: 'css', minify: true, legalComments: 'none' })).code;
    const { createHash } = await import('crypto'), name = `bundle/style-${createHash('sha1').update(min).digest('hex').slice(0, 8)}.css`;
    fs.writeFileSync(path.join(dir, name), min); cssOut = name;
    let h = fs.readFileSync(idx, 'utf8'); if (!h.includes('href="css/style.css"')) throw new Error('index.html: no css/style.css link');
    fs.writeFileSync(idx, h.replace('href="css/style.css"', `href="${name}"`));
    let w = fs.readFileSync(swf, 'utf8'); if (!w.includes("'css/style.css'")) throw new Error('sw.js: no css/style.css in FILES');
    fs.writeFileSync(swf, w.replace("'css/style.css'", `'${name}'`));
  } }
const kb = f => fs.statSync(path.join(dir, f)).size / 1024, startKB = [rel(entry), ...[...start].map(rel)].reduce((a, f) => a + kb(f), 0);
console.log(`bundle: ${inputs.size} scripts → ${files.length} files in bundle/ (start ${1 + start.size} files, ${(startKB / 1024).toFixed(2)} MB before gzip); index.html and sw.js updated${cssOut ? `; stylesheet ${cssOut}` : ''}`);

// A launcher may dynamically import main before the title: report both closures, not just modulepreload.
const initial = new Set<string>();
const include = k => {
  if (initial.has(k)) return;
  initial.add(k);
  for (const i of outputs[k].imports || []) if (i.kind === 'import-statement' && !i.external) include(i.path);
};
include(entry);
for (const [k, o] of Object.entries(outputs)) if (o.entryPoint && rel(o.entryPoint) === 'js/main.js') include(k);
const contributions: Record<string, number> = {};
for (const k of initial) for (const [file, value] of Object.entries(outputs[k].inputs)) contributions[rel(file)] = (contributions[rel(file)] || 0) + value.bytesInOutput;
const sizes = list => list.reduce((sum, f) => {
  const data = fs.readFileSync(path.resolve(f));
  sum.raw += data.length; sum.gzip += gzipSync(data).length; sum.brotli += brotliCompressSync(data).length; return sum;
}, { raw: 0, gzip: 0, brotli: 0 });
const report = { note: 'Main static dependency graph, not a browser transfer measurement. Dynamic boot imports, HTML, fonts and runtime requests are additional. Compression is estimated per file.',
  launcherFiles: 1 + start.size, initialFiles: initial.size, initialJS: sizes([...initial]),
  allJS: sizes(Object.keys(outputs).filter(f => f.endsWith('.js'))),
  css: cssOut ? sizes([path.join(dir, cssOut)]) : null,
  inputs: Object.fromEntries(Object.entries(contributions).sort((a, b) => b[1] - a[1])),
  deferredEntries: Object.entries(outputs).filter(([k, o]) => o.entryPoint && !initial.has(k)).map(([k, o]) => ({ file: rel(o.entryPoint), bytes: o.bytes })) };
console.log(`bundle size: main graph ${(report.initialJS.raw / 1e6).toFixed(3)} MB raw, ${(report.initialJS.gzip / 1024).toFixed(0)} KiB gzip estimate; all offline JS ${(report.allJS.raw / 1e6).toFixed(3)} MB`);
const reportAt = process.argv.indexOf('--report');
if (reportAt >= 0) {
  if (!process.argv[reportAt + 1]) throw new Error('bundle: --report needs an output folder');
  const reportDir = path.resolve(process.argv[reportAt + 1]); fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'size.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(reportDir, 'metafile.json'), JSON.stringify(res.metafile, null, 2) + '\n');
  fs.writeFileSync(path.join(reportDir, 'esbuild.txt'), await esbuild.analyzeMetafile(res.metafile, { verbose: true }));
}
