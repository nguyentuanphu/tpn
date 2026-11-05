// The Blender films' pages (made by tools/blender/make-film.mts; round v1.08c): for each film its version and, per page of
// the story, where the page starts and ends in the video (seconds) and the child's help moment (when the video stops, where
// the tap ring goes, in % of the picture, and what is asked). A film is listed here only once its video is in videos/films/ (copied to Netlify with videos/).
// (v1.08f films) optional: bytes, the video's size (for the "Download all films" card's total; about 3 MB is assumed
// without it), and en / vi, the story's title for its Studio switch (the id is shown without it).
export type BlenderFilm = { v: string, bytes?: number, en?: string, vi?: string, pages: { s: number, e: number, help?: { t: number, x: number, y: number, en: string, vi: string } }[] };
export const BLENDER_FILMS: Record<string, BlenderFilm> = {};
// (v1.08f films) the five for everyone and each film's Studio switch: js/content/films-for-all.ts. Every other listed film
// plays only on a tester device while Studio's "Blender films for testers" is on (js/blenderfilm.ts filmOpen), until the
// owner turns its own "Blender film for everyone" switch on.
export { BLENDER_FOR_ALL, BLENDER_TITLES } from './films-for-all.js';
// the size assumed for a film whose size is not listed (720p, about a minute)
export const FILM_BYTES_GUESS = 3 * 1048576;
export const filmBytes = (id: string) => { const f = BLENDER_FILMS[id]; return f && f.bytes > 0 ? f.bytes : FILM_BYTES_GUESS; };
