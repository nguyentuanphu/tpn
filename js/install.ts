// "Add to Home Screen": one tap on Android / Chrome / Edge (the browser's own install prompt),
// a picture guide on iPhone / iPad (Apple does not let web pages install themselves).
import { T } from './i18n.js';
import { el } from './util.js';
import { pic } from './art.js';
import { modal } from './popups.js';
import { INSTALL_CONFIRMATION_KEY, INSTALL_REMINDER_HIDDEN_KEY, installEvidence, combineInstallEvidence, standaloneDisplay, type InstallEvidence } from './content/install-state.js';

interface InstallPromptEvent extends Event { prompt(): Promise<unknown>; userChoice: Promise<{outcome: string}> }
declare global { interface WindowEventMap { beforeinstallprompt: InstallPromptEvent } }
let deferred: InstallPromptEvent | null = null, prompting = false;
const listeners: (() => void)[] = [];
const notify = () => [...listeners].forEach(f => f());
const saved = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
let confirmed: InstallEvidence = installEvidence(saved(INSTALL_CONFIRMATION_KEY));
export const isStandalone = () => standaloneDisplay(navigator.standalone, matchMedia('(display-mode: standalone)').matches, matchMedia('(display-mode: minimal-ui)').matches);
const observeInstall = (evidence: InstallEvidence) => {
  const next = combineInstallEvidence(confirmed, evidence), changed = next !== confirmed;
  confirmed = next;
  try { localStorage.setItem(INSTALL_CONFIRMATION_KEY, next); } catch {}
  if (changed) dispatchEvent(new CustomEvent('sv-install-observed', { detail: { evidence: next } }));
  notify();
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; notify(); });
window.addEventListener('appinstalled', () => { deferred = null; observeInstall('native'); });
const detectStandalone = () => { if (isStandalone()) observeInstall('standalone'); };
for (const mode of ['standalone', 'minimal-ui']) { const q = matchMedia(`(display-mode: ${mode})`); q.addEventListener?.('change', detectStandalone); }
addEventListener('pageshow', detectStandalone);
if (isStandalone()) observeInstall('standalone');

const ua = navigator.userAgent;
const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);

// Existing sv-installed flags were set on prompt acceptance, which is not proof; do not trust them.
export const isInstalled = () => !!installEvidence(confirmed, isStandalone());
export const canOfferInstall = () => !isInstalled() && location.protocol.startsWith('http');
export const onInstallChange = (f: () => void) => { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i >= 0) listeners.splice(i, 1); }; };
let hiddenForPage = saved(INSTALL_REMINDER_HIDDEN_KEY) === '1';
const reminderHidden = () => hiddenForPage || saved(INSTALL_REMINDER_HIDDEN_KEY) === '1';

