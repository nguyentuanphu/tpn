// (v1.08e nature, 6 Nov 2026 AEDT) The tiny part of the Blender nature models that is in the first download: the world's
// code marks a shape with the model that may replace it (natureModel), and the farm asks for a crop's model
// (natureGeo). js/world-nature.ts, loaded after the start, does the work; until then the marks wait here.
type Obj = { userData: Record<string, unknown> };
type Hook = { mark: (o: Obj, name: string) => void, geo: (name: string, at: { x: number, z: number }, ready: () => void) => unknown };
const waiting: [Obj, string][] = [], asks: [string, { x: number, z: number }, () => void][] = []; let hook: Hook = null;
/** mark a shape (a Mesh or an InstancedMesh, drawn with toonVC, its ground at y = 0) with the model that may replace it */
export function natureModel<T extends Obj>(o: T, name: string): T { o.userData.natureModel = name; if (hook) hook.mark(o, name); else waiting.push([o, name]); return o; }
/** a model's shape when it is here (null until then: draw the code shape); ready() is called once when it arrives */
export function natureGeo(name: string, at: { x: number, z: number }, ready: () => void): unknown { if (hook) return hook.geo(name, at, ready); if (asks.length < 40) asks.push([name, at, ready]); return null; }
export function setNatureHook(h: Hook) { hook = h; for (const [o, n] of waiting.splice(0)) h.mark(o, n); for (const [n, at, r] of asks.splice(0)) h.geo(n, at, r); }
