// The story pages drawn in Blender (round v1.08c, blender helper; made by tools/blender/storypage.py from the game film's
// own sets with the costume kit's people): for each tale its version and how many pages have a picture. The pictures are
// videos/storypages/<id>-<v>-p<k>.webp (960 x 540, about 60-100 KB each), loaded with the tale, never at start.
export const STORY_PICS: Record<string, { v: string, n: number }> = {};
