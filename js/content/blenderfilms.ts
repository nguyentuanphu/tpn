// The Blender films' pages (made by tools/blender/make-film.mts; round v1.08c): for each film its version and, per page of
// the story, where the page starts and ends in the video (seconds) and the child's help moment (when the video stops, where
// the tap ring goes, in % of the picture, and what is asked). A film is listed here only once its video is in videos/films/ (copied to Netlify with videos/).
export type BlenderFilm = { v: string, pages: { s: number, e: number, help?: { t: number, x: number, y: number, en: string, vi: string } }[] };
// (6 Nov 2026 AEDT) rendered with Eevee on an RTX 3060 Ti, 1280x720, 12 frames a second made smooth at 24 (docs/cores/tasks/v108c/blender-films-gpu.md)
export const BLENDER_FILMS: Record<string, BlenderFilm> = {
  banhchung: { v: 'v1', pages: [
    { s: 0, e: 21.13 },
    { s: 21.13, e: 35.25 },
    { s: 35.25, e: 47.88, help: { t: 44.9, x: 57, y: 38, en: 'Tap to pick the big green leaves!', vi: 'Chạm để hái những chiếc lá dong to nhé!' } },
    { s: 47.88, e: 56.33, help: { t: 49.91, x: 50, y: 45, en: 'Tap to wrap the square cake!', vi: 'Chạm để gói bánh chưng vuông nào!' } },
    { s: 56.33, e: 79.88 }] },
  chucuoi: { v: 'v1', pages: [
    { s: 0, e: 13.88 },
    { s: 13.88, e: 19.67, help: { t: 17.84, x: 45, y: 48, en: 'Tap to give the leaf to the sick man!', vi: 'Chạm để đưa lá cho người ốm nào!' } },
    { s: 19.67, e: 30.88 },
    { s: 30.88, e: 37.92, help: { t: 36, x: 52, y: 53, en: 'Tap to help Cuội hold on!', vi: 'Chạm để giúp chú Cuội níu lấy rễ cây!' } },
    { s: 37.92, e: 45.62 },
    { s: 45.62, e: 58.17 }] },
  tamcam: { v: 'v1', pages: [
    { s: 0, e: 13.88 },
    { s: 13.88, e: 21.5, help: { t: 19.55, x: 46, y: 59, en: 'Tap to call Bống the fish!', vi: 'Chạm để gọi cá Bống nào!' } },
    { s: 21.5, e: 32.21 },
    { s: 32.21, e: 43.92 },
    { s: 43.92, e: 51.62, help: { t: 49.6, x: 56, y: 60, en: 'Tap to try the slipper on Tấm!', vi: 'Chạm để Tấm thử hài nào!' } },
    { s: 51.62, e: 66.92 }] },
  thanhgiong: { v: 'v1', pages: [
    { s: 0, e: 17.04 },
    { s: 17.04, e: 31.17 },
    { s: 31.17, e: 37.88, help: { t: 34.24, x: 50, y: 46, en: 'Tap to give him more rice!', vi: 'Chạm để đưa thêm cơm cho cậu bé!' } },
    { s: 37.88, e: 54.42 },
    { s: 54.42, e: 59.38, help: { t: 55.4, x: 44, y: 55, en: 'Tap the bamboo to pull it up!', vi: 'Chạm vào bụi tre để nhổ lên nào!' } },
    { s: 59.38, e: 79.25 }] },
  rainbowserpent: { v: 'v1', pages: [
    { s: 0, e: 16.13 },
    { s: 16.13, e: 21.58, help: { t: 19.76, x: 41, y: 43, en: 'Tap to wake the Rainbow Serpent!', vi: 'Chạm để đánh thức Rắn Cầu Vồng nào!' } },
    { s: 21.58, e: 29.88 },
    { s: 29.88, e: 35.42, help: { t: 33.59, x: 33, y: 60, en: 'Tap to call the rain!', vi: 'Chạm để gọi mưa về nào!' } },
    { s: 35.42, e: 43.96 },
    { s: 43.96, e: 58.5 }] },
};
