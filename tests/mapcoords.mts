// No stray world positions (round T): js/content/map.js is the only place that holds where things are in the valley.
// Every other file places its things as an offset from a place's anchor (VILLAGE.x + 4, TOWN.z - 12, landmarkAt('opera')),
// so moving a place in the map moves everything in it. This finds world positions written as plain numbers:
//   { x: 98, z: 128 }   .place(28, 66)   heightAt(-10, 160)   put(geo, 103, 93.5)   [[84, 30], [92, 30]]
// in the files that build the valley. Numbers of one digit (local offsets inside a model) and offsets passed through a
// place's own at(dx, dz) helper are left alone.
//   node mapcoords.mts [folder]   (also the "mapcoords" check in run.mts)
import fs from 'fs';
import path from 'path';
// the files that place things in the valley (World core, the wiring in main.js, the Pad map, Studio's world edits)
export const FILES = ['world.js', 'roads.js', 'regions.js', 'regionsites.js', 'cities.js', 'town.js', 'suburbs.js', 'plots.js', 'reeds.js', 'lotus.js', 'heritage.js', 'asia.js', 'houses.js',
  'homes.js', 'myhouse.js', 'places.js', 'showcase.js', 'chatter.js', 'hawkers.js', 'vendors.js', 'animals.js', 'pets.js', 'farm.js', 'gather.js', 'snacks.js',
  'folkshow.js', 'player.js', 'solids.js', 'validate.js', 'traffic.js', 'powerlines.js', 'ferry.js', 'kite.js', 'weather.js', 'secrets.js', 'vnfun.js', 'yard.js',
  'openspot.js', 'twinchests.js', 'hoilang.js', 'surprises.js', 'lanterns.js', 'dinh.js', 'worldedit.js', 'shop.js', 'boxes.js', 'kidplay.js', 'companion.js', 'parents.js', 'coop.js', 'data.js', 'main.js', 'ui.js'];
const N = String.raw`-?\d{2,3}(?:\.\d+)?`;           // a number of two or three digits: a world position, not a model's own size
const PATTERNS = [
  ['{ x, z }', new RegExp(String.raw`\bx: ?${N}, ?(?:y: ?[^,]+, ?)?z: ?${N}\b`)],
  ['place(x, z)', new RegExp(String.raw`\.place\(${N}, ?${N}\b`)],
  ['heightAt(x, z)', new RegExp(String.raw`\b(?:heightAt|groundAt|oldHeightAt|regionAt|roadDist|riverDist|waterAt|waterDist)\(${N}, ?${N}\b`)],
  ['put(…, x, z)', new RegExp(String.raw`\b(?:put|add|pond|tree|shop|I|addNPC|cardTable|hidden|spot)\([^()]*\), ?${N}, ?${N}\b|\b(?:put|pond|tree)\(${N}, ?${N}\b`)],
  ['[[x, z], [x, z]]', new RegExp(String.raw`\[\[${N}, ?${N}\], ?\[${N}, ?${N}\]`)],
  ['dist2(…, x, z)', new RegExp(String.raw`\b(?:dist2|Math\.hypot)\([^()]*, ?${N}, ?${N}\)`)]
];
export function strayCoords(dir) {
  const found = [];
  for (const f of FILES) {
    const p = path.join(dir, f); if (!fs.existsSync(p)) continue;
    fs.readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, '').replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''"); // (not in comments or words)
      if (/\bat\((?:\.\.\.|-?\d)/.test(code)) return; // (offsets through a place's own at(dx, dz) helper: lotus.js, farm.js)
      for (const [kind, re] of PATTERNS) { const m = code.match(re); if (m) found.push({ file: f, line: i + 1, kind, text: m[0] }); }
    });
  }
  return found;
}
if (process.argv[1] && process.argv[1].endsWith('mapcoords.mts')) {
  const dir = process.argv[2] || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'js');
  const f = strayCoords(dir);
  for (const x of f) console.log(`${x.file}:${x.line}  ${x.kind}  ${x.text}`);
  console.log(f.length ? `${f.length} world positions outside js/content/map.js` : 'no stray world positions');
  process.exitCode = f.length ? 1 : 0;
}
