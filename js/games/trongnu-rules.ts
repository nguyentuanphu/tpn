// A gentle virtual adaptation of Trồng Nụ Trồng Hoa: feet, then hand-buds, then a flower.
export const FLOWER_STACKS = [
  { en: 'One foot', vi: 'Một bàn chân', height: 28 },
  { en: 'Two feet', vi: 'Hai bàn chân', height: 46 },
  { en: 'A hand-bud', vi: 'Trồng nụ', height: 66 },
  { en: 'A flower', vi: 'Trồng hoa', height: 86 }
];
// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") the moment to jump narrows each level: Easy (tier 1)
// .30-.90, Medium .38-.83, Hard .47-.73, Talent (tier 4) .52-.68; and the stack is built faster (TRONGNU_CYCLE, ms)
const WINDOW: Record<number, [number, number]> = { 1: [.3, .9], 2: [.38, .83], 3: [.47, .73], 4: [.52, .68] };
export const TRONGNU_CYCLE = [3400, 3400, 3000, 2800, 2400];
export const trongNuReady = (phase: number, tier: number, calm: boolean) => {
  if (calm || tier <= 0) return true;
  const [lo, hi] = WINDOW[Math.min(4, Math.floor(tier))] || WINDOW[3];
  return Number.isFinite(phase) && phase >= lo && phase <= hi;
};