const SHARE_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1a73e8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
const PLUS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>`;
const DOTS_SVG = `<svg width="26" height="26" viewBox="0 0 24 24" fill="#333"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`;

function guide() {
  if (document.querySelector('.installguide:not(.out)')) return;
  const steps = isIOS ? [
    [SHARE_SVG, T('Tap the Share button', 'Bấm nút Chia sẻ'), T('At the bottom of Safari (top right on iPad).', 'Ở cuối màn hình Safari (góc trên bên phải trên iPad).')],
    [PLUS_SVG, T('Choose “Add to Home Screen”', 'Chọn “Thêm vào MH chính”'), T('Scroll down the list if you can’t see it.', 'Kéo danh sách xuống nếu chưa thấy.')],
    [`<b style="font-size:20px;color:#1a73e8">${T('Add','Thêm')}</b>`, T('Tap “Add”', 'Bấm “Thêm”'), T('Then open the game from its home-screen icon.', 'Rồi mở trò chơi từ biểu tượng trên màn hình chính.')]
  ] : isAndroid ? [
    [DOTS_SVG, T('Tap the ⋮ menu', 'Bấm menu ⋮'), T('Top right of the browser.', 'Góc trên bên phải trình duyệt.')],
    [PLUS_SVG, T('Choose “Install app” or “Add to Home screen”', 'Chọn “Cài đặt ứng dụng” hoặc “Thêm vào màn hình chính”'), ''],
    ['<b style="font-size:20px;color:#1a73e8">OK</b>', T('Tap “Install”', 'Bấm “Cài đặt”'), T('Then open it from your home screen.', 'Rồi mở từ màn hình chính.')]
  ] : [
    [PLUS_SVG, T('Click the install icon', 'Bấm biểu tượng cài đặt'), T('In the address bar (Chrome / Edge), or the browser menu → “Install Sparkle Valley”.', 'Trên thanh địa chỉ (Chrome / Edge), hoặc menu trình duyệt → “Cài đặt Sparkle Valley”.')],
    ['<b style="font-size:20px;color:#1a73e8">OK</b>', T('Click “Install”', 'Bấm “Cài đặt”'), T('Then open it from its own app icon.', 'Rồi mở từ biểu tượng ứng dụng riêng.')]
  ];
  const m = modal('installguide', `
    <h2>${T('Put Sparkle Valley on your home screen', 'Đưa Thung Lũng Lấp Lánh ra màn hình chính')}</h2>
    <p class="ig-why">${T('Open from its icon. Play offline after the download finishes.', 'Mở từ biểu tượng. Chơi ngoại tuyến khi tải xong trò chơi.')}</p>
    <ol class="ig-steps">${steps.map(([icon, h, p], i) => `<li><span class="ig-n">${i + 1}</span><span class="ig-ic">${icon}</span><span><b>${h}</b>${p ? `<small>${p}</small>` : ''}</span></li>`).join('')}</ol>
    ${isIOS ? `<div class="ig-arrow" aria-hidden="true">↓</div>` : ''}
    <p class="note">${T('Stays until installed or hidden. Reopen in Grown-ups.', 'Chỉ ẩn khi đã cài hoặc bạn chọn Ẩn. Mở lại trong Người lớn.')}</p>
    <button class="btn primary wide big ig-hide">${T('Hide this reminder', 'Ẩn lời nhắc này')}</button>`);
  const game = window.__sv, wasPaused = !!game?.paused;
  if (game) game.paused = true; // A persistent covered guide must not keep drawing the full valley.
  let closed = false;
  const close = () => { if (closed) return; closed = true; unsubscribe(); m.close(); if (game) game.paused = wasPaused; };
  const unsubscribe = onInstallChange(() => { if (isInstalled()) close(); });
  m.querySelector('.ig-hide').onclick = () => { hiddenForPage = true; try { localStorage.setItem(INSTALL_REMINDER_HIDDEN_KEY, '1'); } catch {} close(); notify(); };
  // A backdrop tap or browser prompt dismissal is not an explicit request to hide this guide.

}

// Native prompt when the browser offers one, otherwise the picture guide.
export async function installApp() {
  if (prompting || isInstalled()) return;
  if (deferred) {
    const d = deferred; deferred = null; prompting = true;
    try { await d.prompt(); await d.userChoice; } catch { guide(); }
    // Acceptance starts installation; only appinstalled or an app-window launch confirms it.
    finally { prompting = false; notify(); }
    return;
  }
  guide();
}

// One listener for every install button. Closed windows and replaced title cards must not stay reachable.
const installButtons = new Set<WeakRef<HTMLButtonElement>>();
function updateInstallButtons() {
  const installed = isInstalled();
  for (const ref of installButtons) {
    const button = ref.deref();
    if (!button || !button.isConnected) { installButtons.delete(ref); continue; }
    if (installed || reminderHidden() && button.classList.contains('installchip')) { button.remove(); installButtons.delete(ref); }
  }
}
onInstallChange(updateInstallButtons);

// A small chip for the title screen and the grown-ups page.
export function installButton(cls = 'installchip'): HTMLButtonElement | null {
  if (!canOfferInstall() || cls.split(/\s+/).includes('installchip') && reminderHidden()) return null;
  const b: HTMLButtonElement = el('button', cls, `<span aria-hidden="true">${pic('📲')}</span> ${T('Add to Home Screen', 'Thêm vào màn hình chính')}`);
  b.onclick = e => { e.stopPropagation(); installApp(); };
  updateInstallButtons();
  installButtons.add(new WeakRef(b));
  return b;
}
