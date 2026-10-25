import { releaseOn, liveRule } from '../custom.js';
import { testerLevel } from './tester.js';

export const fruitPreviewAllowed = (modeOn: boolean, previewOn: boolean, tester: boolean) => modeOn || previewOn && tester;
export function fruitParadeAvailable(mode: 'single' | 'multi') {
  let device = '';try { device = localStorage.getItem('sv2_playerid') || ''; } catch { /* Non-browser catalogue checks. */ }
  return fruitPreviewAllowed(releaseOn(`sparkleFruitParade_${mode}`, false), releaseOn('sparkleFruitParade_tester', false), !!testerLevel(releaseOn('tester', false), liveRule('tester'), device));
}
