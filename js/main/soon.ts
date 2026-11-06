// (v1.08 startup, PERF-001) the valley parts js/main.ts makes first after the people (Asia's quarter, the hawkers, the
// suburbs, the traffic and the school), gathered in one module as js/main/later.ts is, so the packed copy fetches them
// as one piece instead of five
export * as asia from '../asia.js';
export * as hawkers from '../hawkers.js';
export * as suburbs from '../suburbs.js';
export * as traffic from '../traffic.js';
export * as school from '../school.js';
