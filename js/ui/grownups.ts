// Grown-ups (split from js/ui.ts, v1.07): the settings and the recorder load js/ui-settings.js when opened.
import { settings } from '../state.js';
// ---------- Grown-ups: the recorded voices at a glance ----------
// Recorded (offline) voices always play first; the phone's own voice is used only for a line with no recording.
// Those lines are counted here and travel in the backup file, so Sparkle Studio can record them.
// Grown-ups is optional at startup; repeated taps share the first load.
let settingsRequest: Promise<void> | null = null;
export function openGrownups(after?: () => void): Promise<void> {
  if (settingsRequest || document.querySelector('.modal.grownups:not(.out)')) return settingsRequest || Promise.resolve();
  settingsRequest = import('../ui-settings.js').then(m => m.openGrownups(after)).catch(error => { window.svModuleGone?.(error); after?.(); }).finally(() => { settingsRequest = null; });
  return settingsRequest;
}
// ---------- grown-ups record the game's most-used lines (one at a time, with a level meter) ----------
// Recording controls use the same optional settings module.
export function openRecorder(after?: () => void): Promise<void> {
  return import('../ui-settings.js').then(m => m.openRecorder(after)).catch(error => { window.svModuleGone?.(error); after?.(); });
}
