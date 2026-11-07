// The story pages drawn in Blender (round v1.08c): the picture of a page of a tale, shown on the picture stage of the tale
// theatre (js/tales.ts) when the tale is read without its film. Loaded only when such a tale opens; when it opens with the
// internet, the tale's pictures are kept on the device ("sv-story-pics"), so it reads with its pictures offline too.
import { STORY_PICS } from './content/storypics.js';

const STORE = 'sv-story-pics';
const urlOf = (id: string, k: number) => { const p = STORY_PICS[id]; return p && k < p.n ? new URL(`videos/storypages/${id}-${p.v}-p${k}.webp`, location.href).href : null; };
export const hasStoryPics = (id: string) => !!STORY_PICS[id];

/** keep every picture of a tale on the device (behind the story, once per version) */
export async function keepStoryPics(id: string) {
  const p = STORY_PICS[id]; if (!p || navigator.onLine === false) return;
  try { const c = await caches.open(STORE); for (let k = 0; k < p.n; k++) { const u = urlOf(id, k)!; if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } } catch (e) { }
}
/** the picture of page k: the kept copy, else the internet; null when there is none */
export async function storyPic(id: string, k: number): Promise<string | null> {
  const u = urlOf(id, k); if (!u) return null;
  try {
    const c = await caches.open(STORE), hit = await c.match(u); if (hit) return URL.createObjectURL(await hit.blob());
    if (navigator.onLine === false) return null;
    // from the internet, kept as it comes; a picture that does not come in 6 s is not waited for (the painted stage plays)
    const r = await Promise.race([fetch(u), new Promise<null>(res => setTimeout(() => res(null), 6000))]);
    if (!r || !r.ok) return null;
    const blob = await r.blob(); c.put(u, new Response(blob, { headers: { 'Content-Type': 'image/webp' } })).catch(() => { });
    return URL.createObjectURL(blob);
  } catch (e) { return null; }
}
