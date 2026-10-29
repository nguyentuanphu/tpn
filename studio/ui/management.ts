import { mountFinance } from './finance.js';
import { mountItemWorkspace } from './item-workspace.js';
import { deskChart } from './desk-charts.js';
// Private Studio management views. The game and public website never import this module.
// Both Studio modes inject their existing authenticated API and EN/VI translator.
export type ManagementKind = 'overview' | 'devices' | 'device' | 'children' | 'activities' | 'activity' | 'attention' | 'release' | 'operations' | 'changes' | 'finance';
export type ManagementQuery = Record<string, string>;
export type ManagementOptions = {
  api(path: string, body?: unknown): Promise<unknown>;
  T(en: string, vi: string): string;
  kind?: ManagementKind;
  id?: string;
  query?: ManagementQuery;
  build?: string;
  online?: boolean;
  can?(permission: string): boolean;
  area?: string;
  go?(kind: ManagementKind, id?: string, query?: ManagementQuery): void;
  navigate?(kind: ManagementKind, id?: string, query?: ManagementQuery): void;
};
type Row = Record<string, unknown>;
const object = (v: unknown): Row => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Row : {};
const rows = (v: unknown): Row[] => Array.isArray(v) ? v.map(object) : [];
const text = (v: unknown, fallback = ''): string => typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
const finite = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const esc = (v: unknown): string => text(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
const validKind = (v: string): v is ManagementKind => ['overview', 'devices', 'device', 'children', 'activities', 'activity', 'attention', 'release', 'operations', 'changes','finance'].includes(v);
const sequence = new WeakMap<HTMLElement, number>();
const CSS_ID = 'studio-management-style';

function style() {
  if (document.getElementById(CSS_ID)) return;
  const link = document.createElement('link'); link.id = CSS_ID; link.rel = 'stylesheet';
  link.href = new URL('./management.css', import.meta.url).href; document.head.appendChild(link);
}
function dateLabel(value: unknown, T: ManagementOptions['T']): string {
  const raw = text(value); if (!raw) return T('Not reported', 'Chưa báo cáo');
  const date = new Date(raw); if (!Number.isFinite(date.getTime())) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return date.toLocaleDateString(T('en-AU','vi-VN'), { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }) + T(' (device date)',' (ngày theo máy)');
  const zone = /GMT\+11|AEDT/.test(date.toLocaleString('en-AU', { timeZone: 'Australia/Sydney', timeZoneName: 'short' })) ? 'AEDT' : 'AEST';
  return date.toLocaleString(T('en-AU', 'vi-VN'), { timeZone: 'Australia/Sydney', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' ' + zone;
}
function numberLabel(value: unknown, T: ManagementOptions['T']): string {
  const n = finite(value); return n === null ? T('Unavailable', 'Chưa có số liệu') : new Intl.NumberFormat(T('en-AU', 'vi-VN'), { maximumFractionDigits: 2 }).format(n);
}
function pair(value: unknown, T: ManagementOptions['T']): string {
  if (Array.isArray(value)) return T(text(value[0]), text(value[1], text(value[0])));
  const p = object(value); return T(text(p.en, text(value)), text(p.vi, text(p.en, text(value))));
}
function children(device: Row): Row[] {
  const value = device.children ?? device.kids ?? device.profiles;
  return Array.isArray(value) ? rows(value) : Object.values(object(value)).map(object);
}
function childNames(device: Row): string[] {
  return [...new Set(children(device).map(c => text(c.name ?? c.n)).filter(Boolean))];
}
const deviceID = (d: Row) => text(d.id ?? d.deviceId);
const itemID = (d: Row) => text(d.id ?? d.activityId ?? d.gameId);
function queryString(query: ManagementQuery): string {
  const values = Object.entries(query).filter(([, v]) => v !== '');
  return values.length ? '?' + new URLSearchParams(values).toString() : '';
}
function statusLabel(status: unknown, T: ManagementOptions['T']): string {
  const key = text(status);
  const labels: Record<string, [string, string]> = {
    not_configured: ['Not connected', 'Chưa kết nối'], configured_unverified: ['Access not checked yet', 'Chưa kiểm tra quyền truy cập'], ready: ['Access verified', 'Đã xác minh truy cập'], degraded: ['Needs attention', 'Cần xem xét'], observed: ['Observed', 'Đã ghi nhận'], estimated: ['Estimated', 'Ước tính'], unavailable: ['Unavailable', 'Chưa có số liệu'],
    insufficient: ['Not enough samples', 'Chưa đủ mẫu'], stale: ['Reporting is stale', 'Báo cáo đã cũ'], unknown: ['Unconfirmed', 'Chưa xác nhận'],
    investigating: ['Investigating', 'Đang điều tra'], reproduced: ['Reproduced', 'Đã tái hiện'], fixed_in_code: ['Fixed in code', 'Đã sửa trong mã'], deployed: ['Deployed', 'Đã triển khai'], verified: ['Verified', 'Đã xác minh'], reopened: ['Reopened', 'Mở lại'], dismissed: ['Dismissed', 'Đã bỏ qua'], duplicate: ['Duplicate', 'Trùng lặp'], new: ['New report', 'Báo cáo mới'], fixing: ['Being fixed', 'Đang sửa'], fixed: ['Fixed in code', 'Đã sửa trong mã'], confirmed: ['Verified', 'Đã xác minh'],
    back: ['Reopened', 'Lỗi xuất hiện lại'], notbug: ['Not a bug', 'Không phải lỗi'], dup: ['Duplicate', 'Trùng lặp'],
    queued: ['Queued', 'Đang chờ'], running: ['Running', 'Đang chạy'], succeeded: ['Succeeded', 'Thành công'], cancelled: ['Cancelled', 'Đã hủy'], partial: ['Partial evidence', 'Bằng chứng một phần'],
    pending: ['Pending', 'Đang chờ'], passed: ['Passed', 'Đạt'], failed: ['Failed', 'Không đạt'], skipped: ['Skipped', 'Bỏ qua'],
    available: ['Available online', 'Đã có trên mạng'], applied: ['Applied by device', 'Máy đã áp dụng'], rejected: ['Rejected', 'Bị từ chối'],
    draft: ['Private draft','Bản nháp riêng tư'], reviewed: ['Reviewed','Đã xem xét'], published: ['Published','Đã xuất bản'],
    unsupported: ['Unsupported', 'Chưa hỗ trợ'], configured: ['Configured', 'Đã cấu hình']
  };
  const label = labels[key]; return label ? T(...label) : key || T('Unconfirmed', 'Chưa xác nhận');
}
function badge(value: unknown, T: ManagementOptions['T']): string {
  const s = text(value, 'unknown'); return `<span class="mg-badge ${['failed','rejected','back'].includes(s) ? 'mg-bad' : ['unavailable','insufficient','unknown','stale','pending','unsupported','not_configured','configured_unverified'].includes(s) ? 'mg-watch' : ''}">${esc(statusLabel(s, T))}</span>`;
}
function metric(row: Row, T: ManagementOptions['T']): string {
  const unavailable = row.status === 'unavailable' || row.status === 'insufficient';
  const labels:Record<string,[string,string]>={
    M01:['Reporting active installations','Bản cài đặt hoạt động có báo cáo'],M02:['New observed installations','Bản cài đặt mới ghi nhận'],M03:['Reporting online now','Máy đang có báo cáo trực tuyến'],
    M04:['Reported play time','Thời gian chơi báo cáo'],M05:['Completion participation ratio','Tỷ lệ hoàn thành theo lượt tham gia'],M06:['Early-exit participation ratio','Tỷ lệ rời sớm theo lượt tham gia'],M07:['Stories opened','Truyện đã mở'],
    M08:['Sampled frame rate','Tốc độ khung hình lấy mẫu'],M09:['Low frame-rate samples','Mẫu tốc độ khung hình thấp'],M10:['Startup median','Trung vị thời gian khởi động'],M11:['Active drawing frame rate','Khung hình lúc hoạt động'],M12:['Battery loss per measured hour','Pin tiêu hao mỗi giờ được đo'],
    M13:['Website page views','Lượt xem trang web'],M14:['Website Play clicks','Lượt bấm Chơi trên trang web'],M15:['Website reading time','Thời gian đọc trang web'],M16:['Affected reporting devices','Máy có báo cáo bị ảnh hưởng'],
    M17:['Confirmed open regressions','Lỗi tái phát đã xác nhận còn mở'],M18:['Observed day-7 return','Máy quay lại ngày thứ 7'],M19:['Attempt completion','Hoàn thành từng lượt'],M20:['Reportable boot-phase readiness','Sẵn sàng trong giai đoạn khởi động có báo cáo'],
    M21:['First playable time p95','Thời gian sẵn sàng chơi p95'],M22:['Reported guest-join success','Tham gia phòng thành công có báo cáo'],M23:['Recorded voice success','Phát giọng thu thành công'],M24:['Applied configuration coverage','Tỷ lệ máy đã áp dụng cấu hình'],
    M25:['Verified recovery time','Thời gian khắc phục đã xác minh'],M26:['Recording coverage','Độ đầy đủ bản thu'],M27:['Website review coverage','Độ bao phủ duyệt trang web'],M34:['Quota headroom','Hạn mức còn lại'],M35:['Job success','Tác vụ thành công'],M36:['Delivery delay','Độ trễ nhận cấu hình'],M37:['Estimated days to quota','Số ngày ước tính tới hạn mức'],M38:['Reporting devices with errors','Máy có báo cáo lỗi']
  };
  const id=text(row.id), title=labels[id]?T(...labels[id]):pair(row.label??row.name,T)||id;
  const viLimits:Record<string,string>={
    M01:'Chỉ tính bản cài đặt có báo cáo, không phải số trẻ duy nhất. Máy ngoại tuyến có thể gửi sau.',M02:'Đây là bản cài đặt mới được ghi nhận. Xóa bộ nhớ máy có thể tạo mã mới.',M03:'Trạng thái hiện diện chỉ gần đúng; không có báo cáo mới nghĩa là chưa xác nhận hoặc ngoại tuyến.',
    M04:'Thời gian được tính từ các điểm đo chơi hiện có, không phải toàn bộ thời gian mở màn hình.',M05:'Đếm lượt tham gia của hồ sơ, không phải từng lượt chơi duy nhất; hai bé cùng chơi tạo hai lượt tham gia.',M06:'Rời sớm không tự chứng minh trò chơi quá khó hoặc bé không thích.',M07:'Số lần mở truyện không phải số lần đọc hết.',
    M08:'Trung bình có trọng số theo số mẫu. Không lấy trung bình đơn giản của các trung bình thiết bị.',M09:'Mẫu hiện có dùng ngưỡng dưới 20 khung hình mỗi giây.',M10:'Dữ liệu khởi động là số mẫu giới hạn, không phải p95 của mọi lần mở.',M11:'Chỉ tính khung hình hoạt động được đo, không tính thời gian đứng yên hay chưa đo.',M12:'Nhiều trình duyệt Safari không cung cấp pin. Thiếu thời gian đo phải hiện chưa có số liệu.',
    M13:'Đây là lượt xem được gửi về, không phải số người hay số phiên truy cập duy nhất.',M14:'Lượt bấm Chơi không chứng minh game đã mở thành công.',M15:'Thời gian đọc chỉ được ghi nhận theo khả năng gửi; không tạo hồ sơ theo từng khách.',M16:'Chỉ biết các máy có báo cáo; chưa thể biết mọi máy bị ảnh hưởng.',
    M18:'Cần nhóm bản cài đặt đã đủ thời gian và sự kiện chính xác; không gộp thành danh tính trẻ trên nhiều máy.',M19:'Cần mã từng lượt chơi và kết quả cuối, không cộng vào số đếm cũ.',M20:'Không thể đo lỗi xảy ra trước khi mã báo cáo chạy hoặc gửi được dữ liệu.',M21:'Chỉ so mẫu cùng cách đo, phiên bản và loại máy; luôn hiện số mẫu.',M22:'Phân biệt kết nối trực tiếp, qua chuyển tiếp và thử nghiệm tự động.',M23:'Cần kết quả phát âm thanh thực tế; hộp thư câu còn thiếu không phải mẫu số.',M24:'Máy ngoại tuyến chưa xác nhận không được tính là đã áp dụng.',M25:'Phân biệt đã sửa trong mã, đã triển khai và đã xác minh.',M26:'Phạm vi bao phủ phải nêu rõ danh mục bản thu yêu cầu.',M27:'Khóa nguồn đã duyệt không tự chứng minh câu giải thích luôn đúng.',M35:'Đã gửi lệnh chạy khác với tác vụ đã hoàn thành.',M36:'Đồng hồ máy có thể sai; cần kiểm tra bằng thời gian máy chủ nhận.',M38:'Không phải tỷ lệ phiên không bị sập; chỉ là máy có báo cáo lỗi trong phạm vi đo.'
  };
  const limitation=row.limitation?T(pair(row.limitation,T),viLimits[id]||T('See the source measurement definition.','Xem định nghĩa số đo từ nguồn.')):'';
  const units:Record<string,[string,string]>={installations:['installations','bản cài đặt'],minutes:['minutes','phút'],seconds:['seconds','giây'],milliseconds:['milliseconds','mili giây'],events:['events','sự kiện'],clicks:['clicks','lượt bấm'],opens:['opens','lượt mở'],ratio:['ratio','tỷ lệ'],count:['count','số lượng'],FPS:['FPS','khung/giây']};
  const unit=text(row.unit);
  return `<article class="card mg-metric"><h3>${esc(title)}</h3><strong class="mg-value">${esc(unavailable ? T('Unavailable', 'Chưa có số liệu') : numberLabel(row.value, T))}</strong> <span>${esc(units[unit]?T(...units[unit]):unit)}</span><p>${badge(row.status ?? 'observed', T)}</p>${row.sampleCount !== undefined ? `<p class="note">${esc(T('Samples', 'Số mẫu'))}: ${esc(numberLabel(row.sampleCount, T))}</p>` : ''}${limitation ? `<details><summary>${esc(T('Measurement definition','Định nghĩa số đo'))}</summary><p class="note">${esc(limitation)}</p></details>` : ''}</article>`;
}
function empty(T: ManagementOptions['T'], en = 'No reporting data matches these filters.', vi = 'Chưa có báo cáo phù hợp với bộ lọc này.'): string {
  return `<div class="card mg-empty"><p>${esc(T(en, vi))}</p><p class="note">${esc(T('No report is different from a measured zero. Offline devices may report later.', 'Chưa có báo cáo khác với số đo bằng không. Máy ngoại tuyến có thể gửi sau.'))}</p></div>`;
}
function provenance(data: Row, T: ManagementOptions['T']): string {
  const period = object(data.period), scope = object(data.scope);
  const flags = Array.isArray(data.quality) ? data.quality.map(x => text(x)).filter(Boolean) : [];
  const knownFlags: Record<string, [string,string]> = {
    'reporting-devices-only': ['Reporting devices only', 'Chỉ các máy có báo cáo'],
    'legacy-local-day': ['Original device-local dates', 'Ngày gốc theo máy'],
    'legacy-device-day': ['Original device-local dates', 'Ngày gốc theo máy'],
    'late-arrivals-possible': ['Offline reports can arrive later', 'Báo cáo ngoại tuyến có thể tới sau'],
    'no-exact-attempt-events': ['Exact attempt measurements not available', 'Chưa có số đo từng lượt chính xác'],
    'no-game-attribution': ['Website clicks are separate from game starts', 'Lượt bấm trang web khác với lượt bắt đầu game']
  };
  return `<div class="card mg-provenance"><h3>${esc(T('Where these numbers come from', 'Nguồn của các số liệu'))}</h3><dl class="mg-facts"><div><dt>${esc(T('Period', 'Khoảng ngày'))}</dt><dd>${esc(text(period.from, '—'))} – ${esc(text(period.to, '—'))}</dd></div><div><dt>${esc(T('Date basis', 'Cách tính ngày'))}</dt><dd>${esc(period.basis==='legacy-device-day'?T('Original device-local dates','Ngày gốc theo thiết bị'):text(period.basis, T('Source dates retained', 'Giữ ngày từ nguồn')))}</dd></div><div><dt>${esc(T('Source updated', 'Nguồn cập nhật'))}</dt><dd>${esc(dateLabel(data.sourceAsOf, T))}</dd></div><div><dt>${esc(T('Build / traffic', 'Phiên bản / loại báo cáo'))}</dt><dd>${esc(scope.build==='all'?T('All builds','Mọi phiên bản'):text(scope.build, T('All builds', 'Mọi phiên bản')))} · ${esc(trafficLabel(text(scope.traffic, 'ordinary'),T))}</dd></div></dl>${flags.length ? `<details><summary>${esc(T('Measurement limits', 'Giới hạn số đo'))}</summary><ul>${flags.map(f => `<li>${esc(knownFlags[f] ? T(...knownFlags[f]) : f)}</li>`).join('')}</ul></details>` : ''}</div>`;
}
function trafficLabel(value: string,T: ManagementOptions['T']):string {
  return value === 'synthetic_bot' ? T('Synthetic bots', 'Máy tự động thử nghiệm') : value === 'authorised_test' ? T('Authorised testing', 'Thử nghiệm được phép') : T('Ordinary reporting', 'Báo cáo thông thường');
}

/** Renders one private management view. Navigation stays inside the current Studio page by default. */
export async function renderManagement(P: HTMLElement, options: ManagementOptions): Promise<void> {
  style();
  const T = options.T, kind = options.kind || 'overview', id = options.id || '';
  const q: ManagementQuery = { days: '30', traffic: 'ordinary', ...(options.query || {}) };
  const profileContext = options.can?.('management.deviceDetail') === true;
  const token = (sequence.get(P) || 0) + 1; sequence.set(P, token);
  const outerRender = P.dataset.render;
  const current = () => sequence.get(P) === token && P.dataset.render === outerRender;
  const navigate = (next: ManagementKind, nextId = '', query: ManagementQuery = q) => {
    const scoped = { ...query };
    if (next !== kind) {
      delete scoped.cursor;
      if (!['devices','children'].includes(next)) { delete scoped.search; delete scoped.child; }
      if (!['devices','children','device'].includes(next)) delete scoped.deviceClass;
    }
    if (options.navigate) options.navigate(next, nextId, scoped);
    else if (options.go) options.go(next, nextId, scoped);
    else void renderManagement(P, { ...options, kind: next, id: nextId, query: scoped });
  };
  const labels: Record<ManagementKind,[string,string]> = {
    overview:['Management overview','Tổng quan quản lý'], devices:['Devices and children','Thiết bị và các con'], device:['Device details','Chi tiết thiết bị'], children:['Children and their devices','Các con và máy của mình'],
    activities:['Activity catalogue','Danh mục hoạt động'], activity:['Activity details','Chi tiết hoạt động'], attention:['Needs attention','Cần xem xét'],
    release:['Release evidence','Bằng chứng phát hành'], operations:['Operations','Vận hành'], changes:['Configuration changes','Thay đổi cấu hình'],finance:['Finance','Tài chính']
  };
  let navigation: ManagementKind[] = ['overview','devices','activities','attention','release','changes'];
  if(options.can?.('finance.read')) navigation.push('finance');
  if(options.can?.('operations.read')) navigation.push('operations');
  if(profileContext)navigation.splice(2,0,'children');
  if(options.area){const areas:Record<string,ManagementKind[]>={people:['devices','children'],game:['activities'],work:['attention','release','changes','operations','overview'],money:['finance']};navigation=navigation.filter(k=>(areas[options.area!]||[]).includes(k)&&options.can?.(k==='children'?'management.deviceDetail':k==='operations'?'operations.read':k==='finance'?'finance.read':'management.read'));}
  P.innerHTML = `<div class="mg-root"><h2>${esc(T(...labels[kind]))}</h2><p class="sub">${esc(kind==='activity'||kind==='activities'?T('Inspect source facts, integration status and reported use. Opening a record does not enable a game.','Xem nguồn, trạng thái tích hợp và lượt dùng có báo cáo. Mở hồ sơ không bật game.'):T('Private management information for authorised Studio accounts. Child names stay associated with their reporting device.', 'Thông tin quản lý riêng cho tài khoản Studio được phép. Tên các con luôn gắn với máy gửi báo cáo.'))}</p><nav class="mg-nav" aria-label="${esc(T('Management views','Các trang quản lý'))}">${navigation.map(k => `<button type="button" class="btn small ${kind===k || kind==='device'&&k==='devices' || kind==='activity'&&k==='activities' ? '' : 'ghost'}" data-mg-nav="${k}">${esc(T(...labels[k]))}</button>`).join('')}</nav><form class="card mg-filters"><label>${esc(T('Period','Khoảng ngày'))}<select name="days">${['1','7','30'].map(d=>`<option value="${d}" ${q.days===d?'selected':''}>${esc(T(d+' day'+(d==='1'?'':'s'),d+' ngày'))}</option>`).join('')}</select></label><label>${esc(T('Build','Phiên bản'))}<input name="build" type="text" value="${esc(q.build)}" placeholder="${esc(T('All builds','Mọi phiên bản'))}" maxlength="24"></label><label>${esc(T('Traffic','Loại báo cáo'))}<select name="traffic">${['ordinary','authorised_test','synthetic_bot'].map(v=>`<option value="${v}" ${q.traffic===v?'selected':''}>${esc(trafficLabel(v,T))}</option>`).join('')}</select></label>${kind==='devices'||kind==='children' ? `<label class="mg-filter-search">${esc(T('Find a child or device','Tìm tên bé hoặc thiết bị'))}<input name="search" type="search" value="${esc(q.search)}" placeholder="${esc(T('Child name, device name or ID','Tên bé, tên máy hoặc mã máy'))}"></label><label>${esc(T('Device type','Loại thiết bị'))}<select name="deviceClass">${[['','All devices','Mọi thiết bị'],['phone','Phone','Điện thoại'],['tablet','Tablet','Máy tính bảng'],['computer','Computer','Máy tính']].map(([v,en,vi])=>`<option value="${v}" ${q.deviceClass===v?'selected':''}>${esc(T(en,vi))}</option>`).join('')}</select></label>` : ''}<button class="btn small" type="submit">${esc(T('Apply filters','Áp dụng bộ lọc'))}</button></form><div class="mg-content" aria-live="polite"><div class="card mg-loading" role="status">${esc(T('Loading reporting evidence…','Đang tải bằng chứng báo cáo…'))}</div></div></div>`;
  const root = P.querySelector<HTMLElement>('.mg-root'); if (!root) return;
  if(options.area){const nav=root.querySelector('.mg-nav');if(nav&&navigation.length>1){const tools=document.createElement('details'),summary=document.createElement('summary');tools.className='mg-area-tools';summary.textContent=T('Related tools in this area','Công cụ liên quan trong mục này');nav.before(tools);tools.append(summary,nav);}else nav?.remove();}
  root.querySelectorAll<HTMLButtonElement>('[data-mg-nav]').forEach(b => { b.onclick = () => { const k = b.dataset.mgNav || ''; if (validKind(k)) navigate(k); }; });
  if(kind==='finance'){root.querySelector('.mg-filters')?.remove();await mountFinance(root.querySelector<HTMLElement>('.mg-content')!,options,q,next=>navigate('finance','',next));return;}
  const form = root.querySelector<HTMLFormElement>('form');
  if (form) form.onsubmit = e => {
    e.preventDefault(); const values = new FormData(form); const next = { ...q };
    for (const name of ['days','build','traffic','search','deviceClass']) { const v = values.get(name); if (typeof v === 'string') next[name] = v.trim(); }
    delete next.cursor; delete next.from; delete next.to; navigate(kind, id, next);
  };
  const body = root.querySelector<HTMLElement>('.mg-content'); if (!body) return;
  if (kind==='release' && !id && !q.build && !options.build) {
    body.innerHTML = empty(T,'Enter a build above to inspect its release evidence. No release is deployed from this view.','Nhập phiên bản ở trên để xem bằng chứng phát hành. Trang này không tự triển khai phiên bản.'); return;
  }
  if ((kind==='device' || kind==='activity') && !id) { body.innerHTML = empty(T); return; }
  let itemHost:HTMLElement|null=null;
  const mountItem=(key:string)=>{if(itemHost)return;itemHost=document.createElement('div');itemHost.className='mg-item-workspace';body.before(itemHost);void mountItemWorkspace(itemHost,key,options);};
  if(kind==='activity'&&/^(game|story):[a-z0-9][a-z0-9_-]{0,59}$/.test(id))mountItem(id);
  const endpoint = kind==='device' ? 'devices/'+encodeURIComponent(id) : kind==='activity' ? 'activities/'+encodeURIComponent(id) : kind==='release' ? 'releases/'+encodeURIComponent(id || q.build || options.build || '') : kind==='changes' ? id?'changes/'+encodeURIComponent(id):'config' : kind;
  try {
    const requestQuery={...q};
    if (!requestQuery.from && !requestQuery.to) {
      const days = Number(requestQuery.days) || 30, today = new Date();
      requestQuery.to=today.toISOString().slice(0,10);
      requestQuery.from=new Date(today.getTime()-(days-1)*86400000).toISOString().slice(0,10);
    }
    delete requestQuery.days;
    const data = object(await options.api('management/'+endpoint+queryString(requestQuery)));
    if (!current()) return;
    if (data.error) throw new Error(text(data.error));
    if(kind==='activity'&&!itemHost&&['game','story'].includes(text(object(data.activity).kind)))mountItem(text(object(data.activity).kind)+':'+text(object(data.activity).id));
    if(kind==='activity'){
      const item=object(data.activity??data.catalogue??data.item),heading=root.querySelector('h2'),intro=root.querySelector('.sub');
      if(heading)heading.textContent=pair(item.name,T)||id;
      if(intro&&object(data.coverage).discovery==='declared-only')intro.textContent=T('Declared only: menu and loader integration is pending. This record does not enable the game.','Chỉ mới khai báo: đang chờ tích hợp danh sách và mã tải. Hồ sơ này không bật game.');
    }
    const m = rows(data.metrics);
    let content = '';
    if (kind === 'overview') content = renderOverview(data, m, T);
    if (kind === 'devices') content = renderDevices(data,T,profileContext);
    if (kind === 'device') content = renderDevice(data,T,profileContext);
    if (kind === 'children') content = profileContext ? renderChildren(data,T) : empty(T,'This account is not permitted to view child-name context.','Tài khoản này chưa được phép xem thông tin tên bé.');
    if (kind === 'activities') content = renderActivities(data,T);
    if (kind === 'activity') content = renderActivity(data,T);
    if (kind === 'attention') content = renderAttention(data,T);
    if (kind === 'release') content = renderRelease(data,T);
    if (kind === 'operations') content = renderOperations(data,T);
    if (kind === 'changes') content = renderChanges(data,T,options.can);
    const policy=object(data.optionalReporting);
    const notice=policy.installed===true||policy.state==='unavailable'?`<section class="card" data-reporting-policy-notice><h3>${esc(T('Detailed reporting controls','Điều khiển báo cáo chi tiết'))}</h3><p>${esc(T(policy.state==='unavailable'?'Current policy could not be read; optional report processing is unavailable.':policy.state==='expired'?'Temporary reporting policy expired; new collection and report processing are off.':!policy.process?'Optional report processing is paused. Existing raw data is retained; no background backlog is being processed.':!policy.show?'Detailed event views are hidden. Collection and processing have their own controls.':'Temporary detailed reporting policy is active. Parent permission and the existing release gate still apply.',policy.state==='unavailable'?'Chưa đọc được chính sách; chưa có xử lý báo cáo tùy chọn.':policy.state==='expired'?'Chính sách tạm thời hết hạn; thu thập mới và xử lý báo cáo đã tắt.':!policy.process?'Đang tạm dừng xử lý báo cáo tùy chọn. Giữ dữ liệu thô; không có tác vụ nền xử lý tồn đọng.':!policy.show?'Ẩn trang sự kiện chi tiết. Thu thập và xử lý có điều khiển riêng.':'Chính sách báo cáo chi tiết tạm thời đang hoạt động. Vẫn theo quyền phụ huynh và cổng phát hành hiện có.'))}</p></section>`:'';
    body.innerHTML = notice+provenance(data,T)+content;
    if(kind==='device'){
      const series=rows(data.dailySeries),d=object(data.device),delivery=object(data.delivery),target=object(delivery.target),receipt=object(delivery.receipt);
      body.insertAdjacentHTML('beforeend',deskChart({id:'G04',title:T('Reported play on this installation','Thời gian chơi được báo cáo trên bản cài đặt này'),unit:T('Minutes per device-local day','Phút theo ngày của máy'),points:series.map(v=>({label:text(v.date),value:finite(v.mins)})),line:true,
        explanation:T('Device totals count reported active minutes, not total screen time or one child’s exact timeline. Missing retained buckets remain unavailable.','Tổng máy đếm phút hoạt động có báo cáo, không phải tổng thời gian màn hình hoặc dòng thời gian chính xác của một bé. Ngày thiếu dữ liệu lưu vẫn chưa có số liệu.'),source:'L01 · DAY-01/03 · management/devices/:id',limit:T('Selected installation and reporting period only.','Chỉ bản cài đặt và khoảng báo cáo đã chọn.')},T));
      body.insertAdjacentHTML('beforeend',`<section class="card"><h3>${esc(T('Configuration delivery for this device','Cung cấp cấu hình cho máy này'))}</h3><p>${esc(target.revision?T('Current global snapshot revision','Phiên bản cấu hình toàn cục hiện tại')+' '+text(target.revision):T('No current configuration target is available.','Chưa có cấu hình đích hiện tại.'))}</p>${target.revision?`<p>${badge(target.state==='available'?'available':'pending',T)} ${badge(receipt.result||'unknown',T)}</p>`:''}<p class="note">${esc(T('This checks the current global snapshot, independent of the activity period above. Applied means this installation reported persisting the exact revision/hash; it does not prove every feature is available or every open screen has refreshed.','Kiểm tra cấu hình toàn cục hiện tại, độc lập kỳ hoạt động bên trên. Áp dụng nghĩa là bản cài đặt báo đã lưu đúng phiên bản/hàm băm; không chứng minh mọi tính năng đã mở hay màn hình đã làm mới.'))}</p>${options.can?.('management.read')?`<button class="btn small ghost" data-mg-open="changes">${esc(T('Inspect configuration history','Xem lịch sử cấu hình'))}</button>`:''}</section>`);
      const issues=rows(data.relatedIssues);
      body.insertAdjacentHTML('beforeend',`<section class="card"><h3>${esc(T('Problem evidence linked to this device','Bằng chứng vấn đề gắn với máy này'))}</h3>${issues.length?issues.map(i=>`<p><b>${esc(i.title||T('Reported problem','Vấn đề được báo cáo'))}</b> ${badge(i.status,T)} ${options.can?.('management.read')?`<button class="btn small ghost" data-mg-open="attention" data-mg-id="${esc(i.id)}">${esc(T('Open follow-up','Mở theo dõi'))}</button>`:''}</p>`).join(''):`<p>${esc(T('No permitted matching problem evidence was returned. Missing access and capped source device lists can hide associations.','Không có bằng chứng vấn đề phù hợp được phép trả về. Thiếu quyền hoặc danh sách máy bị giới hạn có thể che mất liên kết.'))}</p>`}<p class="note">${esc(T('Original private tester access is required. An observation alone does not prove the cause.','Cần quyền xem báo cáo người thử riêng. Một quan sát chưa chứng minh nguyên nhân.'))}</p></section>`);
    }
    if(kind==='changes'){
      const latest=rows(data.changes)[0];if(latest)body.insertAdjacentHTML('afterbegin',deskChart({id:'G17',title:T('Latest revision: reporting cohort delivery','Phiên bản mới nhất: cung cấp cho nhóm báo cáo'),unit:T('Reporting installations in the fixed cohort','Bản cài đặt gửi báo cáo trong nhóm cố định'),points:['applied','rejected','unsupported','unconfirmed'].map(key=>({label:statusLabel(key==='unconfirmed'?'unknown':key,T),value:finite(latest[key])})),explanation:T('Exact revision/hash receipts are counted only within the reporting cohort fixed at save. Later revisions are not automatically counted as applied to this one.','Chỉ đếm biên nhận đúng phiên bản/hàm băm trong nhóm báo cáo cố định lúc lưu. Phiên bản mới hơn không tự được tính là đã áp dụng cho bản này.'),source:'L05 / L06 · CFG / RCPT · management/config',limit:T('Self-reported persistence; no receipt means unconfirmed.','Máy tự báo đã lưu; thiếu biên nhận nghĩa là chưa xác nhận.')},T));
    }
    body.querySelectorAll<HTMLButtonElement>('[data-mg-open]').forEach(b => { b.onclick = () => {
      const k = b.dataset.mgOpen || ''; if (validKind(k)) navigate(k,b.dataset.mgId || '');
    }; });
    body.querySelectorAll<HTMLButtonElement>('[data-mg-cursor]').forEach(b => { b.onclick = () => navigate(kind,id,{...q,cursor:b.dataset.mgCursor || ''}); });
    const lookup = body.querySelector<HTMLFormElement>('[data-mg-lookup]');
    if (lookup) lookup.onsubmit = e => { e.preventDefault(); const value = new FormData(lookup).get('activityId'); if(typeof value==='string' && value.trim()) navigate('activity',value.trim()); };
    if (kind === 'attention' && data.transactional === true && options.can?.('management.triage')) {
      mountAttentionEditor(body, data, options, () => navigate('attention', '', q));
      if(id){const problem=body.querySelector<HTMLSelectElement>('[name=problem]');if(problem&&[...problem.options].some(o=>o.value===id)){problem.value=id;problem.dispatchEvent(new Event('change'));}}
    }
    if (kind === 'changes' && !id && data.configured === true && options.can?.('management.configure')) {
      await mountConfigEditor(body, data, options, () => navigate('changes', '', q));
    }
    if (kind === 'operations') mountOperationsControls(body, data, options, () => navigate('operations', '', q));
    if (kind === 'overview' && data.telemetry) body.insertAdjacentHTML('beforeend', renderTelemetry(object(data.telemetry), T));
    if (kind === 'activity' && data.detailedOutcomes) {
      const d=object(data.detailedOutcomes),c=Object.keys(object(d.counts)).length?object(d.counts):d;
      body.insertAdjacentHTML('beforeend',`<article class="card"><h3>${esc(T('Detailed reported attempts','Lượt được báo cáo chi tiết'))}</h3>${outcomeFacts(c,T)}<p class="note">${esc(T('Matched event attempts are separate from legacy profile participations. Missing outcomes remain pending or unknown.','Lượt sự kiện khớp mã được tách khỏi lượt tham gia hồ sơ cũ. Kết quả còn thiếu vẫn đang chờ hoặc chưa rõ.'))}</p></article>`);
    }
  } catch (error) {
    if (!current()) return;
    const message = error instanceof Error ? error.message : '';
    body.innerHTML = `<div class="card mg-error" role="alert"><h3>${esc(T('This view could not be loaded','Chưa tải được trang này'))}</h3><p>${esc(T('Check your account permission, connection and configured management service. No missing measurement is treated as zero.','Kiểm tra quyền tài khoản, kết nối và dịch vụ quản lý đã cấu hình. Số đo còn thiếu không được coi là bằng không.'))}</p>${message ? `<details><summary>${esc(T('Service response','Phản hồi dịch vụ'))}</summary><p>${esc(message)}</p></details>` : ''}<button class="btn small" type="button" data-mg-retry>${esc(T('Try again','Thử lại'))}</button></div>`;
    const retry = body.querySelector<HTMLButtonElement>('[data-mg-retry]'); if (retry) retry.onclick = () => navigate(kind,id,q);
  }
}

function operationMessage(error:unknown,T:ManagementOptions['T']):string {
  const code=text(object(error).raw,error instanceof Error?error.message:'');
  const messages:Record<string,[string,string]>={
    operation_cooldown:['Another request was recently recorded. Wait one minute and refresh its status.','Vừa ghi một yêu cầu khác. Chờ một phút và làm mới trạng thái.'],
    operation_payload_conflict:['This operation ID already has different inputs. Refresh and review its recorded request.','Mã tác vụ này đã có tham số khác. Làm mới và xem lại yêu cầu đã ghi.'],
    operation_reason_required:['Enter a reason of 3–600 characters.','Nhập lý do dài 3–600 ký tự.'],
    invalid_bot_inputs:['Use 1–10 sessions, 1–30 minutes and one of the listed behaviours.','Chọn 1–10 phiên, 1–30 phút và một cách chơi trong danh sách.'],
    management_database_not_configured:['Connect Netlify Database before running an operation.','Kết nối Netlify Database trước khi chạy tác vụ.'],
    website_permission_required:['This action requires website permission.','Thao tác này cần quyền quản lý trang web.'],
    configuration_permission_required:['This action requires configuration permission.','Thao tác này cần quyền cấu hình.']
  };
  return messages[code]?T(...messages[code]):T('The operation could not be confirmed. Refresh the recorded status before starting another request.','Chưa xác nhận được tác vụ. Làm mới trạng thái đã ghi trước khi tạo yêu cầu khác.');
}

function mountOperationsControls(body:HTMLElement,data:Row,options:ManagementOptions,reload:()=>void) {
  const {T,api}=options,bar=document.createElement('div');bar.className='card';
  const refresh=document.createElement('button');refresh.type='button';refresh.className='btn small';refresh.textContent=T('Refresh provider evidence','Làm mới bằng chứng nhà cung cấp');
  const message=document.createElement('p');message.setAttribute('role','status');
  refresh.onclick=async()=>{refresh.disabled=true;try{if(options.online!==false)await api('management/operations/refresh',{});reload();}catch(error){message.textContent=operationMessage(error,T);refresh.disabled=false;}};
  bar.append(refresh,message);body.prepend(bar);
  if(!options.can?.('operations.run'))return;
  if(data.databaseConfigured!==true){message.textContent=T('Connect the management database before running jobs; every request needs a durable operation record.','Kết nối cơ sở dữ liệu quản lý trước khi chạy tác vụ; mỗi yêu cầu cần bản ghi bền vững.');return;}
  const form=document.createElement('form');form.className='mg-editor';
  form.innerHTML=`<h3>${esc(T('Run a bounded operation','Chạy tác vụ có giới hạn'))}</h3><label>${esc(T('Operation','Tác vụ'))}<select name="operationKind"><option value="database_check">${esc(T('Check database access','Kiểm tra truy cập cơ sở dữ liệu'))}</option>${options.can?.('management.configure')?`<option value="retry_configuration">${esc(T('Retry pending configuration publication','Thử cung cấp lại cấu hình đang chờ'))}</option>`:''}${options.can?.('site')?`<option value="bot">${esc(T('Run child-bot test','Chạy thử nghiệm bot'))}</option>`:''}</select></label><div data-bot-inputs hidden><label>${esc(T('Independent sessions (1–10)','Phiên độc lập (1–10)'))}<input name="count" type="number" min="1" max="10" value="1"></label><label>${esc(T('Minutes per session (1–30)','Phút mỗi phiên (1–30)'))}<input name="duration" type="number" min="1" max="30" value="1"></label><label>${esc(T('Behaviour','Cách chơi'))}<select name="profile"><option value="gentle-explorer">${esc(T('Gentle explorer','Khám phá nhẹ nhàng'))}</option><option value="chaos-toddler">${esc(T('Chaotic toddler','Bé nghịch ngợm'))}</option><option value="max-competence">${esc(T('Experienced player','Người chơi thành thạo'))}</option></select></label></div><label>${esc(T('Reason','Lý do'))}<input type="text" name="operationReason" required minlength="3" maxlength="600"></label><p class="note">${esc(T('A bot request can start a GitHub workflow using the configured branch. Accepted means queued, not completed. Bot requests have a shared 60-second cooldown. An uncertain request must be checked against the run feed before starting another.','Yêu cầu bot có thể chạy tác vụ GitHub trên nhánh đã cấu hình. Được nhận nghĩa là đang chờ, chưa phải hoàn tất. Yêu cầu bot dùng thời gian chờ chung 60 giây. Cần kiểm tra nguồn tác vụ khi yêu cầu chưa rõ kết quả trước khi tạo yêu cầu khác.'))}</p><button class="btn" type="submit">${esc(T('Run selected operation','Chạy tác vụ đã chọn'))}</button><p role="status" data-operation-result></p>`;
  const kind=form.querySelector<HTMLSelectElement>('[name=operationKind]')!,bot=form.querySelector<HTMLElement>('[data-bot-inputs]')!,button=form.querySelector<HTMLButtonElement>('button')!,result=form.querySelector<HTMLElement>('[data-operation-result]')!;
  let pending:Row|null=null;
  kind.onchange=()=>{bot.hidden=kind.value!=='bot';};
  form.onsubmit=async event=>{
    event.preventDefault();button.disabled=true;
    if(!pending){pending={operationId:crypto.randomUUID(),kind:kind.value,reason:form.querySelector<HTMLInputElement>('[name=operationReason]')!.value,
      ...(kind.value==='bot'?{count:Number(form.querySelector<HTMLInputElement>('[name=count]')!.value),duration:Number(form.querySelector<HTMLInputElement>('[name=duration]')!.value),profile:form.querySelector<HTMLSelectElement>('[name=profile]')!.value}:{})};}
    try {
      const response=object(await api('management/operations/run',pending)),op=object(response.operation);
      result.textContent=T('Recorded operation','Đã ghi tác vụ')+': '+text(op.operationId)+' · '+statusLabel(op.status,T);
      if(op.status==='unknown')result.textContent+=' '+T('Delivery is uncertain. Refresh provider evidence before requesting another run.','Chưa rõ yêu cầu đã được nhận hay chưa. Làm mới bằng chứng nhà cung cấp trước khi yêu cầu chạy lại.');
      const show=document.createElement('button');show.type='button';show.className='btn small';show.textContent=T('Show recorded status','Xem trạng thái đã ghi');show.onclick=reload;form.append(show);
    }catch(error){result.textContent=operationMessage(error,T)+' '+T('Retry keeps the same operation ID and inputs.','Thử lại sẽ giữ nguyên mã tác vụ và tham số.');button.textContent=T('Retry same request','Thử lại cùng yêu cầu');button.disabled=false;}
  };
  bar.append(form);
}

function outcomeFacts(c:Row,T:ManagementOptions['T']):string {
  const fields:[string,string,unknown][]=[['Started','Bắt đầu',c.started],['Confirmed success','Thành công xác nhận',c.succeeded??c.completed??c.success],['Confirmed failure','Thất bại xác nhận',c.failed],['Pending','Đang chờ',c.pending],['Unknown outcome','Kết quả chưa rõ',c.outcomeUnknown??c.unknown],['Cancelled','Đã hủy',c.cancelled],['Initiated only','Chỉ mới bắt đầu',c.initiated]];
  return `<dl class="mg-facts">${fields.filter(([, ,value])=>value!==undefined).map(([en,vi,value])=>`<div><dt>${esc(T(en,vi))}</dt><dd>${esc(numberLabel(value,T))}</dd></div>`).join('')}</dl>`;
}
function renderTelemetry(data:Row,T:ManagementOptions['T']):string {
  const voice=object(data.voice),backup=object(data.backups),boot=object(data.boot);
  return `<section class="card"><h3>${esc(T('Observed game outcomes','Kết quả game được quan sát'))}</h3><p>${esc(T('Production UTC event evidence from consenting reporting devices. No result means unknown, not success.','Bằng chứng sự kiện theo UTC từ máy đồng ý gửi báo cáo. Chưa có kết quả là chưa rõ, không phải thành công.'))}</p><div class="mg-grid">${[
    [T('Reportable boot phase','Giai đoạn khởi động có báo cáo'),boot],
    [T('Individual story attempts','Lượt đọc truyện riêng'),object(data.stories)],
    [T('Connection attempts','Lượt kết nối'),object(data.connections)],
    [T('Recorded voice playback','Phát giọng bản ghi'),object(voice.recorded)],
    [T('Family voice playback','Phát giọng gia đình'),object(voice.family)],
    [T('Device voice playback','Phát giọng thiết bị'),object(voice.device)],
    [T('Observed updates','Cập nhật được quan sát'),object(data.updates)],
    [T('Backup exports','Xuất bản sao lưu'),object(backup.export)],
    [T('Backup restoration','Khôi phục bản sao lưu'),object(backup.restore)]
  ].map(([title,c])=>`<article class="card"><h4>${esc(title)}</h4>${outcomeFacts(c as Row,T)}</article>`).join('')}</div><p class="note">${esc(T('Boot timing starts when the players module can report and ends at first playable. Earlier import/crash failures are invisible. Voice watchdog completion remains unknown. A download click confirms initiation only. Share success confirms handoff to another app. Neither confirms a durable off-device copy.','Đo khởi động bắt đầu khi mô-đun người chơi có thể báo cáo và kết thúc khi bắt đầu chơi được. Không quan sát được lỗi nhập mã hoặc sập trước đó. Kết thúc do bộ canh giọng vẫn là chưa rõ. Bấm tải chỉ xác nhận bắt đầu. Chia sẻ thành công xác nhận chuyển cho ứng dụng khác. Cả hai không xác nhận bản sao bền vững ngoài thiết bị.'))}</p><p>${esc(T('Reported boot-phase p95','P95 giai đoạn khởi động có báo cáo'))}: ${esc(numberLabel(boot.phaseP95Ms,T))} ${esc(T('ms','mili giây'))} · ${esc(T('Samples','Số mẫu'))}: ${esc(numberLabel(boot.durationSamples,T))}</p></section>`;
}

function mountAttentionEditor(body: HTMLElement, data: Row, options: ManagementOptions, reload: () => void) {
  const { T, api } = options, items = rows(data.items), assignments = rows(data.assignments);
  if (!items.length) return;
  const form = document.createElement('form'); form.className = 'card mg-editor';
  const states = ['observed','investigating','reproduced','fixing','fixed_in_code','deployed','verified','reopened','dismissed','duplicate'];
  const vi = ['Đã ghi nhận','Đang điều tra','Đã tái hiện','Đang sửa','Đã sửa trong mã','Đã triển khai','Đã xác minh','Mở lại','Bỏ qua','Trùng lặp'];
  form.innerHTML = `<h3>${esc(T('Assign and follow up','Phân công và theo dõi'))}</h3><label>${esc(T('Problem','Vấn đề'))}<select name="problem">${items.map(i=>`<option value="${esc(i.id)}">${esc(i.title || i.id)}</option>`).join('')}</select></label><label>${esc(T('State','Trạng thái'))}<select name="state">${states.map((s,i)=>`<option value="${s}">${esc(T(s.replaceAll('_',' '),vi[i]))}</option>`).join('')}</select></label><label>${esc(T('Responsible person','Người phụ trách'))}<input name="owner" maxlength="80"></label><label>${esc(T('Next action','Việc tiếp theo'))}<textarea name="nextAction" maxlength="600"></textarea></label><label>${esc(T('Reason for change','Lý do thay đổi'))}<textarea name="reason" required minlength="3" maxlength="600"></textarea></label><label>${esc(T('Build (for verification)','Phiên bản (khi xác minh)'))}<input name="build" maxlength="40"></label><label>${esc(T('Deployment ID (when deployed)','Mã triển khai (khi đã triển khai)'))}<input name="deployId" maxlength="100"></label><label>${esc(T('Verification evidence','Bằng chứng xác minh'))}<textarea name="verificationEvidence" maxlength="300"></textarea></label><p class="note">${esc(T('A new assignment starts as observed. Advance through investigation, reproduction, fix, deployment and verification; deployment and verification require evidence.','Phân công mới bắt đầu ở trạng thái đã ghi nhận. Tiếp tục qua điều tra, tái hiện, sửa, triển khai và xác minh; triển khai và xác minh cần bằng chứng.'))}</p><button class="btn" type="submit">${esc(T('Save follow-up','Lưu theo dõi'))}</button><p role="status"></p>`;
  const problem = form.querySelector<HTMLSelectElement>('[name=problem]')!, state = form.querySelector<HTMLSelectElement>('[name=state]')!, status = form.querySelector<HTMLElement>('[role=status]')!;
  let revision = 0;
  const load = () => { const current = assignments.find(a=>a.id===problem.value); revision = Number(current?.revision || 0); state.value = text(current?.state,'observed');
    for (const key of ['owner','nextAction']) form.querySelector<HTMLInputElement>('[name='+key+']')!.value = text(current?.[key]); };
  problem.onchange = load; load();
  form.onsubmit = async event => {
    event.preventDefault(); const button = form.querySelector<HTMLButtonElement>('button')!; button.disabled = true;
    const values = new FormData(form), evidence: Record<string,string> = {};
    for (const key of ['build','deployId','verificationEvidence']) { const value = String(values.get(key)||'').trim(); if (value) evidence[key]=value; }
    try { await api('management/attention/'+encodeURIComponent(problem.value), { expectedRevision: revision, state: state.value, owner: String(values.get('owner')||'') || null, nextAction: String(values.get('nextAction')||''), reason: String(values.get('reason')||''), evidence }); reload(); }
    catch (error) { status.textContent = error instanceof Error ? error.message : T('Could not save.','Chưa lưu được.'); button.disabled = false; }
  };
  body.prepend(form);
}

async function mountConfigEditor(body: HTMLElement, data: Row, options: ManagementOptions, reload: () => void) {
  const { T, api } = options, config = object(data.config), revision = Number(config.revision || 0);
  const form = document.createElement('form'); form.className = 'card mg-editor';
  form.innerHTML = `<h3>${esc(T('Private configuration drafts','Bản nháp cấu hình riêng tư'))}</h3><p>${esc(T('Save draft keeps a proposal in the private database. Review shows changed sections. Only Publish makes the reviewed global settings available to the game and connected website consumers. Devices must fetch and recheck; offline devices and open activities may wait. Saved progress is preserved.','Lưu bản nháp giữ đề xuất trong cơ sở dữ liệu riêng tư. Xem xét hiển thị các phần thay đổi. Chỉ Xuất bản mới cung cấp cấu hình toàn cục đã xem xét cho game và phần website có sử dụng. Máy cần tải và kiểm tra lại; máy ngoại tuyến và hoạt động đang mở có thể phải chờ. Tiến trình đã lưu được giữ nguyên.'))}</p><label>${esc(T('Resume a saved draft','Mở bản nháp đã lưu'))}<select name="savedDraft"><option value="">${esc(T('New draft','Bản nháp mới'))}</option></select></label><label>${esc(T('Change type','Loại thay đổi'))}<select name="kind">${options.can?.('releases')?`<option value="rules">${esc(T('Release and festival rules','Quy tắc ra mắt và lễ hội'))}</option>`:''}${options.can?.('edit')?`<option value="content">${esc(T('Live content sections','Các phần nội dung trực tiếp'))}</option>`:''}</select></label><label>${esc(T('Configuration JSON · advanced','Cấu hình JSON · nâng cao'))}<textarea name="configBody" rows="12" spellcheck="false" required></textarea></label><label>${esc(T('Reason for change','Lý do thay đổi'))}<textarea name="reason" minlength="3" maxlength="600" required></textarea></label><p class="note">${esc(T('Global scope. Publishing affects all consumers of these global settings; it does not deploy a build or enable an unintegrated game. Review is a recorded acknowledgement, not an independent second-person approval.','Phạm vi toàn cục. Xuất bản ảnh hưởng mọi nơi dùng cấu hình này; không triển khai bản game hay mở game chưa tích hợp. Xem xét là xác nhận có ghi lại, không phải phê duyệt độc lập bởi người thứ hai.'))}</p><button class="btn" type="submit">${esc(T('Save private draft','Lưu bản nháp riêng tư'))}</button><button class="btn ghost" type="button" data-draft-review disabled>${esc(T('Review saved draft','Xem xét bản nháp đã lưu'))}</button><button class="btn" type="button" data-draft-publish disabled>${esc(T('Publish reviewed draft globally','Xuất bản bản nháp đã xem xét cho toàn bộ'))}</button><p role="status" data-config-result></p><div data-draft-impact></div>`;
  const select=form.querySelector<HTMLSelectElement>('[name=kind]')!, picker=form.querySelector<HTMLSelectElement>('[name=savedDraft]')!, input=form.querySelector<HTMLTextAreaElement>('[name=configBody]')!, reason=form.querySelector<HTMLTextAreaElement>('[name=reason]')!, save=form.querySelector<HTMLButtonElement>('[type=submit]')!, review=form.querySelector<HTMLButtonElement>('[data-draft-review]')!, publish=form.querySelector<HTMLButtonElement>('[data-draft-publish]')!, result=form.querySelector<HTMLElement>('[data-config-result]')!, impact=form.querySelector<HTMLElement>('[data-draft-impact]')!;
  if(!select.options.length)return;body.append(form);
  let draft:Row={},saved:Row[]=[],busy=false,dirty=true,loadId=0;
  const controls=()=>{save.disabled=busy||!input.value||draft.state==='published';review.disabled=busy||dirty||!draft.id||draft.state==='published';publish.disabled=busy||dirty||draft.state!=='reviewed';select.disabled=busy||!!draft.id;picker.disabled=busy;input.disabled=busy||draft.state==='published';reason.disabled=input.disabled;};
  const display=()=>{const r=object(draft.review);impact.textContent=draft.id?`${T('Draft revision','Phiên bản nháp')} ${text(draft.revision)} · ${T('Base revision','Phiên bản gốc')} ${text(draft.baseRevision)} · ${statusLabel(text(draft.state),T)}. ${Array.isArray(r.changedPaths)?T('Changed sections: ','Phần thay đổi: ')+(r.changedPaths.length?r.changedPaths.join(', '):T('No effective changes','Không có thay đổi thực tế')):''}`:'';controls();};
  const editValue=(value:Row,kind:string)=>kind==='rules'?{releases:value.releases||{},festivals:value.festivals||{}}:{content:value.content||{}};
  const load=async()=>{const token=++loadId;busy=true;draft={};dirty=true;input.value='';result.textContent='';display();try{let value=object(config.body);if(!config.body)value=object(await api(select.value==='rules'?'live':'live/content'));if(token!==loadId)return;input.value=JSON.stringify(editValue(value,select.value),null,2);}catch(e){result.textContent=e instanceof Error?e.message:'';}finally{if(token===loadId){busy=false;display();}}};
  const choose=(d:Row)=>{draft=d;dirty=false;select.value=text(d.kind);input.value=JSON.stringify(editValue(object(d.body),text(d.kind)),null,2);reason.value=text(d.reason);display();};
  const refreshList=async()=>{const response=object(await api('management/drafts'));saved=rows(response.drafts);picker.replaceChildren(new Option(T('New draft','Bản nháp mới'),''),...saved.map(d=>new Option(`${text(d.reason)} · ${statusLabel(text(d.state),T)}`,text(d.id))));picker.value=text(draft.id,'');};
  select.onchange=()=>void load();picker.onchange=()=>{const found=saved.find(d=>d.id===picker.value);if(found){choose(found);result.textContent='';}else{reason.value='';void load();}};
  for(const field of [input,reason])field.oninput=()=>{dirty=true;impact.textContent=T('Unsaved edits. Save and review again before publishing.','Có chỉnh sửa chưa lưu. Lưu và xem xét lại trước khi xuất bản.');controls();};
  const run=async(work:()=>Promise<void>)=>{busy=true;controls();try{await work();}catch(e){result.textContent=e instanceof Error?e.message:T('Request failed. Reload the saved draft before retrying an uncertain write.','Yêu cầu thất bại. Tải lại bản nháp đã lưu trước khi thử lại thao tác chưa rõ kết quả.');}finally{busy=false;controls();}};
  form.onsubmit=event=>{event.preventDefault();void run(async()=>{const value=object(await api('management/drafts',{...(draft.id?{id:draft.id}:{}),expectedRevision:Number(draft.revision||0),baseRevision:Number(draft.baseRevision??revision),kind:select.value,body:JSON.parse(input.value),reason:reason.value}));choose(value);result.textContent=T('Private draft saved. Nothing has been published.','Đã lưu bản nháp riêng tư. Chưa xuất bản thay đổi.');await refreshList();});};
  review.onclick=()=>void run(async()=>{choose(object(await api('management/drafts/'+encodeURIComponent(text(draft.id))+'/review',{expectedRevision:draft.revision,effectiveHash:draft.effectiveHash})));result.textContent=T('Review recorded. Read the changed sections and global impact before publishing.','Đã ghi nhận xem xét. Đọc các phần thay đổi và ảnh hưởng toàn cục trước khi xuất bản.');await refreshList();});
  publish.onclick=()=>void run(async()=>{const response=object(await api('management/drafts/'+encodeURIComponent(text(draft.id))+'/publish',{expectedRevision:draft.revision,effectiveHash:draft.effectiveHash}));draft={...draft,state:'published'};display();result.textContent=object(response.projection).ok===true?T('Published and available. Device application still needs receipts.','Đã xuất bản và cung cấp. Vẫn cần biên nhận thiết bị đã áp dụng.'):T('Publication saved; public delivery is pending.','Đã lưu xuất bản; đang chờ cung cấp công khai.');const refresh=document.createElement('button');refresh.type='button';refresh.className='btn';refresh.textContent=T('Reload revision','Tải lại phiên bản');refresh.onclick=reload;form.append(refresh);});
  if(rows(data.changes).some(c=>c.state==='pending_projection')){const retry=document.createElement('button');retry.type='button';retry.className='btn';retry.textContent=T('Retry pending publication','Thử cung cấp lại thay đổi đang chờ');retry.onclick=()=>void run(async()=>{const response=object(await api('management/config/project',{}));result.textContent=response.ok===true?T('Available. Reload to see coverage.','Đã cung cấp. Tải lại để xem xác nhận.'):T('Still pending.','Vẫn đang chờ.');});form.append(retry);}
  await load();try{await refreshList();}catch(e){result.textContent=T('Saved drafts could not be loaded. Check the database migration and access before saving.','Chưa tải được bản nháp đã lưu. Kiểm tra di chuyển cơ sở dữ liệu và quyền truy cập trước khi lưu.');}
}

function renderOverview(data: Row, metrics: Row[], T: ManagementOptions['T']): string {
  const find = (...ids:string[]) => metrics.find(m => ids.includes(text(m.id)));
  const cards: [string,string,ManagementKind,Row|undefined][] = [
    ['Audience','Máy có báo cáo','devices',find('M01')],['Play time','Thời gian chơi','activities',find('M04')],
    ['Experience','Trải nghiệm','devices',find('M08')],['Needs attention','Cần xem xét','attention',finite(object(data.attention).open)===null?undefined:{value:object(data.attention).open,unit:T('reports','báo cáo'),status:'observed'}],
    ['Release evidence','Bằng chứng phát hành','release',undefined],['Operations','Vận hành','operations',find('M35')]
  ];
  const scope=object(data.scope);
  return `<div class="mg-grid">${cards.map(([en,vi,k,m])=>`<article class="card mg-card"><h3>${esc(T(en,vi))}</h3><strong class="mg-value">${esc(m ? numberLabel(m.value,T) : k==='release' ? text(scope.build,T('Select build','Chọn phiên bản')) : T('Unavailable','Chưa có số liệu'))}</strong>${m ? `<p>${esc(text(m.unit))} · ${badge(m.status || 'observed',T)}</p>` : ''}<button class="btn small ghost" type="button" data-mg-open="${k}" ${k==='release'&&scope.build&&scope.build!=='all'?`data-mg-id="${esc(scope.build)}"`:''}>${esc(T('Open evidence','Xem bằng chứng'))}</button></article>`).join('')}</div><div class="card"><h3>${esc(T('What is measured','Số liệu được đo'))}</h3><p>${esc(T('Devices are installations, not necessarily individual children. Names are shown with devices in authorised detail views. Website Play clicks do not prove that a game started. Finance input is deferred.','Thiết bị là bản cài đặt, không nhất thiết là từng trẻ riêng biệt. Tên bé được hiện cùng máy trong trang chi tiết được phép. Lượt bấm Chơi trên web không chứng minh game đã bắt đầu. Chưa thu thập dữ liệu tài chính.'))}</p></div>${metrics.length ? `<details class="card"><summary>${esc(T('All available measurements','Tất cả số đo hiện có'))}</summary><div class="mg-grid">${metrics.map(m=>metric(m,T)).join('')}</div></details>` : ''}`;
}
function renderDevices(data: Row,T:ManagementOptions['T'],profileContext:boolean):string {
  const devices=rows(data.items ?? data.devices), total=data.totalEligible ?? data.total ?? devices.length;
  return `<p class="note">${esc(T('Eligible reporting installations','Bản cài đặt có báo cáo phù hợp'))}: ${esc(numberLabel(total,T))}. ${esc(T('Child names are shown only when the reporting family has permitted name reporting.','Tên bé chỉ hiện khi gia đình cho phép báo cáo tên.'))}</p>${devices.length?`<div class="mg-list">${devices.map(d=>{
    const names=profileContext?childNames(d):[], id=deviceID(d);
    return `<article class="card mg-device"><h3>${esc(text(d.label ?? d.name,id))}</h3><p class="mg-children"><strong>${esc(T('Children on this device','Các con trên máy này'))}:</strong> ${esc(names.length?names.join(', '):T('No name reported','Chưa báo cáo tên'))}</p><p>${esc([d.kind ?? d.deviceClass,d.os,d.br ?? d.browser,d.build].map(v=>text(v)).filter(Boolean).join(' · '))}</p><p class="note">${esc(T('Last report','Báo cáo gần nhất'))}: ${esc(dateLabel(d.seenAt || d.lastSeen || d.activityLast || d.last,T))}</p><code class="mg-id">${esc(id)}</code><button class="btn small ghost" type="button" data-mg-open="device" data-mg-id="${esc(id)}">${esc(T('Device and child details','Chi tiết máy và bé'))}</button></article>`;
  }).join('')}</div>`:empty(T)}${data.nextCursor?`<button class="btn" type="button" data-mg-cursor="${esc(data.nextCursor)}">${esc(T('Next devices','Các máy tiếp theo'))}</button>`:''}`;
}
function renderDevice(data:Row,T:ManagementOptions['T'],profileContext:boolean):string {
  const d=object(data.device ?? data.item ?? data), kids=profileContext?children(d):[], stats=rows(data.metrics);
  return `<article class="card"><h3>${esc(text(d.label ?? d.name,deviceID(d)))}</h3><dl class="mg-facts">${[[T('Device ID','Mã máy'),deviceID(d)],[T('Build','Phiên bản'),text(d.build)],[T('System / browser','Hệ điều hành / trình duyệt'),[d.os,d.br??d.browser].map(v=>text(v)).filter(Boolean).join(' · ')],[T('Last report','Báo cáo gần nhất'),dateLabel(d.seenAt||d.lastSeen||d.activityLast||d.last,T)]].map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v || T('Not reported','Chưa báo cáo'))}</dd></div>`).join('')}</dl></article><div class="card"><h3>${esc(T('Children associated with this device','Các con gắn với máy này'))}</h3><p class="note">${esc(T('This is reported profile activity on this installation. It does not authorise remote editing of saved progress.','Đây là hoạt động hồ sơ được báo cáo trên bản cài đặt này. Không cho phép sửa từ xa tiến trình đã lưu.'))}</p>${kids.length?`<div class="mg-grid">${kids.map(k=>`<article class="mg-child"><h4>${esc(text(k.name ?? k.n,T('Name not reported','Chưa báo cáo tên')))}</h4><dl class="mg-facts"><div><dt>${esc(T('Age group','Nhóm tuổi'))}</dt><dd>${esc(k.age==='big'||k.a==='big'?T('5–8','5–8 tuổi'):k.age==='little'||k.a==='little'?T('Under 5','Dưới 5 tuổi'):T('Not reported','Chưa báo cáo'))}</dd></div><div><dt>${esc(T('Reported play','Thời gian chơi báo cáo'))}</dt><dd>${esc(numberLabel(k.mins??k.minutes??k.m,T))} ${esc(T('minutes','phút'))}</dd></div></dl></article>`).join('')}</div>`:`<p>${esc(T('No child-name context is available for this device or your permission.','Chưa có tên bé cho máy này hoặc tài khoản chưa được phép xem.'))}</p>`}</div>${stats.length?`<div class="mg-grid">${stats.map(m=>metric(m,T)).join('')}</div>`:''}${renderRelated(data,T)}`;
}
function renderActivities(data:Row,T:ManagementOptions['T']):string {
  const items=rows(data.items??data.activities??data.catalogue);
  return `<form class="card mg-lookup" data-mg-lookup><label>${esc(T('Open an activity by its stable ID','Mở hoạt động bằng mã ổn định'))}<input type="text" name="activityId" placeholder="oanquan" pattern="[A-Za-z0-9_:-]{1,70}" required></label><button class="btn small" type="submit">${esc(T('Open activity','Mở hoạt động'))}</button></form>${items.length?`<div class="mg-grid">${items.map(a=>`<article class="card"><h3>${esc(pair(a.name??a.label,T)||itemID(a))}</h3><code class="mg-id">${esc(itemID(a))}</code>${object(a.coverage).discovery==='declared-only'?`<p>${esc(T('Declared only · integration pending','Chỉ mới khai báo · chờ tích hợp'))}</p>`:''}<p>${esc(pair(a.category??a.area,T))}</p><button class="btn small ghost" type="button" data-mg-open="activity" data-mg-id="${esc(text(a.kind)+':'+itemID(a))}">${esc(T('Facts, usage and reports','Thông tin, lượt chơi và báo cáo'))}</button></article>`).join('')}</div>`:empty(T,'The catalogue service has not returned activity entries. You can inspect a known activity ID above.','Dịch vụ danh mục chưa trả về hoạt động. Có thể nhập mã hoạt động đã biết ở trên.')}`;
}
function renderActivity(data:Row,T:ManagementOptions['T']):string {
  const a=object(data.activity??data.catalogue??data.item), availability=object(data.availability);
  const facts=[[T('Stable ID','Mã ổn định'),itemID(a)||text(data.id)],[T('Category','Nhóm'),pair(a.category??a.area,T)],[T('Source build','Phiên bản nguồn'),text(a.build??object(data.scope).build)],[T('Source commit','Mã nguồn'),text(a.sourceCommit??data.sourceCommit)]];
  const explanations=Array.isArray(availability.reasons)?availability.reasons.map(v=>pair(v,T)).filter(Boolean):[];
  const metrics=rows(data.metrics);
  return `<div class="card"><h3>${esc(pair(a.name??a.label,T)||itemID(a)||text(data.id))}</h3><dl class="mg-facts">${facts.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v||T('Not reported','Chưa báo cáo'))}</dd></div>`).join('')}</dl></div><div class="card"><h3>${esc(T('Availability and content readiness','Khả dụng và mức sẵn sàng nội dung'))}</h3>${object(data.coverage).discovery==='declared-only'?`<p class="mg-declared-only">${esc(T('Declared only: this item is not integrated into the game menu and loader. Enabling a release rule does not complete its implementation.','Chỉ mới khai báo: mục này chưa được tích hợp vào danh sách và mã tải game. Bật quy tắc phát hành không hoàn thành triển khai.'))}</p>${badge('unavailable',T)}`:badge(availability.status??'unknown',T)}${explanations.length?`<ul>${explanations.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:`<p>${esc(T('A server-side expectation is not confirmation of what an offline device has applied. Inspect Releases for the winning rule and device scope.','Dự kiến từ máy chủ không xác nhận máy ngoại tuyến đã áp dụng gì. Xem Ra mắt để biết quy tắc ưu tiên và phạm vi máy.'))}</p>`}${coverage(data.coverage,T)}<p class="note">${esc(T('Parent website descriptions must match the reviewed game source. Missing guide or recording evidence stays unavailable.','Mô tả trên trang phụ huynh phải khớp mã game đã duyệt. Bằng chứng hướng dẫn hay bản thu còn thiếu được ghi rõ.'))}</p></div>${metrics.length?`<div class="mg-grid">${metrics.map(m=>metric(m,T)).join('')}</div>`:''}${renderRelated(data,T)}`;
}
function coverage(value:unknown,T:ManagementOptions['T']):string {
  const c=object(value);if(!Object.keys(c).length)return '';
  const entries=Object.entries(c).filter(([,v])=>typeof v==='number'||typeof v==='string'||typeof v==='boolean');
  return entries.length?`<details><summary>${esc(T('Coverage evidence','Bằng chứng bao phủ'))}</summary><dl class="mg-facts">${entries.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(text(v,typeof v==='boolean'?T(v?'Yes':'No',v?'Có':'Không'):'—'))}</dd></div>`).join('')}</dl></details>`:'';
}
function renderAttention(data:Row,T:ManagementOptions['T']):string {
  const assignments=rows(data.assignments);
  const items=rows(data.items??data.attention??data.problems).map(item => { const assigned=assignments.find(a=>a.id===item.id); return assigned?{...item,owner:assigned.owner,nextAction:assigned.nextAction,followUpState:assigned.state}:item; });
  return `<div class="card"><p>${esc(T('Reports are evidence to investigate. Fixed in code, deployed and verified on an affected device are different milestones.','Báo cáo là bằng chứng để điều tra. Đã sửa trong mã, đã triển khai và đã xác minh trên máy bị ảnh hưởng là các mốc khác nhau.'))}</p></div>${items.length?items.map(a=>`<article class="card mg-attention"><div>${badge(a.status??a.state??'new',T)}${a.followUpState?` <span>${esc(T('Follow-up','Theo dõi'))}: ${badge(a.followUpState,T)}</span>`:''}</div><h3>${esc(pair(a.title??a.label??a.detail??a.note,T)||text(a.id??a.key))}</h3><p>${esc(pair(a.description??a.reason,T))}</p><dl class="mg-facts"><div><dt>${esc(T('Affected reporting devices','Máy có báo cáo bị ảnh hưởng'))}</dt><dd>${esc(numberLabel(a.affectedDevices??a.deviceCount??a.devices,T))}</dd></div><div><dt>${esc(T('Build','Phiên bản'))}</dt><dd>${esc(text(a.build??a.fixedIn,T('Not yet confirmed','Chưa xác nhận')))}</dd></div><div><dt>${esc(T('Owner / next action','Phụ trách / bước tiếp theo'))}</dt><dd>${esc([pair(a.owner,T),a.nextAction==='review'?T('Review report','Xem báo cáo'):pair(a.nextAction,T)].filter(Boolean).join(' · ')||T('Awaiting triage','Chờ phân loại'))}</dd></div></dl>${a.activityId||object(a.where).game?`<button class="btn small ghost" type="button" data-mg-open="activity" data-mg-id="${esc(a.activityId??object(a.where).game)}">${esc(T('Open activity evidence','Xem bằng chứng hoạt động'))}</button>`:''}<code class="mg-id">${esc(text(a.id??a.key))}</code></article>`).join(''):empty(T,'No report matches this scope. This does not establish that every device is error-free.','Không có báo cáo phù hợp phạm vi này. Điều này không chứng minh mọi máy đều không có lỗi.')}`;
}
function renderRelated(data:Row,T:ManagementOptions['T']):string {
  const issues=rows(data.issues??data.problems),devices=rows(data.devices);
  return `${issues.length?`<div class="card"><h3>${esc(T('Related reports','Báo cáo liên quan'))}</h3>${issues.map(i=>`<p>${badge(i.status,T)} ${esc(text(i.detail??i.title??i.note??i.key))}</p>`).join('')}</div>`:''}${devices.length?`<div class="card"><h3>${esc(T('Reporting devices','Máy gửi báo cáo'))}</h3>${devices.map(d=>`<button class="btn small ghost" type="button" data-mg-open="device" data-mg-id="${esc(deviceID(d))}">${esc(text(d.label,deviceID(d)))}</button>`).join('')}</div>`:''}`;
}
function renderRelease(data:Row,T:ManagementOptions['T']):string {
  const r=object(data.release??data),checks=rows(r.checks??data.checks),metrics=rows(data.metrics);
  return `<div class="card"><h3>${esc(text(r.build??object(data.scope).build,T('Selected release','Phiên bản đã chọn')))}</h3><dl class="mg-facts"><div><dt>${esc(T('Source commit','Mã nguồn'))}</dt><dd>${esc(text(r.sourceCommit,T('Not recorded','Chưa ghi nhận')))}</dd></div><div><dt>${esc(T('Deployment evidence','Bằng chứng triển khai'))}</dt><dd>${esc(text(r.deployId??r.deploymentId,T('Not recorded','Chưa ghi nhận')))}</dd></div></dl><p>${esc(T('This view assembles evidence. It does not deploy, change the version or replace the owner’s approval.','Trang này tập hợp bằng chứng. Không triển khai, đổi phiên bản hay thay thế phê duyệt của chủ sở hữu.'))}</p></div>${checks.length?`<div class="card"><h3>${esc(T('Checks','Kiểm tra'))}</h3>${checks.map(c=>`<p>${badge(c.status,T)} ${esc(text(c.name??c.id))}${c.note?` — ${esc(pair(c.note,T))}`:''}</p>`).join('')}</div>`:empty(T,'No CI or deployment evidence has been attached to this build. Missing evidence is not a pass.','Chưa gắn bằng chứng CI hay triển khai cho phiên bản này. Thiếu bằng chứng không phải là đạt.')} ${metrics.length?`<div class="mg-grid">${metrics.map(m=>metric(m,T)).join('')}</div>`:''}${renderRelated(data,T)}`;
}
function renderOperations(data:Row,T:ManagementOptions['T']):string {
  const services=rows(data.services??data.items),jobs=rows(data.jobs),operations=rows(data.operations),feeds=object(data.feeds);
  const names:Record<string,[string,string]>={database:['Management database','Cơ sở dữ liệu quản lý'],githubRead:['GitHub workflow feed','Nguồn tác vụ GitHub'],githubDispatch:['GitHub dispatch access','Quyền yêu cầu chạy GitHub'],netlifyRead:['Netlify deployments','Triển khai Netlify'],voiceGeneration:['Azure voice catalogue','Danh mục giọng Azure'],managementEvents:['Game evidence ingestion','Tiếp nhận bằng chứng game'],configurationReceipts:['Configuration acknowledgements','Xác nhận cấu hình']};
  return `<div class="card"><p>${esc(T('Provider checks are read-only. A successful voice-catalogue lookup does not prove paid generation access. Workflow acceptance and completed outcomes are recorded separately.','Kiểm tra nhà cung cấp chỉ đọc. Đọc được danh mục giọng không chứng minh quyền tạo giọng trả phí. Việc nhận yêu cầu chạy và kết quả hoàn tất được ghi riêng.'))}</p></div><div class="mg-grid">${services.map(s=>`<article class="card"><h3>${esc(names[text(s.id)]?T(...names[text(s.id)]):pair(s.id,T))}</h3>${badge(s.status,T)}<p class="note">${esc(T('Last checked','Kiểm tra gần nhất'))}: ${esc(dateLabel(s.observedAt,T))}</p>${s.errorCode?`<p>${esc(text(s.errorCode))}</p>`:''}</article>`).join('')}</div>${Object.keys(feeds).length?`<div class="card"><h3>${esc(T('Feed freshness and quotas','Độ mới và hạn mức nguồn'))}</h3>${Object.entries(feeds).map(([name,v])=>{const f=object(v),q=object(f.quota);return `<p><strong>${esc(name)}</strong>: ${badge(f.status,T)} · ${esc(dateLabel(f.sourceAsOf,T))} · ${esc(T('API quota remaining','Hạn mức API còn lại'))}: ${esc(q.status==='observed'?numberLabel(q.remaining,T)+' / '+numberLabel(q.limit,T):T('Unavailable','Chưa có số liệu'))}</p>`;}).join('')}</div>`:''}${jobs.length?`<div class="card"><h3>${esc(T('Recent provider runs','Tác vụ nhà cung cấp gần đây'))}</h3>${jobs.map(j=>`<p>${badge(j.state??j.status,T)} <strong>${esc(text(j.provider))}</strong> ${esc(text(j.kind))} · <code>${esc(text(j.id))}</code> · ${esc(T('Attempt','Lần chạy'))} ${esc(numberLabel(j.attempt,T))}<br><span class="note">${esc(dateLabel(j.startedAt,T))} · ${esc(text(j.sourceCommit))}</span></p>`).join('')}</div>`:empty(T,'No observed provider runs are available. This does not prove that no jobs ran.','Chưa có tác vụ nhà cung cấp được quan sát. Điều này không chứng minh không có tác vụ đã chạy.')}<div class="card"><h3>${esc(T('Recorded operator requests','Yêu cầu người vận hành đã ghi'))}</h3><p class="note">${esc(T('An uncertain dispatch is never automatically submitted again. A matching provider run ID is needed to confirm its progress.','Yêu cầu chưa rõ kết quả không bao giờ được gửi lại tự động. Cần mã tác vụ khớp từ nhà cung cấp để xác nhận tiến trình.'))}</p>${operations.length?operations.map(o=>`<p>${badge(o.status,T)} <code>${esc(text(o.operationId))}</code> · ${esc(text(o.kind))}<br>${esc(T('Provider run','Tác vụ nhà cung cấp'))}: <code>${esc(text(o.runId,T('Unconfirmed','Chưa xác nhận')))}</code> · ${esc(dateLabel(o.observedAt,T))}</p>`).join(''):`<p>${esc(T('No recorded requests in the connected history.','Chưa có yêu cầu được ghi trong lịch sử đã kết nối.'))}</p>`}</div>`;
}

