// Paint the Welcome shell before importing the world. Keep recovery reachable even if an import fails.
const shell = document.getElementById('boot');
// No optional module is fetched by the launch shell. The consented controller listens later.
const managementNotice=(eventName,data={})=>{try{dispatchEvent(new CustomEvent('sv-management-notice',{detail:{eventName,data}}));}catch{}};
const words = [
  ['Welcome to Sparkle Valley', 'Chào mừng đến Thung Lũng Lấp Lánh'],
  ['Opening the game…', 'Đang mở trò chơi…'],
  ['The game could not finish loading. Check your connection and try again.', 'Trò chơi chưa tải xong. Kiểm tra kết nối rồi thử lại nhé.'],
  ['Try again', 'Thử lại'],
  ['A new update is available. Your progress stays saved.', 'Có bản cập nhật mới. Tiến trình của con vẫn được lưu.'],
  ['Update now', 'Cập nhật'],
  ['Sparkle Valley is open in another tab or window, so this one has stopped to keep your progress safe.', 'Thung Lũng Lấp Lánh đang mở ở một thẻ hoặc cửa sổ khác, nên thẻ này dừng lại để giữ tiến trình của con.'],
  ['Play here', 'Chơi ở đây']
];
let lang = 'en'; try { lang = JSON.parse(localStorage.getItem('sv2_settings') || '{}').lang === 'vi' ? 'vi' : 'en'; } catch {}
const text = words.map(pair => pair[lang === 'vi' ? 1 : 0]);
shell.querySelector('h1').textContent = text[0]; shell.querySelector('p').textContent = text[1];
window.svLaunchProgress = (value, total, label) => {
  let meter = document.querySelector('.launch-progress');
  if (!meter) { meter = document.createElement('div'); meter.className = 'launch-progress'; meter.innerHTML = '<progress></progress><span role="status"></span>'; (document.querySelector('.screen.title, .bootwait') || shell).appendChild(meter); }
  meter.querySelector('progress').max = total; meter.querySelector('progress').value = value;
  meter.querySelector('span').textContent = label;
  if (value >= total) meter.remove();
};
// (owner point 10) the notice never sits over an activity: it waits while a game, talk, story or film is open (it had
// covered a game's close button), and shows again when the child is back in the valley
const busy = () => { const g = window.__sv; return !!(g?.heroes?.length && (g.paused || document.querySelector('.gl, .dialog, .storybook, .theatre'))); };
// (third AI's review R4) Studio's switch is known from the first second: until the game's own switch reader is ready
// (js/main.js, after the valley is built), this page reads content/custom.json itself
// (r81 Studio live) a live Defaults section kept on this device (js/custom.js, sv2_live) wins over custom.json, as in the game
let noticeOff = false;
const liveFeatures = (() => { try { const f = JSON.parse(localStorage.getItem('sv2_live') || '{}')?.content?.features; return f && typeof f === 'object' ? f : null; } catch (e) { return null; } })();
if (liveFeatures) noticeOff = liveFeatures.explain_updateNotice === false;
else fetch('content/custom.json', { cache: 'no-store' }).then(r => r.json()).then(j => { noticeOff = j?.features?.explain_updateNotice === false; }).catch(() => { });
window.svOfferUpdate = (needed = false) => {
  // (owner, 16 Oct) Studio can turn the notice off: the new version then starts the next time the game is opened.
  // (review R3) Not when a part of the game has already gone after a deploy (svModuleGone): this tab cannot go on
  // without the update, so it is offered even with the switch off
  const off = window.svFeatureOn ? !window.svFeatureOn('explain_updateNotice', true) : noticeOff;
  if (off && !needed) return;
  if (document.querySelector('.update-notice')) return;
  const n = document.createElement('aside'); n.className = 'update-notice'; n.setAttribute('role', 'status');
  const label = document.createElement('span'); label.textContent = text[4];
  const button = document.createElement('button'); button.textContent = text[5];
  button.onclick = async () => { const g = window.__sv; if (busy()) { label.textContent = lang === 'vi' ? 'Đóng hoạt động trước khi cập nhật nhé.' : 'Close the activity before updating.'; return; } g?.save?.(); const reg = await navigator.serviceWorker?.getRegistration(); if (reg?.waiting) { navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true }); reg.waiting.postMessage({ type: 'SKIP_WAITING' }); } else location.reload(); };
  const close = document.createElement('button'); close.textContent = '×'; close.setAttribute('aria-label', lang === 'vi' ? 'Để sau' : 'Later'); close.onclick = () => { clearInterval(watch); n.remove(); };
  n.append(label, button, close); document.body.appendChild(n); n.hidden = busy();
  const watch = setInterval(() => { if (!n.isConnected) return clearInterval(watch); const b = busy(); if (n.hidden !== b) { n.hidden = b; if (!b) label.textContent = text[4]; } }, 500);
};
// (owner point 10) a newer tab took over (js/state.js): this one stops and offers to play here, which reloads the newest save
addEventListener('sv-held', () => {
  const g = window.__sv; if (g) g.paused = true; document.querySelector('.update-notice')?.remove();
  const n = document.createElement('div'); n.className = 'tab-held'; n.setAttribute('role', 'alertdialog'); n.setAttribute('aria-modal', 'true');
  const card = document.createElement('div'), p = document.createElement('p'), b = document.createElement('button');
  p.textContent = text[6]; b.textContent = text[7]; b.onclick = () => location.reload();
  card.append(p, b); n.append(card); document.body.appendChild(n); b.focus();
});
// The complete offline save starts after main finishes building the valley (below).
// (r80, owner 17 Oct AEDT: "users must have the latest r") a new version takes over as soon as it is saved (sw.js). Before
// a child has started playing (the start screens) the game reloads into it at once; while playing, the notice offers
// it (or, with Studio's switch off, it starts the next time). A game coming back to the screen (a Home Screen app is
// mostly resumed, not opened) and an open one every 30 minutes ask the website for a newer version (svUpdateGap: the
// shortest time between two asks, set by the check).
const playing = () => !!window.__sv?.heroes?.length;
window.svWatchUpdates = reg => {
  let updateAttempt = false;
  const beginUpdate = () => { if (!updateAttempt) {updateAttempt=true;managementNotice('update.started');} };
  const updateOutcome = (outcome,reasonCode='none') => { if(updateAttempt)managementNotice('update.result',{outcome,reasonCode}); updateAttempt=false; };
  let had = !!navigator.serviceWorker.controller; // (the very first visit: nothing to update from, only the next time)
  if (reg.waiting) { beginUpdate(); if (playing()) window.svOfferUpdate(); else reg.waiting.postMessage({ type: 'SKIP_WAITING' }); }
  reg.addEventListener('updatefound', () => { beginUpdate(); const next = reg.installing; next?.addEventListener('statechange', () => { if (next.state === 'redundant') updateOutcome('failed','invalid'); if (next.state === 'installed' && navigator.serviceWorker.controller && playing()) window.svOfferUpdate(); }); });
  navigator.serviceWorker.addEventListener('controllerchange', () => { updateOutcome('success'); const was = had; had = true; if (!was) return; if (playing()) window.svOfferUpdate(); else location.reload(); });
  let last = Date.now(); const check = force => { if (!force && Date.now() - last < (window.svUpdateGap ?? 60000)) return; last = Date.now(); reg.update().catch(() => { }); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
  addEventListener('online', () => check());
  setInterval(() => check(true), 30 * 60000);
};
// (owner point 11, #140 #141 #184-#193) a part of the game that loads later (a story's film, a festival's decorations)
// can be gone: this page is an older version whose files were replaced since it opened. Offer the update instead of a
// broken activity. Code that catches its own import failure passes it here too.
window.svModuleGone = e => { if (/import.*module|module.*fetch|module script/i.test(String(e?.message || e))) { window.svOfferUpdate(true); return true; } return false; };
addEventListener('unhandledrejection', e => window.svModuleGone(e.reason));
await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
try { await import('./main.js'); }
catch (error) {
  managementNotice('boot.failed', {stage:'boot',reasonCode:/import.*module|module.*fetch|module script/i.test(String(error?.message || error))?'resource_missing':'exception'});
  console.error(error); document.body.appendChild(shell); shell.hidden = false; shell.querySelector('p').textContent = text[2];
  shell.querySelector('progress').removeAttribute('value'); const retry = document.createElement('button'); retry.textContent = text[3]; retry.onclick = () => location.reload(); shell.appendChild(retry);
}

// Save the complete offline game after startup, so optional chunks do not compete with it.
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !/localhost|127\.0\.0\.1/.test(location.hostname)) {
  navigator.serviceWorker.register('sw.js').then(reg => window.svWatchUpdates(reg)).catch(() => {});
}
