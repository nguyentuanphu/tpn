// For every "Expected N arguments, but got M" (M < N) in a tsconfig, mark the callee's parameters from index M on as
// optional ("name?") in its .ts declaration: a type note only (Node's stripping leaves the JS unchanged).
// usage: node optfix.mjs <repo> <tsconfig>
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const [repo, cfgPath] = process.argv.slice(2);
const require = createRequire(path.resolve(repo, 'tests/package.json'));
const ts = require('typescript');
const cfg = ts.getParsedCommandLineOfConfigFile(path.resolve(cfgPath), {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: d => { throw d; } });
const prog = ts.createProgram(cfg.fileNames, cfg.options);
const checker = prog.getTypeChecker();
const edits = new Map(); // file -> Set(pos)
const skipped = [];
const find = (sf, pos) => { let hit; const walk = n => { if (n.getStart(sf) <= pos && pos < n.end) { if (ts.isCallExpression(n) || ts.isNewExpression(n)) hit = n; ts.forEachChild(n, walk); } }; walk(sf); return hit; };
for (const d of prog.getSemanticDiagnostics()) {
  if (d.code !== 2554 || !d.file) continue;
  const m = /Expected (\d+)(?:-(\d+))? arguments, but got (\d+)/.exec(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  if (!m || +m[3] >= +m[1]) { skipped.push(`${d.file.fileName}:${d.start} too many`); continue; }
  const got = +m[3];
  const call = find(d.file, d.start);
  if (!call) { skipped.push(`${d.file.fileName}:${d.start} no call`); continue; }
  const sigs = [];
  const t = checker.getTypeAtLocation(call.expression);
  for (const s of (ts.isNewExpression(call) ? t.getConstructSignatures() : t.getCallSignatures())) sigs.push(s);
  if (!sigs.length) { const r = checker.getResolvedSignature(call); if (r) sigs.push(r); }
  let did = false;
  for (const s of sigs) {
    const decl = s.getDeclaration && s.getDeclaration();
    if (!decl || !decl.parameters) continue;
    const sf = decl.getSourceFile();
    if (!sf.fileName.endsWith('.ts') || sf.fileName.endsWith('.d.ts') || sf.fileName.includes('node_modules')) { skipped.push(`${d.file.fileName}:${d.start} decl in ${sf.fileName}`); continue; }
    for (let i = got; i < decl.parameters.length; i++) {
      const p = decl.parameters[i];
      if (p.questionToken || p.initializer || p.dotDotDotToken) continue;
      if (!ts.isIdentifier(p.name)) { skipped.push(`${sf.fileName}: destructured param ${p.name.getText(sf)}`); continue; }
      if (!edits.has(sf.fileName)) edits.set(sf.fileName, new Set());
      const bare = ts.isArrowFunction(decl) && decl.parameters.length === 1 && !sf.text.slice(decl.getStart(sf), p.name.getStart(sf)).includes('(');
      edits.get(sf.fileName).add(bare ? [p.name.getStart(sf), p.name.end] : p.name.end); did = true;
    }
  }
  if (!did && !sigs.length) skipped.push(`${d.file.fileName}:${d.start} no signature`);
}
let n = 0;
for (const [f, set] of edits) {
  let src = fs.readFileSync(f, 'utf8');
  const items = [...new Map([...set].map(e => [JSON.stringify(e), e])).values()].map(e => Array.isArray(e) ? e : [null, e]);
  for (const [a, b] of items.sort((x, y) => y[1] - x[1])) { src = a === null ? src.slice(0, b) + '?' + src.slice(b) : src.slice(0, a) + '(' + src.slice(a, b) + '?)' + src.slice(b); n++; }
  fs.writeFileSync(f, src);
}
console.log(`marked ${n} parameters optional in ${edits.size} files`);
for (const s of [...new Set(skipped)]) console.log('skip', s);
