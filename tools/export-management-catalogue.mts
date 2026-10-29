// Public product facts for Studio management. Reads trusted versioned metadata only;
// never evaluates a content/custom.json or imports browser/game runtime modules.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

type Pair = { en: string; vi: string };
type MetaGame = { id: string; icon?: string; online?: boolean; learn?: boolean; origin?: string; name(): string };
type MetaStory = { id: string; flag: string; title(): string; pages: unknown[] };
type Facts = Record<string, [string, number, number]>;
type ShelfMap = Record<string, string[]>;
export type ManagementCatalogueEntry = {
  id: string; kind: 'game' | 'story'; name: Pair; area: string;
  ageMin?: number; difficulty?: number; online?: boolean; learn?: boolean;
  sourceCommit: string | null; sourceFile: string; sourceHash: string;
  guide: { href: string | null; kind: 'section' | 'activity'; verified: boolean; reviewedSource: string | null; sourceAligned: boolean | null };
  coverage: { bilingual: boolean; implementation: boolean; metadata: boolean; discovery: 'catalogued' | 'declared-only'; recordings: 'not-audited'; issues: string[] };
  unlock: { secondSet: boolean; featureId: string | null; finishesEach: number; prerequisites: string[] };
  requirements?: { familyQuestions: boolean };
};
export type ManagementCatalogue = {
  schemaVersion: 1; generatedFrom: { commit: string | null; dirty: boolean; dirtyPaths: string[]; sourceHash: string; build: string };
  website: { reviewedSource: string | null; sourceAligned: boolean | null; anchors: string[] };
  entries: ManagementCatalogueEntry[];
  coverage: { games: number; stories: number; declaredSecondSetMissingMetadata: string[]; limitations: string[] };
};

const ID = /^[a-z0-9][a-z0-9_-]{0,59}$/;
const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const Q = String.raw`(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")`;

