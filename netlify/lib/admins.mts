// Studio admins (round O, owner: "let other admins in with their own account, without making more tokens"). The owner
// signs in with STUDIO_PASSWORD and adds people in Studio → Setup → 👥 Admins: a sign-in name, a password and what
// they may do. Everyone works through the website's own GitHub token, so nobody else needs one.
//   viewer   📊 Analytics only, and nothing can be changed
//   editor   every page and Publish, but not the admins list
//   owner    everything (the STUDIO_PASSWORD, or an admin the owner made an owner)
// Kept in Netlify Blobs (store "studio-admins"), a/<name> = { name, role, salt, hash, at, by }: the password itself is
// never kept, only a slow scrypt hash of it. A sign-in lasts 30 days; changing someone's password or removing them
// signs them out everywhere (their cookie carries part of the hash), and changing STUDIO_PASSWORD signs out everyone.
// (round R privacy, 9 Oct) Everyone, the owner too, signs in in two steps: the password, then the 6-digit code of an
// authenticator app (TOTP: HMAC-SHA1, 30 s, one step either side; node's crypto, no extra package). The first sign-in
// shows the secret to add to the app (a otpauth:// link and the letters), and is finished with the first code.
// (owner, 9 Oct) The owner chooses for each account, the owner's own too, two-step or the password only (Setup → Admins);
// two-step is the default. Changing it signs that person out.
// Passwords are 12 characters or more. A key for SparkleStudio.exe (k/<id>) lets the family computer reach the
// players report and the family photos without the two steps; only its hash is kept, and the owner can remove it.
import crypto from 'crypto';

export const ROLES = ['viewer', 'editor', 'owner', 'custom'];
// (owner, 14 Oct AEDT: "give them more granular access") what an account may do, one permission at a time. The roles
// are ready-made sets of them; "custom" is the owner's own choice, ticked one by one in Setup → Admins. Managing the
// admins, Security (exe keys, sign everyone out) and the Access log are never granted one by one: they come only with
// the owner role, so nobody can give themselves more than they were given.
export const PERMS = {
  analytics:  ['📊', 'See Analytics (what the children play, the missing lines)', 'Xem Phân tích (các con chơi gì, câu còn thiếu)'],
  devices:    ['🏷️', 'Give devices a name in Analytics', 'Đặt tên máy trong Phân tích'],
  testers:    ['🐞', 'See tester reports', 'Xem báo cáo người thử'],
  testerset:  ['✅', 'Mark tester problems fixed, being fixed or not a bug', 'Đánh dấu lỗi đã sửa, đang sửa hoặc không phải lỗi'],
  pages:      ['👀', 'Open the family and game pages (look only)', 'Mở các trang gia đình và trò chơi (chỉ xem)'],
  edit:       ['✏️', 'Change the family and game pages (waits for Publish)', 'Sửa các trang gia đình và trò chơi (chờ Phát hành)'],
  voices:     ['🎤', 'Make and record voices', 'Tạo và thu giọng'],
  releases:   ['🆕', 'Switch features and festivals on or off (live at once)', 'Bật tắt tính năng và lễ hội (có hiệu lực ngay)'],
  family:     ['🖼️', 'Family photos and the family code', 'Ảnh gia đình và mã gia đình'],
  familycode: ['🔢', 'Make a new family code', 'Tạo mã gia đình mới'],
  publish:    ['🚀', 'Publish to the children', 'Phát hành cho các con'],
  site:       ['🌐', 'Rebuild the website', 'Dựng lại trang web'],
  deploy:     ['⚠️', 'Put code live: merge pull requests, bring back an older version', 'Đưa mã lên: gộp yêu cầu, quay lại phiên bản cũ'],
  'management.read': ['📊', 'See management summaries and activity evidence', 'Xem tổng quan quản lý và dữ liệu hoạt động'],
  'management.deviceDetail': ['👧', 'See child names associated with their devices', 'Xem tên các con gắn với từng thiết bị'],
  'management.triage': ['🐞', 'Assign management issues and record follow-up', 'Phân công vấn đề và ghi việc tiếp theo'],
  'management.configure': ['🆕', 'Apply revisioned management configuration', 'Áp dụng cấu hình quản lý theo phiên bản'],
  'operations.read': ['🌐', 'See service and job readiness', 'Xem trạng thái dịch vụ và tác vụ'],
  'operations.run': ['✅', 'Run bounded management maintenance jobs', 'Chạy tác vụ bảo trì quản lý có giới hạn']
};
const ALL = Object.keys(PERMS);
// Explicit grants preserve existing editor access without inheriting future capabilities.
export const PRESETS = { viewer: ['analytics', 'testers'], editor: ['analytics', 'devices', 'testers', 'testerset', 'pages', 'edit', 'voices', 'releases', 'family', 'publish', 'site'], owner: ALL };
export const permsOf = a => !a ? [] : a.role === 'custom' ? (Array.isArray(a.perms) ? a.perms.filter(k => PERMS[k]) : []) : (PRESETS[a.role] || PRESETS.viewer).slice();
export const NAME = /^[a-z0-9][a-z0-9._@+-]{1,59}$/;
const key = name => 'a/' + name;
const hashOf = (pw, salt) => crypto.scryptSync(String(pw), salt, 32, { N: 16384, r: 8, p: 1 }).toString('base64url');
const secret = pw => crypto.createHash('sha256').update('sparkle-studio-admin:' + pw).digest();
// (round R privacy) the cookie also carries part of the two-step secret: setting up two-step again signs them out
const sigOf = (pw, a, exp) => crypto.createHmac('sha256', secret(pw)).update(`${a.name}|${exp}|${a.hash.slice(0, 16)}|${String(a.totp || '').slice(0, 8)}|${a.noTwoStep ? 'p' : ''}`).digest('base64url');
export const MIN_PW = 12;
export const same = (x, y) => typeof x === 'string' && typeof y === 'string' && x.length === y.length && crypto.timingSafeEqual(Buffer.from(x), Buffer.from(y));
export const cleanName = n => String(n || '').trim().toLowerCase();

