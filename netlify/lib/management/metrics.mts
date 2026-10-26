// Legacy aggregate metrics use named adapters and expose their actual denominators.
import { count, object } from './quality.mts';

export type ManagementMetric = { id: string; label: string; value: number | null; unit: string; status: 'observed' | 'estimated' | 'unavailable' | 'insufficient'; sampleCount: number; limitation: string };
export const metric = (id: string, label: string, value: number | null, unit: string, sampleCount: number, limitation: string): ManagementMetric => ({
  id, label, value: value != null && Number.isFinite(value) ? value : null, unit,
  status: value == null || !Number.isFinite(value) ? 'unavailable' : 'observed', sampleCount, limitation
});
export function sumValues(v: unknown) { return Object.values(object(v)).reduce<number>((n,v) => n + count(v),0); }
export const median = (input: number[]) => {
  const a = input.filter(Number.isFinite).sort((a,b)=>a-b); if (!a.length) return null;
  const i = Math.floor(a.length / 2); return a.length % 2 ? a[i] : (a[i-1] + a[i])/2;
};
export function performance(records: Record<string, any>[]) {
  const f = [0,0,0], b = Array(10).fill(0), starts: (number|string)[][] = [];
  for (const r of records) {
    if (Array.isArray(r.fps)) f.forEach((_,i)=>f[i]+=count(r.fps[i]));
    if (Array.isArray(r.bat) && r.bat.length === 10) b.forEach((_,i)=>b[i]+=count(r.bat[i]));
    for (const v of Array.isArray(r.starts) ? r.starts : []) if (Array.isArray(v) && v.length >= 4 && typeof v[2] === 'number' && Number.isFinite(v[2]) && v[2] >= 0) starts.push(v);
  }
  return {
    fps: f[1] ? f[0]/f[1] : null, fpsSamples: f[1], lowFpsSamples: f[2],
    startup: { n: starts.length, pictureMs: median(starts.map(s=>Number(s[2]))), warmPictureMs: median(starts.filter(s=>!!s[3]).map(s=>Number(s[2]))), coldPictureMs: median(starts.filter(s=>!s[3]).map(s=>Number(s[2]))) },
    power: { measuredMins: b[0], batteryMinutes: b[6], batteryLossPerHour: b[6] ? (b[7]/10)/(b[6]/60) : null, activeDrawingFps: b[9] ? b[1]/b[9] : null }
  };
}
export function legacyMetrics(records: Record<string, any>[], activeDevices: number, onlineDevices: number, newDevices: number) {
  const p = performance(records), mins = records.reduce((n,r)=>n+count(r.mins),0), tales = records.reduce((n,r)=>n+count(r.tales),0);
  return [
    metric('M01','Reporting active installations',activeDevices,'installations',activeDevices,'Reporting installations, not unique children or total audience.'),
    metric('M02','New observed installations',newDevices,'installations',newDevices,'First retained observed play date; storage resets and late reports can change identity.'),
    metric('M03','Currently reporting online',onlineDevices,'installations',onlineDevices,'Approximate presence within five minutes, not proof of active play.'),
    metric('M04','Reported play time',mins,'minutes',activeDevices,'Existing active-play hooks and opted-in reporting installations only.'),
    metric('M07','Story opens',tales,'opens',activeDevices,'Opening a story does not demonstrate completion.'),
    metric('M08','Sampled FPS',p.fps,'FPS',p.fpsSamples,'Weighted by reported samples; unavailable when no samples exist.'),
    metric('M09','Low-FPS sample proportion',p.fpsSamples ? p.lowFpsSamples/p.fpsSamples : null,'ratio',p.fpsSamples,'Samples below the current 20 FPS threshold.'),
    metric('M10','First-picture median',p.startup.pictureMs,'milliseconds',p.startup.n,'Capped reported samples; not population p95. Cold and warm detail remains separate.'),
    metric('M11','Measured active drawing FPS',p.power.activeDrawingFps,'FPS',p.power.measuredMins,'Uses reported active frames and seconds, excluding idle frames.'),
    metric('M12','Battery loss per measured hour',p.power.batteryLossPerHour,'percentage points/hour',p.power.batteryMinutes,'Unavailable without measured battery minutes; not watts or total energy.'),
    metric('M18','Observed D7 return',null,'ratio',0,'Requires a matured cohort and exact event measurement; unavailable from this adapter.'),
    metric('M19','Exact attempt completion',null,'ratio',0,'Legacy profile participations cannot reconstruct exact activity attempts.'),
    metric('M20','Reportable boot readiness',null,'ratio',0,'No complete reportable boot-start denominator exists in legacy records.'),
    metric('M21','First playable time p95',null,'milliseconds',0,'Requires comparable boot-attempt instrumentation; retained legacy startup samples are capped.'),
    metric('M24','Applied configuration coverage',null,'ratio',0,'A saved/published setting is not a device application receipt.')
  ];
}
