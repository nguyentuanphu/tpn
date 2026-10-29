// Server-safe public catalogue adapter. No imports of browser/game runtime code.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type CatalogueEntry = {
  id: string; kind: 'game' | 'story'; name: { en: string; vi: string }; area: string;
  ageMin?: number; difficulty?: number; online?: boolean; learn?: boolean;
  sourceCommit: string | null; sourceFile: string; sourceHash: string;
  guide: { href: string | null; kind: 'section' | 'activity'; verified: boolean; reviewedSource: string | null; sourceAligned: boolean | null };
  coverage: { bilingual: boolean; implementation: boolean; metadata: boolean; discovery: 'catalogued' | 'declared-only'; recordings: 'not-audited'; issues: string[] };
  unlock: { secondSet: boolean; featureId: string | null; finishesEach: number; prerequisites: string[] };
  requirements?: { familyQuestions: boolean };
};
export type Catalogue = {
  schemaVersion: 1; generatedFrom: { commit: string | null; dirty: boolean; dirtyPaths: string[]; sourceHash: string; build: string };
  website: { reviewedSource: string | null; sourceAligned: boolean | null; anchors: string[] };
  entries: CatalogueEntry[];
  coverage: { games: number; stories: number; declaredSecondSetMissingMetadata: string[]; limitations: string[] };
};
type RecordValue = Record<string, unknown>;
const obj = (v: unknown): RecordValue => v && typeof v === 'object' && !Array.isArray(v) ? v as RecordValue : {};
const str = (v: unknown, max = 300) => typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max) : '';
const list = (v: unknown, max = 2000): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max).map(x => str(x, 160)) : [];
const SHA = /^[a-f0-9]{40}$/, HASH = /^[a-f0-9]{64}$/, ID = /^[a-z0-9][a-z0-9_-]{0,59}$/;
const sha = (v: unknown) => typeof v === 'string' && SHA.test(v) ? v : null;
const tri = (v: unknown) => typeof v === 'boolean' ? v : null;
const integer = (v: unknown, lo: number, hi: number, fallback: number) => Number.isInteger(v) && Number(v) >= lo && Number(v) <= hi ? Number(v) : fallback;

export class CatalogueError extends Error {
  code: string;
  constructor(code: string) { super(code); this.name = 'CatalogueError'; this.code = code; }
}

/** Small Home response; source review only, never a playable/control percentage. */
export function summariseCatalogueEvidence(entries: Record<string, any>[]) {
  return { total: entries.length, games: entries.filter(e => e.kind === 'game').length,
    stories: entries.filter(e => e.kind === 'story').length, declaredOnly: entries.filter(e => e.coverage?.discovery === 'declared-only').length,
    review: entries.filter(e => e.coverage?.discovery === 'declared-only' || e.coverage?.bilingual !== true || e.coverage?.metadata !== true ||
      e.coverage?.implementation !== true || e.guide?.sourceAligned !== true).length };
}