export async function list(S) {
  const { blobs } = await S.list({ prefix: 'a/' }), out = [];
  for (const b of blobs.slice(0, 200)) { const a = await S.get(b.key, { type: 'json' }); if (a) out.push({ name: a.name, role: a.role, perms: permsOf(a), at: a.at, by: a.by || '', twoStep: !!a.totp, twoStepOn: !a.noTwoStep }); }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}
export async function get(S, name) { name = cleanName(name); return NAME.test(name) ? S.get(key(name), { type: 'json' }) : null; }
// add someone, or give them a new password and/or role
export async function put(S, { name, password, role, perms }: { name: string, password?: string, role: string, perms?: string[] }, by) {
  name = cleanName(name);
  if (!NAME.test(name)) return { error: 'A sign-in name has 2–60 letters, numbers or . _ @ + - (no spaces).' };
  if (!ROLES.includes(role)) role = 'viewer';
  const old = await get(S, name);
  if (perms === undefined && old) perms = old.perms;
  if (!old && !password) return { error: 'Choose a password for them.' };
  if (password && String(password).length < MIN_PW) return { error: `A password needs at least ${MIN_PW} characters.` };
  const a = old || { name, at: new Date().toISOString(), by };
  a.role = role;
  if (role === 'custom') a.perms = [...new Set((Array.isArray(perms) ? perms : []).filter(k => PERMS[k]))]; else delete a.perms;
  if (password) { a.salt = crypto.randomBytes(16).toString('base64url'); a.hash = hashOf(password, a.salt); }
  await S.setJSON(key(name), a);
  return { ok: true };
}
export async function remove(S, name) { name = cleanName(name); if (NAME.test(name)) await S.delete(key(name)); return { ok: true }; }
// signing in with a name and password: the account, or null
export async function check(S, name, password) {
  const a = await get(S, name); if (!a || typeof password !== 'string') return null;
  return same(hashOf(password, a.salt), a.hash) ? a : null;
}
// the cookie: "a.<name>.<expiry>.<signature>"
export const makeCookie = (pw, a, days = 30) => { const exp = Date.now() + days * 864e5; return `a.${a.name}.${exp}.${sigOf(pw, a, exp)}`; };
export async function fromCookie(S, pw, c) {
  const m = /^a\.([a-z0-9._@+-]{2,60})\.(\d{10,16})\.([\w-]{20,})$/.exec(String(c || '')); if (!m || !(+m[2] > Date.now())) return null;
  const a = await get(S, m[1]); if (!a) return null;
  return same(sigOf(pw, a, m[2]), m[3]) ? a : null;
}
// what an account may reach: me = { role, perms } (perms from permsOf); a bare role string still works (the presets)
// the permission an action needs: null = anyone signed in; 'owner' = only an owner. Anything not named here is a
// page of the dashboard: looking needs "pages", saving needs "edit"
export function needs(api, post) {
  if (api.startsWith('management/')) {
    const operation = api.split('?')[0];
    if (!post && (operation === 'management/children' || /^management\/devices\/[a-z0-9]{10,24}$/.test(operation))) return 'management.deviceDetail';
    if (!post && operation === 'management/operations') return 'operations.read';
    if (post && /^management\/attention\/[a-zA-Z0-9_-]{1,80}$/.test(operation)) return 'management.triage';
    if (post && ['management/config', 'management/config/project'].includes(operation)) return 'management.configure';
    if (post && operation === 'management/operations/run') return 'operations.run';
    if (!post && (/^management\/(overview|devices|activities|attention|config)$/.test(operation) || /^management\/(activities|releases|changes)\/[a-zA-Z0-9_.:-]{1,100}$/.test(operation))) return 'management.read';
    return '__unknown_management__';
  }
  if (['whoami', 'info', 'ping', 'admins/me'].includes(api)) return null;
  if (!post && api === 'content') return null; // (the dashboard opens with it)
  if (/^(admins|keys|security)\//.test(api) || api === 'log') return 'owner';
  if (['players', 'inbox', 'parent-analytics'].includes(api)) return post ? 'owner' : 'analytics';
  if (api === 'players/label') return 'devices';
  if (api === 'testers' || /^testers\/(problem|shot)\/[a-f0-9]{16}$/.test(api)) return post ? 'owner' : 'testers';
  if (api === 'testers/set') return 'testerset';
  if (api === 'live') return post ? 'releases' : 'pages';
  if (api === 'live/content') return post ? 'edit' : 'pages'; // (r81) the content pages, live at once
  if (api === 'family/code/new') return 'familycode';
  if (/^(family\/|familyphoto\/|albumphoto$)/.test(api)) return 'family';
  if (['github/merge', 'site/restore'].includes(api)) return post ? 'deploy' : 'pages';
  if (['github/publish', 'pending/discard'].includes(api)) return post ? 'publish' : 'pages';
  if (api === 'site/rebuild') return post ? 'site' : 'pages';
  if (api === 'bot/run') return post ? 'site' : 'pages';
  if (/^voices?(\/|$)/.test(api)) return post ? 'voices' : 'pages';
  return post ? 'edit' : 'pages';
}
export function allowed(me, api, post) {
  const role = typeof me === 'string' ? me : me && me.role;
  if (role === 'owner') return true;
  // (round R privacy) SparkleStudio.exe's key: the players report, the inbox, the family photos and (r81) the content
  // pages' live sections, nothing else
  if (role === 'exe') {
    if (api.startsWith('management/')) return !post && ['management.read', 'management.deviceDetail', 'operations.read'].includes(needs(api, false)) && Array.isArray(me?.perms) && me.perms.includes(needs(api, false));
    return post ? ['players/label', 'family/upload', 'family/remove', 'family/code/new', 'testers/set', 'live/content'].includes(api) : ['whoami', 'players', 'inbox', 'family/code', 'testers', 'live/content'].includes(api) || /^familyphoto\/[\w-]+$/.test(api) || /^testers\/(problem|shot)\/[a-f0-9]{16}$/.test(api);
  }
  const need = needs(api, post); if (need === null) return true; if (need === 'owner') return false;
  const perms = typeof me === 'string' ? PRESETS[me] || [] : Array.isArray(me && me.perms) ? me.perms : permsOf(me);
  return perms.includes(need);
}

// ---------- two-step sign-in (round R privacy, 9 Oct): TOTP, RFC 6238 ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const b32 = buf => { let v = 0, bits = 0, out = ''; for (const x of buf) { v = ((v << 8) | x) & 0xffffff; bits += 8; while (bits >= 5) { out += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } } if (bits) out += B32[(v << (5 - bits)) & 31]; return out; };
export const unb32 = s => { let v = 0, bits = 0; const out = []; for (const ch of String(s).toUpperCase().replace(/[^A-Z2-7]/g, '')) { v = ((v << 5) | B32.indexOf(ch)) & 0xffffff; bits += 5; if (bits >= 8) { out.push((v >>> (bits - 8)) & 255); bits -= 8; } } return Buffer.from(out); };
export const newSecret = () => b32(crypto.randomBytes(20));
export const STEP = 30e3;
export function totpAt(sec, step) { const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(step)); const h = crypto.createHmac('sha1', unb32(sec)).update(c).digest(), o = h[h.length - 1] & 15; return String((h.readUInt32BE(o) & 0x7fffffff) % 1e6).padStart(6, '0'); }
export const totpNow = (sec, now = Date.now()) => totpAt(sec, Math.floor(now / STEP));
// the step a code belongs to (now, or one step either side), or -1; every candidate is compared, in constant time
export function totpStep(sec, code, now = Date.now()) {
  code = String(code || '').replace(/\s/g, ''); if (!sec || !/^\d{6}$/.test(code)) return -1;
  const t = Math.floor(now / STEP); let hit = -1; for (const s of [t - 1, t, t + 1]) if (same(totpAt(sec, s), code)) hit = s; return hit;
}
export const otpauth = (name, sec) => `otpauth://totp/${encodeURIComponent('Sparkle Studio:' + name)}?secret=${sec}&issuer=${encodeURIComponent('Sparkle Studio')}&algorithm=SHA1&digits=6&period=30`;
// an admin's two-step: set (after the first code), used (a code is never taken twice), reset by the owner
export async function setTotp(S, name, sec, step) { const a = await get(S, name); if (!a) return false; a.totp = sec; a.totpLast = step; await S.setJSON(key(a.name), a); return true; }
export async function usedTotp(S, a, step) { a.totpLast = step; await S.setJSON(key(a.name), a); }
// (owner, 9 Oct) two-step on or off for one admin (off: the password only)
export async function setTwoStep(S, name, on) { const a = await get(S, name); if (!a) return false; if (on) delete a.noTwoStep; else a.noTwoStep = true; await S.setJSON(key(a.name), a); return true; }
export async function resetTotp(S, name) { const a = await get(S, name); if (!a) return false; delete a.totp; delete a.totpLast; await S.setJSON(key(a.name), a); return true; }

