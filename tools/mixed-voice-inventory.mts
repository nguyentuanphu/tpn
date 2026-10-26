// Fixed, repository-authored fragments only. Never reads voice-extra, saves, live family content or runtime speech.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {collectLines, collectTemplates, areaOfLine, areaOfFile} from './voice-lines.mts';
import {lineHash} from '../js/packhash.js';
import {mixedVoiceFragments} from '../js/voice-fragments.js';

import {MIXED_FRAGMENT_SOURCE} from './hanoi-pack-policy.mts';
export {MIXED_FRAGMENT_SOURCE} from './hanoi-pack-policy.mts';
export type MixedFragmentRecording = {
  id: string;
  lang: 'en' | 'vi';
  text: string;
  area: string;
  part: true;
  source: string[];
  mixedFragment: typeof MIXED_FRAGMENT_SOURCE;
};
type Rename = (text: string, lang: 'en' | 'vi') => string;
const CHILD_OR_PLACEHOLDER = /\b(?:Na|Bin|Kiwi)\b|\$\{|\{[^}]*\}/;
const rank = (area: string) => area === 'core' ? 0 : area === 'world' ? 2 : 1;

/** The same name translation used by the ordinary pack must be passed explicitly by each recorder. */
export function collectMixedFragmentRecordings(rename: Rename): MixedFragmentRecording[] {
  const baseline = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../docs/fpt-leminh-full-20261025/inventory.json', import.meta.url)), 'utf8'));
  const held = new Set<string>(baseline.privacyHeld.map((line: {id: string}) => line.id));
  const result = new Map<string, MixedFragmentRecording>();
  const add = (text: string, source: string[], area: string) => {
    if (CHILD_OR_PLACEHOLDER.test(text)) return;
    const fragments = mixedVoiceFragments(text);
    if (!fragments || fragments.some(fragment => held.has(lineHash(fragment.lang, fragment.text)) || CHILD_OR_PLACEHOLDER.test(fragment.text))) return;
    for (const fragment of fragments) {
      const id = lineHash(fragment.lang, fragment.text);
      const previous = result.get(id);
      if (previous) {
        previous.source = [...new Set([...previous.source, ...source])].sort();
        if (rank(area) < rank(previous.area)) previous.area = area;
      } else result.set(id, {id, lang: fragment.lang, text: fragment.text, area, part: true,
        source: [...new Set(source)].sort(), mixedFragment: MIXED_FRAGMENT_SOURCE});
    }
  };
  for (const line of collectLines()) {
    // Reject a whole private/name-held line, before splitting: its innocuous-looking prefix is not a reviewed unit.
    if (CHILD_OR_PLACEHOLDER.test(line.en + ' ' + line.vi)) continue;
    const en = rename(line.en, 'en'), vi = rename(line.vi, 'vi');
    if (CHILD_OR_PLACEHOLDER.test(en + ' ' + vi) || held.has(lineHash('vi', vi))) continue;
    const source = line.from.split(',');
    add(en, source, areaOfLine(source, undefined));
  }
  for (const template of collectTemplates()) {
    if (template.lang !== 'en' || CHILD_OR_PLACEHOLDER.test([...template.pieces, ...template.fills.flat()].join(' '))) continue;
    // Only literal fixed pieces and literal alternatives named in source. Never substitute a variable/name gap.
    for (const text of [...template.pieces, ...template.fills.flat()])
      add(rename(text, 'en'), [template.from], areaOfFile(template.from));
  }
  return [...result.values()].sort((a, b) => a.id.localeCompare(b.id));
}
