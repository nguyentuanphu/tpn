// The Blender films' pages (made by tools/blender/make-film.mts; round v1.08c): for each film its version and, per page of
// the story, where the page starts and ends in the video (seconds) and the child's help moment (when the video stops, where
// the tap ring goes, in % of the picture, and what is asked). A film is listed here only once its video is in videos/films/ (copied to Netlify with videos/).
// (v1.08f films) optional: bytes, the video's size (for the "Download all films" card's total; about 3 MB is assumed
// without it), and en / vi, the story's title for its Studio switch (the id is shown without it).
export type BlenderFilm = { v: string, bytes?: number, en?: string, vi?: string, pages: { s: number, e: number, help?: { t: number, x: number, y: number, en: string, vi: string } }[] };
export const BLENDER_FILMS: Record<string, BlenderFilm> = {};
// (v1.08f films, owner 6 Nov 2026 AEDT: "only 5 are visible to everyone and the rest available for testers with a Studio
// switch") the five films every child sees once listed above; every other listed film plays only on a tester device while
// Studio's "Blender films for testers" is on. Each listed film also has its own Studio switch, "Blender film for everyone"
// (js/content/releases.ts, blenderFilm_<id>: on for these five, off for the rest), so the owner can open the others to
// everyone one by one with no code change.
export const BLENDER_FOR_ALL = ['banhchung', 'chucuoi', 'tamcam', 'thanhgiong', 'rainbowserpent'];
// the titles of the five for their Studio switches (a film added later brings its own en / vi, or shows its id)
export const BLENDER_TITLES: Record<string, [string, string]> = {
  banhchung: ['Bánh Chưng Bánh Giầy', 'Bánh Chưng Bánh Giầy'], chucuoi: ['Chú Cuội', 'Chú Cuội'], tamcam: ['Tấm Cám', 'Tấm Cám'],
  thanhgiong: ['Thánh Gióng', 'Thánh Gióng'], rainbowserpent: ['The Rainbow Serpent', 'Rắn Cầu Vồng']
};
// the size assumed for a film whose size is not listed (720p, about a minute)
export const FILM_BYTES_GUESS = 3 * 1048576;
export const filmBytes = (id: string) => { const f = BLENDER_FILMS[id]; return f && f.bytes > 0 ? f.bytes : FILM_BYTES_GUESS; };
