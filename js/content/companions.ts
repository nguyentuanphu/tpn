// The story's two companions (js/content/chapters.ts re-exports them). A small file of its own, so the Bag (js/ui.ts) can
// show them at start without loading the whole story (start-up download, PERF-001).
export const COMPANIONS = {
  firefly: { icon: '✨', en: 'Sparkle the firefly', vi: 'Đom đóm Lấp Lánh', name: 'Lấp Lánh' },
  dragon: { icon: '🐉', en: 'Little Dragon', vi: 'Rồng con', name: 'Rồng con' }
};
