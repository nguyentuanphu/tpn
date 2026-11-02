// Makes js/content/rules.ts (the rule registry, architecture §9.7) from the hard-rule tables in docs/ARCHITECTURE.md §9,
// so the document and the code can never disagree about a rule's id, words or severity.
//   node tools/rules-from-doc.mts            write js/content/rules.ts
//   node tools/rules-from-doc.mts --check    exit 1 if js/content/rules.ts is not what the document says (tests: "rules")
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export function rulesFromDoc(md) {
  const sec = md.slice(md.indexOf('## 9. Hard-rule framework'), md.indexOf('## 10.')), out = {};
  let head = null;
  for (const line of sec.split('\n')) {
    if (!line.startsWith('|')) { head = null; continue; }
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells[0] === 'Id') { head = cells.map(c => c.toLowerCase()); continue; }
    if (!head || !/^[A-Z][A-Z0-9]*-\d{3}$/.test(cells[0])) continue;
    const col = name => { const i = head.findIndex(h => h.startsWith(name)); return i >= 0 ? cells[i] : ''; };
    const plain = s => s.replace(/\*\*/g, '').replace(/`/g, '');
    out[cells[0]] = { text: plain(col('rule')), severity: col('sev'), check: plain(col('validation')), ...(col('alias') ? { alias: col('alias') } : {}) };
  }
  return out;
}
export const render = rules => `// The rule registry (architecture §9.7, step 0): every hard rule by its id, with its words, severity and how it is
// checked. MADE FROM docs/ARCHITECTURE.md §9 by tools/rules-from-doc.mts — change the document, then run the tool;
// never edit this file by hand (the "rules" check compares the two).
// Checkers report problems by id (js/validate.js); RULES tells how serious each one is.
export const RULES = ${JSON.stringify(rules, null, 1).replace(/\n\s*/g, ' ').replace(/ \}, "/g, ' },\n  "').replace(/^\{ /, '{\n  ').replace(/ \}$/, '\n}')};
export const SEVERITIES = ['BLOCKER', 'MAJOR', 'MINOR'];
/** @param {string} id */
export const ruleOf = id => RULES[id] || null;
`;
if (process.argv[1] && process.argv[1].endsWith('rules-from-doc.mts')) {
  const norm = (s: string) => s.replace(/\r\n/g, '\n');
  const want = render(rulesFromDoc(fs.readFileSync(path.join(ROOT, 'docs/ARCHITECTURE.md'), 'utf8'))), file = path.join(ROOT, 'js/content/rules.ts');
  if (process.argv.includes('--check')) { const same = fs.existsSync(file) && norm(fs.readFileSync(file, 'utf8')) === norm(want); console.log(same ? 'js/content/rules.ts matches docs/ARCHITECTURE.md §9' : 'js/content/rules.ts differs from docs/ARCHITECTURE.md §9: run node tools/rules-from-doc.mts'); process.exitCode = same ? 0 : 1; }
  else { fs.writeFileSync(file, want); console.log('wrote js/content/rules.ts:', Object.keys(rulesFromDoc(fs.readFileSync(path.join(ROOT, 'docs/ARCHITECTURE.md'), 'utf8'))).length, 'rules'); }
}
