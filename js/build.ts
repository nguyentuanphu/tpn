// The version (owner, 24 Oct 2026 AEDT: v numbers everywhere, from r91 on): v, the major number, a point and two
// digits, v1.01, v1.02 ... v1.99; a big upgrade starts v2.00. Studio, bug reports, the servers and the checks count by it
// (netlify/lib/build-number.mts reads the old r numbers too: r90 was shown as v1). Keep it the same as the end of
// VERSION in sw.ts and studio/version.json (tests check this).
export const BUILD = 'v1.05';
// the number shown on the title screen, in Settings, Grown-ups, the tester mark and the website: the same now
export const SHOWN = BUILD;