/** Only documented public fields survive even if the file is edited by hand. */
export function parseManagementCatalogue(value: unknown): Catalogue {
  const root = obj(value), generated = obj(root.generatedFrom), website = obj(root.website), coverage = obj(root.coverage);
  if (root.schemaVersion !== 1 || !Array.isArray(root.entries) || root.entries.length > 2000) throw new CatalogueError('catalogue_invalid');
  const seen = new Set<string>();
  const entries = root.entries.map(input => {
    const x = obj(input), n = obj(x.name), g = obj(x.guide), c = obj(x.coverage), u = obj(x.unlock), req = obj(x.requirements);
    const id = str(x.id, 60), kind = x.kind;
    if (!ID.test(id) || !['game', 'story'].includes(String(kind)) || !str(n.en) || !str(n.vi) || seen.has(kind + ':' + id)) throw new CatalogueError('catalogue_entry_invalid');
    seen.add(kind + ':' + id);
    const href = typeof g.href === 'string' && /^\/home\/#[-a-z0-9_]+$/.test(g.href) ? g.href : null;
    const e: CatalogueEntry = { id, kind: kind as CatalogueEntry['kind'], name: { en: str(n.en), vi: str(n.vi) }, area: str(x.area, 60),
      sourceCommit: sha(x.sourceCommit), sourceFile: /^(js|home)\/[\w./-]+\.(?:ts|js)$/.test(str(x.sourceFile)) ? str(x.sourceFile) : '', sourceHash: HASH.test(str(x.sourceHash)) ? str(x.sourceHash) : '',
      guide: { href, kind: g.kind === 'activity' ? 'activity' : 'section', verified: !!href && g.verified === true, reviewedSource: sha(g.reviewedSource), sourceAligned: tri(g.sourceAligned) },
      coverage: { bilingual: c.bilingual === true, implementation: c.discovery !== 'declared-only' && c.implementation === true, metadata: c.discovery !== 'declared-only' && c.metadata === true, discovery: c.discovery === 'declared-only' ? 'declared-only' : 'catalogued', recordings: 'not-audited', issues: list(c.issues, 30) },
      unlock: { secondSet: u.secondSet === true, featureId: ID.test(str(u.featureId)) ? str(u.featureId) : null, finishesEach: integer(u.finishesEach, 0, 100, 0), prerequisites: list(u.prerequisites, 500).filter(x => ID.test(x)) } };
    if (kind === 'game') { e.ageMin = integer(x.ageMin, 2, 8, 5); e.difficulty = integer(x.difficulty, 1, 3, 2); e.online = x.online === true; e.learn = x.learn === true; }
    if (req.familyQuestions === true) e.requirements = { familyQuestions: true };
    return e;
  });
  return { schemaVersion: 1, generatedFrom: { commit: sha(generated.commit), dirty: generated.dirty === true, dirtyPaths: list(generated.dirtyPaths, 100).filter(x => /^(js|home|docs)\/[\w./-]+$/.test(x)), sourceHash: HASH.test(str(generated.sourceHash)) ? str(generated.sourceHash) : '', build: str(generated.build, 24) },
    website: { reviewedSource: sha(website.reviewedSource), sourceAligned: tri(website.sourceAligned), anchors: list(website.anchors, 500).filter(x => /^[-a-z0-9_]+$/.test(x)) }, entries,
    coverage: { games: entries.filter(e => e.kind === 'game').length, stories: entries.filter(e => e.kind === 'story').length, declaredSecondSetMissingMetadata: list(coverage.declaredSecondSetMissingMetadata, 500), limitations: list(coverage.limitations, 20) } };
}

export function loadManagementCatalogue(file = (() => {
  const deployed = path.resolve(process.cwd(), 'content/management-catalogue.json');
  return fs.existsSync(deployed) ? deployed : fileURLToPath(new URL('../../../content/management-catalogue.json', import.meta.url));
})()): Catalogue {
  try { return parseManagementCatalogue(JSON.parse(fs.readFileSync(file, 'utf8'))); }
  catch (e) { if (e instanceof CatalogueError) throw e; throw new CatalogueError('catalogue_unavailable'); }
}
export function findCatalogueEntry(catalogue: Catalogue, id: string, kind: 'game' | 'story' = 'game'): CatalogueEntry | null {
  return catalogue.entries.find(e => e.id === id && e.kind === kind) || null;
}

export type AvailabilityOptions = {
  live?: unknown; custom?: unknown; profiles?: unknown[]; peeks?: string[]; earlyDays?: number;
  deviceId?: string; now?: Date; confirmedOnDevice?: boolean;
};
type Gate = { id: string; state: 'open' | 'closed' | 'unknown'; reason: string; source: string };
/** Expected result only. This mirrors releaseOn/featureOn/keptOn precedence;
 * device cache, local clock and unsent profile progress remain unconfirmed. */
