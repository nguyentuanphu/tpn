// Tester reports → GitHub issues (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md §5), run every hour
// by .github/workflows/tester-issues.yml. It reads the problems tester devices found (the website, with a Studio key)
// and keeps one GitHub issue per problem:
//   - a new open problem gets an issue (labels `bug`, `tester`, the core it most likely belongs to, and `small` for a
//     clear code problem or `big` otherwise; an idea gets `idea` and no `bug`, so the bug robot leaves it to the owner);
//   - the issue's count line is kept up to date ("seen 7 times on 3 devices, r66, r67");
//   - a problem marked fixed (Studio, or a pull request that names it) closes its issue with the version;
//   - lines with no recording are left to the daily voices job (.github/workflows/voices-daily.yml), not filed;
//   - (owner, 17 Oct AEDT) only a problem seen on the version the website serves now, or the one before it, gets a new
//     issue: a device left on an old version cannot flood the list (r69 to r74 filed about 190 issues the newer game no
//     longer has); its reports stay in Studio, and an issue already made is kept up to date as before.
// Once a day (the run after 9 am AEDT) it also updates one issue "Tester daily summary" (label `tester-summary`).
//   STUDIO_KEY=… GITHUB_TOKEN=… GITHUB_REPOSITORY=owner/repo node tools/tester-issues.mts [--site https://…] [--dry]
import { buildRank, rankBefore } from '../netlify/lib/build-number.mts';
const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : ''; };
const SITE = (arg('--site') || process.env.SV_SITE || 'https://sparklevalley.au').replace(/\/$/, ''), KEY = process.env.STUDIO_KEY || '';
const GH = process.env.GITHUB_TOKEN || '', REPO = process.env.GITHUB_REPOSITORY || 'nguyentuanphu/tpn', DRY = process.argv.includes('--dry');