// Matching bracket reader. It understands strings and comments so array literals
// can contain punctuation in titles without relying on a broad eval of a module.
export function literalOf(source: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:export\\s+)?const\\s+${escaped}\\b[^=]*=\\s*([\\[{])`).exec(source);
  if (!m) throw new Error(`Missing metadata declaration ${name}`);
  const start = m.index + m[0].length - 1;
  const stack: string[] = []; let quote = '', line = false, block = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i], next = source[i + 1];
    if (line) { if (c === '\n') line = false; continue; }
    if (block) { if (c === '*' && next === '/') { block = false; i++; } continue; }
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
    if (c === '/' && next === '/') { line = true; i++; continue; }
    if (c === '/' && next === '*') { block = true; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue; }
    if (c === '[' || c === '{' || c === '(') stack.push(c);
    if (c === ']' || c === '}' || c === ')') {
      const expect = c === ']' ? '[' : c === '}' ? '{' : '(';
      if (stack.pop() !== expect) throw new Error(`Unbalanced ${name}`);
      if (!stack.length) return source.slice(start, i + 1);
    }
  }
  throw new Error(`Unterminated ${name}`);
}

function cleanModule(source: string): string {
  // These particular metadata files have one-line imports and erasable type notes.
  const code = stripTypeScriptTypes(source, { mode: 'strip' });
  return code.replace(/^import[^\n]*;\s*$/gm, '').replace(/\bexport\s+(?=(const|function|async)\b)/g, '');
}
function evaluate<T>(source: string, values: Record<string, unknown>, expression: string): T {
  const context = vm.createContext({ ...values }, { codeGeneration: { strings: false, wasm: false } });
  return new vm.Script(`${source}\n;JSON.stringify(${expression});`).runInContext(context, { timeout: 1500 }) as T;
}
function jsonEval<T>(source: string, values: Record<string, unknown>, expression: string): T {
  const raw = evaluate<string>(source, values, expression);
  return JSON.parse(raw) as T;
}
function metadata(source: string, name: string): Record<string, unknown> {
  return jsonEval<Record<string, unknown>>('', {}, `(${literalOf(source, name)})`);
}
function text(value: unknown, max = 300): string {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : '';
}
function quoted(s: string): string { return jsonEval<string>('', {}, `(${s})`); }

/** Public catalogue extraction. Input is source text, not caller-supplied executable content. */
export function extractGameMetadata(catalogSource: string, activitiesSource: string, learningSource: string, readingSource: string): { games: { id: string; name: Pair; online: boolean; learn: boolean }[]; facts: Facts; loaders: Record<string, string[]> } {
  const catalog = literalOf(catalogSource, 'GAME_CATALOG'), loadersExpr = literalOf(catalogSource, 'GAME_LOADERS');
  // T's two passes cover both language labels. Currency-sensitive names use AUD,
  // the declared default; they are descriptions, not the child's current setting.
  const run = (language: 'en' | 'vi') => jsonEval<{ games: { id: string; name: string; online: boolean; learn: boolean }[]; facts: Facts; loaders: Record<string, string[]> }>(
    `const GAME_CATALOG=${catalog}; const GAME_LOADERS=${loadersExpr}; const GAME_INFO=${literalOf(activitiesSource, 'GAME_INFO')};\n` +
    cleanModule(learningSource) + '\n' + cleanModule(readingSource),
    { T: (en: unknown, vi: unknown) => language === 'vi' ? vi : en, home: () => 'AUD', curCode: () => 'AUD', customQuiz: () => [],
      HOWTO: {}, GAMES: {}, register: (_def: MetaGame) => undefined },
    `({games:GAME_CATALOG.map(d=>({id:d.id,name:d.name(),online:!!d.online,learn:!!d.learn})),facts:GAME_INFO,loaders:Object.fromEntries(Object.entries(GAME_LOADERS).map(([k,v])=>[k,v.ids]))})`
  );
  const en = run('en'), vi = run('vi');
  // Reading metadata is registered separately while its trial is available.
  const readingGames: { id: string; name: Pair; online: boolean; learn: boolean }[] = [];
  const pattern = new RegExp(`\\b(?:game2?|register)\\s*\\(\\s*\\{\\s*id\\s*:\\s*(${Q})[\\s\\S]*?name\\s*:\\s*\\(\\)\\s*=>\\s*T\\s*\\(\\s*(${Q})\\s*,\\s*(${Q})\\s*\\)`, 'g');
  for (const m of readingSource.matchAll(pattern)) readingGames.push({ id: quoted(m[1]), name: { en: quoted(m[2]), vi: quoted(m[3]) }, online: false, learn: true });
  const games = en.games.map((g, i) => {
    if (g.id !== vi.games[i]?.id) throw new Error('Language catalogue IDs differ');
    return { id: g.id, name: { en: g.name, vi: vi.games[i].name }, online: g.online, learn: g.learn };
  });
  return { games: [...games, ...readingGames], facts: en.facts, loaders: en.loaders };
}

export function extractStoryMetadata(learnSource: string, talesSource: string): { id: string; name: Pair; area: string; pages: number }[] {
  const initial = literalOf(learnSource, 'TALES');
  const more = literalOf(talesSource, 'MORE_TALES');
  const run = (language: 'en' | 'vi') => jsonEval<{ id: string; name: string; area: string; pages: number }[]>(
    `const tale=(id,flag,en,vi,pages)=>({id,flag,title:()=>T(en,vi),pages}); const TALES=${initial}; const MORE_TALES=${more};`,
    { T: (en: unknown, vi: unknown) => language === 'vi' ? vi : en, customTales: () => [] },
    `[...TALES,...MORE_TALES].map(t=>({id:t.id,name:t.title(),area:t.flag,pages:t.pages.length}))`
  );
  const en = run('en'), vi = run('vi');
  return en.map((s, i) => {
    if (s.id !== vi[i]?.id) throw new Error('Language story IDs differ');
    return { id: s.id, name: { en: s.name, vi: vi[i].name }, area: s.area, pages: s.pages };
  });
}

function git(root: string, args: string[]): string | null {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; }
}

export function exportManagementCatalogue(root = ROOT): ManagementCatalogue {
  const files = ['js/games/catalog.ts', 'js/content/activities.ts', 'js/games/learning-meta.ts', 'js/games/readingmenu.ts', 'js/learn.ts', 'js/talesdata.ts', 'js/content/secondset.ts', 'js/content/unlocks.ts', 'js/build.ts', 'home/index.html', 'docs/website-review-20261023/game-review-lock.json', 'js/games/drawing2.ts', 'js/games/crafts.ts', 'js/games/art-pad.ts', 'js/games/art-pending.ts', 'tools/export-management-catalogue.mts'];
  const sources = new Map(files.map(f => [f, fs.readFileSync(path.join(root, f), 'utf8')]));
  const src = (f: string) => sources.get(f) || '';
  const parsed = extractGameMetadata(src(files[0]), src(files[1]), src(files[2]), src(files[3]));
  const stories = extractStoryMetadata(src('js/learn.ts'), src('js/talesdata.ts'));
  const secondGames = metadata(src('js/content/secondset.ts'), 'SECOND_SET_GAMES') as ShelfMap;
  const secondStories = metadata(src('js/content/secondset.ts'), 'SECOND_SET_TALES') as ShelfMap;
  const firstStories = metadata(src('js/content/unlocks.ts'), 'FIRST_SET_TALES') as ShelfMap;
  const secondGameIDs = new Set(Object.values(secondGames).flat()), secondStoryIDs = new Set(Object.values(secondStories).flat());
  // The last commit touching these fact sources, not the latest documentation or
  // generated-export commit. This avoids a generate/commit/regenerate loop.
  const commit = git(root, ['log', '-1', '--format=%H', '--', ...files]);
  const dirtyPaths = (git(root, ['diff', '--name-only', 'HEAD', '--', ...files]) || '').split('\n').filter(Boolean).sort();
  const sourceHash = hash(files.map(f => f + '\0' + hash(src(f))).join('\n'));
  const validCommit = commit && /^[a-f0-9]{40}$/.test(commit) ? commit : null;
  const build = /\bBUILD\s*=\s*['"]([^'"]+)['"]/.exec(src('js/build.ts'))?.[1];
  if (!build) throw new Error('Game build is absent');
  let reviewedSource: string | null = null;
  try { const j = JSON.parse(src('docs/website-review-20261023/game-review-lock.json')); reviewedSource = /^[a-f0-9]{40}$/.test(j.source) ? j.source : null; } catch { throw new Error('Website review provenance is invalid'); }
  const aligned = validCommit && reviewedSource ? validCommit === reviewedSource && dirtyPaths.length === 0 : null;
  const anchors = [...new Set([...src('home/index.html').matchAll(/\bid=["']([a-z0-9_-]+)["']/gi)].map(m => m[1]))].sort();
  const guideFor = (kind: 'game' | 'story', id: string): ManagementCatalogueEntry['guide'] => {
    const preferred = kind === 'game' && anchors.includes('art-' + id) ? 'art-' + id : id === 'familyquiz' ? 'guide-familyquiz' : kind === 'game' ? 'games' : 'guides';
    const found = anchors.includes(preferred);
    return { href: found ? '/home/#' + preferred : null, kind: 'section', verified: found, reviewedSource, sourceAligned: aligned };
  };
  const firstGames: ShelfMap = {};
  for (const [id, info] of Object.entries(parsed.facts)) if (!secondGameIDs.has(id)) (firstGames[info[0]] ||= []).push(id);
  const loaderIds = new Set(Object.values(parsed.loaders).flat());
  const entries: ManagementCatalogueEntry[] = [];
  const seen = new Set<string>();
  for (const game of parsed.games) {
    if (!ID.test(game.id) || seen.has('game:' + game.id)) throw new Error('Invalid/duplicate game ID: ' + game.id);
    seen.add('game:' + game.id);
    const raw = parsed.facts[game.id], area = raw?.[0] || 'thinking';
    const isReading = game.id.startsWith('rd_');
    const file = isReading ? 'js/games/readingmenu.ts' : 'js/games/catalog.ts';
    const issues = [...(!raw ? ['default-activity-metadata'] : []), ...(!loaderIds.has(game.id) && !isReading ? ['missing-lazy-loader'] : [])];
    entries.push({ id: game.id, kind: 'game', name: { en: text(game.name.en), vi: text(game.name.vi) }, area, ageMin: raw?.[1] || 5, difficulty: raw?.[2] || 2,
      online: game.online, learn: game.learn, sourceCommit: dirtyPaths.length ? null : validCommit, sourceFile: file, sourceHash: hash(src(file)),
      guide: guideFor('game', game.id), coverage: { bilingual: !!game.name.en && !!game.name.vi, metadata: !!raw, implementation: loaderIds.has(game.id) || isReading, discovery: 'catalogued', recordings: 'not-audited', issues },
      unlock: { secondSet: secondGameIDs.has(game.id), featureId: secondGameIDs.has(game.id) ? 'newGames' : isReading ? 'readingTrial' : null, finishesEach: secondGameIDs.has(game.id) ? 3 : 0, prerequisites: secondGameIDs.has(game.id) ? [...(firstGames[area] || [])].sort() : [] },
      ...(game.id === 'familyquiz' ? { requirements: { familyQuestions: true } } : {}) });
  }
  for (const story of stories) {
    if (!ID.test(story.id) || seen.has('story:' + story.id)) throw new Error('Invalid/duplicate story ID: ' + story.id);
    seen.add('story:' + story.id);
    const file = story.id === 'banhchung' || story.id === 'sontinh' || story.id === 'tiddalik' || story.id === 'change' || story.id === 'monkey' ? 'js/learn.ts' : 'js/talesdata.ts';
    entries.push({ id: story.id, kind: 'story', name: { en: text(story.name.en), vi: text(story.name.vi) }, area: story.area,
      sourceCommit: dirtyPaths.length ? null : validCommit, sourceFile: file, sourceHash: hash(src(file)), guide: guideFor('story', story.id),
      coverage: { bilingual: !!story.name.en && !!story.name.vi, metadata: true, implementation: story.pages > 0, discovery: 'catalogued', recordings: 'not-audited', issues: [] },
      unlock: { secondSet: secondStoryIDs.has(story.id), featureId: secondStoryIDs.has(story.id) ? 'newStories' : null, finishesEach: secondStoryIDs.has(story.id) ? 3 : 0, prerequisites: secondStoryIDs.has(story.id) ? [...(firstStories[story.area] || [])] : [] } });
  }
  // Keep intended-but-unintegrated IDs visible to management without adding them
  // to GAME_CATALOG, GAME_LOADERS or the player menu. A registration literal is
  // source evidence only; it never sets implementation/playability true.
  const registrations = new Map<string, { name: Pair; file: string }>();
  const registrationPattern = new RegExp(`\\{\\s*id\\s*:\\s*(${Q})\\s*,\\s*icon\\s*:\\s*${Q}\\s*,\\s*name\\s*:\\s*\\(\\)\\s*=>\\s*T\\s*\\(\\s*(${Q})\\s*,\\s*(${Q})\\s*\\)`, 'g');
  for (const file of ['js/games/drawing2.ts', 'js/games/crafts.ts', 'js/games/art-pending.ts']) {
    for (const m of src(file).matchAll(registrationPattern)) {
      const id = quoted(m[1]);
      if (registrations.has(id)) throw new Error('Duplicate declared registration: ' + id);
      registrations.set(id, { name: { en: text(quoted(m[2])), vi: text(quoted(m[3])) }, file });
    }
  }
  const missing = [...secondGameIDs].filter(id => !seen.has('game:' + id)).map(id => 'game:' + id).concat([...secondStoryIDs].filter(id => !seen.has('story:' + id)).map(id => 'story:' + id)).sort();
  for (const key of missing) {
    const [kind, id] = key.split(':');
    if (kind !== 'game') continue; // No invented story content or pages.
    if (!ID.test(id)) throw new Error('Invalid declared game ID: ' + id);
    const found = registrations.get(id), area = Object.entries(secondGames).find(([, ids]) => ids.includes(id))?.[0] || 'unknown';
    const file = found?.file || 'js/content/secondset.ts';
    entries.push({ id, kind: 'game', name: found?.name || { en: id, vi: id }, area,
      sourceCommit: dirtyPaths.length ? null : validCommit, sourceFile: file, sourceHash: hash(src(file)),
      guide: { href: null, kind: 'section', verified: false, reviewedSource, sourceAligned: false },
      coverage: { bilingual: !!found, metadata: false, implementation: false, discovery: 'declared-only', recordings: 'not-audited',
        issues: ['declared-without-menu-integration', 'missing-lazy-loader', ...(found ? ['registration-not-runtime-verification'] : ['registration-not-found'])] },
      unlock: { secondSet: true, featureId: 'newGames', finishesEach: 3, prerequisites: [...(firstGames[area] || [])].sort() } });
  }
  for (const entry of entries) if (!entry.name.en || !entry.name.vi) throw new Error('Missing name/ID: ' + entry.kind + ':' + entry.id);
  entries.sort((a, b) => (a.kind + ':' + a.id).localeCompare(b.kind + ':' + b.id));
  return { schemaVersion: 1, generatedFrom: { commit: validCommit, dirty: dirtyPaths.length > 0, dirtyPaths, sourceHash, build }, website: { reviewedSource, sourceAligned: aligned, anchors }, entries,
    coverage: { games: entries.filter(e => e.kind === 'game').length, stories: stories.length, declaredSecondSetMissingMetadata: missing,
      limitations: ['Private family-authored content is excluded.', 'Website links are verified section anchors, not invented activity routes.', 'Recording playback coverage and runtime outcome are not audited by this static export.', 'Declared second-set IDs missing runtime metadata are coverage gaps, not playable catalogue entries.'] } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = path.join(ROOT, 'content/management-catalogue.json');
  const next = JSON.stringify(exportManagementCatalogue(), null, 2) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== next) { console.error('Management catalogue is stale: node tools/export-management-catalogue.mts'); process.exitCode = 1; }
    else console.log('Management catalogue is current.');
  } else { fs.writeFileSync(file, next); console.log('Management catalogue exported to content/management-catalogue.json'); }
}
