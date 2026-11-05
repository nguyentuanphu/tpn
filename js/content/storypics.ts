// The story pages drawn in Blender (round v1.08c, blender helper; made by tools/blender/storypage.py from the game film's
// own sets with the costume kit's people): for each tale its version and how many pages have a picture. The pictures are
// videos/storypages/<id>-<v>-p<k>.webp (1280 x 720, at most 100 KB each), loaded with the tale, never at start.
export const STORY_PICS: Record<string, { v: string, n: number }> = {
  duahau: { v: 'v1', n: 6 },
  thanhgiong: { v: 'v1', n: 6 },
  banhchung: { v: 'v1', n: 5 },
  caykhe: { v: 'v1', n: 6 },
  hoguom: { v: 'v1', n: 6 },
  rongtien: { v: 'v1', n: 6 },
  caytre: { v: 'v1', n: 6 },
  tamcam: { v: 'v1', n: 6 },
  sodua: { v: 'v1', n: 6 },
  thachsanh: { v: 'v1', n: 6 },
  chucuoi: { v: 'v1', n: 6 },
  cockien: { v: 'v1', n: 6 },
  vusua: { v: 'v1', n: 6 },
  baluoiriu: { v: 'v1', n: 6 },
  quabau: { v: 'v1', n: 6 },
  thayboi: { v: 'v1', n: 6 },
  nhacmeo: { v: 'v1', n: 6 },
  ongtao: { v: 'v1', n: 6 },
  cachep: { v: 'v1', n: 6 },
  sontinh: { v: 'v1', n: 4 },
};