function renderChildren(data:Row,T:ManagementOptions['T']):string {
  const kids=rows(data.children??data.items);
  return `<div class="card"><p>${esc(T('Each row is a child profile on one reporting device. Equal names on different devices are not merged into one person.','Mỗi dòng là hồ sơ bé trên một máy có báo cáo. Tên giống nhau trên máy khác không bị gộp thành một người.'))}</p><p class="note">${esc(T('Eligible profile/device pairs','Cặp hồ sơ và máy phù hợp'))}: ${esc(numberLabel(data.total??kids.length,T))}</p></div>${kids.length?`<div class="mg-grid">${kids.map(k=>{
    const games=rows(k.games),starts=games.reduce((sum,g)=>sum+(finite(g.started)||0),0),completed=games.reduce((sum,g)=>sum+(finite(g.completed)||0),0);
    return `<article class="card mg-child-row"><h3>${esc(text(k.name,T('Name not reported','Chưa báo cáo tên')))}</h3><p><strong>${esc(T('Device','Thiết bị'))}:</strong> ${esc(text(k.deviceLabel,k.deviceId?text(k.deviceId):T('Not reported','Chưa báo cáo')))}</p><code class="mg-id">${esc(text(k.deviceId))} · ${esc(text(k.profileId))}</code><dl class="mg-facts"><div><dt>${esc(T('Age group','Nhóm tuổi'))}</dt><dd>${esc(k.age==='big'?T('5–8','5–8 tuổi'):k.age==='little'?T('Under 5','Dưới 5 tuổi'):T('Not reported','Chưa báo cáo'))}</dd></div><div><dt>${esc(T('Reported play','Thời gian chơi báo cáo'))}</dt><dd>${esc(numberLabel(k.mins,T))} ${esc(T('minutes','phút'))}</dd></div><div><dt>${esc(T('Started / completed participations','Lượt tham gia bắt đầu / hoàn thành'))}</dt><dd>${starts} / ${completed}</dd></div></dl><p class="note">${esc(T('Build','Phiên bản'))}: ${esc(text(k.build))} · ${esc(T('Last play date','Ngày chơi gần nhất'))}: ${esc(text(k.last))}</p><button class="btn small ghost" type="button" data-mg-open="device" data-mg-id="${esc(text(k.deviceId))}">${esc(T('Open this device','Mở máy này'))}</button></article>`;
  }).join('')}</div>`:empty(T,'No reported child profiles match this scope. Name reporting may be off on the device.','Chưa có hồ sơ bé phù hợp phạm vi này. Máy có thể đang tắt báo cáo tên.')}${data.nextCursor?`<button class="btn" type="button" data-mg-cursor="${esc(data.nextCursor)}">${esc(T('Next children and devices','Các bé và máy tiếp theo'))}</button>`:''}`;
}
function renderChanges(data:Row,T:ManagementOptions['T'],can?:ManagementOptions['can']):string {
  const changes=rows(data.changes??data.items), capability=object(data.capability??data.capabilities);
  const configured=capability.configured===true||data.configured===true;
  return `<div class="card"><h3>${esc(T('Saved, available and applied are separate','Đã lưu, đã có trên mạng và đã áp dụng là các trạng thái khác nhau'))}</h3><p>${esc(T('This history shows revisioned configuration evidence. A device without an application receipt stays unconfirmed. No action here edits children’s saved progress.','Lịch sử này hiện bằng chứng cấu hình theo phiên bản. Máy chưa có biên nhận áp dụng vẫn là chưa xác nhận. Không thao tác nào ở đây sửa tiến trình đã lưu của các con.'))}</p>${configured?'':`<p class="note">${esc(T('The transactional configuration service is not configured. Existing live settings remain available through their current pages.','Chưa cấu hình dịch vụ cấu hình có giao dịch. Cài đặt trực tiếp hiện có vẫn dùng qua các trang hiện tại.'))}</p>`}${can?.('edit')||can?.('releases')?`<p class="note">${esc(T('The advanced editor requires configuration permission and the matching content or release permission. Once activated, revisioned changes are saved here.','Trình sửa nâng cao cần quyền cấu hình và quyền nội dung hoặc ra mắt tương ứng. Sau khi kích hoạt, thay đổi theo phiên bản được lưu tại đây.'))}</p>`:''}</div>${changes.length?changes.map(c=>`<article class="card"><h3>${esc(text(c.reason??c.id??c.changeId))}</h3>${badge(c.state??c.status,T)}<dl class="mg-facts"><div><dt>${esc(T('Scope / revision','Phạm vi / phiên bản cấu hình'))}</dt><dd>${esc(text(c.scopeKey??c.scope))} · ${esc(text(c.revision))}</dd></div><div><dt>${esc(T('Available online','Có trên mạng'))}</dt><dd>${esc(dateLabel(c.availableAt,T))}</dd></div><div><dt>${esc(T('Confirmed / eligible devices','Máy xác nhận / máy phù hợp'))}</dt><dd>${esc(numberLabel(c.appliedDevices??c.confirmed??c.applied,T))} / ${esc(numberLabel(c.eligibleDevices??c.eligible??c.eligibleCount,T))}</dd></div><div><dt>${esc(T('Unconfirmed devices','Máy chưa xác nhận'))}</dt><dd>${esc(numberLabel(c.unconfirmed,T))}</dd></div></dl></article>`).join(''):empty(T,'No revisioned change history is available for this scope.','Chưa có lịch sử thay đổi theo phiên bản cấu hình cho phạm vi này.')}`;
}
