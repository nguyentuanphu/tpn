/** Keep an installed game's picture alive after the browser suspends its window. */
export function mountRenderRecovery(options: {
  canvas: HTMLCanvasElement;
  lost(): boolean;
  restore(): void;
  refresh(): void;
  save(): void;
  show(retry: () => void): void;
  hide(): void;
  reload(): void;
}) {
  let restoreTimer: ReturnType<typeof setTimeout> | undefined;
  let restoring = false;
  const clear = () => { clearTimeout(restoreTimer); restoreTimer = undefined; };
  const retry = () => { options.save(); options.reload(); };
  const recover = () => {
    if (document.hidden) return;
    // Resume the frame clock even when WebGL did not send a context-loss event.
    options.refresh();
    if (!options.lost()) { restoring = false; clear(); options.hide(); return; }
    options.show(retry);
    if (!restoring) {
      restoring = true;
      // The loss event must finish before WEBGL_lose_context can restore it.
      restoreTimer = setTimeout(() => {
        restoreTimer = undefined;
        if (!document.hidden && options.lost()) { try { options.restore(); } catch { /* The visible retry remains available. */ } }
      }, 0);
    }
  };
  const lost = (event: Event) => {
    event.preventDefault(); options.save(); restoring = false; clear(); recover();
  };
  const restored = () => { restoring = false; clear(); options.hide(); if (!document.hidden) options.refresh(); };
  const visibility = () => {
    if (document.hidden) { options.save(); clear(); restoring = false; }
    else recover();
  };
  const pagehide = () => { options.save(); clear(); restoring = false; };
  options.canvas.addEventListener('webglcontextlost', lost);
  options.canvas.addEventListener('webglcontextrestored', restored);
  document.addEventListener('visibilitychange', visibility);
  addEventListener('pageshow', recover);
  addEventListener('pagehide', pagehide);
  return () => {
    clear(); options.canvas.removeEventListener('webglcontextlost', lost);
    options.canvas.removeEventListener('webglcontextrestored', restored);
    document.removeEventListener('visibilitychange', visibility);
    removeEventListener('pageshow', recover); removeEventListener('pagehide', pagehide);
  };
}
