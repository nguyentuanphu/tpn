// A device's tester level (v1.08 startup, PERF-001: split from js/content/tester.ts, which keeps the reports' kinds,
// limits and agreement and loads with the tester tools; the start needs only this, for the tester-only game previews).
// tester levels (Studio): auto reports only, or auto reports and the ladybird
export type TesterLevel = 'auto' | 'ladybird';
/** Studio's saved rule; old saves may lack fields or hold wrong kinds */
export type TesterRelease = { on?: unknown, devices?: unknown, levels?: Record<string, unknown> | null, peeks?: unknown };
const isLevel = (v: unknown): v is TesterLevel => v === 'auto' || v === 'ladybird';
export const LEVELS: TesterLevel[] = ['auto', 'ladybird'];
// the release rule for `tester` → this device's level, or '' when it is not a tester
//   rule: { on, devices: [ids], levels: { id: 'auto' | 'ladybird' }, peeks: [release ids] }
export function testerLevel(on: unknown, rule: TesterRelease | null | undefined, me: string): TesterLevel | '' {
  if (!on || !me) return '';
  const list = rule && Array.isArray(rule.devices) ? rule.devices.filter(d => typeof d === 'string') : [];
  if (list.length && !list.includes(me)) return '';
  const lv = rule && rule.levels && rule.levels[me];
  return isLevel(lv) ? lv : 'ladybird';
}
