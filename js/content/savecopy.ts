import { normalizeFamilyCode } from './familycode.js';

export const COPY_VERSION = 3;
export const MAX_COPY_BYTES = 32 * 1024 * 1024;

export type SaveProfile = {
  id: string;
  name: string;
  age: 'little' | 'big';
  look: Record<string, unknown>;
} & Record<string, unknown>;

export type SaveCopy = {
  app: 'sparkle-valley';
  v: 3;
  saved: number;
  device: string;
  settings: Record<string, unknown>;
  profiles: SaveProfile[];
  farm: Record<string, unknown>;
};

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const finiteNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isSensitiveSetting = (key: string) => /key|pass|token|secret/i.test(key);

function safeKeys(value: unknown, depth = 0): boolean {
  if (depth > 30) return false;
  if (Array.isArray(value)) return value.every(item => safeKeys(item, depth + 1));
  if (!object(value)) return true;
  return Object.entries(value).every(([key, item]) => !['__proto__', 'constructor', 'prototype'].includes(key) && safeKeys(item, depth + 1));
}

function validProfile(profile: unknown): profile is SaveProfile {
  if (!object(profile) || typeof profile.id !== 'string' || !profile.id || typeof profile.name !== 'string' ||
      (profile.age !== 'little' && profile.age !== 'big') || !object(profile.look)) return false;
  for (const key of ['leafies', 'shrines', 'towers', 'discovered', 'inv', 'levels', 'wins', 'quests', 'dishes', 'stats']) {
    if (profile[key] !== undefined && !object(profile[key])) return false;
  }
  if (profile.owned !== undefined && (!object(profile.owned) ||
      (profile.owned.hats !== undefined && !strings(profile.owned.hats)) ||
      (profile.owned.gliders !== undefined && (!Array.isArray(profile.owned.gliders) || !profile.owned.gliders.every(finiteNum))))) return false;
  if (profile.stickers !== undefined && !Array.isArray(profile.stickers)) return false;
  if (profile.album !== undefined && !Array.isArray(profile.album)) return false;
  return true;
}

function validFarm(farm: unknown): farm is Record<string, unknown> {
  return object(farm) && finiteNum(farm.coins) && Array.isArray(farm.plots) && object(farm.seeds) && object(farm.basket);
}

function validateCopy(data: unknown, version: 2 | 3): SaveCopy {
  if (!object(data) || !safeKeys(data) || data.app !== 'sparkle-valley' || data.v !== version ||
      !finiteNum(data.saved) || data.saved <= 0 || data.saved > Date.now() + 864e5 ||
      (version === COPY_VERSION ? (typeof data.device !== 'string' || !/^(?:[a-z0-9]{12})?$/.test(data.device)) : (data.device !== undefined && (typeof data.device !== 'string' || !/^(?:[a-z0-9]{12})?$/.test(data.device)))) ||
      !object(data.settings) || !object(data.farm) || !Array.isArray(data.profiles) || data.profiles.length > 6) throw new Error('invalid copy');
  const profiles: SaveProfile[] = [];
  for (const profile of data.profiles) {
    if (!validProfile(profile)) throw new Error('invalid profile');
    profiles.push(profile);
  }
  if (new Set(profiles.map(profile => profile.id)).size !== profiles.length) throw new Error('invalid profile');
  if (!validFarm(data.farm)) throw new Error('invalid farm');
  const cleanSettings = Object.fromEntries(Object.entries(data.settings).filter(([key]) => !isSensitiveSetting(key)));
  if (cleanSettings.familyCode !== undefined && cleanSettings.familyCode !== '') {
    const normCode = normalizeFamilyCode(cleanSettings.familyCode);
    if (!normCode) throw new Error('invalid family code');
    cleanSettings.familyCode = normCode;
  }
  return {
    app: 'sparkle-valley',
    v: COPY_VERSION,
    saved: data.saved,
    device: typeof data.device === 'string' ? data.device : '',
    settings: cleanSettings,
    profiles,
    farm: data.farm
  };
}

export function createSaveCopy(snapshot: unknown): SaveCopy {
  return validateCopy(snapshot, 2);
}

export function readSaveCopy(text: string): SaveCopy {
  if (new TextEncoder().encode(text).length > MAX_COPY_BYTES) throw new Error('too large');
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('invalid JSON'); }
  return validateCopy(data, COPY_VERSION);
}

export function readSaveCopyOrLegacy(text: string): SaveCopy {
  if (new TextEncoder().encode(text).length > MAX_COPY_BYTES) throw new Error('too large');
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('invalid JSON'); }
  if (!object(data)) throw new Error('invalid copy');
  return validateCopy(data, data.v === 2 ? 2 : COPY_VERSION);
}
