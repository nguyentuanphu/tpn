// What the game keeps on the device for each child (owner, 16 Oct AEDT: TypeScript, batch 3). Moved from the JSDoc
// typedef in js/state.js with the same fields; the parts older saves vary in stay loose (any) until the strict pass.
// Type notes only (`import type`): nothing here reaches a phone.

export type Age = 'little' | 'big';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** a child's profile (one per child on this device), as js/state.ts normalizeProfile makes every saved one */
export interface Profile {
  /** Existing local unlock/progress fields; item availability never changes these. */
  admin?: boolean; unlockAll?: boolean; wins?: Record<string,number>; taleReads?: Record<string,number>; tales?: Record<string,boolean>;
  id: string; name: string; photo: string | null; age: Age; difficulty: Difficulty; gameDiff?: Record<string, Difficulty>;
  look: Record<string, any>; created: number; levels?: Record<string, number>; pos?: any; screen?: 'simple' | 'valley';
  /** the backpack: item id → how many */
  inv?: Record<string, number>;
  /** owned things: hats, gliders, clothes, wrapped gift boxes (Round V, r79) */
  owned?: { hats?: string[]; gliders?: number[]; gifts?: string[]; [k: string]: any };
  [k: string]: any;
}

/** the shared farm: coins, crops, animals, pets and daily jobs belong to everyone on the device */
export interface Farm { coins: number; plots: any[]; seeds: Record<string, number>; basket: Record<string, number>; [k: string]: any }

/** the device's settings (js/state.ts): the grown-ups' choices and the device's own state; the many fields added
 * over the rounds stay loose (any) until the strict pass */
export interface Settings {
  lang: 'en' | 'vi'; currency: string; curPinned: boolean; sound: boolean; music: boolean; voice: boolean; tapSounds: boolean;
  bilingual: boolean; quality: string; online: boolean;
  /** whether male voice recordings are downloaded and used (off by default; female voices are used for all characters) */
  voiceMale?: boolean;
  /** Optional public prerecorded Vietnamese provider; female remains the default. */
  voiceViVariant?: 'standard' | 'leminh';
  /** Private grown-up-authored questions: device storage/save copy only. */
  familyQuiz?: import('../js/content/family-quiz.js').FamilyQuestion[];
  /** optional family code (XXXX-XXXX) linking a family's devices for anonymous Studio device-count statistics only */
  familyCode?: string;
  /** family missions done: mission id → child id → when (ms) */
  missionsDone?: Record<string, Record<string, number>>;
  [k: string]: any;
}
