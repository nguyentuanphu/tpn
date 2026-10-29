// r90 content opens after every original item in its category or shelf has been finished three times.
import { featureOn, itemEnabled } from '../custom.js';
import { GAME_INFO } from './activities.js';
import { SECOND_SET_GAMES, SECOND_SET_TALES, heldGame, heldTale } from './secondset.js';
export { SECOND_SET_GAMES, SECOND_SET_TALES };

type Counts = Record<string, number | undefined>;
type Flags = Record<string, boolean | undefined>;
export type UnlockProfile = {
  admin?: boolean;
  unlockAll?: boolean;
  wins?: Counts;
  taleReads?: Counts;
  tales?: Flags;
};


const SECOND_GAME_IDS = new Set(Object.values(SECOND_SET_GAMES).flat());

export const FIRST_SET_GAMES: Record<string, string[]> = {};
for (const [id, info] of Object.entries(GAME_INFO)) {
  if (SECOND_GAME_IDS.has(id)) continue;
  const area = info[0];
  (FIRST_SET_GAMES[area] ||= []).push(id);
}

export const FIRST_SET_TALES: Record<string, string[]> = {
  '🇻🇳': ['banhchung', 'sontinh', 'rongtien', 'thanhgiong', 'hoguom', 'caytre', 'duahau', 'caykhe', 'tamcam', 'sodua', 'thachsanh', 'chucuoi', 'cockien', 'vusua', 'baluoiriu', 'quabau', 'thayboi', 'nhacmeo', 'ongtao', 'cachep'],
  '🇦🇺': ['tiddalik', 'rainbowserpent', 'emu', 'dotkangaroo', 'birdcolours', 'magicpudding'],
  '🇨🇳': ['change', 'greatrace', 'maliang', 'weaver', 'nian', 'kongrong'],
  '🇮🇳': ['monkey', 'crow', 'lionrabbit', 'ganesha', 'bluejackal', 'elephantmice'],
  world: []
};


export type ProgressItem = { id: string; n: number };
export type Progress = { done: number; need: number; perGame: ProgressItem[] };

function firstSet(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return type === 'game' ? FIRST_SET_GAMES[areaOrShelf] || [] : FIRST_SET_TALES[areaOrShelf] || [];
}

function secondSet(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return type === 'game' ? SECOND_SET_GAMES[areaOrShelf] || [] : SECOND_SET_TALES[areaOrShelf] || [];
}

function overrideOn(profile: UnlockProfile): boolean {
  return featureOn('unlockAll', false) || !!profile.unlockAll || !!profile.admin;
}

export function secondSetOf(type: 'game' | 'tale', areaOrShelf: string): string[] {
  return secondSet(type, areaOrShelf).slice();
}

export function progressOf(profile: UnlockProfile, type: 'game' | 'tale', areaOrShelf: string): Progress {
  const ids = firstSet(type, areaOrShelf);
  if (overrideOn(profile) || ids.length === 0) return { done: 3, need: 3, perGame: [] };
  const wins = profile.wins || {};
  const reads = profile.taleReads || {};
  const perGame = ids.map(id => {
    const legacyRead = profile.tales?.[id] ? 1 : 0;
    const n = type === 'game' ? Number(wins[id] || 0) : Number(reads[id] || legacyRead);
    return { id, n: Math.min(3, Math.max(0, n)) };
  });
  const done = perGame.every(item => item.n >= 3) ? 3 : Math.min(2, Math.min(...perGame.map(item => item.n)));
  return { done, need: 3, perGame };
}

/** held back in Studio (New games / New stories switched off): shown as "Coming soon", never opened */
export const isHeld = (id: string, type: 'game' | 'tale'): boolean => !itemEnabled(type === 'game' ? 'game' : 'story', id) || (type === 'game' ? heldGame(id) : heldTale(id));

export function isOpen(profile: UnlockProfile, id: string, type: 'game' | 'tale', areaOrShelf: string): boolean {
  if (isHeld(id, type)) return false;
  if (overrideOn(profile)) return true;
  const sourceArea=type==='game' ? GAME_INFO[id]?.[0]||areaOrShelf : areaOrShelf;
  if (!secondSet(type, sourceArea).includes(id)) return true;
  return progressOf(profile, type, sourceArea).done >= 3;
}