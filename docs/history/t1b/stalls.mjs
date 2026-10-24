// (T1b) every STALL-001…004 problem js/validate.js finds, grouped by place, and the stalls it measured.
// Run: cd tests && CHROMIUM=/opt/pw-browsers/chromium node ../docs/t1b/stalls.mjs [out.txt]
import { launch, open } from '../../../tests/harness.mjs';
import fs from 'fs';
const b = await launch(); const { page } = await open(b, { w: 1000, h: 700 });
const r = await page.evaluate(async () => {
  const G = __sv, W = G.world, out = (await import('/js/validate.js')).validateWorld(G).filter(p => /^STALL-/.test(p.rule));
  return { out, stalls: W.stalls.map(s => ({ id: s.id, place: s.place, kind: s.kind })), walks: W.walks.map(w => ({ id: w.id, place: w.place })) };
});
const lines = [`${r.stalls.length} stalls, kiosks and shop fronts, ${r.walks.length} walking sellers; ${r.out.length} problems`];
const places = [...new Set([...r.stalls.map(s => s.place), ...r.walks.map(w => w.place)])];
for (const p of places) {
  const probs = r.out.filter(o => o.msg.includes(`(${p})`));
  lines.push('', `${p}: ${r.stalls.filter(s => s.place === p).map(s => s.id + ' (' + s.kind + ')').join(', ')}${r.walks.filter(w => w.place === p).map(w => '; walks: ' + w.id).join('')}`);
  for (const o of probs) lines.push(`  ${o.rule} ${o.msg}`);
}
const txt = lines.join('\n'); console.log(txt); if (process.argv[2]) fs.writeFileSync(process.argv[2], txt + '\n');
await b.close();
