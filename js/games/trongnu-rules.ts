// A gentle virtual adaptation of Trồng Nụ Trồng Hoa: feet, then hand-buds, then a flower.
export const FLOWER_STACKS = [
  { en: 'One foot', vi: 'Một bàn chân', height: 28 },
  { en: 'Two feet', vi: 'Hai bàn chân', height: 46 },
  { en: 'A hand-bud', vi: 'Trồng nụ', height: 66 },
  { en: 'A flower', vi: 'Trồng hoa', height: 86 }
];
export const trongNuReady = (phase: number, tier: number, calm: boolean) => calm || tier <= 0 || Number.isFinite(phase) && phase >= (tier >= 3 ? .47 : .38) && phase <= (tier >= 3 ? .73 : .83);
