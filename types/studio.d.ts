// Sparkle Studio's dashboard (studio/ui/app.ts; r86, owner 18 Oct 2026 AEDT: every file changed becomes TypeScript).
// The family content pack as Studio edits it (content/custom.json and the live store, netlify/lib/live.mts cleans each
// section) and what the server says about itself. Like types/save.d.ts, the parts whose shape varies by page stay loose
// (any) until the strict pass. Type notes only (`import type`): nothing here reaches a browser.

/** [English, Vietnamese] */
export type Pair = [string, string];
export type Words = { en?: string, vi?: string };
/** a release or festival rule (netlify/lib/live.mts Release, Festival) */
export type Rule = { on?: boolean, start?: string, since?: string, controlVersion?: number, days?: number, newDays?: number, devices?: string[],
  levels?: Record<string, string>, peeks?: string[], revert?: string, policies?: Record<string, { revert?: string, speed?: string, autoplay?: boolean }>, [k: string]: any };
/** a game on the Simple screen: its group, Under 5 and Hide (only what differs from the usual) */
export type Activity = { area?: string, little?: boolean, hide?: boolean };

/** content/custom.json as Studio edits it; each section is optional */
export interface StudioContent {
  message?: Words & { [k: string]: any };
  missions?: any[];
  quiz?: any[];
  tales?: any[];
  album?: any[];
  music?: any[];
  npcs?: any[];
  parked?: any[];
  names?: Record<string, Words>;
  genders?: Record<string, string>;
  faces?: Record<string, { photo?: string, skin?: string, [k: string]: any }>;
  looks?: Record<string, any>;
  plots?: Record<string, any>;
  activities?: Record<string, Activity>;
  features?: Record<string, boolean>;
  defaults?: Record<string, string | number | boolean>;
  releases?: Record<string, Rule>;
  festivals?: Record<string, Rule>;
  world?: { build?: any[], edits?: any[], land?: any[], map?: string, [k: string]: any };
  ads?: any;
  [k: string]: any;
}

/** what /studio/api/info says: online or the exe, who is signed in, settings and the game's version */
export interface StudioInfo {
  ok?: boolean; online?: boolean; version?: string; game?: string; studio?: string; settingsFile?: string;
  me?: { name?: string, role?: string, perms?: string[], [k: string]: any };
  perms?: any[]; conf?: Record<string, any>; voices?: any; waiting?: number; unpublished?: any;
  [k: string]: any;
}

/** a device in the players report (Sparkle Lab, Analytics) */
export interface StudioDevice {
  id: string; label?: string; kind?: string; os?: string; br?: string; app?: boolean; installation?: '' | 'native' | 'standalone'; installationSeen?: string; fps?: number | null; online?: boolean;
  seenAt?: string; last?: string; loc?: { city?: string, country?: string }; kids?: { name?: string }[];
  [k: string]: any;
}

/** a building kind Studio can place (js/worldedit.js BUILD_TYPES) */
export type BuildType = { icon?: string, name?: string[], home?: boolean, culture?: 'vietnam' | 'australia', [k: string]: any };

/** what Studio reads from the game opened out of sight (the Map and Memory Villages pages) */
export interface StudioGameView {
  world?: { boxes?: { x0: number, x1: number, z0: number, z1: number, room?: unknown }[], colliders?: { x: number, z: number, r: number }[] };
  interactables?: { id: string, x: number, z: number, label?: string | ((h: unknown) => string) }[];
}

declare global {
  interface Window {
    /** the game object, when the game runs in Studio's hidden frame */
    __sv?: StudioGameView;
    /** the hidden frame asks its own copy of js/world.js for the plots (Memory Villages page) */
    eval(code: string): Promise<{ PLOTS: { id: string, village?: string, address?: string[] }[] & { spareFrom?: number } }>;
  }
  /** the MP3 maker for microphone recordings (studio/ui/lame.min.js, loaded when first needed) */
  var lamejs: { Mp3Encoder: new (channels: number, rate: number, kbps: number) => { encodeBuffer(pcm: Int16Array): Int8Array, flush(): Int8Array } } | undefined;
}
