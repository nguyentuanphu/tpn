// (owner, 16 Oct AEDT: "explanations discrete, small but still understandable"; "all options to switch on/off one by
// one, each telling what will be switched off"; "short line and short voice both in Vietnamese and English, both
// selectable in Studio") every explanation the game gives goes through here. Each kind has two Studio switches in the
// group "Explanations and tips" (js/content/releases.js): the short note on screen and the short spoken line. An
// explanation never makes a caption box too: the note is its only text on screen.
import { featureOn } from './custom.js';
import { sayAsync } from './voice.js';
import { T } from './i18n.js';

// the kinds with a note and a voice; each id below is a Studio switch (on unless Studio turns it off)
export const EXPLAIN_KINDS = ['hearts', 'gift'];
export const noteOn = kind => featureOn(`explain_${kind}_note`, true);
export const voiceOn = kind => featureOn(`explain_${kind}_voice`, true);

/**
 * Explain something briefly: a short note in the player's HUD and a short spoken line, each only if Studio allows.
 * @param {{ toast?: (s: string, o?: object) => void } | null | undefined} hud the player's HUD (the note shows there)
 * @param {string} kind one of EXPLAIN_KINDS
 * @param {[string, string]} note the short note [en, vi] (two lines at most)
 * @param {[string, string]} [voice] the short spoken line [en, vi] (the note's words when not given)
 */
export function explain(hud, kind, note, voice = note) {
  const shown = noteOn(kind) && !!hud?.toast, spoken = voiceOn(kind);
  if (shown) hud.toast(T(...note), { explain: true });
  if (spoken) sayAsync(...voice).catch?.(() => { });
  // (for the checks and the tester's log: what was explained, and how)
  try { dispatchEvent(new CustomEvent('sv-explain', { detail: { kind, shown, spoken } })); } catch (e) { }
  return { shown, spoken };
}
