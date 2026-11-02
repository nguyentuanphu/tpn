// The TypeScript build (owner, 16 Oct AEDT: "TypeScript everywhere", batch 0): tools/build.mts makes each .ts into the
// .js beside it, same lines and columns, listed in .gitignore. node --test tests/unit
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';
const BUILD = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../tools/build.mts');
const run = (dir, ...a) => { try { return { code: 0, out: execFileSync(process.execPath, [BUILD, dir, ...a], { encoding: 'utf8', stdio: 'pipe' }) }; } catch (e) { return { code: e.status, out: String(e.stdout) + String(e.stderr) }; } };
const game = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-build-')); fs.mkdirSync(path.join(d, 'js/games'), { recursive: true }); fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules\n'); return d; };
const TS = `import { b } from './b.js';
export interface Pet { name: string; legs?: number }
export function hello(p: Pet, times: number = 2): string {
  const seen = new Map<string, number>(); seen.set(p.name, times);
  return (p.name as string).repeat(times) + b + seen.get(p.name);
}
export type Kind = 'cat' | 'dog';
`;

test('build: a .ts becomes the .js beside it, every line where it was, and it runs', async () => {
  const d = game(); fs.writeFileSync(path.join(d, 'js/a.ts'), TS); fs.writeFileSync(path.join(d, 'js/b.js'), "export const b = '!';\n"); fs.writeFileSync(path.join(d, 'js/games/c.d.ts'), 'export {};\n');
  const r = run(d); assert.equal(r.code, 0, r.out);
  const js = fs.readFileSync(path.join(d, 'js/a.js'), 'utf8'), src = TS.split('\n'), out = js.split('\n');
  for (let i = 0; i < src.length - 1; i++) assert.equal(out[i].length, src[i].length, `line ${i + 1} moved`);
  assert.match(js, /made from a\.ts by tools\/build\.mts/); assert.doesNotMatch(js, /interface|: string|<string, number>/);
  assert.equal(fs.readFileSync(path.join(d, 'js/b.js'), 'utf8'), "export const b = '!';\n", 'a plain .js was changed');
  assert.ok(!fs.existsSync(path.join(d, 'js/games/c.js')), 'a .d.ts was built');
  const gi = fs.readFileSync(path.join(d, '.gitignore'), 'utf8'); assert.match(gi, /^node_modules\n# --- made by tools\/build\.mts[^\n]*\n\/js\/a\.js\n# --- end of tools\/build\.mts ---\n$/);
  const m = await import(pathToFileURL(path.join(d, 'js/a.js')).href); assert.equal(m.hello({ name: 'Mi' }), 'MiMi!2');
  assert.equal(run(d, '--check').code, 0); assert.equal(run(d).out.trim(), 'build: 1 TypeScript files, 0 made');
  fs.rmSync(d, { recursive: true, force: true });
});
test('build: --check finds a .js out of date, and a .ts that is gone takes its .js with it', () => {
  const d = game(); fs.writeFileSync(path.join(d, 'js/a.ts'), TS); fs.writeFileSync(path.join(d, 'js/b.js'), 'export const b = 1;\n'); run(d);
  fs.writeFileSync(path.join(d, 'js/a.ts'), TS.replace('times: number = 2', 'times: number = 3'));
  const c = run(d, '--check'); assert.equal(c.code, 1); assert.match(c.out, /js\/a\.js is missing or out of date/);
  fs.rmSync(path.join(d, 'js/a.ts')); assert.equal(run(d).code, 0);
  assert.ok(!fs.existsSync(path.join(d, 'js/a.js')), 'the .js of a removed .ts was left behind');
  assert.equal(fs.readFileSync(path.join(d, '.gitignore'), 'utf8'), 'node_modules\n');
  fs.rmSync(d, { recursive: true, force: true });
});
test('build: only type notes are allowed (no enum), and the error names the file', () => {
  const d = game(); fs.writeFileSync(path.join(d, 'js/e.ts'), 'export enum Colour { Red, Blue }\n');
  const r = run(d); assert.equal(r.code, 1); assert.match(r.out, /js\/e\.ts: only type notes are allowed/);
  assert.ok(!fs.existsSync(path.join(d, 'js/e.js')));
  fs.rmSync(d, { recursive: true, force: true });
});
test('build: a list written by tools/build.mjs (before the rename) is taken over, not kept twice', () => {
  const d = game(); fs.writeFileSync(path.join(d, 'js/a.ts'), TS); fs.writeFileSync(path.join(d, 'js/b.js'), "export const b = '!';\n");
  fs.writeFileSync(path.join(d, '.gitignore'), 'node_modules\n# --- made by tools/build.mjs from .ts files (never committed; do not edit by hand) ---\n/js/old.js\n# --- end of tools/build.mjs ---\n');
  assert.equal(run(d).code, 0);
  assert.match(fs.readFileSync(path.join(d, '.gitignore'), 'utf8'), /^node_modules\n# --- made by tools\/build\.mts[^\n]*\n\/js\/a\.js\n# --- end of tools\/build\.mts ---\n$/);
  fs.rmSync(d, { recursive: true, force: true });
});
