// @ts-check
// Reporting observations only: never changes game state or disables real failures.
// Browsers emit these two delivery notices when observers settle on the next frame.
// Do not suppress other ResizeObserver errors or actual exceptions.
export const resizeDeliveryNotice = (message: string): boolean => /^(?:ResizeObserver loop limit exceeded|ResizeObserver loop completed with undelivered notifications\.?)$/.test(message.trim());
// Old internal round numbers remain in storage; testers see only public versions.
export const publicFixedVersion = (version: string): string => /^v\d+(?:\.\d{2})?$/.test(version || '') ? version : version === 'r90' ? 'v1' : '';
/** @param {Element} control @param {Element | null} top */
export function unreachableControl(control: Element, top: Element | null = null) {
  if (top && !top.contains(control)) return false; // a covered/background panel
  const doc = control.ownerDocument, view = doc.defaultView;
  if (!view || !control.getClientRects().length) return false;
  const rect = control.getBoundingClientRect(), vv = view.visualViewport;
  const left = vv?.offsetLeft || 0, upper = vv?.offsetTop || 0;
  const right = left + (vv?.width || view.innerWidth), bottom = upper + (vv?.height || view.innerHeight);
  if (!rect.width || !rect.height) return false;
  let offX = rect.right < left + 2 || rect.left > right - 2;
  let offY = rect.bottom < upper + 2 || rect.top > bottom - 2;
  if (!offX && !offY) return false;
  for (let parent = control.parentElement; parent; parent = parent.parentElement) {
    const style = view.getComputedStyle(parent), box = parent.getBoundingClientRect();
    // Scrolling only makes a control reachable on the axis that actually scrolls.
    // A container itself outside the viewport cannot rescue a misplaced control.
    const intersectsX = box.right > left + 2 && box.left < right - 2;
    const intersectsY = box.bottom > upper + 2 && box.top < bottom - 2;
    if (offX && intersectsX && intersectsY && /(auto|scroll)/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth) offX = false;
    if (offY && intersectsX && intersectsY && /(auto|scroll)/.test(style.overflowY) && parent.scrollHeight > parent.clientHeight) offY = false;
  }
  return offX || offY;
}

/** @param {Document} doc */
export function activeReportPanel(doc: Document) {
  const view = doc.defaultView;
  return [...doc.querySelectorAll('.modal:not(.out), .gl:not(.out), .dialog:not(.out), .wardrobe, .audio-tray, .apbox:not(.embedded)')]
    .filter(x => x.getClientRects().length && !x.hasAttribute('hidden'))
    .sort((a,b) => (Number.parseInt(view?.getComputedStyle(a).zIndex || '') || 0) - (Number.parseInt(view?.getComputedStyle(b).zIndex || '') || 0)).pop() || null;
}

/**
 * Observe the requested activity opening, not whether a window still exists later.
 * Successful open -> immediate user close is success; another game's window isn't.
 * @param {string} gameId
 * @param {() => void} fail
 * @param {{doc?: Document, wait?: number}} options
 */
export function observeGameOpen(gameId: string, fail: () => void, { doc = document, wait = 3000 }: { doc?: Document; wait?: number } = {}) {
  const existing = new Set(doc.querySelectorAll('.gl'));
  let opened = false, done = false;
  const matches = (node: Element) => !existing.has(node) && node.matches('.gl') && node.getAttribute('data-game-id') === gameId;
  const scan = (node: Node) => {
    const isElement = (value: Node): value is Element => value.nodeType === 1;
    if (!isElement(node)) return;
    const element = node;
    if (matches(element) || [...element.querySelectorAll('.gl')].some(matches)) opened = true;
  };
  const Observer = doc.defaultView?.MutationObserver;
  if (!Observer) throw new Error('Activity observation requires a document window');
  const observer = new Observer(records => { for (const record of records) record.addedNodes.forEach(scan); });
  observer.observe(doc.body, { childList:true, subtree:true });
  const finish = () => { if (done) return; done = true; observer.disconnect(); clearTimeout(timer); };
  const timer = setTimeout(() => {
    // Also drain records if an open/close happened in the same task.
    for (const record of observer.takeRecords()) record.addedNodes.forEach(scan);
    if (!opened) doc.querySelectorAll('.gl').forEach(scan);
    finish(); if (!opened) fail();
  }, wait);
  return finish;
}
