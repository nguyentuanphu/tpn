// (v1.07, PERF-001) the valley parts js/main.ts makes after the first ones, gathered in one module so the packed copy
// fetches them as one piece instead of eighteen (each piece costs its own request and compresses less well on its own)
export * as heritage from '../heritage.js';
export * as symbols from '../symbols.js';
export * as regionSites from '../regionsites.js';
export * as vnFun from '../vnfun.js';
export * as myHouse from '../myhouse.js';
export * as lotus from '../lotus.js';
export * as pets from '../pets.js';
export * as ferry from '../ferry.js';
// (v1.08 start-up MB, PERF-001) the parts from the passport on are their own piece (js/main/last.ts), fetched when the
// build comes to them; trading, mystery boxes and the friends' quests are made after the start
// (js/main.ts afterPlay), each loaded then on its own