export function explainAvailability(entry: CatalogueEntry, options: AvailabilityOptions = {}) {
  const live = obj(options.live), custom = obj(options.custom), now = options.now || new Date();
  const profiles = (options.profiles || []).map(obj), peeks = options.peeks || [], early = Math.max(0, Math.min(30, options.earlyDays || 0));
  const gates: Gate[] = [{ id: 'item_availability', state: obj(custom.itemAvailability)[entry.kind+':'+entry.id] === false ? 'closed' : 'open', reason: obj(custom.itemAvailability)[entry.kind+':'+entry.id] === false ? 'explicit_item_off' : 'item_allows_other_gates', source: 'content.itemAvailability' }];
  const rule = (id: string) => {
    const l = obj(live.releases), c = obj(custom.releases);
    return id in l && l[id] && typeof l[id] === 'object' ? obj(l[id]) : id in c && c[id] && typeof c[id] === 'object' ? obj(c[id]) : null;
  };
  const release = (id: string, def = true) => {
    if (peeks.includes(id)) return { on: true, reason: 'tester_preview', source: 'tester' };
    const r = rule(id); if (!r) return { on: def, reason: 'default', source: 'catalogue' };
    if (r.on === false) return { on: false, reason: 'explicit_off', source: 'release' };
    const start = typeof r.start === 'string' ? new Date(r.start + 'T00:00:00') : null;
    const validStart = start && !Number.isNaN(+start) ? start : null;
    if (validStart && now < validStart) return { on: early > 0 && +now >= +validStart - early * 864e5, reason: early > 0 && +now >= +validStart - early * 864e5 ? 'tester_early' : 'scheduled_future', source: 'release' };
    if (validStart && Number(r.days) > 0 && +now >= +validStart + Number(r.days) * 864e5) return { on: false, reason: 'schedule_expired', source: 'release' };
    return { on: r.on === true ? true : def, reason: r.on === true ? 'explicit_on' : 'default', source: 'release' };
  };
  const feature = (id: string, def = true) => {
    if (id === 'wayfind') { const r = rule(id); return { ...release(id, false), on: !!r && r.controlVersion === 1 && r.on === true && release(id, false).on }; }
    if (rule(id)) return release(id, def);
    const f = obj(custom.features); return { on: typeof f[id] === 'boolean' ? f[id] as boolean : def, reason: typeof f[id] === 'boolean' ? 'defaults_override' : 'default', source: typeof f[id] === 'boolean' ? 'content' : 'catalogue' };
  };
  const retained = (id: string, def = true) => {
    const f = feature(id, def), tried = id !== 'wayfind' && profiles.some(p => !!obj(p.tried)[id]);
    const r = rule(id);
    if (id !== 'wayfind' && (r?.on === false || (!r && obj(custom.features)[id] === false)))
      return { on: false, reason: 'explicit_off', source: r ? 'release' : 'content' };
    return { ...f, on: f.on || tried, reason: !f.on && tried ? 'previously_tried_retained' : f.reason };
  };
  const push = (id: string, r: { on: boolean; reason: string; source: string }) => gates.push({ id, state: r.on ? 'open' : 'closed', reason: r.reason, source: r.source });
  if (entry.kind === 'game') {
    if (entry.coverage.discovery === 'declared-only') gates.push({ id: 'runtime_integration', state: 'closed', reason: 'declared_without_menu_loader_integration', source: entry.sourceFile });
    const activity = obj(obj(custom.activities)[entry.id]);
    gates.push({ id: 'simple_screen_visibility', state: activity.hide === true ? 'closed' : 'open', reason: activity.hide === true ? 'hidden_on_simple_screen' : 'listed_when_other_gates_open', source: 'content.activities' });
    if (entry.id.startsWith('rd_')) push('readingTrial', retained('readingTrial', true));
    if (['heodat', 'coinnote', 'needwant', 'cheaper', 'lixi', 'bahu', 'shoplist', 'waitgrow', 'shopkeep', 'barter'].includes(entry.id)) push('money_' + entry.id, retained('money_' + entry.id));
    if (entry.requirements?.familyQuestions) gates.push({ id: 'family_questions', state: Array.isArray(custom.quiz) && custom.quiz.length > 0 ? 'open' : 'unknown', reason: 'requires_current_validated_family_questions', source: 'private content' });
  }
  if (entry.unlock.secondSet) {
    const featureId = entry.kind === 'game' ? 'newGames' : 'newStories'; push(featureId, release(featureId, false));
    if (!profiles.length) gates.push({ id: 'unlock_progress', state: entry.unlock.prerequisites.length ? 'unknown' : 'open', reason: entry.unlock.prerequisites.length ? 'profile_progress_unavailable' : 'no_prerequisites', source: 'profile' });
    else {
      const unlocked = profiles.some(p => p.admin === true || p.unlockAll === true || feature('unlockAll', false).on || entry.unlock.prerequisites.every(id => {
        const count = entry.kind === 'game' ? obj(p.wins)[id] : obj(p.taleReads)[id] ?? (obj(p.tales)[id] ? 1 : 0);
        return Number(count || 0) >= entry.unlock.finishesEach;
      }));
      gates.push({ id: 'unlock_progress', state: unlocked ? 'open' : 'closed', reason: unlocked ? 'requirements_met' : 'finish_each_prerequisite', source: 'profile' });
    }
  }
  const targetRules = gates.map(g => rule(g.id)).filter((r): r is RecordValue => !!r && Array.isArray(r.devices) && r.devices.length > 0);
  const scopeKnown = targetRules.every(r => !options.deviceId || (r.devices as unknown[]).includes(options.deviceId));
  return { activityId: entry.id, kind: entry.kind, result: gates.some(g => g.state === 'closed') ? 'closed' : gates.some(g => g.state === 'unknown') ? 'unknown' : 'open',
    actualDeviceState: options.confirmedOnDevice ? 'reported_separately' : 'unconfirmed', gates,
    quality: ['expected-from-supplied-settings', 'server-local-clock-may-differ-from-device', ...(!scopeKnown ? ['targeted-rule-device-scope-requires-runtime-confirmation'] : [])] };
}