// (#472) report text such as "tap: Send @45,375" mentioned real GitHub accounts; a zero-width space after every @ keeps
// the text readable but never mentions anyone
export const noMention = (s: string) => s.replace(/@(?=[A-Za-z0-9])/g, '@​');
const site = async (p: string, body?: object) => { const r = await fetch(`${SITE}/studio/api/${p}`, body ? { method: 'POST', headers: { 'X-Studio-Key': KEY, 'X-Studio': '1', 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { headers: { 'X-Studio-Key': KEY } }); if (!r.ok) throw new Error(`website ${r.status} for ${p}`); return r.json(); };
const gh = async (p: string, method = 'GET', body?: { title?: string, body?: string, state?: string, [field: string]: unknown }) => {
  if (body) body = { ...body, ...(typeof body.title === 'string' ? { title: noMention(body.title) } : {}), ...(typeof body.body === 'string' ? { body: noMention(body.body) } : {}) };
  if (DRY && method !== 'GET') { console.log('[dry]', method, p, body && (body.title || body.state || '')); return { number: 0 }; }
  const r = await fetch(`https://api.github.com/repos/${REPO}/${p}`, { method, headers: { Authorization: `Bearer ${GH}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); if (!r.ok) throw new Error(`GitHub ${r.status} for ${p}`); return r.status === 204 ? {} : r.json(); };

// which core a problem most likely belongs to (the Front Desk's map, docs/cores/front-desk.md), from its files and place
export function coreOf(p, d) {
  const text = [p.title, p.where && p.where.game, p.where && p.where.window, ...((d && d.reports) || []).flatMap(r => r.errors || [])].join(' ');
  if (/studio/i.test(text)) return 'studio';
  if (/\b(net|netmsg|netgames|cloud|meet|knock)\.js|friend|room/i.test(text)) return 'online';
  if (/\b(voice|audio|music|songs?)\.js|recording|sound/i.test(text) || p.kind === 'sound') return 'voice-audio';
  if (/\bgames\/|\bgame\b|frame\.js|festiv|hoilang|tales?\.js/i.test(text) || (p.where && p.where.game)) return 'play';
  if (/\b(world|roads|regions|cities|town|homes|vendors|hawkers|places|solids|traffic|water)\.js|stuck|map\.js/i.test(text) || p.auto === 'stuck') return 'world';
  if (/players\.js|startup|slow|freeze/i.test(text) || ['slow', 'freeze'].includes(p.auto)) return 'analytics-infra';
  return 'kid-ui';
}
// the number of a build (netlify/lib/build-number.mts: 'r83' → 83, 'v1.01' → 1001; anything else → 0)
const num = (b: unknown) => Math.max(0, buildRank(b));
// a problem is recent when one of its builds is the live one or the one before it (no live build known: every problem is)
export const recentEnough = (builds: string[] | undefined, live: number) => !live || (builds || []).some(b => num(b) >= rankBefore(live));
// the build the website serves now (js/build.js), else the newest build any tester sent
async function liveBuild(problems: { builds?: string[] }[]) {
  try { const r = await fetch(`${SITE}/js/build.js`); const n = num((/BUILD = '([^']+)'/.exec(await r.text()) || [])[1]); if (r.ok && n) return n; } catch (e) { }
  return Math.max(0, ...problems.flatMap(p => (p.builds || []).map(num)));
}
const sizeOf = p => p.kind === 'auto' && ['error', 'noopen', 'noclose', 'offscreen'].includes(p.auto) ? 'small' : 'big';
const countLine = p => `Seen ${p.n} time${p.n === 1 ? '' : 's'} on ${p.devices} device${p.devices === 1 ? '' : 's'} (${(p.builds || []).join(', ') || 'version unknown'}); last ${new Date(p.lastAt).toISOString().slice(0, 16).replace('T', ' ')} UTC.`;
function bodyOf(p, d) {
  const r = (d && d.reports || []).slice(-1)[0] || {};
  return [`**Tester report** (${p.kind}${p.auto ? ': ' + p.auto : ''}) · problem \`${p.k}\``, '', `<!-- count -->${countLine(p)}<!-- /count -->`, '',
    `- Where: ${[p.where && p.where.game, p.where && p.where.window, p.where && p.where.area].filter(Boolean).join(' · ') || '?'} (${r.where ? `${r.where.x}, ${r.where.z}` : ''})`,
    r.note ? `- Tester's note${r.spoken ? ' (spoken)' : ''}: ${r.note}` : '', r.detail ? `- Detail: ${r.detail}` : '',
    r.dev ? `- Device: ${r.dev.os} ${r.dev.br} ${r.dev.sc}, ${r.dev.lang}, ${r.dev.fps || '?'} fps, build ${r.b}` : '',
    r.dev?.start ? `- This start: helper ${r.dev.start.sw} ms, start page ${r.dev.start.page} ms, page readable ${r.dev.start.dom} ms after the tap` : '',
    (r.errors || []).length ? '\n**Errors**\n```\n' + r.errors.slice(-10).join('\n') + '\n```' : '',
    (r.log || []).length ? '\n<details><summary>The last 30 seconds</summary>\n\n' + r.log.map(([t, k, s]) => `- ${t} s ${k}: ${s}`).join('\n') + '\n</details>' : '',
    '', 'Screenshots, every report and the status: Studio → Analytics → Tester reports. Mark it fixed there (or say "Fixed in rNN" in the round) and the testers\' devices replay it on the new version.'].filter(x => x !== '').join('\n');
}

// (r89, owner 23 Oct AEDT: "two-way sync") an issue Release or the owner closed on GitHub sets the problem's status in
// Studio too: closed as done with a comment "Fixed in rNN" → fixed in rNN (the testers' devices then replay it); closed as
// not planned → not a bug; closed as a duplicate → duplicate. The newest "Fixed in" or "came back" comment decides, so a problem that came back and was
// fixed again is fixed again. Nothing is set for an open issue, or one closed with no version named.
export function statusFromIssue(iss: { state?: string, state_reason?: string | null }, comments: { body?: string }[]): { status?: string, fixedIn?: string } | null {
  if (iss.state !== 'closed') return null;
  if (iss.state_reason === 'not_planned') return { status: 'notbug' };
  // (owner, 30 Oct 2026 AEDT) closed as a duplicate (the speed readings grouped under #36, repeats of one report) → duplicate
  if (iss.state_reason === 'duplicate') return { status: 'dup' };
  for (const c of [...comments].reverse()) {
    const b = String(c.body || ''); if (/came back on/i.test(b)) return null;
    const m = /\bfixed in (r\d{1,4}(?:\.\d{1,2})?|v\d{1,2}\.\d{2})(?!\d|\.\d)/i.exec(b); if (m) return { fixedIn: m[1].toLowerCase() };
  }
  return null;
}
async function main() {
  if (!KEY) { console.log('No STUDIO_KEY: nothing to do.'); return; }
  const { problems, summary } = await site('testers'); let made = 0, closed = 0, updated = 0, old = 0, synced = 0;
  const live = await liveBuild(problems);
  for (const p of problems) {
    if (p.auto === 'novoice' || p.status === 'dup' || p.status === 'notbug') continue;
    const open = ['new', 'fixing', 'back'].includes(p.status);
    if (!p.issue && open && !recentEnough(p.builds, live)) { old++; continue; }
    if (!p.issue && open) {
      const d = await site('testers/problem/' + p.k).catch(() => null), idea = p.kind === 'idea';
      const labels = idea ? ['idea', 'tester'] : ['bug', 'tester', coreOf(p, d), sizeOf(p)];
      const iss = await gh('issues', 'POST', { title: `[tester] ${p.title}`.slice(0, 120), body: bodyOf(p, d), labels });
      if (iss.number) await site('testers/set', { k: p.k, issue: iss.number }); made++;
    } else if (p.issue) {
      const iss = await gh('issues/' + p.issue).catch(() => null); if (!iss) continue;
      const nb = String(iss.body || '').replace(/<!-- count -->[\s\S]*?<!-- \/count -->/, `<!-- count -->${countLine(p)}<!-- /count -->`);
      if (nb !== iss.body) { await gh('issues/' + p.issue, 'PATCH', { body: nb }); updated++; }
      if (['fixed', 'confirmed'].includes(p.status) && iss.state === 'open') { await gh(`issues/${p.issue}/comments`, 'POST', { body: `Fixed in ${p.fixedIn || 'a new version'}${p.status === 'confirmed' ? ', and the tester devices checked it' : ''}.` }); await gh('issues/' + p.issue, 'PATCH', { state: 'closed', state_reason: 'completed' }); closed++; }
      if (open && iss.state === 'closed') {
        const set = statusFromIssue(iss, await gh(`issues/${p.issue}/comments?per_page=100`).catch(() => []));
        if (set) { await site('testers/set', { k: p.k, ...set }); synced++; continue; }
      }
      if (p.status === 'back' && iss.state === 'closed') { await gh(`issues/${p.issue}/comments`, 'POST', { body: `It came back on ${(p.builds || []).slice(-1)[0] || 'a newer version'}.` }); await gh('issues/' + p.issue, 'PATCH', { state: 'open' }); }
    }
  }
  // the daily summary, once a day after 9 am AEDT (22:00 UTC the day before)
  { // Refresh the issue body every run; old comments must not leave a stale zero-count summary on top.
    const text = `**Tester daily summary, ${summary.day}**\nUpdated: ${new Date().toLocaleString('en-AU', { timeZone:'Australia/Sydney', timeZoneName:'short' })}\n\n- New today: ${summary.new}\n- Fixed today: ${summary.fixed}\n- Still open: ${summary.open}\n\nMet by the most testers:\n${(summary.top || []).map(t => `- ${t.title} (${t.devices} devices, ${t.n} times)`).join('\n') || '- none'}`;
    const found = (await gh('issues?state=open&labels=tester-summary&per_page=1'))[0];
    if (found) await gh(`issues/${found.number}`, 'PATCH', { body: text }); else await gh('issues', 'POST', { title: 'Tester daily summary', body: text, labels: ['tester-summary'] });
  }
  console.log(`Issues: ${made} new, ${updated} counts updated, ${closed} closed, ${synced} statuses taken back to Studio; ${old} problems seen only before r${live - 1} not filed.`);
}
if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e.message); process.exit(1); });