// ---------- keys for SparkleStudio.exe (round R privacy) ----------
// "svk.<id>.<secret>": shown once when made; kept as a hash, with the sign-out generation (Sign everyone out ends them)
const keyHash = s => crypto.createHash('sha256').update('sparkle-studio-key:' + s).digest('base64url');
export async function makeKey(S, label, by, gen, grants: string[] = []) {
  const id = crypto.randomBytes(5).toString('hex'), sec = crypto.randomBytes(24).toString('base64url');
  const perms = [...new Set((Array.isArray(grants) ? grants : []).filter(k => ['management.read', 'management.deviceDetail', 'operations.read'].includes(k)))];
  await S.setJSON('k/' + id, { id, label: String(label || 'SparkleStudio.exe').replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 40) || 'SparkleStudio.exe', hash: keyHash(sec), at: new Date().toISOString(), by, gen, perms });
  return `svk.${id}.${sec}`;
}
export async function listKeys(S) { const { blobs } = await S.list({ prefix: 'k/' }), out = []; for (const b of blobs.slice(0, 50)) { const k = await S.get(b.key, { type: 'json' }); if (k) out.push({ id: k.id, label: k.label, at: k.at, by: k.by, perms: Array.isArray(k.perms) ? k.perms : [] }); } return out; }
export async function removeKey(S, id) { if (/^[0-9a-f]{10}$/.test(id || '')) await S.delete('k/' + id); return { ok: true }; }
export async function fromKey(S, given, gen) {
  const m = /^svk\.([0-9a-f]{10})\.([\w-]{20,64})$/.exec(String(given || '').trim()); if (!m) return null;
  const k = await S.get('k/' + m[1], { type: 'json' }).catch(() => null); if (!k || (k.gen || 0) !== (gen || 0)) return null;
  return same(keyHash(m[2]), k.hash) ? k : null;
}
