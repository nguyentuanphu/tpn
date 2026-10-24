// The game's build numbers, in one place for the website server, Studio's tools and the checks (owner, 24 Oct 2026
// AEDT: "everything" uses v numbers from r91 on). Rounds were r1 to r90 (r89.1 was one point release); r90 was shown to
// families as v1 and counts as v1.00. From then on a build is v, the major number, a point and two digits: v1.01,
// v1.02 ... v1.99; a big upgrade starts v2.00. Older devices and reports still say r83, r89.1 and so on: they are
// understood and count as older than every v build.
export const BUILD_RE = /^(r\d{1,4}(\.\d{1,2})?|v\d{1,2}\.\d{2})$/;
export const isBuild = (b: unknown): b is string => typeof b === 'string' && BUILD_RE.test(b);
// a number that sorts builds: r83 → 83, r89.1 → 89.1, r90 (v1) → 1000, v1.01 → 1001, v2.00 → 2000; not a build → -1
export const buildRank = (b: unknown): number => {
  if (!isBuild(b)) return -1;
  if (b === 'r90') return 1000;
  if (b[0] === 'r') return +b.slice(1);
  const [major, minor] = b.slice(1).split('.');
  return 1000 * +major + +minor;
};
// the rank of the build before this one (v2.00 → anything from v1.00 on; v1.00 → r89.1 and r89)
export const rankBefore = (rank: number): number => rank >= 2000 && rank % 1000 === 0 ? rank - 1000 : rank === 1000 ? 89 : rank - 1;
