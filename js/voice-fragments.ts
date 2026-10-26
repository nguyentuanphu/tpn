import { partText } from './packhash.js';
import { viRuns } from './viwords.js';

export type VoiceFragment = { lang: 'en' | 'vi'; text: string; pauseAfter: number };

const punctuationPause = (text: string) => /[.!?…]/.test(text) ? 350 : /[,;:]/.test(text) ? 180 : 40;

/** The recorder and player use the same words and pauses for Vietnamese inside an English line. */
export function mixedVoiceFragments(text: string): VoiceFragment[] | null {
  const runs = viRuns(text) as Array<['en' | 'vi', string]>;
  if (!runs.some(([lang]) => lang === 'vi')) return null;
  const fragments: VoiceFragment[] = [];
  for (const [lang, raw] of runs) {
    const spoken = partText(raw) || (/\d/.test(raw) ? raw.replace(/^[\s.,!?:;…'"“”()\-–—]+/, '').trim() : '');
    const leading = raw.match(/^[^\p{L}\d]*/u)?.[0] || '';
    const previous = fragments.at(-1);
    if (previous && /[.!?…,;:]/.test(leading)) previous.pauseAfter = punctuationPause(leading);
    if (!spoken) continue;
    const trailing = raw.match(/[^\p{L}\d]*$/u)?.[0] || '';
    fragments.push({ lang, text: spoken, pauseAfter: punctuationPause(trailing) });
  }
  if (!fragments.some(fragment => fragment.lang === 'vi')) return null;
  fragments[fragments.length - 1].pauseAfter = 0;
  return fragments;
}
