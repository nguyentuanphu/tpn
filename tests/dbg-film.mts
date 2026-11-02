// (films batch, while writing) plays every page of the given tale films to the end and prints script errors:
//   node dbg-film.mts id id…
import { launch, open } from './harness.mts';
const b = await launch();
const P = await open(b, { w: 1000, h: 700, play: false });
const msgs = []; P.page.on('console', m => { if (/^film: /.test(m.text())) console.log(m.text()); if (/film|Error|error/i.test(m.text()) && !/flatShading/.test(m.text())) msgs.push(m.text()); });
const r = await P.page.evaluate(async ids => {
  const F = await import('/js/film.js'), L = await import('/js/content/talefilms.js');
  const frame = () => new Promise(r => requestAnimationFrame(r)), out = [];
  const stage = document.createElement('div'); stage.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:360px'; document.body.appendChild(stage);
  for (const id of ids) {
    console.log('film: loading ' + id); const script = await L.taleFilm(id); console.log('film: loaded ' + id); if (!script) { out.push(id + ': no film'); continue; }
    const f = F.createFilm(stage, script, { name: 'Na', companion: 'firefly', look: {} });
    for (let k = 0; k < script.pages.length; k++) {
      console.log('film: page ' + id + ' ' + k); const done = f.page(k); let ended = false; done.then(() => { ended = true; }); f.narrated();
      const p = f.now; if (!p.root.children.length) out.push(`${id} p${k + 1}: empty`);
      for (let i = 0; i < 400 && !ended; i++) { if (p.hold) p.release(true); p.t += .25; await frame(); }
      if (!ended) out.push(`${id} p${k + 1}: did not end (t ${p.t.toFixed(1)}, len ${p.len})`);
    }
    f.close(); out.push(id + ': ' + script.pages.length + ' pages played');
  }
  return out;
}, process.argv.slice(2));
console.log(r.join('\n')); console.log(msgs.slice(0, 20).join('\n')); console.log(P.errors.slice(0, 10).join('\n'));
await b.close();
