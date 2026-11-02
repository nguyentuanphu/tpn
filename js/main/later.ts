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
export * as passport from '../passport.js';
export * as festivals from '../festivals.js';
export * as weather from '../weather.js';
export * as fun from '../fun.js';
export * as learn from '../learn.js';
export * as showcase from '../showcase.js';
export * as trade from '../trade.js';
export * as folkShow from '../folkshow.js';
export * as signposts from '../signposts.js';
export * as secrets from '../secrets.js';
