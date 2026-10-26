// What the game uses from the browser that TypeScript's own lists do not have (owner, 16 Oct AEDT: TypeScript, batch 3):
// the PeerJS library (vendor/peerjs.min.js, loaded by a script tag), the switches the checks set before the game starts,
// and the older names some phones still use. Type notes only.
export {};
declare global {
  /** the parts of the browser's speech recognition the microphone test uses (js/mictest.ts) */
  interface SvSpeechRecognition { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void;
    onresult: ((e: { results: Iterable<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: ((e: { error?: string }) => void) | null; onend: (() => void) | null }
  /** the game object the checks and the tools drive in a test browser (js/main.js); only the parts they use so far
   *  (the whole shared game object gets its own type later in the TypeScript plan) */
  type SvHero = { profile: import('../js/state.js').Profile };
  type SvThing = { id?: string, x: number, z: number, act(hero: SvHero, game: SvGame): Promise<unknown> | void };
  type SvGame = Partial<Pick<import('../js/main.js').SvMain, 'inviteGame' | 'tester' | 'screenFacts' | 'parents' | 'farm' | 'addCoins' | 'listenFriends' | 'npcs' | 'changePlayer' | 'homes' | 'scene' | 'plots' | 'getViews' | 'setView' | 'snapshot' | 'zoomBy' | 'currentQuest' | 'questTarget' | 'lanterns' | 'autoplay' | 'landBy' | 'seeThrough' | 'goodSpot' | 'gameSpot' | 'clearSpot' | 'solidsReady'>> & { heroes: import('../js/main.js').SvMain['heroes'], interactables: SvThing[], paused?: boolean, renderer?: { setPixelRatio(ratio: number): void },
    playGame?(player: number, id: string, how: string): void, openPad?(player: number, tab: string): void, _owlAuto?: boolean,
    bootTimes?: Record<string, number>,
    /** Studio's map view reads the valley's boxes and round colliders (studio/ui/app.ts) */
    world?: { boxes: { x0: number, x1: number, z0: number, z1: number, room?: unknown, [k: string]: unknown }[], colliders: { x: number, z: number, r: number }[] } };
  interface Window {
    svModuleGone?: (error: unknown) => void;
    /** the game object, for the checks and the tools (js/main.js) */
    __sv: SvGame;
    /** the checks and tools/voice-harvest.mts hear every line the game says (js/voice.ts) */
    __svVoiceLog?: (lang: string, text: string, has: boolean) => void;
    /** speech recognition, for voice control (js/mictest.ts); only whether it exists is read */
    SpeechRecognition?: new () => SvSpeechRecognition;
    webkitSpeechRecognition?: new () => SvSpeechRecognition;
    /** PeerJS, for playing with friends (vendor/peerjs.min.js); its own types are not shipped */
    Peer?: new (...args: any[]) => any;
    /** the checks: a pretend voice relay (TURN) and a pretend PeerJS server */
    SV_TURN_TEST?: any;
    SV_PEER?: { host: string, port: number, path: string, secure: boolean };
    /** the checks: the local MQTT brokers to use instead of the public ones (js/relay.ts BROKERS) */
    SV_MQTT?: string[];
    /** the game's switches from Studio, for js/launch.js's update notice (js/main.ts) */
    svFeatureOn?: (id: string, def?: boolean) => boolean;
    /** the start-up bar before the title (js/launch.js) */
    svLaunchProgress?: (value: number, total: number, label?: string) => void;
    /** the checks: speed up story films */
    __svFilmRate?: number;
    __svBot?: boolean;
    __svHelloTest?: boolean | string;
    /** older Safari */
    webkitAudioContext?: typeof AudioContext;
  }
  interface Performance { memory?: { usedJSHeapSize: number }; }
  interface Navigator {
    getBattery?: () => Promise<{ charging: boolean, level: number }>;
    /** Safari 17+: how the page's sound mixes with the phone (js/audio.ts setSession) */
    audioSession?: { type: string };
    /** iPhone: the game opened from the Home Screen */
    standalone?: boolean;
    /** how the device is connected (Wi-Fi or mobile data), where the browser says */
    connection?: { type?: string, effectiveType?: string, saveData?: boolean, downlink?: number, rtt?: number, addEventListener?(type: string, f: () => void): void };
    mozConnection?: Navigator['connection'];
    webkitConnection?: Navigator['connection'];
  }
}
