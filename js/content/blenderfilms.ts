// The Blender films' pages (made by tools/blender/make-film.mts; round v1.08c): for each film its version and, per page of
// the story, where the page starts and ends in the video (seconds) and the child's help moment (when the video stops, where
// the tap ring goes, in % of the picture, and what is asked). A film is listed here only once its video is in videos/films/ (copied to Netlify with videos/).
export type BlenderFilm = { v: string, pages: { s: number, e: number, help?: { t: number, x: number, y: number, en: string, vi: string } }[] };
export const BLENDER_FILMS: Record<string, BlenderFilm> = {};
