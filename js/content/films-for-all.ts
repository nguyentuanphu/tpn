// (v1.08f films, owner 6 Nov 2026 AEDT: "only 5 are visible to everyone and the rest available for testers with a Studio
// switch") the five Blender films every child sees, and the Studio switch of each Blender film. Small and on its own, so
// Studio's switch list (js/content/releases.ts, in the first download) never brings the films' page data
// (js/content/blenderfilms.ts) with it: Studio adds the switches of the other listed films itself (addFilmSwitches).
export const BLENDER_FOR_ALL = ['banhchung', 'chucuoi', 'tamcam', 'thanhgiong', 'rainbowserpent'];
// the titles of the five for their Studio switches (a film added later brings its own en / vi, or shows its id)
export const BLENDER_TITLES: Record<string, [string, string]> = {
  banhchung: ['Bánh Chưng Bánh Giầy', 'Bánh Chưng Bánh Giầy'], chucuoi: ['Chú Cuội', 'Chú Cuội'], tamcam: ['Tấm Cám', 'Tấm Cám'],
  thanhgiong: ['Thánh Gióng', 'Thánh Gióng'], rainbowserpent: ['The Rainbow Serpent', 'Rắn Cầu Vồng']
};
/** the "Blender film for everyone" switch of one film (on for the five, off for the rest) */
export function filmSwitch(id: string, f?: { en?: string, vi?: string }) {
  const t = BLENDER_TITLES[id] || [f?.en || id, f?.vi || f?.en || id];
  return { id: `blenderFilm_${id}`, en: `Blender film for everyone: ${t[0]}. Off: only testers see it (with "Blender films for testers"); everyone else sees the in-game film`, vi: `Phim Blender cho mọi người: ${t[1]}. Tắt: chỉ người thử xem được (khi bật "Phim Blender cho người thử"); mọi người khác xem phim trong game`, group: 'story', def: BLENDER_FOR_ALL.includes(id) };
}
